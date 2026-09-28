"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardHeader, Input, Label, Select, Badge } from "@/components/ui";
import { useCollection, useIsHydrated } from "@/lib/use-store";
import { addItem, deleteItem, updateStore } from "@/lib/local-store";
import { formatCurrency } from "@/lib/currency";
import { projectInvestment } from "@/lib/finance";
import { INVESTMENT_CATEGORIES, RISK_PROFILES } from "@/lib/categories";
import { Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const emptyForm = {
  name: "",
  category: INVESTMENT_CATEGORIES[0],
  initialAmount: "",
  monthlyContribution: "",
  expectedAnnualReturn: "6",
  durationYears: "10",
  feesPercent: "0",
  riskProfile: "Moderate",
};

const PIE_COLORS = ["#0f766e", "#7c3aed", "#2563eb", "#d97706"];

export default function InvestmentsPage() {
  const investments = useCollection("investments");
  const hydrated = useIsHydrated();
  const settings = useCollection("settings");

  const [form, setForm] = useState(emptyForm);

  const [calc, setCalc] = useState({ initial: "5000", monthly: "1000", returnPct: "7", years: "10" });

  const [alloc, setAlloc] = useState({ available: "1500", emergency: 20, invest: 53, vacation: 20, buffer: 7 });
  const [riskProfile, setRiskProfile] = useState<"Conservative" | "Moderate" | "Aggressive">("Moderate");

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from a fetched record
      setAlloc((a) => ({
        ...a,
        emergency: settings.allocEmergencyPct,
        invest: settings.allocInvestPct,
        vacation: settings.allocVacationPct,
        buffer: settings.allocBufferPct,
      }));
    }
  }, [settings]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    addItem("investments", {
      name: form.name,
      category: form.category,
      initialAmount: Number(form.initialAmount) || 0,
      monthlyContribution: Number(form.monthlyContribution) || 0,
      expectedAnnualReturn: Number(form.expectedAnnualReturn) || 0,
      durationYears: Number(form.durationYears) || 1,
      feesPercent: Number(form.feesPercent) || 0,
      riskProfile: form.riskProfile,
    });
    setForm(emptyForm);
  }

  function handleDelete(id: string) {
    deleteItem("investments", id);
  }

  const calcResult = useMemo(
    () =>
      projectInvestment({
        initialAmount: Number(calc.initial) || 0,
        monthlyContribution: Number(calc.monthly) || 0,
        annualReturnPercent: Number(calc.returnPct) || 0,
        years: Number(calc.years) || 0,
      }),
    [calc]
  );

  const allocTotal = alloc.emergency + alloc.invest + alloc.vacation + alloc.buffer;
  const availableAmount = Number(alloc.available) || 0;
  const allocPieData = [
    { name: "Emergency Fund", value: (availableAmount * alloc.emergency) / 100 },
    { name: "Investments", value: (availableAmount * alloc.invest) / 100 },
    { name: "Vacation", value: (availableAmount * alloc.vacation) / 100 },
    { name: "Cash Buffer", value: (availableAmount * alloc.buffer) / 100 },
  ];

  function handleSaveAllocation() {
    updateStore((data) => ({
      ...data,
      settings: {
        ...data.settings,
        allocEmergencyPct: alloc.emergency,
        allocInvestPct: alloc.invest,
        allocVacationPct: alloc.vacation,
        allocBufferPct: alloc.buffer,
      },
    }));
  }

  const totalMonthlyInvestment = (investments ?? []).reduce((s, i) => s + i.monthlyContribution, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Investments</h1>
        <p className="text-sm text-muted">
          A planning and education tool. <strong>Projections are estimates, not guaranteed returns.</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Add an investment" subtitle="Model a category you're planning or already contributing to" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <Label>Name</Label>
              <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. QIA Index Fund" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {INVESTMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Initial investment (QAR)</Label>
              <Input type="number" min={0} value={form.initialAmount} onChange={(e) => setForm((f) => ({ ...f, initialAmount: e.target.value }))} />
            </div>
            <div>
              <Label>Monthly contribution (QAR)</Label>
              <Input type="number" min={0} value={form.monthlyContribution} onChange={(e) => setForm((f) => ({ ...f, monthlyContribution: e.target.value }))} />
            </div>
            <div>
              <Label>Expected annual return (%)</Label>
              <Input type="number" value={form.expectedAnnualReturn} onChange={(e) => setForm((f) => ({ ...f, expectedAnnualReturn: e.target.value }))} />
            </div>
            <div>
              <Label>Duration (years)</Label>
              <Input type="number" min={0.5} step="0.5" value={form.durationYears} onChange={(e) => setForm((f) => ({ ...f, durationYears: e.target.value }))} />
            </div>
            <div>
              <Label>Fees (%/year)</Label>
              <Input type="number" min={0} value={form.feesPercent} onChange={(e) => setForm((f) => ({ ...f, feesPercent: e.target.value }))} />
            </div>
            <div>
              <Label>Risk profile</Label>
              <Select value={form.riskProfile} onChange={(e) => setForm((f) => ({ ...f, riskProfile: e.target.value }))}>
                {Object.keys(RISK_PROFILES).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit">Add investment</Button>
          </form>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          {!hydrated && <p className="text-sm text-muted">Loading...</p>}
          {hydrated && (investments ?? []).length === 0 && (
            <Card>
              <p className="text-sm text-muted">No investments modeled yet.</p>
            </Card>
          )}
          {(investments ?? []).map((inv) => {
            const result = projectInvestment({
              initialAmount: inv.initialAmount,
              monthlyContribution: inv.monthlyContribution,
              annualReturnPercent: inv.expectedAnnualReturn,
              years: inv.durationYears,
              feesPercent: inv.feesPercent,
            });
            return (
              <Card key={inv.id}>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{inv.name}</h3>
                    <div className="mt-1 flex gap-2">
                      <Badge>{inv.category}</Badge>
                      <Badge>{inv.riskProfile}</Badge>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(inv.id)} className="text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted">Contributed</p>
                    <p className="font-medium text-foreground">{formatCurrency(result.totalContributed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Est. growth</p>
                    <p className="font-medium text-success">+{formatCurrency(result.estimatedGrowth)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Est. final value</p>
                    <p className="font-semibold text-foreground">{formatCurrency(result.finalValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Est. return</p>
                    <p className="font-medium text-foreground">
                      {result.totalContributed > 0 ? `${Math.round((result.estimatedGrowth / result.totalContributed) * 100)}%` : "—"}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
          {investments && investments.length > 0 && (
            <p className="text-xs text-muted">
              Total monthly investment contribution across all entries: {formatCurrency(totalMonthlyInvestment)}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader title="Compound growth calculator" subtitle="Estimate the future value of a standalone plan" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <Label>Initial amount (QAR)</Label>
            <Input type="number" min={0} value={calc.initial} onChange={(e) => setCalc((c) => ({ ...c, initial: e.target.value }))} />
          </div>
          <div>
            <Label>Monthly contribution (QAR)</Label>
            <Input type="number" min={0} value={calc.monthly} onChange={(e) => setCalc((c) => ({ ...c, monthly: e.target.value }))} />
          </div>
          <div>
            <Label>Annual return assumption (%)</Label>
            <Input type="number" value={calc.returnPct} onChange={(e) => setCalc((c) => ({ ...c, returnPct: e.target.value }))} />
          </div>
          <div>
            <Label>Period (years)</Label>
            <Input type="number" min={1} value={calc.years} onChange={(e) => setCalc((c) => ({ ...c, years: e.target.value }))} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-muted p-4">
            <p className="text-xs text-muted">Total contributions</p>
            <p className="text-xl font-semibold text-foreground">{formatCurrency(calcResult.totalContributed)}</p>
          </div>
          <div className="rounded-xl bg-surface-muted p-4">
            <p className="text-xs text-muted">Estimated growth</p>
            <p className="text-xl font-semibold text-success">+{formatCurrency(calcResult.estimatedGrowth)}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-4">
            <p className="text-xs text-muted">Estimated final value</p>
            <p className="text-xl font-semibold text-foreground">{formatCurrency(calcResult.finalValue)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">Projected returns are hypothetical and not guaranteed.</p>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Investment allocation planner" subtitle="Split your monthly available investment amount" />
          <div className="mb-3">
            <Label>Monthly available investment (QAR)</Label>
            <Input type="number" min={0} value={alloc.available} onChange={(e) => setAlloc((a) => ({ ...a, available: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Emergency fund %</Label>
              <Input type="number" min={0} max={100} value={alloc.emergency} onChange={(e) => setAlloc((a) => ({ ...a, emergency: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Long-term investments %</Label>
              <Input type="number" min={0} max={100} value={alloc.invest} onChange={(e) => setAlloc((a) => ({ ...a, invest: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Vacation %</Label>
              <Input type="number" min={0} max={100} value={alloc.vacation} onChange={(e) => setAlloc((a) => ({ ...a, vacation: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Cash buffer %</Label>
              <Input type="number" min={0} max={100} value={alloc.buffer} onChange={(e) => setAlloc((a) => ({ ...a, buffer: Number(e.target.value) }))} />
            </div>
          </div>
          {allocTotal !== 100 && <p className="mt-2 text-xs text-warning">Percentages add up to {allocTotal}%, not 100%.</p>}
          <Button onClick={handleSaveAllocation} className="mt-3">Save allocation</Button>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {allocPieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-muted">{d.name}:</span>
                <span className="font-medium text-foreground">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Allocation breakdown" />
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {allocPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Risk profile — education, not advice" subtitle="Choose a profile to see commonly associated asset types" />
        <div className="mb-4 flex gap-2">
          {(["Conservative", "Moderate", "Aggressive"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRiskProfile(r)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${riskProfile === r ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted"}`}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="mb-3 text-sm text-foreground">{RISK_PROFILES[riskProfile].description}</p>
        <div className="flex flex-wrap gap-2">
          {RISK_PROFILES[riskProfile].typicalAssets.map((a) => (
            <Badge key={a}>{a}</Badge>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          This is general educational information, not personalized financial advice. It does not represent a recommendation to buy any specific asset.
        </p>
      </Card>
    </div>
  );
}
