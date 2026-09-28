"use client";

import { useSyncExternalStore, useCallback } from "react";
import { getSnapshot, subscribe, StoreData } from "@/lib/local-store";

// Server snapshot must never read localStorage (SSR has no window) — this
// keeps hydration consistent, then the client re-syncs on mount.
const SERVER_SNAPSHOT: StoreData = {
  setupComplete: false,
  incomes: [],
  expenses: [],
  budgets: [],
  savingsGoals: [],
  investments: [],
  vacations: [],
  recurringExpenses: [],
  rules: [],
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

export function useStore(): StoreData {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

export function useCollection<K extends keyof StoreData>(key: K): StoreData[K] {
  const store = useStore();
  return store[key];
}

export function useIsHydrated(): boolean {
  const snapshot = useSyncExternalStore(
    subscribe,
    useCallback(() => true, []),
    useCallback(() => false, [])
  );
  return snapshot;
}
