import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().min(0),
  currentAmount: z.number().min(0).default(0),
  monthlyContribution: z.number().min(0).default(0),
  targetDate: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;
  const goals = await prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { targetDate, ...rest } = parsed.data;
  const goal = await prisma.savingsGoal.create({
    data: { ...rest, targetDate: targetDate ? new Date(targetDate) : null, userId },
  });

  return NextResponse.json(goal);
}
