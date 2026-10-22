"use client";

import { Suspense, useState } from "react";
import * as THREE from "three";
import { ContactShadows } from "@react-three/drei";
import { AvatarModel } from "./avatar-model";
import { PlaceholderAvatar } from "./placeholder-avatar";
import { GarmentLayer } from "./garment-layer";
import { CameraRig, type CameraRigHandle } from "./camera-rig";
import { ThreeErrorBoundary } from "./error-boundary";
import type { AvatarAppearance } from "@/types/outfit";
import type { ResolvedSlot } from "@/lib/outfit-engine";

export function Scene({
  avatarUrl,
  avatarAvailable,
  appearance,
  garmentSlots,
  cameraRef,
  onGarmentIssue,
  onAvatarError,
}: {
  avatarUrl: string;
  avatarAvailable: boolean;
  appearance: AvatarAppearance;
  garmentSlots: ResolvedSlot[];
  cameraRef: React.Ref<CameraRigHandle>;
  onGarmentIssue: (itemId: string, message: string) => void;
  onAvatarError: (message: string) => void;
}) {
  const [avatarRoot, setAvatarRoot] = useState<THREE.Group | null>(null);

  // The avatar's own baked-in default dress must disappear the moment a
  // real 3D dress/top/bottom is worn, or the two visibly layer together.
  const hideBaseOutfit = garmentSlots.some(
    (slot) =>
      (slot.category === "dresses" || slot.category === "tops" || slot.category === "bottoms" || slot.category === "outerwear") &&
      slot.item.modelUrl &&
      (slot.item.assetType === "skinned" || slot.item.assetType === "rigid")
  );

  return (
    <>
      {/* Self-contained lighting rig — deliberately no drei <Environment>
          preset, which fetches an HDRI from an external CDN at runtime.
          A private single-user app shouldn't depend on a third-party
          asset host just to light the scene. */}
      <hemisphereLight args={["#fbf7f4", "#8a7d74", 0.6]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-2, 2, -2]} intensity={0.4} />
      <directionalLight position={[0, 2, -3]} intensity={0.25} />

      <group ref={setAvatarRoot}>
        {avatarAvailable ? (
          <ThreeErrorBoundary
            onError={(error) => onAvatarError(error.message)}
            fallback={() => <PlaceholderAvatar appearance={appearance} />}
          >
            <Suspense fallback={null}>
              <AvatarModel url={avatarUrl} appearance={appearance} hideBaseOutfit={hideBaseOutfit} />
            </Suspense>
          </ThreeErrorBoundary>
        ) : (
          <PlaceholderAvatar appearance={appearance} />
        )}
      </group>

      {avatarRoot && (
        <Suspense fallback={null}>
          <GarmentLayer slots={garmentSlots} avatarRoot={avatarRoot} onIssue={onGarmentIssue} />
        </Suspense>
      )}

      <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={3} blur={2.5} far={2} />
      <CameraRig ref={cameraRef} />
    </>
  );
}
