import { openDB, type IDBPDatabase } from "idb";
import type { OutfitRepository } from "./types";
import type { SavedOutfit, AvatarAppearance } from "@/types/outfit";

const DB_NAME = "her-style";
const DB_VERSION = 1;

const STORE_OUTFITS = "outfits";
const STORE_FAVORITES = "favorites";
const STORE_SETTINGS = "settings";

const AVATAR_APPEARANCE_KEY = "avatar-appearance";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_OUTFITS)) {
          db.createObjectStore(STORE_OUTFITS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
          db.createObjectStore(STORE_FAVORITES);
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Local-first repository backed by IndexedDB. This is the default and
 * always-available implementation — the app must remain fully usable
 * with only this repository, no network or cloud credentials required.
 */
export class IndexedDbOutfitRepository implements OutfitRepository {
  async isReady(): Promise<boolean> {
    try {
      await getDb();
      return true;
    } catch {
      return false;
    }
  }

  async listOutfits(): Promise<SavedOutfit[]> {
    const db = await getDb();
    const all = (await db.getAll(STORE_OUTFITS)) as SavedOutfit[];
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getOutfit(id: string): Promise<SavedOutfit | undefined> {
    const db = await getDb();
    return (await db.get(STORE_OUTFITS, id)) as SavedOutfit | undefined;
  }

  async saveOutfit(outfit: SavedOutfit): Promise<void> {
    const db = await getDb();
    await db.put(STORE_OUTFITS, outfit);
  }

  async deleteOutfit(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE_OUTFITS, id);
  }

  async getFavoriteItemIds(): Promise<string[]> {
    const db = await getDb();
    const ids = (await db.get(STORE_FAVORITES, "item-ids")) as string[] | undefined;
    return ids ?? [];
  }

  async setFavoriteItem(itemId: string, isFavorite: boolean): Promise<void> {
    const current = await this.getFavoriteItemIds();
    const next = isFavorite ? Array.from(new Set([...current, itemId])) : current.filter((id) => id !== itemId);
    const db = await getDb();
    await db.put(STORE_FAVORITES, next, "item-ids");
  }

  async getAvatarAppearance(): Promise<AvatarAppearance | undefined> {
    const db = await getDb();
    return (await db.get(STORE_SETTINGS, AVATAR_APPEARANCE_KEY)) as AvatarAppearance | undefined;
  }

  async saveAvatarAppearance(appearance: AvatarAppearance): Promise<void> {
    const db = await getDb();
    await db.put(STORE_SETTINGS, appearance, AVATAR_APPEARANCE_KEY);
  }

  async resetAll(): Promise<void> {
    const db = await getDb();
    await db.clear(STORE_OUTFITS);
    await db.clear(STORE_FAVORITES);
    await db.clear(STORE_SETTINGS);
  }
}
