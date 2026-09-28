// Core financial calculation helpers. All monetary inputs/outputs are in QAR.

export function totalIncome(i: {
  basicSalary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  otherIncome: number;
}): number {
  return i.basicSalary + i.allowances + i.bonuses + i.overtime + i.otherIncome;
}

export function monthsBetween(from: Date, to: Date): number {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  return Math.max(0, months);
}

export function requiredMonthlySaving(target: number, current: number, monthsRemaining: number): number {
  const remaining = Math.max(0, target - current);
  if (monthsRemaining <= 0) return remaining;
  return remaining / monthsRemaining;
}

export function percentUsed(spent: number, budget: number): number {
  if (budget <= 0) return spent > 0 ? 100 : 0;
  return Math.min(999, (spent / budget) * 100);
}

export function savingsGoalEta(current: number, target: number, monthlyContribution: number): Date | null {
  if (monthlyContribution <= 0) return null;
  const remaining = Math.max(0, target - current);
  const monthsNeeded = Math.ceil(remaining / monthlyContribution);
  const eta = new Date();
  eta.setMonth(eta.getMonth() + monthsNeeded);
  return eta;
}

// Compound growth with monthly contributions.
// Returns total contributed, estimated growth, and final value.
export function projectInvestment(params: {
  initialAmount: number;
  monthlyContribution: number;
  annualReturnPercent: number;
  years: number;
  feesPercent?: number;
}): { totalContributed: number; estimatedGrowth: number; finalValue: number } {
  const { initialAmount, monthlyContribution, annualReturnPercent, years, feesPercent = 0 } = params;
  const netAnnualReturn = annualReturnPercent - feesPercent;
  const monthlyRate = netAnnualReturn / 100 / 12;
  const months = Math.round(years * 12);

  let balance = initialAmount;
  let contributed = initialAmount;

  for (let m = 0; m < months; m++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    contributed += monthlyContribution;
  }

  const finalValue = Math.max(0, balance);
  return {
    totalContributed: contributed,
    estimatedGrowth: finalValue - contributed,
    finalValue,
  };
}

export function emergencyFundTargets(essentialMonthlyExpenses: number) {
  return {
    minimum: essentialMonthlyExpenses * 3,
    standard: essentialMonthlyExpenses * 6,
    strong: essentialMonthlyExpenses * 12,
  };
}

export function financialHealthMetrics(params: {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  emergencySavings: number;
  essentialMonthlyExpenses: number;
}) {
  const { income, expenses, savings, investments, emergencySavings, essentialMonthlyExpenses } = params;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 0;
  const investmentRate = income > 0 ? (investments / income) * 100 : 0;
  const emergencyCoverageMonths = essentialMonthlyExpenses > 0 ? emergencySavings / essentialMonthlyExpenses : 0;

  return { savingsRate, expenseRatio, investmentRate, emergencyCoverageMonths };
}

export const ESSENTIAL_CATEGORIES = ["Housing", "Food", "Transportation"];

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(monthKeyStr: string): string {
  const [y, m] = monthKeyStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function addMonthsToKey(monthKeyStr: string, delta: number): string {
  const [y, m] = monthKeyStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export function lastNMonthKeys(n: number, endMonthKeyStr?: string): string[] {
  const end = endMonthKeyStr ?? monthKey(new Date());
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(addMonthsToKey(end, -i));
  }
  return keys;
}
