import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { ensureSeed } from "@/lib/explorer/api.server";

// The admin account is created lazily. Make sure it exists (and, in local development, has the documented password)
// BEFORE a sign-in attempt is processed, otherwise the very first admin login on a fresh database can fail.
async function handle(request: Request) {
  if (request.method === "POST" && /\/sign-in\//.test(new URL(request.url).pathname)) {
    await ensureSeed().catch(() => undefined);
  }
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => handle(request),
    },
  },
});
