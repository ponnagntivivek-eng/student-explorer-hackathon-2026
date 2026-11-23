import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { isAdmin } from "@/lib/api/roles";
import type { Place } from "@/lib/db/schema";

export const listPlaces = createServerFn({ method: "GET" })
  .inputValidator(z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).optional() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    if (data.status && data.status !== "all") {
      return sql.query<Place>(`select * from places where status = $1 order by featured desc, created_at desc`, [data.status]);
    }
    return sql.query<Place>(`select * from places order by created_at desc`);
  });

export const getPlace = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<Place>`select * from places where id = ${data.id} limit 1`;
    return rows[0] ?? null;
  });

const CATEGORY_INPUT = z.string().max(40);
const uploadSchema = z.string().max(7_000_000).refine((v) => v.startsWith("data:image/"), "Photo must be an image");

type PhotoFields = {
  photo_data: string | null;
  photo_origin: string | null;
  photo_source_url: string | null;
  photo_author: string | null;
  photo_license: string | null;
  photo_license_url: string | null;
};

const NO_PHOTO: PhotoFields = { photo_data: null, photo_origin: null, photo_source_url: null, photo_author: null, photo_license: null, photo_license_url: null };

/** Credits for an automatically found photo. Only photos found by OUR server are accepted. */
async function photoFromAutoUrl(url: string): Promise<PhotoFields | null> {
  const { lookupPhotoByUrl } = await import("@/lib/places/discovery.server");
  const c = lookupPhotoByUrl(url);
  if (!c) return null;
  return { photo_data: c.url, photo_origin: c.source, photo_source_url: c.sourcePageUrl, photo_author: c.author, photo_license: c.license, photo_license_url: c.licenseUrl };
}

const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

export const createPlace = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      name: z.string().min(1).max(120),
      description: z.string().max(2000).optional(),
      /** A category id, or "auto" to detect it from OpenStreetMap. */
      category: CATEGORY_INPUT,
      address: z.string().min(1).max(300),
      latitude: z.number().min(-90).max(90).nullable(),
      longitude: z.number().min(-180).max(180).nullable(),
      /** A photo the person uploaded (data URL). Never replaced automatically. */
      photoData: uploadSchema.nullable(),
      /** A photo URL suggested by the auto-fill (verified against the server's own search). */
      autoPhotoUrl: z.string().max(600).nullable().optional(),
      osmType: z.enum(["node", "way", "relation"]).nullable().optional(),
      osmId: z.number().int().positive().nullable().optional(),
      osmTags: z.record(z.string(), z.string().max(200)).nullable().optional(),
      descriptionSourceUrl: z.string().max(300).nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const name = data.name.trim();
    const address = data.address.trim();

    // --- no duplicates
    if (data.osmType && data.osmId) {
      const same = await sql<{ id: number; name: string }>`select id, name from places where osm_type = ${data.osmType} and osm_id = ${data.osmId} limit 1`;
      if (same[0]) throw new Error(`"${same[0].name}" is already listed (place #${same[0].id}).`);
    }
    const sameName = await sql<{ id: number; name: string; latitude: number | null; longitude: number | null; address: string }>`select id, name, latitude, longitude, address from places where lower(name) = ${name.toLowerCase()}`;
    for (const p of sameName) {
      const near =
        p.latitude !== null && p.longitude !== null && data.latitude !== null && data.longitude !== null
          ? Math.abs(p.latitude - data.latitude) < 0.002 && Math.abs(p.longitude - data.longitude) < 0.002
          : p.address.trim().toLowerCase() === address.toLowerCase();
      if (near) throw new Error(`"${p.name}" is already listed (place #${p.id}).`);
    }

    // --- category (auto-detect when asked, or when the value is unknown)
    let category = data.category;
    if (category === "auto" || !category.trim()) {
      category = "other";
      try {
        const { discoverPlace } = await import("@/lib/places/discovery.server");
        const found = await withTimeout(
          discoverPlace({ name, lat: data.latitude ?? undefined, lng: data.longitude ?? undefined, address }),
          15_000,
          null,
        );
        if (found && found.category.confidence !== "none") category = found.category.category;
      } catch {
        /* keep "other" */
      }
    }

    // --- photo: upload wins, then a photo picked in the form, then an automatic verified search, else none
    let photo: PhotoFields = NO_PHOTO;
    if (data.photoData) {
      photo = { ...NO_PHOTO, photo_data: data.photoData, photo_origin: "upload" };
    } else {
      const picked = data.autoPhotoUrl ? await photoFromAutoUrl(data.autoPhotoUrl) : null;
      if (picked) photo = picked;
      else {
        try {
          const { findBestPhoto } = await import("@/lib/places/discovery.server");
          const r = await withTimeout(
            findBestPhoto({ name, lat: data.latitude ?? undefined, lng: data.longitude ?? undefined, area: address }),
            15_000,
            null,
          );
          if (r?.photo) {
            const c = r.photo;
            photo = { photo_data: c.url, photo_origin: c.source, photo_source_url: c.sourcePageUrl, photo_author: c.author, photo_license: c.license, photo_license_url: c.licenseUrl };
          }
        } catch {
          /* no photo is fine */
        }
      }
    }

    const status = (await isAdmin(context.userId)) ? "approved" : "pending";
    const tagsJson = data.osmTags ? JSON.stringify(data.osmTags) : null;
    try {
      const rows = await sql<Place>`
        insert into places (name, description, category, address, latitude, longitude,
                            photo_data, photo_origin, photo_source_url, photo_author, photo_license, photo_license_url,
                            osm_type, osm_id, osm_tags, description_source_url, status, created_by)
        values (${name}, ${data.description?.trim() || null}, ${category}, ${address}, ${data.latitude}, ${data.longitude},
                ${photo.photo_data}, ${photo.photo_origin}, ${photo.photo_source_url}, ${photo.photo_author}, ${photo.photo_license}, ${photo.photo_license_url},
                ${data.osmType ?? null}, ${data.osmId ?? null}, ${tagsJson}::jsonb, ${data.descriptionSourceUrl ?? null}, ${status}, ${context.userId})
        returning *`;
      return rows[0];
    } catch (e) {
      if (/idx_places_osm_unique|duplicate key/i.test(e instanceof Error ? e.message : "")) throw new Error("This place is already listed.");
      throw e;
    }
  });

export const updatePlace = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.number(),
      name: z.string().max(120).optional(),
      description: z.string().max(2000).optional(),
      category: CATEGORY_INPUT.optional(),
      address: z.string().max(300).optional(),
      latitude: z.number().min(-90).max(90).nullable().optional(),
      longitude: z.number().min(-180).max(180).nullable().optional(),
      /** Explicitly replace the photo with an upload. */
      photoData: uploadSchema.nullable().optional(),
      /** Explicitly replace the photo with one of the suggested (verified) photos. */
      autoPhotoUrl: z.string().max(600).optional(),
      /** Remove the photo (the category fallback image is shown instead). */
      clearPhoto: z.boolean().optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      featured: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const admin = await isAdmin(context.userId);
    const existing = (await sql<Place>`select * from places where id = ${data.id} limit 1`)[0];
    if (!existing) throw new Error("Place not found");
    if (!admin && (existing.created_by !== context.userId || existing.status !== "pending")) {
      throw new Error("Not allowed to edit this place");
    }
    const fields: Record<string, unknown> = {
      name: data.name?.trim() || undefined,
      description: data.description,
      category: data.category,
      address: data.address?.trim() || undefined,
      latitude: data.latitude,
      longitude: data.longitude,
    };
    // Photo changes are always explicit actions by a person.
    if (data.photoData) Object.assign(fields, { ...NO_PHOTO, photo_data: data.photoData, photo_origin: "upload" });
    else if (data.autoPhotoUrl) {
      const picked = await photoFromAutoUrl(data.autoPhotoUrl);
      if (!picked) throw new Error("That suggested photo has expired. Run the photo search again.");
      Object.assign(fields, picked);
    } else if (data.clearPhoto) Object.assign(fields, NO_PHOTO);
    if (admin) {
      fields.status = data.status;
      fields.featured = data.featured;
    }
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [col, val] of Object.entries(fields)) {
      if (val === undefined) continue;
      vals.push(val);
      sets.push(`${col} = $${vals.length}`);
    }
    sets.push("updated_at = now()");
    vals.push(data.id);
    const rows = await sql.query<Place>(`update places set ${sets.join(", ")} where id = $${vals.length} returning *`, vals);
    return rows[0];
  });

/**
 * Admin: look for a verified free photo for a place that has none.
 * Never overwrites a photo a person uploaded (or any photo whose origin is unknown).
 */
export const autoFillPlacePhoto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Admin only");
    const sql = await getSql();
    const p = (await sql<Place>`select * from places where id = ${data.id} limit 1`)[0];
    if (!p) throw new Error("Place not found");
    const hasRealPhoto = !!p.photo_data && !p.photo_data.startsWith("data:image/svg+xml");
    if (hasRealPhoto && p.photo_origin !== "wikipedia" && p.photo_origin !== "commons") {
      return { updated: false as const, message: "This place already has a photo that was uploaded by a person, so it was left alone." };
    }
    const { findBestPhoto } = await import("@/lib/places/discovery.server");
    const r = await withTimeout(
      findBestPhoto({ name: p.name, lat: p.latitude ?? undefined, lng: p.longitude ?? undefined, area: p.address }),
      15_000,
      null,
    );
    if (!r?.photo) {
      return { updated: false as const, message: r?.warnings.length ? "The free photo services did not answer. Try again in a minute." : "No photo that clearly shows this place was found. You can upload one." };
    }
    const c = r.photo;
    await sql`update places set photo_data = ${c.url}, photo_origin = ${c.source}, photo_source_url = ${c.sourcePageUrl}, photo_author = ${c.author},
              photo_license = ${c.license}, photo_license_url = ${c.licenseUrl}, updated_at = now() where id = ${data.id}`;
    return { updated: true as const, message: "Photo added from Wikimedia." };
  });

export const deletePlace = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Admin only");
    const sql = await getSql();
    await sql`delete from places where id = ${data.id}`;
    return { ok: true };
  });
