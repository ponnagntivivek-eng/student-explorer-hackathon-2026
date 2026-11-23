/**
 * Free place discovery: OpenStreetMap (Nominatim + Overpass), Wikipedia and Wikimedia Commons.
 * Server-only. No API keys.
 *
 * Photo safety rules (see findPhotos):
 *   - an image is only used if it is VERIFIED to belong to the place
 *     (title / category / geotag checks) — otherwise we return nothing
 *   - only images hosted on Wikimedia Commons with a known free licence are returned
 *   - author, licence and source page are always returned so they can be shown
 */
import { DEFAULT_BIAS, DEFAULT_CITY, biasViewbox, inCoverage, withCityContext } from "./region.ts";
import { TtlCache, UpstreamError, politeJson } from "./http.server.ts";
import { mapOsmTagsToCategory, guessCategoryFromName, type CategoryGuess, type OsmTags } from "./categories.ts";
import { googleEnabled, googleFindPlace, googleGeocode } from "../explorer/google.server.ts";

// ---------------------------------------------------------------- small helpers

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const STOP = new Set(["the", "of", "and", "in", "at", "a", "an", "near", "by", "de", "la"]);
const GENERIC = new Set(["bengaluru", "bangalore", "karnataka", "india", "city", "main", "road"]);

export function tokens(s: string, dropGeneric = true): string[] {
  const out = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 1 && !STOP.has(t) && (!dropGeneric || !GENERIC.has(t)))
    .map((t) => (t === "bangalore" ? "bengaluru" : t))
    .map((t) => (t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t));
  return [...new Set(out)];
}

/** Share of `needle` tokens that appear in `hay` (0..1). */
export function coverage(needle: string[], hay: string[]): number {
  if (!needle.length) return 0;
  const set = new Set(hay);
  return needle.filter((t) => set.has(t)).length / needle.length;
}

/** How alike two names are (0..1). */
export function nameSimilarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.length || !tb.length) return 0;
  const inter = ta.filter((t) => tb.includes(t)).length;
  const dice = (2 * inter) / (ta.length + tb.length);
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const contained = coverage(short, long) === 1 ? (short.length >= 2 ? 0.85 : 0.7) : 0;
  return Math.max(dice, contained);
}

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const round = (n: number, d = 5) => Math.round(n * 10 ** d) / 10 ** d;

// ---------------------------------------------------------------- OpenStreetMap

export type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  tags: OsmTags;
  lat: number;
  lng: number;
};

const OVERPASS_URLS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const overpassCache = new TtlCache<OsmElement[]>(30 * 60_000, 300);

async function overpass(query: string): Promise<OsmElement[]> {
  let lastErr: unknown;
  for (const url of OVERPASS_URLS) {
    try {
      const data = await politeJson<{ elements?: any[] }>(url, {
        lane: "overpass",
        gapMs: 1500,
        timeoutMs: 20_000,
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const out: OsmElement[] = [];
      for (const e of data.elements ?? []) {
        const lat = e.lat ?? e.center?.lat;
        const lng = e.lon ?? e.center?.lon;
        if (!e.tags || typeof lat !== "number" || typeof lng !== "number") continue;
        out.push({ type: e.type, id: e.id, tags: e.tags, lat, lng });
      }
      return out;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new UpstreamError("Overpass unavailable");
}

/** Named, "interesting" OSM features around a point. */
export async function overpassNearby(lat: number, lng: number, radiusM: number): Promise<OsmElement[]> {
  const r = Math.min(2000, Math.max(50, Math.round(radiusM)));
  const key = `${lat.toFixed(4)},${lng.toFixed(4)},${r}`;
  return overpassCache.wrap(key, () => {
    const a = `(around:${r},${lat},${lng})`;
    const q = `[out:json][timeout:15];(
nwr${a}["name"]["tourism"];
nwr${a}["name"]["historic"];
nwr${a}["name"]["leisure"~"^(park|garden|nature_reserve|beach_resort|water_park|amusement_arcade|bowling_alley|stadium)$"];
nwr${a}["name"]["natural"~"^(waterfall|beach|peak|water|wood|cave_entrance|hot_spring)$"];
nwr${a}["name"]["waterway"="waterfall"];
nwr${a}["name"]["amenity"~"^(place_of_worship|restaurant|cafe|fast_food|food_court|university|college|library|cinema|theatre|marketplace|nightclub|arts_centre|planetarium)$"];
nwr${a}["name"]["shop"~"^(mall|department_store|supermarket)$"];
);out tags center 80;`;
    return overpass(q);
  });
}

/** Any named OSM feature (shops, stalls, cafes...) around a point whose name contains the longest word of `name`. */
export async function overpassNamed(lat: number, lng: number, radiusM: number, name: string): Promise<OsmElement[]> {
  const words = tokens(name, true).sort((a, b) => b.length - a.length);
  const word = words.find((w) => w.length >= 3) ?? words[0];
  if (!word) return [];
  const r = Math.min(12_000, Math.max(200, Math.round(radiusM)));
  const key = `named:${word}:${lat.toFixed(3)},${lng.toFixed(3)},${r}`;
  return overpassCache.wrap(key, () => {
    const a = `(around:${r},${lat},${lng})`;
    const rx = word.replace(/[^a-z0-9]/g, "");
    const q = `[out:json][timeout:20];(nwr${a}["name"~"${rx}",i];nwr${a}["name:en"~"${rx}",i];);out tags center 60;`;
    return overpass(q);
  });
}

/** The OSM feature (small shop, stall, cafe...) that best matches `name` around a point, widening the search. */
export async function findNamedNear(name: string, lat: number, lng: number, radii: number[]): Promise<OsmElement | null> {
  for (const radius of radii) {
    try {
      const els = await overpassNamed(lat, lng, radius, name);
      let best: OsmElement | null = null;
      let bestScore = 0;
      for (const e of els) {
        const sim = Math.max(nameSimilarity(name, e.tags.name ?? ""), nameSimilarity(name, e.tags["name:en"] ?? ""));
        const score = sim - Math.min(0.2, haversineKm(lat, lng, e.lat, e.lng) / 50);
        if (sim >= 0.6 && score > bestScore) {
          best = e;
          bestScore = score;
        }
      }
      if (best) return best;
    } catch {
      /* try the next radius */
    }
  }
  return null;
}

const byIdCache = new TtlCache<OsmElement | null>(6 * 3600_000, 500);

export async function overpassById(type: "node" | "way" | "relation", id: number): Promise<OsmElement | null> {
  return byIdCache.wrap(`${type}/${id}`, async () => {
    const els = await overpass(`[out:json][timeout:10];${type}(${id});out tags center;`);
    return els[0] ?? null;
  });
}

type NominatimRow = {
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  class?: string;
  type?: string;
  extratags?: Record<string, string> | null;
  address?: Record<string, string>;
};

const nominatimCache = new TtlCache<NominatimRow[]>(6 * 3600_000, 500);
const reverseCache = new TtlCache<NominatimRow | null>(24 * 3600_000, 800);

const photonCache = new TtlCache<NominatimRow[]>(6 * 3600_000, 500);

/** Bengaluru centre: used to bias searches and to throw out matches in other cities. */
export const BLR = DEFAULT_BIAS;

/** Kept under its old name; it now means "inside the configured coverage" (all of India by default), not just Bengaluru. */
export const inBlrMetro = inCoverage;

/** Photon is a second free OSM geocoder, useful for local names missing from Nominatim. */
async function photonSearch(q: string): Promise<NominatimRow[]> {
  return photonCache.wrap(q.toLowerCase(), async () => {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en&lat=${BLR.lat}&lon=${BLR.lng}&location_bias_scale=0.5`;
    const data = await politeJson<{ features?: Array<{ properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } }> }>(
      url, { lane: "photon", gapMs: 150, timeoutMs: 6500 },
    );
    return (data.features ?? []).flatMap((feature) => {
      const props = feature.properties ?? {};
      const coords = feature.geometry?.coordinates ?? [];
      const lat = Number(coords[1]);
      const lon = Number(coords[0]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
      const name = String(props.name ?? props.street ?? props.city ?? "");
      const address = [props.housenumber, props.street, props.district, props.city, props.state, props.postcode, props.country]
        .filter((value) => typeof value === "string" && value.trim()).join(", ");
      return [{
        osm_type: osmType(String(props.osm_type ?? "")) ?? undefined,
        osm_id: Number.isFinite(Number(props.osm_id)) ? Number(props.osm_id) : undefined,
        lat: String(lat), lon: String(lon), name, display_name: address,
        class: typeof props.osm_key === "string" ? props.osm_key : undefined,
        type: typeof props.osm_value === "string" ? props.osm_value : undefined,
        extratags: null,
        address: { city: String(props.city ?? props.district ?? ""), state: String(props.state ?? ""), country: String(props.country ?? "") },
      }];
    });
  });
}

async function nominatimSearch(q: string): Promise<NominatimRow[]> {
  const cc = (typeof process !== "undefined" && process.env.PLACES_COUNTRY_CODES) || "in";
  // Ranking bias only (see places/region.ts); results anywhere in the configured coverage are allowed.
  const qBlr = withCityContext(q);
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&extratags=1" +
    (cc ? `&countrycodes=${encodeURIComponent(cc)}` : "") +
    `&viewbox=${biasViewbox()}&bounded=0` +
    `&q=${encodeURIComponent(qBlr)}`;
  const [primary, secondary] = await Promise.allSettled([
    nominatimCache.wrap(qBlr.toLowerCase(), () => politeJson<NominatimRow[]>(url, { lane: "nominatim", gapMs: 1100 })),
    photonSearch(qBlr),
  ]);
  const rows = [
    ...(primary.status === "fulfilled" ? primary.value : []),
    ...(secondary.status === "fulfilled" ? secondary.value : []),
  ].filter((row) => {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    return inCoverage(lat, lng);
  });
  if (!rows.length) {
    const reason = primary.status === "rejected" ? primary.reason : secondary.status === "rejected" ? secondary.reason : null;
    if (reason instanceof Error) throw reason;
  }
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.osm_type ?? "?"}/${row.osm_id ?? "?"}/${Number(row.lat).toFixed(4)}/${Number(row.lon).toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function nominatimReverse(lat: number, lng: number): Promise<NominatimRow | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&extratags=1&zoom=18&lat=${lat}&lon=${lng}`;
  return reverseCache.wrap(`${lat.toFixed(4)},${lng.toFixed(4)}`, async () => {
    const row = await politeJson<NominatimRow & { error?: string }>(url, { lane: "nominatim", gapMs: 1100 });
    return row && !row.error ? row : null;
  });
}

const osmType = (t?: string): "node" | "way" | "relation" | null =>
  t === "node" || t === "way" || t === "relation" ? t : t === "N" ? "node" : t === "W" ? "way" : t === "R" ? "relation" : null;

function addressFromTags(tags: OsmTags): string {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:suburb"] || tags["addr:neighbourhood"],
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);
  return parts.join(", ");
}



type WikidataPlace = { id: string; label: string; description?: string; lat?: number; lng?: number; wikipediaTitle?: string };
const wikidataCache = new TtlCache<WikidataPlace | null>(7 * 24 * 3600_000, 500);

/** Look up a conservatively name-matched Wikidata item and its coordinates/article link. */
async function lookupWikidata(name: string): Promise<WikidataPlace | null> {
  return wikidataCache.wrap(name.toLowerCase(), async () => {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&limit=6`;
    const search = await politeJson<{ search?: Array<{ id: string; label?: string; description?: string }> }>(
      searchUrl, { lane: "wikidata", gapMs: 250, timeoutMs: 6500 },
    );
    const candidate = (search.search ?? [])
      .map((item) => ({ item, score: nameSimilarity(name, item.label ?? "") }))
      .filter((item) => item.score >= 0.75)
      .sort((a, b) => b.score - a.score)[0]?.item;
    if (!candidate?.id) return null;
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(candidate.id)}&props=claims|sitelinks&languages=en&format=json`;
    const entities = await politeJson<{ entities?: Record<string, { claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>>; sitelinks?: { enwiki?: { title?: string } } }> }>(
      entityUrl, { lane: "wikidata", gapMs: 250, timeoutMs: 6500 },
    );
    const entity = entities.entities?.[candidate.id];
    const raw = entity?.claims?.P625?.[0]?.mainsnak?.datavalue?.value as { latitude?: number; longitude?: number } | undefined;
    return {
      id: candidate.id,
      label: candidate.label ?? name,
      description: candidate.description,
      lat: Number.isFinite(raw?.latitude) ? raw!.latitude : undefined,
      lng: Number.isFinite(raw?.longitude) ? raw!.longitude : undefined,
      wikipediaTitle: entity?.sitelinks?.enwiki?.title,
    };
  });
}

// ---------------------------------------------------------------- Wikipedia + Commons photos

export type PhotoCandidate = {
  /** Image URL to display (a ~1000px thumbnail hosted by Wikimedia). */
  url: string;
  source: "wikipedia" | "commons" | "google";
  /** Commons file page (shows author + licence). */
  sourcePageUrl: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  /** 0..1 – how sure we are that the photo shows this place. */
  relevance: number;
  reason: string;
  /** Wikimedia upload time, not necessarily the date the photograph was taken. */
  uploadedAt?: string;
  width?: number;
  height?: number;
};

const photoRegistry = new TtlCache<PhotoCandidate>(7 * 24 * 3600_000, 3000);

/** Used when saving a place: the server only trusts credits it produced itself. */
export function lookupPhotoByUrl(url: string): PhotoCandidate | undefined {
  return photoRegistry.get(url);
}

type WikiPage = {
  title: string;
  fullurl?: string;
  extract?: string;
  pageimage?: string;
  pageprops?: { disambiguation?: string };
  coordinates?: { lat: number; lon: number }[];
  missing?: boolean;
  imageinfo?: any[];
};

const wikiCache = new TtlCache<WikiPage[]>(7 * 24 * 3600_000, 600);
const commonsCache = new TtlCache<WikiPage[]>(7 * 24 * 3600_000, 800);

const WIKI_PROPS =
  "&prop=pageimages|coordinates|pageprops|extracts|info&piprop=name&exintro=1&explaintext=1&exsentences=3&exlimit=max&colimit=max&inprop=url&ppprop=disambiguation&redirects=1";

async function wikipediaSearch(query: string, refresh = false): Promise<WikiPage[]> {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=4&gsrsearch=" +
    encodeURIComponent(query) +
    WIKI_PROPS;
  const key = "s:" + query.toLowerCase() + (refresh ? `:refresh:${Date.now()}` : "");
  return wikiCache.wrap(key, async () => {
    const d = await politeJson<{ query?: { pages?: Record<string, WikiPage> } }>(url, { lane: "wikipedia", gapMs: 250 });
    return Object.values(d.query?.pages ?? {});
  });
}

async function wikipediaTitle(title: string, refresh = false): Promise<WikiPage[]> {
  const url = "https://en.wikipedia.org/w/api.php?action=query&format=json&titles=" + encodeURIComponent(title) + WIKI_PROPS;
  const key = "t:" + title.toLowerCase() + (refresh ? `:refresh:${Date.now()}` : "");
  return wikiCache.wrap(key, async () => {
    const d = await politeJson<{ query?: { pages?: Record<string, WikiPage> } }>(url, { lane: "wikipedia", gapMs: 250 });
    return Object.values(d.query?.pages ?? {}).filter((p) => !p.missing);
  });
}

const COMMONS_INFO =
  "&prop=imageinfo|coordinates&colimit=max&iiprop=url|size|mime|extmetadata&iiurlwidth=1000" +
  "&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|ImageDescription|Categories|NonFree|UsageTerms";

async function commonsRequest(key: string, params: string, refresh = false): Promise<WikiPage[]> {
  const cacheKey = key + (refresh ? `:refresh:${Date.now()}` : "");
  return commonsCache.wrap(cacheKey, async () => {
    const d = await politeJson<{ query?: { pages?: Record<string, WikiPage> } }>(
      "https://commons.wikimedia.org/w/api.php?action=query&format=json" + params + COMMONS_INFO,
      { lane: "commons", gapMs: 250 },
    );
    return Object.values(d.query?.pages ?? {});
  });
}

const commonsSearch = (q: string, refresh = false) =>
  commonsRequest("s:" + q.toLowerCase(), `&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}`, refresh);
const commonsGeo = (lat: number, lng: number, refresh = false) =>
  commonsRequest(`g:${lat.toFixed(3)},${lng.toFixed(3)}`, `&generator=geosearch&ggsnamespace=6&ggsradius=800&ggslimit=20&ggscoord=${lat}|${lng}`, refresh);
const commonsFile = (fileName: string, refresh = false) => commonsRequest("f:" + fileName, `&titles=${encodeURIComponent("File:" + fileName)}`, refresh);

const BAD_TITLE = /\b(logo|icon|map|flag|coat of arms|diagram|poster|banner|stamp|signature|seal|screenshot|locator|location|plan|brochure|advert|certificate|signboard)\b/i;
const GOOD_EXT = /\.(jpe?g|png|webp)$/i;

type PhotoContext = {
  name: string;
  lat?: number;
  lng?: number;
  /** Words from the address/area, used to make sure a photo is from the right city. */
  contextTokens: string[];
};

/** Turn one Commons file page into a candidate, or null if it is not clearly this place / not free. */
export function verifyCommonsFile(page: WikiPage, ctx: PhotoContext, trustedByArticle = false): PhotoCandidate | null {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const rawTitle = page.title.replace(/^File:/i, "");
  if (!GOOD_EXT.test(rawTitle) || BAD_TITLE.test(rawTitle)) return null;
  if (info.mime && !/^image\/(jpeg|png|webp)$/.test(info.mime)) return null;
  if ((info.width ?? 0) < 600) return null;

  const meta = info.extmetadata ?? {};
  const val = (k: string) => (meta[k]?.value ? stripHtml(String(meta[k].value)) : "");
  const license = val("LicenseShortName");
  if (!license) return null;
  if (String(meta.NonFree?.value).toLowerCase() === "true" || /fair use|non-?free|all rights reserved|\bnc\b|\bnd\b/i.test(license)) return null;

  const thumb: string | undefined = info.thumburl || info.url;
  if (!thumb || !thumb.startsWith("https://upload.wikimedia.org/")) return null;

  const author = val("Artist") || "Unknown author";
  const cats = val("Categories").replace(/\|/g, " ");
  const desc = val("ImageDescription");
  const titleText = rawTitle.replace(/\.[a-z]+$/i, "");
  const nameToks = tokens(ctx.name);
  if (!nameToks.length) return null;

  const titleToks = tokens(titleText);
  const allToks = tokens(`${titleText} ${cats} ${desc}`);
  const titleCov = coverage(nameToks, titleToks);
  const metaCov = coverage(nameToks, allToks);

  const coord = page.coordinates?.[0];
  let relevance = 0;
  let reason = "";

  if (trustedByArticle) {
    relevance = 0.9;
    reason = "Lead image of the matching Wikipedia article";
  } else if (coord && ctx.lat !== undefined && ctx.lng !== undefined) {
    const d = haversineKm(ctx.lat, ctx.lng, coord.lat, coord.lon);
    if (d > 3) return null;
    if (titleCov >= 0.75) {
      relevance = 0.9;
      reason = `File name matches and it is geotagged ${Math.round(d * 1000)} m away`;
    } else if (d <= 1 && metaCov >= 0.5) {
      relevance = 0.75;
      reason = `Geotagged ${Math.round(d * 1000)} m away and its description mentions the place`;
    } else return null;
  } else {
    // No geotag to prove where it is: demand a strong name match AND the right city/area.
    if (titleCov < 0.75) return null;
    const ctxOk = (ctx.contextTokens.length > 0 && coverage(ctx.contextTokens, allToks) > 0) || allToks.includes("bengaluru") || allToks.includes("karnataka");
    if (!ctxOk) return null;
    relevance = 0.75;
    reason = "File name matches the place and mentions the same area";
  }

  return {
    url: thumb,
    source: "commons",
    sourcePageUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
    title: titleText,
    author,
    license,
    licenseUrl: val("LicenseUrl"),
    relevance,
    reason,
    uploadedAt: typeof info.timestamp === "string" ? info.timestamp : undefined,
    width: typeof info.width === "number" ? info.width : undefined,
    height: typeof info.height === "number" ? info.height : undefined,
  };
}

/** Is this Wikipedia article really about the place? */
export function verifyWikiArticle(page: WikiPage, ctx: PhotoContext): { ok: boolean; score: number } {
  if (page.missing || page.pageprops?.disambiguation !== undefined) return { ok: false, score: 0 };
  const title = page.title.replace(/\s*\(.*?\)\s*/g, " ");
  const sim = nameSimilarity(ctx.name, title);
  const c = page.coordinates?.[0];
  if (c && ctx.lat !== undefined && ctx.lng !== undefined) {
    const d = haversineKm(ctx.lat, ctx.lng, c.lat, c.lon);
    return { ok: sim >= 0.6 && d <= 8, score: sim };
  }
  if (sim >= 0.8) return { ok: true, score: sim };
  // Brand-style names ("Wonderla" vs the article "Wonderla Holidays"): the main word of the name is in the
  // title AND the article text is about Bengaluru/Karnataka, so it is the right place and not a namesake.
  const brand = tokens(ctx.name, true).sort((a, b) => b.length - a.length)[0];
  const pageText = `${page.extract ?? ""} ${page.title}`.toLowerCase();
  const aboutCity = /bengaluru|bangalore|karnataka/i.test(pageText) || ctx.contextTokens.some((t) => pageText.includes(t));
  if (brand && brand.length >= 5 && tokens(title).includes(brand) && aboutCity) return { ok: true, score: Math.max(sim, 0.7) };
  return { ok: false, score: sim };
}

export type PhotoSearchInput = {
  name: string;
  lat?: number;
  lng?: number;
  area?: string;
  /** OSM `wikipedia` tag, e.g. "en:Cubbon Park" */
  wikipediaTag?: string;
};

export type PhotoSearchResult = {
  candidates: PhotoCandidate[];
  article?: { title: string; url: string; extract: string };
  warnings: string[];
};

export async function findPhotos(input: PhotoSearchInput, refresh = false): Promise<PhotoSearchResult> {
  const warnings: string[] = [];
  const name = input.name.trim();
  const ctx: PhotoContext = {
    name,
    lat: input.lat,
    lng: input.lng,
    contextTokens: tokens(input.area ?? "", false).filter((t) => !/^\d+$/.test(t) && t.length > 2),
  };
  const found = new Map<string, PhotoCandidate>();
  const add = (candidate: PhotoCandidate | null) => {
    if (!candidate) return;
    const previous = found.get(candidate.url);
    if (!previous || previous.relevance < candidate.relevance) found.set(candidate.url, candidate);
  };

  // Independent providers run concurrently; one slow provider cannot block the others.
  const city = (input.area ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(-1)[0] || DEFAULT_CITY;
  const wikiQuery = `${name} ${city}`.trim();
  const wikiTask = (async () => {
    let pages: WikiPage[] = [];
    let trusted = false;
    const tag = input.wikipediaTag?.match(/^en:(.+)$/i);
    if (tag) {
      pages = await wikipediaTitle(tag[1], refresh);
      trusted = pages.length > 0;
    }
    if (!pages.length) {
      pages = await wikipediaSearch(wikiQuery, refresh);
      if (!pages.some((page) => verifyWikiArticle(page, ctx).ok) && wikiQuery !== name) pages = await wikipediaSearch(name, refresh);
    }
    const good = pages
      .map((page) => ({ page, verification: verifyWikiArticle(page, ctx) }))
      .filter((item) => trusted || item.verification.ok)
      .sort((a, b) => b.verification.score - a.verification.score)[0];
    if (!good) return;
    const articleUrl = good.page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(good.page.title.replace(/ /g, "_"))}`;
    const article = { title: good.page.title, url: articleUrl, extract: (good.page.extract ?? "").trim() };
    let leadPhotos: PhotoCandidate[] = [];
    if (good.page.pageimage) {
      const files = await commonsFile(good.page.pageimage, refresh);
      leadPhotos = files.map((file) => verifyCommonsFile(file, ctx, true))
        .filter((photo): photo is PhotoCandidate => Boolean(photo))
        .map((photo) => ({ ...photo, source: "wikipedia", reason: `Lead image of the matching Wikipedia article “${good.page.title}”` }));
    }
    return { article, leadPhotos };
  })();

  const commonsTasks: Promise<PhotoCandidate[]>[] = [];
  if (ctx.lat !== undefined && ctx.lng !== undefined) {
    commonsTasks.push(commonsGeo(ctx.lat, ctx.lng, refresh).then((files) => files.map((file) => verifyCommonsFile(file, ctx)).filter((p): p is PhotoCandidate => Boolean(p))));
  }
  for (const q of [...new Set([city ? `${name} ${city}` : "", name].filter(Boolean))]) {
    commonsTasks.push(commonsSearch(q, refresh).then((files) => files.map((file) => verifyCommonsFile(file, ctx)).filter((p): p is PhotoCandidate => Boolean(p))));
  }

  const [wikiResult, ...commonsResults] = await Promise.allSettled([wikiTask, ...commonsTasks]);
  let article: PhotoSearchResult["article"];
  if (wikiResult.status === "fulfilled" && wikiResult.value) {
    article = wikiResult.value.article;
    wikiResult.value.leadPhotos.forEach(add);
  } else if (wikiResult.status === "rejected") {
    warnings.push(wikiResult.reason instanceof Error ? wikiResult.reason.message : "Wikipedia lookup failed");
  }
  for (const result of commonsResults) {
    if (result.status === "fulfilled") result.value.forEach(add);
    else warnings.push(result.reason instanceof Error ? result.reason.message : "Wikimedia Commons lookup failed");
  }

  const candidates = [...found.values()]
    .sort((a, b) => b.relevance - a.relevance || (a.source === "wikipedia" ? -1 : 1))
    .slice(0, 8);
  for (const candidate of candidates) photoRegistry.set(candidate.url, candidate);
  return { candidates, article, warnings: [...new Set(warnings)] };
}

/** Best verified photo or null. Never returns an unverified image. */
export async function findBestPhoto(input: PhotoSearchInput): Promise<{ photo: PhotoCandidate | null; warnings: string[] }> {
  const r = await findPhotos(input);
  const best = r.candidates.find((c) => c.relevance >= 0.7) ?? null;
  return { photo: best, warnings: r.warnings };
}

// ---------------------------------------------------------------- full discovery

export type DiscoverInput = { name: string; lat?: number; lng?: number; address?: string; refresh?: boolean };

export type DiscoverResult = {
  found: boolean;
  match?: {
    osmType: "node" | "way" | "relation";
    osmId: number;
    name: string;
    lat: number;
    lng: number;
    osmUrl: string;
    tags: OsmTags;
  };
  lat?: number;
  lng?: number;
  address?: string;
  category: CategoryGuess;
  description?: string;
  descriptionSource?: { label: string; url: string };
  photos: PhotoCandidate[];
  selectedPhotoUrl?: string;
  warnings: string[];
};

const discoverCache = new TtlCache<DiscoverResult>(30 * 60_000, 300);

const KEEP_TAG = /^(name|name:en|amenity|tourism|historic|leisure|natural|waterway|shop|building|sport|religion|denomination|boundary|water|landuse|heritage|wikipedia|wikidata|website|description|opening_hours|fee|addr:.*|attraction|aerialway|highway)$/;

export function trimTags(tags: OsmTags): OsmTags {
  const out: OsmTags = {};
  for (const [k, v] of Object.entries(tags)) {
    if (KEEP_TAG.test(k) && typeof v === "string") out[k] = v.slice(0, 200);
    if (Object.keys(out).length >= 40) break;
  }
  return out;
}

export async function discoverPlace(input: DiscoverInput): Promise<DiscoverResult> {
  const name = input.name.trim();
  const key = [name.toLowerCase(), input.lat?.toFixed(4) ?? "", input.lng?.toFixed(4) ?? "", (input.address ?? "").toLowerCase()].join("|");
  if (input.refresh) {
    const refreshed = await runDiscover({ ...input, name });
    discoverCache.set(key, refreshed);
    return refreshed;
  }
  return discoverCache.wrap(key, () => runDiscover({ ...input, name }));
}

async function runDiscover(input: DiscoverInput): Promise<DiscoverResult> {
  const warnings: string[] = [];
  let { lat, lng } = input;
  let el: OsmElement | null = null;
  let nominatimAddr = "";
  let nominatimCity = "";
  const wikidataPromise = lookupWikidata(input.name).catch((error) => {
    warnings.push(error instanceof Error ? error.message : "Wikidata lookup failed");
    return null;
  });

  // A) OSM feature near the given coordinates, matched by name
  if (lat !== undefined && lng !== undefined) {
    try {
      const near = await overpassNearby(lat, lng, 300);
      let best = 0;
      for (const e of near) {
        const sim = Math.max(nameSimilarity(input.name, e.tags.name ?? ""), nameSimilarity(input.name, e.tags["name:en"] ?? ""));
        const score = sim - Math.min(0.2, haversineKm(lat, lng, e.lat, e.lng));
        if (sim >= 0.6 && score > best) {
          best = score;
          el = e;
        }
      }
    } catch (e) {
      warnings.push(e instanceof Error ? e.message : "Overpass lookup failed");
    }
    // Small shops and stalls are not "interesting" features, so look for any OSM feature with that name nearby.
    if (!el) el = await findNamedNear(input.name, lat, lng, [800, 3000]);
  }

  // B0) Google Maps first when a key is configured (accurate city — never Hyderabad for Bengaluru queries)
  if ((!lat || !lng) && googleEnabled()) {
    try {
      const g = await googleFindPlace(input.name, input.address || "");
      if (g && inBlrMetro(g.lat, g.lng)) {
        lat = g.lat;
        lng = g.lng;
        nominatimAddr = g.address || "";
        nominatimCity = "";
        warnings.push("Location confirmed via Google Maps.");
      } else {
        const geo = await googleGeocode([input.name, input.address].filter(Boolean).join(", "));
        if (geo && inBlrMetro(geo.lat, geo.lng)) {
          lat = geo.lat;
          lng = geo.lng;
          nominatimAddr = geo.formattedAddress;
          nominatimCity = "";
          warnings.push("Location confirmed via Google Geocoding.");
        }
      }
    } catch (e) {
      warnings.push(e instanceof Error ? e.message : "Google Maps lookup failed");
    }
  }

  // B) otherwise search OpenStreetMap by name (Nominatim), then read the full tags from Overpass
  let nomTags: OsmTags = {};
  if (!el) {
    try {
      const addr = (input.address ?? "").trim();
      const areaPart = addr.split(",")[0]?.trim() ?? "";
      // Nominatim fails when a long "name, area, city, state, country" string does not match every part,
      // so try several shorter shapes from most to least specific.
      const variants = [...new Set([
        [input.name, addr].filter(Boolean).join(", "),
        [input.name, areaPart].filter(Boolean).join(" "),
        input.name,
      ].map((v) => v.trim()).filter(Boolean))];
      let top: NominatimRow | undefined;
      for (const q of variants) {
        let rows: NominatimRow[] = [];
        try {
          rows = await nominatimSearch(q);
        } catch (e) {
          warnings.push(e instanceof Error ? e.message : "OpenStreetMap search failed");
        }
        const scored = rows
          .map((r) => ({ r, sim: Math.max(nameSimilarity(input.name, r.name ?? ""), nameSimilarity(input.name, (r.display_name ?? "").split(",")[0])) }))
          .filter((x) => x.sim >= 0.6 && inCoverage(Number(x.r.lat), Number(x.r.lon)))
          .sort((a, b) => b.sim - a.sim);
        if (scored[0]) {
          top = scored[0].r;
          break;
        }
      }
      if (top) {
        const t = osmType(top.osm_type);
        nominatimAddr = top.display_name ?? "";
        nominatimCity = top.address?.city || top.address?.town || top.address?.suburb || top.address?.state_district || "";
        nomTags = { ...(top.extratags ?? {}), ...(top.class && top.type ? { [top.class]: top.type } : {}) };
        const nlat = Number(top.lat);
        const nlng = Number(top.lon);
        // Even if Photon has no OSM object id, its geocoded coordinates are useful
        // for a manually added place; they are not treated as a verified OSM feature.
        if (Number.isFinite(nlat) && Number.isFinite(nlng)) {
          lat = nlat;
          lng = nlng;
        }
        if (t && top.osm_id) {
          try {
            el = await overpassById(t, top.osm_id);
          } catch (e) {
            warnings.push(e instanceof Error ? e.message : "Overpass lookup failed");
          }
          if (!el) el = { type: t, id: top.osm_id, tags: { ...nomTags, name: top.name ?? input.name }, lat: nlat, lng: nlng };
        }
      } else if (areaPart) {
        // Last resort for tiny places: find the area, then look for any OSM feature with this name inside it.
        let center = lat !== undefined && lng !== undefined ? { lat, lng } : null;
        if (!center) {
          const areaRows = await nominatimSearch(areaPart).catch(() => [] as NominatimRow[]);
          const first = areaRows.find((r) => inBlrMetro(Number(r.lat), Number(r.lon)));
          if (first) center = { lat: Number(first.lat), lng: Number(first.lon) };
        }
        if (center) {
          const hit = await findNamedNear(input.name, center.lat, center.lng, [2500, 9000]);
          if (hit) {
            el = hit;
            nomTags = {};
          }
        }
      }
    } catch (e) {
      warnings.push(e instanceof Error ? e.message : "OpenStreetMap search failed");
    }
  }

  const wikidata = await wikidataPromise;
  const tags: OsmTags = el ? { ...nomTags, ...el.tags } : {};
  if (el) {
    lat = el.lat;
    lng = el.lng;
  } else if (wikidata?.lat !== undefined && wikidata.lng !== undefined) {
    const closeEnough = lat === undefined || lng === undefined || haversineKm(lat, lng, wikidata.lat, wikidata.lng) <= 25;
    if (closeEnough) {
      lat = wikidata.lat;
      lng = wikidata.lng;
    }
  }

  // C) category: OSM tags first, the name only as a weaker fallback
  let category = mapOsmTagsToCategory(el ? tags : null);
  if (category.confidence === "none") {
    const byName = guessCategoryFromName(`${input.name} ${wikidata?.description ?? ""}`);
    if (byName.confidence !== "none") category = byName;
    else if (el) category = { ...category, reason: "OpenStreetMap has this place but no recognisable tags" };
  }

  // D) address
  let address = addressFromTags(tags) || nominatimAddr;
  if (!address && lat !== undefined && lng !== undefined) {
    try {
      const rev = await nominatimReverse(lat, lng);
      address = rev?.display_name ?? "";
      nominatimCity ||= rev?.address?.city || rev?.address?.suburb || "";
    } catch (e) {
      warnings.push(e instanceof Error ? e.message : "Reverse geocoding failed");
    }
  }

  // E) photos + description (Wikipedia / Commons)
  const photoRes = await findPhotos({
    name: tags.name || input.name,
    lat,
    lng,
    area: address || input.address || nominatimCity,
    wikipediaTag: tags.wikipedia || (wikidata?.wikipediaTitle ? `en:${wikidata.wikipediaTitle}` : undefined),
  }, input.refresh === true);
  warnings.push(...photoRes.warnings);

  let description = tags.description?.trim() || undefined;
  let descriptionSource: DiscoverResult["descriptionSource"];
  if (description && el) {
    descriptionSource = { label: "OpenStreetMap contributors (ODbL)", url: `https://www.openstreetmap.org/${el.type}/${el.id}` };
  } else if (photoRes.article?.extract) {
    description = photoRes.article.extract.slice(0, 600);
    descriptionSource = { label: "Wikipedia (CC BY-SA)", url: photoRes.article.url };
  } else if (wikidata?.description) {
    description = wikidata.description;
    descriptionSource = { label: "Wikidata", url: `https://www.wikidata.org/wiki/${wikidata.id}` };
  }

  return {
    found: Boolean(el),
    match: el
      ? {
          osmType: el.type,
          osmId: el.id,
          name: tags.name || input.name,
          lat: round(el.lat),
          lng: round(el.lng),
          osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
          tags: trimTags(tags),
        }
      : undefined,
    lat: lat !== undefined ? round(lat) : undefined,
    lng: lng !== undefined ? round(lng) : undefined,
    address: address || undefined,
    category,
    description,
    descriptionSource,
    photos: photoRes.candidates,
    selectedPhotoUrl: photoRes.candidates.find((c) => c.relevance >= 0.7)?.url,
    warnings: [...new Set(warnings)],
  };
}

export type NearbyPlace = {
  osmType: string;
  osmId: number;
  name: string;
  lat: number;
  lng: number;
  distanceM: number;
  category: CategoryGuess;
};

export async function nearbyOsmPlaces(lat: number, lng: number, radiusM: number): Promise<NearbyPlace[]> {
  const els = await overpassNearby(lat, lng, radiusM);
  const seen = new Set<string>();
  const out: NearbyPlace[] = [];
  for (const e of els) {
    const name = e.tags.name;
    if (!name) continue;
    const category = mapOsmTagsToCategory(e.tags);
    if (category.confidence === "none") continue;
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ osmType: e.type, osmId: e.id, name, lat: round(e.lat), lng: round(e.lng), distanceM: Math.round(haversineKm(lat, lng, e.lat, e.lng) * 1000), category });
  }
  return out.sort((a, b) => a.distanceM - b.distanceM).slice(0, 15);
}

/** Cheap check used by the old classifier: tags for the best OSM match, or null. */
export async function osmTagsFor(name: string, lat?: number, lng?: number, address?: string): Promise<OsmTags | null> {
  const r = await discoverPlace({ name, lat, lng, address });
  return r.match?.tags ?? null;
}

/** Test helper: forget everything cached in memory. */
export function clearPlaceCaches() {
  for (const c of [overpassCache, byIdCache, nominatimCache, photonCache, reverseCache, wikiCache, commonsCache, photoRegistry, wikidataCache, discoverCache]) c.clear();
}


export type PlaceGeoHit = { lat: number; lng: number; formattedAddress: string; name: string; provider: string; precision: "exact" | "area" };

/**
 * Finds a place by NAME + area, including small shops and stalls.
 * 1. name searches (several shapes; long "a, b, c, d" strings often match nothing in Nominatim)
 * 2. any OSM feature with that name inside the area (shops/stalls that are not "interesting" features)
 * 3. otherwise the centre of the area, flagged precision "area" so maps can search by name instead.
 */
export async function locatePlace(name: string, area: string): Promise<PlaceGeoHit | null> {
  const cleanName = name.trim();
  const areaPart = area.split(",")[0]?.trim() ?? "";
  const inRegion = (r: { lat: string; lon: string }) => inCoverage(Number(r.lat), Number(r.lon));
  if (cleanName.length >= 2) {
    const variants = [...new Set([
      [cleanName, area].filter(Boolean).join(", "),
      [cleanName, areaPart].filter(Boolean).join(" "),
      cleanName,
    ].map((v) => v.trim()).filter(Boolean))];
    for (const q of variants) {
      const rows = await nominatimSearch(q).catch(() => [] as NominatimRow[]);
      const best = rows
        .map((r) => ({ r, sim: Math.max(nameSimilarity(cleanName, r.name ?? ""), nameSimilarity(cleanName, (r.display_name ?? "").split(",")[0])) }))
        .filter((x) => x.sim >= 0.6 && inRegion(x.r))
        .sort((a, b) => b.sim - a.sim)[0];
      if (best) {
        return { lat: Number(best.r.lat), lng: Number(best.r.lon), formattedAddress: best.r.display_name ?? area, name: cleanName, provider: "openstreetmap", precision: "exact" };
      }
    }
  }
  let center: { lat: number; lng: number; label: string } | null = null;
  if (areaPart) {
    for (const q of [areaPart, area]) {
      const rows = await nominatimSearch(q).catch(() => [] as NominatimRow[]);
      const first = rows.find(inRegion);
      if (first) {
        center = { lat: Number(first.lat), lng: Number(first.lon), label: first.display_name ?? area };
        break;
      }
    }
  }
  if (center && cleanName.length >= 2) {
    const hit = await findNamedNear(cleanName, center.lat, center.lng, [2500, 9000]);
    if (hit) return { lat: hit.lat, lng: hit.lng, formattedAddress: `${hit.tags.name ?? cleanName}, ${center.label}`, name: cleanName, provider: "openstreetmap", precision: "exact" };
  }
  if (center) return { lat: center.lat, lng: center.lng, formattedAddress: center.label, name: cleanName, provider: "openstreetmap_area", precision: "area" };
  return null;
}
