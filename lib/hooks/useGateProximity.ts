import { useMemo } from "react";
import { useLocationStore } from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import {
  haversineDistance,
  calculateBearing,
  formatDistance,
  estimateWalkingTime,
  formatWalkingTime,
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
 * Get compass direction from bearing
 */
function getDirectionFromBearing(bearing: number): string {
  const directions = [
    { label: "N", min: 352.5, max: 7.5 },
    { label: "NE", min: 22.5, max: 67.5 },
    { label: "E", min: 67.5, max: 112.5 },
    { label: "SE", min: 112.5, max: 157.5 },
    { label: "S", min: 157.5, max: 202.5 },
    { label: "SW", min: 202.5, max: 247.5 },
    { label: "W", min: 247.5, max: 292.5 },
    { label: "NW", min: 292.5, max: 337.5 },
  ];

  for (const direction of directions) {
    if (bearing >= direction.min && bearing < direction.max) {
      return direction.label;
    }
    if (direction.min > direction.max && (bearing >= direction.min || bearing < direction.max)) {
      return direction.label;
    }
  }
  return "N";
}

/**
 * Hook for calculating proximity to Haram gates
 *
 * @param maxDistance - Maximum distance to consider (in meters)
 * @param count - Maximum number of nearby gates to return
 * @returns Array of nearby gates with distance and direction info
 */
export function useGateProximity(maxDistance = 2000, count = 5) {
  const { latitude, longitude } = useLocationStore();

  const nearbyGates = useMemo((): GateProximity[] => {
    if (latitude === null || longitude === null) {
      return [];
    }

    const gatesWithDistance = HARAM_GATES.map((gate) => {
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
          type: gate.type,
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
