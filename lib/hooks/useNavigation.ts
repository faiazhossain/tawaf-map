import { useCallback, useEffect, useRef } from "react";
import { useLocationStore, useRouteStore, useNavigationStore } from "@/lib/store";
import {
  computeRouteProgress,
  nextOffRouteCounters,
  MAX_FIX_ACCURACY_M,
  type OffRouteCounters,
} from "@/lib/routing/route-progress";
import { fetchWalkingRoute } from "@/lib/routing/fetchRoute";
import { shouldEmitPositionChange } from "@/lib/nearby/query";

/**
 * লাইভ নেভিগেশন অর্কেস্ট্রেশন — পার্শ্ব-প্রভাবই এর কাজ, কিছু রিটার্ন করে না;
 * UI সব `useNavigationStore` থেকে পড়ে।
 *
 * পেজ পর্যায়ে ঠিক একবার মাউন্ট করতে হবে (`app/map/page.tsx`) — ব্যানার বা
 * প্যানেল থেকে দ্বিতীয়বার মাউন্ট করলে প্রতিটি ফিক্সে ডাবল হিসাব/ডাবল
 * রিয়ারাউট হবে। শুধু latitude/longitude/accuracy + isNavigating সাবস্ক্রাইব
 * করা হয়; বাকি সব ফিক্সের ভেতরে `getState()` দিয়ে পড়া হয়।
 */

/** ডিসপ্লে-টিয়ার হিস্টেরিসিস — এর কম নড়াচড়ায় প্রগ্রেস বদলায় না। */
export const NAV_POSITION_MIN_DELTA_M = 2;

/** দুই রিয়ারাউটের মাঝের সর্বনিম্ন বিরতি — Barikoi-তে রিকোয়েস্ট-ঝড় আটকায়। */
export const REROUTE_COOLDOWN_MS = 8000;

/** ফলো-ক্যামেরার জুম (গেট নির্বাচনের flyTo-র সাথে মিলিয়ে)। */
export const NAV_FOLLOW_ZOOM = 17;

/** প্রতি গৃহীত ফিক্সে ক্যামেরার ধীর ধরে রাখার সময়, মিলিসেকেন্ডে। */
export const NAV_FOLLOW_EASE_MS = 500;

export function useNavigation(): void {
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const accuracy = useLocationStore((state) => state.accuracy);
  const isNavigating = useNavigationStore((state) => state.isNavigating);
  const activeRouteId = useRouteStore((state) => state.activeRoute?.id ?? null);

  const lastFixRef = useRef<{ lat: number; lon: number } | null>(null);
  const offRouteRef = useRef<OffRouteCounters>({ consecutive: 0, sustained: false });
  const rerouteInFlightRef = useRef(false);
  const lastRerouteAtRef = useRef(0);
  const routeIdRef = useRef<string | null>(null);

  // সেশন শেষ হলে রেফগুলো তাজা করা — পরের নেভিগেশন শূন্য থেকে শুরু হয়।
  useEffect(() => {
    if (isNavigating) return;
    lastFixRef.current = null;
    offRouteRef.current = { consecutive: 0, sustained: false };
  }, [isNavigating]);

  // রুট-id ওয়াচার: নতুন রুট (প্রাথমিক বা রিয়ারাউট) এলে প্রগ্রেস রিসেট —
  // গন্তব্য ও isNavigating বহাল থাকে।
  useEffect(() => {
    if (routeIdRef.current === activeRouteId) return;
    routeIdRef.current = activeRouteId;
    if (activeRouteId === null || !useNavigationStore.getState().isNavigating) return;
    useNavigationStore.getState().resetProgress();
    offRouteRef.current = { consecutive: 0, sustained: false };
    // নতুন রুটে পুরনো ফিক্স-অবস্থান প্রাসঙ্গিক নয় — পরের ফিক্সই আবার হিসাব করবে।
    lastFixRef.current = null;
  }, [activeRouteId]);

  const triggerReroute = useCallback(async () => {
    const locationState = useLocationStore.getState();
    const navState = useNavigationStore.getState();
    if (locationState.latitude === null || locationState.longitude === null) return;
    if (!navState.destination) return;

    rerouteInFlightRef.current = true;
    lastRerouteAtRef.current = Date.now();
    useNavigationStore.getState().setRerouting(true);

    try {
      const route = await fetchWalkingRoute(
        [locationState.longitude, locationState.latitude],
        navState.destination.coordinates
      );
      useRouteStore.getState().setRoute(route);
      // নতুন id ওয়াচার resetProgress ডাকবে — isRerouting সেখানেই মুছে যায়।
    } catch {
      // ব্যর্থতায় পুরনো রুট বহাল থাকে; sustained থাকলে কুলডাউন পেরোলে আবার চেষ্টা।
      useNavigationStore
        .getState()
        .setRerouting(false, "নতুন রুট পাওয়া যায়নি — আবার চেষ্টা হচ্ছে...");
    } finally {
      rerouteInFlightRef.current = false;
    }
  }, []);

  // মূল ফিক্স লুপ: প্রতিটি গৃহীত ফিক্সে প্রগ্রেস হিসাব + প্রয়োজনে রিয়ারাউট।
  useEffect(() => {
    if (!isNavigating) return;
    const navState = useNavigationStore.getState();
    if (navState.hasArrived) return;
    if (latitude === null || longitude === null) return;

    // খারাপ accuracy-র ফিক্স পুরোপুরি উপেক্ষিত — ভুল দূরত্ব নয়, বরং থেমে থাকা।
    if (accuracy !== null && accuracy > MAX_FIX_ACCURACY_M) return;

    const lastFix = lastFixRef.current;
    if (
      !shouldEmitPositionChange(
        lastFix?.lat ?? null,
        lastFix?.lon ?? null,
        latitude,
        longitude,
        NAV_POSITION_MIN_DELTA_M
      )
    ) {
      return;
    }
    lastFixRef.current = { lat: latitude, lon: longitude };

    const route = useRouteStore.getState().activeRoute;
    if (!route || route.geometry.length < 2) return;

    const progress = computeRouteProgress({
      geometry: route.geometry,
      steps: route.steps,
      point: [longitude, latitude],
      destination: navState.destination?.coordinates ?? null,
      approach: route.approach ?? null,
      minStepIndex: navState.currentStepIndex,
    });

    if (progress.hasArrived) {
      useNavigationStore.getState().setArrived();
      return;
    }

    // গাইডেন্স-দমন: (১) চূড়ান্ত পর্যায়ে রাস্তা নেই — সংযোগকারী ধরে হাঁটা
    // অফ-রুট নয়, রিয়ারাউট চেষ্টা করা অর্থহীন ঝামেলা; (২) আনুমানিক রুটে
    // ইঞ্জিনের কাছে পথ-ই নেই — সেখানে আবার জিজ্ঞেস করা বৃথা।
    const suppressGuidance = progress.inApproach || route.approximate === true;

    if (suppressGuidance) {
      offRouteRef.current = { consecutive: 0, sustained: false };
      useNavigationStore.getState().setOffRoute(false, 0);
    } else {
      offRouteRef.current = nextOffRouteCounters(offRouteRef.current, progress.distanceFromRoute);
      useNavigationStore
        .getState()
        .setOffRoute(offRouteRef.current.sustained, offRouteRef.current.consecutive);
    }
    useNavigationStore.getState().setProgress({
      currentStepIndex: progress.currentStepIndex,
      remainingDistance: progress.remainingDistance,
      remainingDuration: progress.remainingDuration,
      distanceToStepEnd: progress.distanceToStepEnd,
      snappedPosition: progress.snapped,
      remainingGeometry: progress.remainingGeometry,
      inApproach: progress.inApproach,
      approachRemainingM: progress.approachRemainingM,
    });

    if (
      !suppressGuidance &&
      offRouteRef.current.sustained &&
      !rerouteInFlightRef.current &&
      Date.now() - lastRerouteAtRef.current >= REROUTE_COOLDOWN_MS
    ) {
      void triggerReroute();
    }
  }, [latitude, longitude, accuracy, isNavigating, triggerReroute]);
}
