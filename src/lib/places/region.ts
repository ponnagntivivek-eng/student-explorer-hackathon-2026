/**
 * Geographic coverage for place search. Nothing in the app is hard-wired to one city any more.
 *
 *   GEO_COUNTRY_CODES  comma list of ISO country codes sent to Nominatim (default "in")
 *   GEO_BOUNDS         "south,west,north,east" — results outside are rejected (default: all of India)
 *   GEO_BIAS_CENTER    "lat,lng" — only used to RANK nearby results first when the visitor gave no location
 *   DEFAULT_CITY       optional city appended to short queries that name no place (default: none)
 */
const env = (typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>;

const nums = (v: string | undefined, n: number): number[] | null => {
  const a = String(v ?? "").split(",").map((x) => Number(x.trim()));
  return a.length === n && a.every(Number.isFinite) ? a : null;
};

export const COUNTRY_CODES = (env.GEO_COUNTRY_CODES || env.PLACES_COUNTRY_CODES || "in").trim();
const b = nums(env.GEO_BOUNDS, 4) ?? [6.0, 68.0, 37.5, 97.5];
export const COVERAGE = { south: b[0], west: b[1], north: b[2], east: b[3] };
const c = nums(env.GEO_BIAS_CENTER, 2) ?? [12.9716, 77.5946];
export const DEFAULT_BIAS = { lat: c[0], lng: c[1] };
export const DEFAULT_CITY = (env.DEFAULT_CITY || "").trim();

export type LatLng = { lat: number; lng: number };

export function inCoverage(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= COVERAGE.south && lat <= COVERAGE.north && lng >= COVERAGE.west && lng <= COVERAGE.east;
}

export function validNear(v: unknown): LatLng | null {
  const o = v as Partial<LatLng> | null;
  return o && Number.isFinite(o.lat) && Number.isFinite(o.lng) && inCoverage(o.lat as number, o.lng as number) ? { lat: o.lat as number, lng: o.lng as number } : null;
}

/** Nominatim viewbox ("west,north,east,south") around a centre. Used unbounded: it only ranks local results first. */
export function biasViewbox(center: LatLng = DEFAULT_BIAS, deg = 0.9): string {
  return `${(center.lng - deg).toFixed(4)},${(center.lat + deg).toFixed(4)},${(center.lng + deg).toFixed(4)},${(center.lat - deg).toFixed(4)}`;
}

/** Add the configured default city only when one is configured and the text names no city of its own. */
export function withCityContext(q: string): string {
  const t = q.trim();
  return DEFAULT_CITY && !t.toLowerCase().includes(DEFAULT_CITY.toLowerCase()) && t.split(",").length < 3 ? `${t}, ${DEFAULT_CITY}` : t;
}

export function haversine(a: LatLng, b2: LatLng): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b2.lat - a.lat) * rad, dLng = (b2.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b2.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
