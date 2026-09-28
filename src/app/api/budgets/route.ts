import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  category: z.string().min(1),
  amount: z.number().min(0),
});

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const where: Record<string, unknown> = { userId };
  if (month) where.month = month;

  const budgets = await prisma.budget.findMany({ where, orderBy: { category: "asc" } });
  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const budget = await prisma.budget.upsert({
    where: { userId_month_category: { userId, month: parsed.data.month, category: parsed.data.category } },
    update: { amount: parsed.data.amount },
    create: { ...parsed.data, userId },
  });

  return NextResponse.json(budget);
}
