"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export type CameraPreset = "front" | "side" | "back";

const PRESETS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  front: { position: [0, 1.1, 3.1], target: [0, 0.95, 0] },
  side: { position: [3.1, 1.1, 0], target: [0, 0.95, 0] },
  back: { position: [0, 1.1, -3.1], target: [0, 0.95, 0] },
};

export interface CameraRigHandle {
  goTo: (preset: CameraPreset) => void;
  reset: () => void;
}

/** Wraps OrbitControls and exposes imperative front/side/back/reset
 * presets with a smooth tween, driven by useFrame (so it must live
 * inside the <Canvas>). Touch-friendly via drei's default touch
 * bindings (one-finger rotate, two-finger pinch/pan). */
export const CameraRig = forwardRef<CameraRigHandle, { autoRotate?: boolean; enabled?: boolean }>(function CameraRig(
  { autoRotate = false, enabled = true },
  ref
) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const animating = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useImperativeHandle(ref, () => ({
    goTo(preset) {
      const { position, target } = PRESETS[preset];
      animating.current = { position: new THREE.Vector3(...position), target: new THREE.Vector3(...target) };
    },
    reset() {
      animating.current = { position: new THREE.Vector3(...PRESETS.front.position), target: new THREE.Vector3(...PRESETS.front.target) };
    },
  }));

  useFrame(() => {
    if (!animating.current || !controls.current) return;
    const { position, target } = animating.current;
    camera.position.lerp(position, 0.12);
    controls.current.target.lerp(target, 0.12);
    controls.current.update();

    if (camera.position.distanceTo(position) < 0.01) {
      camera.position.copy(position);
      controls.current.target.copy(target);
      controls.current.update();
      animating.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={enabled}
      makeDefault
      enablePan={false}
      minDistance={1.8}
      maxDistance={5.5}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.62}
      autoRotate={autoRotate}
      autoRotateSpeed={0.8}
      target={PRESETS.front.target}
    />
  );
});
