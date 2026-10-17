import type { OutfitRepository } from "./types";
import type { SavedOutfit, AvatarAppearance } from "@/types/outfit";

/**
 * In-memory repository used for server-side rendering (where IndexedDB
 * doesn't exist) and for deterministic tests/fixtures. Data does not
 * persist across reloads — this is intentionally a no-op store, not a
 * second source of truth.
 */
export class MemoryOutfitRepository implements OutfitRepository {
  private outfits = new Map<string, SavedOutfit>();
  private favorites = new Set<string>();
  private avatarAppearance: AvatarAppearance | undefined;

  async isReady(): Promise<boolean> {
    return true;
  }

  async listOutfits(): Promise<SavedOutfit[]> {
    return Array.from(this.outfits.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getOutfit(id: string): Promise<SavedOutfit | undefined> {
    return this.outfits.get(id);
  }

  async saveOutfit(outfit: SavedOutfit): Promise<void> {
    this.outfits.set(outfit.id, outfit);
  }

  async deleteOutfit(id: string): Promise<void> {
    this.outfits.delete(id);
  }

  async getFavoriteItemIds(): Promise<string[]> {
    return Array.from(this.favorites);
  }

  async setFavoriteItem(itemId: string, isFavorite: boolean): Promise<void> {
    if (isFavorite) this.favorites.add(itemId);
    else this.favorites.delete(itemId);
  }

  async getAvatarAppearance(): Promise<AvatarAppearance | undefined> {
    return this.avatarAppearance;
  }

  async saveAvatarAppearance(appearance: AvatarAppearance): Promise<void> {
    this.avatarAppearance = appearance;
  }

  async resetAll(): Promise<void> {
    this.outfits.clear();
    this.favorites.clear();
    this.avatarAppearance = undefined;
  }
}
