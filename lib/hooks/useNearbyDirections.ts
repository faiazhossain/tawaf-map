"use client";

import { useCallback, useState } from "react";
import { useMapRouting } from "./useMapRouting";
import { useNavigationStore, useNearbyStore, usePanelStore, useRouteStore } from "@/lib/store";
import type { NearbyItem } from "@/types/nearby";

interface NearbyDirectionsResult {
  getDirections: () => Promise<void>;
  isRouting: boolean;
  error: string | null;
}

/**
 * "আমার কাছে"-এর ডিটেইল শিট/মোডাল থেকে দিক নির্দেশনা — গেট/হোটেল/
 * ঐতিহাসিক স্থানের ইনফো প্যানেলের একই চুক্তি: গন্তব্য আগে বসে (RoutePanel-এর
 * "শুরু" বোতাম এটিই ব্যবহার করে), রুট সফল হলে নিকটবর্তী-নির্বাচন মুছে
 * রুট প্যানেলে সুইচ। ব্যর্থতায় শিট/মোডাল থেকে যায় যেন পুনরায় চেষ্টা করা যায়।
 */
export function useNearbyDirections(item: NearbyItem): NearbyDirectionsResult {
  const { calculateRoute, isCalculating, error } = useMapRouting();
  const [isRouting, setIsRouting] = useState(false);

  const getDirections = useCallback(async () => {
    useNavigationStore
      .getState()
      .setDestination({ coordinates: item.coordinates, name: item.name });
    setIsRouting(true);
    await calculateRoute(item.coordinates);
    setIsRouting(false);
    const { activeRoute, routeError } = useRouteStore.getState();
    if (activeRoute !== null && routeError === null) {
      useNearbyStore.getState().clearSelection();
      usePanelStore.getState().setActivePanel("route");
    }
  }, [item.coordinates, item.name, calculateRoute]);

  return { getDirections, isRouting: isRouting || isCalculating, error };
}
