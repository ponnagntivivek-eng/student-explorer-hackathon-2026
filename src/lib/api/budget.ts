import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { Budget } from "@/lib/db/schema";

const expenseSchema = z.array(z.object({ label: z.string(), amount: z.number() }));

export const saveBudget = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ name: z.string().min(1), total: z.number(), expenses: expenseSchema }))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    const rows = await sql.query<Budget>(
      `insert into budgets (user_id, name, total, expenses) values ($1, $2, $3, $4::jsonb)
       returning id, name, total::float8 as total, expenses, created_at`,
      [context.userId, data.name, data.total, JSON.stringify(data.expenses)],
    );
    return rows[0];
  });

export const listBudgets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    return sql.query<Budget>(
      `select id, name, total::float8 as total, expenses, created_at from budgets where user_id = $1 order by created_at desc`,
      [context.userId],
    );
  });

export const createOuting = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      title: z.string().min(1),
      placeId: z.number().nullable(),
      budgetId: z.number().nullable(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql.query(
      `insert into outings (user_id, title, place_id, budget_id, date, notes) values ($1, $2, $3, $4, $5::date, $6) returning *`,
      [context.userId, data.title, data.placeId, data.budgetId, data.date, data.notes ?? null],
    );
    return { ok: true };
  });
