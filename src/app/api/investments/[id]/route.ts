import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  initialAmount: z.number().min(0).optional(),
  monthlyContribution: z.number().min(0).optional(),
  expectedAnnualReturn: z.number().optional(),
  durationYears: z.number().min(0.1).optional(),
  feesPercent: z.number().min(0).optional(),
  riskProfile: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;
  const { id } = await params;

  const existing = await prisma.investment.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const investment = await prisma.investment.update({ where: { id }, data: parsed.data });
  return NextResponse.json(investment);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;
  const { id } = await params;

  const existing = await prisma.investment.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.investment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
