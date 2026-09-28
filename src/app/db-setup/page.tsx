"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Label, Badge } from "@/components/ui";
import { CheckCircle2, AlertTriangle, Copy, Check } from "lucide-react";

type Result =
  | { ok: true; persisted: boolean; isServerless: boolean; warning?: string }
  | { ok: false; error: string };

export default function DbSetupPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/db-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl: url }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Request failed — check your network and try again." });
    } finally {
      setLoading(false);
    }
  }

  function copyValue() {
    navigator.clipboard.writeText(`DATABASE_URL="${url}"`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">
            ر.ق
          </div>
          <h1 className="text-xl font-semibold text-foreground">Connect your database</h1>
          <p className="mt-1 text-sm text-muted">
            Paste your Supabase (or any Postgres) connection string to finish setting up Mouhib Finance.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <Label>Database connection string</Label>
              <Input
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="mt-1 text-xs text-muted">
                In Supabase: Project Settings → Database → Connection string (URI). Use the pooled connection if
                available.
              </p>
            </div>
            <Button type="submit" disabled={loading || !url}>
              {loading ? "Testing connection..." : "Test & connect database"}
            </Button>
          </form>

          {result && !result.ok && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{result.error}</span>
            </div>
          )}

          {result && result.ok && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>Connection successful.</span>
              </div>

              {result.persisted && (
                <div className="rounded-lg bg-surface-muted p-3 text-sm text-foreground">
                  Saved locally and your database tables were created. You&apos;re all set —
                  <Link href="/register" className="ml-1 font-medium text-primary">
                    create your account
                  </Link>
                  .
                </div>
              )}

              {!result.persisted && (
                <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Badge tone="warning">One manual step</Badge>
                    <span className="text-xs text-muted">
                      {result.isServerless
                        ? "Vercel apps can't save their own environment variables."
                        : "Automatic setup didn't finish — finish it manually."}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    Add this as an environment variable in your Vercel project (Settings → Environment Variables),
                    then redeploy:
                  </p>
                  <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 font-mono text-xs text-foreground overflow-x-auto">
                    <span className="whitespace-nowrap">DATABASE_URL=&quot;{url}&quot;</span>
                    <button onClick={copyValue} className="ml-auto shrink-0 text-muted hover:text-foreground" aria-label="Copy">
                      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                  {"warning" in result && result.warning && (
                    <p className="text-xs text-warning">{result.warning}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        <p className="mt-4 text-center text-xs text-muted">
          Already connected? <Link href="/login" className="text-primary font-medium">Go to sign in</Link>
        </p>
      </div>
    </div>
  );
}
