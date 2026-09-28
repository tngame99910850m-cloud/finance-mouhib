"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardHeader, Select } from "@/components/ui";
import { useStore } from "@/lib/use-store";
import { formatCurrency } from "@/lib/currency";
import { monthKey, monthLabel, lastNMonthKeys, financialHealthMetrics, totalIncome, ESSENTIAL_CATEGORIES } from "@/lib/finance";
import { Download } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export default function ReportsPage() {
  const store = useStore();
  const [tab, setTab] = useState<"monthly" | "yearly">("monthly");
  const [month, setMonth] = useState(monthKey(new Date()));
  const [year, setYear] = useState(new Date().getFullYear());

  const months = useMemo(() => lastNMonthKeys(12), []);

  const monthExpenses = useMemo(() => store.expenses.filter((e) => monthKey(new Date(e.date)) === month), [store.expenses, month]);
  const monthIncome = useMemo(() => store.incomes.find((i) => i.month === month), [store.incomes, month]);
  const monthBudgets = useMemo(() => store.budgets.filter((b) => b.month === month), [store.budgets, month]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of monthExpenses) map[e.category] = (map[e.category] ?? 0) + e.amount;
    return map;
  }, [monthExpenses]);

  const totalIncomeMonth = monthIncome ? totalIncome(monthIncome) : 0;
  const totalExpensesMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const essentialMonth = monthExpenses.filter((e) => ESSENTIAL_CATEGORIES.includes(e.category)).reduce((s, e) => s + e.amount, 0);

  const topCategories = useMemo(() => Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5), [byCategory]);

  const budgetPerformance = useMemo(
    () => monthBudgets.map((b) => ({ category: b.category, budget: b.amount, spent: byCategory[b.category] ?? 0 })),
    [monthBudgets, byCategory]
  );

  const health = financialHealthMetrics({
    income: totalIncomeMonth,
    expenses: totalExpensesMonth,
    savings: 0,
    investments: 0,
    emergencySavings: 0,
    essentialMonthlyExpenses: essentialMonth,
  });

  const report = useMemo(() => {
    const yearIncomes = store.incomes.filter((i) => i.month.startsWith(String(year)));
    const yearExpenses = store.expenses.filter((e) => new Date(e.date).getFullYear() === year);

    const monthsData = Array.from({ length: 12 }, (_, m) => {
      const key = monthKey(new Date(year, m, 1));
      const income = yearIncomes.find((i) => i.month === key);
      const exp = yearExpenses.filter((e) => monthKey(new Date(e.date)) === key).reduce((s, e) => s + e.amount, 0);
      const inc = income ? totalIncome(income) : 0;
      return { month: key, income: inc, expenses: exp, net: inc - exp };
    });

    const totalIncomeYear = yearIncomes.reduce((s, i) => s + totalIncome(i), 0);
    const totalExpensesYear = yearExpenses.reduce((s, e) => s + e.amount, 0);
    const catMap: Record<string, number> = {};
    for (const e of yearExpenses) catMap[e.category] = (catMap[e.category] ?? 0) + e.amount;

    return {
      year,
      months: monthsData,
      totalIncome: totalIncomeYear,
      totalExpenses: totalExpensesYear,
      netProgress: totalIncomeYear - totalExpensesYear,
      byCategory: catMap,
      totalSavings: store.savingsGoals.reduce((s, g) => s + g.currentAmount, 0),
      totalInvestments: store.investments.reduce((s, i) => s + i.initialAmount, 0),
    };
  }, [store, year]);

  function handleExport(format: "csv" | "json") {
    if (format === "json") {
      downloadFile(JSON.stringify(store, null, 2), `finance-export-${Date.now()}.json`, "application/json");
      return;
    }
    const csv = toCsv(
      store.expenses.map((e) => ({
        date: e.date.slice(0, 10),
        category: e.category,
        subcategory: e.subcategory ?? "",
        amount: e.amount,
        description: e.description ?? "",
        paymentMethod: e.paymentMethod,
        isRecurring: e.isRecurring,
      }))
    );
    downloadFile(csv, `expenses-export-${Date.now()}.csv`, "text/csv");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted">Monthly and yearly summaries of your finances.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleExport("csv")}>
            <Download size={14} /> CSV
          </Button>
          <Button variant="secondary" onClick={() => handleExport("json")}>
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

      {tab === "monthly" && (
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
              <p className="text-xl font-semibold text-foreground">{formatCurrency(totalIncomeMonth)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Expenses</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(totalExpensesMonth)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Remaining</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(totalIncomeMonth - totalExpensesMonth)}</p>
            </Card>
            <Card>
              <p className="text-xs text-muted">Expense ratio</p>
              <p className="text-xl font-semibold text-foreground">
                {totalIncomeMonth > 0 ? `${Math.round((totalExpensesMonth / totalIncomeMonth) * 100)}%` : "—"}
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
        </>
      )}

      {tab === "yearly" && (
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
              {Object.keys(report.byCategory).length === 0 && <p className="text-sm text-muted">No expenses recorded this year.</p>}
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
