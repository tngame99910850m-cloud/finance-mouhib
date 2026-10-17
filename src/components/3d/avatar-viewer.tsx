"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { Scene } from "./scene";
import type { CameraRigHandle, CameraPreset } from "./camera-rig";
import { detectWebGLSupport } from "@/lib/3d/webgl-support";
import { AVATAR_MANIFEST } from "@/data/asset-manifest";
import type { AvatarAppearance } from "@/types/outfit";
import type { ResolvedSlot } from "@/lib/outfit-engine";
import { Spinner } from "@/components/ui/ui";
import { AlertTriangle, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarViewerProps {
  appearance: AvatarAppearance;
  garmentSlots?: ResolvedSlot[];
  className?: string;
  /** Hides the camera-preset/fullscreen toolbar for compact previews (e.g. home screen card). */
  compact?: boolean;
}

export function AvatarViewer({ appearance, garmentSlots = [], className, compact = false }: AvatarViewerProps) {
  // This component is always loaded via next/dynamic with ssr:false (see
  // avatar-viewer-lazy.tsx), so it only ever renders in the browser — a
  // lazy initializer is safe here and avoids an extra effect/render.
  const [webglOk] = useState<boolean>(() => detectWebGLSupport());
  const [avatarAvailable, setAvatarAvailable] = useState<boolean | null>(null);
  const [avatarErrorMsg, setAvatarErrorMsg] = useState<string | null>(null);
  const [garmentIssues, setGarmentIssues] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<CameraRigHandle>(null);

  // Confirm the avatar file actually exists before asking the 3D loader
  // to fetch it — this lets us show a clean "no avatar yet" state
  // instead of a console error for the common case (dev hasn't added it).
  useEffect(() => {
    let cancelled = false;
    fetch(AVATAR_MANIFEST.modelUrl, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setAvatarAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAvatarAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGarmentIssue = useCallback((itemId: string, message: string) => {
    setGarmentIssues((prev) => ({ ...prev, [itemId]: message }));
  }, []);

  const goToPreset = (preset: CameraPreset) => cameraRef.current?.goTo(preset);
  const resetCamera = () => cameraRef.current?.reset();

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (webglOk === false) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl bg-surface-muted p-8 text-center", className)}>
        <AlertTriangle className="text-warning" size={32} />
        <p className="text-sm font-medium text-foreground">3D preview isn&apos;t available on this device</p>
        <p className="text-xs text-muted">Your browser doesn&apos;t support WebGL. Try a recent version of Chrome, Safari, or Firefox.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-b from-surface-muted to-surface", className)}>
      {avatarAvailable !== null && (
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ fov: 35, position: [0, 1.1, 3.1] }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          frameloop="demand"
        >
          <Scene
            avatarUrl={AVATAR_MANIFEST.modelUrl}
            avatarAvailable={avatarAvailable}
            appearance={appearance}
            garmentSlots={garmentSlots}
            cameraRef={cameraRef}
            onGarmentIssue={handleGarmentIssue}
            onAvatarError={setAvatarErrorMsg}
          />
        </Canvas>
      )}

      {avatarAvailable === null && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}

      {avatarAvailable === false && !compact && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-surface/90 px-3 py-1 text-[11px] font-medium text-muted shadow-sm">
          Development placeholder — add avatar.glb to personalize
        </div>
      )}

      {avatarErrorMsg && (
        <div className="absolute left-3 right-3 top-3 rounded-lg bg-danger/10 px-3 py-2 text-[11px] text-danger">
          Avatar file found but couldn&apos;t be loaded: {avatarErrorMsg}
        </div>
      )}

      {Object.keys(garmentIssues).length > 0 && !compact && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
          {Object.entries(garmentIssues).map(([id, msg]) => (
            <div key={id} className="rounded-lg bg-warning/15 px-3 py-1.5 text-[11px] text-warning">
              {msg}
            </div>
          ))}
        </div>
      )}

      {!compact && (
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
          {(["front", "side", "back"] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => goToPreset(preset)}
              className="rounded-full bg-surface/90 px-3 py-1.5 text-[11px] font-medium capitalize text-foreground shadow-sm transition-colors hover:bg-surface"
            >
              {preset}
            </button>
          ))}
          <button
            onClick={resetCamera}
            aria-label="Reset camera"
            className="rounded-full bg-surface/90 p-1.5 text-foreground shadow-sm transition-colors hover:bg-surface"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
            className="rounded-full bg-surface/90 p-1.5 text-foreground shadow-sm transition-colors hover:bg-surface"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
