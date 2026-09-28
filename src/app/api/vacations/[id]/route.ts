import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  destination: z.string().min(1).optional(),
  travelDate: z.string().optional(),
  flightCost: z.number().min(0).optional(),
  hotelCost: z.number().min(0).optional(),
  foodBudget: z.number().min(0).optional(),
  transportation: z.number().min(0).optional(),
  activities: z.number().min(0).optional(),
  shopping: z.number().min(0).optional(),
  buffer: z.number().min(0).optional(),
  savedSoFar: z.number().min(0).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;
  const { id } = await params;

  const existing = await prisma.vacation.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { travelDate, ...rest } = parsed.data;
  const vacation = await prisma.vacation.update({
    where: { id },
    data: { ...rest, ...(travelDate ? { travelDate: new Date(travelDate) } : {}) },
  });

  return NextResponse.json(vacation);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;
  const { id } = await params;

  const existing = await prisma.vacation.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.vacation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
