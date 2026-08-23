/**
 * বাঁকা চাপ (curved arc) — "আনুমানিক, রাস্তার তথ্য নেই" বোঝাতে ব্যবহৃত
 * ডটেড সংযোগকারীর জ্যামিতি। Google-এর মতো দেখাতে সংযোগকারীটি সরলরেখা
 * নয়, হালকা বাঁকানো হয়।
 *
 * অ্যালগোরিদম: স্থানীয়-সমতলে (lib/geo/plane) দ্বিঘাত বেজিয়ে (quadratic
 * Bezier) — জ্যার (chord) মাঝ বরাবর লম্বভাবে সরানো একটি কন্ট্রোল পয়েন্ট।
 * বাঁকের দিক স্থির (ডিটারমিনিস্টিক), যাতে টেস্ট ও পুনরায় রুট আঁকায়
 * রেখা লাফিয়ে দিক বদলায় না।
 */

import { metersOffset, offsetToLngLat, type LngLat } from "@/lib/geo/plane";
import { haversineDistance } from "@/lib/utils/distance";

export interface CurvedArcOptions {
  /** জ্যার দৈর্ঘ্যের কত অংশ লম্বভাবে বেঁকে যাবে (০ = সরলরেখা) */
  bowRatio?: number;
  /** বাঁকের সর্বোচ্চ অফসেট, মিটারে — লম্বা সংযোগকারীতে অতিরিক্ত ফুলে যাওয়া আটকায় */
  maxBowM?: number;
  /** নমুনার লক্ষ্য-ব্যবধান, মিটারে */
  sampleStepM?: number;
  /** ছোট সংযোগকারীতেও ডটগুলো মসৃণ দেখাতে সর্বনিম্ন নমুনা-সংখ্যা */
  minSamples?: number;
  /** কিলোমিটার-লম্বা সংযোগকারীতে (আনুমানিক পুরো রুট) সর্বোচ্চ নমুনা-সংখ্যা */
  maxSamples?: number;
  /** +1 = যাত্রার দিকের বাঁয়ে বাঁক, -1 = ডানে */
  bowSide?: 1 | -1;
}

export interface CurvedArc {
  /** [lng, lat] নমুনা-বিন্দু — MapLibre GeoJSON ক্রম */
  geometry: number[][];
  /** নমুনা-বিন্দুগুলোর মাঝে haversine দূরত্বের যোগফল, মিটারে */
  distance: number;
}

const DEFAULTS: Required<CurvedArcOptions> = {
  bowRatio: 0.12,
  maxBowM: 40,
  sampleStepM: 6,
  minSamples: 12,
  maxSamples: 256,
  bowSide: 1,
};

/**
 * `from` থেকে `to`-র একটি হালকা বাঁকানো চাপ। প্রান্ত দুটি হুবহু ইনপুট
 * বিন্দুই থাকে — ডটেড রেখা যেন রাস্তার শেষ বিন্দু ও গন্তব্য মার্কার
 * দুটোতেই নিখুঁত লেগে থাকে।
 */
export function curvedArc(
  from: [number, number],
  to: [number, number],
  options: CurvedArcOptions = {}
): CurvedArc {
  const { bowRatio, maxBowM, sampleStepM, minSamples, maxSamples, bowSide } = {
    ...DEFAULTS,
    ...options,
  };

  const base: LngLat = { lng: from[0], lat: from[1] };
  const chord = metersOffset(base, { lng: to[0], lat: to[1] });
  const chordM = Math.hypot(chord.east, chord.north);

  // অভিন্ন/শূন্য-দূরত্বের বিন্দু — ফাঁপা জ্যামিতি নয়, চাপ নয়।
  if (chordM <= 0) {
    return {
      geometry: [
        [from[0], from[1]],
        [to[0], to[1]],
      ],
      distance: 0,
    };
  }

  const bowM = Math.min(bowRatio * chordM, maxBowM) * bowSide;
  // জ্যার লম্বদিকে (বাঁয়ে) ঘোরানো একক ভেক্টর: (-north, east)।
  const control = {
    east: chord.east / 2 + (-chord.north / chordM) * bowM,
    north: chord.north / 2 + (chord.east / chordM) * bowM,
  };

  const samples = Math.min(Math.max(Math.ceil(chordM / sampleStepM) + 1, minSamples), maxSamples);

  const geometry: number[][] = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const inv = 1 - t;
    // দ্বিঘাত বেজিয়ে: B(t) = (1-t)²·P0 + 2(1-t)t·C + t²·P1 (P0 = origin)।
    const east = 2 * inv * t * control.east + t * t * chord.east;
    const north = 2 * inv * t * control.north + t * t * chord.north;
    geometry.push(offsetToLngLat(base, east, north));
  }

  // রূপান্তর-গণিতে (মিটার -> ডিগ্রি -> মিটার) ভাসমান-পয়েন্ট জমা সামান্য
  // অসঙ্গতি রাখতে পারে — প্রান্ত দুটি হুবহু বসিয়ে দেওয়া হয় যাতে চাপ
  // কখনো মার্কার/রাস্তার বিন্দু থেকে সরে না যায়।
  geometry[0] = [from[0], from[1]];
  geometry[samples - 1] = [to[0], to[1]];

  let distance = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    distance += haversineDistance(
      geometry[i][1],
      geometry[i][0],
      geometry[i + 1][1],
      geometry[i + 1][0]
    );
  }

  return { geometry, distance };
}
