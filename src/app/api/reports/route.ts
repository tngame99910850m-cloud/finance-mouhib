import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";
import { totalIncome, monthKey } from "@/lib/finance";

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const [incomes, expenses, savingsGoals, investments, vacations] = await Promise.all([
    prisma.income.findMany({ where: { userId, month: { startsWith: String(year) } } }),
    prisma.expense.findMany({ where: { userId, date: { gte: start, lt: end } } }),
    prisma.savingsGoal.findMany({ where: { userId } }),
    prisma.investment.findMany({ where: { userId } }),
    prisma.vacation.findMany({ where: { userId } }),
  ]);

  const months: { month: string; income: number; expenses: number; net: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const key = monthKey(new Date(year, m, 1));
    const income = incomes.find((i) => i.month === key);
    const monthExpenses = expenses.filter((e) => monthKey(e.date) === key).reduce((s, e) => s + e.amount, 0);
    const monthIncome = income ? totalIncome(income) : 0;
    months.push({ month: key, income: monthIncome, expenses: monthExpenses, net: monthIncome - monthExpenses });
  }

  const totalIncomeYear = incomes.reduce((s, i) => s + totalIncome(i), 0);
  const totalExpensesYear = expenses.reduce((s, e) => s + e.amount, 0);

  const byCategory: Record<string, number> = {};
  for (const e of expenses) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;

  const totalSavings = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalInvestments = investments.reduce((s, i) => s + i.initialAmount, 0);
  const totalVacationSpend = vacations.reduce((s, v) => s + v.savedSoFar, 0);

  return NextResponse.json({
    year,
    months,
    totalIncome: totalIncomeYear,
    totalExpenses: totalExpensesYear,
    netProgress: totalIncomeYear - totalExpensesYear,
    byCategory,
    totalSavings,
    totalInvestments,
    totalVacationSpend,
  });
}
