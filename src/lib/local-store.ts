// Client-side data layer. Everything lives in the browser's localStorage —
// no server, no database, no account. One browser = one "profile".

export type Income = {
  id: string;
  month: string;
  basicSalary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  otherIncome: number;
  note?: string | null;
};

export type Expense = {
  id: string;
  amount: number;
  category: string;
  subcategory?: string | null;
  date: string;
  description?: string | null;
  isRecurring: boolean;
  paymentMethod: string;
};

export type Budget = { id: string; month: string; category: string; amount: number };

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: string | null;
};

export type Investment = {
  id: string;
  name: string;
  category: string;
  initialAmount: number;
  monthlyContribution: number;
  expectedAnnualReturn: number;
  durationYears: number;
  feesPercent: number;
  riskProfile: string;
};

export type Vacation = {
  id: string;
  destination: string;
  travelDate: string;
  flightCost: number;
  hotelCost: number;
  foodBudget: number;
  transportation: number;
  activities: number;
  shopping: number;
  buffer: number;
  savedSoFar: number;
};

export type RecurringExpense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  dayOfMonth: number;
  paymentMethod: string;
  active: boolean;
};

export type FinancialRule = { id: string; title: string; detail: string; active: boolean; order: number };

export type CalendarEvent = {
  id: string;
  title: string;
  type: string;
  date: string;
  amount?: number | null;
  reminder: boolean;
};

export type Settings = {
  displayCurrency: "QAR" | "USD" | "EUR" | "TND";
  emergencyTargetMonths: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  allocEmergencyPct: number;
  allocInvestPct: number;
  allocVacationPct: number;
  allocBufferPct: number;
};

export type StoreData = {
  setupComplete: boolean;
  incomes: Income[];
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  investments: Investment[];
  vacations: Vacation[];
  recurringExpenses: RecurringExpense[];
  rules: FinancialRule[];
  calendarEvents: CalendarEvent[];
  settings: Settings;
};

const STORAGE_KEY = "mouhib-finance-data-v1";

const DEFAULT_RULES: Omit<FinancialRule, "id">[] = [
  { title: "Pay essential expenses first", detail: "Cover housing, utilities, and food before discretionary spending.", active: true, order: 0 },
  { title: "Maintain an emergency fund", detail: "Keep 3-6+ months of essential expenses in accessible savings.", active: true, order: 1 },
  { title: "Save for planned expenses", detail: "Set aside money ahead of time for vacations and big purchases.", active: true, order: 2 },
  { title: "Invest only spare money", detail: "Only invest money you will not need in the near term.", active: true, order: 3 },
  { title: "Track recurring expenses", detail: "Review subscriptions and recurring bills regularly.", active: true, order: 4 },
  { title: "No guaranteed returns", detail: "Treat all investment projections as estimates, never guarantees.", active: true, order: 5 },
];

function defaultData(): StoreData {
  return {
    setupComplete: false,
    incomes: [],
    expenses: [],
    budgets: [],
    savingsGoals: [],
    investments: [],
    vacations: [],
    recurringExpenses: [],
    rules: DEFAULT_RULES.map((r) => ({ ...r, id: makeId() })),
    calendarEvents: [],
    settings: {
      displayCurrency: "QAR",
      emergencyTargetMonths: 6,
      needsPercent: 50,
      wantsPercent: 30,
      savingsPercent: 20,
      allocEmergencyPct: 20,
      allocInvestPct: 53,
      allocVacationPct: 20,
      allocBufferPct: 7,
    },
  };
}

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const listeners = new Set<() => void>();

// useSyncExternalStore requires getSnapshot() to return a referentially
// stable value when nothing has changed, or it re-renders forever. Cache
// the parsed object and only recompute it when the underlying storage is
// actually written to.
let cachedSnapshot: StoreData | null = null;

function readRaw(): StoreData {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    return { ...defaultData(), ...parsed, settings: { ...defaultData().settings, ...(parsed.settings ?? {}) } };
  } catch {
    return defaultData();
  }
}

function writeRaw(data: StoreData) {
  cachedSnapshot = data;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): StoreData {
  if (cachedSnapshot === null) cachedSnapshot = readRaw();
  return cachedSnapshot;
}

export function updateStore(updater: (data: StoreData) => StoreData): void {
  const current = getSnapshot();
  writeRaw(updater(current));
}

export function resetStore(): void {
  cachedSnapshot = defaultData();
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((l) => l());
}

// Generic collection helpers -------------------------------------------------

export function addItem<K extends keyof StoreData>(
  key: K,
  item: StoreData[K] extends (infer T)[] ? Omit<T, "id"> & { id?: string } : never
): void {
  updateStore((data) => {
    const list = data[key] as unknown as { id: string }[];
    const withId = { ...item, id: item.id ?? makeId() };
    return { ...data, [key]: [...list, withId] };
  });
}

export function updateItem<K extends keyof StoreData>(
  key: K,
  id: string,
  patch: Partial<StoreData[K] extends (infer T)[] ? T : never>
): void {
  updateStore((data) => {
    const list = data[key] as unknown as { id: string }[];
    return { ...data, [key]: list.map((it) => (it.id === id ? { ...it, ...patch } : it)) };
  });
}

export function deleteItem<K extends keyof StoreData>(key: K, id: string): void {
  updateStore((data) => {
    const list = data[key] as unknown as { id: string }[];
    return { ...data, [key]: list.filter((it) => it.id !== id) };
  });
}

export function upsertByKeys<K extends keyof StoreData, T extends { id: string }>(
  key: K,
  matcher: (item: T) => boolean,
  build: (existing: T | undefined) => Omit<T, "id"> & { id?: string }
): void {
  updateStore((data) => {
    const list = data[key] as unknown as T[];
    const existing = list.find(matcher);
    const next = { ...build(existing), id: existing?.id ?? makeId() } as T;
    const nextList = existing ? list.map((it) => (it === existing ? next : it)) : [...list, next];
    return { ...data, [key]: nextList };
  });
}
