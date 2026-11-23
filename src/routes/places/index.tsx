import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { PhotoCredit } from "@/components/PhotoCredit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listPlaces } from "@/lib/api/places";
import { defaultPhotoForCategory, distanceKm, getCurrentPosition } from "@/lib/location";
import { PLACE_CATEGORIES, categoryEmoji, categoryLabel } from "@/lib/places/categories";
import type { Place } from "@/lib/db/schema";

export const Route = createFileRoute("/places/")({ component: PlacesHome });

function PlacesHome() {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    listPlaces({ data: { status: "approved" } })
      .then((rows) => setPlaces(rows as Place[]))
      .catch(() => {
        setError(true);
        setPlaces([]);
      });
  }, []);

  async function showNearby() {
    setLocating(true);
    try {
      setHere(await getCurrentPosition());
    } catch {
      toast.error("Location permission was not granted. Allow location in your browser to see nearby places.");
    } finally {
      setLocating(false);
    }
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (places ?? [])
      .filter((p) => (category === "all" ? true : p.category === category))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.address ?? "").toLowerCase().includes(q))
      .map((p) => ({ p, km: here && p.latitude !== null && p.longitude !== null ? distanceKm(here.lat, here.lng, p.latitude, p.longitude) : null }));
    if (here) list.sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
    return list;
  }, [places, query, category, here]);

  return (
    <PageShell width="max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Places</h1>
        <div className="flex gap-2">
          <Link to="/budget" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">Budget calculator</Link>
          <Link to="/places/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">+ Add a place</Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Input placeholder="Search places by name…" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-48 flex-1" aria-label="Search places" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" aria-label="Filter by category">
          <option value="all">All categories</option>
          {PLACE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
          ))}
        </select>
        <Button variant={here ? "default" : "outline"} onClick={here ? () => setHere(null) : showNearby} disabled={locating}>
          {locating ? "Locating…" : here ? "📍 Nearby on — turn off" : "📍 Show nearby"}
        </Button>
      </div>

      {places === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : error ? (
        <p className="text-red-600">Could not load places. Please refresh the page.</p>
      ) : places.length === 0 ? (
        <p className="text-slate-500">No approved places yet. Add the first one to get started!</p>
      ) : shown.length === 0 ? (
        <p className="text-slate-500">No places match your search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map(({ p, km }) => (
            <Link key={p.id} to="/places/$id" params={{ id: String(p.id) }} className="overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-lg">
              <img
                src={p.photo_data || defaultPhotoForCategory(p.category)}
                alt={p.name}
                loading="lazy"
                className="h-40 w-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = defaultPhotoForCategory(p.category);
                }}
              />
              <div className="p-3">
                <h2 className="font-semibold">{p.featured && <span className="mr-1">⭐</span>}{p.name}</h2>
                <p className="text-xs text-slate-500">
                  {categoryEmoji(p.category)} {categoryLabel(p.category)}
                  {km !== null && <> · {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} away</>}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                <PhotoCredit place={p} className="mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
