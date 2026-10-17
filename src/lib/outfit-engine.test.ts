import { describe, it, expect } from "vitest";
import {
  applySelection,
  checkCompatibility,
  removeCategory,
  resolveSelection,
  randomizeOutfit,
} from "./outfit-engine";
import { FIXTURE_CATALOG } from "@/data/test-fixtures";
import type { OutfitSelection } from "@/types/outfit";

const top = FIXTURE_CATALOG.find((i) => i.id === "fixture-top")!;
const bottom = FIXTURE_CATALOG.find((i) => i.id === "fixture-bottom")!;
const dress = FIXTURE_CATALOG.find((i) => i.id === "fixture-dress")!;
const shoes = FIXTURE_CATALOG.find((i) => i.id === "fixture-shoes")!;
const necklace = FIXTURE_CATALOG.find((i) => i.id === "fixture-necklace")!;
const bagA = FIXTURE_CATALOG.find((i) => i.id === "fixture-bag-a")!;

describe("applySelection", () => {
  it("adds an item to an empty selection", () => {
    const { selection, removedCategories } = applySelection({}, top, "red", FIXTURE_CATALOG);
    expect(selection.tops).toEqual({ itemId: "fixture-top", colorId: "red" });
    expect(removedCategories).toEqual([]);
  });

  it("allows top + bottom + shoes simultaneously", () => {
    let selection: OutfitSelection = {};
    selection = applySelection(selection, top, "red", FIXTURE_CATALOG).selection;
    selection = applySelection(selection, bottom, "black", FIXTURE_CATALOG).selection;
    selection = applySelection(selection, shoes, undefined, FIXTURE_CATALOG).selection;
    expect(Object.keys(selection).sort()).toEqual(["bottoms", "shoes", "tops"]);
  });

  it("a dress replaces an existing top and bottom", () => {
    let selection: OutfitSelection = {};
    selection = applySelection(selection, top, "red", FIXTURE_CATALOG).selection;
    selection = applySelection(selection, bottom, "black", FIXTURE_CATALOG).selection;

    const result = applySelection(selection, dress, "green", FIXTURE_CATALOG);
    expect(result.selection.dresses).toEqual({ itemId: "fixture-dress", colorId: "green" });
    expect(result.selection.tops).toBeUndefined();
    expect(result.selection.bottoms).toBeUndefined();
    expect(result.removedCategories.sort()).toEqual(["bottoms", "tops"]);
  });

  it("selecting a top while a dress is worn removes the dress", () => {
    let selection: OutfitSelection = {};
    selection = applySelection(selection, dress, "green", FIXTURE_CATALOG).selection;

    const result = applySelection(selection, top, "red", FIXTURE_CATALOG);
    expect(result.selection.tops).toEqual({ itemId: "fixture-top", colorId: "red" });
    expect(result.selection.dresses).toBeUndefined();
    expect(result.removedCategories).toEqual(["dresses"]);
  });

  it("shoes and bags are never removed by unrelated selections", () => {
    let selection: OutfitSelection = {};
    selection = applySelection(selection, shoes, undefined, FIXTURE_CATALOG).selection;
    selection = applySelection(selection, dress, "green", FIXTURE_CATALOG).selection;
    expect(selection.shoes).toBeDefined();
  });
});

describe("checkCompatibility", () => {
  it("allows compatible items", () => {
    const result = checkCompatibility({}, top, FIXTURE_CATALOG);
    expect(result.ok).toBe(true);
  });

  it("rejects a declared hard conflict (conflictsWith)", () => {
    let selection: OutfitSelection = {};
    selection = applySelection(selection, bagA, undefined, FIXTURE_CATALOG).selection;
    const result = checkCompatibility(selection, necklace, FIXTURE_CATALOG);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Fixture Bag A");
  });

  it("is symmetric — conflict is detected regardless of selection order", () => {
    let selection: OutfitSelection = {};
    selection = applySelection(selection, necklace, undefined, FIXTURE_CATALOG).selection;
    const result = checkCompatibility(selection, bagA, FIXTURE_CATALOG);
    expect(result.ok).toBe(false);
  });
});

describe("removeCategory", () => {
  it("removes only the specified category", () => {
    let selection: OutfitSelection = {};
    selection = applySelection(selection, top, "red", FIXTURE_CATALOG).selection;
    selection = applySelection(selection, bottom, "black", FIXTURE_CATALOG).selection;
    const next = removeCategory(selection, "tops");
    expect(next.tops).toBeUndefined();
    expect(next.bottoms).toBeDefined();
  });
});

describe("resolveSelection", () => {
  it("resolves to full catalog items and colors", () => {
    let selection: OutfitSelection = {};
    selection = applySelection(selection, top, "blue", FIXTURE_CATALOG).selection;
    const resolved = resolveSelection(selection, FIXTURE_CATALOG);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].item.id).toBe("fixture-top");
    expect(resolved[0].color?.id).toBe("blue");
  });

  it("gracefully skips items no longer in the catalog", () => {
    const selection: OutfitSelection = { tops: { itemId: "deleted-item" } };
    const resolved = resolveSelection(selection, FIXTURE_CATALOG);
    expect(resolved).toHaveLength(0);
  });
});

describe("randomizeOutfit", () => {
  it("is deterministic for a given seed", () => {
    const a = randomizeOutfit(FIXTURE_CATALOG, 42);
    const b = randomizeOutfit(FIXTURE_CATALOG, 42);
    expect(a).toEqual(b);
  });

  it("never produces both a dress and a top/bottom simultaneously", () => {
    for (let seed = 0; seed < 20; seed++) {
      const result = randomizeOutfit(FIXTURE_CATALOG, seed);
      const hasDress = Boolean(result.dresses);
      const hasTopOrBottom = Boolean(result.tops) || Boolean(result.bottoms);
      expect(hasDress && hasTopOrBottom).toBe(false);
    }
  });
});
