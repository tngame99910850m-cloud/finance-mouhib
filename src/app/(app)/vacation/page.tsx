"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardHeader, Input, Label, ProgressBar } from "@/components/ui";
import { useApi, apiPost, apiPatch, apiDelete } from "@/lib/use-api";
import { formatCurrency } from "@/lib/currency";
import { monthsBetween, requiredMonthlySaving } from "@/lib/finance";
import { Trash2, Plane, Hotel, UtensilsCrossed, Car, Ticket, ShoppingBag, ShieldAlert } from "lucide-react";

type Vacation = {
  id: string;
  destination: string;
  travelDate: string;
  flightCost: number;
  hotelCost: number;
  foodBudget: number;
  transportation: number;
  activities: number;
  shopping: number;
  buffer: number;
  savedSoFar: number;
};

const emptyForm = {
  destination: "",
  travelDate: "",
  flightCost: "",
  hotelCost: "",
  foodBudget: "",
  transportation: "",
  activities: "",
  shopping: "",
  buffer: "",
  savedSoFar: "",
};

const COST_FIELDS: { key: keyof typeof emptyForm; label: string; icon: typeof Plane }[] = [
  { key: "flightCost", label: "Flight cost", icon: Plane },
  { key: "hotelCost", label: "Hotel cost", icon: Hotel },
  { key: "foodBudget", label: "Food budget", icon: UtensilsCrossed },
  { key: "transportation", label: "Transportation", icon: Car },
  { key: "activities", label: "Activities", icon: Ticket },
  { key: "shopping", label: "Shopping", icon: ShoppingBag },
  { key: "buffer", label: "Emergency / travel buffer", icon: ShieldAlert },
];

function vacationTotal(v: Pick<Vacation, "flightCost" | "hotelCost" | "foodBudget" | "transportation" | "activities" | "shopping" | "buffer">) {
  return v.flightCost + v.hotelCost + v.foodBudget + v.transportation + v.activities + v.shopping + v.buffer;
}

export default function VacationPage() {
  const { data: vacations, loading, refetch } = useApi<Vacation[]>("/api/vacations");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.destination || !form.travelDate) return;
    setSaving(true);
    try {
      await apiPost("/api/vacations", {
        destination: form.destination,
        travelDate: new Date(form.travelDate).toISOString(),
        flightCost: Number(form.flightCost) || 0,
        hotelCost: Number(form.hotelCost) || 0,
        foodBudget: Number(form.foodBudget) || 0,
        transportation: Number(form.transportation) || 0,
        activities: Number(form.activities) || 0,
        shopping: Number(form.shopping) || 0,
        buffer: Number(form.buffer) || 0,
        savedSoFar: Number(form.savedSoFar) || 0,
      });
      setForm(emptyForm);
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSaved(v: Vacation, savedSoFar: number) {
    await apiPatch(`/api/vacations/${v.id}`, { savedSoFar });
    refetch();
  }

  async function handleDelete(id: string) {
    await apiDelete(`/api/vacations/${id}`);
    refetch();
  }

  const previewTotal = useMemo(
    () =>
      vacationTotal({
        flightCost: Number(form.flightCost) || 0,
        hotelCost: Number(form.hotelCost) || 0,
        foodBudget: Number(form.foodBudget) || 0,
        transportation: Number(form.transportation) || 0,
        activities: Number(form.activities) || 0,
        shopping: Number(form.shopping) || 0,
        buffer: Number(form.buffer) || 0,
      }),
    [form]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Vacation Planner</h1>
        <p className="text-sm text-muted">Plan a trip and see exactly how much to save each month.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Plan a trip" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <Label>Destination</Label>
              <Input required value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} placeholder="e.g. Maldives" />
            </div>
            <div>
              <Label>Travel date</Label>
              <Input type="date" required value={form.travelDate} onChange={(e) => setForm((f) => ({ ...f, travelDate: e.target.value }))} />
            </div>
            {COST_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <Label>{label} (QAR)</Label>
                <Input type="number" min={0} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <Label>Already saved (QAR)</Label>
              <Input type="number" min={0} value={form.savedSoFar} onChange={(e) => setForm((f) => ({ ...f, savedSoFar: e.target.value }))} />
            </div>
            <div className="rounded-lg bg-surface-muted p-3 text-sm">
              <span className="text-muted">Total vacation cost: </span>
              <span className="font-semibold text-foreground">{formatCurrency(previewTotal)}</span>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add vacation plan"}
            </Button>
          </form>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {loading && <p className="text-sm text-muted">Loading...</p>}
          {!loading && (vacations ?? []).length === 0 && (
            <Card>
              <p className="text-sm text-muted">No vacations planned yet. Add one to see your monthly savings target.</p>
            </Card>
          )}
          {(vacations ?? []).map((v) => {
            const total = vacationTotal(v);
            const months = monthsBetween(new Date(), new Date(v.travelDate));
            const monthly = requiredMonthlySaving(total, v.savedSoFar, months);
            const pct = total > 0 ? Math.min(100, (v.savedSoFar / total) * 100) : 0;
            return (
              <Card key={v.id}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{v.destination}</h3>
                    <p className="text-xs text-muted">
                      Travel date: {new Date(v.travelDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })} · {months} month
                      {months !== 1 ? "s" : ""} remaining
                    </p>
                  </div>
                  <button onClick={() => handleDelete(v.id)} className="text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  {COST_FIELDS.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-2 py-1.5">
                      <Icon size={12} className="text-muted" />
                      <span className="text-muted">{label.split(" ")[0]}:</span>
                      <span className="font-medium text-foreground">{formatCurrency(v[key as keyof Vacation] as number)}</span>
                    </div>
                  ))}
                </div>

                <ProgressBar percent={pct} tone={pct >= 100 ? "success" : "default"} className="mb-2" />
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-muted">
                    Saved {formatCurrency(v.savedSoFar)} of {formatCurrency(total)}
                  </span>
                  <span className="font-semibold text-foreground">
                    Required monthly saving: {formatCurrency(monthly)}/month
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Update saved amount"
                    className="w-48"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = Number((e.target as HTMLInputElement).value);
                        if (!isNaN(val)) handleUpdateSaved(v, val);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                  <span className="text-xs text-muted">Press Enter to update</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
