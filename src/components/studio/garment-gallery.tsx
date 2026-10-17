"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CatalogItem } from "@/types/catalog";
import { Check, Image as ImageIcon } from "lucide-react";

export function GarmentGallery({
  items,
  selectedItemId,
  onSelect,
}: {
  items: CatalogItem[];
  selectedItemId: string | undefined;
  onSelect: (item: CatalogItem) => void;
}) {
  if (items.length === 0) {
    return <p className="px-1 py-6 text-center text-sm text-muted">No items in this category yet.</p>;
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
      {items.map((item) => {
        const active = item.id === selectedItemId;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            aria-pressed={active}
            aria-label={`Select ${item.name}`}
            className={cn(
              "group relative flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl border-2 p-1.5 transition-colors",
              active ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
            )}
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-surface-muted">
              <Image src={item.thumbnailUrl} alt={item.name} fill sizes="64px" className="object-cover" />
              {item.assetType === "image-only" && (
                <span className="absolute bottom-0.5 right-0.5 rounded-full bg-surface/90 p-0.5" title="Reference image only — not fitted in 3D">
                  <ImageIcon size={10} className="text-muted" />
                </span>
              )}
              {active && (
                <span className="absolute inset-0 flex items-center justify-center bg-primary/40">
                  <Check size={18} className="text-white" />
                </span>
              )}
            </div>
            <span className="line-clamp-1 w-full text-center text-[11px] font-medium text-foreground">{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}
