// Deterministic, rule-based outfit recommendations. No AI service
// required — this scores catalog items against an occasion/style
// preference using simple, explainable metadata matching, then builds
// a conflict-free outfit via the same engine the Studio uses.

import type { CatalogItem, GarmentCategory, Occasion, StyleTag } from "@/types/catalog";
import type { OutfitSelection } from "@/types/outfit";
import { applySelection, checkCompatibility } from "./outfit-engine";

export interface RecommendationInput {
  occasion: Occasion;
  preferredStyles?: StyleTag[];
  catalog: CatalogItem[];
}

function scoreItem(item: CatalogItem, occasion: Occasion, preferredStyles: StyleTag[]): number {
  let score = 0;
  if (item.occasions.includes(occasion)) score += 3;
  score += item.styleTags.filter((t) => preferredStyles.includes(t)).length;
  return score;
}

/** "Safe", low-clash colors that pair with most other garments — used
 * to break ties when several items score equally. Not a color-theory
 * engine, just a sensible deterministic default. */
const NEUTRAL_COLOR_IDS = ["black", "white", "ivory", "cream", "charcoal", "tan", "gold"];

function pickColorId(item: CatalogItem): string | undefined {
  if (item.colors.length === 0) return undefined;
  const neutral = item.colors.find((c) => NEUTRAL_COLOR_IDS.includes(c.id));
  return (neutral ?? item.colors[0]).id;
}

const CATEGORY_ORDER: GarmentCategory[] = ["dresses", "tops", "bottoms", "outerwear", "shoes", "bags", "accessories", "hairstyles"];

/**
 * Builds one complete, conflict-free outfit for the given occasion.
 * Deterministic: the same inputs always produce the same outfit, so
 * this is safe to unit test without mocking randomness.
 */
export function recommendOutfit({ occasion, preferredStyles = [], catalog }: RecommendationInput): OutfitSelection {
  let selection: OutfitSelection = {};

  // Decide dress vs top+bottom deterministically: whichever path has
  // the higher best-available score for this occasion wins.
  const bestDress = bestScoringItem(catalog, "dresses", occasion, preferredStyles);
  const bestTop = bestScoringItem(catalog, "tops", occasion, preferredStyles);
  const bestBottom = bestScoringItem(catalog, "bottoms", occasion, preferredStyles);
  const dressPath = bestDress?.score ?? -1;
  const topBottomPath = (bestTop?.score ?? -1) + (bestBottom?.score ?? -1);

  const categories = CATEGORY_ORDER.filter((c) => {
    if (dressPath >= topBottomPath) return c !== "tops" && c !== "bottoms";
    return c !== "dresses";
  });

  for (const category of categories) {
    const best = bestScoringItem(catalog, category, occasion, preferredStyles);
    if (!best || best.score <= 0) continue;
    const compat = checkCompatibility(selection, best.item, catalog);
    if (!compat.ok) continue;
    selection = applySelection(selection, best.item, pickColorId(best.item), catalog).selection;
  }

  return selection;
}

function bestScoringItem(
  catalog: CatalogItem[],
  category: GarmentCategory,
  occasion: Occasion,
  preferredStyles: StyleTag[]
): { item: CatalogItem; score: number } | undefined {
  const candidates = catalog
    .filter((item) => item.category === category)
    .map((item) => ({ item, score: scoreItem(item, occasion, preferredStyles) }))
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
  return candidates[0];
}
