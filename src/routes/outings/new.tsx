import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { OutingForm } from "@/components/OutingForm";

export const Route = createFileRoute("/outings/new")({ component: NewOuting });

function NewOuting() {
  return (
    <PageShell width="max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Log a new outing</h1>
      <OutingForm />
    </PageShell>
  );
}
