/**
 * স্থানীয়-সমতল জ্যামিতি (local-plane geometry) — মিটার ও ডিগ্রির রূপান্তর।
 *
 * ছোট দূরত্বে (কয়েক কিলোমিটারের মধ্যে) পৃথিবীকে সমতল ধরে নেওয়া যায়;
 * প্রতিটি হিসাব একটি ভিত্তি বিন্দুর (base) পূর্ব/উত্তর মিটার অফসেটে চলে।
 * এই মডিউলটি `lib/dev/gps-sim` থেকে বের করা হয়েছে যাতে উৎপাদন কোড
 * (রুট প্রগ্রেস ইঞ্জিন) দেব-মডিউল ইমপোর্ট না করেও একই গণিত ব্যবহার করতে
 * পারে — gps-sim ইমপোর্ট করলে মডিউল লোডের সময়ই সিমুলেটর সক্রিয় হয়ে যায়।
 */

/** অক্ষাংশে প্রতি মিটারে ডিগ্রি (প্রায় ধ্রুবক, সমুদ্রপৃষ্ঠের কাছে)। */
export const DEG_PER_M_LAT = 1 / 110540;

/** দ্রাঘিমাংশে প্রতি মিটারে ডিগ্রি (অক্ষাংশভেদে পরিবর্তিত)। */
export function degPerMLng(lat: number): number {
  return 1 / (111320 * Math.cos((lat * Math.PI) / 180));
}

export interface LngLat {
  lng: number;
  lat: number;
}

/** `from` থেকে `to`-র স্থানীয়-সমতল অফসেট মিটারে (পূর্ব/উত্তর)। */
export function metersOffset(from: LngLat, to: LngLat): { east: number; north: number } {
  return {
    east: (to.lng - from.lng) / degPerMLng(from.lat),
    north: (to.lat - from.lat) / DEG_PER_M_LAT,
  };
}

/** `base` থেকে পূর্ব/উত্তর মিটার অফসেটকে আবার [lng, lat]-এ ফেরানো। */
export function offsetToLngLat(base: LngLat, eastM: number, northM: number): [number, number] {
  return [base.lng + eastM * degPerMLng(base.lat), base.lat + northM * DEG_PER_M_LAT];
}

export interface SegmentProjection {
  /** অভিক্ষেপ বিন্দুর (projection point) `a` থেকে পূর্ব/উত্তর মিটার অফসেট */
  east: number;
  north: number;
  /** `p` থেকে সেগমেন্টের বর্গ-দূরত্ব, বর্গ মিটারে */
  distanceSq: number;
  /** ০..১ ক্ল্যাম্পকৃত ভগ্নাংশ — `a` থেকে অভিক্ষেপ বিন্দুর অবস্থান */
  t: number;
}

/**
 * `p` বিন্দুর `a -> b` সেগমেন্টের ওপর সবচেয়ে কাছের বিন্দু (অভিক্ষেপ)।
 * তিনটি বিন্দুকেই `a`-কে ভিত্তি ধরে মিটারে রূপান্তর করে ডট-গুণন অভিক্ষেপ;
 * ভগ্নাংশ ০..১ এর বাইরে গেলে প্রান্তে ক্ল্যাম্প হয়।
 */
export function projectPointToSegment(p: LngLat, a: LngLat, b: LngLat): SegmentProjection {
  const ab = metersOffset(a, b);
  const ap = metersOffset(a, p);

  const abLenSq = ab.east * ab.east + ab.north * ab.north;
  // শূন্য-দৈর্ঘ্যের সেগমেন্ট: অভিক্ষেপ বিন্দুই `a`।
  const t = abLenSq === 0 ? 0 : (ap.east * ab.east + ap.north * ab.north) / abLenSq;
  const clamped = Math.min(1, Math.max(0, t));

  const east = ab.east * clamped;
  const north = ab.north * clamped;
  const dEast = ap.east - east;
  const dNorth = ap.north - north;

  return { east, north, distanceSq: dEast * dEast + dNorth * dNorth, t: clamped };
}
