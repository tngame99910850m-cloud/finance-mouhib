"use client";

import { Canvas } from "@react-three/fiber";
import Image from "next/image";
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
  const [showReference, setShowReference] = useState(false);
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
    // The rest of the app (outfit selection, saving, wardrobe) never
    // depends on WebGL succeeding — only this viewer degrades, and it
    // degrades to the style reference photo rather than a dead end.
    return (
      <div className={cn("relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-surface-muted", className)}>
        {AVATAR_MANIFEST.styleReferenceImageUrl ? (
          <Image
            src={AVATAR_MANIFEST.styleReferenceImageUrl}
            alt="Style reference photo"
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            className="object-cover object-top opacity-90"
          />
        ) : null}
        <div className="absolute inset-x-3 bottom-3 flex flex-col items-center gap-1.5 rounded-xl bg-surface/90 p-3 text-center shadow-sm">
          <div className="flex items-center gap-1.5 text-warning">
            <AlertTriangle size={16} />
            <p className="text-xs font-medium text-foreground">3D preview isn&apos;t available on this device</p>
          </div>
          <p className="text-[11px] text-muted">
            Your browser doesn&apos;t support WebGL — showing the style reference photo instead. Try a recent version of
            Chrome, Safari, or Firefox for the interactive avatar.
          </p>
        </div>
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
        <div className="absolute inset-x-3 top-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="pointer-events-none max-w-full rounded-full bg-surface/90 px-3 py-1 text-center text-[11px] font-medium text-muted shadow-sm">
            Development placeholder — add avatar.glb to personalize
          </span>
          {AVATAR_MANIFEST.styleReferenceImageUrl && (
            <button
              onClick={() => setShowReference((v) => !v)}
              className="shrink-0 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm transition-colors hover:bg-surface"
              aria-pressed={showReference}
            >
              {showReference ? "Hide" : "Reference photo"}
            </button>
          )}
        </div>
      )}

      {avatarAvailable === false && showReference && AVATAR_MANIFEST.styleReferenceImageUrl && (
        <div className="absolute bottom-16 right-3 w-24 overflow-hidden rounded-lg border-2 border-surface shadow-lg sm:w-32">
          <Image
            src={AVATAR_MANIFEST.styleReferenceImageUrl}
            alt="Style reference photo — not the 3D model"
            width={128}
            height={192}
            className="h-auto w-full object-cover"
          />
          <span className="block bg-surface/95 px-1.5 py-0.5 text-center text-[9px] font-medium text-muted">Style reference</span>
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
