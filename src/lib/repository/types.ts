import type { AvatarAppearance } from "@/types/outfit";
import type { SavedOutfit } from "@/types/outfit";

/**
 * Persistence abstraction. The app only ever talks to this interface —
 * never directly to IndexedDB or Supabase — so the backing store can be
 * swapped or combined (e.g. local-first with optional cloud sync)
 * without touching any UI code.
 */
export interface OutfitRepository {
  /** True once the underlying store has been opened and is safe to read/write. */
  isReady(): Promise<boolean>;

  listOutfits(): Promise<SavedOutfit[]>;
  getOutfit(id: string): Promise<SavedOutfit | undefined>;
  saveOutfit(outfit: SavedOutfit): Promise<void>;
  deleteOutfit(id: string): Promise<void>;

  getFavoriteItemIds(): Promise<string[]>;
  setFavoriteItem(itemId: string, isFavorite: boolean): Promise<void>;

  getAvatarAppearance(): Promise<AvatarAppearance | undefined>;
  saveAvatarAppearance(appearance: AvatarAppearance): Promise<void>;

  /** Wipes all locally persisted data. Used by Settings > Reset. */
  resetAll(): Promise<void>;
}
