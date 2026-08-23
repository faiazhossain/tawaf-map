/**
 * সক্রিয় গেট ডেটাসেট নির্বাচন
 *
 * ডেমো-ওয়ার্ল্ড মোডে (`?demo-world=1`) মক্কার বেসামরিক ডেটা ঢাকায় স্থানান্তরকে
 * উচিতভাবে চালু রাখতে, গেটের ডেটা-উৎস হয় দুটির একটি:
 * - ডেমো: curated `HARAM_GATES` (demo-world কোঅর্ডিনেটে in-place মিউটেড)
 * - বাস্তব: Overpass-উত্পন্ন `GATES_OSM` (মসজিদের ~207 গেট)
 *
 * লাজি (lazy) রিড — এই মডিউলের ফাংশন যখন ডাকা হয় তখন `isDemoWorldActive()`
 * মূল্যায়ন হয়, তাই demo-world-এর পরবর্তী-ইন-প্লেস মিউটেশন ঠিক থাকে
 * (নিয়ম: lib/nearby/query.ts:31-33 দেখুন)। কোনো ইমপোর্ট-চক্র নেই: `GATES_OSM`
 * demo-world থেকে কিছুই আমদানি করে না।
 */

import { HARAM_GATES } from "@/lib/data/gates";
import { GATES_OSM } from "@/lib/data/gates-osm.generated";
import { isDemoWorldActive } from "@/lib/dev/demo-world";
import type { Gate } from "@/types/gate";

/** বর্তমান মোডে ব্যবহৃত গেট তালিকা (`Gate[]`) ফেরত দেয়। */
export function getActiveGates(): Gate[] {
  return isDemoWorldActive() ? HARAM_GATES : GATES_OSM;
}

/** id দিয়ে সক্রিয় তালিকা থেকে একটি গেট খোঁজে। */
export function getActiveGateById(id: string): Gate | undefined {
  return getActiveGates().find((g) => g.id === id);
}
