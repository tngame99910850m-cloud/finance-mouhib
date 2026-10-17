"use client";

import { useCallback, useEffect, useState } from "react";
import { getRepository } from "@/lib/repository";
import type { SavedOutfit, OutfitSelection, AvatarAppearance } from "@/types/outfit";
import type { Occasion, StyleTag } from "@/types/catalog";

function makeId() {
  return `outfit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useSavedOutfits() {
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getRepository().listOutfits();
      setOutfits(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from IndexedDB on mount
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: {
      id?: string;
      name: string;
      selection: OutfitSelection;
      avatarAppearance: AvatarAppearance;
      occasion?: Occasion;
      styleTags: StyleTag[];
      notes?: string;
    }) => {
      const now = new Date().toISOString();
      const existing = input.id ? await getRepository().getOutfit(input.id) : undefined;
      const outfit: SavedOutfit = {
        id: input.id ?? makeId(),
        name: input.name,
        selection: input.selection,
        avatarAppearance: input.avatarAppearance,
        occasion: input.occasion,
        styleTags: input.styleTags,
        notes: input.notes,
        isFavorite: existing?.isFavorite ?? false,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      await getRepository().saveOutfit(outfit);
      await refresh();
      return outfit;
    },
    [refresh]
  );

  const duplicate = useCallback(
    async (id: string) => {
      const original = await getRepository().getOutfit(id);
      if (!original) return undefined;
      const now = new Date().toISOString();
      const copy: SavedOutfit = { ...original, id: makeId(), name: `${original.name} (copy)`, createdAt: now, updatedAt: now };
      await getRepository().saveOutfit(copy);
      await refresh();
      return copy;
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await getRepository().deleteOutfit(id);
      await refresh();
    },
    [refresh]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const outfit = await getRepository().getOutfit(id);
      if (!outfit) return;
      await getRepository().saveOutfit({ ...outfit, isFavorite: !outfit.isFavorite, updatedAt: new Date().toISOString() });
      await refresh();
    },
    [refresh]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const outfit = await getRepository().getOutfit(id);
      if (!outfit) return;
      await getRepository().saveOutfit({ ...outfit, name, updatedAt: new Date().toISOString() });
      await refresh();
    },
    [refresh]
  );

  return { outfits, loading, refresh, save, duplicate, remove, toggleFavorite, rename };
}
