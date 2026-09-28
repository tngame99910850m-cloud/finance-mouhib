"use client";

import { useMemo, useState } from "react";
import { Button, Badge, Card, CardHeader, Input, Label, Select } from "@/components/ui";
import { useApi, apiPost, apiDelete } from "@/lib/use-api";
import { formatCurrency } from "@/lib/currency";
import { monthKey, monthLabel, lastNMonthKeys } from "@/lib/finance";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/categories";
import { Trash2, Repeat } from "lucide-react";

type Expense = {
  id: string;
  amount: number;
  category: string;
  subcategory?: string | null;
  date: string;
  description?: string | null;
  isRecurring: boolean;
  paymentMethod: string;
};

const CUSTOM = "__custom__";

export default function ExpensesPage() {
  const [month, setMonth] = useState(monthKey(new Date()));
  const { data: expenses, loading, refetch } = useApi<Expense[]>(`/api/expenses?month=${month}`);

  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [customCategory, setCustomCategory] = useState("");
  const [subcategory, setSubcategory] = useState(EXPENSE_CATEGORIES[0].subcategories[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");

  const months = useMemo(() => lastNMonthKeys(12), []);
  const activeGroup = EXPENSE_CATEGORIES.find((g) => g.name === category);

  const filtered = useMemo(() => {
    const list = expenses ?? [];
    if (filterCategory === "all") return list;
    return list.filter((e) => e.category === filterCategory);
  }, [expenses, filterCategory]);

  const total = useMemo(() => filtered.reduce((sum, e) => sum + e.amount, 0), [filtered]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses ?? []) map[e.category] = (map[e.category] ?? 0) + e.amount;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    try {
      const finalCategory = category === CUSTOM ? customCategory.trim() : category;
      if (!finalCategory) return;
      await apiPost("/api/expenses", {
        amount: Number(amount),
        category: finalCategory,
        subcategory: category === CUSTOM ? null : subcategory,
        date: new Date(date).toISOString(),
        description: description || null,
        isRecurring,
        paymentMethod,
      });
      setAmount("");
      setDescription("");
      setIsRecurring(false);
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await apiDelete(`/api/expenses/${id}`);
    refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Expenses</h1>
          <p className="text-sm text-muted">Log and categorize your spending.</p>
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
          <CardHeader title="Add expense" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <Label>Amount (QAR)</Label>
              <Input type="number" required min={0.01} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  const group = EXPENSE_CATEGORIES.find((g) => g.name === e.target.value);
                  if (group) setSubcategory(group.subcategories[0]);
                }}
              >
                {EXPENSE_CATEGORIES.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name}
                  </option>
                ))}
                <option value={CUSTOM}>+ Custom category...</option>
              </Select>
            </div>
            {category === CUSTOM ? (
              <div>
                <Label>Custom category name</Label>
                <Input required value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="e.g. Home decor" />
              </div>
            ) : (
              <div>
                <Label>Subcategory</Label>
                <Select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                  {activeGroup?.subcategories.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label>Date</Label>
              <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Payment method</Label>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Carrefour groceries" />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-border" />
              Recurring expense
            </label>
            <Button type="submit" disabled={saving} className="mt-1">
              {saving ? "Adding..." : "Add expense"}
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Spending by category" subtitle={`Total this month: ${formatCurrency(total)}`} />
          <div className="flex flex-col gap-2">
            {byCategory.length === 0 && <p className="text-sm text-muted">No expenses logged for this month yet.</p>}
            {byCategory.map(([cat, amt]) => {
              const pct = expenses && expenses.length > 0 ? (amt / (expenses.reduce((s, e) => s + e.amount, 0) || 1)) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-foreground">{cat}</span>
                    <span className="text-muted">{formatCurrency(amt)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <CardHeader title="Transactions" />
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-48">
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map((g) => (
              <option key={g.name} value={g.name}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {!loading && filtered.length === 0 && <p className="text-sm text-muted">No transactions found.</p>}
        {filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-muted">{new Date(e.date).toLocaleDateString("en-GB")}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground">{e.category}</span>
                        {e.isRecurring && <Repeat size={12} className="text-info" />}
                      </div>
                      {e.subcategory && <span className="text-xs text-muted">{e.subcategory}</span>}
                    </td>
                    <td className="py-2 pr-4 text-muted">{e.description || "—"}</td>
                    <td className="py-2 pr-4">
                      <Badge>{e.paymentMethod}</Badge>
                    </td>
                    <td className="py-2 pr-4 font-medium text-foreground">{formatCurrency(e.amount)}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => handleDelete(e.id)} className="text-muted hover:text-danger">
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
