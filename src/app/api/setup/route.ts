import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";
import { monthKey } from "@/lib/finance";

const schema = z.object({
  monthlySalary: z.number().min(0),
  otherIncome: z.number().min(0).default(0),
  rent: z.number().min(0).default(0),
  utilities: z.number().min(0).default(0),
  foodBudget: z.number().min(0).default(0),
  transportation: z.number().min(0).default(0),
  subscriptions: z.number().min(0).default(0),
  otherExpenses: z.number().min(0).default(0),
  currentSavings: z.number().min(0).default(0),
  currentEmergencyFund: z.number().min(0).default(0),
  currentInvestments: z.number().min(0).default(0),
  vacationGoal: z.number().min(0).default(0),
  vacationDate: z.string().optional().nullable(),
  monthlyInvestmentAmount: z.number().min(0).default(0),
  monthlySavingsTarget: z.number().min(0).default(0),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const currentMonth = monthKey(new Date());

  await prisma.income.upsert({
    where: { userId_month: { userId, month: currentMonth } },
    update: { basicSalary: d.monthlySalary, otherIncome: d.otherIncome },
    create: { userId, month: currentMonth, basicSalary: d.monthlySalary, otherIncome: d.otherIncome },
  });

  const budgetEntries: [string, number][] = [
    ["Housing", d.rent + d.utilities],
    ["Food", d.foodBudget],
    ["Transportation", d.transportation],
    ["Subscriptions", d.subscriptions],
    ["Other", d.otherExpenses],
  ];
  for (const [category, amount] of budgetEntries) {
    if (amount <= 0) continue;
    await prisma.budget.upsert({
      where: { userId_month_category: { userId, month: currentMonth, category } },
      update: { amount },
      create: { userId, month: currentMonth, category, amount },
    });
  }

  if (d.rent > 0) {
    await prisma.recurringExpense.create({
      data: { userId, name: "Rent", category: "Housing", amount: d.rent, dayOfMonth: 1, startMonth: currentMonth },
    });
  }

  const existingEmergencyGoal = await prisma.savingsGoal.findFirst({ where: { userId, name: "Emergency Fund" } });
  if (!existingEmergencyGoal) {
    await prisma.savingsGoal.create({
      data: {
        userId,
        name: "Emergency Fund",
        targetAmount: (d.rent + d.utilities + d.foodBudget + d.transportation) * 6,
        currentAmount: d.currentEmergencyFund,
      },
    });
  }

  const existingGeneralGoal = await prisma.savingsGoal.findFirst({ where: { userId, name: "General Savings" } });
  if (!existingGeneralGoal && (d.currentSavings > 0 || d.monthlySavingsTarget > 0)) {
    await prisma.savingsGoal.create({
      data: {
        userId,
        name: "General Savings",
        targetAmount: Math.max(d.currentSavings * 2, d.monthlySavingsTarget * 12, 1000),
        currentAmount: d.currentSavings,
        monthlyContribution: d.monthlySavingsTarget,
      },
    });
  }

  if (d.vacationGoal > 0) {
    await prisma.vacation.create({
      data: {
        userId,
        destination: "My next trip",
        travelDate: d.vacationDate ? new Date(d.vacationDate) : new Date(new Date().setMonth(new Date().getMonth() + 12)),
        flightCost: d.vacationGoal * 0.35,
        hotelCost: d.vacationGoal * 0.3,
        foodBudget: d.vacationGoal * 0.15,
        transportation: d.vacationGoal * 0.05,
        activities: d.vacationGoal * 0.1,
        shopping: d.vacationGoal * 0.05,
        savedSoFar: 0,
      },
    });
  }

  if (d.currentInvestments > 0 || d.monthlyInvestmentAmount > 0) {
    await prisma.investment.create({
      data: {
        userId,
        name: "General Investments",
        category: "ETFs",
        initialAmount: d.currentInvestments,
        monthlyContribution: d.monthlyInvestmentAmount,
        expectedAnnualReturn: 6,
        durationYears: 10,
        riskProfile: "Moderate",
      },
    });
  }

  await prisma.settings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await prisma.user.update({ where: { id: userId }, data: { setupComplete: true } });

  return NextResponse.json({ ok: true, monthlySavingsTarget: d.monthlySavingsTarget, currentSavings: d.currentSavings });
}
