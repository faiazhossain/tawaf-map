"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { Marker as MapLibreMarker } from "maplibre-gl";
import { EMPTY_FEATURE_COLLECTION, drawLineLayerPaint } from "@/lib/map/umrah-overlay";
import { createPilgrimMarkerElement } from "@/lib/map/markers";

const DRAW_DURATION = 2800; // ms - এক পূর্ণ চক্কর/পাক আঁকার সময় (ধীর, সম্মানজনক গতি)
const FADE_DELAY = 400; // ms - সম্পন্ন হওয়ার পর ট্রেসার/হাজি সরানোর সময়

export interface UseRitualDrawAnimationOptions {
  /** গাইড সক্রিয় কিনা (সোর্স/লেয়ার জীবনচক্রের জন্য)। */
  show: boolean;
  /** এই অ্যানিমেশনের জন্য সোর্স id (লেয়ার id = `${sourceId}-line`)। */
  sourceId: string;
  /** হাজি মার্কারের আইকন সোর্স (লিঙ্গ অনুযায়ী পুরুষ/নারী)। */
  iconSrc: string;
  /**
   * এক পূর্ণ চক্কর/পাকের ঘন স্থানাঙ্ক ফেরত দেয়। `round` = সদ্য-সম্পন্ন চক্কর নম্বর
   * (সাঈ-এ দিক নির্ধারণে ব্যবহৃত: বিজোড় = সাফা→মারওয়া, জোড় = মারওয়া→সাফা)।
   */
  getCoords: (round: number) => number[][];
}

/**
 * তওয়াফ/সাঈ-এর "জীবন্ত অঙ্কন" অ্যানিমেশন - একটি চক্কর/পাক সম্পন্ন হলে একজন হাজি পুরো
 * পথ ধরে হাঁটে (তওয়াফ: সম্পূর্ণ বৃত্ত, ঘড়ির বিপরীত দিকে; সাঈ: সম্পূর্ণ করিডোর) এবং পেছনে
 * উজ্জ্বল টিল রেখা আস্তে আঁকা হয়।
 *
 * প্রতিটি চক্কর একটি সম্পূর্ণ রাউন্ড - এটি কোনো ১/৭ অগ্রগতি বার নয়। ট্যাপের মধ্যে মানচিত্র
 * শান্ত থাকে। prefers-reduced-motion হলে অ্যানিমেশন বাদ দেওয়া হয়।
 */
export function useRitualDrawAnimation(
  map: MapLibreMap | null,
  { show, sourceId, iconSrc, getCoords }: UseRitualDrawAnimationOptions
) {
  const layerId = `${sourceId}-line`;
  const markerRef = useRef<Marker | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const reducedRef = useRef(false);
  const getCoordsRef = useRef(getCoords);
  getCoordsRef.current = getCoords;
  const iconSrcRef = useRef(iconSrc);
  iconSrcRef.current = iconSrc;

  // সোর্স + লেয়ার + reduced-motion সনাক্তকরণ - একবার।
  useEffect(() => {
    if (!map || !show) return;
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: "geojson", data: EMPTY_FEATURE_COLLECTION as any });
    }
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        paint: drawLineLayerPaint as any,
        layout: { "line-cap": "round", "line-join": "round" },
      });
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, show, sourceId, layerId]);

  /** এক পূর্ণ চক্কর/পাক অঙ্কন অ্যানিমেশন চালায় (round = সদ্য-সম্পন্ন চক্কর নম্বর)। */
  const play = useCallback(
    (round: number) => {
      if (!map) return;
      const source = map.getSource(sourceId) as any;
      if (!source) return;

      // reduced motion: অ্যানিমেশন ছাড়াই শুধু ট্রেসার পরিষ্কার
      if (reducedRef.current) {
        source.setData(EMPTY_FEATURE_COLLECTION);
        return;
      }

      const coords = getCoordsRef.current(round);
      if (!coords || coords.length < 2) return;

      // হাজি মার্কার তৈরি (না থাকলে) - অবশ্যই setLngLat করে তারপর addTo
      if (!markerRef.current) {
        markerRef.current = new MapLibreMarker({
          element: createPilgrimMarkerElement(iconSrcRef.current),
          anchor: "center",
        })
          .setLngLat(coords[0] as [number, number])
          .addTo(map);
      }
      const marker = markerRef.current;
      const markerEl = marker.getElement() as HTMLElement;
      markerEl.style.opacity = "1";
      marker.setLngLat(coords[0] as [number, number]);

      const total = coords.length;
      const start = performance.now();

      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / DRAW_DURATION);
        // ease-out: শুরুতে দ্রুত, শেষে ধীরে
        const e = 1 - Math.pow(1 - p, 2);
        const k = Math.max(2, Math.round(e * (total - 1)) + 1);
        const revealed = coords.slice(0, k);

        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: revealed },
            },
          ],
        });
        marker.setLngLat(revealed[revealed.length - 1] as [number, number]);

        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          // হাজি ফেড-আউট, তারপর ট্রেসার পরিষ্কার ও মার্কার সরানো
          markerEl.style.opacity = "0";
          timeoutRef.current = window.setTimeout(() => {
            source.setData(EMPTY_FEATURE_COLLECTION);
            if (markerRef.current) {
              markerRef.current.remove();
              markerRef.current = null;
            }
          }, FADE_DELAY);
        }
      };

      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    },
    [map, sourceId]
  );

  return { play };
}
