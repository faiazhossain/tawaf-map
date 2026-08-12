"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { EMPTY_FEATURE_COLLECTION, miqatBoundaryLinePaint } from "@/lib/map/umrah-overlay";

const TRACE_DURATION = 2800; // ms - রূপরেখা আঁকার সময় (ধীর, সম্মানজনক গতি)
const HOLD_DURATION = 1500; // ms - reduced-motion-এ স্থির রূপরেখা দেখানোর সময়
const FADE_DURATION = 600; // ms - সম্পন্ন হওয়ার পর রেখা ম্লান হওয়ার সময়

/** রূপরেখার (LineString) FeatureCollection তৈরি করে। */
function outlineFeature(coords: number[][]) {
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: coords },
      },
    ],
  };
}

export interface UseMiqatBoundaryAnimationOptions {
  /** সোর্স/লেয়ার জীবনচক্রের জন্য (সাধারণত showUmrah && mapLoaded)। */
  show: boolean;
  /** রাইজিং এজ প্লে ট্রিগার করে (stage === "ihram" && !showMiqatOverview)। */
  active: boolean;
  /** সোর্স id; লেয়ার id = `${sourceId}-line`। */
  sourceId: string;
  /** বদ্ধ মিকাত রিং স্থানাঙ্ক (প্রথম === শেষ)। */
  ringCoords: number[][];
  /** z-অর্ডারিংয়ের জন্য before-layer id। ডিফল্ট "building-metro"। */
  beforeLayerId?: string;
  /** ফেড-আউট শেষ হলে একবার ডাকা হয় (ক্যামেরা ফেরত আনার ট্রিগার)। */
  onComplete?: () => void;
}

/**
 * মিকাত সীমানা রূপরেখার ভূমিকা অ্যানিমেশন - ihram ধাপে পৌঁছালে বাইরের মিকাত পয়েন্টগুলো
 * ঘিরে একটি রেখা ঘড়ির বিপরীত দিকে (counter-clockwise) আঁকা হয়, কিছুক্ষণ থাকে, তারপর
 * ম্লান হয়ে সরে যায়।
 *
 * প্রতি মানচিত্র সেশনে একবারই চলে (everPlayedRef)। useRitualDrawAnimation-এর কাঠামো
 * অনুসরণ করে কিন্তু হাজি মার্কার নেই এবং শেষে ফেড-আউট + অপসারণ যোগ করা হয়েছে।
 * prefers-reduced-motion হলে কোনো অ্যানিমেশন ছাড়াই স্থির রূপরেখা দেখানো হয়, ধরে রাখা
 * হয়, তারপর পরিষ্কার করা হয়।
 */
export function useMiqatBoundaryAnimation(
  map: MapLibreMap | null,
  {
    show,
    active,
    sourceId,
    ringCoords,
    beforeLayerId = "building-metro",
    onComplete,
  }: UseMiqatBoundaryAnimationOptions
): void {
  const layerId = `${sourceId}-line`;
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const reducedRef = useRef(false);
  const everPlayedRef = useRef(false);
  const ringCoordsRef = useRef(ringCoords);
  ringCoordsRef.current = ringCoords;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const beforeLayerIdRef = useRef(beforeLayerId);
  beforeLayerIdRef.current = beforeLayerId;
  const baseOpacity = (miqatBoundaryLinePaint["line-opacity"] as number) ?? 0.9;

  // সোর্স + লেয়ার + reduced-motion সনাক্তকরণ - জীবনচক্র।
  useEffect(() => {
    if (!map || !show) return;
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: "geojson", data: EMPTY_FEATURE_COLLECTION as any });
    }
    if (!map.getLayer(layerId)) {
      // "building-metro" থাকলে তার নিচে (লেবেলের নিচে, বেসম্যাপের উপরে); না থাকলে উপরে।
      const beforeId = map.getLayer(beforeLayerIdRef.current)
        ? beforeLayerIdRef.current
        : undefined;
      map.addLayer(
        {
          id: layerId,
          type: "line",
          source: sourceId,
          paint: miqatBoundaryLinePaint as any,
          layout: { "line-cap": "round", "line-join": "round" },
        },
        beforeId as any
      );
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, "line-opacity", baseOpacity);
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      // সেশন শেষ হলে (আনমাউন্ট/লুকানো) পুনরায় চলার সুযোগ রাখা।
      everPlayedRef.current = false;
    };
  }, [map, show, sourceId, layerId, baseOpacity]);

  const clearData = () => {
    const source = map?.getSource(sourceId) as any;
    if (source) source.setData(EMPTY_FEATURE_COLLECTION);
  };

  const startFadeOut = () => {
    if (!map) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / FADE_DURATION);
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, "line-opacity", baseOpacity * (1 - p));
      }
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        clearData();
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, "line-opacity", baseOpacity);
        }
        onCompleteRef.current?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const play = () => {
    if (!map) return;
    const source = map.getSource(sourceId) as any;
    if (!source) return;
    const coords = ringCoordsRef.current;
    if (!coords || coords.length < 3) return;

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    map.setPaintProperty(layerId, "line-opacity", baseOpacity);

    // reduced motion: অ্যানিমেশন ছাড়াই সম্পূর্ণ রূপরেখা, ধরে রাখা, তারপর পরিষ্কার।
    if (reducedRef.current) {
      source.setData(outlineFeature(coords));
      timeoutRef.current = window.setTimeout(() => {
        clearData();
        onCompleteRef.current?.();
      }, HOLD_DURATION);
      return;
    }

    // জীবন্ত অঙ্কন - ease-out ধরে রূপরেখা আস্তে আঁকা হয়।
    const start = performance.now();
    const total = coords.length;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / TRACE_DURATION);
      const e = 1 - Math.pow(1 - p, 2); // ease-out quad
      const k = Math.max(2, Math.round(e * (total - 1)) + 1);
      source.setData(outlineFeature(coords.slice(0, k)));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startFadeOut();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // প্লে ট্রিগার - রাইজিং এজ। কোনো cleanup নেই, যাতে StrictMode-এর setup-cleanup-setup
  // অ্যানিমেশনটি দুবার চালাতে না পারে।
  useEffect(() => {
    if (!map || !show || !active) return;
    if (everPlayedRef.current) return;
    everPlayedRef.current = true;
    play();
    // play/startFadeOut/clearData রেফ-ভিত্তিক, তাই এগুলো deps-এ নেই।
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, show, active]);
}
