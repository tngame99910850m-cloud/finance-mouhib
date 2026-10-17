"use client";

import Image from "next/image";
import { AvatarViewerLazy } from "@/components/3d/avatar-viewer-lazy";
import { Card, CardHeader } from "@/components/ui/ui";
import { useAvatarAppearance } from "@/hooks/use-avatar-appearance";
import { AVATAR_MANIFEST } from "@/data/asset-manifest";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function AvatarPage() {
  const { appearance, update, loading } = useAvatarAppearance();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Your Avatar</h1>
        <p className="text-sm text-muted">{AVATAR_MANIFEST.avatarName}</p>
      </div>

      <Card className="p-0">
        <div className="h-80 w-full sm:h-[28rem]">
          <AvatarViewerLazy appearance={appearance} className="h-full w-full rounded-2xl" />
        </div>
      </Card>

      {!loading && (
        <Card>
          <CardHeader title="Hair color" subtitle="Changes apply instantly and are saved automatically" />
          <div className="flex flex-wrap gap-2">
            {AVATAR_MANIFEST.hairColors.map((color) => {
              const active = appearance.hairColorId === color.id;
              return (
                <button
                  key={color.id}
                  onClick={() => update({ hairColorId: color.id })}
                  className={cn(
                    "flex items-center gap-2 rounded-full border-2 py-1.5 pl-1.5 pr-3 transition-colors",
                    active ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: color.swatch }}>
                    {active && <Check size={12} className="text-white drop-shadow" />}
                  </span>
                  <span className="text-xs font-medium text-foreground">{color.name}</span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {AVATAR_MANIFEST.hairstyles.length === 0 && AVATAR_MANIFEST.skinVariants.length === 0 && (
        <Card>
          <p className="text-sm text-muted">
            Hairstyle and skin-tone variants will appear here once their 3D assets are added to the catalog — see{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">docs/3d-asset-pipeline.md</code>.
          </p>
        </Card>
      )}

      {AVATAR_MANIFEST.styleReferenceImageUrl && (
        <Card>
          <CardHeader
            title="Style reference"
            subtitle="A photo, not a 3D model — guidance for the custom avatar.glb that will replace the placeholder above"
          />
          <div className="flex gap-3">
            <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
              <Image
                src={AVATAR_MANIFEST.styleReferenceImageUrl}
                alt="Style reference photo for the custom avatar"
                fill
                sizes="112px"
                className="object-cover object-top"
              />
            </div>
            <p className="text-xs text-muted">
              This photo sets the pose, proportions, and styling to match when exporting the real avatar in Blender. It is
              never rendered as the 3D model itself — see <code className="rounded bg-surface-muted px-1 py-0.5">docs/3d-asset-pipeline.md</code> for the
              export checklist, then drop the finished file at{" "}
              <code className="rounded bg-surface-muted px-1 py-0.5">public{AVATAR_MANIFEST.modelUrl}</code>.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
