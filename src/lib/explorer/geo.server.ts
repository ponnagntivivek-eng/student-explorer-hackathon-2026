import { haversineKm, roadKmFromStraight } from "./fares.ts";
import { USER_AGENT as UA, politeJson, TtlCache } from "../places/http.server.ts";
import { findBestPhoto, osmTagsFor, type PhotoCandidate } from "../places/discovery.server.ts";
import { mapOsmTagsToCategory, guessCategoryFromName, toExplorerBucket } from "../places/categories.ts";
import { textScore } from "./fuzzy.ts";
import { COUNTRY_CODES, DEFAULT_BIAS, biasViewbox, haversine, inCoverage, withCityContext, type LatLng } from "../places/region.ts";
import { googleGeocode, googleFindPlace, googleSearchPlaces, googleEnabled } from "./google.server.ts";

export const BENGALURU_GEO_INDEX: Record<string, { lat: number; lng: number; name: string; area: string }> = {
  koramangala: { lat: 12.9352, lng: 77.6245, name: "Koramangala 5th Block", area: "Koramangala, South Bengaluru" },
  indiranagar: { lat: 12.9784, lng: 77.6408, name: "Indiranagar 100ft Road", area: "Indiranagar, East Bengaluru" },
  christ: { lat: 12.9344, lng: 77.606, name: "Christ University Central Campus", area: "Hosur Road, Dairy Circle" },
  btm: { lat: 12.9166, lng: 77.6101, name: "BTM Layout 2nd Stage", area: "BTM Layout, South Bengaluru" },
  hsr: { lat: 12.9121, lng: 77.6446, name: "HSR Layout BDA Complex", area: "HSR Layout Sector 6" },
  jayanagar: { lat: 12.9308, lng: 77.5838, name: "Jayanagar 4th Block Complex", area: "Jayanagar, South Bengaluru" },
  rvce: { lat: 12.9237, lng: 77.4987, name: "RV College of Engineering (RVCE)", area: "Mysore Road, Bengaluru" },
  pesu: { lat: 12.9255, lng: 77.5468, name: "PES University Ring Road Campus", area: "Banashankari / Outer Ring Rd" },
  bmsce: { lat: 12.9422, lng: 77.5681, name: "BMS College of Engineering (BMSCE)", area: "Basavanagudi, South Bengaluru" },
  dsce: { lat: 12.9081, lng: 77.5666, name: "Dayananda Sagar College (DSCE)", area: "Kumaraswamy Layout, Bengaluru" },
  msrit: { lat: 13.0305, lng: 77.5649, name: "Ramaiah Institute of Technology (MSRIT)", area: "Mathikere, North Bengaluru" },
  ramaiah: { lat: 13.0305, lng: 77.5649, name: "MS Ramaiah College / MSRIT", area: "Mathikere, North Bengaluru" },
  mathikere: { lat: 13.0328, lng: 77.5572, name: "Mathikere", area: "Mathikere, North Bengaluru" },
  msr: { lat: 13.0305, lng: 77.5649, name: "MSR College / Ramaiah", area: "Mathikere, North Bengaluru" },
  "ramaiah college": { lat: 13.0289, lng: 77.5616, name: "MS Ramaiah College", area: "Mathikere, North Bengaluru" },
  mcc: { lat: 12.9922, lng: 77.5891, name: "Mount Carmel College (MCC)", area: "Vasanth Nagar, Central Bengaluru" },
  malleshwaram: { lat: 13.0031, lng: 77.5643, name: "Malleshwaram 8th Cross", area: "Malleshwaram, West Bengaluru" },
  whitefield: { lat: 12.9698, lng: 77.75, name: "Whitefield ITPL", area: "Whitefield, East Bengaluru" },
  majestic: { lat: 12.9767, lng: 77.5713, name: "Majestic City Railway Station", area: "Kempegowda Bus Station" },
  rajajinagar: { lat: 12.9982, lng: 77.553, name: "Rajajinagar Navrang", area: "Rajajinagar, West Bengaluru" },
  bellandur: { lat: 12.926, lng: 77.6762, name: "Bellandur EcoSpace", area: "Outer Ring Road, Bellandur" },
  marathahalli: { lat: 12.9591, lng: 77.6974, name: "Marathahalli Bridge", area: "Marathahalli, East Bengaluru" },
  hebbal: { lat: 13.0358, lng: 77.597, name: "Hebbal Manyata Tech Park", area: "Hebbal, North Bengaluru" },
  kammanahalli: { lat: 13.0159, lng: 77.6379, name: "Kammanahalli / Kalyan Nagar", area: "HRBR Layout, East Bengaluru" },
  "electronic-city": { lat: 12.8452, lng: 77.6602, name: "Electronic City Phase 1", area: "Electronic City, South Bengaluru" },
  electronic: { lat: 12.8452, lng: 77.6602, name: "Electronic City Phase 1", area: "Electronic City, South Bengaluru" },
  yelahanka: { lat: 13.1007, lng: 77.5963, name: "Yelahanka Old Town", area: "Yelahanka, North Bengaluru" },
  basavanagudi: { lat: 12.9422, lng: 77.575, name: "Basavanagudi Bull Temple Road", area: "Basavanagudi, South Bengaluru" },
  churchstreet: { lat: 12.975, lng: 77.6066, name: "Church Street / MG Road", area: "Central Bengaluru" },
  church: { lat: 12.975, lng: 77.6066, name: "Church Street / MG Road", area: "Central Bengaluru" },
  mgroad: { lat: 12.9756, lng: 77.6068, name: "MG Road", area: "Central Bengaluru" },
  frazer: { lat: 12.9968, lng: 77.6133, name: "Frazer Town Mosque Road", area: "Pulikeshi Nagar / Frazer Town" },
  kengeri: { lat: 12.9177, lng: 77.4838, name: "Kengeri Satellite Town", area: "Kengeri, West Bengaluru" },
  sarjapur: { lat: 12.91, lng: 77.68, name: "Sarjapur Road", area: "Sarjapur, South-East Bengaluru" },
  banashankari: { lat: 12.925, lng: 77.565, name: "Banashankari BDA Complex", area: "BSK 2nd Stage, South Bengaluru" },
  sadashivanagar: { lat: 13.0068, lng: 77.5813, name: "Sadashivanagar Sankey Tank", area: "Sadashivanagar, Central Bengaluru" },
  lalbagh: { lat: 12.9507, lng: 77.5848, name: "Lalbagh Botanical Garden", area: "Mavalli, South Bengaluru" },
  cubbon: { lat: 12.9763, lng: 77.5929, name: "Cubbon Park", area: "Kasturba Road, Central Bengaluru" },
  "vv puram": { lat: 12.9515, lng: 77.5768, name: "VV Puram Food Street", area: "Sajjan Rao Circle, VV Puram" },
  "nandi hills": { lat: 13.3702, lng: 77.6835, name: "Nandi Hills", area: "Chikkaballapur" },
  palace: { lat: 12.9988, lng: 77.5921, name: "Bengaluru Palace", area: "Vasanth Nagar, Central Bengaluru" },
  wonderla: { lat: 12.8340, lng: 77.4010, name: "Wonderla Amusement Park", area: "Mysore Road, Bengaluru" },
  "mysore road": { lat: 12.9100, lng: 77.4800, name: "Mysore Road", area: "West Bengaluru" },
};

const geoCacheRaw = new Map<string, { lat: number; lng: number; formattedAddress: string; name: string; provider: string }>();
/** Bounded cache: oldest entries are dropped so a long-running server cannot grow without limit. */
const geoCache = {
  get: (k: string) => geoCacheRaw.get(k),
  set: (k: string, v: { lat: number; lng: number; formattedAddress: string; name: string; provider: string }) => {
    if (geoCacheRaw.size >= 1000) geoCacheRaw.delete(geoCacheRaw.keys().next().value as string);
    geoCacheRaw.set(k, v);
  },
};

function localHit(query: string) {
  const lower = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  type Hit = { score: number; data: (typeof BENGALURU_GEO_INDEX)[string] };
  const hits: Hit[] = [];
  for (const [key, data] of Object.entries(BENGALURU_GEO_INDEX)) {
    const nameL = data.name.toLowerCase();
    const areaL = data.area.toLowerCase();
    let score = 0;
    if (lower === key || lower === nameL) score = 100;
    else if (nameL.startsWith(lower) || key.startsWith(lower)) score = 90;
    else if (lower.includes(key) && key.length >= 4) score = 80;
    else if (nameL.includes(lower) && lower.length >= 4) score = 72;
    else if (areaL.includes(lower) && lower.length >= 5) score = 60;
    else if (lower.split(" ").some((w) => w.length >= 4 && (key.includes(w) || nameL.includes(w)))) score = 45;
    if (score > 0) hits.push({ score, data });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits[0] && hits[0].score >= 45 ? hits[0].data : null;
}

const nominatimReverseCache = new TtlCache<string | null>(24 * 3600_000, 800);

/** Configurable coverage (all of India by default; see places/region.ts). */
const inBengaluruMetro = inCoverage;
const withBengaluruContext = withCityContext;
const countryParam = () => (COUNTRY_CODES ? `&countrycodes=${encodeURIComponent(COUNTRY_CODES)}` : "");

/** Local landmark index is a Bengaluru convenience: skip it when the visitor is clearly elsewhere. */
function localIndexApplies(query: string, near?: LatLng | null) {
  if (/bengaluru|bangalore/i.test(query)) return true;
  const c = near || DEFAULT_BIAS;
  return haversine(c, DEFAULT_BIAS) <= 150;
}

/** Long paste-from-Google addresses often fail on Nominatim. Build shorter, better search strings. */
export function geocodeQueryVariants(raw: string): string[] {
  const q = String(raw || "").trim().replace(/\s+/g, " ");
  if (!q) return [];
  const variants: string[] = [];
  const push = (s: string) => {
    const t = s.trim().replace(/\s+/g, " ");
    if (t.length < 3) return;
    if (!variants.some((v) => v.toLowerCase() === t.toLowerCase())) variants.push(t);
  };
  push(q);
  // Drop pincode / state noise
  push(q.replace(/\b\d{6}\b/g, "").replace(/,?\s*karnataka\b/gi, "").replace(/,?\s*india\b/gi, "").replace(/,+/g, ",").replace(/\s+,/g, ",").trim());
  // Comma segments: try last meaningful locality chunks (Mathikere, Ramaiah, etc.)
  const parts = q.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    push(parts.slice(0, 2).join(", "));
    push(parts.slice(0, 3).join(", "));
    // Prefer segments that look like areas/landmarks over door numbers
    const interesting = parts.filter((p) => !/^\d+[a-z\/\-]*$/i.test(p) && p.length >= 4);
    if (interesting.length) {
      push(interesting.slice(0, 2).join(", "));
      push(interesting.slice(0, 3).join(", "));
      // Single strongest tokens
      for (const p of interesting) {
        if (/mathikere|ramaiah|msr|koramangala|indiranagar|hebbal|yelahanka|whitefield|jayanagar|malleshwaram|btm|hsr/i.test(p)) push(p);
      }
    }
  }
  // Known campus keywords extracted from free text
  const lower = q.toLowerCase();
  if (/ramaiah|msrit|\bmsr\b/.test(lower)) push("MS Ramaiah College Mathikere Bengaluru");
  if (/mathikere/.test(lower)) push("Mathikere Bengaluru");
  if (/koramangala/.test(lower)) push("Koramangala Bengaluru");
  // Cap length for upstream APIs
  return variants.map((v) => (v.length > 180 ? v.slice(0, 180) : v)).slice(0, 8);
}

async function nominatimSearch(query: string, near?: LatLng | null) {
  const q = withCityContext(query);
  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5${countryParam()}` +
    `&viewbox=${biasViewbox(near || DEFAULT_BIAS)}&bounded=0&q=${encodeURIComponent(q)}`;
  try {
    const rows = await politeJson<{ lat: string; lon: string; display_name: string }[]>(url, { lane: "nominatim", gapMs: 1100 });
    for (const row of rows || []) {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inCoverage(lat, lng)) continue;
      return { lat, lng, formattedAddress: row.display_name, name: query, provider: "openstreetmap" };
    }
  } catch {
    /* caller handles "no result" */
  }
  return null;
}

type PhotonFeature = { properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } };
/** Photon (OpenStreetMap, built for search-as-you-type). */
async function photonCandidates(q: string, near: LatLng | null | undefined, limit: number): Promise<GeocodeCandidate[]> {
  const c = near || DEFAULT_BIAS;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(withCityContext(q))}&limit=${limit}&lang=en&lat=${c.lat}&lon=${c.lng}&location_bias_scale=0.4`;
  const data = await politeJson<{ features?: PhotonFeature[] }>(url, { lane: "photon", gapMs: 200, timeoutMs: 6000 });
  const out: GeocodeCandidate[] = [];
  for (const f of data.features ?? []) {
    const lng = Number(f.geometry?.coordinates?.[0]);
    const lat = Number(f.geometry?.coordinates?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inCoverage(lat, lng)) continue;
    const p = f.properties ?? {};
    const name = String(p.name ?? p.street ?? "");
    const label = [name || [p.housenumber, p.street].filter(Boolean).join(" "), p.district, p.city, p.state, p.postcode].filter((x) => typeof x === "string" && x.trim()).join(", ");
    if (!label) continue;
    const wanted = q.split(",")[0];
    const rel = textScore(wanted, name);
    out.push({
      lat, lng, formattedAddress: label, name: name || label.split(",")[0], provider: "photon",
      score: 40 + rel * 35 + (p.osm_key === "place" ? 0 : 8),
      precision: p.osm_key === "place" || p.osm_key === "boundary" ? "area" : p.housenumber || p.osm_key === "amenity" || p.osm_key === "tourism" || p.osm_key === "shop" ? "exact" : "street",
    });
  }
  return out;
}

async function nominatimReverse(lat: number, lng: number) {
  return nominatimReverseCache.wrap(`${lat.toFixed(4)},${lng.toFixed(4)}`, async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17`;
    const row = await politeJson<{ display_name?: string }>(url, { lane: "nominatim", gapMs: 1100 });
    return row.display_name || null;
  });
}

export async function geocodeAddress(query: string) {
  const key = query.trim().toLowerCase();
  const cached = geoCache.get(key);
  if (cached) return cached;

  // Prefer ranked candidates (handles long paste addresses via variants + local index)
  try {
    const cands = await geocodeCandidates(query, 4);
    if (cands[0]) {
      const hit = {
        lat: cands[0].lat,
        lng: cands[0].lng,
        formattedAddress: cands[0].formattedAddress,
        name: cands[0].name,
        provider: cands[0].provider,
      };
      geoCache.set(key, hit);
      return hit;
    }
  } catch {
    /* fall through to simpler paths */
  }

  // Local campus / neighbourhood index (instant, never wrong city)
  const local = localHit(query);
  if (local) {
    const hit = { lat: local.lat, lng: local.lng, formattedAddress: `${local.name}, ${local.area}`, name: local.name, provider: "bengaluru_places" };
    geoCache.set(key, hit);
    return hit;
  }

  // OpenStreetMap Nominatim on shortened variants
  for (const v of geocodeQueryVariants(query)) {
    try {
      const osm = await nominatimSearch(v);
      if (osm && inBengaluruMetro(osm.lat, osm.lng)) {
        geoCache.set(key, osm);
        return osm;
      }
    } catch {
      /* try next */
    }
  }

  return null;
}


export type GeocodeCandidate = {
  lat: number;
  lng: number;
  formattedAddress: string;
  name: string;
  provider: string;
  score: number;
  /** exact = venue/building, street = street-level, area = neighbourhood centre (verify the pin). */
  precision?: "exact" | "street" | "area";
};

/** Words that appear in almost every address; they must never decide WHICH place was meant. */
const GENERIC_WORDS = new Set([
  "road", "street", "cross", "main", "layout", "college", "university", "institute", "campus", "block", "stage", "phase", "sector",
  "near", "opposite", "behind", "beside", "next", "bengaluru", "bangalore", "karnataka", "india", "nagar", "city", "circle", "gate",
  "bus", "stop", "station", "temple", "hospital", "cafe", "restaurant", "hotel", "school", "floor", "building", "plot", "door", "extension",
  "town", "post", "area", "mall", "complex", "square", "market", "church", "palace", "garden", "park",
]);
/** Short or ambiguous index keys only match their full phrase (so "St Mark's Church Rd" is not Church Street). */
const AMBIGUOUS_KEYS: Record<string, string> = {
  church: "church street", christ: "christ university", mcc: "mount carmel", palace: "bengaluru palace",
  frazer: "frazer town", electronic: "electronic city", majestic: "majestic", mgroad: "mg road",
};

/** Ranked list of possible pins for a typed address/place anywhere in the configured coverage. The user should pick the right one. */
export async function geocodeCandidates(query: string, limit = 6, opts: { near?: LatLng | null } = {}): Promise<GeocodeCandidate[]> {
  const variants = geocodeQueryVariants(query);
  if (!variants.length) return [];
  const results: GeocodeCandidate[] = [];
  const seen = new Set<string>();
  const push = (c: GeocodeCandidate) => {
    if (!inCoverage(c.lat, c.lng)) return;
    const key = `${c.lat.toFixed(3)},${c.lng.toFixed(3)}`; // ~100 m: the same place from two services is one result
    if (seen.has(key)) return;
    seen.add(key);
    results.push(c);
  };

  // 1) Local campus / neighbourhood index. These are AREA centres (not street-level), so they are
  //    ranked below real street/venue matches and flagged precision:"area".
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const fullNorm = norm(query);
  const qTokens = fullNorm.split(" ").filter(Boolean);
  const hasWord = (hay: string, w: string) => !!w && new RegExp(`(^| )${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(hay);
  const distinctive = qTokens.filter((t) => t.length >= 4 && !GENERIC_WORDS.has(t));
  for (const [key, data] of localIndexApplies(query, opts.near) ? Object.entries(BENGALURU_GEO_INDEX) : []) {
    const nameL = norm(data.name);
    const areaL = norm(data.area);
    const keyL = norm(key);
    const phrase = AMBIGUOUS_KEYS[keyL];
    let score = 0;
    // Typed the college/landmark name (e.g. "BMS College of Engineering"): most of its distinctive name words appear.
    const nameSig = nameL.split(" ").filter((w) => w.length >= 3 && !GENERIC_WORDS.has(w));
    const nameHits = nameSig.filter((w) => qTokens.includes(w)).length;
    if (!phrase && nameSig.length >= 2 && nameHits >= 2 && nameHits / nameSig.length >= 0.6) score = 85;
    if (fullNorm === keyL || fullNorm === nameL || (phrase && fullNorm === phrase)) score = 95;
    else if (score) { /* strong name-overlap match above */ }
    else if (phrase ? hasWord(fullNorm, phrase) : hasWord(fullNorm, keyL)) score = qTokens.length <= 3 ? 88 : 66;
    else if (!phrase && distinctive.some((t) => hasWord(nameL, t))) score = qTokens.length <= 3 ? 70 : 58;
    else if (!phrase && distinctive.some((t) => t.length >= 5 && hasWord(areaL, t))) score = 52;
    else if (qTokens.length <= 3) {
      const fz = Math.max(textScore(query, key), textScore(query, data.name), textScore(query, data.area.split(",")[0]));
      if (fz >= 0.7) score = Math.round(40 + fz * 30);
    }
    if (score) {
      push({
        lat: data.lat,
        lng: data.lng,
        formattedAddress: `${data.name}, ${data.area}`,
        name: data.name,
        provider: "bengaluru_places",
        score,
        precision: "area",
      });
    }
  }

  // 2) Google (when configured) on the best short variants
  if (googleEnabled()) {
    for (const v of variants.slice(0, 3)) {
      try {
        const places = await googleSearchPlaces(v, "", limit, opts.near);
        for (const p of places) {
          push({
            lat: p.lat,
            lng: p.lng,
            formattedAddress: p.address || p.name,
            name: p.name,
            provider: "google_places",
            score: 100,
            precision: "exact",
          });
        }
      } catch { /* ignore */ }
      try {
        const g = await googleGeocode(v, opts.near);
        if (g) {
          push({
            lat: g.lat,
            lng: g.lng,
            formattedAddress: g.formattedAddress,
            name: g.name,
            provider: g.provider,
            score: 92,
            precision: "street",
          });
        }
      } catch { /* ignore */ }
      if (results.some((r) => r.provider === "google_places" || r.provider.startsWith("google"))) break;
    }
  }

  // 3) OpenStreetMap: Nominatim on shortened variants, plus Photon for extra alternatives (full paste addresses often return [])
  for (const v of variants.slice(0, 4)) {
    try {
      const qCtx = withCityContext(v);
      const url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6${countryParam()}` +
        `&viewbox=${biasViewbox(opts.near || DEFAULT_BIAS)}&bounded=0&addressdetails=1&q=${encodeURIComponent(qCtx)}`;
      const rows = await politeJson<{ lat: string; lon: string; display_name: string; name?: string; importance?: number; place_rank?: number }[]>(url, {
        lane: "nominatim",
        gapMs: 900,
      });
      for (const row of rows || []) {
        const lat = Number(row.lat);
        const lng = Number(row.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const imp = typeof row.importance === "number" ? row.importance * 30 : 15;
        // Reward results whose name matches what was typed (first comma-part), so the real venue beats a random nearby hit.
        const wanted = String(query).split(",")[0];
        const rel = Math.max(textScore(wanted, row.name || ""), textScore(wanted, String(row.display_name || "").split(",")[0]));
        const rank = Number(row.place_rank);
        // Prefer results near the visitor / default area (ranking only, never a hard filter).
        const near = opts.near || DEFAULT_BIAS;
        const km = haversine(near, { lat, lng });
        const proximity = km <= 25 ? 6 : km <= 150 ? 3 : 0;
        push({
          lat,
          lng,
          formattedAddress: row.display_name,
          name: row.name || v,
          provider: "openstreetmap",
          score: 45 + imp + rel * 30 + proximity,
          precision: rank >= 30 || rel >= 0.8 ? "exact" : rank >= 26 ? "street" : "area",
        });
      }
    } catch { /* try next variant */ }
    if (results.some((r) => r.provider === "openstreetmap")) break;
  }
  try {
    for (const c of await photonCandidates(variants[0], opts.near, Math.min(8, limit + 2))) push(c);
  } catch { /* Photon is optional */ }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export async function reverseGeocode(lat: number, lng: number) {
  try {
    const name = await nominatimReverse(lat, lng);
    if (name) return { formattedAddress: name, provider: "openstreetmap" };
  } catch {
    /* fall through */
  }
  let closestName = "";
  let closestDist = Infinity;
  for (const data of Object.values(BENGALURU_GEO_INDEX)) {
    const d = haversineKm(lat, lng, data.lat, data.lng);
    if (d < closestDist) {
      closestDist = d;
      closestName = `${data.name}, ${data.area}`;
    }
  }
  if (closestDist > 25) return { formattedAddress: `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`, provider: "coordinates_only", approximate: true };
  return { formattedAddress: `Near ${closestName}`, provider: "nearest_known_area", approximate: true };
}

/** Search-as-you-type suggestions (Photon). Several results are returned so the user chooses; nothing is auto-selected. */
export async function suggestPlaces(query: string, near?: LatLng | null, limit = 6): Promise<GeocodeCandidate[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const out: GeocodeCandidate[] = [];
  try {
    out.push(...(await photonCandidates(q, near, limit + 2)));
  } catch { /* fall through to the local index */ }
  if (localIndexApplies(q, near)) {
    for (const c of (await geocodeCandidates(q, 3, { near }).catch(() => [])).filter((x) => x.provider === "bengaluru_places")) {
      if (!out.some((o) => haversine(o, c) < 0.15)) out.push(c);
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * A real, VERIFIED photograph of the place (Wikipedia / Wikimedia Commons, free licences only), or null.
 * Never invents a stock stand-in. The credit (author, licence, source page) is returned with it.
 */
export async function findPlacePhoto(name: string, area: string, lat?: number, lng?: number): Promise<{ image: string; provider: string; credit: PhotoCandidate } | null> {
  const { photo } = await findBestPhoto({
    name,
    area,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  });
  return photo ? { image: photo.url, provider: photo.source, credit: photo } : null;
}

/** Real driving distance from the free OSRM public router, or null. */
export async function roadRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ km: number; mins: number; provider: string } | null> {
  try {
    const u = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const d = await politeJson<{ code?: string; routes?: { distance: number; duration: number }[] }>(u, { lane: "osrm", gapMs: 150, timeoutMs: 6000 });
    const route = d.routes?.[0];
    if (d.code === "Ok" && route) {
      return { km: Math.max(0.05, Math.round(route.distance / 10) / 100), mins: Math.max(1, Math.round(route.duration / 60)), provider: "osrm_road_network" };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** Approximate location from the visitor's IP (fallback when browser GPS is blocked). */
export async function ipLocate(ip: string) {
  const clean = ip && !/^(127\.|10\.|192\.168\.|::1|fc|fd)/.test(ip) ? ip : "";
  for (const url of [`https://ipwho.is/${clean}`, `https://ipapi.co/${clean ? clean + "/" : ""}json/`]) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(5000) });
      if (!r.ok) continue;
      const d = (await r.json()) as { latitude?: number; longitude?: number; city?: string; success?: boolean };
      if (d.success === false) continue;
      if (Number.isFinite(d.latitude) && Number.isFinite(d.longitude)) return { lat: d.latitude as number, lng: d.longitude as number, city: d.city || "", accuracy: "city" as const };
    } catch {
      /* next */
    }
  }
  return null;
}



type RouteMode = "driving" | "walking" | "cycling";
type ValhallaResponse = {
  trip?: {
    status?: number;
    status_message?: string;
    summary?: { length?: number; time?: number };
    legs?: Array<{ shape?: string; maneuvers?: Array<{ instruction?: string; length?: number; time?: number; type?: number }> }>;
  };
};
const routeCache = new TtlCache<{ distanceKm: number; durationMinutes: number; shape: string; instructions: string[]; provider: string }>(15 * 60_000, 500);

/** Real road/path routing from the free OpenStreetMap-hosted Valhalla demo. */
export async function routeDirections(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  mode: RouteMode,
) {
  const key = `${mode}:${from.lat.toFixed(5)},${from.lng.toFixed(5)}:${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
  return routeCache.wrap(key, async () => {
    const costing = mode === "walking" ? "pedestrian" : mode === "cycling" ? "bicycle" : "auto";
    const response = await politeJson<ValhallaResponse>("https://valhalla1.openstreetmap.de/route", {
      lane: "valhalla",
      gapMs: 250,
      timeoutMs: 12_000,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locations: [{ lat: from.lat, lon: from.lng }, { lat: to.lat, lon: to.lng }],
        costing,
        units: "kilometers",
        directions_options: { units: "kilometers" },
      }),
    });
    const trip = response.trip;
    const summary = trip?.summary;
    if (!trip || trip.status !== 0 || !summary || !Number.isFinite(summary.length) || !Number.isFinite(summary.time)) {
      throw new Error(trip?.status_message || "No route was returned for this travel mode.");
    }
    const leg = trip.legs?.[0];
    return {
      distanceKm: Math.round((summary.length ?? 0) * 100) / 100,
      durationMinutes: Math.max(1, Math.round((summary.time ?? 0) / 60)),
      shape: leg?.shape ?? "",
      instructions: (leg?.maneuvers ?? []).map((maneuver) => maneuver.instruction).filter((instruction): instruction is string => Boolean(instruction)),
      provider: "Valhalla / OpenStreetMap",
    };
  });
}

export function mapPreviewUrl(lat: number, lng: number) {
  const pad = 0.012;
  const bbox = [lng - pad, lat - pad, lng + pad, lat + pad].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export type PlaceClassification = {
  vibes: string[];
  timeOfDay: "morning" | "day" | "evening-night" | "night" | "any";
  suggestedCategory?: string;
  source: string;
  types: string[];
  confidence: number;
};

function scoreFromText(blob: string): { vibes: string[]; timeOfDay: PlaceClassification["timeOfDay"]; confidence: number } {
  const t = blob.toLowerCase();
  const vibes = new Set<string>();
  let morning = 0, night = 0, day = 0, food = 0, nature = 0, hangout = 0;

  if (/sunrise|dawn|early\s*morning|before\s*dawn|5\s*:\s*30|6\s*:\s*00\s*am|morning\s*walk|nandi\s*hills/.test(t)) {
    morning += 3; vibes.add("morning"); vibes.add("sunrise");
  }
  if (/\bpark\b|botanical|garden|lake|trek|hiking|picnic|viewpoint/.test(t)) {
    nature += 2; vibes.add("nature"); day += 1;
  }
  if (/night\s*life|nightlife|late[\s-]*night|night\s*club|club\b|pub\b|bar\b|open\s*late|after\s*10|11\s*pm/.test(t)) {
    night += 4; vibes.add("night"); vibes.add("hangout");
  }
  if (/evening|dinner|street\s*food|food\s*street|pedestrian\s*walk|9\s*pm|8\s*pm/.test(t)) {
    night += 2; vibes.add("evening");
  }
  if (/cafe|café|coffee|restaurant|dosa|biryani|eat|dining|food|bakery|gelato|ramen/.test(t)) {
    food += 2; vibes.add("food");
  }
  if (/museum|palace|fort|gallery|temple|monument|heritage|tourist/.test(t)) {
    day += 2; vibes.add("attractions");
  }
  if (/arcade|bowling|movie|cinema|karaoke|hangout|live\s*music/.test(t)) {
    hangout += 2; vibes.add("hangout"); night += 1;
  }

  let timeOfDay: PlaceClassification["timeOfDay"] = "any";
  let confidence = 0.35;
  if (morning >= 3 && morning > night) {
    timeOfDay = "morning"; confidence = Math.min(0.95, 0.45 + morning * 0.12);
    vibes.add("morning");
  } else if (night >= 3) {
    timeOfDay = night >= 4 ? "night" : "evening-night";
    confidence = Math.min(0.95, 0.45 + night * 0.1);
    vibes.add("night");
  } else if (food >= 2 && night >= 1) {
    timeOfDay = "evening-night"; confidence = 0.6; vibes.add("food");
  } else if (day >= 2 || nature >= 2) {
    timeOfDay = "day"; confidence = 0.55;
  } else if (food >= 2) {
    timeOfDay = "evening-night"; confidence = 0.5; vibes.add("food");
  }
  return { vibes: [...vibes], timeOfDay, confidence };
}

function scoreFromCategory(category: string): { vibes: string[]; timeOfDay: PlaceClassification["timeOfDay"]; confidence: number; suggestedCategory?: string } | null {
  switch (category) {
    case "nature":
    case "parks_gardens":
    case "waterfalls":
    case "beaches":
      return { vibes: ["nature", "morning", "day"], timeOfDay: "morning", confidence: 0.85, suggestedCategory: "nature" };
    case "food":
      return { vibes: ["food", "evening"], timeOfDay: "evening-night", confidence: 0.8, suggestedCategory: "food" };
    case "entertainment":
      return { vibes: ["hangout", "evening"], timeOfDay: "evening-night", confidence: 0.78, suggestedCategory: "entertainment" };
    case "historical":
    case "spiritual":
    case "museums_education":
    case "tourist_attractions":
      return { vibes: ["attractions", "day"], timeOfDay: "day", confidence: 0.75, suggestedCategory: "attractions" };
    case "shopping":
      return { vibes: ["day", "hangout"], timeOfDay: "day", confidence: 0.7 };
    case "adventure":
      return { vibes: ["nature", "morning"], timeOfDay: "morning", confidence: 0.7, suggestedCategory: "getaways" };
    default:
      return null;
  }
}

/** Classify a place using OpenStreetMap tags (free) + text heuristics. */
export async function classifyPlace(input: {
  /** true = text only (no network); used so publishing is instant. */
  fast?: boolean;
  name: string;
  area?: string;
  category?: string;
  description?: string;
  bestTime?: string;
  tip?: string;
  famousFor?: string;
  lat?: number;
  lng?: number;
}): Promise<PlaceClassification> {
  const name = (input.name || "").trim();
  const area = (input.area || "").trim();
  const textBlob = [name, area, input.category, input.description, input.bestTime, input.tip, input.famousFor].filter(Boolean).join(" ");

  let types: string[] = [];
  let source = "text_heuristic";
  let fromOsm: ReturnType<typeof scoreFromCategory> = null;

  if (name && !input.fast) {
    try {
      const tags = await osmTagsFor(name, input.lat, input.lng, area);
      if (tags) {
        const guess = mapOsmTagsToCategory(tags);
        types = Object.entries(tags)
          .filter(([k]) => ["amenity", "tourism", "historic", "leisure", "natural", "shop", "waterway"].includes(k))
          .map(([k, v]) => `${k}=${v}`);
        if (guess.confidence !== "none") {
          fromOsm = scoreFromCategory(guess.category);
          source = "openstreetmap";
        }
      }
    } catch {
      /* the text heuristic below still works */
    }
  }
  if (!fromOsm) {
    const byName = guessCategoryFromName(name);
    if (byName.confidence !== "none") {
      fromOsm = scoreFromCategory(byName.category);
      if (fromOsm) fromOsm.confidence = Math.min(fromOsm.confidence, 0.55);
    }
  }

  const fromText = scoreFromText(textBlob);
  if (fromOsm && fromOsm.confidence >= fromText.confidence) {
    const vibes = new Set([...fromOsm.vibes, ...fromText.vibes]);
    let timeOfDay = fromOsm.timeOfDay;
    if (fromText.timeOfDay === "morning" && fromText.confidence >= 0.7) timeOfDay = "morning";
    if ((fromText.timeOfDay === "night" || fromText.timeOfDay === "evening-night") && fromText.confidence >= 0.7 && timeOfDay === "day") {
      timeOfDay = fromText.timeOfDay;
    }
    return { vibes: [...vibes], timeOfDay, suggestedCategory: fromOsm.suggestedCategory, source, types, confidence: Math.max(fromOsm.confidence, fromText.confidence) };
  }

  return {
    vibes: fromText.vibes.length ? fromText.vibes : ["day"],
    timeOfDay: fromText.timeOfDay === "any" ? "day" : fromText.timeOfDay,
    source: "text_heuristic",
    types,
    confidence: fromText.confidence,
  };
}

export { roadKmFromStraight, toExplorerBucket };
