import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NearbyCategory, NearbyItem } from "@/types/nearby";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";

/**
 * "আমার কাছে" ফিচারের UI-অবস্থা।
 *
 * স্থায়ী অংশ (persist): radius/enabledCategories/halalOnly — ব্যবহারকারীর পছন্দ।
 * ক্ষণস্থায়ী: সক্রিয় বিভাগ, তালিকার অবস্থা, নির্বাচন — প্রতি সেশনে নতুন শুরু।
 *
 * নির্বাচন পুরো NearbyItem স্ন্যাপশট হিসেবে থাকে (শুধু id নয়) — ডিটেইল খোলা
 * থাকাকালীন চলাচলে/ব্যাসার্ধ বদলে আইটেম তালিকা ছাড়লেও শিট অক্ষত থাকে।
 */

export const NEARBY_RADIUS_MIN = 250;
export const NEARBY_RADIUS_MAX = 3000;
export const NEARBY_RADIUS_STEP = 50;
export const NEARBY_RADIUS_DEFAULT = 1000;
export const NEARBY_RADIUS_PRESETS = [250, 500, 1000, 2000, 3000] as const;

export type NearbyListMode = "cards" | "expanded";

interface NearbyStore {
  // স্থায়ী (persist)
  radius: number;
  enabledCategories: NearbyCategory[];
  halalOnly: boolean;
  // ক্ষণস্থায়ী
  activeCategory: NearbyCategory | null;
  listMode: NearbyListMode;
  selectedItem: NearbyItem | null;
  detailModalOpen: boolean;
  settingsOpen: boolean;

  setRadius: (meters: number) => void;
  stepRadius: (deltaMeters: number) => void;
  toggleEnabledCategory: (category: NearbyCategory) => void;
  setHalalOnly: (value: boolean) => void;

  /** চিপ-ট্যাপ: একই বিভাগ টগল-অফ, নতুন বিভাগ সক্রিয় + তালিকা/নির্বাচন রিসেট */
  setActiveCategory: (category: NearbyCategory | null) => void;
  expandList: () => void;
  collapseList: () => void;
  /** আইটেম নির্বাচন — প্রসারিত তালিকা বন্ধ হয়ে ডিটেইল শিট খোলে */
  selectItem: (item: NearbyItem) => void;
  clearSelection: () => void;
  openDetailModal: () => void;
  closeDetailModal: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

function clampRadius(meters: number): number {
  return Math.min(NEARBY_RADIUS_MAX, Math.max(NEARBY_RADIUS_MIN, meters));
}

export const useNearbyStore = create<NearbyStore>()(
  persist(
    (set) => ({
      radius: NEARBY_RADIUS_DEFAULT,
      enabledCategories: DEFAULT_ENABLED_CATEGORIES,
      halalOnly: true,

      activeCategory: null,
      listMode: "cards",
      selectedItem: null,
      detailModalOpen: false,
      settingsOpen: false,

      setRadius: (meters) => set({ radius: clampRadius(meters) }),
      stepRadius: (deltaMeters) =>
        set((state) => ({ radius: clampRadius(state.radius + deltaMeters) })),

      toggleEnabledCategory: (category) =>
        set((state) => {
          const isEnabled = state.enabledCategories.includes(category);
          const next = isEnabled
            ? state.enabledCategories.filter((c) => c !== category)
            : [...state.enabledCategories, category];
          // সক্রিয় বিভাগ বন্ধ করা হলে সেটিও নিভে যায়
          const activeCategory =
            isEnabled && state.activeCategory === category ? null : state.activeCategory;
          return {
            enabledCategories: next,
            activeCategory,
            listMode: activeCategory === null ? "cards" : state.listMode,
            selectedItem: activeCategory === null ? null : state.selectedItem,
          };
        }),

      setHalalOnly: (value) => set({ halalOnly: value }),

      setActiveCategory: (category) =>
        set((state) => {
          if (category === null || category === state.activeCategory) {
            return {
              activeCategory: null,
              listMode: "cards",
              selectedItem: null,
              detailModalOpen: false,
            };
          }
          return {
            activeCategory: category,
            listMode: "cards",
            selectedItem: null,
            detailModalOpen: false,
            settingsOpen: state.settingsOpen,
          };
        }),

      expandList: () => set({ listMode: "expanded" }),
      collapseList: () => set({ listMode: "cards" }),

      selectItem: (item) =>
        set({
          selectedItem: item,
          listMode: "cards",
          detailModalOpen: false,
        }),

      clearSelection: () => set({ selectedItem: null, detailModalOpen: false }),

      openDetailModal: () => set({ detailModalOpen: true }),
      closeDetailModal: () => set({ detailModalOpen: false }),

      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
    }),
    {
      name: "tawaf:nearby-settings",
      partialize: (state) => ({
        radius: state.radius,
        enabledCategories: state.enabledCategories,
        halalOnly: state.halalOnly,
      }),
    }
  )
);
