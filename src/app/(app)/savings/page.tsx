"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardHeader, Input, Label, ProgressBar } from "@/components/ui";
import { useCollection, useIsHydrated } from "@/lib/use-store";
import { addItem, updateItem, deleteItem, SavingsGoal } from "@/lib/local-store";
import { formatCurrency } from "@/lib/currency";
import { savingsGoalEta, emergencyFundTargets } from "@/lib/finance";
import { Trash2, Target } from "lucide-react";

const emptyForm = { name: "", targetAmount: "", currentAmount: "", monthlyContribution: "", targetDate: "" };

export default function SavingsPage() {
  const goals = useCollection("savingsGoals");
  const hydrated = useIsHydrated();
  const [form, setForm] = useState(emptyForm);
  const [essentialExpenses, setEssentialExpenses] = useState("");
  const [emergencyTarget, setEmergencyTarget] = useState<"minimum" | "standard" | "strong">("standard");

  const emergencyGoal = useMemo(() => (goals ?? []).find((g) => g.name === "Emergency Fund"), [goals]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.targetAmount) return;
    addItem("savingsGoals", {
      name: form.name,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount) || 0,
      monthlyContribution: Number(form.monthlyContribution) || 0,
      targetDate: form.targetDate || null,
    });
    setForm(emptyForm);
  }

  function handleUpdateAmount(goal: SavingsGoal, currentAmount: number) {
    updateItem("savingsGoals", goal.id, { currentAmount });
  }

  function handleDelete(id: string) {
    deleteItem("savingsGoals", id);
  }

  const targets = emergencyFundTargets(Number(essentialExpenses) || 0);
  const targetAmount = targets[emergencyTarget];
  const emergencyCurrent = emergencyGoal?.currentAmount ?? 0;
  const emergencyPct = targetAmount > 0 ? Math.min(100, (emergencyCurrent / targetAmount) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Savings</h1>
        <p className="text-sm text-muted">Create savings goals and plan your emergency fund.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="New savings goal" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <Label>Goal name</Label>
              <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. New Phone" />
            </div>
            <div>
              <Label>Target amount (QAR)</Label>
              <Input type="number" min={0} step="0.01" required value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} />
            </div>
            <div>
              <Label>Current amount (QAR)</Label>
              <Input type="number" min={0} step="0.01" value={form.currentAmount} onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))} />
            </div>
            <div>
              <Label>Monthly contribution (QAR)</Label>
              <Input type="number" min={0} step="0.01" value={form.monthlyContribution} onChange={(e) => setForm((f) => ({ ...f, monthlyContribution: e.target.value }))} />
            </div>
            <div>
              <Label>Target date (optional)</Label>
              <Input type="date" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} />
            </div>
            <Button type="submit">Create goal</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Emergency fund calculator" subtitle="Based on your average essential monthly expenses" />
          <div>
            <Label>Essential monthly expenses (rent, food, transport, utilities) (QAR)</Label>
            <Input type="number" min={0} value={essentialExpenses} onChange={(e) => setEssentialExpenses(e.target.value)} placeholder="e.g. 4000" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["minimum", "standard", "strong"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setEmergencyTarget(tier)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  emergencyTarget === tier ? "border-primary bg-primary/10" : "border-border hover:bg-surface-muted"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-muted">
                  {tier === "minimum" ? "Minimum · 3 months" : tier === "standard" ? "Standard · 6 months" : "Strong · 12 months"}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(targets[tier])}</p>
              </button>
            ))}
          </div>

          {emergencyGoal ? (
            <div className="mt-5 border-t border-border pt-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-foreground">Progress toward {emergencyTarget} target</span>
                <span className="text-muted">
                  {formatCurrency(emergencyCurrent)} / {formatCurrency(targetAmount)} ({Math.round(emergencyPct)}%)
                </span>
              </div>
              <ProgressBar percent={emergencyPct} tone={emergencyPct >= 100 ? "success" : "default"} />
              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Update current amount"
                  className="w-48"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (!isNaN(val)) handleUpdateAmount(emergencyGoal, val);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <span className="text-xs text-muted">Press Enter to update</span>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">Create a savings goal named &quot;Emergency Fund&quot; to track progress here.</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Your savings goals" />
        {!hydrated && <p className="text-sm text-muted">Loading...</p>}
        {hydrated && (goals ?? []).length === 0 && <p className="text-sm text-muted">No savings goals yet.</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(goals ?? []).map((g) => {
            const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
            const eta = savingsGoalEta(g.currentAmount, g.targetAmount, g.monthlyContribution);
            return (
              <div key={g.id} className="rounded-xl border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={15} className="text-primary" />
                    <span className="font-medium text-foreground">{g.name}</span>
                  </div>
                  <button onClick={() => handleDelete(g.id)} className="text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
                <ProgressBar percent={pct} tone={pct >= 100 ? "success" : "default"} className="mb-2" />
                <div className="flex justify-between text-xs text-muted">
                  <span>{formatCurrency(g.currentAmount)} saved</span>
                  <span>{Math.round(pct)}% complete</span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted">
                  <span>Target: {formatCurrency(g.targetAmount)}</span>
                  <span>Remaining: {formatCurrency(Math.max(0, g.targetAmount - g.currentAmount))}</span>
                </div>
                {g.monthlyContribution > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    {formatCurrency(g.monthlyContribution)}/mo · Est. completion:{" "}
                    {eta ? eta.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder="Add / update amount"
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = Number((e.target as HTMLInputElement).value);
                        if (!isNaN(val)) handleUpdateAmount(g, val);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
