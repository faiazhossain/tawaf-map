"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  DIRECTION_ARROWS_SOURCE,
  DIRECTION_ARROWS_LAYER,
  DIRECTION_ARROW_ICON,
  EMPTY_FEATURE_COLLECTION,
  buildDirectionArrowsGeoJSON,
  directionArrowsLayer,
} from "@/lib/map/umrah-overlay";

const SWEEP_PERIOD = 4500; // ms - পুরো পথ ধরে একবার কমেট সুইপ (ধীর, সম্মানজনক)
const STATIC_OPACITY = 0.7; // reduced-motion বা স্থির অবস্থায়
const DIM_OPACITY = 0.2; // কমেট থেকে দূরে থাকা চেভরনের ম্লান বেসলাইন

// টিল রঙের দুই-পাল্লের চেভরন তীর, উত্তরমুখী আঁকা (icon-rotate = bearing দ্বারা ঘোরানো)।
const CHEVRON_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 6 L25 17 M16 6 L7 17" stroke="#2dd4bf" stroke-width="4" stroke-linecap="round"/><path d="M16 14 L23 23 M16 14 L9 23" stroke="#5eead4" stroke-width="4" stroke-linecap="round" opacity="0.5"/></svg>`;

export interface UseDirectionArrowsOptions {
  /** গাইড সক্রিয় কিনা (সোর্স/লেয়ার জীবনচক্রের জন্য)। */
  show: boolean;
  /** বর্তমানে কোনো আনুষ্ঠানিক পথ (তওয়াফ/সাঈ) সক্রিয় আছে কিনা। */
  active: boolean;
  /** সক্রিয় পথের ঘন স্থানাঙ্ক (হাঁটার ক্রমে); `active` মিথ্যা হলে অগ্রাহ্য। */
  coords: number[][] | null;
  /** কতগুলো চেভরন বসানো হবে। */
  count: number;
  /** পথ বদ্ধ (তওয়াফ বৃত্ত) কিনা; নাহলে খোলা পথ (সাঈ করিডোর) ধরা হয়। */
  closed?: boolean;
}

/**
 * তওয়াফ/সাঈ-এর সক্রিয় পথে হাঁটার দিক দেখানো চেভরন - একটি "কমেট" প্রবাহ হাঁটার দিকে
 * ধীরে এগিয়ে যায় (তওয়াফ: ঘড়ির বিপরীত; সাঈ: সাফা→মারওয়া বা বিপরীত, পাক অনুযায়ী)।
 *
 * প্রবাহ ছাড়া চেভরনগুলোই (bearing অনুযায়ী ঘূর্ণিত) দিক স্পষ্ট করে। prefers-reduced-motion
 * হলে কোনো অ্যানিমেশন চলে না - চেভরনগুলো স্থির অস্বচ্ছতায় থাকে।
 *
 * সোর্স/লেয়ার/আইকন জীবনচক্র `show`-এর ওপর নির্ভরশীল; ডেটা ও অ্যানিমেশন
 * `active`/`coords`/`count`-এর ওপর।
 */
export function useDirectionArrows(
  map: MapLibreMap | null,
  { show, active, coords, count, closed = false }: UseDirectionArrowsOptions
) {
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  // সোর্স + লেয়ার + চেভরন আইকন জীবনচক্র - show চালু থাকাকালীন একবার।
  useEffect(() => {
    if (!map || !show) return;

    if (!map.getSource(DIRECTION_ARROWS_SOURCE)) {
      map.addSource(DIRECTION_ARROWS_SOURCE, {
        type: "geojson",
        data: EMPTY_FEATURE_COLLECTION as any,
      });
    }
    if (!map.getLayer(DIRECTION_ARROWS_LAYER)) {
      map.addLayer({ ...(directionArrowsLayer as any) });
    }

    // চেভরন আইকন অ্যাসিঙ্ক্রোনাস লোড - প্রস্তুত হলে যোগ (pixelRatio ২ = তীক্ষ্ণ)।
    let cancelled = false;
    if (!map.hasImage(DIRECTION_ARROW_ICON)) {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        try {
          if (!map.hasImage(DIRECTION_ARROW_ICON)) {
            map.addImage(DIRECTION_ARROW_ICON, img, { pixelRatio: 2 });
          }
        } catch {
          // স্টাইল পরিবর্তনের সময় সংঘর্ষ উপেক্ষা - পরবর্তী রেন্ডারে আবার চেষ্টা হবে না।
        }
      };
      img.src = `data:image/svg+xml;base64,${btoa(CHEVRON_SVG)}`;
    }

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (map.getLayer(DIRECTION_ARROWS_LAYER)) map.removeLayer(DIRECTION_ARROWS_LAYER);
      if (map.getSource(DIRECTION_ARROWS_SOURCE)) map.removeSource(DIRECTION_ARROWS_SOURCE);
      if (map.hasImage(DIRECTION_ARROW_ICON)) map.removeImage(DIRECTION_ARROW_ICON);
    };
  }, [map, show]);

  // ডেটা সেট + কমেট প্রবাহ অ্যানিমেশন - active/coords/count পরিবর্তনে।
  useEffect(() => {
    if (!map || !show) return;
    const source = map.getSource(DIRECTION_ARROWS_SOURCE) as any;
    if (!source) return;

    if (!active || !coords || coords.length < 2 || count <= 0) {
      source.setData(EMPTY_FEATURE_COLLECTION);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const data = buildDirectionArrowsGeoJSON(coords, count, closed);
    source.setData(data as any);

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      // স্থির: সব চেভরন একই ম্লান-মধ্যম অস্বচ্ছতায়, কোনো নড়াচড়া নেই।
      try {
        map.setPaintProperty(DIRECTION_ARROWS_LAYER, "icon-opacity", STATIC_OPACITY);
      } catch {
        // লেয়ার এখনো যোগ হয়নি হতে পারে - নিরাপদে উপেক্ষা।
      }
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const n = count;
    const half = n / 2;

    /** কমেটের মাথা থেকে দূরত্ব `d` (০..n) অনুযায়ী অস্বচ্ছতা। */
    const opacityFor = (d: number): number => {
      if (d <= 1) return 1; // মাথা + অবিলম্বে পরেরটি: পুরো উজ্জ্বল
      if (d >= half) return DIM_OPACITY; // দূরে: ম্লান বেসলাইন
      return 1 - (1 - DIM_OPACITY) * ((d - 1) / (half - 1));
    };

    startRef.current = performance.now();

    const tick = (now: number) => {
      const phase = ((now - startRef.current) / SWEEP_PERIOD) * n; // প্রতি সুইপে ০..n
      // প্রতিটি seq-এর জন্য কমেট থেকে দূরত্ব, হাঁটার দিকে মোড়ানো।
      const stops: number[] = [];
      for (let s = 0; s < n; s++) {
        const d = (((s - phase) % n) + n) % n;
        stops.push(s, opacityFor(d));
      }
      const expr: unknown[] = ["interpolate", ["linear"], ["get", "seq"], ...stops];
      try {
        map.setPaintProperty(DIRECTION_ARROWS_LAYER, "icon-opacity", expr as any);
      } catch {
        // লেয়ার সরানো হলে উপেক্ষা - পরের ফ্রেমে আবার চেষ্টা।
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [map, show, active, coords, count, closed]);
}
