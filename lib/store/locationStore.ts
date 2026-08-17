import { create } from "zustand";
import {
  describeGeolocationError,
  getCurrentPositionWithFallback,
  type LocateFailure,
} from "@/lib/utils/geolocation";
import type { LocationState, LocationActions } from "@/types/navigation";

interface LocationStore extends LocationState, LocationActions {}

export const useLocationStore = create<LocationStore>((set, get) => ({
  // Initial state
  latitude: null,
  longitude: null,
  accuracy: null,
  heading: null,
  speed: null,
  timestamp: null,
  error: null,
  loading: false,
  permission: "unknown",

  // Actions
  setLocation: (lat, lon, accuracy = 10) =>
    set({
      latitude: lat,
      longitude: lon,
      accuracy,
      timestamp: Date.now(),
      error: null,
    }),

  setHeading: (heading) => set({ heading }),
  setSpeed: (speed) => set({ speed }),
  setError: (error) => set({ error, loading: false }),
  setLoading: (loading) => set({ loading }),
  setPermission: (permission) => set({ permission }),

  clearLocation: () =>
    set({
      latitude: null,
      longitude: null,
      accuracy: null,
      heading: null,
      speed: null,
      timestamp: null,
      error: null,
    }),

  requestLocation: async () => {
    set({ loading: true, error: null });

    try {
      // GPS first with a coarse network fallback, so indoor devices still
      // get a first fix; rejects with a LocateFailure (see lib/utils/geolocation.ts).
      const position = await getCurrentPositionWithFallback();

      set({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        permission: "granted",
        loading: false,
        error: null,
      });
    } catch (error) {
      // The helper always rejects with a LocateFailure; guard the type anyway
      // so an unexpected rejection cannot set a blank error message.
      const failure: LocateFailure =
        error !== null && typeof error === "object" && "message" in error
          ? (error as LocateFailure)
          : describeGeolocationError(error);
      set({
        error: failure.message,
        loading: false,
        permission: failure.permission,
      });
    }
  },
}));
