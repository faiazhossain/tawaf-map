import { create } from "zustand";
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

    if (!navigator.geolocation) {
      set({ error: "Geolocation is not supported by this browser", loading: false });
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        });
      });

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
      const errorMessage =
        error instanceof GeolocationPositionError
          ? {
              [GeolocationPositionError.PERMISSION_DENIED]: "Location permission denied",
              [GeolocationPositionError.POSITION_UNAVAILABLE]: "Location unavailable",
              [GeolocationPositionError.TIMEOUT]: "Location request timed out",
            }[error.code] || "Unknown location error"
          : "Failed to get location";

      set({
        error: errorMessage,
        loading: false,
        permission:
          error instanceof GeolocationPositionError && error.code === 1 ? "denied" : "prompt",
      });
    }
  },
}));
