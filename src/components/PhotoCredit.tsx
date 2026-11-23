import type { Place } from "@/lib/db/schema";

/** Attribution line for photos found automatically (required by the Wikimedia licences). */
export function PhotoCredit({ place, className = "" }: { place: Pick<Place, "photo_origin" | "photo_author" | "photo_license" | "photo_license_url" | "photo_source_url">; className?: string }) {
  if (place.photo_origin !== "wikipedia" && place.photo_origin !== "commons") return null;
  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      Photo: {place.photo_author || "Unknown author"}
      {place.photo_license && (
        <>
          {" · "}
          {place.photo_license_url ? (
            <a href={place.photo_license_url} target="_blank" rel="noreferrer" className="underline">{place.photo_license}</a>
          ) : (
            place.photo_license
          )}
        </>
      )}
      {place.photo_source_url && (
        <>
          {" · "}
          <a href={place.photo_source_url} target="_blank" rel="noreferrer" className="underline">Wikimedia Commons</a>
        </>
      )}
    </p>
  );
}
