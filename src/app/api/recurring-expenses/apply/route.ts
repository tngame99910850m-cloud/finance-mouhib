import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) });

// Creates Expense rows for the current month from active recurring expenses,
// skipping any recurring item already applied for that month.
export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [y, m] = parsed.data.month.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 1);

  const recurring = await prisma.recurringExpense.findMany({ where: { userId, active: true } });
  const existingRecurringExpenses = await prisma.expense.findMany({
    where: { userId, isRecurring: true, date: { gte: monthStart, lt: monthEnd } },
  });

  const created = [];
  for (const r of recurring) {
    const alreadyApplied = existingRecurringExpenses.some(
      (e) => e.description === `[recurring:${r.id}]` || e.description?.includes(`recurring:${r.id}`)
    );
    if (alreadyApplied) continue;

    const day = Math.min(r.dayOfMonth, 28);
    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: r.amount,
        category: r.category,
        description: `${r.name} [recurring:${r.id}]`,
        date: new Date(y, m - 1, day),
        isRecurring: true,
        paymentMethod: r.paymentMethod,
      },
    });
    created.push(expense);
  }

  return NextResponse.json({ created: created.length, expenses: created });
}
