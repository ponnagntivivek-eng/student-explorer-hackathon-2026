import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { BudgetCalculator } from "@/components/BudgetCalculator";

export const Route = createFileRoute("/budget")({ component: BudgetPage });

function BudgetPage() {
  return (
    <PageShell width="max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Squad budget calculator</h1>
      <BudgetCalculator />
    </PageShell>
  );
}
