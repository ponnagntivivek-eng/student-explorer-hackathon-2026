import { createFileRoute } from "@tanstack/react-router";
import { handleExplorer } from "@/lib/explorer/api.server";

const handle = ({ request }: { request: Request }) => handleExplorer(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
