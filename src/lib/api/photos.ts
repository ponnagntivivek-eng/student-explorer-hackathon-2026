import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { isAdmin } from "@/lib/api/roles";
import type { PlacePhoto } from "@/lib/db/schema";

export const listPlacePhotos = createServerFn({ method: "GET" })
  .inputValidator(z.object({ placeId: z.number() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    return sql<PlacePhoto>`select * from place_photos where place_id = ${data.placeId} order by created_at desc`;
  });

export const addPlacePhoto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ placeId: z.number(), data: z.string().max(7_000_000), mimeType: z.string() }))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const place = (await sql<{ created_by: string | null }>`select created_by from places where id = ${data.placeId} limit 1`)[0];
    if (!place) throw new Error("Place not found");
    if (place.created_by !== context.userId && !(await isAdmin(context.userId))) throw new Error("Not allowed");
    const rows = await sql<PlacePhoto>`insert into place_photos (place_id, data, mime_type) values (${data.placeId}, ${data.data}, ${data.mimeType || "image/jpeg"}) returning *`;
    return rows[0];
  });
