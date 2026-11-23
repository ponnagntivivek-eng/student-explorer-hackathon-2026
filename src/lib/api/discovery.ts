/** Browser-side helpers that call our own server routes (which talk to the free public APIs). */
import type { CategoryGuess, OsmTags, PlaceCategoryId } from "@/lib/places/categories";

export type PhotoCandidateDto = {
  url: string;
  source: "wikipedia" | "commons";
  sourcePageUrl: string;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  relevance: number;
  reason: string;
  uploadedAt?: string;
  width?: number;
  height?: number;
};

export type DiscoverDto = {
  success: true;
  found: boolean;
  match?: { osmType: "node" | "way" | "relation"; osmId: number; name: string; lat: number; lng: number; osmUrl: string; tags: OsmTags };
  lat?: number;
  lng?: number;
  address?: string;
  category: CategoryGuess & { category: PlaceCategoryId };
  description?: string;
  descriptionSource?: { label: string; url: string };
  photos: PhotoCandidateDto[];
  selectedPhotoUrl?: string;
  warnings: string[];
};

export type NearbyDto = { osmType: string; osmId: number; name: string; lat: number; lng: number; distanceM: number; category: CategoryGuess };

async function getJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Could not reach the server. Check your internet connection.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) throw new Error(data?.error || (res.status === 401 ? "Please sign in first." : "Something went wrong. Please try again."));
  return data as T;
}

export function discoverPlaceInfo(p: { name: string; lat?: number | null; lng?: number | null; address?: string; refresh?: boolean }) {
  const q = new URLSearchParams({ name: p.name });
  if (p.lat != null && p.lng != null) {
    q.set("lat", String(p.lat));
    q.set("lng", String(p.lng));
  }
  if (p.address) q.set("address", p.address);
  if (p.refresh) q.set("refresh", "1");
  return getJson<DiscoverDto>(`/api/places/discover?${q}`);
}

export async function nearbyOsmPlaces(lat: number, lng: number): Promise<NearbyDto[]> {
  const d = await getJson<{ places: NearbyDto[] }>(`/api/places/nearby-osm?lat=${lat}&lng=${lng}&radius=600`);
  return d.places;
}
