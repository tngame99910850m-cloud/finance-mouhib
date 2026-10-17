# Asset Authoring Checklist

Practical, step-by-step checklist for taking a garment from Blender
into the app. Pair this with [3d-asset-pipeline.md](./3d-asset-pipeline.md)
for the "why" behind each requirement.

## Before you start

- [ ] Avatar is exported and in `public/assets/avatar/avatar.glb`
- [ ] You know the avatar's bone names (if this garment will be skinned)
- [ ] You know which attachment point this garment needs (if rigid)

## Per-garment workflow

1. **Create or import the garment in Blender.**
2. **Fit it to the avatar.** Import `avatar.glb` into the same scene as
   a reference and shape/scale the garment to match — same unit scale
   (1 unit = 1m), same origin convention (feet at 0,0,0 for a
   full-body reference).
3. **Choose skinned or rigid:**
   - Skinned (dresses, tops, bottoms, outerwear): parent the garment
     mesh to **the avatar's own armature** (or an exact copy with
     identical bone names) and weight-paint it. Do not create a new,
     differently-named skeleton.
   - Rigid (bags, shoes, glasses, jewelry): no armature needed — just
     position/scale it correctly relative to where its attachment
     point empty sits on the avatar.
4. **Check weights, clipping, materials, textures** (skinned only):
   - [ ] Pose the avatar through a few test poses (if animations exist)
         and confirm no major clipping through the body
   - [ ] No unweighted or fully-rigid vertices where they shouldn't be
   - [ ] Materials use the Principled BSDF node (maps to glTF PBR)
   - [ ] Textures are packed (File → External Data → Pack Resources)
5. **Export the GLB:**
   - [ ] Format: `.glb` (binary)
   - [ ] "+Y Up" checked (Blender's default glTF export handles this)
   - [ ] Only the garment (+ skeleton reference, for skinned) is
         exported — do not bundle the avatar body
   - [ ] Textures: "Include all" / packed
6. **Place the asset** in its category directory under
   `public/assets/clothing/<category>/`, named in kebab-case (e.g.
   `slip-dress.glb`) — this becomes part of the catalog's
   `modelUrl`.
7. **Add a thumbnail** (~400×400, webp/png) to
   `public/assets/clothing/thumbnails/`.
8. **Add the catalog entry** in `src/data/catalog.ts`:
   - [ ] Unique kebab-case `id`
   - [ ] Correct `category` / `subcategory`
   - [ ] `assetType` set correctly (`skinned` / `rigid` / `image-only`)
   - [ ] `modelUrl` set (skinned/rigid only) and matches the file you placed
   - [ ] `attachmentPoint` set (rigid only)
   - [ ] `colors` array with real `materialColor` hex values if the
         garment should be recolorable (confirm the mesh's material
         actually responds — see "Color variants" below)
   - [ ] `styleTags`, `seasonTags`, `occasions` filled in honestly —
         these drive search, filters, and the recommendation engine
   - [ ] `layering` rules set: does this item `replace` other
         categories (a dress replacing tops+bottoms)? Does it
         genuinely `conflictsWith` anything?
9. **Run asset validation** — either call
   `validateCatalog(CATALOG)` from a quick script, or rely on the
   Settings page diagnostics (if enabled) to catch structural issues
   before you even open the 3D viewer.
10. **Preview the garment in the app:**
    - [ ] Appears in Wardrobe with the right thumbnail and filters
    - [ ] Selectable in Studio; appears on the avatar within a couple
          seconds
    - [ ] No console errors/warnings about skeleton or attachment
          mismatches
    - [ ] If skinned: no visible clipping, stretches correctly if the
          avatar has any idle motion
    - [ ] If rigid: sits at the correct position/scale/rotation
11. **Confirm the full lifecycle:**
    - [ ] Selecting it updates the 3D view and the outfit summary
    - [ ] Deselecting it removes it cleanly
    - [ ] If it has colors, changing color updates the 3D model (not
          just the swatch UI)
    - [ ] Save an outfit with it equipped, reload the page, reopen the
          outfit — it's still there and still renders
    - [ ] If it conflicts with or replaces another category (e.g. a
          new dress vs. a top), confirm that resolves correctly, not
          by both items silently rendering at once

## Color variants

A garment only supports live recoloring in 3D if:

- Its mesh material is a `MeshStandardMaterial` (standard glTF PBR
  export of a Principled BSDF)
- The catalog's `colors[].materialColor` is set to a real hex value

If a garment uses a baked-in texture per color (e.g. a patterned
fabric that can't just be tinted), give each color its own
`textureUrl` instead of relying on `materialColor`, and keep the
garment itself as separate catalog entries if the geometry differs, or
use `textureUrl` swapping if only the surface pattern changes.

## What can't be automated (manual inspection required)

- Visual clipping/fit quality — look at it in the browser, at all
  three camera presets (front/side/back), not just in Blender.
- Whether weight painting looks natural in motion, if/when the avatar
  has animations.
- Whether a color variant's `materialColor` actually looks good against
  the garment's base texture (a plain multiply-tint can look wrong on
  a textured material — test it).
- Thumbnail framing/cropping consistency across the catalog — eyeball
  the Wardrobe grid after adding a few items.
