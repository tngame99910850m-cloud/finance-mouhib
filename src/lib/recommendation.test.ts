import { describe, it, expect } from "vitest";
import { recommendOutfit } from "./recommendation";
import { FIXTURE_CATALOG } from "@/data/test-fixtures";

describe("recommendOutfit", () => {
  it("is deterministic for the same inputs", () => {
    const a = recommendOutfit({ occasion: "party", catalog: FIXTURE_CATALOG });
    const b = recommendOutfit({ occasion: "party", catalog: FIXTURE_CATALOG });
    expect(a).toEqual(b);
  });

  it("never recommends both a dress and a top/bottom", () => {
    const result = recommendOutfit({ occasion: "party", catalog: FIXTURE_CATALOG });
    const hasDress = Boolean(result.dresses);
    const hasTopOrBottom = Boolean(result.tops) || Boolean(result.bottoms);
    expect(hasDress && hasTopOrBottom).toBe(false);
  });

  it("prefers items tagged for the requested occasion", () => {
    const result = recommendOutfit({ occasion: "party", catalog: FIXTURE_CATALOG });
    // fixture-dress is tagged "party"; fixture-top/-bottom are tagged "everyday".
    expect(result.dresses?.itemId).toBe("fixture-dress");
  });

  it("never produces a selection containing a declared hard conflict", () => {
    const result = recommendOutfit({ occasion: "party", catalog: FIXTURE_CATALOG });
    const hasBagA = result.bags?.itemId === "fixture-bag-a";
    const hasNecklace = result.accessories?.itemId === "fixture-necklace";
    expect(hasBagA && hasNecklace).toBe(false);
  });
});
