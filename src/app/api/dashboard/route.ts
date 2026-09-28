import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";
import { monthKey, addMonthsToKey, totalIncome, ESSENTIAL_CATEGORIES } from "@/lib/finance";

async function monthSnapshot(userId: string, month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const [income, expenses, budgets] = await Promise.all([
    prisma.income.findUnique({ where: { userId_month: { userId, month } } }),
    prisma.expense.findMany({ where: { userId, date: { gte: start, lt: end } } }),
    prisma.budget.findMany({ where: { userId, month } }),
  ]);

  const totalInc = income ? totalIncome(income) : 0;
  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
  const essentialExp = expenses
    .filter((e) => ESSENTIAL_CATEGORIES.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  const byCategory: Record<string, number> = {};
  for (const e of expenses) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;

  return { month, income, totalIncome: totalInc, expenses, totalExpenses: totalExp, essentialExpenses: essentialExp, budgets, byCategory };
}

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? monthKey(new Date());
  const prevMonth = addMonthsToKey(month, -1);

  const [current, previous, savingsGoals, investments, vacations, settings, rules] = await Promise.all([
    monthSnapshot(userId, month),
    monthSnapshot(userId, prevMonth),
    prisma.savingsGoal.findMany({ where: { userId } }),
    prisma.investment.findMany({ where: { userId } }),
    prisma.vacation.findMany({ where: { userId } }),
    prisma.settings.upsert({ where: { userId }, update: {}, create: { userId } }),
    prisma.financialRule.findMany({ where: { userId }, orderBy: { order: "asc" } }),
  ]);

  return NextResponse.json({ current, previous, savingsGoals, investments, vacations, settings, rules });
}
