import { useEffect, useRef } from "react";
import { useLocationStore } from "@/lib/store";
import {
  GPS_TIMEOUT_MS,
  MAXIMUM_AGE_MS,
  describeGeolocationError,
  getCurrentPositionWithFallback,
  unsupportedFailure,
  type LocateFailure,
} from "@/lib/utils/geolocation";

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
  const {
    watch = true,
    enableHighAccuracy = true,
    timeout = GPS_TIMEOUT_MS,
    maximumAge = MAXIMUM_AGE_MS,
  } = options;

  const watchIdRef = useRef<number>();

  useEffect(() => {
    // Get the store instance directly - this doesn't trigger re-renders
    const store = useLocationStore.getState();

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      const failure = unsupportedFailure();
      store.setError(failure.message);
      store.setPermission(failure.permission);
      return;
    }

    // Request permission and get initial location. GPS first, with a coarse
    // network fallback so indoor devices still get a first fix (see
    // lib/utils/geolocation.ts).
    const startPosition = async () => {
      store.setLoading(true);

      try {
        const position = await getCurrentPositionWithFallback({ timeout, maximumAge });
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
      } catch (error) {
        // The helper always rejects with a LocateFailure; guard the type anyway.
        const failure: LocateFailure =
          error !== null && typeof error === "object" && "message" in error
            ? (error as LocateFailure)
            : describeGeolocationError(error);
        store.setError(failure.message);
        store.setPermission(failure.permission);
      }
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
          const failure = describeGeolocationError(error);
          store.setError(failure.message);
          store.setPermission(failure.permission);
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
