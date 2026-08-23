import { create } from "zustand";
import { useMapStore } from "./mapStore";
import type { NavigationDestination } from "@/types/navigation";

/**
 * লাইভ নেভিগেশনের একক সত্যের উৎস — প্রগ্রেস, অফ-রুট, রিয়ারাউট ও ক্যামেরা
 * ফলো। সব হিসাব `useNavigation` হুক করে (পেজ পর্যায়ে একবারই মাউন্ট হয়);
 * UI শুধু সিলেক্টর দিয়ে পড়ে ও অ্যাকশন ডাকে।
 *
 * ইচ্ছাকৃতভাবে persist করা হয় না — রিলোডে আধা-সমাপ্ত নেভিগেশন ফিরে
 * আসা বিভ্রান্তিকর হতো।
 */

interface NavigationProgress {
  currentStepIndex: number;
  remainingDistance: number;
  remainingDuration: number;
  distanceToStepEnd: number;
  snappedPosition: [number, number];
  remainingGeometry: number[][];
}

interface NavigationStore {
  isNavigating: boolean;
  destination: NavigationDestination | null;
  currentStepIndex: number;
  remainingDistance: number | null;
  remainingDuration: number | null;
  distanceToStepEnd: number | null;
  snappedPosition: [number, number] | null;
  remainingGeometry: number[][] | null;
  offRoute: boolean;
  offRouteFixCount: number;
  isRerouting: boolean;
  rerouteError: string | null;
  hasArrived: boolean;
  followEnabled: boolean;

  /** প্যানেলগুলো calculateRoute ডাকার আগে গন্তব্য বসায় (RoutePanel-এর শুরু বোতামের জন্য)। */
  setDestination: (destination: NavigationDestination) => void;
  clearDestination: () => void;
  /** followEnabled=true করে ও mapStore.userTookControl মুছে ফেলে। */
  startNavigation: (destination: NavigationDestination) => void;
  stopNavigation: () => void;
  /** এক অ্যাকশন = এক set() = সব প্রগ্রেস ফিল্ডে একসাথে রি-রেন্ডার। */
  setProgress: (progress: NavigationProgress) => void;
  setOffRoute: (offRoute: boolean, fixCount: number) => void;
  setRerouting: (isRerouting: boolean, error?: string | null) => void;
  setArrived: () => void;
  setFollowEnabled: (enabled: boolean) => void;
  /** নতুন রুট id এসেছে — কাউন্টার/জ্যামিতি রিসেট, গন্তব্য ও isNavigating বহাল। */
  resetProgress: () => void;
}

const EMPTY_STATE = {
  currentStepIndex: 0,
  remainingDistance: null,
  remainingDuration: null,
  distanceToStepEnd: null,
  snappedPosition: null,
  remainingGeometry: null,
  offRoute: false,
  offRouteFixCount: 0,
  isRerouting: false,
  rerouteError: null,
  hasArrived: false,
};

export const useNavigationStore = create<NavigationStore>((set) => ({
  isNavigating: false,
  destination: null,
  followEnabled: true,
  ...EMPTY_STATE,

  setDestination: (destination) => set({ destination }),

  clearDestination: () => set({ destination: null }),

  startNavigation: (destination) => {
    useMapStore.getState().markUserControl(false);
    set({ isNavigating: true, destination, followEnabled: true, ...EMPTY_STATE });
  },

  stopNavigation: () =>
    set({ isNavigating: false, destination: null, followEnabled: true, ...EMPTY_STATE }),

  setProgress: (progress) =>
    set({
      currentStepIndex: progress.currentStepIndex,
      remainingDistance: progress.remainingDistance,
      remainingDuration: progress.remainingDuration,
      distanceToStepEnd: progress.distanceToStepEnd,
      snappedPosition: progress.snappedPosition,
      remainingGeometry: progress.remainingGeometry,
    }),

  setOffRoute: (offRoute, fixCount) => set({ offRoute, offRouteFixCount: fixCount }),

  setRerouting: (isRerouting, error = null) => set({ isRerouting, rerouteError: error }),

  setArrived: () => set({ hasArrived: true }),

  setFollowEnabled: (enabled) => set({ followEnabled: enabled }),

  resetProgress: () => set({ ...EMPTY_STATE }),
}));
