import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const schema = z.object({
  databaseUrl: z.string().min(1),
});

// Only ever attempt to persist locally — Vercel's filesystem is
// ephemeral/read-only for deployed functions, so writing .env there would
// be silently lost on the next cold start anyway.
const isServerless = !!process.env.VERCEL;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please paste a connection string." }, { status: 400 });
  }

  const { databaseUrl } = parsed.data;

  // 1. Test the connection with a throwaway client — never touches the
  // app's shared Prisma singleton, and never persisted if this fails.
  const testClient = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await testClient.$queryRawUnsafe("SELECT 1");
  } catch (e) {
    await testClient.$disconnect().catch(() => {});
    const message = e instanceof Error ? e.message : "Could not connect.";
    return NextResponse.json({ ok: false, error: `Connection failed: ${message}` }, { status: 400 });
  }
  await testClient.$disconnect().catch(() => {});

  if (isServerless) {
    // Can't persist here — tell the caller so the UI shows copy-paste
    // instructions for the platform's env var settings instead.
    return NextResponse.json({ ok: true, persisted: false, isServerless: true });
  }

  // 2. Local/dev only: write DATABASE_URL into .env and create the schema
  // immediately so the app is fully usable without touching a terminal.
  try {
    const { readFile, writeFile } = await import("fs/promises");
    const path = await import("path");
    const envPath = path.join(process.cwd(), ".env");

    let content = "";
    try {
      content = await readFile(envPath, "utf-8");
    } catch {
      content = "";
    }

    const line = `DATABASE_URL="${databaseUrl}"`;
    if (content.match(/^DATABASE_URL=.*$/m)) {
      content = content.replace(/^DATABASE_URL=.*$/m, line);
    } else {
      content = `${line}\n${content}`;
    }
    await writeFile(envPath, content, "utf-8");

    const { execFile } = await import("child_process");
    const { promisify } = await import("util");
    const execFileAsync = promisify(execFile);

    await execFileAsync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      timeout: 60_000,
    });

    return NextResponse.json({ ok: true, persisted: true, isServerless: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: true, persisted: false, isServerless: false, warning: `Connected, but couldn't finish local setup automatically: ${message}` },
      { status: 200 }
    );
  }
}
