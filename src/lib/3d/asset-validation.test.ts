import { describe, it, expect } from "vitest";
import { validateCatalog, validateCatalogItem, summarizeIssues } from "./asset-validation";
import { FIXTURE_CATALOG } from "@/data/test-fixtures";
import { CATALOG } from "@/data/catalog";
import type { CatalogItem } from "@/types/catalog";

describe("validateCatalogItem", () => {
  it("passes a well-formed image-only item with no errors", () => {
    const item = FIXTURE_CATALOG.find((i) => i.id === "fixture-top")!;
    const issues = validateCatalogItem(item);
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("errors when a rigid item has no attachmentPoint", () => {
    const badItem: CatalogItem = {
      id: "bad-rigid",
      name: "Bad Rigid",
      category: "accessories",
      thumbnailUrl: "/x.webp",
      modelUrl: "/x.glb",
      assetType: "rigid",
      colors: [],
      styleTags: [],
      seasonTags: ["all-season"],
      occasions: ["everyday"],
      layering: {},
    };
    const issues = validateCatalogItem(badItem);
    expect(issues.some((i) => i.field === "attachmentPoint" && i.severity === "error")).toBe(true);
  });

  it("errors when a skinned/rigid item has no modelUrl", () => {
    const badItem: CatalogItem = {
      id: "bad-skinned",
      name: "Bad Skinned",
      category: "dresses",
      thumbnailUrl: "/x.webp",
      assetType: "skinned",
      colors: [],
      styleTags: [],
      seasonTags: ["all-season"],
      occasions: ["everyday"],
      layering: {},
    };
    const issues = validateCatalogItem(badItem);
    expect(issues.some((i) => i.field === "modelUrl" && i.severity === "error")).toBe(true);
  });

  it("errors when a category replaces itself", () => {
    const badItem: CatalogItem = {
      id: "self-replace",
      name: "Self Replace",
      category: "dresses",
      thumbnailUrl: "/x.webp",
      assetType: "image-only",
      colors: [],
      styleTags: [],
      seasonTags: ["all-season"],
      occasions: ["everyday"],
      layering: { replaces: ["dresses"] },
    };
    const issues = validateCatalogItem(badItem);
    expect(issues.some((i) => i.field === "layering.replaces" && i.severity === "error")).toBe(true);
  });
});

describe("validateCatalog", () => {
  it("detects duplicate ids", () => {
    const dupe = [...FIXTURE_CATALOG, { ...FIXTURE_CATALOG[0] }];
    const issues = validateCatalog(dupe);
    expect(issues.some((i) => i.message.includes("Duplicate id"))).toBe(true);
  });

  it("the real demo catalog has no structural errors", () => {
    const issues = validateCatalog(CATALOG);
    const { errorCount, isValid } = summarizeIssues(issues);
    expect(errorCount).toBe(0);
    expect(isValid).toBe(true);
  });
});
