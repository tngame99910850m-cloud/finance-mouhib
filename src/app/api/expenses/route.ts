import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  subcategory: z.string().optional().nullable(),
  date: z.string(),
  description: z.string().max(500).optional().nullable(),
  isRecurring: z.boolean().default(false),
  paymentMethod: z.string().default("Card"),
});

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { userId };
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.date = { gte: start, lt: end };
  }
  if (category) where.category = category;

  const expenses = await prisma.expense.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const expense = await prisma.expense.create({
    data: { ...parsed.data, date: new Date(parsed.data.date), userId },
  });

  return NextResponse.json(expense);
}
