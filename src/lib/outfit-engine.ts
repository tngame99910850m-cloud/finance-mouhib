// Pure outfit-selection logic. No Three.js, no React — this is the
// single authoritative place where "can this combination be worn"
// is decided, so it can be unit tested and reused by both the 3D
// viewer and any future surface (e.g. a server-side renderer).

import type { CatalogItem, GarmentCategory } from "@/types/catalog";
import type { OutfitSelection } from "@/types/outfit";

export interface ApplySelectionResult {
  selection: OutfitSelection;
  /** Categories that were cleared as a side effect (e.g. a dress clearing tops+bottoms). */
  removedCategories: GarmentCategory[];
}

export interface CompatibilityResult {
  ok: boolean;
  reason?: string;
}

/**
 * Checks whether `item` can be added to `selection` without silently
 * breaking an existing choice. This only reports hard conflicts declared
 * via `layering.conflictsWith` — categories covered by `replaces` are a
 * normal, expected side effect (e.g. a dress replacing a top), not a
 * conflict, and are handled by applySelection.
 */
export function checkCompatibility(
  selection: OutfitSelection,
  item: CatalogItem,
  catalog: CatalogItem[]
): CompatibilityResult {
  const conflictsWith = item.layering.conflictsWith ?? [];

  for (const category of conflictsWith) {
    const existingSlot = selection[category];
    if (!existingSlot) continue;
    const existingItem = catalog.find((c) => c.id === existingSlot.itemId);
    return {
      ok: false,
      reason: `${item.name} can't be worn with ${existingItem?.name ?? "the current " + category}.`,
    };
  }

  // Symmetric check: does anything currently worn declare a conflict with this item's category?
  for (const slot of Object.values(selection)) {
    if (!slot) continue;
    const existingItem = catalog.find((c) => c.id === slot.itemId);
    if (existingItem?.layering.conflictsWith?.includes(item.category)) {
      return {
        ok: false,
        reason: `${existingItem.name} can't be worn with ${item.name}.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Applies a selection, resolving layering rules:
 * - If the item `replaces` other categories (e.g. a dress replacing
 *   tops+bottoms), those categories are cleared.
 * - If something currently worn `replaces` this item's category (e.g. a
 *   dress is worn and she picks a top), the conflicting item is cleared
 *   to make room — selecting a specific item is always an explicit
 *   choice that wins over what's already there.
 *
 * Call `checkCompatibility` first if you need to reject hard conflicts
 * with a message instead of silently resolving them.
 */
export function applySelection(
  selection: OutfitSelection,
  item: CatalogItem,
  colorId: string | undefined,
  catalog: CatalogItem[]
): ApplySelectionResult {
  const next: OutfitSelection = { ...selection };
  const removedCategories: GarmentCategory[] = [];

  // This item replaces other categories outright (dress -> tops/bottoms).
  for (const category of item.layering.replaces ?? []) {
    if (next[category]) {
      delete next[category];
      removedCategories.push(category);
    }
  }

  // Anything currently worn that claims to replace THIS item's category
  // must be cleared — e.g. a dress is worn and she now picks a top.
  for (const [category, slot] of Object.entries(next) as [GarmentCategory, OutfitSelection[GarmentCategory]][]) {
    if (!slot || category === item.category) continue;
    const existingItem = catalog.find((c) => c.id === slot.itemId);
    if (existingItem?.layering.replaces?.includes(item.category)) {
      delete next[category];
      removedCategories.push(category);
    }
  }

  next[item.category] = { itemId: item.id, colorId };

  return { selection: next, removedCategories };
}

export function removeCategory(selection: OutfitSelection, category: GarmentCategory): OutfitSelection {
  const next = { ...selection };
  delete next[category];
  return next;
}

export function clearSelection(): OutfitSelection {
  return {};
}

/** Resolves each slot in a selection back to its full CatalogItem + color, skipping unavailable assets. */
export interface ResolvedSlot {
  category: GarmentCategory;
  item: CatalogItem;
  color?: CatalogItem["colors"][number];
}

export function resolveSelection(selection: OutfitSelection, catalog: CatalogItem[]): ResolvedSlot[] {
  const resolved: ResolvedSlot[] = [];
  for (const [category, slot] of Object.entries(selection) as [GarmentCategory, OutfitSelection[GarmentCategory]][]) {
    if (!slot) continue;
    const item = catalog.find((c) => c.id === slot.itemId);
    if (!item) continue; // Gracefully skip items removed from the catalog since the outfit was saved.
    const color = slot.colorId ? item.colors.find((c) => c.id === slot.colorId) : undefined;
    resolved.push({ category, item, color });
  }
  return resolved.sort((a, b) => (a.item.layering.layerOrder ?? 0) - (b.item.layering.layerOrder ?? 0));
}

/** Deterministic random outfit: picks one compatible item per category where available. */
export function randomizeOutfit(catalog: CatalogItem[], seed = Date.now()): OutfitSelection {
  let rngState = seed;
  function next() {
    rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
    return rngState / 0x7fffffff;
  }

  let selection: OutfitSelection = {};
  const categories: GarmentCategory[] = ["dresses", "tops", "bottoms", "outerwear", "shoes", "bags", "accessories", "hairstyles"];

  // Decide dress vs top+bottom up front so we don't immediately clobber a choice.
  const wantsDress = next() > 0.5;

  for (const category of categories) {
    if (category === "dresses" && !wantsDress) continue;
    if ((category === "tops" || category === "bottoms") && wantsDress) continue;

    const options = catalog.filter((c) => c.category === category && c.assetType !== "image-only");
    if (options.length === 0) continue;
    const pick = options[Math.floor(next() * options.length)];
    const colorId = pick.colors.length > 0 ? pick.colors[Math.floor(next() * pick.colors.length)].id : undefined;

    const compat = checkCompatibility(selection, pick, catalog);
    if (!compat.ok) continue;
    selection = applySelection(selection, pick, colorId, catalog).selection;
  }

  return selection;
}
