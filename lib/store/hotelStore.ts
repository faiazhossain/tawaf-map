import { create } from "zustand";
import type { Hotel, HotelProximity } from "@/types/hotel";

interface HotelStore {
  hotels: Hotel[];
  nearbyHotels: HotelProximity[];
  selectedHotel: Hotel | null;
  showHotelsOnMap: boolean;
  priceLevelFilter: number | null; // null = show all
  setHotels: (hotels: Hotel[]) => void;
  setNearbyHotels: (hotels: HotelProximity[]) => void;
  setSelectedHotel: (hotel: Hotel | null) => void;
  setShowHotelsOnMap: (show: boolean) => void;
  setPriceLevelFilter: (level: number | null) => void;
  clearSelectedHotel: () => void;
}

export const useHotelStore = create<HotelStore>((set) => ({
  hotels: [],
  nearbyHotels: [],
  selectedHotel: null,
  showHotelsOnMap: false,
  priceLevelFilter: null,

  setHotels: (hotels) => set({ hotels }),
  setNearbyHotels: (nearbyHotels) => set({ nearbyHotels }),
  setSelectedHotel: (selectedHotel) => set({ selectedHotel }),
  setShowHotelsOnMap: (showHotelsOnMap) => set({ showHotelsOnMap }),
  setPriceLevelFilter: (priceLevelFilter) => set({ priceLevelFilter }),

  clearSelectedHotel: () =>
    set({
      selectedHotel: null,
    }),
}));
