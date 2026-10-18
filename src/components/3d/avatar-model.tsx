"use client";

import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { AvatarAppearance } from "@/types/outfit";
import { AVATAR_MANIFEST } from "@/data/asset-manifest";

/**
 * Loads and displays the real avatar.glb. Suspends while loading —
 * callers must wrap this in <Suspense> and a <ThreeErrorBoundary> (see
 * AvatarViewer) since useGLTF throws when the file is missing/invalid.
 */
export function AvatarModel({ url, appearance }: { url: string; appearance: AvatarAppearance }) {
  const gltf = useGLTF(url);
  const invalidate = useThree((state) => state.invalidate);

  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj instanceof THREE.SkinnedMesh) {
        // A SkinnedMesh's bounding sphere is computed from its rest-pose
        // geometry and never accounts for bone deformation, so the default
        // frustum-culling test can wrongly cull a mesh that's actually on
        // screen once it's posed (a well-known three.js gotcha, especially
        // for tight-fitting geometry like a close-body dress).
        obj.frustumCulled = false;
      }
      if (AVATAR_MANIFEST.hiddenMeshNames?.includes(obj.name)) toRemove.push(obj);
    });
    // Detach (not .visible = false) — this file's meshes share one
    // skeleton, and toggling visibility on a sibling skinned mesh was
    // observed to break rendering of others sharing it; a full detach
    // from the scene graph does not.
    toRemove.forEach((obj) => obj.removeFromParent());
    invalidate();
  }, [scene, invalidate]);

  useEffect(() => {
    const hairColor = AVATAR_MANIFEST.hairColors.find((c) => c.id === appearance.hairColorId);
    if (!hairColor) return;
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      // A real hairstyle is rarely a single mesh/material — it's typically
      // several hair-card layers (base, strands, alpha cards) grouped under
      // one node. Walk up from each mesh to find a "hair" ancestor, so this
      // works whether "hair" is the mesh itself (the placeholder avatar) or
      // a parent group wrapping several primitives (a real export).
      let node: THREE.Object3D | null = obj;
      let isHair = false;
      while (node) {
        if (node.name.toLowerCase() === "hair") {
          isHair = true;
          break;
        }
        node = node.parent;
      }
      if (!isHair) return;

      const material = obj.material;
      if (material instanceof THREE.MeshStandardMaterial) {
        // Clone so recoloring this avatar's hair never mutates a shared/cached material.
        // NOTE: this is a multiplicative tint (final = texture * color), so it can only
        // darken a texture, never lighten it. It fully recolors the placeholder avatar's
        // flat white hair mesh, but has little visible effect on a hair asset whose
        // diffuse texture was already baked to a dark/saturated color at export time —
        // see "Hairstyles" in docs/3d-asset-pipeline.md.
        const cloned = material.clone();
        cloned.color.set(hairColor.materialColor);
        obj.material = cloned;
      }
    });
    invalidate();
  }, [scene, appearance.hairColorId, invalidate]);

  return <primitive object={scene} dispose={null} />;
}

export function preloadAvatar(url: string) {
  useGLTF.preload(url);
}
