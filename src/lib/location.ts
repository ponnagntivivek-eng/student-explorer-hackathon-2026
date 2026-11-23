import { categoryEmoji, categoryLabel } from "@/lib/places/categories";

/** Free reverse geocoding (OpenStreetMap Nominatim, called through our own server so we can cache it). */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
    const data = res.ok ? await res.json() : null;
    return data?.success && data.formattedAddress ? data.formattedAddress : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export type GeocodeCandidate = {
  lat: number;
  lng: number;
  formattedAddress: string;
  name: string;
  provider: string;
  score?: number;
};

/** Forward geocoding via our server (Google when configured, else OSM) — Bengaluru only. */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress?: string; provider?: string } | null> {
  try {
    const res = await fetch(`/api/maps/geocode?query=${encodeURIComponent(address)}`);
    const data = res.ok ? await res.json() : null;
    return data?.success ? { lat: Number(data.lat), lng: Number(data.lng), formattedAddress: data.formattedAddress, provider: data.provider } : null;
  } catch {
    return null;
  }
}

/** Multiple ranked pins so the user can pick the correct location. */
export async function geocodeAddressCandidates(address: string): Promise<GeocodeCandidate[]> {
  try {
    const res = await fetch(`/api/maps/geocode?query=${encodeURIComponent(address)}`);
    const data = res.ok ? await res.json() : null;
    if (!data?.success) return [];
    if (Array.isArray(data.candidates) && data.candidates.length) return data.candidates as GeocodeCandidate[];
    return [{ lat: Number(data.lat), lng: Number(data.lng), formattedAddress: data.formattedAddress || address, name: data.name || address, provider: data.provider || "unknown" }];
  } catch {
    return [];
  }
}

/** Browser GPS first; falls back to the server's network-based estimate when GPS is blocked. */
export async function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  const gps = () =>
    new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error(err.message || "Could not get location")),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      );
    });
  try {
    return await gps();
  } catch (e) {
    try {
      const res = await fetch("/api/maps/ip-location");
      const d = res.ok ? await res.json() : null;
      if (d?.success) return { lat: d.lat, lng: d.lng };
    } catch {
      /* ignore */
    }
    throw e;
  }
}

/** Straight-line distance in km. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

const GRADIENTS: Record<string, [string, string]> = {
  nature: ["#86efac", "#15803d"],
  parks_gardens: ["#bbf7d0", "#16a34a"],
  waterfalls: ["#bae6fd", "#0369a1"],
  beaches: ["#fde68a", "#0ea5e9"],
  historical: ["#fcd34d", "#92400e"],
  spiritual: ["#fed7aa", "#c2410c"],
  museums_education: ["#c7d2fe", "#4338ca"],
  shopping: ["#fbcfe8", "#be185d"],
  food: ["#fecaca", "#dc2626"],
  entertainment: ["#ddd6fe", "#7c3aed"],
  adventure: ["#fdba74", "#b91c1c"],
  tourist_attractions: ["#99f6e4", "#0f766e"],
};

/** Placeholder image shown when a place has no photo. It depends on the category. */
export function defaultPhotoForCategory(category: string): string {
  const [a, b] = GRADIENTS[category] ?? ["#e2e8f0", "#64748b"];
  const label = categoryLabel(category).replace(/&/g, "and");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="145" font-size="96" text-anchor="middle" dominant-baseline="middle">${categoryEmoji(category)}</text><text x="200" y="240" font-size="20" font-family="sans-serif" fill="#ffffff" text-anchor="middle">${label}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/** True when the stored image is only the old generated placeholder. */
export function isPlaceholderPhoto(photo: string | null | undefined): boolean {
  return !photo || photo.startsWith("data:image/svg+xml");
}

/** Free OpenStreetMap map embed (no API key). */
export function osmEmbedUrl(lat: number, lng: number): string {
  const pad = 0.008;
  const bbox = [lng - pad, lat - pad, lng + pad, lat + pad].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function osmViewUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

/** Free OSM directions (OSRM engine). Uses "from my location" when no start point is given. */
export function osmDirectionsUrl(toLat: number, toLng: number, from?: { lat: number; lng: number } | null): string {
  const route = `${from ? `${from.lat},${from.lng}` : ""};${toLat},${toLng}`;
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(route)}`;
}

/** Google Maps directions link (no API key). Google Maps is used only for directions. */
export function googleDirectionsUrl(toLat: number, toLng: number, from?: { lat: number; lng: number } | null): string {
  const params = new URLSearchParams({ api: "1", destination: `${toLat},${toLng}`, travelmode: "transit" });
  if (from) params.set("origin", `${from.lat},${from.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
