"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardHeader, Input, Label, Select } from "@/components/ui";
import { useCollection } from "@/lib/use-store";
import { addItem, deleteItem, updateItem, updateStore } from "@/lib/local-store";
import { CURRENCY_SYMBOLS, CurrencyCode, formatCurrency } from "@/lib/currency";
import { CALENDAR_EVENT_TYPES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/categories";
import { monthKey, monthLabel, lastNMonthKeys } from "@/lib/finance";
import { Trash2, Bell, Repeat } from "lucide-react";

const CURRENCIES: CurrencyCode[] = ["QAR", "USD", "EUR", "TND"];

export default function SettingsPage() {
  const settings = useCollection("settings");
  const rules = useCollection("rules");
  const [month, setMonth] = useState(monthKey(new Date()));
  const allEvents = useCollection("calendarEvents");
  const events = useMemo(() => allEvents.filter((ev) => monthKey(new Date(ev.date)) === month), [allEvents, month]);
  const allExpenses = useCollection("expenses");
  const recurring = useCollection("recurringExpenses");

  const [currency, setCurrency] = useState<CurrencyCode>("QAR");
  const [emergencyMonths, setEmergencyMonths] = useState(6);

  const [eventForm, setEventForm] = useState({ title: "", type: "bill", date: "", amount: "", reminder: true });
  const [recurringForm, setRecurringForm] = useState({ name: "", category: EXPENSE_CATEGORIES[0].name, amount: "", dayOfMonth: "1" });

  const months = useMemo(() => lastNMonthKeys(12), []);

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local form state from a fetched record
      setCurrency(settings.displayCurrency);
      setEmergencyMonths(settings.emergencyTargetMonths);
    }
  }, [settings]);

  function handleSaveSettings() {
    updateStore((data) => ({ ...data, settings: { ...data.settings, displayCurrency: currency, emergencyTargetMonths: emergencyMonths } }));
  }

  function toggleRule(rule: { id: string; active: boolean }) {
    updateItem("rules", rule.id, { active: !rule.active });
  }

  function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date) return;
    addItem("calendarEvents", {
      title: eventForm.title,
      type: eventForm.type,
      date: new Date(eventForm.date).toISOString(),
      amount: eventForm.amount ? Number(eventForm.amount) : null,
      reminder: eventForm.reminder,
    });
    setEventForm({ title: "", type: "bill", date: "", amount: "", reminder: true });
  }

  function handleDeleteEvent(id: string) {
    deleteItem("calendarEvents", id);
  }

  function handleAddRecurring(e: React.FormEvent) {
    e.preventDefault();
    if (!recurringForm.name || !recurringForm.amount) return;
    addItem("recurringExpenses", {
      name: recurringForm.name,
      category: recurringForm.category,
      amount: Number(recurringForm.amount),
      dayOfMonth: Number(recurringForm.dayOfMonth) || 1,
      paymentMethod: PAYMENT_METHODS[0],
      active: true,
    });
    setRecurringForm({ name: "", category: EXPENSE_CATEGORIES[0].name, amount: "", dayOfMonth: "1" });
  }

  function handleDeleteRecurring(id: string) {
    deleteItem("recurringExpenses", id);
  }

  function handleApplyRecurring() {
    const thisMonth = monthKey(new Date());
    const [y, m] = thisMonth.split("-").map(Number);
    const alreadyApplied = allExpenses.filter((e) => monthKey(new Date(e.date)) === thisMonth && e.isRecurring);
    let created = 0;
    for (const r of recurring.filter((r) => r.active)) {
      if (alreadyApplied.some((e) => e.description?.includes(`recurring:${r.id}`))) continue;
      const day = Math.min(r.dayOfMonth, 28);
      addItem("expenses", {
        amount: r.amount,
        category: r.category,
        date: new Date(y, m - 1, day).toISOString(),
        description: `${r.name} [recurring:${r.id}]`,
        isRecurring: true,
        paymentMethod: r.paymentMethod,
      });
      created++;
    }
    alert(`Applied ${created} recurring expense(s) to this month.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted">Preferences, financial rules, and your financial calendar.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Display preferences" />
          <div className="flex flex-col gap-3">
            <div>
              <Label>Display currency</Label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_SYMBOLS[c]}) {c === "QAR" ? "— primary" : ""}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-muted">QAR remains your primary bookkeeping currency; this only changes the display.</p>
            </div>
            <div>
              <Label>Emergency fund target (months of essential expenses)</Label>
              <Input type="number" min={1} max={24} value={emergencyMonths} onChange={(e) => setEmergencyMonths(Number(e.target.value))} />
            </div>
            <Button onClick={handleSaveSettings} className="mt-1 w-fit">
              Save preferences
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Financial rules" subtitle="Customize the principles guiding your plan" />
          <div className="flex flex-col gap-2">
            {(rules ?? []).map((rule) => (
              <label key={rule.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <input type="checkbox" checked={rule.active} onChange={() => toggleRule(rule)} className="mt-0.5 h-4 w-4 rounded border-border" />
                <div>
                  <p className="text-sm font-medium text-foreground">{rule.title}</p>
                  <p className="text-xs text-muted">{rule.detail}</p>
                </div>
              </label>
            ))}
            {(!rules || rules.length === 0) && <p className="text-sm text-muted">No rules yet.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <CardHeader title="Recurring expenses" subtitle="These automatically appear in future monthly budgets" />
          <Button variant="secondary" onClick={handleApplyRecurring}>
            Apply to this month
          </Button>
        </div>

        <form onSubmit={handleAddRecurring} className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
          <div className="sm:col-span-2">
            <Label>Name</Label>
            <Input required value={recurringForm.name} onChange={(e) => setRecurringForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Netflix" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={recurringForm.category} onChange={(e) => setRecurringForm((f) => ({ ...f, category: e.target.value }))}>
              {EXPENSE_CATEGORIES.map((g) => (
                <option key={g.name} value={g.name}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Amount (QAR)</Label>
            <Input type="number" min={0} required value={recurringForm.amount} onChange={(e) => setRecurringForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <Label>Day of month</Label>
            <Input type="number" min={1} max={28} value={recurringForm.dayOfMonth} onChange={(e) => setRecurringForm((f) => ({ ...f, dayOfMonth: e.target.value }))} />
          </div>
          <Button type="submit" className="sm:col-span-1">
            Add recurring
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          {(recurring ?? []).length === 0 && <p className="text-sm text-muted">No recurring expenses set up yet.</p>}
          {(recurring ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="flex items-center gap-3">
                <Repeat size={14} className="text-info" />
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted">
                    {r.category} · Day {r.dayOfMonth} of each month
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground">{formatCurrency(r.amount)}/mo</span>
                <button onClick={() => handleDeleteRecurring(r.id)} className="text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <CardHeader title="Financial calendar" subtitle="Salary dates, bills, subscriptions and savings transfers" />
          <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-44">
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </Select>
        </div>

        <form onSubmit={handleAddEvent} className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input required value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Rent due" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={eventForm.type} onChange={(e) => setEventForm((f) => ({ ...f, type: e.target.value }))}>
              {CALENDAR_EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" required value={eventForm.date} onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <Label>Amount (optional)</Label>
            <Input type="number" min={0} value={eventForm.amount} onChange={(e) => setEventForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <Button type="submit" className="sm:col-span-1">
            Add event
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          {(events ?? []).length === 0 && <p className="text-sm text-muted">No events for this month.</p>}
          {(events ?? [])
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-3">
                  {ev.reminder && <Bell size={14} className="text-info" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">{ev.title}</p>
                    <p className="text-xs text-muted">
                      {new Date(ev.date).toLocaleDateString("en-GB")} · {ev.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ev.amount != null && <span className="text-sm text-foreground">{ev.amount}</span>}
                  <button onClick={() => handleDeleteEvent(ev.id)} className="text-muted hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
