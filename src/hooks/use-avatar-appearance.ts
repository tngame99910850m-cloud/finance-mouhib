"use client";

import { useCallback, useEffect, useState } from "react";
import { getRepository } from "@/lib/repository";
import type { AvatarAppearance } from "@/types/outfit";

export function useAvatarAppearance() {
  const [appearance, setAppearance] = useState<AvatarAppearance>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRepository()
      .getAvatarAppearance()
      .then((saved) => {
        if (saved) setAppearance(saved);
      })
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback(async (patch: Partial<AvatarAppearance>) => {
    setAppearance((prev) => {
      const next = { ...prev, ...patch };
      getRepository().saveAvatarAppearance(next);
      return next;
    });
  }, []);

  return { appearance, loading, update };
}
