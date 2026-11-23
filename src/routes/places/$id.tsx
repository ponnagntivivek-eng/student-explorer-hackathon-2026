import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPlace } from "@/lib/api/places";
import { listComments, addComment } from "@/lib/api/comments";
import { listPlacePhotos, addPlacePhoto } from "@/lib/api/photos";
import { PhotoCredit } from "@/components/PhotoCredit";
import { defaultPhotoForCategory, googleDirectionsUrl, osmEmbedUrl, osmViewUrl, getCurrentPosition, reverseGeocode, geocodeAddress } from "@/lib/location";
import { categoryEmoji, categoryLabel } from "@/lib/places/categories";
import type { CommentRow, Place, PlacePhoto } from "@/lib/db/schema";

export const Route = createFileRoute("/places/$id")({ component: PlaceDetail });

function PlaceDetail() {
  const { id } = Route.useParams();
  const placeId = Number(id);
  const [place, setPlace] = useState<Place | null | undefined>(undefined);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [newComment, setNewComment] = useState("");
  const [routeStart, setRouteStart] = useState("");
  const [routeMode, setRouteMode] = useState<"driving" | "walking" | "cycling">("driving");
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [routeResult, setRouteResult] = useState<{ distanceKm: number; durationMinutes: number; instructions: string[]; provider: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      setPlace((await getPlace({ data: { id: placeId } })) as Place | null);
      setComments((await listComments({ data: { placeId } })) as CommentRow[]);
      setPhotos((await listPlacePhotos({ data: { placeId } })) as PlacePhoto[]);
    } catch (e) {
      console.error(e);
      setPlace(null);
    }
  }, [placeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function useRouteStartLocation() {
    try {
      const position = await getCurrentPosition();
      const address = await reverseGeocode(position.lat, position.lng);
      setRouteStart(address);
      toast.success("Starting location detected");
    } catch {
      toast.error("Could not detect your location. Enter a starting address instead.");
    }
  }

  async function calculateRoute() {
    if (!routeStart.trim()) {
      setRouteError("Enter your starting location or use your current location.");
      return;
    }
    if (!place || place.latitude === null || place.longitude === null) {
      setRouteError("This destination does not have coordinates yet.");
      return;
    }
    setRouteLoading(true);
    setRouteError("");
    setRouteResult(null);
    try {
      const from = await geocodeAddress(routeStart.trim());
      if (!from) throw new Error("Starting location not found. Try a more complete address.");
      const response = await fetch("/api/maps/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: { lat: place.latitude, lng: place.longitude }, mode: routeMode }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Could not calculate this route.");
      setRouteResult(data.route);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : "Route service unavailable.");
    } finally {
      setRouteLoading(false);
    }
  }

  async function submitComment() {
    if (!newComment.trim()) return;
    try {
      await addComment({ data: { placeId, content: newComment.trim() } });
      setNewComment("");
      void refresh();
    } catch {
      toast.error("Please sign in first (top right → Sign in) to comment.");
    }
  }

  function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4_000_000) return toast.error("Photo must be under 4 MB");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await addPlacePhoto({ data: { placeId, data: reader.result as string, mimeType: file.type || "image/jpeg" } });
        toast.success("Photo added");
        void refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not upload photo");
      }
    };
    reader.readAsDataURL(file);
  }

  if (place === undefined) return <PageShell><p>Loading…</p></PageShell>;
  if (place === null) return <PageShell><p>Place not found.</p></PageShell>;

  const hasCoords = place.latitude !== null && place.longitude !== null;
  const mapUrl = hasCoords
    ? osmViewUrl(place.latitude as number, place.longitude as number)
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(place.address)}`;

  return (
    <PageShell width="max-w-3xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{place.name}</h1>
        <p className="text-sm text-slate-600">{categoryEmoji(place.category)} {categoryLabel(place.category)}</p>
        <div>
          <img
            src={place.photo_data || defaultPhotoForCategory(place.category)}
            alt={place.name}
            className="h-64 w-full rounded object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = defaultPhotoForCategory(place.category);
            }}
          />
          <PhotoCredit place={place} className="mt-1" />
        </div>
        <p>{place.description}</p>
        {place.description_source_url && (
          <p className="-mt-4 text-xs text-slate-500">
            Description source: <a href={place.description_source_url} target="_blank" rel="noreferrer" className="underline">{place.description_source_url.includes("wikipedia") ? "Wikipedia (CC BY-SA)" : "OpenStreetMap contributors (ODbL)"}</a>
          </p>
        )}
        <p className="text-sm text-slate-500">{place.address}</p>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Map &amp; directions</h2>
          {hasCoords ? (
            <>
              <p className="text-sm text-slate-500">Coordinates: {(place.latitude as number).toFixed(5)}, {(place.longitude as number).toFixed(5)}</p>
              <iframe title={`Map of ${place.name}`} src={osmEmbedUrl(place.latitude as number, place.longitude as number)} className="h-64 w-full rounded border border-slate-200" loading="lazy" />
            </>
          ) : (
            <p className="text-sm text-slate-500">This place has no saved coordinates yet.</p>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            <a href={mapUrl} target="_blank" rel="noreferrer" className="text-teal-700 underline">Open in OpenStreetMap</a>
            {hasCoords && (
              <a href={googleDirectionsUrl(place.latitude as number, place.longitude as number)} target="_blank" rel="noreferrer" className="text-teal-700 underline">Get directions</a>
            )}
          </div>
          <p className="text-xs text-slate-400">Map data © OpenStreetMap contributors</p>
          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 p-3">
            <h3 className="font-semibold">Calculate a real route</h3>
            <div className="flex flex-wrap gap-2">
              <input value={routeStart} onChange={(event) => setRouteStart(event.target.value)} placeholder="Starting location" className="h-10 min-w-48 flex-1 rounded-md border border-slate-300 px-3 text-sm" />
              <Button type="button" variant="outline" onClick={useRouteStartLocation}>Use my location</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={routeMode} onChange={(event) => setRouteMode(event.target.value as typeof routeMode)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                <option value="driving">Driving</option>
                <option value="walking">Walking</option>
                <option value="cycling">Cycling</option>
              </select>
              <Button type="button" onClick={calculateRoute} disabled={routeLoading}>{routeLoading ? "Calculating…" : "Calculate route"}</Button>
            </div>
            {routeError && <p className="text-sm text-red-600" role="alert">{routeError}</p>}
            {routeResult && (
              <div className="space-y-2 text-sm" aria-live="polite">
                <p className="font-medium">{routeResult.distanceKm.toFixed(2)} km · {routeResult.durationMinutes >= 60 ? `${Math.floor(routeResult.durationMinutes / 60)}h ${routeResult.durationMinutes % 60}m` : `${routeResult.durationMinutes} min`}</p>
                <p className="text-xs text-slate-500">Calculated by {routeResult.provider}. Times are estimates and may change with traffic or path conditions.</p>
                {routeResult.instructions.length > 0 && (
                  <ol className="list-decimal space-y-1 pl-5">
                    {routeResult.instructions.map((instruction, index) => <li key={`${index}-${instruction}`}>{instruction}</li>)}
                  </ol>
                )}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Photos</h2>
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (<img key={p.id} src={p.data} alt="place" className="h-24 w-32 rounded object-cover" />))}
          </div>
          <input type="file" accept="image/*" onChange={uploadPhoto} className="mt-2 text-sm" />
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Comments</h2>
          <div className="space-y-3">
            {comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
            {comments.map((c) => (
              <div key={c.id} className="rounded border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">{c.author}</p>
                <p>{c.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment…" />
            <Button onClick={submitComment}>Post comment</Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
