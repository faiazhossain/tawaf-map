import { create } from "zustand";
import type { Route } from "@/types/navigation";

interface RouteStore {
  activeRoute: Route | null;
  isRouting: boolean;
  routeError: string | null;
  setRoute: (route: Route | null) => void;
  setRouting: (isRouting: boolean) => void;
  setRouteError: (error: string | null) => void;
  clearRoute: () => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  activeRoute: null,
  isRouting: false,
  routeError: null,

  setRoute: (activeRoute) => set({ activeRoute, routeError: null }),
  setRouting: (isRouting) => set({ isRouting }),
  setRouteError: (routeError) => set({ routeError }),

  clearRoute: () =>
    set({
      activeRoute: null,
      isRouting: false,
      routeError: null,
    }),
}));
