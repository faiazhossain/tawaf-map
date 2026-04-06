import { useEffect, useRef } from "react";
import { useLocationStore } from "@/lib/store";

interface UseGeolocationOptions {
  watch?: boolean;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Custom hook for geolocation with automatic tracking
 *
 * @param options - Geolocation options
 * @returns Location state from store
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { watch = true, enableHighAccuracy = true, timeout = 10000, maximumAge = 5000 } = options;

  const watchIdRef = useRef<number>();

  useEffect(() => {
    // Get the store instance directly - this doesn't trigger re-renders
    const store = useLocationStore.getState();

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      store.setError("Geolocation is not supported by this browser");
      store.setPermission("unknown");
      return;
    }

    // Request permission and get initial location
    const startPosition = () => {
      store.setLoading(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          store.setLocation(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy
          );
          if (position.coords.heading !== null) {
            store.setHeading(position.coords.heading);
          }
          if (position.coords.speed !== null) {
            store.setSpeed(position.coords.speed);
          }
          store.setPermission("granted");
          store.setLoading(false);
        },
        (error) => {
          const errorMessage =
            {
              [GeolocationPositionError.PERMISSION_DENIED]: "Location permission denied",
              [GeolocationPositionError.POSITION_UNAVAILABLE]: "Location unavailable",
              [GeolocationPositionError.TIMEOUT]: "Location request timed out",
            }[error.code] || "Unknown location error";

          store.setError(errorMessage);
          store.setPermission(
            error.code === GeolocationPositionError.PERMISSION_DENIED ? "denied" : "prompt"
          );
          store.setLoading(false);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    };

    startPosition();

    // Set up watch if requested
    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          store.setLocation(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy
          );
          if (position.coords.heading !== null) {
            store.setHeading(position.coords.heading);
          }
          if (position.coords.speed !== null) {
            store.setSpeed(position.coords.speed);
          }
        },
        (error) => {
          const errorMessage =
            {
              [GeolocationPositionError.PERMISSION_DENIED]: "Location permission denied",
              [GeolocationPositionError.POSITION_UNAVAILABLE]: "Location unavailable",
              [GeolocationPositionError.TIMEOUT]: "Location request timed out",
            }[error.code] || "Unknown location error";

          store.setError(errorMessage);
          store.setPermission(
            error.code === GeolocationPositionError.PERMISSION_DENIED ? "denied" : "prompt"
          );
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    }

    // Cleanup
    return () => {
      if (watchIdRef.current !== undefined) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge]);

  // Get current state values using individual selectors
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const accuracy = useLocationStore((state) => state.accuracy);
  const heading = useLocationStore((state) => state.heading);
  const speed = useLocationStore((state) => state.speed);
  const timestamp = useLocationStore((state) => state.timestamp);
  const error = useLocationStore((state) => state.error);
  const loading = useLocationStore((state) => state.loading);
  const permission = useLocationStore((state) => state.permission);
  const requestLocation = useLocationStore((state) => state.requestLocation);
  const clearLocation = useLocationStore((state) => state.clearLocation);

  return {
    latitude,
    longitude,
    accuracy,
    heading,
    speed,
    timestamp,
    error,
    loading,
    permission,
    requestLocation,
    clearLocation,
  };
}
