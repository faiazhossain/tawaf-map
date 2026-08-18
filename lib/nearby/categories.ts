import type { LucideIcon } from "lucide-react";
import {
  DoorOpen,
  Hotel,
  Landmark,
  Utensils,
  Coffee,
  Toilet,
  Banknote,
  Pill,
  MoonStar,
} from "lucide-react";
import type { NearbyCategory } from "@/types/nearby";

/**
 * চিপ-বার, মার্কার ও লেবেলের একক রেজিস্ট্রি — ক্রম এটাই প্রদর্শনের ক্রম।
 * gate → হারামের গেট, hotel → NEARBY_HOTELS, historical → মক্কার tourist places,
 * বাকি ছয়টি DEMO_POIS থেকে।
 */
export interface NearbyCategoryMeta {
  id: NearbyCategory;
  /** চিপের বাংলা লেবেল (একবচন): "গেট", "হোটেল"… */
  label: string;
  /** সংখ্যাসহ চিপ টেক্সটের জন্য বহুবচন রূপ */
  plural: string;
  icon: LucideIcon;
}

/** প্রদর্শন-ক্রমে সব বিভাগের id (zero-init ও ডিফল্ট-সেট উভয়েই ব্যবহৃত) */
export const NEARBY_CATEGORY_IDS: readonly NearbyCategory[] = [
  "hotel",
  "gate",
  "historical",
  "restaurant",
  "cafe",
  "toilet",
  "atm",
  "pharmacy",
  "mosque",
];

export const NEARBY_CATEGORIES: readonly NearbyCategoryMeta[] = [
  { id: "hotel", label: "হোটেল", plural: "হোটেল", icon: Hotel },
  { id: "gate", label: "গেট", plural: "গেট", icon: DoorOpen },
  { id: "historical", label: "ঐতিহাসিক স্থান", plural: "ঐতিহাসিক স্থান", icon: Landmark },
  { id: "restaurant", label: "রেস্টুরেন্ট", plural: "রেস্টুরেন্ট", icon: Utensils },
  { id: "cafe", label: "ক্যাফে", plural: "ক্যাফে", icon: Coffee },
  { id: "toilet", label: "টয়লেট", plural: "টয়লেট", icon: Toilet },
  { id: "atm", label: "এটিএম", plural: "এটিএম", icon: Banknote },
  { id: "pharmacy", label: "ফার্মেসি", plural: "ফার্মেসি", icon: Pill },
  { id: "mosque", label: "মসজিদ", plural: "মসজিদ", icon: MoonStar },
];

export const DEFAULT_ENABLED_CATEGORIES: NearbyCategory[] = [...NEARBY_CATEGORY_IDS];

export const NEARBY_CATEGORY_META: Record<NearbyCategory, NearbyCategoryMeta> = Object.fromEntries(
  NEARBY_CATEGORIES.map((category) => [category.id, category])
) as Record<NearbyCategory, NearbyCategoryMeta>;

/** খাদ্য-বিভাগ — halalOnly ফিল্টার শুধু এদের ওপর প্রযোজ্য */
export const NEARBY_FOOD_CATEGORIES: readonly NearbyCategory[] = ["restaurant", "cafe"];

export function isNearbyFoodCategory(category: NearbyCategory): boolean {
  return NEARBY_FOOD_CATEGORIES.includes(category);
}
