import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  destination: z.string().min(1),
  travelDate: z.string(),
  flightCost: z.number().min(0).default(0),
  hotelCost: z.number().min(0).default(0),
  foodBudget: z.number().min(0).default(0),
  transportation: z.number().min(0).default(0),
  activities: z.number().min(0).default(0),
  shopping: z.number().min(0).default(0),
  buffer: z.number().min(0).default(0),
  savedSoFar: z.number().min(0).default(0),
});

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;
  const vacations = await prisma.vacation.findMany({ where: { userId }, orderBy: { travelDate: "asc" } });
  return NextResponse.json(vacations);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { travelDate, ...rest } = parsed.data;
  const vacation = await prisma.vacation.create({ data: { ...rest, travelDate: new Date(travelDate), userId } });
  return NextResponse.json(vacation);
}
