import { ESSENTIAL_CATEGORIES, requiredMonthlySaving, monthsBetween } from "@/lib/finance";
import { formatCurrency } from "@/lib/currency";

type Budget = { category: string; amount: number };
type Vacation = { destination: string; travelDate: string | Date; flightCost: number; hotelCost: number; foodBudget: number; transportation: number; activities: number; shopping: number; buffer: number; savedSoFar: number };
type SavingsGoal = { name: string; targetAmount: number; currentAmount: number };

export type Insight = { text: string; tone: "positive" | "neutral" | "warning" };

export function buildInsights(params: {
  currentExpensesByCategory: Record<string, number>;
  previousExpensesByCategory: Record<string, number>;
  currentBudgets: Budget[];
  totalIncome: number;
  totalExpenses: number;
  savingsAmount: number;
  vacations: Vacation[];
  savingsGoals: SavingsGoal[];
  emergencyFundCurrent: number;
  essentialMonthlyExpenses: number;
}): Insight[] {
  const insights: Insight[] = [];
  const {
    currentExpensesByCategory,
    previousExpensesByCategory,
    currentBudgets,
    totalIncome,
    totalExpenses,
    savingsAmount,
    vacations,
    emergencyFundCurrent,
    essentialMonthlyExpenses,
  } = params;

  // Category month-over-month changes
  for (const [category, amount] of Object.entries(currentExpensesByCategory)) {
    const prev = previousExpensesByCategory[category];
    if (prev && prev > 0) {
      const changePercent = ((amount - prev) / prev) * 100;
      if (Math.abs(changePercent) >= 15) {
        insights.push({
          text: `Your ${category.toLowerCase()} spending ${changePercent > 0 ? "increased" : "decreased"} by ${Math.abs(Math.round(changePercent))}% compared with last month.`,
          tone: changePercent > 0 ? "warning" : "positive",
        });
      }
    }
  }

  // Budget vs actual
  for (const budget of currentBudgets) {
    const spent = currentExpensesByCategory[budget.category] ?? 0;
    const diff = budget.amount - spent;
    if (diff >= 0 && budget.amount > 0) {
      insights.push({
        text: `You spent ${formatCurrency(Math.abs(diff))} less than your ${budget.category.toLowerCase()} budget.`,
        tone: "positive",
      });
    } else if (diff < 0) {
      insights.push({
        text: `You exceeded your ${budget.category.toLowerCase()} budget by ${formatCurrency(Math.abs(diff))}.`,
        tone: "warning",
      });
    }
  }

  // Savings rate
  if (totalIncome > 0) {
    const savingsRate = (savingsAmount / totalIncome) * 100;
    insights.push({
      text: `Your current savings rate is ${Math.round(savingsRate)}%.`,
      tone: savingsRate >= 20 ? "positive" : savingsRate >= 10 ? "neutral" : "warning",
    });
  }

  // Vacation savings need
  for (const v of vacations) {
    const total = v.flightCost + v.hotelCost + v.foodBudget + v.transportation + v.activities + v.shopping + v.buffer;
    const months = monthsBetween(new Date(), new Date(v.travelDate));
    const monthly = requiredMonthlySaving(total, v.savedSoFar, months);
    if (monthly > 0) {
      insights.push({
        text: `You need ${formatCurrency(monthly)}/month to reach your ${v.destination} vacation target.`,
        tone: "neutral",
      });
    }
  }

  // Emergency fund coverage
  if (essentialMonthlyExpenses > 0 && emergencyFundCurrent > 0) {
    const coverage = emergencyFundCurrent / essentialMonthlyExpenses;
    insights.push({
      text: `Your emergency fund currently covers approximately ${coverage.toFixed(1)} months of essential expenses.`,
      tone: coverage >= 6 ? "positive" : coverage >= 3 ? "neutral" : "warning",
    });
  }

  // Expense ratio
  if (totalIncome > 0) {
    const ratio = (totalExpenses / totalIncome) * 100;
    if (ratio > 90) {
      insights.push({ text: `You spent ${Math.round(ratio)}% of your income this month — very little margin is left over.`, tone: "warning" });
    }
  }

  return insights.slice(0, 8);
}

export { ESSENTIAL_CATEGORIES };
