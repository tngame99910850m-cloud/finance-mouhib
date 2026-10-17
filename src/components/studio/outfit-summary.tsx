"use client";

import Image from "next/image";
import { X } from "lucide-react";
import type { ResolvedSlot } from "@/lib/outfit-engine";

export function OutfitSummary({ slots, onRemove }: { slots: ResolvedSlot[]; onRemove: (category: ResolvedSlot["category"]) => void }) {
  if (slots.length === 0) {
    return <p className="px-1 text-sm text-muted">Nothing selected yet — pick an item below to start the look.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 px-1">
      {slots.map((slot) => (
        <div key={slot.category} className="flex items-center gap-1.5 rounded-full bg-surface-muted py-1 pl-1 pr-2.5">
          <div className="relative h-6 w-6 overflow-hidden rounded-full bg-surface">
            <Image src={slot.item.thumbnailUrl} alt="" fill sizes="24px" className="object-cover" />
          </div>
          <span className="text-xs font-medium text-foreground">{slot.item.name}</span>
          <button onClick={() => onRemove(slot.category)} aria-label={`Remove ${slot.item.name}`} className="text-muted hover:text-danger">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
