import { createFileRoute, redirect } from "@tanstack/react-router";

// All community submissions use the same live explorer API and database.
export const Route = createFileRoute("/places/new")({
  beforeLoad: () => {
    throw redirect({ href: "/?openAddPlace=1" });
  },
});
