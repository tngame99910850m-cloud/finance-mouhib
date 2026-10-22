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

  // Hair color fully works on the development placeholder avatar (a
  // flat-shaded "hair" mesh with no texture). On the current real
  // avatar.glb it's mechanically wired up the same way, but has little
  // visible effect: the source hairstyle's diffuse texture is baked to
  // a near-black color, and recoloring is a multiplicative tint
  // (texture × color), which can only darken, never lighten — see the
  // comment in avatar-model.tsx and "Hairstyles" in
  // docs/3d-asset-pipeline.md for how to author a hair texture that
  // actually responds to this.
  hairColors: [
    { id: "black", name: "Black", swatch: "#1a1512", materialColor: "#1a1512" },
    { id: "brown", name: "Brown", swatch: "#4a3326", materialColor: "#4a3326" },
    { id: "honey-blonde", name: "Honey Blonde", swatch: "#b8884a", materialColor: "#b8884a" },
    { id: "auburn", name: "Auburn", swatch: "#7a3a28", materialColor: "#7a3a28" },
  ],

  skinVariants: [],

  // The real skeleton's bone names, exported from the source rig. Any
  // skinned garment added to the catalog must bind to these exact names
  // (see docs/3d-asset-pipeline.md) — bindSkinnedGarment() in
  // src/lib/3d/skeleton-binding.ts rejects a garment whose bones don't
  // match by name rather than silently attaching it.
  skeletonBones: [
    "ludovisions_FC1_BoneRoot",
    "ludovisions_FC1_Hip",
    "ludovisions_FC1_Pelvis",
    "ludovisions_FC1_L_Thigh",
    "ludovisions_FC1_L_Calf",
    "ludovisions_FC1_L_Foot",
    "ludovisions_FC1_L_ToeBaseShareBone",
    "ludovisions_FC1_L_ToeBase",
    "ludovisions_FC1_L_PinkyToe1",
    "ludovisions_FC1_L_RingToe1",
    "ludovisions_FC1_L_MidToe1",
    "ludovisions_FC1_L_IndexToe1",
    "ludovisions_FC1_L_BigToe1",
    "ludovisions_FC1_L_CalfTwist01",
    "ludovisions_FC1_L_CalfTwist02",
    "ludovisions_FC1_L_KneeShareBone",
    "ludovisions_FC1_L_ThighTwist01",
    "ludovisions_FC1_L_ThighTwist02",
    "ludovisions_FC1_R_Thigh",
    "ludovisions_FC1_R_Calf",
    "ludovisions_FC1_R_KneeShareBone",
    "ludovisions_FC1_R_Foot",
    "ludovisions_FC1_R_ToeBase",
    "ludovisions_FC1_R_BigToe1",
    "ludovisions_FC1_R_PinkyToe1",
    "ludovisions_FC1_R_RingToe1",
    "ludovisions_FC1_R_IndexToe1",
    "ludovisions_FC1_R_MidToe1",
    "ludovisions_FC1_R_ToeBaseShareBone",
    "ludovisions_FC1_R_CalfTwist01",
    "ludovisions_FC1_R_CalfTwist02",
    "ludovisions_FC1_R_ThighTwist01",
    "ludovisions_FC1_R_ThighTwist02",
    "ludovisions_FC1_Waist",
    "ludovisions_FC1_Spine01",
    "ludovisions_FC1_Spine02",
    "ludovisions_FC1_NeckTwist01",
    "ludovisions_FC1_NeckTwist02",
    "ludovisions_FC1_Head",
    "ludovisions_FC1_FacialBone",
    "ludovisions_FC1_JawRoot",
    "ludovisions_FC1_Tongue01",
    "ludovisions_FC1_Tongue02",
    "ludovisions_FC1_Tongue03",
    "ludovisions_FC1_Teeth02",
    "ludovisions_FC1_R_Eye",
    "ludovisions_FC1_L_Eye",
    "ludovisions_FC1_UpperJaw",
    "ludovisions_FC1_Teeth01",
    "ludovisions_FC1_Button_Attach",
    "ludovisions_FC1_L_Clavicle",
    "ludovisions_FC1_L_Upperarm",
    "ludovisions_FC1_L_Forearm",
    "ludovisions_FC1_L_ForearmTwist01",
    "ludovisions_FC1_L_ForearmTwist02",
    "ludovisions_FC1_L_ElbowShareBone",
    "ludovisions_FC1_L_Hand",
    "ludovisions_FC1_L_Pinky1",
    "ludovisions_FC1_L_Pinky2",
    "ludovisions_FC1_L_Pinky3",
    "ludovisions_FC1_L_Ring1",
    "ludovisions_FC1_L_Ring2",
    "ludovisions_FC1_L_Ring3",
    "ludovisions_FC1_L_Mid1",
    "ludovisions_FC1_L_Mid2",
    "ludovisions_FC1_L_Mid3",
    "ludovisions_FC1_L_Index1",
    "ludovisions_FC1_L_Index2",
    "ludovisions_FC1_L_Index3",
    "ludovisions_FC1_L_Thumb1",
    "ludovisions_FC1_L_Thumb2",
    "ludovisions_FC1_L_Thumb3",
    "ludovisions_FC1_L_UpperarmTwist01",
    "ludovisions_FC1_L_UpperarmTwist02",
    "ludovisions_FC1_L_RibsTwist",
    "ludovisions_FC1_L_Breast",
    "ludovisions_FC1_R_RibsTwist",
    "ludovisions_FC1_R_Breast",
    "ludovisions_FC1_R_Clavicle",
    "ludovisions_FC1_R_Upperarm",
    "ludovisions_FC1_R_Forearm",
    "ludovisions_FC1_R_ElbowShareBone",
    "ludovisions_FC1_R_ForearmTwist01",
    "ludovisions_FC1_R_ForearmTwist02",
    "ludovisions_FC1_R_Hand",
    "ludovisions_FC1_R_Ring1",
    "ludovisions_FC1_R_Ring2",
    "ludovisions_FC1_R_Ring3",
    "ludovisions_FC1_R_Mid1",
    "ludovisions_FC1_R_Mid2",
    "ludovisions_FC1_R_Mid3",
    "ludovisions_FC1_R_Thumb1",
    "ludovisions_FC1_R_Thumb2",
    "ludovisions_FC1_R_Thumb3",
    "ludovisions_FC1_R_Index1",
    "ludovisions_FC1_R_Index2",
    "ludovisions_FC1_R_Index3",
    "ludovisions_FC1_R_Pinky1",
    "ludovisions_FC1_R_Pinky2",
    "ludovisions_FC1_R_Pinky3",
    "ludovisions_FC1_R_UpperarmTwist01",
    "ludovisions_FC1_R_UpperarmTwist02",
  ],

  // The source file bundles a baked-in sneaker mesh that isn't part of
  // the clothing catalog and so can never be toggled off through the
  // outfit builder (it would show under/alongside any shoes picked from
  // the wardrobe). It's hidden here by name at runtime — see the comment
  // on AvatarCapabilities.hiddenMeshNames. The other baked-in mesh
  // (mesh_07) is the dress's own shoulder trim overlay, not a separate
  // garment, and stays visible; removing it (by any method — file edit
  // or runtime detach) breaks rendering of the dress mesh itself, which
  // shares its skeleton.
  hiddenMeshNames: ["ludovisions_FC1_mesh_05"],

  // The avatar's baked-in dress body (mesh_08) — the default "nothing
  // selected" look. Hidden whenever a real 3D dress/top/bottom from the
  // catalog is worn, so that garment replaces it instead of layering on
  // top. Deliberately does NOT include mesh_07 (the shoulder/bust trim
  // overlay next to it): that mesh must stay untouched at runtime — see
  // the comment in AvatarModel for why hiding it (by any method) was
  // found to corrupt rendering of other meshes sharing this avatar's
  // skeleton, including the body mesh. So a little of mesh_07's trim
  // may still show at the collar around a worn dress; that's a known,
  // accepted gap, not a bug to chase further.
  baseOutfitMeshNames: ["ludovisions_FC1_mesh_08"],
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
