"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, Redo2, Shuffle, Undo2, RotateCcw } from "lucide-react";
import { AvatarViewerLazy } from "@/components/3d/avatar-viewer-lazy";
import { CategoryTabs } from "@/components/studio/category-tabs";
import { GarmentGallery } from "@/components/studio/garment-gallery";
import { ColorSwatches } from "@/components/studio/color-swatches";
import { OutfitSummary } from "@/components/studio/outfit-summary";
import { SaveOutfitDialog } from "@/components/studio/save-outfit-dialog";
import { Button } from "@/components/ui/ui";
import { useOutfitStore } from "@/store/outfit-store";
import { CATALOG, getCatalogByCategory } from "@/data/catalog";
import { resolveSelection } from "@/lib/outfit-engine";
import { useSavedOutfits } from "@/hooks/use-saved-outfits";
import { getRepository } from "@/lib/repository";
import type { GarmentCategory } from "@/types/catalog";

function StudioInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [category, setCategory] = useState<GarmentCategory>("dresses");
  const [saveOpen, setSaveOpen] = useState(false);

  const selection = useOutfitStore((s) => s.selection);
  const avatarAppearance = useOutfitStore((s) => s.avatarAppearance);
  const outfitName = useOutfitStore((s) => s.outfitName);
  const lastError = useOutfitStore((s) => s.lastError);
  const past = useOutfitStore((s) => s.past);
  const future = useOutfitStore((s) => s.future);
  const selectItem = useOutfitStore((s) => s.selectItem);
  const setColor = useOutfitStore((s) => s.setColor);
  const removeItem = useOutfitStore((s) => s.removeItem);
  const reset = useOutfitStore((s) => s.reset);
  const randomize = useOutfitStore((s) => s.randomize);
  const undo = useOutfitStore((s) => s.undo);
  const redo = useOutfitStore((s) => s.redo);
  const clearError = useOutfitStore((s) => s.clearError);
  const loadOutfit = useOutfitStore((s) => s.loadOutfit);
  const startNewOutfit = useOutfitStore((s) => s.startNewOutfit);
  const loadedOutfitId = useOutfitStore((s) => s.loadedOutfitId);

  const { save } = useSavedOutfits();

  useEffect(() => {
    if (!editId || editId === loadedOutfitId) return;
    let cancelled = false;
    getRepository()
      .getOutfit(editId)
      .then((outfit) => {
        if (cancelled || !outfit) return;
        loadOutfit(outfit.selection, outfit.avatarAppearance, outfit.name, outfit.id);
      });
    return () => {
      cancelled = true;
    };
  }, [editId, loadedOutfitId, loadOutfit]);

  useEffect(() => {
    if (editId) return;
    startNewOutfit();
    getRepository()
      .getAvatarAppearance()
      .then((saved) => {
        if (saved) loadOutfit({}, saved, "New Look", "");
      });
    // Only run when navigating into the Studio without an edit target —
    // deliberately excludes dependencies to avoid wiping in-progress
    // work on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedSlots = useMemo(() => resolveSelection(selection, CATALOG), [selection]);
  const categoryItems = useMemo(() => getCatalogByCategory(category), [category]);
  const selectedInCategory = selection[category];

  const selectedCategoryCatalogItem = selectedInCategory ? CATALOG.find((c) => c.id === selectedInCategory.itemId) : undefined;

  async function handleSave(input: Parameters<Parameters<typeof SaveOutfitDialog>[0]["onSave"]>[0]) {
    const outfit = await save({
      id: editId ?? undefined,
      selection,
      avatarAppearance,
      ...input,
    });
    router.push(`/studio?edit=${outfit.id}`);
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Top bar */}
      <div className="safe-top flex items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2.5">
        <Link href="/" aria-label="Back home" className="rounded-full p-1.5 text-foreground hover:bg-surface-muted">
          <ChevronLeft size={20} />
        </Link>
        <span className="line-clamp-1 flex-1 text-center font-display text-sm font-semibold text-foreground">{outfitName}</span>
        <Button size="sm" onClick={() => setSaveOpen(true)}>
          Save
        </Button>
      </div>

      {/* 3D viewer */}
      <div className="relative min-h-0 flex-1">
        <AvatarViewerLazy appearance={avatarAppearance} garmentSlots={resolvedSlots} className="h-full w-full rounded-none" />

        <div className="absolute left-3 top-3 flex gap-1.5">
          <IconBtn onClick={undo} disabled={past.length === 0} label="Undo">
            <Undo2 size={15} />
          </IconBtn>
          <IconBtn onClick={redo} disabled={future.length === 0} label="Redo">
            <Redo2 size={15} />
          </IconBtn>
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          <IconBtn onClick={randomize} label="Randomize outfit">
            <Shuffle size={15} />
          </IconBtn>
          <IconBtn onClick={reset} label="Reset outfit">
            <RotateCcw size={15} />
          </IconBtn>
        </div>

        {lastError && (
          <button
            onClick={clearError}
            className="absolute bottom-16 left-1/2 w-[90%] -translate-x-1/2 rounded-xl bg-danger/90 px-3 py-2 text-center text-xs font-medium text-white shadow-lg"
          >
            {lastError}
          </button>
        )}
      </div>

      {/* Bottom sheet */}
      <div className="safe-bottom flex max-h-[46%] flex-col gap-3 border-t border-border bg-surface px-3 pb-3 pt-3">
        <OutfitSummary slots={resolvedSlots} onRemove={removeItem} />
        <CategoryTabs value={category} onChange={setCategory} />
        <GarmentGallery
          items={categoryItems}
          selectedItemId={selectedInCategory?.itemId}
          onSelect={(item) => selectItem(item)}
        />
        {selectedCategoryCatalogItem && selectedCategoryCatalogItem.colors.length > 0 && (
          <ColorSwatches
            colors={selectedCategoryCatalogItem.colors}
            selectedColorId={selectedInCategory?.colorId}
            onSelect={(colorId) => setColor(category, colorId)}
          />
        )}
      </div>

      <SaveOutfitDialog open={saveOpen} onOpenChange={setSaveOpen} initialName={outfitName} onSave={handleSave} />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-full bg-surface/90 p-2 text-foreground shadow-sm transition-colors hover:bg-surface disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioInner />
    </Suspense>
  );
}
