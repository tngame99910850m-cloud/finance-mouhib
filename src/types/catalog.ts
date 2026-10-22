// Core typed catalog model for Her Style.
//
// This is the single source of truth for what a "garment" is. The UI,
// the 3D loader, the outfit engine, and persistence all consume these
// types — nothing in the interface should hardcode a model filename or
// a garment's identity. Add a garment by adding a CatalogItem entry
// (see src/data/catalog.ts), not by editing UI components.

export const GARMENT_CATEGORIES = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "bags",
  "accessories",
  "hairstyles",
] as const;

export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];

export const OCCASIONS = [
  "everyday",
  "work",
  "shopping",
  "date-night",
  "party",
  "formal",
  "vacation",
  "sport",
  "custom",
] as const;

export type Occasion = (typeof OCCASIONS)[number];

export const STYLE_TAGS = [
  "casual",
  "elegant",
  "minimalist",
  "chic",
  "streetwear",
  "feminine",
  "sporty",
  "modest",
] as const;

export type StyleTag = (typeof STYLE_TAGS)[number];

export const SEASON_TAGS = ["spring", "summer", "autumn", "winter", "all-season"] as const;
export type SeasonTag = (typeof SEASON_TAGS)[number];

/**
 * How a garment's geometry relates to the avatar.
 * - "skinned": deforms with the avatar skeleton (needs compatible bones/weights)
 * - "rigid": attaches to a single bone/attachment point, does not deform (bags, some shoes, glasses)
 * - "image-only": no 3D asset exists yet — shown as a 2D reference/thumbnail only, cannot be worn in 3D
 */
export type AssetType = "skinned" | "rigid" | "image-only";

/** Named attachment points a rigid asset can be parented to. */
export const ATTACHMENT_POINTS = [
  "head",
  "neck",
  "left-hand",
  "right-hand",
  "waist",
  "left-foot",
  "right-foot",
  "back",
] as const;
export type AttachmentPoint = (typeof ATTACHMENT_POINTS)[number];

export interface ColorVariant {
  id: string;
  name: string;
  /** CSS color used for swatches in the UI. */
  swatch: string;
  /** Hex color applied to the garment's material, if it supports recoloring. */
  materialColor?: string;
  /** Optional texture map override for this variant. */
  textureUrl?: string;
}

export interface LayeringRules {
  /** Categories this item replaces when equipped (e.g. a dress replaces tops+bottoms). */
  replaces?: GarmentCategory[];
  /** Categories this item conflicts with and cannot be worn alongside. */
  conflictsWith?: GarmentCategory[];
  /** Render order among simultaneously-worn items; higher draws on top. */
  layerOrder?: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: GarmentCategory;
  subcategory?: string;
  description?: string;

  /** Path under /public to a thumbnail image. Always required. */
  thumbnailUrl: string;
  /** Path under /public to the GLB asset. Absent for image-only items. */
  modelUrl?: string;
  assetType: AssetType;

  /** Required only for rigid assets. */
  attachmentPoint?: AttachmentPoint;

  colors: ColorVariant[];
  styleTags: StyleTag[];
  seasonTags: SeasonTag[];
  occasions: Occasion[];
  layering: LayeringRules;

  brand?: string;
  price?: number;
  currency?: string;

  /** Marks demo/placeholder items so the UI can label them clearly. */
  isDemo?: boolean;
}

export interface AvatarHairstyleOption {
  id: string;
  name: string;
  assetType: AssetType;
  modelUrl?: string;
  thumbnailUrl: string;
  attachmentPoint?: Extract<AttachmentPoint, "head">;
}

export interface AvatarHairColorOption {
  id: string;
  name: string;
  swatch: string;
  materialColor: string;
}

export interface AvatarSkinVariant {
  id: string;
  name: string;
  swatch: string;
  materialColor?: string;
  textureUrl?: string;
}

/** What optional appearance variants the configured avatar actually supports. */
export interface AvatarCapabilities {
  avatarId: string;
  avatarName: string;
  modelUrl: string;
  previewImageUrl?: string;
  /**
   * A photographic mood/style reference for the custom avatar being built
   * (pose, proportions, styling) — NOT a preview of the actual 3D model
   * and never rendered as if it were one. Shown only in clearly-labeled
   * "reference photo" contexts as guidance for the Blender export.
   */
  styleReferenceImageUrl?: string;
  hairstyles: AvatarHairstyleOption[];
  hairColors: AvatarHairColorOption[];
  skinVariants: AvatarSkinVariant[];
  /** Named skeleton bones the avatar exposes, used to validate garment compatibility. */
  skeletonBones?: string[];
  /**
   * Names of mesh nodes baked into avatar.glb that should stay hidden by
   * default (e.g. a shoe or undergarment mesh bundled in the source file
   * that isn't part of the catalog and can't be toggled off any other
   * way). This is a visibility flag applied at load time in AvatarModel —
   * it never edits the GLB file itself, since removing nodes from this
   * particular export corrupts the shared skeleton other meshes rely on.
   */
  hiddenMeshNames?: string[];
  /**
   * Names of mesh nodes baked into avatar.glb that form the avatar's
   * default "nothing selected" dress — shown only while no real 3D
   * dress/top/bottom from the catalog covers that part of the body,
   * detached (reversibly) the moment one does. Unlike hiddenMeshNames
   * above, not every mesh that's visually part of the base look is
   * safe to list here — see the comment in AvatarModel on why only
   * the main dress body qualifies for this avatar, not its trim
   * overlay.
   */
  baseOutfitMeshNames?: string[];
}
