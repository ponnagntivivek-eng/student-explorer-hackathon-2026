import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveBudget } from "@/lib/api/budget";

type Expense = { label: string; amount: number };
const defaultExpenses: Expense[] = [
  { label: "Transport", amount: 0 },
  { label: "Food", amount: 0 },
  { label: "Tickets", amount: 0 },
  { label: "Misc", amount: 0 },
];

export function BudgetCalculator({ onSaved }: { onSaved?: (id: number) => void }) {
  const [name, setName] = useState("Squad outing");
  const [expenses, setExpenses] = useState<Expense[]>(defaultExpenses);
  const [people, setPeople] = useState(4);

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const perPerson = total / (people || 1);

  function updateExpense(i: number, amount: number) {
    setExpenses((prev) => prev.map((e, idx) => (idx === i ? { ...e, amount } : e)));
  }

  async function handleSave() {
    try {
      const saved = await saveBudget({ data: { name, total, expenses } });
      toast.success(`Budget “${name}” saved — ₹${perPerson.toFixed(2)} per person`);
      onSaved?.(saved.id);
    } catch {
      toast.error("Please sign in first (top right → Sign in), then save again.");
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Budget name" />
      {expenses.map((e, i) => (
        <div key={e.label} className="flex items-center gap-2">
          <span className="w-24 text-sm">{e.label}</span>
          <Input type="number" min={0} value={e.amount || ""} onChange={(ev) => updateExpense(i, parseFloat(ev.target.value) || 0)} />
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="w-24 text-sm">People</span>
        <Input type="number" min={1} value={people} onChange={(e) => setPeople(parseInt(e.target.value) || 1)} />
      </div>
      <p className="font-semibold">Total: ₹{total.toFixed(2)} — per person: ₹{perPerson.toFixed(2)}</p>
      <Button onClick={handleSave}>Save budget</Button>
    </div>
  );
}
