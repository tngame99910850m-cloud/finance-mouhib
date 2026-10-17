"use client";

import { useGLTF } from "@react-three/drei";
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

  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    const hairColor = AVATAR_MANIFEST.hairColors.find((c) => c.id === appearance.hairColorId);
    if (!hairColor) return;
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.name.toLowerCase() === "hair") {
        const material = obj.material;
        if (material instanceof THREE.MeshStandardMaterial) {
          // Clone so recoloring this avatar's hair never mutates a shared/cached material.
          const cloned = material.clone();
          cloned.color.set(hairColor.materialColor);
          obj.material = cloned;
        }
      }
    });
  }, [scene, appearance.hairColorId]);

  return <primitive object={scene} dispose={null} />;
}

export function preloadAvatar(url: string) {
  useGLTF.preload(url);
}
