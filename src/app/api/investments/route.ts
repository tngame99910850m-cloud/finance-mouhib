import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  initialAmount: z.number().min(0).default(0),
  monthlyContribution: z.number().min(0).default(0),
  expectedAnnualReturn: z.number().default(0),
  durationYears: z.number().min(0.1).default(1),
  feesPercent: z.number().min(0).default(0),
  riskProfile: z.string().default("Moderate"),
});

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;
  const investments = await prisma.investment.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { contributions: true },
  });
  return NextResponse.json(investments);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const investment = await prisma.investment.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(investment);
}
