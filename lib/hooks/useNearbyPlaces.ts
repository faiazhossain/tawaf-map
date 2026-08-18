import { useMemo, useRef } from "react";
import { useLocationStore } from "@/lib/store";
import { useNearbyStore } from "@/lib/store/nearbyStore";
import { getNearbyCounts, getNearbyItems, shouldEmitPositionChange } from "@/lib/nearby/query";
import type { NearbyCategory, NearbyCounts, NearbyItem } from "@/types/nearby";

/**
 * "আমার কাছে" লাইভ কোয়েরি হুক — locationStore-এর ফিক্স থেকে গণনা ও তালিকা।
 *
 * পারফরম্যান্স নিয়ম:
 * - locationStore থেকে শুধু latitude/longitude স্লাইস (useGateProximity-এর মতো)
 *   — heading/speed ফিক্সে রি-রেন্ডার হয় না।
 * - ১০ মিটারের কম নড়াচড়ায় (GPS জিটার) আগের ফলাফলের একই অবজেক্ট ফেরত যায় —
 *   কার্ড-স্ট্রিপ/মার্কার-মেম্বারশিপ কী অক্ষত থাকে।
 * - ব্যাসার্ধ/বিভাগ/ফিল্টার বদলালে অবস্থান একই থাকলেও পুনর্গণনা হয়।
 */
export interface NearbyPlaces {
  hasLocation: boolean;
  /** থ্রটল-করা ফিক্স — পুরো সিস্টেম (বৃত্তসহ) এটি থেকে চলে */
  center: { latitude: number; longitude: number } | null;
  counts: NearbyCounts;
  /** সক্রিয় বিভাগের দূরত্ব-সাজানো পূর্ণ তালিকা (বিভাগ নিষ্ক্রিয় হলে খালি) */
  items: NearbyItem[];
}

export function useNearbyPlaces(): NearbyPlaces {
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);

  const radius = useNearbyStore((state) => state.radius);
  const enabledCategories = useNearbyStore((state) => state.enabledCategories);
  const halalOnly = useNearbyStore((state) => state.halalOnly);
  const activeCategory = useNearbyStore((state) => state.activeCategory);

  const enabledKey = enabledCategories.join(",");

  const lastComputedRef = useRef<{
    sig: string;
    lat: number;
    lon: number;
    center: { latitude: number; longitude: number };
    counts: NearbyCounts;
    items: NearbyItem[];
  } | null>(null);

  const computed = useMemo(() => {
    if (latitude === null || longitude === null) return null;

    const sig = `${radius}|${enabledKey}|${halalOnly}|${activeCategory ?? ""}`;
    const last = lastComputedRef.current;
    // একই সেটিংস + ১০ মি-এর কম নড়াচড়া → আগের ফলাফল (একই identity)
    if (
      last &&
      last.sig === sig &&
      !shouldEmitPositionChange(last.lat, last.lon, latitude, longitude)
    ) {
      return last;
    }

    const queryOpts = { enabledCategories, halalOnly };
    const fresh = {
      sig,
      lat: latitude,
      lon: longitude,
      center: { latitude, longitude },
      counts: getNearbyCounts(latitude, longitude, radius, queryOpts),
      items: activeCategory
        ? getNearbyItems(activeCategory, latitude, longitude, radius, queryOpts)
        : [],
    };
    lastComputedRef.current = fresh;
    return fresh;
    // enabledCategories অ্যারের বদলে স্থিতিশীল স্ট্রিং কী dep — identity churn এড়াতে
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, radius, enabledKey, halalOnly, activeCategory]);

  return {
    hasLocation: latitude !== null && longitude !== null,
    center: computed?.center ?? null,
    counts:
      computed?.counts ??
      ({
        gate: 0,
        hotel: 0,
        historical: 0,
        restaurant: 0,
        cafe: 0,
        toilet: 0,
        atm: 0,
        pharmacy: 0,
        mosque: 0,
      } satisfies NearbyCounts),
    items: computed?.items ?? [],
  };
}
