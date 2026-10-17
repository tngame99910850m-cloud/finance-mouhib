"use client";

import { useState } from "react";
import { Card, CardHeader, Button, Badge } from "@/components/ui/ui";
import { getRepository } from "@/lib/repository";
import { useSavedOutfits } from "@/hooks/use-saved-outfits";
import { CloudOff, Download, Trash2 } from "lucide-react";

const SUPABASE_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function SettingsPage() {
  const { outfits, refresh } = useSavedOutfits();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setResetting(true);
    try {
      await getRepository().resetAll();
      await refresh();
      setConfirmReset(false);
    } finally {
      setResetting(false);
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(outfits, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `her-style-outfits-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted">Data, privacy, and app preferences.</p>
      </div>

      <Card>
        <CardHeader title="Storage" subtitle="Where your data lives" />
        <div className="flex items-start gap-3 rounded-xl bg-surface-muted p-3">
          <CloudOff size={18} className="mt-0.5 shrink-0 text-muted" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {SUPABASE_CONFIGURED ? "Local + cloud sync" : "Local-only mode"}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {SUPABASE_CONFIGURED
                ? "Your outfits sync to your private account."
                : "All outfits and preferences are stored only in this browser (IndexedDB). Nothing is sent anywhere. Clearing browser data will erase them — use Export below to back up."}
            </p>
          </div>
        </div>
        {!SUPABASE_CONFIGURED && <Badge className="mt-3">Cloud sync not configured</Badge>}
      </Card>

      <Card>
        <CardHeader title="Your data" />
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handleExport} className="w-fit">
            <Download size={15} /> Export outfits as JSON
          </Button>

          {!confirmReset ? (
            <Button variant="outline" onClick={() => setConfirmReset(true)} className="w-fit text-danger">
              <Trash2 size={15} /> Reset all local data
            </Button>
          ) : (
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
              <p className="mb-2 text-xs text-foreground">
                This permanently deletes all {outfits.length} saved outfit{outfits.length === 1 ? "" : "s"}, favorites, and
                avatar preferences from this browser. This can&apos;t be undone.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="danger" onClick={handleReset} disabled={resetting}>
                  {resetting ? "Resetting..." : "Yes, erase everything"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="About" />
        <p className="text-sm text-muted">Her Style — a private 3D fashion studio. Built for one person, not a public marketplace.</p>
      </Card>
    </div>
  );
}
