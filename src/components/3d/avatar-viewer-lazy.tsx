"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/ui";

/** Lazy-loaded entry point for the 3D viewer — keeps three.js and
 * @react-three/fiber out of the initial JS bundle for pages that don't
 * need them (wardrobe, saved, settings). */
export const AvatarViewerLazy = dynamic(() => import("./avatar-viewer").then((m) => m.AvatarViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-56 w-full items-center justify-center rounded-2xl bg-surface-muted">
      <Spinner />
    </div>
  ),
});
