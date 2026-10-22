"use client";

import { useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ResolvedSlot } from "@/lib/outfit-engine";
import { attachRigidGarment, bindSkinnedGarment } from "@/lib/3d/skeleton-binding";

/**
 * Renders the 3D garments for the currently resolved outfit slots.
 * Only slots with assetType "skinned" or "rigid" AND a modelUrl are
 * rendered — "image-only" items intentionally never appear in 3D (see
 * docs/3d-asset-pipeline.md on why a photo isn't a fitted garment).
 *
 * Any incompatibility (missing skeleton match, missing attachment
 * point) is reported via onIssue rather than silently ignored.
 */
export function GarmentLayer({
  slots,
  avatarRoot,
  onIssue,
}: {
  slots: ResolvedSlot[];
  avatarRoot: THREE.Object3D | null;
  onIssue: (itemId: string, message: string) => void;
}) {
  const renderable = slots.filter((s) => s.item.modelUrl && (s.item.assetType === "skinned" || s.item.assetType === "rigid"));

  if (!avatarRoot || renderable.length === 0) return null;

  return (
    <>
      {renderable.map((slot) => (
        <GarmentPiece key={slot.item.id} slot={slot} avatarRoot={avatarRoot} onIssue={onIssue} />
      ))}
    </>
  );
}

function GarmentPiece({
  slot,
  avatarRoot,
  onIssue,
}: {
  slot: ResolvedSlot;
  avatarRoot: THREE.Object3D;
  onIssue: (itemId: string, message: string) => void;
}) {
  const gltf = useGLTF(slot.item.modelUrl!);
  const invalidate = useThree((state) => state.invalidate);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const [attached, setAttached] = useState(false);

  useEffect(() => {
    if (slot.item.assetType === "rigid" && slot.item.attachmentPoint) {
      const result = attachRigidGarment(scene, avatarRoot, slot.item.attachmentPoint);
      if (!result.ok) onIssue(slot.item.id, result.reason ?? "Could not attach garment.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reporting the outcome of an imperative Three.js scene-graph mutation, not derivable from props
      else setAttached(true);
      invalidate();
      // attachRigidGarment imperatively parents `scene` onto the avatar's
      // scene graph, outside React/R3F's own reconciliation — nothing else
      // detaches it when this item is removed or swapped, so without this
      // cleanup every previously-worn rigid item stays attached forever.
      return () => {
        scene.removeFromParent();
        invalidate();
      };
    }

    if (slot.item.assetType === "skinned") {
      let bound = false;
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.SkinnedMesh)) return;
        // See the matching comment in avatar-model.tsx — a SkinnedMesh's
        // default bounding sphere doesn't account for bone deformation and
        // can wrongly cull a correctly-posed garment.
        obj.frustumCulled = false;
        if (bound) return;
        const avatarSkinned = findFirstSkinnedMesh(avatarRoot);
        if (!avatarSkinned) {
          onIssue(slot.item.id, "Avatar has no skinned mesh to bind this garment to.");
          return;
        }
        const result = bindSkinnedGarment(obj, avatarSkinned.skeleton);
        if (!result.ok) onIssue(slot.item.id, result.reason ?? "Skeleton mismatch.");
        else bound = true;
      });
      setAttached(bound);
      invalidate();
    }
  }, [scene, avatarRoot, slot.item, onIssue, invalidate]);

  useEffect(() => {
    if (!slot.color?.materialColor) return;
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        const cloned = obj.material.clone();
        cloned.color.set(slot.color!.materialColor!);
        obj.material = cloned;
      }
    });
    invalidate();
  }, [scene, slot.color, invalidate]);

  // Rigid assets are parented via attachRigidGarment (imperatively added
  // to the attachment-point Object3D); skinned assets bind to the
  // avatar's own skeleton and don't need to be added to the group tree
  // again, so only render the primitive here for the rigid+unattached
  // fallback case (keeps the item visible while a diagnostic is shown).
  if (slot.item.assetType === "rigid" && attached) return null;
  if (slot.item.assetType === "skinned") return <primitive object={scene} dispose={null} />;
  return null;
}

function findFirstSkinnedMesh(root: THREE.Object3D): THREE.SkinnedMesh | undefined {
  let found: THREE.SkinnedMesh | undefined;
  root.traverse((obj) => {
    if (!found && obj instanceof THREE.SkinnedMesh) found = obj;
  });
  return found;
}
