// Deterministic test fixtures — independent of any real avatar/garment
// assets, so unit and e2e tests never depend on files only the app
// owner (not CI) has. See docs/3d-asset-pipeline.md for the real
// pipeline; this is intentionally separate and synthetic.

import type { CatalogItem } from "@/types/catalog";

export const FIXTURE_CATALOG: CatalogItem[] = [
  {
    id: "fixture-top",
    name: "Fixture Top",
    category: "tops",
    thumbnailUrl: "/assets/clothing/thumbnails/fixture-top.svg",
    assetType: "image-only",
    colors: [
      { id: "red", name: "Red", swatch: "#cc3333", materialColor: "#cc3333" },
      { id: "blue", name: "Blue", swatch: "#3355cc", materialColor: "#3355cc" },
    ],
    styleTags: ["casual"],
    seasonTags: ["all-season"],
    occasions: ["everyday"],
    layering: { layerOrder: 1 },
    isDemo: true,
  },
  {
    id: "fixture-bottom",
    name: "Fixture Bottom",
    category: "bottoms",
    thumbnailUrl: "/assets/clothing/thumbnails/fixture-bottom.svg",
    assetType: "image-only",
    colors: [{ id: "black", name: "Black", swatch: "#1a1a1a", materialColor: "#1a1a1a" }],
    styleTags: ["casual"],
    seasonTags: ["all-season"],
    occasions: ["everyday"],
    layering: { layerOrder: 0 },
    isDemo: true,
  },
  {
    id: "fixture-dress",
    name: "Fixture Dress",
    category: "dresses",
    thumbnailUrl: "/assets/clothing/thumbnails/fixture-dress.svg",
    assetType: "image-only",
    colors: [{ id: "green", name: "Green", swatch: "#2a7a4a", materialColor: "#2a7a4a" }],
    styleTags: ["elegant"],
    seasonTags: ["all-season"],
    occasions: ["party"],
    layering: { replaces: ["tops", "bottoms"], layerOrder: 1 },
    isDemo: true,
  },
  {
    id: "fixture-shoes",
    name: "Fixture Shoes",
    category: "shoes",
    thumbnailUrl: "/assets/clothing/thumbnails/fixture-shoes.svg",
    assetType: "image-only",
    colors: [],
    styleTags: ["casual"],
    seasonTags: ["all-season"],
    occasions: ["everyday"],
    layering: {},
    isDemo: true,
  },
  {
    id: "fixture-necklace",
    name: "Fixture Necklace",
    category: "accessories",
    thumbnailUrl: "/assets/clothing/thumbnails/fixture-necklace.svg",
    assetType: "rigid",
    modelUrl: "/assets/clothing/accessories/fixture-necklace.glb",
    attachmentPoint: "neck",
    colors: [],
    styleTags: ["elegant"],
    seasonTags: ["all-season"],
    occasions: ["party"],
    layering: {},
    isDemo: true,
  },
  // Deliberately incompatible rigid item — no matching attachment point
  // name, used to test the "useful diagnostic instead of silent
  // mis-attachment" requirement.
  {
    id: "fixture-bad-attachment",
    name: "Fixture Bad Attachment",
    category: "accessories",
    thumbnailUrl: "/assets/clothing/thumbnails/fixture-bad.svg",
    assetType: "rigid",
    modelUrl: "/assets/clothing/accessories/fixture-bad.glb",
    attachmentPoint: "waist",
    colors: [],
    styleTags: [],
    seasonTags: ["all-season"],
    occasions: ["everyday"],
    layering: {},
    isDemo: true,
  },
  // A genuine hard conflict, for testing checkCompatibility's
  // conflictsWith path (distinct from the dress/top "replaces" path).
  {
    id: "fixture-bag-a",
    name: "Fixture Bag A",
    category: "bags",
    thumbnailUrl: "/assets/clothing/thumbnails/fixture-bag-a.svg",
    assetType: "image-only",
    colors: [],
    styleTags: [],
    seasonTags: ["all-season"],
    occasions: ["everyday"],
    layering: { conflictsWith: ["accessories"] },
    isDemo: true,
  },
];
