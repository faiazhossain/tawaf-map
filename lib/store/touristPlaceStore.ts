import { create } from "zustand";
import type {
  TouristPlace,
  TouristPlaceFilters,
  SelectedTouristPlace,
  City,
  TouristPlaceCategory,
} from "@/types/tourist-place";

interface TouristPlaceStore {
  // State
  selectedPlace: SelectedTouristPlace;
  allPlaces: typeof import("@/lib/data/tourist-places").TOURIST_PLACES;
  filteredPlaces: typeof import("@/lib/data/tourist-places").TOURIST_PLACES;
  filters: TouristPlaceFilters;
  showPlacesOnMap: boolean;
  activeCity: City | null;

  // Actions
  setPlace: (place: TouristPlace | null) => void;
  setPlaceDistance: (distance: number, walkingTime: number) => void;
  setPlaceRoute: (
    route: { coordinates: [number, number][]; distance: number; duration: number } | null
  ) => void;
  clearPlace: () => void;

  // Filter actions
  setFilters: (filters: Partial<TouristPlaceFilters>) => void;
  resetFilters: () => void;
  filterByCity: (city: City | null) => void;
  filterByCategory: (category: TouristPlaceCategory | null) => void;
  toggleShowOnMap: () => void;
  setShowOnMap: (show: boolean) => void;

  // Search
  setSearchQuery: (query: string) => void;
}

const defaultFilters: TouristPlaceFilters = {
  categories: [],
  cities: [],
  showPopularOnly: false,
  maxDistance: undefined,
  searchQuery: "",
};

export const useTouristPlaceStore = create<TouristPlaceStore>((set, get) => ({
  // Initial state
  selectedPlace: {
    place: null,
    distance: null,
    walkingTime: null,
    route: null,
  },
  allPlaces: [], // Will be loaded from data
  filteredPlaces: [],
  filters: defaultFilters,
  showPlacesOnMap: false,
  activeCity: null,

  // Actions
  setPlace: (place) =>
    set((state) => ({
      selectedPlace: {
        ...state.selectedPlace,
        place,
        distance: place ? state.selectedPlace.distance : null,
        walkingTime: place ? state.selectedPlace.walkingTime : null,
        route: null,
      },
    })),

  setPlaceDistance: (distance, walkingTime) =>
    set((state) => ({
      selectedPlace: {
        ...state.selectedPlace,
        distance,
        walkingTime,
      },
    })),

  setPlaceRoute: (route) =>
    set((state) => ({
      selectedPlace: {
        ...state.selectedPlace,
        route,
      },
    })),

  clearPlace: () =>
    set({
      selectedPlace: {
        place: null,
        distance: null,
        walkingTime: null,
        route: null,
      },
    }),

  // Filter actions
  setFilters: (newFilters) =>
    set((state) => {
      const updatedFilters = { ...state.filters, ...newFilters };
      const filtered = applyFilters(state.allPlaces, updatedFilters, state.activeCity);
      return {
        filters: updatedFilters,
        filteredPlaces: filtered,
      };
    }),

  resetFilters: () =>
    set({
      filters: defaultFilters,
      filteredPlaces: get().allPlaces,
    }),

  filterByCity: (city) =>
    set((state) => {
      const updatedFilters = { ...state.filters, cities: city ? [city] : [] };
      const filtered = applyFilters(state.allPlaces, updatedFilters, city);
      return {
        filters: updatedFilters,
        activeCity: city,
        filteredPlaces: filtered,
      };
    }),

  filterByCategory: (category) =>
    set((state) => {
      const updatedFilters = {
        ...state.filters,
        categories: category ? [category] : [],
      };
      const filtered = applyFilters(state.allPlaces, updatedFilters, state.activeCity);
      return {
        filters: updatedFilters,
        filteredPlaces: filtered,
      };
    }),

  toggleShowOnMap: () => set((state) => ({ showPlacesOnMap: !state.showPlacesOnMap })),

  setShowOnMap: (show) => set({ showPlacesOnMap: show }),

  setSearchQuery: (query) =>
    set((state) => {
      const updatedFilters = { ...state.filters, searchQuery: query };
      const filtered = applyFilters(state.allPlaces, updatedFilters, state.activeCity);
      return {
        filters: updatedFilters,
        filteredPlaces: filtered,
      };
    }),
}));

// Helper function to apply filters
function applyFilters(
  places: typeof import("@/lib/data/tourist-places").TOURIST_PLACES,
  filters: TouristPlaceFilters,
  activeCity: City | null
) {
  let filtered = [...places];

  // Filter by city
  if (activeCity) {
    filtered = filtered.filter((place) => place.city === activeCity);
  } else if (filters.cities.length > 0) {
    filtered = filtered.filter((place) => filters.cities.includes(place.city));
  }

  // Filter by categories
  if (filters.categories.length > 0) {
    filtered = filtered.filter((place) => filters.categories.includes(place.category));
  }

  // Filter popular only
  if (filters.showPopularOnly) {
    filtered = filtered.filter((place) => place.popular);
  }

  // Filter by distance
  if (filters.maxDistance !== undefined) {
    // This would need user location - for now just check distanceFromHaram
    filtered = filtered.filter((place) => {
      if (place.distanceFromHaram === undefined) return true;
      return place.distanceFromHaram <= filters.maxDistance!;
    });
  }

  // Search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (place) =>
        place.name.toLowerCase().includes(query) ||
        place.nameAr.includes(query) ||
        place.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        place.description.short.toLowerCase().includes(query)
    );
  }

  return filtered;
}
