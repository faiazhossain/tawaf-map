import { useCallback, useState } from "react";
import { useRouteStore, useLocationStore } from "@/lib/store";
import { fetchWalkingRoute } from "@/lib/routing/fetchRoute";
import type { Route } from "@/types/navigation";

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

/**
 * হেঁটে চলার রুট হিসাব ও ব্যবস্থাপনা — নিজের /api/directions (Barikoi v2,
 * foot প্রোফাইল) প্রক্সিকে ডাকে (`fetchWalkingRoute`)। জ্যামিতি [lon, lat]
 * জোড়ায় (MapLibre GeoJSON ক্রম) ও প্রতিটি ধাপ স্থানীয় বাংলা
 * নির্দেশনাসহ আসে। লাইভ নেভিগেশন/রিয়ারাউট দেখুন `useNavigation`।
 */
export function useMapRouting(): RoutingResult {
  const { latitude, longitude } = useLocationStore();
  const { setRoute, setRouting, setRouteError, clearRoute: clearRouteStore } = useRouteStore();

  const [isCalculating, setIsCalculating] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = useCallback(
    async (destination: [number, number], options: RouteOptions = {}) => {
      void options;
      if (latitude === null || longitude === null) {
        const errorMsg = "লোকেশন পাওয়া যায়নি — লোকেশন সার্ভিস চালু করুন।";
        setError(errorMsg);
        setRouteError(errorMsg);
        return;
      }

      setIsCalculating(true);
      setError(null);
      setRouteError(null);
      setRouting(true);

      try {
        const route = await fetchWalkingRoute([longitude, latitude], destination);
        setCurrentRoute(route);
        setRoute(route);
      } catch (fetchError) {
        // নেটওয়ার্ক ব্যর্থতা বা API-এর বাংলা এরর — দুই-ই একই পথে উঠে আসে।
        const errorMsg =
          fetchError instanceof Error && fetchError.message
            ? fetchError.message
            : "নেটওয়ার্ক সমস্যা — রুট বের করা যায়নি।";
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
