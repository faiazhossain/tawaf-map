import { useMemo } from "react";
import { useLocationStore, useHotelStore } from "@/lib/store";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import {
  haversineDistance,
  calculateBearing,
  formatDistance,
  estimateWalkingTime,
  formatWalkingTime,
} from "@/lib/utils/distance";

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
 * Hook for calculating proximity to nearby hotels
 *
 * @param maxDistance - Maximum distance to consider (in meters)
 * @param count - Maximum number of nearby hotels to return
 * @returns Object containing nearby hotels with distance info
 */
export function useHotelProximity(maxDistance = 1000, count = 10) {
  const { latitude, longitude } = useLocationStore();
  const { priceLevelFilter } = useHotelStore();

  const nearbyHotels = useMemo(() => {
    if (latitude === null || longitude === null) {
      return [];
    }

    const hotelsWithDistance = NEARBY_HOTELS.filter((hotel) => {
      // Filter by price level if set
      if (priceLevelFilter !== null && hotel.priceLevel !== priceLevelFilter) {
        return false;
      }
      return true;
    })
      .map((hotel) => {
        const distance = haversineDistance(
          latitude,
          longitude,
          hotel.location.coordinates[1],
          hotel.location.coordinates[0]
        );

        const bearing = calculateBearing(
          latitude,
          longitude,
          hotel.location.coordinates[1],
          hotel.location.coordinates[0]
        );

        return {
          hotel,
          distance,
          walkingTime: estimateWalkingTime(distance),
          distanceFormatted: formatDistance(distance),
          walkingTimeFormatted: formatWalkingTime(estimateWalkingTime(distance)),
          bearing,
          direction: getDirectionFromBearing(bearing),
        };
      })
      .filter((h) => h.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count);

    return hotelsWithDistance;
  }, [latitude, longitude, maxDistance, count, priceLevelFilter]);

  const nearestHotel = nearbyHotels[0] || null;

  return {
    nearbyHotels,
    nearestHotel,
    hasLocation: latitude !== null && longitude !== null,
    totalHotels: NEARBY_HOTELS.length,
  };
}
