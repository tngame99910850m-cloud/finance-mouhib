"use client";

import { create } from "zustand";
import type { CatalogItem, GarmentCategory } from "@/types/catalog";
import type { AvatarAppearance, OutfitSelection } from "@/types/outfit";
import { applySelection, checkCompatibility, clearSelection, randomizeOutfit, removeCategory } from "@/lib/outfit-engine";
import { CATALOG } from "@/data/catalog";

interface HistoryEntry {
  selection: OutfitSelection;
  avatarAppearance: AvatarAppearance;
}

interface OutfitStoreState {
  selection: OutfitSelection;
  avatarAppearance: AvatarAppearance;
  outfitName: string;
  /** Non-null while loaded from a saved outfit, so Studio can show "editing <name>". */
  loadedOutfitId: string | null;
  lastError: string | null;

  past: HistoryEntry[];
  future: HistoryEntry[];

  selectItem: (item: CatalogItem, colorId?: string) => void;
  setColor: (category: GarmentCategory, colorId: string) => void;
  removeItem: (category: GarmentCategory) => void;
  reset: () => void;
  randomize: () => void;
  setOutfitName: (name: string) => void;
  setAvatarAppearance: (appearance: Partial<AvatarAppearance>) => void;
  loadOutfit: (selection: OutfitSelection, appearance: AvatarAppearance, name: string, id: string) => void;
  startNewOutfit: () => void;
  undo: () => void;
  redo: () => void;
  clearError: () => void;
}

function snapshot(state: OutfitStoreState): HistoryEntry {
  return { selection: state.selection, avatarAppearance: state.avatarAppearance };
}

export const useOutfitStore = create<OutfitStoreState>((set, get) => ({
  selection: {},
  avatarAppearance: {},
  outfitName: "New Look",
  loadedOutfitId: null,
  lastError: null,
  past: [],
  future: [],

  selectItem: (item, colorId) => {
    const state = get();
    const defaultColorId = colorId ?? state.selection[item.category]?.colorId ?? item.colors[0]?.id;
    const compat = checkCompatibility(state.selection, item, CATALOG);
    if (!compat.ok) {
      set({ lastError: compat.reason ?? "That combination isn't supported." });
      return;
    }
    const { selection } = applySelection(state.selection, item, defaultColorId, CATALOG);
    set({
      past: [...state.past, snapshot(state)],
      future: [],
      selection,
      lastError: null,
    });
  },

  setColor: (category, colorId) => {
    const state = get();
    const slot = state.selection[category];
    if (!slot) return;
    set({
      past: [...state.past, snapshot(state)],
      future: [],
      selection: { ...state.selection, [category]: { ...slot, colorId } },
    });
  },

  removeItem: (category) => {
    const state = get();
    set({
      past: [...state.past, snapshot(state)],
      future: [],
      selection: removeCategory(state.selection, category),
    });
  },

  reset: () => {
    const state = get();
    set({
      past: [...state.past, snapshot(state)],
      future: [],
      selection: clearSelection(),
      avatarAppearance: {},
      outfitName: "New Look",
      loadedOutfitId: null,
    });
  },

  randomize: () => {
    const state = get();
    set({
      past: [...state.past, snapshot(state)],
      future: [],
      selection: randomizeOutfit(CATALOG),
    });
  },

  setOutfitName: (name) => set({ outfitName: name }),

  setAvatarAppearance: (appearance) => {
    const state = get();
    set({
      past: [...state.past, snapshot(state)],
      future: [],
      avatarAppearance: { ...state.avatarAppearance, ...appearance },
    });
  },

  loadOutfit: (selection, appearance, name, id) =>
    set({
      selection,
      avatarAppearance: appearance,
      outfitName: name,
      loadedOutfitId: id,
      past: [],
      future: [],
      lastError: null,
    }),

  startNewOutfit: () =>
    set({
      selection: {},
      avatarAppearance: {},
      outfitName: "New Look",
      loadedOutfitId: null,
      past: [],
      future: [],
      lastError: null,
    }),

  undo: () => {
    const state = get();
    const previous = state.past[state.past.length - 1];
    if (!previous) return;
    set({
      past: state.past.slice(0, -1),
      future: [snapshot(state), ...state.future],
      selection: previous.selection,
      avatarAppearance: previous.avatarAppearance,
    });
  },

  redo: () => {
    const state = get();
    const next = state.future[0];
    if (!next) return;
    set({
      past: [...state.past, snapshot(state)],
      future: state.future.slice(1),
      selection: next.selection,
      avatarAppearance: next.avatarAppearance,
    });
  },

  clearError: () => set({ lastError: null }),
}));
