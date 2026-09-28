import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input. Password must be at least 8 characters." }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      settings: { create: {} },
      financialRules: {
        create: [
          { title: "Pay essential expenses first", detail: "Cover housing, utilities, and food before discretionary spending.", order: 0 },
          { title: "Maintain an emergency fund", detail: "Keep 3-6+ months of essential expenses in accessible savings.", order: 1 },
          { title: "Save for planned expenses", detail: "Set aside money ahead of time for vacations and big purchases.", order: 2 },
          { title: "Invest only spare money", detail: "Only invest money you will not need in the near term.", order: 3 },
          { title: "Track recurring expenses", detail: "Review subscriptions and recurring bills regularly.", order: 4 },
          { title: "No guaranteed returns", detail: "Treat all investment projections as estimates, never guarantees.", order: 5 },
        ],
      },
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
