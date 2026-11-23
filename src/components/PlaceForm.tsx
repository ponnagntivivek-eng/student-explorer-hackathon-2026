import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentPosition, reverseGeocode, geocodeAddress, geocodeAddressCandidates, defaultPhotoForCategory, type GeocodeCandidate } from "@/lib/location";
import { createPlace } from "@/lib/api/places";
import { discoverPlaceInfo, nearbyOsmPlaces, type DiscoverDto, type NearbyDto, type PhotoCandidateDto } from "@/lib/api/discovery";
import { PLACE_CATEGORIES, categoryLabel } from "@/lib/places/categories";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string(),
  address: z.string().min(1, "Address is required"),
});
type Values = z.infer<typeof schema>;

/** "none" = no photo, "upload" = own file, otherwise the URL of a suggested photo */
type PhotoChoice = { kind: "none" } | { kind: "upload"; data: string } | { kind: "auto"; photo: PhotoCandidateDto };

export function PlaceForm({ onCreated }: { onCreated?: () => void }) {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [lookingNearby, setLookingNearby] = useState(false);
  const [nearby, setNearby] = useState<NearbyDto[] | null>(null);
  const [info, setInfo] = useState<DiscoverDto | null>(null);
  const [infoError, setInfoError] = useState("");
  const [photo, setPhoto] = useState<PhotoChoice>({ kind: "none" });
  const [osm, setOsm] = useState<{ type: "node" | "way" | "relation"; id: number; tags: Record<string, string> } | null>(null);
  const [descSource, setDescSource] = useState<string | null>(null);
  const [geoCandidates, setGeoCandidates] = useState<GeocodeCandidate[]>([]);
  const [findingCoords, setFindingCoords] = useState(false);
  const [locLabel, setLocLabel] = useState("");

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", description: "", category: "auto", address: "" } });
  const errors = form.formState.errors;
  const category = form.watch("category");

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const addr = await reverseGeocode(pos.lat, pos.lng);
      setLat(pos.lat);
      setLng(pos.lng);
      form.setValue("address", addr, { shouldValidate: true });
      toast.success("Location detected");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not get current location. Type the address instead.");
    } finally {
      setLocating(false);
    }
  }

  async function lookupAddress() {
    const addr = form.getValues("address");
    const name = form.getValues("name");
    if (!addr && !name) return toast.error("Type a place name and address / area first");
    const raw = [name, addr].filter(Boolean).join(", ");
    const q = /bengaluru|bangalore|karnataka/i.test(raw) ? raw : `${raw}, Bengaluru, Karnataka`;
    setFindingCoords(true);
    setGeoCandidates([]);
    try {
      const list = await geocodeAddressCandidates(q);
      if (!list.length) {
        toast.error("No Bengaluru match. Add the area (e.g. Mathikere, MSR College Road) and try again.");
        return;
      }
      setGeoCandidates(list);
      const best = list[0];
      setLat(best.lat);
      setLng(best.lng);
      setLocLabel(best.formattedAddress);
      toast.success(
        list.length > 1
          ? `Found ${list.length} possible locations — pick the correct pin below`
          : `Location set: ${best.formattedAddress}`,
      );
    } catch {
      toast.error("Could not look up that location. Check the spelling and try again.");
    } finally {
      setFindingCoords(false);
    }
  }

  function pickCandidate(c: GeocodeCandidate) {
    setLat(c.lat);
    setLng(c.lng);
    setLocLabel(c.formattedAddress);
    toast.success(`Pin set to: ${c.formattedAddress}`);
  }

  async function findNearby() {
    if (lat === null || lng === null) return toast.error("Set a location first (use “Find coords” or “Use current location”).");
    setLookingNearby(true);
    try {
      const list = await nearbyOsmPlaces(lat, lng);
      setNearby(list);
      if (!list.length) toast.info("No named places found within 600 m. You can type the name yourself.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not look up nearby places");
    } finally {
      setLookingNearby(false);
    }
  }

  async function autoFill(override?: { name: string; lat?: number; lng?: number }, refreshPhotos = false) {
    const name = (override?.name ?? form.getValues("name")).trim();
    if (name.length < 2) return toast.error("Type the place name first.");
    setDetecting(true);
    setInfoError("");
    try {
      const d = await discoverPlaceInfo({ name, lat: override?.lat ?? lat, lng: override?.lng ?? lng, address: form.getValues("address"), refresh: refreshPhotos });
      setInfo(d);
      if (d.lat != null && d.lng != null && (lat === null || lng === null || d.found)) {
        setLat(d.lat);
        setLng(d.lng);
      }
      if (d.address && !form.getValues("address").trim()) form.setValue("address", d.address, { shouldValidate: true });
      if (d.description && !form.getValues("description")?.trim()) {
        form.setValue("description", d.description);
        setDescSource(d.descriptionSource?.url ?? null);
      }
      // Suggest the category, but never overwrite one the admin picked by hand.
      if (form.getValues("category") === "auto" && d.category.confidence !== "none") {
        form.setValue("category", d.category.category);
      }
      setOsm(d.match ? { type: d.match.osmType, id: d.match.osmId, tags: d.match.tags } : null);
      // Pick the best photo only if nothing has been chosen yet (never replace an upload).
      setPhoto((cur) => {
        if (cur.kind !== "none") return cur;
        const best = d.photos.find((p) => p.url === d.selectedPhotoUrl);
        return best ? { kind: "auto", photo: best } : cur;
      });
      if (!d.found) toast.info("This place was not found on OpenStreetMap. Please check the category and photo by hand.");
      else toast.success("Information found. Check it before saving.");
    } catch (e) {
      setInfoError(e instanceof Error ? e.message : "Auto-fill failed");
    } finally {
      setDetecting(false);
    }
  }

  function pickNearby(n: NearbyDto) {
    form.setValue("name", n.name, { shouldValidate: true });
    setLat(n.lat);
    setLng(n.lng);
    setNearby(null);
    void autoFill({ name: n.name, lat: n.lat, lng: n.lng });
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 4_000_000) return toast.error("Photo must be under 4 MB");
    const reader = new FileReader();
    reader.onload = () => setPhoto({ kind: "upload", data: reader.result as string });
    reader.readAsDataURL(file);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      let latitude = lat;
      let longitude = lng;
      if (latitude === null || longitude === null) {
        const addrQ = /bengaluru|bangalore|karnataka/i.test(values.address)
          ? values.address
          : `${values.address}, Bengaluru, Karnataka`;
        const list = await geocodeAddressCandidates([values.name, addrQ].filter(Boolean).join(", "));
        const c = list[0];
        if (c) {
          latitude = c.lat;
          longitude = c.lng;
          setGeoCandidates(list);
          setLocLabel(c.formattedAddress);
        }
      }
      await createPlace({
        data: {
          name: values.name,
          description: values.description ?? "",
          category: values.category,
          address: values.address,
          latitude,
          longitude,
          photoData: photo.kind === "upload" ? photo.data : null,
          autoPhotoUrl: photo.kind === "auto" ? photo.photo.url : null,
          osmType: osm?.type ?? null,
          osmId: osm?.id ?? null,
          osmTags: osm?.tags ?? null,
          descriptionSourceUrl: descSource,
        },
      });
      toast.success("Place saved! If you are not an admin, it will be reviewed first.");
      form.reset();
      setPhoto({ kind: "none" });
      setInfo(null);
      setOsm(null);
      setNearby(null);
      setLat(null);
      setLng(null);
      onCreated?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(/unauthor|sign/i.test(msg) || !msg ? "Please sign in first (top right → Sign in), then try again." : msg);
    } finally {
      setSubmitting(false);
    }
  });

  const previewSrc = photo.kind === "upload" ? photo.data : photo.kind === "auto" ? photo.photo.url : defaultPhotoForCategory(category === "auto" ? "other" : category);

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div>
        <div className="flex gap-2">
          <Input placeholder="Place name" {...form.register("name")} className="flex-1" />
          <Button type="button" variant="secondary" onClick={() => autoFill()} disabled={detecting}>
            {detecting ? "Searching…" : "✨ Auto-fill"}
          </Button>
        </div>
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        <p className="mt-1 text-xs text-slate-500">Auto-fill uses free OpenStreetMap, Wikipedia and Wikimedia data. You can edit everything before saving.</p>
      </div>

      {detecting && <p className="rounded bg-slate-50 p-2 text-sm text-slate-600" role="status">Looking up the place on OpenStreetMap, Wikipedia and Wikimedia Commons… this can take a few seconds.</p>}
      {infoError && <p className="rounded bg-red-50 p-2 text-sm text-red-700" role="alert">{infoError}</p>}

      {info && !detecting && (
        <div className="space-y-1 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          {info.found && info.match ? (
            <p>
              Found on OpenStreetMap:{" "}
              <a href={info.match.osmUrl} target="_blank" rel="noreferrer" className="text-teal-700 underline">{info.match.name}</a>
            </p>
          ) : (
            <p>Not found on OpenStreetMap — nothing was guessed. Choose the category yourself.</p>
          )}
          <p>
            Suggested category: <strong>{categoryLabel(info.category.category)}</strong>{" "}
            <span className="text-slate-500">({info.category.confidence === "none" ? "not sure" : info.category.reason}
            {info.category.confidenceScore !== undefined ? ` · ${Math.round(info.category.confidenceScore * 100)}% heuristic confidence` : ""})</span>
          </p>
          {info.warnings.length > 0 && <p className="text-xs text-amber-700">Some free services did not answer: results may be incomplete.</p>}
        </div>
      )}

      <Textarea placeholder="Description" {...form.register("description")} />
      {descSource && <p className="-mt-2 text-xs text-slate-500">Description from <a href={descSource} target="_blank" rel="noreferrer" className="underline">{descSource.includes("wikipedia") ? "Wikipedia (CC BY-SA)" : "OpenStreetMap contributors"}</a>.</p>}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="category">Category</label>
        <select id="category" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" {...form.register("category")}>
          <option value="auto">✨ Auto-detect (recommended)</option>
          {PLACE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex gap-2">
          <Input placeholder="Address" {...form.register("address")} className="flex-1" />
          <Button type="button" variant="outline" onClick={lookupAddress} disabled={findingCoords}>{findingCoords ? "Finding…" : "Find coords"}</Button>
        </div>
        {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={useCurrentLocation} disabled={locating}>
          {locating ? "Locating…" : "📍 Use current location"}
        </Button>
        <Button type="button" variant="outline" onClick={findNearby} disabled={lookingNearby}>
          {lookingNearby ? "Searching…" : "🔎 Places near this spot"}
        </Button>
      </div>
      {lat !== null && lng !== null && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">
            <span className="font-medium text-slate-800">Pinned location:</span>{" "}
            {locLabel || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
          </p>
          <p className="text-xs text-slate-500">Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
          <iframe
            title="Location preview"
            className="h-44 w-full rounded border border-slate-200"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
          />
          <p className="text-[11px] text-slate-500">
            Check the pin on the map. If it is wrong, choose another match below or refine the address and press Find coords again.
          </p>
        </div>
      )}
      {geoCandidates.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800">Possible matches — tap the correct one</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded border border-slate-200 bg-white p-2">
            {geoCandidates.map((c, i) => {
              const active = lat !== null && Math.abs(lat - c.lat) < 1e-5 && Math.abs((lng ?? 0) - c.lng) < 1e-5;
              return (
                <li key={`${c.lat}-${c.lng}-${i}`}>
                  <button
                    type="button"
                    onClick={() => pickCandidate(c)}
                    className={`w-full rounded px-2 py-2 text-left text-xs hover:bg-teal-50 ${active ? "bg-teal-100 ring-1 ring-teal-500" : ""}`}
                  >
                    <span className="font-medium text-slate-800">{c.name}</span>
                    <span className="mt-0.5 block text-slate-500">{c.formattedAddress}</span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-slate-400">{c.provider}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {nearby && nearby.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {nearby.map((n) => (
            <button key={`${n.osmType}${n.osmId}`} type="button" onClick={() => pickNearby(n)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50">
              {n.name} · {n.distanceM} m
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Photo</p>
        <img src={previewSrc} alt="Photo preview" className="h-40 w-full rounded object-cover" />
        {photo.kind === "auto" && (
          <p className="text-xs text-slate-500">
            Photo by {photo.photo.author} · {photo.photo.license}
            {photo.photo.uploadedAt && <> · Wikimedia upload {new Date(photo.photo.uploadedAt).toLocaleDateString()}</>} ·{" "}
            <a href={photo.photo.sourcePageUrl} target="_blank" rel="noreferrer" className="underline">Source</a>
          </p>
        )}
        {photo.kind === "none" && <p className="text-xs text-slate-500">No photo chosen. We will try to find a verified one when you save; if none exists a category picture is shown.</p>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => autoFill(undefined, true)} disabled={detecting || !form.getValues("name").trim()}>
            {detecting ? "Searching…" : "↻ Refresh photos"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => autoFill(undefined, true)} disabled={detecting || !form.getValues("name").trim()}>
            {detecting ? "Searching…" : "↻ Refresh photos"}
          </Button>
        </div>
        {info && info.photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {info.photos.map((p) => (
              <button
                key={p.url}
                type="button"
                title={`${p.title} — ${p.reason}`}
                onClick={() => setPhoto({ kind: "auto", photo: p })}
                className={`overflow-hidden rounded border-2 ${photo.kind === "auto" && photo.photo.url === p.url ? "border-teal-600" : "border-transparent"}`}
              >
                <img src={p.url} alt={p.title} className="h-16 w-24 object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        {info && info.photos.length === 0 && <p className="text-xs text-slate-500">No free photo clearly showing this place was found. You can upload your own.</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Input type="file" accept="image/*" onChange={onPhotoChange} className="flex-1" />
          {photo.kind !== "none" && <Button type="button" variant="ghost" onClick={() => setPhoto({ kind: "none" })}>Remove photo</Button>}
        </div>
      </div>

      <Button type="submit" disabled={submitting}>{submitting ? "Saving… (finding photo)" : "Save place"}</Button>
    </form>
  );
}
