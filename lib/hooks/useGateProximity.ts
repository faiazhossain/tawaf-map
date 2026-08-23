import { useMemo } from "react";
import { useLocationStore } from "@/lib/store";
import { getActiveGates } from "@/lib/gates/active";
import {
  haversineDistance,
  calculateBearing,
  formatDistance,
  estimateWalkingTime,
  formatWalkingTime,
  getDirectionFromBearing,
} from "@/lib/utils/distance";

interface GateProximity {
  gate: {
    id: string;
    name: string;
    nameAr: string;
    type: string;
  };
  distance: number;
  distanceFormatted: string;
  bearing: number;
  bearingFormatted: string;
  walkingTime: number;
  walkingTimeFormatted: string;
  direction: string;
}

/**
 * Hook for calculating proximity to Haram gates
 *
 * @param maxDistance - Maximum distance to consider (in meters)
 * @param count - Maximum number of nearby gates to return
 * @returns Array of nearby gates with distance and direction info
 */
export function useGateProximity(maxDistance = 2000, count = 5) {
  // Individual selectors: the location store also receives heading/speed
  // writes on every GPS fix, and a whole-store subscription re-rendered every
  // consumer (including the map page) for changes this hook never reads.
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);

  const nearbyGates = useMemo((): GateProximity[] => {
    if (latitude === null || longitude === null) {
      return [];
    }

    const gatesWithDistance = getActiveGates()
      .map((gate) => {
        const distance = haversineDistance(
          latitude,
          longitude,
          gate.location.coordinates[1],
          gate.location.coordinates[0]
        );

        const bearing = calculateBearing(
          latitude,
          longitude,
          gate.location.coordinates[1],
          gate.location.coordinates[0]
        );

        return {
          gate: {
            id: gate.id,
            name: gate.name,
            nameAr: gate.nameAr,
            type: gate.type ?? "umrah",
          },
          distance,
          distanceFormatted: formatDistance(distance),
          bearing,
          bearingFormatted: `${Math.round(bearing)}°`,
          walkingTime: estimateWalkingTime(distance),
          walkingTimeFormatted: formatWalkingTime(estimateWalkingTime(distance)),
          direction: getDirectionFromBearing(bearing),
        };
      })
      .filter((g) => g.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count);

    return gatesWithDistance;
  }, [latitude, longitude, maxDistance, count]);

  const nearestGate = nearbyGates[0] || null;

  return {
    nearbyGates,
    nearestGate,
    hasLocation: latitude !== null && longitude !== null,
  };
}
