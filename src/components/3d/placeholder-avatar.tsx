"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { AvatarAppearance } from "@/types/outfit";
import { AVATAR_MANIFEST } from "@/data/asset-manifest";

/**
 * Development stand-in shown whenever /assets/avatar/avatar.glb is
 * missing. This is a labeled placeholder, not a personalized avatar —
 * it exists so the rest of the app (camera controls, outfit builder,
 * attachment points) is fully testable before the real asset exists.
 *
 * It exposes named attachment points (head, neck, left-hand,
 * right-hand, waist, left-foot, right-foot, back) as empty Object3Ds,
 * matching what a real exported avatar should also expose — see
 * docs/3d-asset-pipeline.md.
 */
export function PlaceholderAvatar({ appearance }: { appearance: AvatarAppearance }) {
  const hairRef = useRef<THREE.Mesh>(null);

  const hairColor = useMemo(() => {
    const match = AVATAR_MANIFEST.hairColors.find((c) => c.id === appearance.hairColorId);
    return match?.materialColor ?? AVATAR_MANIFEST.hairColors[0]?.materialColor ?? "#3a2a1f";
  }, [appearance.hairColorId]);

  const skinTone = "#e8c2a0";

  return (
    <group name="placeholder-avatar" position={[0, 0, 0]}>
      {/* Torso */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.26, 0.6, 6, 12]} />
        <meshStandardMaterial color="#d8d2c9" roughness={0.75} />
      </mesh>

      {/* Hips / waist attachment point */}
      <group name="waist" position={[0, 0.78, 0]}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.23, 0.22, 6, 12]} />
          <meshStandardMaterial color="#c7bfb3" roughness={0.8} />
        </mesh>
      </group>

      {/* Legs */}
      <mesh position={[-0.12, 0.35, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.1, 0.55, 6, 10]} />
        <meshStandardMaterial color="#efe8dd" roughness={0.8} />
      </mesh>
      <mesh position={[0.12, 0.35, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.1, 0.55, 6, 10]} />
        <meshStandardMaterial color="#efe8dd" roughness={0.8} />
      </mesh>

      {/* Feet attachment points */}
      <group name="left-foot" position={[-0.12, 0.05, 0.05]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.08, 0.22]} />
          <meshStandardMaterial color="#4a4038" roughness={0.6} />
        </mesh>
      </group>
      <group name="right-foot" position={[0.12, 0.05, 0.05]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.08, 0.22]} />
          <meshStandardMaterial color="#4a4038" roughness={0.6} />
        </mesh>
      </group>

      {/* Arms + hand attachment points */}
      <group name="left-hand" position={[-0.4, 0.82, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.06, 0.5, 6, 10]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>
      </group>
      <group name="right-hand" position={[0.4, 0.82, 0]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.06, 0.5, 6, 10]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>
      </group>

      {/* Neck attachment point */}
      <group name="neck" position={[0, 1.42, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.1, 10]} />
          <meshStandardMaterial color={skinTone} roughness={0.7} />
        </mesh>
      </group>

      {/* Head + hair + head attachment point */}
      <group name="head" position={[0, 1.6, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshStandardMaterial color={skinTone} roughness={0.65} />
        </mesh>
        <mesh ref={hairRef} name="hair" position={[0, 0.05, -0.01]} castShadow>
          <sphereGeometry args={[0.175, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
          <meshStandardMaterial color={hairColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Back attachment point (bags, backpacks) */}
      <group name="back" position={[0, 1.1, -0.28]} />
    </group>
  );
}
