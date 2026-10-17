"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Heart } from "lucide-react";
import { AvatarViewerLazy } from "@/components/3d/avatar-viewer-lazy";
import { Card, Button, Badge } from "@/components/ui/ui";
import { useSavedOutfits } from "@/hooks/use-saved-outfits";
import { resolveSelection } from "@/lib/outfit-engine";
import { recommendOutfit } from "@/lib/recommendation";
import { useOutfitStore } from "@/store/outfit-store";
import { CATALOG } from "@/data/catalog";
import { OCCASIONS, type Occasion } from "@/types/catalog";

const OCCASION_LABELS: Record<Occasion, string> = {
  everyday: "Everyday",
  work: "Work",
  shopping: "Shopping",
  "date-night": "Date Night",
  party: "Party",
  formal: "Formal",
  vacation: "Vacation",
  sport: "Sport",
  custom: "Custom",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const router = useRouter();
  const { outfits, loading, toggleFavorite } = useSavedOutfits();
  const favorites = useMemo(() => outfits.filter((o) => o.isFavorite).slice(0, 4), [outfits]);
  const recent = useMemo(() => outfits.slice(0, 4), [outfits]);
  const loadOutfit = useOutfitStore((s) => s.loadOutfit);

  function pickOccasion(occasion: Occasion) {
    const selection = recommendOutfit({ occasion, catalog: CATALOG });
    loadOutfit(selection, {}, `${OCCASION_LABELS[occasion]} Look`, "");
    router.push("/studio");
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <p className="text-sm text-muted">{greeting()}</p>
        <h1 className="font-display text-2xl font-semibold text-foreground">Your Fashion Studio</h1>
      </div>

      <Card className="relative overflow-hidden p-0">
        <div className="h-72 w-full sm:h-96">
          <AvatarViewerLazy appearance={{}} className="h-full w-full rounded-2xl" compact />
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="font-display text-base font-semibold text-foreground">Build today&apos;s look</p>
            <p className="text-xs text-muted">Pick an outfit for any occasion</p>
          </div>
          <Link href="/studio">
            <Button>
              <Sparkles size={15} /> Create Outfit
            </Button>
          </Link>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 font-display text-base font-semibold text-foreground">Quick start by occasion</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {OCCASIONS.filter((o) => o !== "custom").map((occasion) => (
            <button
              key={occasion}
              onClick={() => pickOccasion(occasion)}
              className="shrink-0 rounded-full bg-surface-muted px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {OCCASION_LABELS[occasion]}
            </button>
          ))}
        </div>
      </section>

      {!loading && favorites.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">Favorite looks</h2>
            <Link href="/saved" className="flex items-center gap-1 text-xs font-medium text-primary">
              See all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {favorites.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} onToggleFavorite={() => toggleFavorite(outfit.id)} />
            ))}
          </div>
        </section>
      )}

      {!loading && recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">Recent outfits</h2>
            <Link href="/saved" className="flex items-center gap-1 text-xs font-medium text-primary">
              See all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recent.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} onToggleFavorite={() => toggleFavorite(outfit.id)} />
            ))}
          </div>
        </section>
      )}

      {!loading && outfits.length === 0 && (
        <Card className="text-center">
          <p className="text-sm text-muted">No saved looks yet. Build your first outfit in the Studio.</p>
        </Card>
      )}
    </div>
  );
}

function OutfitCard({ outfit, onToggleFavorite }: { outfit: ReturnType<typeof useSavedOutfits>["outfits"][number]; onToggleFavorite: () => void }) {
  const slots = resolveSelection(outfit.selection, CATALOG);
  return (
    <Link href={`/studio?edit=${outfit.id}`}>
      <Card className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between">
          <p className="line-clamp-1 text-sm font-medium text-foreground">{outfit.name}</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite();
            }}
            aria-label="Toggle favorite"
          >
            <Heart size={14} className={outfit.isFavorite ? "fill-primary text-primary" : "text-muted"} />
          </button>
        </div>
        {outfit.occasion && (
          <Badge tone="accent" className="w-fit capitalize">
            {outfit.occasion.replace("-", " ")}
          </Badge>
        )}
        <p className="text-[11px] text-muted">{slots.length} item{slots.length === 1 ? "" : "s"}</p>
      </Card>
    </Link>
  );
}
