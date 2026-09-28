import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

export async function POST() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  await prisma.user.update({ where: { id: userId }, data: { setupComplete: true } });
  return NextResponse.json({ ok: true });
}
