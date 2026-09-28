"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardHeader, StatCard, Badge } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCurrency } from "@/lib/currency";
import { buildInsights } from "@/lib/insights";
import { Wallet, Receipt, PiggyBank, Plane, ShieldCheck, TrendingUp, Banknote, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// Fixed sample data so the dashboard can be explored with no database and
// no account. Clearly marked as Demo Mode everywhere it appears.
const DEMO = {
  currency: "QAR" as const,
  totalIncome: 10500,
  totalExpenses: 5450,
  essential: 3800,
  lifestyle: 1650,
  savingsContribution: 1500,
  emergencyContribution: 500,
  vacationContribution: 667,
  investmentContribution: 1000,
  remaining: 883,
  byCategory: { Housing: 3000, Food: 800, Transportation: 500, Subscriptions: 150, Personal: 1000 } as Record<string, number>,
  previousByCategory: { Housing: 3000, Food: 950, Transportation: 500, Subscriptions: 150, Personal: 700 } as Record<string, number>,
  budgets: [
    { category: "Housing", amount: 3500 },
    { category: "Food", amount: 1200 },
    { category: "Transportation", amount: 600 },
    { category: "Subscriptions", amount: 200 },
    { category: "Personal", amount: 900 },
  ],
  vacations: [
    {
      destination: "Maldives",
      travelDate: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString(),
      flightCost: 3000,
      hotelCost: 2800,
      foodBudget: 1200,
      transportation: 400,
      activities: 800,
      shopping: 400,
      buffer: 400,
      savedSoFar: 2000,
    },
  ],
};

export default function DemoPage() {
  const insights = useMemo(
    () =>
      buildInsights({
        currentExpensesByCategory: DEMO.byCategory,
        previousExpensesByCategory: DEMO.previousByCategory,
        currentBudgets: DEMO.budgets,
        totalIncome: DEMO.totalIncome,
        totalExpenses: DEMO.totalExpenses,
        savingsAmount: DEMO.savingsContribution + DEMO.emergencyContribution,
        vacations: DEMO.vacations,
        savingsGoals: [],
        emergencyFundCurrent: 12000,
        essentialMonthlyExpenses: DEMO.essential,
      }),
    []
  );

  const chartData = [
    { name: "Income", value: DEMO.totalIncome },
    { name: "Essential", value: DEMO.essential },
    { name: "Lifestyle", value: DEMO.lifestyle },
    { name: "Savings", value: DEMO.savingsContribution + DEMO.emergencyContribution },
    { name: "Vacation", value: DEMO.vacationContribution },
    { name: "Investments", value: DEMO.investmentContribution },
    { name: "Remaining", value: DEMO.remaining },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            ر.ق
          </div>
          <span className="text-sm font-semibold text-foreground">Mouhib Finance</span>
          <Badge tone="warning">Demo Mode — sample data, nothing saved</Badge>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/register" className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            Create my account
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Monthly Overview</h1>
            <p className="text-sm text-muted">
              This month · Amounts in {DEMO.currency} ·{" "}
              <span className="text-warning font-medium">sample data, not connected to any database</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Salary" value={formatCurrency(DEMO.totalIncome, DEMO.currency)} icon={<Wallet size={16} className="text-muted" />} />
            <StatCard label="Expenses" value={formatCurrency(DEMO.totalExpenses, DEMO.currency)} tone="warning" icon={<Receipt size={16} className="text-muted" />} />
            <StatCard label="Savings" value={formatCurrency(DEMO.savingsContribution + DEMO.emergencyContribution, DEMO.currency)} tone="success" icon={<PiggyBank size={16} className="text-muted" />} />
            <StatCard label="Vacation Fund" value={formatCurrency(DEMO.vacationContribution, DEMO.currency)} icon={<Plane size={16} className="text-muted" />} />
            <StatCard label="Emergency Fund" value={formatCurrency(DEMO.emergencyContribution, DEMO.currency)} icon={<ShieldCheck size={16} className="text-muted" />} />
            <StatCard label="Investments" value={formatCurrency(DEMO.investmentContribution, DEMO.currency)} tone="accent" icon={<TrendingUp size={16} className="text-muted" />} />
            <StatCard label="Remaining" value={formatCurrency(DEMO.remaining, DEMO.currency)} icon={<Banknote size={16} className="text-muted" />} />
            <StatCard label="Expense Ratio" value={`${Math.round((DEMO.totalExpenses / DEMO.totalIncome) * 100)}%`} icon={<Receipt size={16} className="text-muted" />} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Monthly Cash Flow" subtitle="Where your salary goes, step by step" />
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={(v) => formatCurrency(v, DEMO.currency)} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v), DEMO.currency)}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Financial Insights" subtitle="Generated from the sample data above" />
              <div className="flex flex-col gap-3">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {insight.tone === "warning" ? (
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" />
                    ) : insight.tone === "positive" ? (
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" />
                    ) : (
                      <Lightbulb size={15} className="mt-0.5 shrink-0 text-info" />
                    )}
                    <span className="text-foreground">{insight.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Budget Snapshot" subtitle="This month's category performance" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO.budgets.map((b) => {
                const spent = DEMO.byCategory[b.category] ?? 0;
                const pct = Math.min(100, (spent / b.amount) * 100);
                const exceeded = spent > b.amount;
                return (
                  <div key={b.category} className="rounded-xl border border-border p-3">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{b.category}</span>
                      {exceeded && <Badge tone="danger">⚠️ Exceeded</Badge>}
                    </div>
                    <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div className={`h-full rounded-full ${exceeded ? "bg-danger" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted">
                      <span>{formatCurrency(spent, DEMO.currency)} spent</span>
                      <span>{formatCurrency(b.amount, DEMO.currency)} budget</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <p className="text-sm text-foreground">
              This is sample data — nothing here is saved. When you&apos;re ready to track your real finances,{" "}
              <Link href="/register" className="font-medium text-primary">
                create a free account
              </Link>{" "}
              (needs a database —{" "}
              <Link href="/db-setup" className="font-medium text-primary">
                connect one here
              </Link>
              ).
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
