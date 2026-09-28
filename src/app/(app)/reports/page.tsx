"use client";
/* eslint-disable react-hooks/preserve-manual-memoization -- deps are already correct ([dashboard]); the experimental compiler just can't further optimize */

import { useMemo, useState } from "react";
import { Button, Card, CardHeader, Select } from "@/components/ui";
import { useApi } from "@/lib/use-api";
import { formatCurrency } from "@/lib/currency";
import { monthKey, monthLabel, lastNMonthKeys, financialHealthMetrics } from "@/lib/finance";
import { Download } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

type MonthSnapshot = {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  essentialExpenses: number;
  byCategory: Record<string, number>;
  budgets: { category: string; amount: number }[];
};
type DashboardData = { current: MonthSnapshot };

type YearlyReport = {
  year: number;
  months: { month: string; income: number; expenses: number; net: number }[];
  totalIncome: number;
  totalExpenses: number;
  netProgress: number;
  byCategory: Record<string, number>;
  totalSavings: number;
  totalInvestments: number;
  totalVacationSpend: number;
};

export default function ReportsPage() {
  const [tab, setTab] = useState<"monthly" | "yearly">("monthly");
  const [month, setMonth] = useState(monthKey(new Date()));
  const [year, setYear] = useState(new Date().getFullYear());

  const months = useMemo(() => lastNMonthKeys(12), []);
  const { data: dashboard } = useApi<DashboardData>(`/api/dashboard?month=${month}`);
  const { data: report } = useApi<YearlyReport>(`/api/reports?year=${year}`);

  const topCategories = useMemo(() => {
    if (!dashboard) return [];
    return Object.entries(dashboard.current.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [dashboard]);

  const budgetPerformance = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.current.budgets.map((b) => ({
      category: b.category,
      budget: b.amount,
      spent: dashboard.current.byCategory[b.category] ?? 0,
    }));
  }, [dashboard]);

  const health = useMemo(() => {
    if (!dashboard) return null;
    return financialHealthMetrics({
      income: dashboard.current.totalIncome,
      expenses: dashboard.current.totalExpenses,
      savings: 0,
      investments: 0,
      emergencySavings: 0,
      essentialMonthlyExpenses: dashboard.current.essentialExpenses,
    });
  }, [dashboard]);

  function downloadExport(format: "csv" | "json") {
    window.open(`/api/export?format=${format}`, "_blank");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted">Monthly and yearly summaries of your finances.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => downloadExport("csv")}>
            <Download size={14} /> CSV
          </Button>
          <Button variant="secondary" onClick={() => downloadExport("json")}>
            <Download size={14} /> JSON
          </Button>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-surface-muted p-1 w-fit">
        <button onClick={() => setTab("monthly")} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === "monthly" ? "bg-surface shadow-sm" : "text-muted"}`}>
          Monthly
        </button>
        <button onClick={() => setTab("yearly")} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === "yearly" ? "bg-surface shadow-sm" : "text-muted"}`}>
          Yearly
        </button>
      </div>

      {tab === "monthly" && dashboard && (
        <>
          <div className="flex justify-end">
            <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-44">
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-xs text-muted">Income</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(dashboard.current.totalIncome)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Expenses</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(dashboard.current.totalExpenses)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Remaining</p>
              <p className="text-xl font-semibold text-foreground">
                {formatCurrency(dashboard.current.totalIncome - dashboard.current.totalExpenses)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Expense ratio</p>
              <p className="text-xl font-semibold text-foreground">
                {dashboard.current.totalIncome > 0 ? `${Math.round((dashboard.current.totalExpenses / dashboard.current.totalIncome) * 100)}%` : "—"}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Biggest expense categories" />
            <div className="flex flex-col gap-2">
              {topCategories.length === 0 && <p className="text-sm text-muted">No expenses recorded for this month.</p>}
              {topCategories.map(([cat, amt], i) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-muted">#{i + 1}</span>
                  <span className="flex-1 text-sm text-foreground">{cat}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(amt)}</span>
                </div>
              ))}
            </div>
          </Card>

          {budgetPerformance.length > 0 && (
            <Card>
              <CardHeader title="Budget performance" />
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={(v) => formatCurrency(v)} width={90} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="budget" fill="var(--color-info)" radius={[4, 4, 0, 0]} name="Budget" />
                    <Bar dataKey="spent" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {health && (
            <Card>
              <CardHeader title="Personal Finance Health Overview" subtitle="Indicators calculated from your own data — not a professional assessment" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted">Expense ratio</p>
                  <p className="text-lg font-semibold text-foreground">{Math.round(health.expenseRatio)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Savings rate</p>
                  <p className="text-lg font-semibold text-foreground">{Math.round(health.savingsRate)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Investment rate</p>
                  <p className="text-lg font-semibold text-foreground">{Math.round(health.investmentRate)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Emergency coverage</p>
                  <p className="text-lg font-semibold text-foreground">{health.emergencyCoverageMonths.toFixed(1)} mo</p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {tab === "yearly" && report && (
        <>
          <div className="flex justify-end">
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32">
              {[year, year - 1, year - 2].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-xs text-muted">Total income</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(report.totalIncome)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Total expenses</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(report.totalExpenses)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Net financial progress</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(report.netProgress)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Current savings + investments</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(report.totalSavings + report.totalInvestments)}</p>
            </Card>
          </div>

          <Card>
            <CardHeader title={`Income vs Expenses — ${report.year}`} />
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.months.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={(v) => formatCurrency(v)} width={90} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="var(--color-danger)" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title="Spending by category this year" />
            <div className="flex flex-col gap-2">
              {Object.entries(report.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-foreground">{cat}</span>
                    <span className="text-sm font-medium text-foreground">{formatCurrency(amt)}</span>
                  </div>
                ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
