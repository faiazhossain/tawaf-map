"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  Map as MapLibreMap,
  FlyToOptions,
  EaseToOptions,
  FitBoundsOptions,
  LngLatBoundsLike,
} from "maplibre-gl";
import { useMapStore } from "@/lib/store/mapStore";

/**
 * গাইডেড ক্যামেরা নিয়ন্ত্রণ - মানচিত্র কখন নিজে থেকে সরে আর কখন ব্যবহারকারীর
 * হাতে ছেড়ে দেবে তা ঠিক করে।
 *
 * দুটি ধারণা:
 *  1. "programmatic" মুভ - গাইড/সিলেকশন/টগলের কারণে আমরা flyTo/fitBounds/easeTo
 *     করছি। এসময় userTookControl ফলস করা হয় এবং gesture ডিটেকশন উপেক্ষা করা হয়।
 *  2. "user gesture" - ব্যবহারকারী নিজে প্যান/জুম/ঘোরাচ্ছে। তখন userTookControl
 *     সত্য হয় যাতে Recenter বোতাম দেখানো যায় এবং গাইড ক্যামেরা ধরে না রাখে।
 *
 * একটি token-guard নিশ্চিত করে যে ধারাবাহিক programmatic মুভ একে অপরের সাথে
 * বাধা সৃষ্টি করে না এবং পুরোনো moveend ভুল করে flag পরিষ্কার না করে।
 */
export function useTawafCamera(map: MapLibreMap | null) {
  // সত্য যখন একটি programmatic ক্যামেরা মুভ চলছে।
  const programmaticRef = useRef(false);
  // প্রতিটি programmatic মুভ একটি নতুন token পায়; শুধু সর্বশেষটিই flag পরিষ্কার করে।
  const tokenRef = useRef(0);

  const markUserControl = useMapStore((s) => s.markUserControl);

  // ব্যবহারকারীর gesture শনাক্তকরণ - প্রতিটি map instance-এর জন্য একবার।
  useEffect(() => {
    if (!map) return;

    const onUserGesture = () => {
      if (!programmaticRef.current) {
        markUserControl(true);
      }
    };

    // dragstart = প্যান; zoomstart = পিঞ্চ/স্ক্রল জুম; rotatestart/pitchstart = দুই-আঙুল ঘোরা/নত।
    const events = ["dragstart", "zoomstart", "rotatestart", "pitchstart"] as const;
    events.forEach((evt) => map.on(evt, onUserGesture));

    return () => {
      events.forEach((evt) => map.off(evt, onUserGesture));
    };
  }, [map, markUserControl]);

  /** ভিতরের কাজটি programmatic হিসেবে চালায় - flag সেট করে, moveend-এ পরিষ্কার করে। */
  const runProgrammatic = useCallback(
    (fn: (m: MapLibreMap) => void, duration = 1000) => {
      if (!map) return;
      const myToken = ++tokenRef.current;
      programmaticRef.current = true;
      markUserControl(false);

      const clear = () => {
        if (myToken === tokenRef.current) programmaticRef.current = false;
      };
      map.once("moveend", clear);
      // নিরাপত্তা: duration শেষেও flag পরিষ্কার (moveend যদি কোনো কারণে না আসে)
      window.setTimeout(clear, duration + 400);

      fn(map);
    },
    [map, markUserControl]
  );

  const programmaticFlyTo = useCallback(
    (options: FlyToOptions) => runProgrammatic((m) => m.flyTo(options), options.duration ?? 1000),
    [runProgrammatic]
  );

  const programmaticEaseTo = useCallback(
    (options: EaseToOptions) => runProgrammatic((m) => m.easeTo(options), options.duration ?? 1000),
    [runProgrammatic]
  );

  const programmaticFitBounds = useCallback(
    (bounds: LngLatBoundsLike, options?: FitBoundsOptions) =>
      runProgrammatic((m) => m.fitBounds(bounds, options), options?.duration ?? 1000),
    [runProgrammatic]
  );

  return { programmaticFlyTo, programmaticEaseTo, programmaticFitBounds };
}
