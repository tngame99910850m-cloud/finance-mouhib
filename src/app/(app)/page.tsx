"use client";
/* eslint-disable react-hooks/preserve-manual-memoization -- deps are already correct; the experimental compiler just can't further optimize */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, StatCard, Badge, Select } from "@/components/ui";
import { useStore, useIsHydrated } from "@/lib/use-store";
import { formatCurrency } from "@/lib/currency";
import { monthKey, monthLabel, lastNMonthKeys, requiredMonthlySaving, monthsBetween, totalIncome, ESSENTIAL_CATEGORIES } from "@/lib/finance";
import { buildInsights } from "@/lib/insights";
import { Wallet, Receipt, PiggyBank, Plane, ShieldCheck, TrendingUp, Banknote, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useIsHydrated();
  const store = useStore();
  const [month, setMonth] = useState(monthKey(new Date()));

  useEffect(() => {
    if (hydrated && !store.setupComplete) {
      router.push("/setup");
    }
  }, [hydrated, store.setupComplete, router]);

  const months = useMemo(() => lastNMonthKeys(12), []);
  const currency = store.settings.displayCurrency;
  const prevMonth = useMemo(() => lastNMonthKeys(2, month)[0], [month]);

  const snapshot = useMemo(() => {
    function snapshotFor(m: string) {
      const income = store.incomes.find((i) => i.month === m);
      const expenses = store.expenses.filter((e) => monthKey(new Date(e.date)) === m);
      const totalInc = income ? totalIncome(income) : 0;
      const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
      const essential = expenses.filter((e) => ESSENTIAL_CATEGORIES.includes(e.category)).reduce((s, e) => s + e.amount, 0);
      const byCategory: Record<string, number> = {};
      for (const e of expenses) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
      const budgets = store.budgets.filter((b) => b.month === m);
      return { totalIncome: totalInc, totalExpenses: totalExp, essentialExpenses: essential, byCategory, budgets };
    }
    return { current: snapshotFor(month), previous: snapshotFor(prevMonth) };
  }, [store, month, prevMonth]);

  const calc = useMemo(() => {
    const { current } = snapshot;
    const emergencyGoal = store.savingsGoals.find((g) => g.name === "Emergency Fund");
    const emergencyContribution = emergencyGoal?.monthlyContribution ?? 0;
    const savingsContribution = store.savingsGoals
      .filter((g) => g.name !== "Emergency Fund")
      .reduce((sum, g) => sum + g.monthlyContribution, 0);
    const investmentContribution = store.investments.reduce((sum, i) => sum + i.monthlyContribution, 0);
    const vacationContribution = store.vacations.reduce((sum, v) => {
      const total = v.flightCost + v.hotelCost + v.foodBudget + v.transportation + v.activities + v.shopping + v.buffer;
      const months = monthsBetween(new Date(), new Date(v.travelDate));
      return sum + requiredMonthlySaving(total, v.savedSoFar, months);
    }, 0);

    const totalAllocated = savingsContribution + vacationContribution + emergencyContribution + investmentContribution;
    const remaining = current.totalIncome - current.totalExpenses - totalAllocated;

    const essential = current.essentialExpenses;
    const lifestyle = current.totalExpenses - essential;

    return { emergencyContribution, savingsContribution, investmentContribution, vacationContribution, remaining, essential, lifestyle, emergencyGoal };
  }, [snapshot, store.savingsGoals, store.investments, store.vacations]);

  const insights = useMemo(
    () =>
      buildInsights({
        currentExpensesByCategory: snapshot.current.byCategory,
        previousExpensesByCategory: snapshot.previous.byCategory,
        currentBudgets: snapshot.current.budgets,
        totalIncome: snapshot.current.totalIncome,
        totalExpenses: snapshot.current.totalExpenses,
        savingsAmount: calc.savingsContribution + calc.emergencyContribution,
        vacations: store.vacations,
        savingsGoals: store.savingsGoals,
        emergencyFundCurrent: calc.emergencyGoal?.currentAmount ?? 0,
        essentialMonthlyExpenses: snapshot.current.essentialExpenses,
      }),
    [snapshot, calc, store.vacations, store.savingsGoals]
  );

  const chartData = [
    { name: "Income", value: snapshot.current.totalIncome },
    { name: "Essential", value: calc.essential },
    { name: "Lifestyle", value: calc.lifestyle },
    { name: "Savings", value: calc.savingsContribution + calc.emergencyContribution },
    { name: "Vacation", value: calc.vacationContribution },
    { name: "Investments", value: calc.investmentContribution },
    { name: "Remaining", value: Math.max(0, calc.remaining) },
  ];

  if (!hydrated) {
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
        <StatCard label="Salary" value={formatCurrency(snapshot.current.totalIncome, currency)} icon={<Wallet size={16} className="text-muted" />} />
        <StatCard label="Expenses" value={formatCurrency(snapshot.current.totalExpenses, currency)} tone="warning" icon={<Receipt size={16} className="text-muted" />} />
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
          value={snapshot.current.totalIncome > 0 ? `${Math.round((snapshot.current.totalExpenses / snapshot.current.totalIncome) * 100)}%` : "—"}
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

      {snapshot.current.budgets.length > 0 && (
        <Card>
          <CardHeader title="Budget Snapshot" subtitle="This month's category performance" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {snapshot.current.budgets.map((b) => {
              const spent = snapshot.current.byCategory[b.category] ?? 0;
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
