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

  const locationStore = useLocationStore();
  const watchIdRef = useRef<number>();

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      locationStore.setError("Geolocation is not supported by this browser");
      locationStore.setPermission("unknown");
      return;
    }

    // Request permission and get initial location
    const startPosition = () => {
      locationStore.setLoading(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationStore.setLocation(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy
          );
          if (position.coords.heading !== null) {
            locationStore.setHeading(position.coords.heading);
          }
          if (position.coords.speed !== null) {
            locationStore.setSpeed(position.coords.speed);
          }
          locationStore.setPermission("granted");
          locationStore.setLoading(false);
        },
        (error) => {
          const errorMessage =
            {
              [GeolocationPositionError.PERMISSION_DENIED]: "Location permission denied",
              [GeolocationPositionError.POSITION_UNAVAILABLE]: "Location unavailable",
              [GeolocationPositionError.TIMEOUT]: "Location request timed out",
            }[error.code] || "Unknown location error";

          locationStore.setError(errorMessage);
          locationStore.setPermission(
            error.code === GeolocationPositionError.PERMISSION_DENIED ? "denied" : "prompt"
          );
          locationStore.setLoading(false);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    };

    startPosition();

    // Set up watch if requested
    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          locationStore.setLocation(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy
          );
          if (position.coords.heading !== null) {
            locationStore.setHeading(position.coords.heading);
          }
          if (position.coords.speed !== null) {
            locationStore.setSpeed(position.coords.speed);
          }
        },
        (error) => {
          const errorMessage =
            {
              [GeolocationPositionError.PERMISSION_DENIED]: "Location permission denied",
              [GeolocationPositionError.POSITION_UNAVAILABLE]: "Location unavailable",
              [GeolocationPositionError.TIMEOUT]: "Location request timed out",
            }[error.code] || "Unknown location error";

          locationStore.setError(errorMessage);
          locationStore.setPermission(
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
  }, [watch, enableHighAccuracy, timeout, maximumAge, locationStore]);

  return {
    latitude: locationStore.latitude,
    longitude: locationStore.longitude,
    accuracy: locationStore.accuracy,
    heading: locationStore.heading,
    speed: locationStore.speed,
    timestamp: locationStore.timestamp,
    error: locationStore.error,
    loading: locationStore.loading,
    permission: locationStore.permission,
    requestLocation: locationStore.requestLocation,
    clearLocation: locationStore.clearLocation,
  };
}
