// Pure Three.js scene-graph utilities for attaching garments to the
// avatar. These operate on plain THREE.Object3D graphs and need no
// renderer/WebGL context, so they're fully unit-testable with
// hand-built fixtures (see the tests alongside this file).
//
// This is the implementation of section 3's compatibility rules: a
// skinned garment is only bound if its bone names match the avatar's
// skeleton; a rigid garment is only attached if its declared
// attachment point exists on the avatar. Neither case is ever silently
// accepted when incompatible — callers get a typed result they must
// check.

import * as THREE from "three";
import type { AttachmentPoint, FitSpan, GarmentCategory } from "@/types/catalog";

export interface BindResult {
  ok: boolean;
  reason?: string;
}

const DEFAULT_FIT_SPAN: Record<GarmentCategory, FitSpan> = {
  dresses: "full",
  outerwear: "full",
  tops: "upper",
  bottoms: "lower",
  shoes: "none",
  bags: "none",
  accessories: "none",
  hairstyles: "none",
};

/** The sensible default FitSpan for a garment category — see FitSpan's
 * doc comment in types/catalog.ts. A CatalogItem's own `fitSpan` always
 * takes priority over this when set. */
export function defaultFitSpanForCategory(category: GarmentCategory): FitSpan {
  return DEFAULT_FIT_SPAN[category];
}

function landmarkWorldPosition(avatarRoot: THREE.Object3D, name: string): THREE.Vector3 | undefined {
  const node = avatarRoot.getObjectByName(name);
  if (!node) return undefined;
  const out = new THREE.Vector3();
  node.getWorldPosition(out);
  return out;
}

/** Collects every bone in a skeleton, keyed by name. */
function indexBonesByName(skeleton: THREE.Skeleton): Map<string, THREE.Bone> {
  const map = new Map<string, THREE.Bone>();
  for (const bone of skeleton.bones) map.set(bone.name, bone);
  return map;
}

/**
 * Rebinds a garment's SkinnedMesh onto the avatar's existing skeleton,
 * by bone name. This is the standard "shared skeleton" technique for
 * outfit swapping: the garment GLB must be exported with a skeleton
 * whose bone names match the avatar's (see docs/3d-asset-pipeline.md).
 * It does not clone or duplicate the skeleton — the garment mesh is
 * re-weighted onto the avatar's own bones so both deform together from
 * a single animation/pose source.
 */
export function bindSkinnedGarment(garmentMesh: THREE.SkinnedMesh, avatarSkeleton: THREE.Skeleton): BindResult {
  const avatarBones = indexBonesByName(avatarSkeleton);
  const garmentBoneNames = garmentMesh.skeleton?.bones.map((b) => b.name) ?? [];

  if (garmentBoneNames.length === 0) {
    return { ok: false, reason: "Garment mesh has no skeleton to bind." };
  }

  const missing = garmentBoneNames.filter((name) => !avatarBones.has(name));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Garment skeleton is incompatible with the avatar — missing bone(s): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""}.`,
    };
  }

  // Rebuild the garment's bone array to point at the avatar's actual
  // bone instances (same order as the mesh's skin indices expect).
  const rebound = garmentMesh.skeleton.bones.map((bone) => avatarBones.get(bone.name)!);
  const newSkeleton = new THREE.Skeleton(rebound, garmentMesh.skeleton.boneInverses);
  garmentMesh.bind(newSkeleton, garmentMesh.matrixWorld);

  return { ok: true };
}

/** Finds a named attachment point within the avatar's scene graph. An
 * avatar exposes an attachment point as an Object3D (bone or empty)
 * whose `name` matches one of ATTACHMENT_POINTS exactly. */
export function findAttachmentPoint(avatarRoot: THREE.Object3D, point: AttachmentPoint): THREE.Object3D | undefined {
  return avatarRoot.getObjectByName(point) ?? undefined;
}

/**
 * Parents a rigid asset (bag, glasses, jewelry) onto the avatar's named
 * attachment point. Rigid assets do not deform — they move rigidly with
 * the bone/empty they're parented to.
 */
export function attachRigidGarment(object: THREE.Object3D, avatarRoot: THREE.Object3D, point: AttachmentPoint): BindResult {
  const target = findAttachmentPoint(avatarRoot, point);
  if (!target) {
    return { ok: false, reason: `Avatar has no "${point}" attachment point. Add an empty/bone named "${point}" when exporting the avatar.` };
  }
  target.add(object);
  return { ok: true };
}

/**
 * Re-fits an already-attached rigid garment onto the avatar using the
 * avatar's real anatomical landmarks ("neck"/"waist"/"left-foot"/
 * "right-foot"), instead of trusting whatever scale/offset the source
 * file happened to be exported with.
 *
 * Why this exists: these rigid garments are static exports of a CLO3D/
 * Marvelous Designer drape (a frozen cloth-sim snapshot, not a rigged
 * mesh), and the conversion pipeline baked a one-off scale+translate
 * into each file by eyeballing its own bounding box against the avatar's
 * bone heights (see docs/3d-asset-pipeline.md). That per-file guess is
 * wrong for some assets — e.g. the Emerald Lace Gown's baked offset puts
 * its hem about 27cm below the floor — and there's no reliable way to
 * know which files are off just by looking at the catalog. Recomputing
 * the fit at runtime from the garment's *actual* current bounding box and
 * the avatar's *actual* landmark positions is self-correcting: it works
 * whether or not the baked transform happened to be right, and it keeps
 * working if the avatar or a garment file is ever re-exported.
 *
 * Method: a single uniform scale (never distorts width/depth
 * independently of height — the garment's authored silhouette is
 * preserved) is computed from the ratio between the avatar's target
 * vertical span (per `fitSpan`) and the garment's current bounding-box
 * height, then the garment is re-centered so that span's top/bottom
 * edges land exactly on the avatar's landmarks and its horizontal center
 * lands on the avatar's waist X/Z.
 *
 * Limits of this approach (see docs/3d-asset-pipeline.md): these are
 * flat, unposed pattern pieces, not a simulated drape on *this* avatar —
 * a uniform rescale corrects gross scale/position errors (floating,
 * sinking through the floor, shifted off-center) but cannot re-drape the
 * cloth around the avatar's specific body shape or pose. A skirt
 * authored with a trailing train will still show some of that train
 * after fitting; true per-vertex cloth fitting would require either
 * re-draping the garment in CLO3D/Marvelous Designer against this
 * avatar's mesh, or binding it as a skinned garment (see
 * `bindSkinnedGarment`) with a skeleton exported to match the avatar's.
 */
export function fitRigidGarmentToLandmarks(object: THREE.Object3D, avatarRoot: THREE.Object3D, fitSpan: FitSpan): BindResult {
  if (fitSpan === "none") return { ok: true };
  if (!object.parent) return { ok: false, reason: "Garment has no parent to fit it relative to." };

  const waist = landmarkWorldPosition(avatarRoot, "waist");
  if (!waist) return { ok: false, reason: 'Avatar has no "waist" landmark to fit this garment against.' };

  const neck = landmarkWorldPosition(avatarRoot, "neck");
  const leftFoot = landmarkWorldPosition(avatarRoot, "left-foot");
  const rightFoot = landmarkWorldPosition(avatarRoot, "right-foot");
  const floorY = leftFoot && rightFoot ? (leftFoot.y + rightFoot.y) / 2 : (leftFoot ?? rightFoot)?.y;

  let topY: number | undefined;
  let bottomY: number | undefined;
  if (fitSpan === "full") {
    topY = neck?.y;
    bottomY = floorY;
  } else if (fitSpan === "upper") {
    topY = neck?.y;
    bottomY = waist.y;
  } else {
    topY = waist.y;
    bottomY = floorY;
  }

  if (topY === undefined || bottomY === undefined || topY - bottomY <= 1e-4) {
    return { ok: false, reason: `Avatar is missing the landmarks needed to fit a "${fitSpan}"-span garment.` };
  }

  avatarRoot.updateMatrixWorld(true);
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return { ok: false, reason: "Garment geometry is empty." };

  const rawHeight = box.max.y - box.min.y;
  if (rawHeight <= 1e-6) return { ok: false, reason: "Garment has no vertical extent to fit." };

  // Clamped defensively — a degenerate source bbox (e.g. a single stray
  // vertex far from the rest of the mesh) shouldn't be able to scale the
  // garment to an absurd size.
  const scale = THREE.MathUtils.clamp((topY - bottomY) / rawHeight, 0.02, 50);

  const pivot = new THREE.Vector3((box.max.x + box.min.x) / 2, box.min.y, (box.max.z + box.min.z) / 2);
  const anchor = new THREE.Vector3(waist.x, bottomY, waist.z);

  // World-space correction: translate the garment's current pivot to the
  // origin, scale uniformly, then translate to the target anchor. Applied
  // in world space (not object.position/scale directly) so it corrects
  // for whatever transform chain — including any baked-in per-file
  // scale/offset nodes — already sits between this object and its mesh
  // geometry.
  const correction = new THREE.Matrix4()
    .makeTranslation(anchor.x, anchor.y, anchor.z)
    .multiply(new THREE.Matrix4().makeScale(scale, scale, scale))
    .multiply(new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z));

  const newWorldMatrix = new THREE.Matrix4().multiplyMatrices(correction, object.matrixWorld);
  const parentWorldInverse = new THREE.Matrix4().copy(object.parent.matrixWorld).invert();
  const newLocalMatrix = new THREE.Matrix4().multiplyMatrices(parentWorldInverse, newWorldMatrix);

  newLocalMatrix.decompose(object.position, object.quaternion, object.scale);
  object.updateMatrixWorld(true);

  return { ok: true };
}
