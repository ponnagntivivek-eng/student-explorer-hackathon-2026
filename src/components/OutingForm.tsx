import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listPlaces } from "@/lib/api/places";
import { listBudgets, createOuting } from "@/lib/api/budget";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  placeId: z.string().optional(),
  budgetId: z.string().optional(),
  date: z.string().min(1, "Pick a date"),
  notes: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function OutingForm({ onCreated }: { onCreated?: () => void }) {
  const [places, setPlaces] = useState<{ id: number; name: string }[]>([]);
  const [budgets, setBudgets] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    listPlaces({ data: { status: "approved" } }).then((rows) => setPlaces(rows.map((p) => ({ id: p.id, name: p.name })))).catch(() => {});
    listBudgets().then((rows) => setBudgets(rows.map((b) => ({ id: b.id, name: b.name })))).catch(() => {});
  }, []);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: "", placeId: "", budgetId: "", date: "", notes: "" } });
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await createOuting({
        data: { title: v.title, placeId: v.placeId ? Number(v.placeId) : null, budgetId: v.budgetId ? Number(v.budgetId) : null, date: v.date, notes: v.notes },
      });
      toast.success("Outing logged!");
      form.reset();
      onCreated?.();
    } catch {
      toast.error("Please sign in first (top right → Sign in), then try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div>
        <Input placeholder="Outing title" {...form.register("title")} />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>
      <select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" {...form.register("placeId")}>
        <option value="">— choose a place —</option>
        {places.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
      </select>
      <select className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" {...form.register("budgetId")}>
        <option value="">— choose a saved budget —</option>
        {budgets.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
      </select>
      <div>
        <Input type="date" {...form.register("date")} />
        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
      </div>
      <Textarea placeholder="Notes" {...form.register("notes")} />
      <Button type="submit">Log outing</Button>
    </form>
  );
}
