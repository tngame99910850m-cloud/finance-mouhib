"use client";
/* eslint-disable react-hooks/preserve-manual-memoization -- deps are already correct; the experimental compiler just can't further optimize */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, StatCard, Badge, Select } from "@/components/ui";
import { useApi } from "@/lib/use-api";
import { formatCurrency } from "@/lib/currency";
import { monthKey, monthLabel, lastNMonthKeys, requiredMonthlySaving, monthsBetween } from "@/lib/finance";
import { buildInsights } from "@/lib/insights";
import { Wallet, Receipt, PiggyBank, Plane, ShieldCheck, TrendingUp, Banknote, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Income = { basicSalary: number; allowances: number; bonuses: number; overtime: number; otherIncome: number };
type Expense = { id: string; amount: number; category: string; date: string };
type Budget = { category: string; amount: number };
type SavingsGoal = { id: string; name: string; targetAmount: number; currentAmount: number; monthlyContribution: number };
type Investment = { id: string; monthlyContribution: number };
type Vacation = { id: string; destination: string; travelDate: string; flightCost: number; hotelCost: number; foodBudget: number; transportation: number; activities: number; shopping: number; buffer: number; savedSoFar: number };

type MonthSnapshot = {
  month: string;
  income: Income | null;
  totalIncome: number;
  expenses: Expense[];
  totalExpenses: number;
  essentialExpenses: number;
  budgets: Budget[];
  byCategory: Record<string, number>;
};

type DashboardData = {
  current: MonthSnapshot;
  previous: MonthSnapshot;
  savingsGoals: SavingsGoal[];
  investments: Investment[];
  vacations: Vacation[];
  settings: { displayCurrency: "QAR" | "USD" | "EUR" | "TND" };
};

export default function DashboardPage() {
  const router = useRouter();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [checkedSetup, setCheckedSetup] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        if (me && me.setupComplete === false) {
          router.push("/setup");
        } else {
          setCheckedSetup(true);
        }
      })
      .catch(() => setCheckedSetup(true));
  }, [router]);

  const { data, loading } = useApi<DashboardData>(checkedSetup ? `/api/dashboard?month=${month}` : null);

  const months = useMemo(() => lastNMonthKeys(12), []);

  const currency = data?.settings?.displayCurrency ?? "QAR";

  const calc = useMemo(() => {
    if (!data) return null;
    const { current, savingsGoals, investments, vacations } = data;

    const emergencyGoal = savingsGoals.find((g) => g.name === "Emergency Fund");
    const emergencyContribution = emergencyGoal?.monthlyContribution ?? 0;
    const savingsContribution = savingsGoals
      .filter((g) => g.name !== "Emergency Fund")
      .reduce((sum, g) => sum + g.monthlyContribution, 0);
    const investmentContribution = investments.reduce((sum, i) => sum + i.monthlyContribution, 0);
    const vacationContribution = vacations.reduce((sum, v) => {
      const total = v.flightCost + v.hotelCost + v.foodBudget + v.transportation + v.activities + v.shopping + v.buffer;
      const months = monthsBetween(new Date(), new Date(v.travelDate));
      return sum + requiredMonthlySaving(total, v.savedSoFar, months);
    }, 0);

    const totalAllocated = savingsContribution + vacationContribution + emergencyContribution + investmentContribution;
    const remaining = current.totalIncome - current.totalExpenses - totalAllocated;

    const essential = current.essentialExpenses;
    const lifestyle = current.totalExpenses - essential;

    return {
      emergencyContribution,
      savingsContribution,
      investmentContribution,
      vacationContribution,
      totalAllocated,
      remaining,
      essential,
      lifestyle,
      emergencyGoal,
    };
  }, [data]);

  const insights = useMemo(() => {
    if (!data || !calc) return [];
    return buildInsights({
      currentExpensesByCategory: data.current.byCategory,
      previousExpensesByCategory: data.previous.byCategory,
      currentBudgets: data.current.budgets,
      totalIncome: data.current.totalIncome,
      totalExpenses: data.current.totalExpenses,
      savingsAmount: calc.savingsContribution + calc.emergencyContribution,
      vacations: data.vacations,
      savingsGoals: data.savingsGoals,
      emergencyFundCurrent: calc.emergencyGoal?.currentAmount ?? 0,
      essentialMonthlyExpenses: data.current.essentialExpenses,
    });
  }, [data, calc]);

  const chartData = useMemo(() => {
    if (!data || !calc) return [];
    return [
      { name: "Income", value: data.current.totalIncome },
      { name: "Essential", value: calc.essential },
      { name: "Lifestyle", value: calc.lifestyle },
      { name: "Savings", value: calc.savingsContribution + calc.emergencyContribution },
      { name: "Vacation", value: calc.vacationContribution },
      { name: "Investments", value: calc.investmentContribution },
      { name: "Remaining", value: Math.max(0, calc.remaining) },
    ];
  }, [data, calc]);

  if (!checkedSetup || loading || !data || !calc) {
    return <div className="py-20 text-center text-sm text-muted">Loading your dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Monthly Overview</h1>
          <p className="text-sm text-muted">{monthLabel(month)} · Amounts in {currency}</p>
        </div>
        <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-44">
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Salary" value={formatCurrency(data.current.totalIncome, currency)} icon={<Wallet size={16} className="text-muted" />} />
        <StatCard label="Expenses" value={formatCurrency(data.current.totalExpenses, currency)} tone="warning" icon={<Receipt size={16} className="text-muted" />} />
        <StatCard label="Savings" value={formatCurrency(calc.savingsContribution + calc.emergencyContribution, currency)} tone="success" icon={<PiggyBank size={16} className="text-muted" />} />
        <StatCard label="Vacation Fund" value={formatCurrency(calc.vacationContribution, currency)} icon={<Plane size={16} className="text-muted" />} />
        <StatCard label="Emergency Fund" value={formatCurrency(calc.emergencyContribution, currency)} icon={<ShieldCheck size={16} className="text-muted" />} />
        <StatCard label="Investments" value={formatCurrency(calc.investmentContribution, currency)} tone="accent" icon={<TrendingUp size={16} className="text-muted" />} />
        <StatCard
          label="Remaining"
          value={formatCurrency(calc.remaining, currency)}
          tone={calc.remaining < 0 ? "danger" : "default"}
          icon={<Banknote size={16} className="text-muted" />}
        />
        <StatCard
          label="Expense Ratio"
          value={data.current.totalIncome > 0 ? `${Math.round((data.current.totalExpenses / data.current.totalIncome) * 100)}%` : "—"}
          icon={<Receipt size={16} className="text-muted" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly Cash Flow" subtitle="Where your salary goes, step by step" />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={(v) => formatCurrency(v, currency)} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: "var(--muted)" }} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v), currency)}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Financial Insights" subtitle="Based only on your data" />
          <div className="flex flex-col gap-3">
            {insights.length === 0 && <p className="text-sm text-muted">Add income and expenses to see personalized insights here.</p>}
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

      {data.current.budgets.length > 0 && (
        <Card>
          <CardHeader title="Budget Snapshot" subtitle="This month's category performance" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.current.budgets.map((b) => {
              const spent = data.current.byCategory[b.category] ?? 0;
              const pct = b.amount > 0 ? Math.min(999, (spent / b.amount) * 100) : 0;
              const exceeded = spent > b.amount;
              return (
                <div key={b.category} className="rounded-xl border border-border p-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{b.category}</span>
                    {exceeded && <Badge tone="danger">⚠️ Exceeded</Badge>}
                  </div>
                  <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={`h-full rounded-full ${exceeded ? "bg-danger" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{formatCurrency(spent, currency)} spent</span>
                    <span>{formatCurrency(b.amount, currency)} budget</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
