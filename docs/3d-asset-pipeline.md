# 3D Asset Pipeline

This document is the source of truth for exporting a compatible avatar
and garments for Her Style, from Blender. Read it before exporting
anything — mismatched scale, orientation, or bone naming is the #1
cause of a garment that "loads but looks wrong."

## Why this matters

The app does **not** attempt to auto-fit arbitrary clothing models onto
the avatar. There is no runtime retargeting, no automatic resizing, and
no cloth simulation. A garment either:

1. Shares the avatar's exact skeleton (bone names and hierarchy) and is
   skinned to it at export time, or
2. Is a rigid object (bag, glasses, jewelry) parented to one named
   attachment point on the avatar.

If neither is true, the app will show a diagnostic message instead of
silently attaching something that looks broken. See
[asset-authoring-checklist.md](./asset-authoring-checklist.md) for the
per-garment checklist.

## 0. Style reference photo

`public/assets/avatar/reference-model.webp` is a **photographic reference**
for the avatar's pose, proportions, and styling (standing A-pose, dark
straight hair with a center part, athletic/curvy silhouette) — it is
*guidance for modeling in Blender*, not a 3D asset, and the app never
treats it as one. It's shown, clearly labeled "style reference" / "not
the 3D model," on the Avatar page and as an optional overlay on the
viewer while the real `avatar.glb` is missing. You can replace this file
with an updated reference photo at any time — nothing else needs to
change.

## 1. The avatar

### Export requirements

| Requirement | Value |
|---|---|
| Format | `.glb` (binary glTF 2.0) |
| File path | `public/assets/avatar/avatar.glb` |
| Preview image | `public/assets/avatar/avatar-preview.webp` (optional, used on loading states) |
| Scale | 1 unit = 1 meter. A standing adult figure should be roughly 1.6–1.8 units tall. |
| Orientation | Facing **+Z**, up axis **+Y** (glTF standard — Blender's glTF exporter handles the Y-up conversion automatically if you leave "+Y Up" checked). |
| Origin | At the character's feet, centered on X/Z (0, 0, 0). |
| Materials | PBR (Principled BSDF in Blender maps directly to glTF PBR). |
| Textures | Baked and packed into the GLB (glTF exporter → "Textures" → check "Include all" or ensure images are packed in the .blend first). |

### Required named objects

The app looks up these exact object names in the avatar's scene graph
(`avatarRoot.getObjectByName(...)`) to know where accessories attach
and (for a skinned body) what the skeleton looks like:

**Attachment points** (empties or bones — any `Object3D` with these
exact names, case-sensitive):

- `head`
- `neck`
- `left-hand`
- `right-hand`
- `waist`
- `left-foot`
- `right-foot`
- `back`

In Blender: add an Empty (plain axes, small size) at each location,
parent it to the relevant bone if the avatar is rigged, and name it
exactly as above before exporting.

**Hair mesh** (optional but recommended): name the mesh object (or, for
a multi-primitive hairstyle, the group node wrapping its primitives)
`hair` (lowercase) if you want the Avatar page's hair-color picker to
work — the app finds any mesh nested under a node named `hair` and
swaps its material color. If your avatar's hair is a separate hairstyle
garment instead (recommended for multiple hairstyle options), see the
Hairstyles section below — the `hair` mesh approach is for a single
built-in hairstyle only.

This recolor is a **multiplicative tint** (`final = texture × color`),
so it can only darken a texture, never lighten it. Bake the hair's
diffuse texture in a light, close-to-neutral tone (not your intended
final hair color) if you want the color picker to meaningfully change
its appearance — a texture already baked dark/saturated will barely
visibly shift no matter what color is selected.

**Skeleton** (only if you plan to add skinned garments like a fitted
dress that deforms with the body): export the armature with clearly,
consistently named bones (e.g. `mixamorig:Hips`, `mixamorig:Spine`, or
your own convention — just be consistent, since every skinned garment
must reuse these exact names). Once you have a real skeleton, list its
bone names in `AVATAR_MANIFEST.skeletonBones` in
`src/data/asset-manifest.ts` so `asset-validation.ts` can check new
garments against it.

### Until you have a real avatar

The app renders a clearly-labeled placeholder figure (primitives, not a
real character) with the same named attachment points and a `hair`
mesh, so the rest of the app — camera controls, outfit selection,
color changes, save/restore — is fully usable and testable before the
real avatar exists. Drop `avatar.glb` into
`public/assets/avatar/` and reload; the app detects it automatically
(no code changes needed).

## 2. Garments

See [asset-authoring-checklist.md](./asset-authoring-checklist.md) for
the step-by-step Blender workflow. Summary of the two supported types:

### Skinned garments (dresses, tops, bottoms, outerwear)

- Must be weight-painted to **the avatar's own skeleton** — i.e. when
  you set up the garment in Blender, parent it to a copy/reference of
  the same armature the avatar uses, with identical bone names.
- Do **not** export a second copy of the skeleton with the garment —
  at runtime the app binds the garment's mesh onto the avatar's
  existing skeleton bones by name (see
  `src/lib/3d/skeleton-binding.ts`, function `bindSkinnedGarment`). If
  bone names don't match exactly, the garment is rejected with a
  diagnostic message, not silently attached.
- Export as `.glb` to the matching category folder, e.g.
  `public/assets/clothing/dresses/slip-dress.glb`.

### Rigid garments (bags, shoes with no deformation, glasses, jewelry — also used here for whole static outfits)

- Modeled once, in the correct position/scale relative to the avatar's
  attachment point origin (e.g. a necklace modeled around the avatar's
  `neck` empty location).
- Export as `.glb`. At runtime it's parented directly onto the named
  attachment point (`src/lib/3d/skeleton-binding.ts`,
  `attachRigidGarment`) — no skinning needed.
- The catalog entry (`src/data/catalog.ts`) must set
  `attachmentPoint` to one of the values above.
- **The avatar's own rig root carries a baked-in 0.01 scale**
  (`ludovisions_FC1_rig`, authored in centimeters). Every named
  attachment point is a descendant of it, so anything parented there at
  runtime inherits that same 0.01 world scale on top of whatever scale
  the garment file itself declares. A garment authored at real-world
  meters will render 100x too small unless its own root node
  compensates with a 100x counter-scale. (If a future avatar re-export
  removes this baked scale, this compensation needs to be removed too —
  check by inspecting `avatar.glb`'s node graph for a root node with a
  non-1 scale, same as `node.getScale()` in gltf-transform.)
- **A rigid item's mesh must be removed from the live Three.js scene
  when it's unselected**, not just unmounted from React — `target.add()`
  moves the object into the avatar's own scene graph, outside R3F's own
  reconciliation, so nothing detaches it automatically. `GarmentPiece`
  in `src/components/3d/garment-layer.tsx` does this via the effect's
  cleanup function (`scene.removeFromParent()`); don't remove that
  cleanup, or previously-worn rigid items will silently keep rendering
  stacked on top of newer ones.
- This technique was used for 9 real (non-demo) garments converted from
  OBJ exports — whole static outfits attached at `waist`, not just
  small accessories. They don't deform with the body and their fit is
  a first pass (scale + a rough shoulder/waist/ground height target
  computed from the garment's own bounding box, not hand-tuned per
  item) — some gaps where a garment panel doesn't fully wrap the body
  are expected and are a property of the source mesh, not a bug.

### Image-only items (not yet a 3D garment)

Any item can be added to the catalog with `assetType: "image-only"`
and no `modelUrl` — it's fully browsable in the Wardrobe and
selectable in Studio (stored in saved outfits like anything else), but
it does **not** appear on the 3D avatar. This is the correct way to
add a reference photo or a "coming soon" item — it is never silently
upgraded to a fitted 3D garment just because an image exists.

## 3. Hairstyles

Hairstyles work like rigid garments attached to the `head` point —
model the hairstyle as a standalone mesh (not deforming with a
skeleton), export to `public/assets/clothing/hairstyles/`, and add it
to `AVATAR_MANIFEST.hairstyles` in `src/data/asset-manifest.ts` (not
the general catalog — hairstyles are an avatar-appearance concept, set
on the Avatar page, not part of a saved outfit's clothing selection).

## 4. Where things go

```
public/assets/
  avatar/
    avatar.glb              ← the avatar itself
    avatar-preview.webp     ← optional static preview image
  clothing/
    tops/*.glb
    bottoms/*.glb
    dresses/*.glb
    outerwear/*.glb
    shoes/*.glb
    bags/*.glb
    accessories/*.glb
    hairstyles/*.glb
    thumbnails/*.webp        ← square product-style thumbnails, ~400×400
  textures/                  ← shared textures, if not packed into GLBs
```

## 5. Adding a garment to the app

1. Export the `.glb` per the checklist and place it in its category
   folder.
2. Add a square thumbnail (webp/png, ~400×400) to
   `public/assets/clothing/thumbnails/`.
3. Add an entry to `CATALOG` in `src/data/catalog.ts` — this is the
   **only** place a garment needs to be registered. Nothing in the UI
   hardcodes an item.
4. Run validation (see below) and fix any reported issues.
5. Start the app and confirm the item appears in Wardrobe/Studio,
   selects/deselects correctly, and (if skinned/rigid) renders and
   attaches correctly in the 3D viewer.

## 6. Validation

`src/lib/3d/asset-validation.ts` exports:

- `validateCatalogItem(item)` / `validateCatalog(items)` — synchronous,
  no network; catches structural mistakes (missing required fields,
  wrong file extension, a rigid item with no attachment point, etc.).
  Safe to run in a script or a test.
- `validateAssetsExist(items)` — browser-only, issues `HEAD` requests
  to confirm thumbnail/model files actually exist at their declared
  paths.

What validation **cannot** catch (needs manual inspection):

- Whether a skinned garment actually deforms correctly / clips through
  the body at the avatar's rest pose or in motion — check visually in
  Blender and in the live app.
- Texture/material quality, seams, UV stretching.
- Whether a rigid item's scale and position actually look right at its
  attachment point — check in the app's 3D viewer.
- Whether bone *weights* (not just bone *names*) are sensible — name
  matching only confirms the garment *can* bind, not that it deforms
  well.

See [asset-authoring-checklist.md](./asset-authoring-checklist.md) for
the full manual QA checklist.
