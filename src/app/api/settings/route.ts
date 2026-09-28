import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  theme: z.string().optional(),
  displayCurrency: z.string().optional(),
  needsPercent: z.number().min(0).max(100).optional(),
  wantsPercent: z.number().min(0).max(100).optional(),
  savingsPercent: z.number().min(0).max(100).optional(),
  emergencyTargetMonths: z.number().min(1).max(24).optional(),
  allocEmergencyPct: z.number().min(0).max(100).optional(),
  allocInvestPct: z.number().min(0).max(100).optional(),
  allocVacationPct: z.number().min(0).max(100).optional(),
  allocBufferPct: z.number().min(0).max(100).optional(),
});

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const settings = await prisma.settings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const settings = await prisma.settings.upsert({
    where: { userId },
    update: parsed.data,
    create: { userId, ...parsed.data },
  });

  return NextResponse.json(settings);
}
