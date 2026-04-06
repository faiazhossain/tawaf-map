import { useCallback, useState } from "react";
import { useRouteStore, useLocationStore } from "@/lib/store";
import type { Route, RouteStep } from "@/types/navigation";
import { haversineDistance, calculateBearing, estimateWalkingTime } from "@/lib/utils/distance";

interface RouteOptions {
  mode?: "walking" | "shortest" | "safest";
  avoidStairs?: boolean;
}

interface RoutingResult {
  route: Route | null;
  isCalculating: boolean;
  error: string | null;
  calculateRoute: (destination: [number, number], options?: RouteOptions) => Promise<void>;
  clearRoute: () => void;
}

// Create a simplified route between two points using waypoints
// In production, this would call an actual routing API like Barikoi
function createDirectRoute(
  origin: [number, number],
  destination: [number, number]
): { geometry: number[][]; distance: number } {
  const [fromLon, fromLat] = origin;
  const [toLon, toLat] = destination;

  // Calculate direct distance
  const distance = haversineDistance(fromLat, fromLon, toLat, toLon);

  // Create intermediate waypoints for a more realistic path
  // This simulates walking along city streets rather than a straight line
  const waypoints: number[][] = [];
  const numSegments = Math.max(3, Math.floor(distance / 100)); // Add a waypoint every 100m

  const latStep = (toLat - fromLat) / numSegments;
  const lonStep = (toLon - fromLon) / numSegments;

  // Add some "street-following" variation to the path
  for (let i = 0; i <= numSegments; i++) {
    const lat = fromLat + latStep * i;
    const lon = fromLon + lonStep * i;

    // Add slight variations to simulate street-following
    const variation = i > 0 && i < numSegments ? 0.0001 : 0;
    const offsetLon = Math.sin(i * 0.5) * variation;
    const offsetLat = Math.cos(i * 0.5) * variation;

    waypoints.push([lon + offsetLon, lat + offsetLat]);
  }

  // Ensure the destination is exact
  waypoints[waypoints.length - 1] = [toLon, toLat];

  return { geometry: waypoints, distance };
}

// Generate turn-by-turn instructions from route geometry
function generateRouteInstructions(geometry: number[][], distance: number): RouteStep[] {
  const steps: RouteStep[] = [];
  const totalDuration = estimateWalkingTime(distance);

  if (geometry.length < 2) {
    return steps;
  }

  // Initial step
  steps.push({
    instruction: "Head towards your destination",
    distance: distance,
    duration: totalDuration,
    maneuver: "depart",
  });

  // Add intermediate steps for turns (simulated based on direction changes)
  for (let i = 1; i < geometry.length - 1; i++) {
    const prev = geometry[i - 1];
    const current = geometry[i];
    const next = geometry[i + 1];

    const bearing1 = calculateBearing(prev[1], prev[0], current[1], current[0]);
    const bearing2 = calculateBearing(current[1], current[0], next[1], next[0]);
    const turnAngle = ((bearing2 - bearing1 + 540) % 360) - 180;

    // Only add steps for significant turns (>20 degrees)
    if (Math.abs(turnAngle) > 20) {
      const stepDistance = haversineDistance(current[1], current[0], next[1], next[0]);
      let maneuver = "straight";
      let instruction = "Continue straight";

      if (turnAngle > 80) {
        maneuver = "arrive";
        instruction = "Turn right";
      } else if (turnAngle < -80) {
        maneuver = "arrive";
        instruction = "Turn left";
      } else if (turnAngle > 20) {
        maneuver = "turn right";
        instruction = "Bear right";
      } else if (turnAngle < -20) {
        maneuver = "turn left";
        instruction = "Bear left";
      }

      steps.push({
        instruction,
        distance: stepDistance,
        duration: estimateWalkingTime(stepDistance),
        maneuver,
      });
    }
  }

  // Final step
  const lastPoint = geometry[geometry.length - 1];
  const secondLastPoint = geometry[geometry.length - 2];
  const finalDistance = haversineDistance(
    secondLastPoint[1],
    secondLastPoint[0],
    lastPoint[1],
    lastPoint[0]
  );

  steps.push({
    instruction: "Arrive at your destination",
    distance: finalDistance,
    duration: estimateWalkingTime(finalDistance),
    maneuver: "arrive",
  });

  return steps;
}

/**
 * Hook for calculating and managing walking routes
 */
export function useMapRouting(): RoutingResult {
  const { latitude, longitude } = useLocationStore();
  const { setRoute, setRouting, setRouteError, clearRoute: clearRouteStore } = useRouteStore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(
    async (destination: [number, number], options: RouteOptions = {}) => {
      if (latitude === null || longitude === null) {
        const errorMsg = "Location not available. Please enable location services.";
        setError(errorMsg);
        setRouteError(errorMsg);
        return;
      }

      setIsCalculating(true);
      setError(null);
      setRouteError(null);
      setRouting(true);

      try {
        const origin: [number, number] = [longitude, latitude];

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Generate route (in production, call Barikoi routing API here)
        const { geometry, distance } = createDirectRoute(origin, destination);
        const duration = estimateWalkingTime(distance);
        const steps = generateRouteInstructions(geometry, distance);

        const route: Route = {
          id: `route-${Date.now()}`,
          geometry,
          distance,
          duration,
          steps,
        };

        setCurrentRoute(route);
        setRoute(route);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to calculate route";
        setError(errorMsg);
        setRouteError(errorMsg);
      } finally {
        setIsCalculating(false);
        setRouting(false);
      }
    },
    [latitude, longitude, setRoute, setRouting, setRouteError]
  );

  const clearRoute = useCallback(() => {
    setCurrentRoute(null);
    setError(null);
    clearRouteStore();
  }, [clearRouteStore]);

  return {
    route: currentRoute,
    isCalculating,
    error,
    calculateRoute,
    clearRoute,
  };
}
