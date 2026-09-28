import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireUserId(): Promise<string | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user.id;
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}
