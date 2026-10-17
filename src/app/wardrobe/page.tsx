"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Heart, Image as ImageIcon } from "lucide-react";
import { Input, Badge, Card } from "@/components/ui/ui";
import { CATALOG } from "@/data/catalog";
import { GARMENT_CATEGORIES, STYLE_TAGS, type GarmentCategory, type StyleTag } from "@/types/catalog";
import { useFavorites } from "@/hooks/use-favorites";
import { useOutfitStore } from "@/store/outfit-store";
import { cn } from "@/lib/utils";

export default function WardrobePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GarmentCategory | "all">("all");
  const [styleFilter, setStyleFilter] = useState<StyleTag | "all">("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const { favoriteIds, toggle, isFavorite } = useFavorites();
  const selectItem = useOutfitStore((s) => s.selectItem);

  const filtered = useMemo(() => {
    return CATALOG.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (styleFilter !== "all" && !item.styleTags.includes(styleFilter)) return false;
      if (onlyFavorites && !favoriteIds.includes(item.id)) return false;
      if (query.trim() && !item.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [category, styleFilter, onlyFavorites, favoriteIds, query]);

  function addToOutfit(itemId: string) {
    const item = CATALOG.find((c) => c.id === itemId);
    if (!item) return;
    selectItem(item);
    router.push("/studio");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Wardrobe</h1>
        <p className="text-sm text-muted">{CATALOG.length} items in the catalog</p>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search wardrobe..." className="pl-10" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
          All
        </FilterChip>
        {GARMENT_CATEGORIES.map((c) => (
          <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </FilterChip>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        <FilterChip active={styleFilter === "all"} onClick={() => setStyleFilter("all")}>
          Any style
        </FilterChip>
        {STYLE_TAGS.map((tag) => (
          <FilterChip key={tag} active={styleFilter === tag} onClick={() => setStyleFilter(tag)}>
            {tag}
          </FilterChip>
        ))}
        <FilterChip active={onlyFavorites} onClick={() => setOnlyFavorites((v) => !v)}>
          <Heart size={12} className={onlyFavorites ? "fill-current" : ""} /> Favorites
        </FilterChip>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filtered.map((item) => (
          <Card key={item.id} className="flex flex-col gap-2 p-2.5">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-muted">
              <Image src={item.thumbnailUrl} alt={item.name} fill sizes="200px" className="object-cover" />
              {item.assetType === "image-only" && (
                <span
                  className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] text-muted"
                  title="Reference image only — not yet a fitted 3D garment"
                >
                  <ImageIcon size={10} /> 2D only
                </span>
              )}
              <button
                onClick={() => toggle(item.id)}
                aria-label="Toggle favorite"
                className="absolute right-1.5 top-1.5 rounded-full bg-surface/90 p-1.5"
              >
                <Heart size={13} className={isFavorite(item.id) ? "fill-primary text-primary" : "text-muted"} />
              </button>
            </div>
            <div>
              <p className="line-clamp-1 text-sm font-medium text-foreground">{item.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {item.styleTags.slice(0, 2).map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </div>
            <button
              onClick={() => addToOutfit(item.id)}
              className="rounded-full bg-primary py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Add to outfit
            </button>
          </Card>
        ))}
        {filtered.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted">No items match your filters.</p>}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted"
      )}
    >
      {children}
    </button>
  );
}
