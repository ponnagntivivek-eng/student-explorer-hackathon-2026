import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { isAdmin } from "@/lib/api/roles";
import type { CommentRow } from "@/lib/db/schema";

export const listComments = createServerFn({ method: "GET" })
  .inputValidator(z.object({ placeId: z.number() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    return sql<CommentRow>`
      select c.id, c.content, c.created_at, c.place_id, coalesce(u.name, 'Former member') as author
      from comments c left join "user" u on u.id = c.user_id
      where c.place_id = ${data.placeId} order by c.created_at asc`;
  });

export const listAllComments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Admin only");
    const sql = await getSql();
    return sql<CommentRow>`
      select c.id, c.content, c.created_at, c.place_id, coalesce(u.name, 'Former member') as author
      from comments c left join "user" u on u.id = c.user_id
      order by c.created_at desc`;
  });

export const addComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ placeId: z.number(), content: z.string().min(1).max(2000) }))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`insert into comments (place_id, user_id, content) values (${data.placeId}, ${context.userId}, ${data.content})`;
    return { ok: true };
  });

export const updateComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number(), content: z.string().min(1).max(2000) }))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Admin only");
    const sql = await getSql();
    await sql`update comments set content = ${data.content}, updated_at = now() where id = ${data.id}`;
    return { ok: true };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("Admin only");
    const sql = await getSql();
    await sql`delete from comments where id = ${data.id}`;
    return { ok: true };
  });
