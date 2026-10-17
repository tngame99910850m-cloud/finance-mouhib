"use client";

import { useCallback, useEffect, useState } from "react";
import { getRepository } from "@/lib/repository";

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setFavoriteIds(await getRepository().getFavoriteItemIds());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from IndexedDB on mount
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (itemId: string) => {
      const isFav = favoriteIds.includes(itemId);
      await getRepository().setFavoriteItem(itemId, !isFav);
      await refresh();
    },
    [favoriteIds, refresh]
  );

  return { favoriteIds, loading, toggle, isFavorite: (id: string) => favoriteIds.includes(id) };
}
