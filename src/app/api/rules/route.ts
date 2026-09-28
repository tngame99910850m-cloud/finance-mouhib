import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

const schema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  order: z.number().default(0),
});

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;
  const rules = await prisma.financialRule.findMany({ where: { userId }, orderBy: { order: "asc" } });
  return NextResponse.json(rules);
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const rule = await prisma.financialRule.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(rule);
}
