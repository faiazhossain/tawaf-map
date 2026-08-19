import { useMemo, useRef } from "react";
import { useLocationStore } from "@/lib/store";
import {
  NEARBY_LIVE_MIN_DELTA_M,
  NEARBY_NEAR_THRESHOLD_M,
  NEARBY_TREND_DEADBAND_M,
  nearbyLiveFields,
  nextDistanceTrend,
  shouldEmitPositionChange,
} from "@/lib/nearby/query";
import type { NearbyItem, NearbyLiveFields, NearbyLiveTrend } from "@/types/nearby";

/**
 * একটি আইটেমের লাইভ দূরত্ব-ফিল্ড — ডিসপ্লে-টিয়ার।
 *
 * useNearbyPlaces-এর ১০ মি হিস্টেরেসিস কাঠামো ধরে রাখে (তালিকার সদস্যতা/ক্রম,
 * মার্কার, বৃত্ত — চার্ন এড়াতে); এই হুক প্রতি দেখানো আইটেমে শুধু লেখা সজীন রাখে:
 * locationStore-এর lat/lon থেকে প্রতি ~২ মি নড়াচড়ায় সেই আইটেমের দূরত্ব/সময়/
 * দিক পুনর্গণনা। ব্যাসার্ধ-নিরপেক্ষ, তাই ডিটেইল শিটের স্ন্যাপশট ব্যাসার্ধ ছাড়িয়ে
 * গেলেও দূরত্ব বাড়তে/কমতে থাকে।
 *
 * ট্রেন্ড ডেডব্যান্ডসহ — জিটারে "কাছে/দূরে" বারবার বদলায় না। ফিক্স না থাকলে
 * আইটেমের স্ন্যাপশট ফিল্ডই দেখায় (শিট অক্ষত থাকে)।
 */

export interface UseLiveNearbyItemOptions {
  /** ডিসপ্লে-টিয়ার নির্গমন সীমা (মিটার); ডিফল্ট NEARBY_LIVE_MIN_DELTA_M */
  minDeltaMeters?: number;
  /** ট্রেন্ড-ফ্লিপের ডেডব্যান্ড (মিটার); ডিফল্ট NEARBY_TREND_DEADBAND_M */
  trendDeadbandMeters?: number;
  /** "প্রায় পৌঁছে গেছেন" দূরত্ব-সীমা (মিটার); ডিফল্ট NEARBY_NEAR_THRESHOLD_M */
  nearThresholdMeters?: number;
}

export interface NearbyLiveItemState extends NearbyLiveFields {
  trend: NearbyLiveTrend;
  isNear: boolean;
  hasLocation: boolean;
}

export function useLiveNearbyItem(
  item: NearbyItem | null,
  options: UseLiveNearbyItemOptions = {}
): NearbyLiveItemState {
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);

  const minDeltaMeters = options.minDeltaMeters ?? NEARBY_LIVE_MIN_DELTA_M;
  const trendDeadbandMeters = options.trendDeadbandMeters ?? NEARBY_TREND_DEADBAND_M;
  const nearThresholdMeters = options.nearThresholdMeters ?? NEARBY_NEAR_THRESHOLD_M;

  const coordsKey = item ? item.coordinates.join(",") : "";

  const lastComputedRef = useRef<{
    coordsKey: string;
    lat: number;
    lon: number;
    /** ট্রেন্ড শেষ ফ্লিপের দূরত্ব — ডেডব্যান্ড এর থেকে মাপা হয় (শেষ নির্গমন নয়) */
    anchor: number;
    state: NearbyLiveItemState;
  } | null>(null);

  const computed = useMemo(() => {
    if (item === null || latitude === null || longitude === null) return null;

    const last = lastComputedRef.current;
    // একই আইটেম + ২ মি-এর কম নড়াচড়া → আগের ফলাফল (একই identity, রি-রেন্ডার নেই)
    if (
      last &&
      last.coordsKey === coordsKey &&
      !shouldEmitPositionChange(last.lat, last.lon, latitude, longitude, minDeltaMeters)
    ) {
      return last.state;
    }

    // নতুন আইটেমে ট্রেন্ড/নোঙর রিসেট — আগের আইটেমের অবস্থা বহন হয় না
    const sameItem = last !== null && last.coordsKey === coordsKey;
    const previousTrend: NearbyLiveTrend = sameItem ? last.state.trend : null;
    const previousAnchor: number | null = sameItem ? last.anchor : null;

    const fields = nearbyLiveFields(item.coordinates, latitude, longitude);
    const { trend, anchor } = nextDistanceTrend(
      previousTrend,
      previousAnchor,
      fields.distance,
      trendDeadbandMeters
    );

    const fresh: NearbyLiveItemState = {
      ...fields,
      trend,
      isNear: fields.distance < nearThresholdMeters,
      hasLocation: true,
    };
    lastComputedRef.current = {
      coordsKey,
      lat: latitude,
      lon: longitude,
      anchor,
      state: fresh,
    };
    return fresh;
    // সংখ্যা-অপশন dep-এ স্থিতিশীল আদিম মান — ইনলাইন অবজেক্ট পাস করলে প্রতি
    // রেন্ডারে বদলায়; কলাররা ধ্রুবক/মডিউল-স্কোপ মান দেয়।
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, coordsKey, minDeltaMeters, trendDeadbandMeters, nearThresholdMeters]);

  if (item === null) {
    return {
      distance: 0,
      distanceFormatted: "",
      walkingTime: 0,
      walkingTimeFormatted: "",
      bearing: 0,
      direction: "",
      trend: null,
      isNear: false,
      hasLocation: false,
    };
  }

  // ফিক্স নেই → স্ন্যাপশট ফিল্ড (শিট খোলা থাকলে হিমায়িত, শূন্য নয়)
  return (
    computed ?? {
      distance: item.distance,
      distanceFormatted: item.distanceFormatted,
      walkingTime: item.walkingTime,
      walkingTimeFormatted: item.walkingTimeFormatted,
      bearing: item.bearing,
      direction: item.direction,
      trend: null,
      isNear: item.distance < nearThresholdMeters,
      hasLocation: false,
    }
  );
}
