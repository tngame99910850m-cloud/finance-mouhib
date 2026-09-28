import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  title: z.string().min(1),
  type: z.string().min(1),
  date: z.string(),
  amount: z.number().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  reminder: z.boolean().default(false),
});

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const where: Record<string, unknown> = { userId };
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const events = await prisma.calendarEvent.findMany({ where, orderBy: { date: "asc" } });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { date, ...rest } = parsed.data;
  const event = await prisma.calendarEvent.create({ data: { ...rest, date: new Date(date), userId } });
  return NextResponse.json(event);
}
