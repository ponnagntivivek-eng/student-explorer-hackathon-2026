import { getSql } from "@/lib/db";

const ADMIN_EMAILS = (
  (typeof process !== "undefined" && process.env.ADMIN_EMAIL) || "admin@studentexplorer.local"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Admin = users.role is 'admin' OR the email is listed in ADMIN_EMAIL. */
export async function isAdmin(userId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ role: string; email: string }>`select role, email from "user" where id = ${userId} limit 1`;
  const row = rows[0];
  return !!row && (row.role === "admin" || ADMIN_EMAILS.includes((row.email || "").toLowerCase()));
}
