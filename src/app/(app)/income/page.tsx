"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardHeader, Input, Label } from "@/components/ui";
import { useCollection, useIsHydrated } from "@/lib/use-store";
import { upsertByKeys, deleteItem, Income } from "@/lib/local-store";
import { formatCurrency } from "@/lib/currency";
import { monthKey, monthLabel, totalIncome } from "@/lib/finance";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Trash2 } from "lucide-react";

const emptyForm = { month: monthKey(new Date()), basicSalary: "", allowances: "", bonuses: "", overtime: "", otherIncome: "", note: "" };

export default function IncomePage() {
  const incomes = useCollection("incomes");
  const hydrated = useIsHydrated();
  const [form, setForm] = useState(emptyForm);
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");

  const sorted = useMemo(() => (incomes ?? []).slice().sort((a, b) => a.month.localeCompare(b.month)), [incomes]);

  const chartData = useMemo(
    () =>
      sorted.map((i) => ({
        month: monthLabel(i.month),
        total: totalIncome(i),
      })),
    [sorted]
  );

  const currentYear = new Date().getFullYear();
  const yearlyTotal = useMemo(
    () => sorted.filter((i) => i.month.startsWith(String(currentYear))).reduce((sum, i) => sum + totalIncome(i), 0),
    [sorted, currentYear]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    upsertByKeys<"incomes", Income>("incomes", (i) => i.month === form.month, () => ({
      month: form.month,
      basicSalary: Number(form.basicSalary) || 0,
      allowances: Number(form.allowances) || 0,
      bonuses: Number(form.bonuses) || 0,
      overtime: Number(form.overtime) || 0,
      otherIncome: Number(form.otherIncome) || 0,
      note: form.note || null,
    }));
    setForm(emptyForm);
  }

  function handleDelete(id: string) {
    deleteItem("incomes", id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Income</h1>
        <p className="text-sm text-muted">Track your salary, allowances, bonuses and other income sources.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Add / update income" subtitle="One entry per month — saving again overwrites that month." />
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <Label>Month</Label>
              <Input type="month" required value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
            </div>
            <div>
              <Label>Basic salary (QAR)</Label>
              <Input type="number" min={0} step="0.01" value={form.basicSalary} onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))} />
            </div>
            <div>
              <Label>Allowances (QAR)</Label>
              <Input type="number" min={0} step="0.01" value={form.allowances} onChange={(e) => setForm((f) => ({ ...f, allowances: e.target.value }))} />
            </div>
            <div>
              <Label>Bonuses (QAR)</Label>
              <Input type="number" min={0} step="0.01" value={form.bonuses} onChange={(e) => setForm((f) => ({ ...f, bonuses: e.target.value }))} />
            </div>
            <div>
              <Label>Overtime (QAR)</Label>
              <Input type="number" min={0} step="0.01" value={form.overtime} onChange={(e) => setForm((f) => ({ ...f, overtime: e.target.value }))} />
            </div>
            <div>
              <Label>Other income (QAR)</Label>
              <Input type="number" min={0} step="0.01" value={form.otherIncome} onChange={(e) => setForm((f) => ({ ...f, otherIncome: e.target.value }))} />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. Annual raise" />
            </div>
            <Button type="submit" className="mt-1">
              Save income
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <CardHeader title="Income over time" subtitle="Total monthly income across all sources" />
            <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
              <button
                onClick={() => setViewMode("monthly")}
                className={`rounded-md px-3 py-1 text-xs font-medium ${viewMode === "monthly" ? "bg-surface shadow-sm" : "text-muted"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode("yearly")}
                className={`rounded-md px-3 py-1 text-xs font-medium ${viewMode === "yearly" ? "bg-surface shadow-sm" : "text-muted"}`}
              >
                Yearly
              </button>
            </div>
          </div>
          {viewMode === "monthly" ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={(v) => formatCurrency(v)} width={90} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-1">
              <span className="text-xs uppercase tracking-wide text-muted">Total income, {currentYear}</span>
              <span className="text-3xl font-semibold text-foreground">{formatCurrency(yearlyTotal)}</span>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Income history" />
        {!hydrated && <p className="text-sm text-muted">Loading...</p>}
        {hydrated && sorted.length === 0 && <p className="text-sm text-muted">No income entries yet.</p>}
        {sorted.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Month</th>
                  <th className="py-2 pr-4">Basic</th>
                  <th className="py-2 pr-4">Allowances</th>
                  <th className="py-2 pr-4">Bonuses</th>
                  <th className="py-2 pr-4">Overtime</th>
                  <th className="py-2 pr-4">Other</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {sorted
                  .slice()
                  .reverse()
                  .map((i) => (
                    <tr key={i.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">{monthLabel(i.month)}</td>
                      <td className="py-2 pr-4">{formatCurrency(i.basicSalary)}</td>
                      <td className="py-2 pr-4">{formatCurrency(i.allowances)}</td>
                      <td className="py-2 pr-4">{formatCurrency(i.bonuses)}</td>
                      <td className="py-2 pr-4">{formatCurrency(i.overtime)}</td>
                      <td className="py-2 pr-4">{formatCurrency(i.otherIncome)}</td>
                      <td className="py-2 pr-4 font-semibold text-foreground">{formatCurrency(totalIncome(i))}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => handleDelete(i.id)} className="text-muted hover:text-danger">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
