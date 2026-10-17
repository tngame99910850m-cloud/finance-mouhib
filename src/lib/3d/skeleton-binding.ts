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
import type { AttachmentPoint } from "@/types/catalog";

export interface BindResult {
  ok: boolean;
  reason?: string;
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
