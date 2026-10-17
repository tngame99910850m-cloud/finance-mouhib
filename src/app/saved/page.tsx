"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Copy, Trash2, Search, Pencil, Check, X } from "lucide-react";
import { Input, Card, Badge, Button } from "@/components/ui/ui";
import { useSavedOutfits } from "@/hooks/use-saved-outfits";
import { resolveSelection } from "@/lib/outfit-engine";
import { CATALOG } from "@/data/catalog";
import type { SavedOutfit } from "@/types/outfit";

export default function SavedPage() {
  const { outfits, loading, remove, duplicate, toggleFavorite, rename } = useSavedOutfits();
  const [query, setQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = useMemo(
    () => outfits.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase())),
    [outfits, query]
  );

  function startRename(outfit: SavedOutfit) {
    setRenamingId(outfit.id);
    setRenameValue(outfit.name);
  }

  async function commitRename(id: string) {
    if (renameValue.trim()) await rename(id, renameValue.trim());
    setRenamingId(null);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Saved Outfits</h1>
        <p className="text-sm text-muted">{outfits.length} saved look{outfits.length === 1 ? "" : "s"}</p>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saved outfits..." className="pl-10" />
      </div>

      {!loading && filtered.length === 0 && (
        <Card className="text-center">
          <p className="text-sm text-muted">
            {outfits.length === 0 ? "No saved outfits yet." : "No outfits match your search."}
          </p>
          <Link href="/studio" className="mt-3 inline-block text-sm font-medium text-primary">
            Go create one →
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((outfit) => {
          const slots = resolveSelection(outfit.selection, CATALOG);
          return (
            <Card key={outfit.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                {renamingId === outfit.id ? (
                  <div className="flex flex-1 items-center gap-1.5">
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="h-8 py-1 text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && commitRename(outfit.id)}
                    />
                    <button onClick={() => commitRename(outfit.id)} className="text-success">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setRenamingId(null)} className="text-muted">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => startRename(outfit)} className="flex items-center gap-1.5 text-left">
                    <p className="font-display text-sm font-semibold text-foreground">{outfit.name}</p>
                    <Pencil size={11} className="text-muted" />
                  </button>
                )}
                <button onClick={() => toggleFavorite(outfit.id)} aria-label="Toggle favorite">
                  <Heart size={16} className={outfit.isFavorite ? "fill-primary text-primary" : "text-muted"} />
                </button>
              </div>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {slots.slice(0, 6).map((slot) => (
                  <div key={slot.category} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                    <Image src={slot.item.thumbnailUrl} alt={slot.item.name} fill sizes="48px" className="object-cover" />
                  </div>
                ))}
                {slots.length === 0 && <p className="text-xs text-muted">No items in this outfit.</p>}
              </div>

              <div className="flex flex-wrap gap-1">
                {outfit.occasion && (
                  <Badge tone="accent" className="capitalize">
                    {outfit.occasion.replace("-", " ")}
                  </Badge>
                )}
                {outfit.styleTags.map((t) => (
                  <Badge key={t} className="capitalize">
                    {t}
                  </Badge>
                ))}
              </div>

              {outfit.notes && <p className="text-xs text-muted">{outfit.notes}</p>}

              <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                <Link href={`/studio?edit=${outfit.id}`} className="text-xs font-medium text-primary">
                  Open in Studio
                </Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => duplicate(outfit.id)} aria-label="Duplicate" className="text-muted hover:text-foreground">
                    <Copy size={15} />
                  </button>
                  {confirmDeleteId === outfit.id ? (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="danger" onClick={() => remove(outfit.id)}>
                        Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(outfit.id)} aria-label="Delete" className="text-muted hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
