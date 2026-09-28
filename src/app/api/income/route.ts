import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  basicSalary: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  bonuses: z.number().min(0).default(0),
  overtime: z.number().min(0).default(0),
  otherIncome: z.number().min(0).default(0),
  note: z.string().max(500).optional().nullable(),
});

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const incomes = await prisma.income.findMany({ where: { userId }, orderBy: { month: "desc" } });
  return NextResponse.json(incomes);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const income = await prisma.income.upsert({
    where: { userId_month: { userId, month: parsed.data.month } },
    update: { ...parsed.data },
    create: { ...parsed.data, userId },
  });

  return NextResponse.json(income);
}
