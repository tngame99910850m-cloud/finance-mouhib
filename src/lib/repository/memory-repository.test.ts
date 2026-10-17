import { describe, it, expect, beforeEach } from "vitest";
import { MemoryOutfitRepository } from "./memory-repository";
import type { SavedOutfit } from "@/types/outfit";

function makeOutfit(overrides: Partial<SavedOutfit> = {}): SavedOutfit {
  return {
    id: "outfit-1",
    name: "Test Outfit",
    selection: { tops: { itemId: "fixture-top", colorId: "red" } },
    avatarAppearance: { hairColorId: "black" },
    styleTags: ["casual"],
    isFavorite: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("MemoryOutfitRepository", () => {
  let repo: MemoryOutfitRepository;

  beforeEach(() => {
    repo = new MemoryOutfitRepository();
  });

  it("is ready immediately", async () => {
    expect(await repo.isReady()).toBe(true);
  });

  it("saves and retrieves an outfit by id", async () => {
    const outfit = makeOutfit();
    await repo.saveOutfit(outfit);
    const fetched = await repo.getOutfit("outfit-1");
    expect(fetched).toEqual(outfit);
  });

  it("round-trips without depending on transient UI/Three.js state — only plain data", async () => {
    const outfit = makeOutfit({
      selection: {
        dresses: { itemId: "fixture-dress", colorId: "green" },
        shoes: { itemId: "fixture-shoes" },
      },
    });
    await repo.saveOutfit(outfit);
    const fetched = await repo.getOutfit(outfit.id);
    // Every field needed to reconstruct the look is plain JSON-serializable data.
    expect(JSON.parse(JSON.stringify(fetched))).toEqual(outfit);
  });

  it("lists outfits newest-updated first", async () => {
    await repo.saveOutfit(makeOutfit({ id: "a", updatedAt: "2024-01-01T00:00:00.000Z" }));
    await repo.saveOutfit(makeOutfit({ id: "b", updatedAt: "2024-02-01T00:00:00.000Z" }));
    const list = await repo.listOutfits();
    expect(list.map((o) => o.id)).toEqual(["b", "a"]);
  });

  it("deletes an outfit", async () => {
    await repo.saveOutfit(makeOutfit());
    await repo.deleteOutfit("outfit-1");
    expect(await repo.getOutfit("outfit-1")).toBeUndefined();
  });

  it("toggles favorite items", async () => {
    await repo.setFavoriteItem("item-1", true);
    expect(await repo.getFavoriteItemIds()).toEqual(["item-1"]);
    await repo.setFavoriteItem("item-1", false);
    expect(await repo.getFavoriteItemIds()).toEqual([]);
  });

  it("saves and restores avatar appearance", async () => {
    await repo.saveAvatarAppearance({ hairColorId: "auburn" });
    expect(await repo.getAvatarAppearance()).toEqual({ hairColorId: "auburn" });
  });

  it("resetAll clears everything", async () => {
    await repo.saveOutfit(makeOutfit());
    await repo.setFavoriteItem("item-1", true);
    await repo.saveAvatarAppearance({ hairColorId: "brown" });

    await repo.resetAll();

    expect(await repo.listOutfits()).toEqual([]);
    expect(await repo.getFavoriteItemIds()).toEqual([]);
    expect(await repo.getAvatarAppearance()).toBeUndefined();
  });
});
