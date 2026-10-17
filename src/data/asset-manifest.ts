import type { AvatarCapabilities } from "@/types/catalog";

/**
 * Describes the expected avatar asset and the optional appearance
 * variants it supports. This file is the single place that says what
 * the avatar can do — the UI should never assume a hairstyle, hair
 * color, or skin variant exists beyond what's listed here.
 *
 * Until a real avatar.glb is placed at AVATAR_MANIFEST.modelUrl, the
 * AvatarViewer renders a clearly-labeled development placeholder
 * instead. See docs/3d-asset-pipeline.md for export requirements.
 */
export const AVATAR_MANIFEST: AvatarCapabilities = {
  avatarId: "primary-avatar",
  avatarName: "Her Avatar",
  modelUrl: "/assets/avatar/avatar.glb",
  previewImageUrl: "/assets/avatar/avatar-preview.webp",

  // The photo supplied as the look/pose/proportions reference for the
  // custom GLB avatar that will eventually replace the dev placeholder.
  // It is a 2D photo, not a 3D asset — see the comment on
  // AvatarCapabilities.styleReferenceImageUrl.
  styleReferenceImageUrl: "/assets/avatar/reference-model.webp",

  // No real hairstyle GLBs exist yet, so these are not offered as
  // selectable 3D hairstyles — see src/data/catalog.ts "hairstyles"
  // category for the (currently image-only) wardrobe entries instead.
  hairstyles: [],

  // Hair color CAN be demonstrated on the development placeholder avatar
  // (it has a named "hair" mesh), so these are real, working options.
  hairColors: [
    { id: "black", name: "Black", swatch: "#1a1512", materialColor: "#1a1512" },
    { id: "brown", name: "Brown", swatch: "#4a3326", materialColor: "#4a3326" },
    { id: "honey-blonde", name: "Honey Blonde", swatch: "#b8884a", materialColor: "#b8884a" },
    { id: "auburn", name: "Auburn", swatch: "#7a3a28", materialColor: "#7a3a28" },
  ],

  skinVariants: [],

  // Populated once a real avatar.glb with a named skeleton is supplied;
  // used by asset-validation.ts to check garment/skeleton compatibility.
  skeletonBones: [],
};

/** Expected static asset directories. Created even when empty so the
 * asset pipeline has a stable, documented place to drop files into. */
export const ASSET_DIRECTORIES = [
  "public/assets/avatar",
  "public/assets/clothing/tops",
  "public/assets/clothing/bottoms",
  "public/assets/clothing/dresses",
  "public/assets/clothing/outerwear",
  "public/assets/clothing/shoes",
  "public/assets/clothing/bags",
  "public/assets/clothing/accessories",
  "public/assets/clothing/hairstyles",
  "public/assets/clothing/thumbnails",
  "public/assets/textures",
] as const;
