"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardHeader, Input, Label, ProgressBar, Select, Badge } from "@/components/ui";
import { useCollection } from "@/lib/use-store";
import { updateStore } from "@/lib/local-store";
import { formatCurrency } from "@/lib/currency";
import { monthKey, monthLabel, lastNMonthKeys, percentUsed, ESSENTIAL_CATEGORIES } from "@/lib/finance";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { AlertTriangle } from "lucide-react";

export default function BudgetPage() {
  const [month, setMonth] = useState(monthKey(new Date()));
  const allBudgets = useCollection("budgets");
  const budgets = useMemo(() => allBudgets.filter((b) => b.month === month), [allBudgets, month]);
  const allExpenses = useCollection("expenses");
  const expenses = useMemo(() => allExpenses.filter((e) => monthKey(new Date(e.date)) === month), [allExpenses, month]);
  const settings = useCollection("settings");
  const incomes = useCollection("incomes");

  const months = useMemo(() => lastNMonthKeys(12), []);

  const [budgetForm, setBudgetForm] = useState({ category: EXPENSE_CATEGORIES[0].name, amount: "" });
  const [savingPlan, setSavingPlan] = useState({ needs: 50, wants: 30, savings: 20 });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from a fetched record
    if (settings) setSavingPlan({ needs: settings.needsPercent, wants: settings.wantsPercent, savings: settings.savingsPercent });
  }, [settings]);

  const currentIncome = useMemo(() => {
    const income = (incomes ?? []).find((i) => i.month === month);
    if (!income) return 0;
    return income.basicSalary + income.allowances + income.bonuses + income.overtime + income.otherIncome;
  }, [incomes, month]);

  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses ?? []) map[e.category] = (map[e.category] ?? 0) + e.amount;
    return map;
  }, [expenses]);

  function handleAddBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!budgetForm.amount) return;
    updateStore((data) => {
      const rest = data.budgets.filter((b) => !(b.month === month && b.category === budgetForm.category));
      return { ...data, budgets: [...rest, { id: `${month}-${budgetForm.category}-${Date.now()}`, month, category: budgetForm.category, amount: Number(budgetForm.amount) }] };
    });
    setBudgetForm({ category: EXPENSE_CATEGORIES[0].name, amount: "" });
  }

  function handleSavePlan() {
    updateStore((data) => ({
      ...data,
      settings: { ...data.settings, needsPercent: savingPlan.needs, wantsPercent: savingPlan.wants, savingsPercent: savingPlan.savings },
    }));
  }

  const actualNeeds = useMemo(
    () => Object.entries(spendByCategory).filter(([c]) => ESSENTIAL_CATEGORIES.includes(c)).reduce((s, [, v]) => s + v, 0),
    [spendByCategory]
  );
  const actualTotal = useMemo(() => Object.values(spendByCategory).reduce((s, v) => s + v, 0), [spendByCategory]);
  const actualWants = actualTotal - actualNeeds;
  const actualSavings = Math.max(0, currentIncome - actualTotal);

  const planPercentSum = savingPlan.needs + savingPlan.wants + savingPlan.savings;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Budget</h1>
          <p className="text-sm text-muted">Set category budgets and track your spending plan.</p>
        </div>
        <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-44">
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Set a category budget" />
          <form onSubmit={handleAddBudget} className="flex flex-col gap-3">
            <div>
              <Label>Category</Label>
              <Select value={budgetForm.category} onChange={(e) => setBudgetForm((f) => ({ ...f, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Monthly budget (QAR)</Label>
              <Input type="number" min={0} step="0.01" required value={budgetForm.amount} onChange={(e) => setBudgetForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <Button type="submit">Save budget</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Customizable savings framework" subtitle="Default is 50/30/20 — adjust to fit Qatar's cost of living" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Needs %</Label>
              <Input type="number" min={0} max={100} value={savingPlan.needs} onChange={(e) => setSavingPlan((p) => ({ ...p, needs: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Wants / Lifestyle %</Label>
              <Input type="number" min={0} max={100} value={savingPlan.wants} onChange={(e) => setSavingPlan((p) => ({ ...p, wants: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Savings / Investments %</Label>
              <Input type="number" min={0} max={100} value={savingPlan.savings} onChange={(e) => setSavingPlan((p) => ({ ...p, savings: Number(e.target.value) }))} />
            </div>
          </div>
          {planPercentSum !== 100 && <p className="mt-2 text-xs text-warning">Percentages add up to {planPercentSum}%, not 100%.</p>}
          <Button onClick={handleSavePlan} className="mt-3">
            Save plan
          </Button>

          {currentIncome > 0 && (
            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
              {[
                { label: "Needs", target: savingPlan.needs, actual: actualNeeds },
                { label: "Wants / Lifestyle", target: savingPlan.wants, actual: actualWants },
                { label: "Savings / Investments", target: savingPlan.savings, actual: actualSavings },
              ].map((row) => {
                const targetAmount = (currentIncome * row.target) / 100;
                const actualPercent = currentIncome > 0 ? (row.actual / currentIncome) * 100 : 0;
                const overTarget = actualPercent > row.target + 2 && row.label !== "Savings / Investments";
                return (
                  <div key={row.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">
                        {row.label} <span className="text-muted">({row.target}% target)</span>
                      </span>
                      <span className={overTarget ? "text-warning" : "text-muted"}>
                        {formatCurrency(row.actual)} of {formatCurrency(targetAmount)} ({Math.round(actualPercent)}%)
                      </span>
                    </div>
                    <ProgressBar percent={(row.actual / (targetAmount || 1)) * 100} tone={overTarget ? "warning" : "default"} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Category budgets vs actual spending" />
        {(!budgets || budgets.length === 0) && <p className="text-sm text-muted">No budgets set for this month yet.</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(budgets ?? []).map((b) => {
            const spent = spendByCategory[b.category] ?? 0;
            const remaining = b.amount - spent;
            const pct = percentUsed(spent, b.amount);
            const exceeded = spent > b.amount;
            return (
              <div key={b.id} className="rounded-xl border border-border p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{b.category}</span>
                  {exceeded && (
                    <Badge tone="danger">
                      <AlertTriangle size={11} className="mr-1 inline" /> Exceeded
                    </Badge>
                  )}
                </div>
                <ProgressBar percent={pct} tone={exceeded ? "danger" : pct > 85 ? "warning" : "default"} className="my-2" />
                <div className="flex justify-between text-xs text-muted">
                  <span>Budget: {formatCurrency(b.amount)}</span>
                  <span>Spent: {formatCurrency(spent)}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className={remaining < 0 ? "text-danger" : "text-success"}>
                    {remaining < 0 ? "Over by" : "Remaining"}: {formatCurrency(Math.abs(remaining))}
                  </span>
                  <span className="text-muted">{Math.round(pct)}% used</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
