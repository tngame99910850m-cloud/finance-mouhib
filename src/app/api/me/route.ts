import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, isResponse } from "@/lib/api-helpers";

export async function GET() {
  const userId = await requireUserId();
  if (isResponse(userId)) return userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, currency: true, setupComplete: true },
  });

  return NextResponse.json(user);
}
