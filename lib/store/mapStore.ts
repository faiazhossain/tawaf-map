import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapViewState, MapControls } from "@/types/map";

interface MapStore extends MapViewState, MapControls {}

export const useMapStore = create<MapStore>()(
  persist(
    (set) => ({
      // Initial state centered on Makkah
      center: [39.8262, 21.4225],
      zoom: 15,
      bearing: 0,
      pitch: 0,
      style: "streets",

      // Actions
      setCenter: (center) => set({ center }),
      setZoom: (zoom) => set({ zoom }),
      setBearing: (bearing) => set({ bearing }),
      setPitch: (pitch) => set({ pitch }),
      setStyle: (style) => set({ style }),

      flyTo: (center, zoom = 15) =>
        set((state) => ({
          center,
          zoom: zoom !== undefined ? zoom : state.zoom,
        })),

      fitBounds: (bounds) => {
        const [[minLng, minLat], [maxLng, maxLat]] = bounds;
        const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
        set({ center });
      },
    }),
    {
      name: "map-storage",
      partialize: (state) => ({ style: state.style }),
    }
  )
);
