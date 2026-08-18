import type { Gate } from "./gate";
import type { Hotel } from "./hotel";
import type { TouristPlace } from "./tourist-place";
import type { POI } from "./poi";

/**
 * "আমার কাছে" (Near Me) ফিচারের শেয়ার্ড টাইপ।
 * gate/hotel/historical আসে নিজেদের ডেটাসেট থেকে, বাকি ছয়টি DEMO_POIS থেকে।
 */
export type NearbyCategory =
  | "gate"
  | "hotel"
  | "historical"
  | "restaurant"
  | "cafe"
  | "toilet"
  | "atm"
  | "pharmacy"
  | "mosque";

/** কোয়েরি লেয়ার যেসব রেকর্ড ফেরত দিতে পারে */
export type NearbySource = Gate | Hotel | TouristPlace | POI;

export interface NearbyItem {
  /** মূল ডেটাসেটের id */
  id: string;
  category: NearbyCategory;
  /** প্রদর্শন-নাম (গেট/হোটেলে nameBn থাকলে সেটি, নাহলে name) */
  name: string;
  nameAr?: string;
  /** [lng, lat] — GeoJSON ক্রম */
  coordinates: [number, number];
  distance: number;
  distanceFormatted: string;
  walkingTime: number;
  walkingTimeFormatted: string;
  bearing: number;
  direction: string;
  rating?: number;
  /** ছোট এক লাইনের বিবরণ (যেমন "৩ তারা হোটেল", "হালাল • আরবি খাবার") */
  subtitle?: string;
  /** মূল রেকর্ড — ডিটেইল শিট/মোডাল এটি থেকে বিভাগ-ভিত্তিক তথ্য বানায় */
  source: NearbySource;
}

export type NearbyCounts = Record<NearbyCategory, number>;
