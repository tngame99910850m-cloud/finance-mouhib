import type { GarmentCategory, Occasion, StyleTag } from "./catalog";

/** One worn item: which catalog item, and which color variant (if any). */
export interface OutfitSlot {
  itemId: string;
  colorId?: string;
}

/** The authoritative outfit state. Every slot is keyed by category, since
 * at most one item per category can be worn (dresses/tops/bottoms are
 * reconciled by the conflict rules in the outfit engine, not by allowing
 * multiple simultaneous items in one category). */
export type OutfitSelection = Partial<Record<GarmentCategory, OutfitSlot>>;

export interface AvatarAppearance {
  hairstyleId?: string;
  hairColorId?: string;
  skinVariantId?: string;
}

export interface SavedOutfit {
  id: string;
  name: string;
  selection: OutfitSelection;
  avatarAppearance: AvatarAppearance;
  occasion?: Occasion;
  styleTags: StyleTag[];
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}
