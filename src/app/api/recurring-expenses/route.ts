import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";
import { monthKey } from "@/lib/finance";

const schema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().min(0),
  dayOfMonth: z.number().min(1).max(28).default(1),
  paymentMethod: z.string().default("Card"),
  active: z.boolean().default(true),
});

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;
  const items = await prisma.recurringExpense.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const item = await prisma.recurringExpense.create({
    data: { ...parsed.data, startMonth: monthKey(new Date()), userId },
  });
  return NextResponse.json(item);
}
