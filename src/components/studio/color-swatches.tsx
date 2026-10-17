"use client";

import { cn } from "@/lib/utils";
import type { ColorVariant } from "@/types/catalog";
import { Check } from "lucide-react";

export function ColorSwatches({
  colors,
  selectedColorId,
  onSelect,
}: {
  colors: ColorVariant[];
  selectedColorId: string | undefined;
  onSelect: (colorId: string) => void;
}) {
  if (colors.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-1">
      {colors.map((color) => {
        const active = color.id === selectedColorId;
        return (
          <button
            key={color.id}
            onClick={() => onSelect(color.id)}
            aria-pressed={active}
            aria-label={color.name}
            title={color.name}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform",
              active ? "border-primary scale-110" : "border-border"
            )}
            style={{ backgroundColor: color.swatch }}
          >
            {active && <Check size={14} className="drop-shadow" style={{ color: isLight(color.swatch) ? "#1a1a1a" : "#ffffff" }} />}
          </button>
        );
      })}
    </div>
  );
}

function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length !== 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
