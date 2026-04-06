import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { POI, POIFilters } from "@/types/poi";

interface POIStore {
  pois: POI[];
  selectedPOI: POI | null;
  filters: POIFilters;
  isLoading: boolean;
  error: string | null;
  setPOIs: (pois: POI[]) => void;
  setSelectedPOI: (poi: POI | null) => void;
  setFilters: (filters: Partial<POIFilters>) => void;
  resetFilters: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialFilters: POIFilters = {
  categories: [],
  cuisineTypes: [],
  priceLevels: [1, 2, 3, 4],
  halalOnly: true,
  prayerFriendlyOnly: false,
  maxDistance: 1000,
  searchQuery: "",
};

export const usePOIStore = create<POIStore>()(
  persist(
    (set) => ({
      pois: [],
      selectedPOI: null,
      filters: initialFilters,
      isLoading: false,
      error: null,

      setPOIs: (pois) => set({ pois }),
      setSelectedPOI: (selectedPOI) => set({ selectedPOI }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      resetFilters: () => set({ filters: initialFilters }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: "poi-storage",
      partialize: (state) => ({ filters: state.filters }),
    }
  )
);
