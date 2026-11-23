/**
 * Verified-visit rules (pure functions, unit tested).
 *
 * The map pin of a place is often NOT where people actually stand: an area-only pin can be 1-2 km off, a park has
 * several gates, a food street is 300 m long. A fixed 250 m rule therefore rejected honest visitors (pin wrong) and,
 * for places with a correct pin, was also easy to game from the road outside. The rule is now:
 *
 *   allowed distance = pin tolerance (by pin quality + kind of place) + the GPS error the phone reports (capped)
 *
 * - "exact" pin, small venue (cafe, shop)      ->  250 m (a visit anywhere in the place or its street counts)
 * - "exact" pin, large site (park, campus, fort, lake, mall, trek) -> 800 m
 * - area-level pin (user typed only an area)  -> 2.5 km, and the visit is flagged so the pin can be corrected
 * A visit inside the tight "core" radius earns full XP. A visit that is only accepted because the pin is vague is
 * still rewarded (the visitor did nothing wrong) but is recorded as "pin_uncertain" and creates an admin report with
 * the visitor's coordinates, so the map fixes itself after a couple of honest visits.
 */

export type PinQuality = "exact" | "area" | "unknown";

export type VisitPlace = {
  category?: string;
  name?: string;
  locationPrecision?: string;
  verifiedPin?: boolean;
  radiusM?: number; // optional admin override
};

const LARGE_SITE = /\b(park|garden|lake|campus|university|college|fort|palace|hills?|nandi|trek|mall|market|street|lane|beach|temple|museum|stadium|zoo|wonderla|botanical|food street|complex|layout)\b/i;
const LARGE_CATEGORIES = new Set(["nature", "getaways", "attractions"]);

export function pinQuality(place: VisitPlace): PinQuality {
  if (place.verifiedPin === true) return "exact";
  if (place.locationPrecision === "area") return "area";
  if (place.locationPrecision === "exact") return "exact";
  return "unknown";
}

export function isLargeSite(place: VisitPlace): boolean {
  return LARGE_CATEGORIES.has(String(place.category || "").toLowerCase()) || LARGE_SITE.test(String(place.name || ""));
}

/** Radius (m) around the pin inside which a visit counts as "at the place". */
export function coreRadiusM(place: VisitPlace): number {
  if (typeof place.radiusM === "number" && place.radiusM >= 50 && place.radiusM <= 5000) return place.radiusM;
  const q = pinQuality(place);
  if (q === "area") return 2500;
  if (q === "unknown") return isLargeSite(place) ? 900 : 400; // built-in pins were hand-placed, give slack
  return isLargeSite(place) ? 800 : 250;
}

export type VisitDecision =
  | { ok: true; distanceM: number; allowedM: number; strength: "precise" | "nearby" | "pin_uncertain"; xpFactor: number; reportPin: boolean }
  | { ok: false; reason: "poor_gps" | "too_far" | "impossible_travel"; message: string; distanceM?: number; allowedM?: number };

export function decideVisit(args: {
  distanceM: number;
  accuracyM: number;
  place: VisitPlace;
}): VisitDecision {
  const { distanceM, accuracyM, place } = args;
  if (!Number.isFinite(accuracyM) || accuracyM < 0 || accuracyM > 250) {
    return { ok: false, reason: "poor_gps", message: "Your GPS signal is too weak (" + Math.round(accuracyM || 0) + " m). Step outside or near a window, wait a few seconds and try again." };
  }
  const core = coreRadiusM(place);
  const gpsSlack = Math.min(accuracyM, 150); // trust the phone's own error estimate, but never more than 150 m of it
  const allowed = core + gpsSlack;
  if (distanceM > allowed) {
    const m = distanceM >= 1000 ? (distanceM / 1000).toFixed(1) + " km" : Math.round(distanceM) + " m";
    const limit = allowed >= 1000 ? (allowed / 1000).toFixed(1) + " km" : Math.round(allowed) + " m";
    return { ok: false, reason: "too_far", distanceM, allowedM: allowed, message: `You are about ${m} from this place's map pin (needs to be within ${limit}). Walk closer and try again. If you ARE at the place and the pin is wrong, use “Report wrong pin”.` };
  }
  const q = pinQuality(place);
  if (q === "area") {
    // Accepted only because the pin is vague. Full credit for the person, flag the pin for review.
    const precise = distanceM <= 250;
    return { ok: true, distanceM, allowedM: allowed, strength: precise ? "nearby" : "pin_uncertain", xpFactor: 1, reportPin: !precise };
  }
  const preciseLimit = Math.min(core, isLargeSite(place) ? 400 : 200);
  if (distanceM <= preciseLimit + gpsSlack) return { ok: true, distanceM, allowedM: allowed, strength: "precise", xpFactor: 1, reportPin: false };
  // inside the generous radius but beyond the tight one: still counts; a repeat pattern suggests the pin is off
  return { ok: true, distanceM, allowedM: allowed, strength: "nearby", xpFactor: 1, reportPin: distanceM > core * 0.75 };
}

/** Physically impossible hop between two verified visits (anti-spoofing). */
export function impossibleTravel(prev: { lat: number; lng: number; atMs: number } | null, next: { lat: number; lng: number; atMs: number }): boolean {
  if (!prev) return false;
  const hours = Math.max(1 / 3600, (next.atMs - prev.atMs) / 3_600_000);
  const km = haversineKmLocal(prev.lat, prev.lng, next.lat, next.lng);
  if (km < 0.3) return false;
  return km / hours > 130; // faster than ~130 km/h between two points is not a student on a bus
}

function haversineKmLocal(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Median-based pin check: when several different visitors verify at the same spot and that spot is consistently far
 * from the stored pin, propose the median as the corrected pin.
 */
export function suggestPinFromVisits(pin: { lat: number; lng: number }, visits: { lat: number; lng: number; accuracy: number }[]): { lat: number; lng: number; offsetM: number; n: number } | null {
  const good = visits.filter((v) => v.accuracy <= 60);
  if (good.length < 2) return null;
  const med = (arr: number[]) => { const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const lat = med(good.map((v) => v.lat)), lng = med(good.map((v) => v.lng));
  const spread = Math.max(...good.map((v) => haversineKmLocal(lat, lng, v.lat, v.lng))) * 1000;
  if (spread > 400) return null; // visitors disagree with each other: do not guess
  const offsetM = haversineKmLocal(pin.lat, pin.lng, lat, lng) * 1000;
  if (offsetM < 150) return null;
  return { lat, lng, offsetM, n: good.length };
}
