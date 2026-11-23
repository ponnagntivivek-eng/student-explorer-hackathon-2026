import { TtlCache } from "../places/http.server.ts";
import { DEFAULT_BIAS, haversine, inCoverage, withCityContext, type LatLng } from "../places/region.ts";

/**
 * Optional Google Maps (Places API, "New") lookup for the EXACT spot, address and photos of a place.
 * Turned on only when GOOGLE_MAPS_API_KEY is set in the server environment; the key never reaches the browser.
 * Without a key every caller falls back to the free OpenStreetMap / Wikimedia sources.
 */
/** Search bias only (ranks nearby results first). It never restricts results to one city. */
const biasCircle = (near?: LatLng | null, radius = 50000) => ({ circle: { center: { latitude: (near || DEFAULT_BIAS).lat, longitude: (near || DEFAULT_BIAS).lng }, radius } });

const key = () => (typeof process !== "undefined" && process.env.GOOGLE_MAPS_API_KEY) || "";
export const googleEnabled = () => Boolean(key());

export type GooglePlace = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photoCount: number;
  attribution: string;
};

type RawPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  photos?: { name?: string; authorAttributions?: { displayName?: string }[] }[];
};

const findCache = new TtlCache<GooglePlace | null>(6 * 3600_000, 400);

/** Best Google Maps match for "name, area" within the configured coverage, or null. */
export async function googleFindPlace(name: string, area: string, near?: LatLng | null): Promise<GooglePlace | null> {
  const k = key();
  if (!k || !name.trim()) return null;
  const textQuery = withCityContext([name.trim(), area.trim()].filter(Boolean).join(", "));
  return findCache.wrap(`${textQuery.toLowerCase()}|${near ? near.lat.toFixed(1) + "," + near.lng.toFixed(1) : ""}`, async () => {
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": k,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.photos",
        },
        body: JSON.stringify({
          textQuery,
          regionCode: "IN",
          maxResultCount: 1,
          locationBias: biasCircle(near, 50000),
        }),
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { places?: RawPlace[] };
      const p = data.places?.[0];
      const lat = p?.location?.latitude;
      const lng = p?.location?.longitude;
      if (!p?.id || typeof lat !== "number" || typeof lng !== "number") return null;
      // Accept any place inside the configured coverage (all of India by default).
      if (!inCoverage(lat, lng)) return null;
      return {
        placeId: p.id,
        name: p.displayName?.text || name,
        address: (p.formattedAddress || "").replace(/,\s*India$/i, ""),
        lat,
        lng,
        photoCount: Math.min(4, p.photos?.length ?? 0),
        attribution: p.photos?.[0]?.authorAttributions?.[0]?.displayName || "",
      };
    } catch {
      return null;
    }
  });
}

/** Geocode a free-text address/place strictly around Bengaluru via Google Geocoding API. */

/** Up to N Google Places matches in Bengaluru for a free-text query (for the user to pick the right pin). */
export async function googleSearchPlaces(name: string, area = "", max = 5, near?: LatLng | null): Promise<GooglePlace[]> {
  const k = key();
  if (!k || !name.trim()) return [];
  const textQuery = withCityContext([name.trim(), area.trim()].filter(Boolean).join(", "));
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": k,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.photos",
      },
      body: JSON.stringify({
        textQuery,
        regionCode: "IN",
        maxResultCount: Math.min(8, Math.max(1, max)),
        locationBias: biasCircle(near, 45000),
      }),
      signal: AbortSignal.timeout(5500),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { places?: RawPlace[] };
    const out: GooglePlace[] = [];
    for (const p of data.places ?? []) {
      const lat = p?.location?.latitude;
      const lng = p?.location?.longitude;
      if (!p?.id || typeof lat !== "number" || typeof lng !== "number") continue;
      if (lat < 12.70 || lat > 13.25 || lng < 77.30 || lng > 77.85) continue;
      out.push({
        placeId: p.id,
        name: p.displayName?.text || name,
        address: (p.formattedAddress || "").replace(/,\s*India$/i, ""),
        lat,
        lng,
        photoCount: Math.min(4, p.photos?.length ?? 0),
        attribution: p.photos?.[0]?.authorAttributions?.[0]?.displayName || "",
      });
    }
    return out;
  } catch {
    return [];
  }
}

export async function googleGeocode(query: string, near?: LatLng | null): Promise<{ lat: number; lng: number; formattedAddress: string; name: string; provider: string } | null> {
  const k = key();
  if (!k || !query.trim()) return null;
  const q = withCityContext(query.trim());
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}` +
      `&key=${encodeURIComponent(k)}&region=in&components=${encodeURIComponent("country:IN")}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      results?: {
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
        address_components?: { long_name?: string; short_name?: string; types?: string[] }[];
      }[];
    };
    if (data.status !== "OK" || !data.results?.length) return null;
    // Rank by closeness to the visitor / default centre (ranking only), and drop anything outside the coverage.
    const centre = near || DEFAULT_BIAS;
    const scored = data.results
      .map((r) => {
        const lat = r.geometry?.location?.lat;
        const lng = r.geometry?.location?.lng;
        if (typeof lat !== "number" || typeof lng !== "number" || !inCoverage(lat, lng)) return null;
        const km = haversine(centre, { lat, lng });
        const score = 60 - Math.min(40, km / 10);
        return { lat, lng, addr: r.formatted_address || q, score };
      })
      .filter(Boolean) as { lat: number; lng: number; addr: string; score: number }[];
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best) return null;
    return {
      lat: best.lat,
      lng: best.lng,
      formattedAddress: best.addr.replace(/,\s*India$/i, ""),
      name: query.trim(),
      provider: "google_geocoding",
    };
  } catch {
    return null;
  }
}

/** The URL (on OUR server) that shows a Google Maps photo of a place. Photo links expire, so we keep the place id. */
export const googlePhotoUrl = (placeId: string, index = 0) => `/api/maps/gphoto?pid=${encodeURIComponent(placeId)}&i=${index}`;

const photoNames = new TtlCache<string[]>(12 * 3600_000, 500);

/** Streams one Google Maps photo (key stays on the server). */
export async function googlePhotoResponse(placeId: string, index: number, width = 900): Promise<Response> {
  const k = key();
  if (!k || !/^[\w-]{10,200}$/.test(placeId)) return new Response("Not available", { status: 404 });
  const names = await photoNames.wrap(placeId, async () => {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { "X-Goog-Api-Key": k, "X-Goog-FieldMask": "photos.name" },
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const d = (await res.json()) as { photos?: { name?: string }[] };
    return (d.photos ?? []).map((x) => x.name || "").filter(Boolean).slice(0, 4);
  }).catch(() => [] as string[]);
  const ref = names[Math.min(Math.max(0, index), names.length - 1)];
  if (!ref) return new Response("No photo", { status: 404 });
  const img = await fetch(`https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${Math.min(1600, Math.max(200, width))}&key=${encodeURIComponent(k)}`, {
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!img || !img.ok) return new Response("No photo", { status: 404 });
  return new Response(img.body, { headers: { "Content-Type": img.headers.get("content-type") || "image/jpeg", "Cache-Control": "public, max-age=43200" } });
}
