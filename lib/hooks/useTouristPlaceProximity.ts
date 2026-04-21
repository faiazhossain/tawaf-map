"use client";

import { useEffect } from "react";
import { useLocationStore, useTouristPlaceStore } from "@/lib/store";
import { TOURIST_PLACES, getNearbyTouristPlaces } from "@/lib/data/tourist-places";

/**
 * Hook to calculate distances from user location to tourist places
 * Updates the tourist place store with sorted nearby places
 */
export function useTouristPlaceProximity(maxDistanceKm: number = 10) {
  const { latitude, longitude } = useLocationStore();
  const { setPlace, setPlaceDistance } = useTouristPlaceStore();

  useEffect(() => {
    if (latitude === null || longitude === null) {
      return;
    }

    // Calculate distances to all tourist places
    const placesWithDistance = TOURIST_PLACES.map((place) => {
      const distance = calculateDistance([longitude, latitude], place.location.coordinates);

      return {
        place,
        distance,
        walkingTime: estimateWalkingTime(distance),
      };
    })
      .filter(({ distance }) => distance <= maxDistanceKm * 1000)
      .sort((a, b) => a.distance - b.distance);

    // Update store with nearby places
    // Store only provides single selected place, so we don't need to update bulk list here
    // The nearby calculation can be done on-demand
  }, [latitude, longitude, maxDistanceKm, setPlace, setPlaceDistance]);

  /**
   * Calculate distance from user coordinates to a place
   */
  function calculateDistance(userCoords: [number, number], placeCoords: [number, number]): number {
    const R = 6371000; // Earth's radius in meters
    const [lon1, lat1] = userCoords;
    const [lon2, lat2] = placeCoords;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Estimate walking time based on distance (average 5 km/h walking speed)
   */
  function estimateWalkingTime(distanceMeters: number): number {
    const walkingSpeedMetersPerMinute = 83.33; // ~5 km/h
    return Math.ceil(distanceMeters / walkingSpeedMetersPerMinute);
  }

  /**
   * Get nearby tourist places
   */
  function getNearby(userLat: number, userLon: number, radiusKm: number = maxDistanceKm) {
    return getNearbyTouristPlaces([userLon, userLat], radiusKm);
  }

  return {
    getNearby,
    calculateDistance,
    estimateWalkingTime,
  };
}

/**
 * Hook to get tourist places sorted by proximity to Haram
 */
export function useTouristPlacesByHaram(maxDistanceKm: number = 10) {
  const HARAM_COORDS: [number, number] = [39.8262, 21.4225]; // Makkah Haram

  const nearbyFromMakkah = getNearbyTouristPlaces(HARAM_COORDS, maxDistanceKm)
    .filter(({ place }) => place.city === "makkah")
    .sort((a, b) => a.distance - b.distance);

  return nearbyFromMakkah;
}

/**
 * Hook to get tourist places by city
 */
export function useTouristPlacesByCity(city: "makkah" | "madinah") {
  return TOURIST_PLACES.filter((place) => place.city === city);
}

/**
 * Hook to get popular tourist places
 */
export function usePopularTouristPlaces(limit: number = 10) {
  return TOURIST_PLACES.filter((place) => place.popular).slice(0, limit);
}
