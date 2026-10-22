"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export type CameraPreset = "front" | "side" | "back";

/** Fallback used only before the avatar's bounding box is known (e.g. the
 * very first frame before any mesh has mounted). Everything after that
 * uses computeFramedShot() below, driven by the model's real dimensions. */
const FALLBACK_TARGET: [number, number, number] = [0, 0.95, 0];
const FALLBACK_POSITION: Record<CameraPreset, [number, number, number]> = {
  front: [0, 1.1, 3.1],
  side: [3.1, 1.1, 0],
  back: [0, 1.1, -3.1],
};

const VIEW_DIRECTION: Record<CameraPreset, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0, 1),
  side: new THREE.Vector3(1, 0, 0),
  back: new THREE.Vector3(0, 0, -1),
};

const MIN_DISTANCE = 1.3;
const MAX_DISTANCE = 6.8;

/**
 * Computes a camera position/target that frames `target`'s actual
 * bounding box head-to-foot, instead of a hardcoded distance that only
 * happens to look right for one specific model size.
 *
 * Width (the body's left-right or front-back extent, depending on the
 * preset) is capped relative to height before it's used to pick a
 * distance. This avatar's rest pose holds the arms stretched out to the
 * sides; framing the *literal* full bounding box (fingertip to
 * fingertip) would push the camera so far back that the body fills only
 * a sliver of the frame — the "too small, too much empty space" failure
 * mode. Capping width to a multiple of height keeps the body (head,
 * torso, legs, feet — the part that's actually wearing the outfit)
 * generously framed; the very outer hands may sit close to or just past
 * the frame edge in the default pose. That's a property of the source
 * rig's rest pose, not something the camera math can fix — see
 * docs/3d-asset-pipeline.md.
 */
function computeFramedShot(
  target: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  preset: CameraPreset,
  aspect: number
): { position: THREE.Vector3; target: THREE.Vector3 } | null {
  target.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(target);
  if (box.isEmpty()) return null;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  if (size.y <= 0) return null;

  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

  const rawWidth = preset === "side" ? size.z : size.x;
  const framedWidth = Math.min(rawWidth, size.y * 1.35);

  const MARGIN = 1.1; // a little headroom/footroom and side breathing room
  const distanceForHeight = (size.y / 2 / Math.tan(vFov / 2)) * MARGIN;
  const distanceForWidth = (framedWidth / 2 / Math.tan(hFov / 2)) * MARGIN;

  const distance = THREE.MathUtils.clamp(Math.max(distanceForHeight, distanceForWidth), MIN_DISTANCE, MAX_DISTANCE);

  const position = center.clone().addScaledVector(VIEW_DIRECTION[preset], distance);
  position.y = center.y;

  return { position, target: center.clone() };
}

export interface CameraRigHandle {
  goTo: (preset: CameraPreset) => void;
  reset: () => void;
}

interface OrbitState {
  /** Distance from `center`. */
  radius: number;
  /** Azimuth around the Y axis, three.js convention (0 = +Z/front, increasing toward +X/side). */
  theta: number;
  /** Polar angle from +Y. All our shots keep the camera level with the
   * subject's center, so this stays at PI/2, but it's tracked anyway so
   * a manual drag mid-transition still animates from where it really is. */
  phi: number;
  center: THREE.Vector3;
}

function toOrbitState(position: THREE.Vector3, center: THREE.Vector3): OrbitState {
  const offset = position.clone().sub(center);
  const radius = Math.max(offset.length(), 0.0001);
  const theta = Math.atan2(offset.x, offset.z);
  const phi = Math.acos(THREE.MathUtils.clamp(offset.y / radius, -1, 1));
  return { radius, theta, phi, center: center.clone() };
}

function fromOrbitState(state: OrbitState): THREE.Vector3 {
  const sinPhiRadius = Math.sin(state.phi) * state.radius;
  return new THREE.Vector3(
    sinPhiRadius * Math.sin(state.theta),
    Math.cos(state.phi) * state.radius,
    sinPhiRadius * Math.cos(state.theta)
  ).add(state.center);
}

/** Shortest angular delta from `from` to `to`, wrapped to (-PI, PI]. An
 * exact PI (front<->back is always exactly opposite) is ambiguous by
 * definition — pick +PI consistently so the camera always sweeps the
 * same way around rather than the sign flipping between runs. */
function shortestDelta(from: number, to: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  if (Math.abs(Math.abs(delta) - Math.PI) < 1e-6) delta = Math.PI;
  return delta;
}

/** Wraps OrbitControls and exposes imperative front/side/back/reset
 * presets with a smooth tween, driven by useFrame (so it must live
 * inside the <Canvas>). Touch-friendly via drei's default touch
 * bindings (one-finger rotate, two-finger pinch/pan).
 *
 * `target` is the avatar's root group — when present, every preset is
 * framed live from its actual bounding box (see computeFramedShot)
 * rather than a fixed camera distance, so it adapts correctly to
 * whichever model (placeholder or real avatar.glb) and whichever
 * garments are currently attached. */
export const CameraRig = forwardRef<
  CameraRigHandle,
  { autoRotate?: boolean; enabled?: boolean; target?: THREE.Object3D | null }
>(function CameraRig({ autoRotate = false, enabled = true, target = null }, ref) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, invalidate, size } = useThree();
  // Animated as an orbit (radius/theta/phi around a center), not a
  // straight Cartesian lerp of camera.position — front and back sit
  // directly opposite each other, so a plain position lerp cuts straight
  // through the avatar's body for a few frames mid-transition instead of
  // sweeping around it. `from`/`to` are both orbit states; each frame we
  // advance `current` a fraction of the way from `from` toward `to` and
  // rebuild camera.position from that, which always arcs around `center`.
  const animating = useRef<{ from: OrbitState; to: OrbitState; t: number } | null>(null);
  const hasAutoFramed = useRef(false);

  const goToPreset = (preset: CameraPreset) => {
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const framed = target && camera instanceof THREE.PerspectiveCamera ? computeFramedShot(target, camera, preset, aspect) : null;
    const position = framed?.position ?? new THREE.Vector3(...FALLBACK_POSITION[preset]);
    const nextTarget = framed?.target ?? new THREE.Vector3(...FALLBACK_TARGET);

    const currentCenter = controls.current?.target.clone() ?? nextTarget.clone();
    const from = toOrbitState(camera.position, currentCenter);
    const to = toOrbitState(position, nextTarget);
    // Take the shortest rotational path for theta instead of whatever a
    // raw numeric difference would give (which could spin the long way
    // around or, for exactly-opposite presets, be ambiguous).
    to.theta = from.theta + shortestDelta(from.theta, to.theta);

    animating.current = { from, to, t: 0 };
    // Canvas uses frameloop="demand" — useFrame callbacks don't run at
    // all until a render is requested, so kick off the first tick here.
    invalidate();
  };

  useImperativeHandle(ref, () => ({
    goTo: goToPreset,
    reset: () => goToPreset("front"),
  }));

  // Auto-frame once, the first time the avatar's bounding box becomes
  // non-empty (i.e. once its meshes have actually mounted). This runs
  // once per avatar mount, not on every render/outfit change — swapping
  // garments afterwards keeps whatever framing/zoom the user left the
  // camera at, per the "don't reset camera on every render" requirement.
  useEffect(() => {
    if (!target) return;
    hasAutoFramed.current = false;
    let raf = 0;
    let cancelled = false;
    const tryAutoFrame = () => {
      if (cancelled || hasAutoFramed.current) return;
      const box = new THREE.Box3().setFromObject(target);
      if (!box.isEmpty()) {
        hasAutoFramed.current = true;
        goToPreset("front");
        return;
      }
      raf = requestAnimationFrame(tryAutoFrame);
    };
    raf = requestAnimationFrame(tryAutoFrame);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // goToPreset intentionally omitted — it closes over `target`/`camera`/`size`,
    // which this effect already depends on via `target`; re-running it on every
    // camera/size change would re-trigger the one-shot auto-frame unexpectedly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useFrame(() => {
    if (!animating.current || !controls.current) return;
    const anim = animating.current;
    // Exponential ease toward t=1, same feel as the previous plain lerp
    // (~12% of the remaining distance per frame) but applied to the
    // orbit parameters instead of raw position.
    anim.t = 1 - (1 - anim.t) * 0.88;

    const current: OrbitState = {
      radius: THREE.MathUtils.lerp(anim.from.radius, anim.to.radius, anim.t),
      theta: THREE.MathUtils.lerp(anim.from.theta, anim.to.theta, anim.t),
      phi: THREE.MathUtils.lerp(anim.from.phi, anim.to.phi, anim.t),
      center: anim.from.center.clone().lerp(anim.to.center, anim.t),
    };

    camera.position.copy(fromOrbitState(current));
    controls.current.target.copy(current.center);
    controls.current.update();

    if (1 - anim.t < 0.001) {
      camera.position.copy(fromOrbitState(anim.to));
      controls.current.target.copy(anim.to.center);
      controls.current.update();
      animating.current = null;
    } else {
      // Still mid-transition — schedule the next tick (demand mode renders
      // exactly one frame per invalidate() call, it doesn't keep looping).
      invalidate();
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={enabled}
      makeDefault
      enablePan={false}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.62}
      autoRotate={autoRotate}
      autoRotateSpeed={0.8}
      target={FALLBACK_TARGET}
    />
  );
});
