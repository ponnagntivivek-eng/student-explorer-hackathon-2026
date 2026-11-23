import { createFileRoute, redirect } from "@tanstack/react-router";

// The old route queried a separate legacy table. Send admins to the canonical
// Student Explorer shell and open its real admin dashboard there.
export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    throw redirect({ href: "/?openAdmin=1" });
  },
});
