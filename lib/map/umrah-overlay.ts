/**
 * ওমরাহ আনুষ্ঠানিক ওভারলে - GeoJSON জ্যামিতি ও লেয়ার কনফিগ
 *
 * ইনডোর স্যাটেলাইট ডিটেল দুর্বল হওয়ায় মসজিদুল হারামের ভেতরের আনুষ্ঠানিক স্থানগুলো
 * একটি স্কিমেটিক ওভারলে হিসেবে আঁকা হয় (পরিকল্পনা ধারা 6)। সব জ্যামিতি বিশুদ্ধ ফাংশন
 * থেকে তৈরি, তাই সহজে পরীক্ষাযোগ্য।
 *
 * স্থানাঙ্ক [lng, lat]। দূরত্ব মিটার থেকে ডিগ্রি রূপান্তরে অক্ষাংশের প্রভাব ধরা হয়েছে।
 */

import { UMRAH_ANCHORS } from "@/lib/data/umrah/anchors";
import { MAP_COLORS, RITUAL_STATE_COLORS } from "@/lib/map/colors";

const DEG_PER_M_LAT = 1 / 110540; // অক্ষাংশ ১ মিটার ≈ এত ডিগ্রি

/** অক্ষাংশ অনুযায়ী দ্রাঘিমাংশে ১ মিটারের ডিগ্রি মান */
function degPerMLng(lat: number): number {
  return 1 / (111320 * Math.cos((lat * Math.PI) / 180));
}

/** কেন্দ্র ও ব্যাসার্ধ থেকে বৃত্তের বহুভুজ স্থানাঙ্ক (বন্ধ রিং) */
export function circleCoordinates(
  center: [number, number],
  radiusM: number,
  steps = 64
): number[][] {
  const [lng, lat] = center;
  const rLng = radiusM * degPerMLng(lat);
  const rLat = radiusM * DEG_PER_M_LAT;
  const ring: number[][] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    ring.push([lng + rLng * Math.cos(angle), lat + rLat * Math.sin(angle)]);
  }
  ring.push(ring[0]);
  return ring;
}

/** কেন্দ্র ও দুই ব্যাসার্ধ থেকে উপবৃত্তের রৈখিক স্থানাঙ্ক (তওয়াফ রিং-এর জন্য, বিঘর্ষণ ছাড়া) */
export function ellipseRingCoordinates(
  center: [number, number],
  radiusXM: number,
  radiusYM: number,
  steps = 64
): number[][] {
  const [lng, lat] = center;
  const rLng = radiusXM * degPerMLng(lat);
  const rLat = radiusYM * DEG_PER_M_LAT;
  const ring: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    ring.push([lng + rLng * Math.cos(angle), lat + rLat * Math.sin(angle)]);
  }
  return ring;
}

// ---------------------------------------------------------------------------
// স্থানাঙ্ক (কাবা কেন্দ্র)
// ---------------------------------------------------------------------------

const KAABA_CENTER: [number, number] = [39.8262, 21.4225];

/**
 * সাঈ করিডোরের পলিলাইন (সাফা -> মারওয়া -> সাফা) - প্রকৃত মাসআ করিডোরের জিওজেসন
 * থেকে নেওয়া। দুটি লেনের গোলাকার পথ; দক্ষিণ প্রান্তে সাফা, উত্তর প্রান্তে মারওয়া।
 * স্থির লেয়ার (createRitualOverlayGeoJSON) ও অ্যানিমেশন (সাঈ অগ্রগতি/দিক তীর) একই
 * উৎস ব্যবহার করে, যাতে আঁকা পথ আর অ্যানিমেশন কখনো আলাদা না হয়।
 */
const SAI_CORRIDOR_PATH: [number, number][] = [
  [39.827404, 21.4217662], // সাফা (দক্ষিণ প্রান্ত)
  [39.8274774, 21.4217577],
  [39.8275553, 21.4218089],
  [39.8275874, 21.4219156],
  [39.8275553, 21.4221589],
  [39.8272478, 21.4251221],
  [39.8272238, 21.4252623],
  [39.8271756, 21.4252988],
  [39.8271296, 21.4252979], // মারওয়া (উত্তর প্রান্ত - ঘুরে ফেরার বিন্দু)
  [39.8270943, 21.4252988],
  [39.8270431, 21.4252707],
  [39.8270039, 21.425209],
  [39.8271046, 21.4243134],
  [39.827236, 21.4229954],
  [39.82736, 21.4217861],
  [39.8273819, 21.4217725], // সাফায় ফিরে
];

/** সাফা -> মারওয়া গামী (পূর্ব লেন) অংশ (সূচক ০..৮)। */
const SAI_OUTBOUND: [number, number][] = SAI_CORRIDOR_PATH.slice(0, 9);

/** মারওয়া -> সাফা গামী (পশ্চিম লেন) অংশ (সূচক ৮..১২; ইতিমধ্যে মারওয়া->সাফা ক্রমে)। */
const SAI_RETURN: [number, number][] = SAI_CORRIDOR_PATH.slice(8);

// ---------------------------------------------------------------------------
// লেয়ার/সোর্স আইডি
// ---------------------------------------------------------------------------

export const UMRAH_OVERLAY_SOURCE = "umrah-overlay";
export const UMRAH_SACRED_SOURCE = "umrah-sacred-points";
export const UMRAH_JOURNEY_SOURCE = "umrah-journey";

export const TAWAF_RING_LAYER = "umrah-tawaf-ring";
export const TAWAF_RING_CASING_LAYER = "umrah-tawaf-ring-casing";
export const KAABA_FOOTPRINT_LAYER = "umrah-kaaba";
export const HATEEM_LAYER = "umrah-hateem";
export const SAI_CORRIDOR_LAYER = "umrah-sai-corridor";
export const SAI_GREEN_ZONES_LAYER = "umrah-sai-green-zones";
export const SACRED_POINTS_LAYER = "umrah-sacred-points";
export const UMRAH_JOURNEY_LAYER = "umrah-journey-line";

// ---------------------------------------------------------------------------
// জ্যামিতি নির্মাণ
// ---------------------------------------------------------------------------

/** সম্পূর্ণ আনুষ্ঠানিক ওভারলে-এর GeoJSON FeatureCollection (কাবা, হাতিম, তওয়াফ রিং, সাঈ) */
export function createRitualOverlayGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: [
      // কাবা গৃহের পাদচিহ্ন (~১১ x ১৩ মি)
      {
        type: "Feature" as const,
        properties: { kind: "kaaba" },
        geometry: {
          type: "Polygon" as const,
          coordinates: [rectangleRing(KAABA_CENTER, 11, 13, 0)],
        },
      },
      // হিজরে ইসমাইল / হাতিম (কাবার উত্তরে অর্ধচন্দ্রাকার, আনুমানিক)
      {
        type: "Feature" as const,
        properties: { kind: "hateem" },
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            circleCoordinates([KAABA_CENTER[0], KAABA_CENTER[1] + 0.00003], 9, 48).filter(
              (_, i, arr) => i < arr.length / 2 + 1 // উত্তর অর্ধেক রাখা
            ),
          ],
        },
      },
      // তওয়াফ রিং (কাবা+হাতিম ঘিরে উপবৃত্তাকার পথ)
      {
        type: "Feature" as const,
        properties: { kind: "tawaf-ring" },
        geometry: {
          type: "LineString" as const,
          coordinates: ellipseRingCoordinates(KAABA_CENTER, 20, 18, 64),
        },
      },
      // সাঈ করিডোর (সাফা -> মারওয়া) - SAI_CORRIDOR_PATH থেকে (স্থির লেয়ার ও অ্যানিমেশন একই পথ)।
      {
        type: "Feature" as const,
        properties: { kind: "sai-corridor" },
        geometry: {
          type: "LineString" as const,
          coordinates: SAI_CORRIDOR_PATH,
        },
      },
      // সাঈ-এর দুই সবুজ মাইলের জোন (দৌড়ের অংশ)
      {
        type: "Feature" as const,
        properties: { kind: "sai-green" },
        geometry: {
          type: "Polygon" as const,
          coordinates: [
            (() => {
              const midLng = 39.8273;
              const latStart = 21.4232;
              const latEnd = 21.424;
              const rLng = 3 * degPerMLng(21.4236);
              return [
                [midLng - rLng, latStart],
                [midLng - rLng, latEnd],
                [midLng + rLng, latEnd],
                [midLng + rLng, latStart],
                [midLng - rLng, latStart],
              ];
            })(),
          ],
        },
      },
    ],
  };
}

/** দুই সবুজ মাইলের জোন (পৃথক সোর্স প্রয়োজন হলে) - প্রস্থসহ বহুভুজ */
export function createSaiGreenZonesGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: createRitualOverlayGeoJSON().features.filter(
      (f) => f.properties.kind === "sai-green"
    ),
  };
}

/** আয়তাকার বহুভুজের বন্ধ রিং (কাবার পাদচিহ্নের জন্য) */
function rectangleRing(
  center: [number, number],
  widthM: number,
  heightM: number,
  rotationDeg: number
): number[][] {
  const [lng, lat] = center;
  const halfW = (widthM / 2) * degPerMLng(lat);
  const halfH = (heightM / 2) * DEG_PER_M_LAT;
  // rotationDeg বর্তমানে উপেক্ষিত (কাবার প্রকৃত ঘূর্ণন সামান্য); সরল অক্ষ-সমান্তরাল আয়ত
  void rotationDeg;
  return [
    [lng - halfW, lat - halfH],
    [lng + halfW, lat - halfH],
    [lng + halfW, lat + halfH],
    [lng - halfW, lat + halfH],
    [lng - halfW, lat - halfH],
  ];
}

// ---------------------------------------------------------------------------
// লেয়ার কনফিগ
// ---------------------------------------------------------------------------

/** তওয়াফ রিং লেয়ার (emerald রেখা — --map-route) */
export const tawafRingLayer = {
  id: TAWAF_RING_LAYER,
  type: "line",
  filter: ["==", ["get", "kind"], "tawaf-ring"],
  paint: {
    "line-color": MAP_COLORS.route,
    "line-width": 4,
    "line-opacity": 0.85,
    "line-dasharray": [1, 0.5],
  },
  layout: { "line-cap": "round", "line-join": "round" },
} as const;

/** তওয়াফ রিং-এর ক্যাসিং (সাদা নিচের স্তর) */
export const tawafRingCasingLayer = {
  id: TAWAF_RING_CASING_LAYER,
  type: "line",
  filter: ["==", ["get", "kind"], "tawaf-ring"],
  paint: {
    "line-color": MAP_COLORS.casing,
    "line-width": 7,
    "line-opacity": 0.5,
  },
  layout: { "line-cap": "round", "line-join": "round" },
} as const;

/** কাবা পাদচিহ্ন (উষ্ণ সোনালি পূরণ) */
export const kaabaFootprintLayer = {
  id: KAABA_FOOTPRINT_LAYER,
  type: "fill",
  filter: ["==", ["get", "kind"], "kaaba"],
  paint: {
    "fill-color": "#1f2937", // slate-800 (কালো গিলাফের প্রতীক)
    "fill-opacity": 0.9,
  },
} as const;

/** হাতিম পূরণ */
export const hateemLayer = {
  id: HATEEM_LAYER,
  type: "fill",
  filter: ["==", ["get", "kind"], "hateem"],
  paint: {
    "fill-color": "#92400e", // amber-800
    "fill-opacity": 0.4,
  },
} as const;

/** সাঈ করিডোর (emerald রেখা — --map-route; আগে সায়ান ছিল) */
export const saiCorridorLayer = {
  id: SAI_CORRIDOR_LAYER,
  type: "line",
  filter: ["==", ["get", "kind"], "sai-corridor"],
  paint: {
    "line-color": MAP_COLORS.route,
    "line-width": 4,
    "line-opacity": 0.85,
  },
  layout: { "line-cap": "round", "line-join": "round" },
} as const;

/** সাঈ-এর সবুজ মাইল জোন */
export const saiGreenZonesLayer = {
  id: SAI_GREEN_ZONES_LAYER,
  type: "fill",
  filter: ["==", ["get", "kind"], "sai-green"],
  paint: {
    "fill-color": "#22c55e", // green-500
    "fill-opacity": 0.35,
  },
} as const;

/** পবিত্র বিন্দু (উষ্ণ সোনালি - কালো পাথর, মাকামে ইবরাহিম ইত্যাদি) */
export const sacredPointsLayer = {
  id: SACRED_POINTS_LAYER,
  type: "circle",
  paint: {
    "circle-radius": 6,
    "circle-color": "#f59e0b", // amber-500 (উষ্ণ সোনালি)
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
  },
} as const;

/** ধাপের যাত্রা রেখা (সম্পন্ন ধাপের মধ্যে বিচ্ছিন্ন রেখা) */
export const umrahJourneyLayer = {
  id: UMRAH_JOURNEY_LAYER,
  type: "line",
  paint: {
    "line-color": MAP_COLORS.route,
    "line-width": 3,
    "line-opacity": 0.7,
    "line-dasharray": [2, 2],
  },
  layout: { "line-cap": "round", "line-join": "round" },
} as const;

/**
 * সমস্ত আনুষ্ঠানিক লেয়ার কনফিগের তালিকা (MapView যোগ/অপসারণের জন্য)।
 * তওয়াফ রিং ও সাঈ করিডোর একক আনুষ্ঠানিক পথ হিসেবে দেখানো হয়; প্রতিটি পূর্ণ চক্কর/পাক
 * সম্পন্ন হলে জীবন্ত অঙ্কন অ্যানিমেশন (useRitualDrawAnimation) পুরো পথ ধরে হাজি হাঁটায়।
 */
export const UMRAH_RITUAL_LAYERS = [
  tawafRingCasingLayer,
  tawafRingLayer,
  kaabaFootprintLayer,
  hateemLayer,
  saiGreenZonesLayer,
  saiCorridorLayer,
] as const;

/** পবিত্র বিন্দুগুলোর GeoJSON FeatureCollection (UMRAH_ANCHORS থেকে) */
export function createSacredPointsGeoJSON() {
  return {
    type: "FeatureCollection" as const,
    features: UMRAH_ANCHORS.map((anchor) => ({
      type: "Feature" as const,
      properties: { id: anchor.id, name: anchor.name.bn, role: anchor.role },
      geometry: {
        type: "Point" as const,
        coordinates: anchor.location.coordinates,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// তওয়াফ/সাঈ অগ্রগতি চাপ (৭ ভাগ) - সম্পন্ন/সক্রিয়/ভবিষ্যৎ অবস্থা
//
// সম্পূর্ণ বিশুদ্ধ জ্যামিতি - কোনো পার্শ্বপ্রভাব নেই, সহজে পরীক্ষাযোগ্য।
// ---------------------------------------------------------------------------

export type ArcState = "completed" | "active" | "future";

/** সাফা ও মারওয়ার স্থানাঙ্ক SAI_CORRIDOR_PATH-এর প্রান্তবিন্দু (anchors.ts-এর সাথে সঙগত)। */

/**
 * একটি উপবৃত্তকে `segments` সমান চাপে ভাগ করে। প্রতিটি চাপ একটি খোলা LineString
 * স্থানাঙ্ক বিন্দুর অ্যারে। কোণ বাড়ার দিক = মানচিত্রে ঘড়ির বিপরীত দিক (তওয়াফের দিক)।
 */
export function splitEllipseArcs(
  center: [number, number],
  radiusXM: number,
  radiusYM: number,
  segments = 7,
  startAngle = 0,
  ptsPerArc = 12
): number[][][] {
  const [lng, lat] = center;
  const rLng = radiusXM * degPerMLng(lat);
  const rLat = radiusYM * DEG_PER_M_LAT;
  const arcs: number[][][] = [];
  for (let s = 0; s < segments; s++) {
    const arc: number[][] = [];
    for (let i = 0; i <= ptsPerArc; i++) {
      const t = s + i / ptsPerArc;
      const angle = startAngle + (t / segments) * 2 * Math.PI;
      arc.push([lng + rLng * Math.cos(angle), lat + rLat * Math.sin(angle)]);
    }
    arcs.push(arc);
  }
  return arcs;
}

/** একটি সরল রেখাকে `segments` সমান ভাগে ভাগ করে (সাঈ করিডোরের জন্য)। */
export function splitLineSegments(
  start: [number, number],
  end: [number, number],
  segments = 7,
  ptsPerArc = 6
): number[][][] {
  const arcs: number[][][] = [];
  for (let s = 0; s < segments; s++) {
    const arc: number[][] = [];
    for (let i = 0; i <= ptsPerArc; i++) {
      const t = (s + i / ptsPerArc) / segments;
      arc.push([start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t]);
    }
    arcs.push(arc);
  }
  return arcs;
}

// ---------------------------------------------------------------------------
// পলিলাইন স্যাম্পলিং - সাঈ করিডোরের বাঁকা পথ অনুসরণ করতে (সরল রেখার বদলে)
// ---------------------------------------------------------------------------

/** পলিলাইনের ক্রমিক চাপ-দৈর্ঘ্য (মিটার): [0, d0, d0+d1, ...] */
function polylineCumulativeLengths(path: [number, number][]): number[] {
  const cum = [0];
  for (let i = 1; i < path.length; i++) {
    const [lng1, lat1] = path[i - 1];
    const [lng2, lat2] = path[i];
    const midLat = (lat1 + lat2) / 2;
    const dx = (lng2 - lng1) / degPerMLng(midLat); // মিটার
    const dy = (lat2 - lat1) / DEG_PER_M_LAT; // মিটার
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  return cum;
}

/** চাপ-দৈর্ঘ্য `dist` (মিটার) অনুযায়ী পলিলাইনের একটি বিন্দু (রৈখিক ইন্টারপোলেশন)। */
function pointAtArcLength(path: [number, number][], cum: number[], dist: number): [number, number] {
  const total = cum[cum.length - 1];
  if (dist <= 0) return [path[0][0], path[0][1]];
  if (dist >= total) return [path[path.length - 1][0], path[path.length - 1][1]];
  let i = 1;
  while (i < cum.length && cum[i] < dist) i++;
  const segLen = cum[i] - cum[i - 1];
  const frac = segLen > 0 ? (dist - cum[i - 1]) / segLen : 0;
  const [lng1, lat1] = path[i - 1];
  const [lng2, lat2] = path[i];
  return [lng1 + (lng2 - lng1) * frac, lat1 + (lat2 - lat1) * frac];
}

/**
 * পলিলাইনকে চাপ-দৈর্ঘ্য অনুযায়ী সমান-দূরত্বের `totalPoints` বিন্দুতে রিস্যাম্পল করে।
 * প্রথম ও শেষ বিন্দু অপরিবর্তিত থাকে। বিশুদ্ধ ফাংশন।
 */
export function densifyPolyline(path: [number, number][], totalPoints: number): number[][] {
  const cum = polylineCumulativeLengths(path);
  const total = cum[cum.length - 1];
  const out: number[][] = [];
  for (let i = 0; i < totalPoints; i++) {
    const t = totalPoints > 1 ? i / (totalPoints - 1) : 0;
    out.push(pointAtArcLength(path, cum, total * t));
  }
  return out;
}

/**
 * পলিলাইনকে `segments` সমান চাপ-দৈর্ঘ্যের ভাগে ভাগ করে (প্রতিটিতে `ptsPerArc + 1` বিন্দু)।
 * সাঈ করিডোরের বাঁকা পথ ধরে অগ্রগতি দেখাতে ব্যবহৃত। বিশুদ্ধ ফাংশন।
 */
export function splitPolylineSegments(
  path: [number, number][],
  segments = 7,
  ptsPerArc = 6
): number[][][] {
  const cum = polylineCumulativeLengths(path);
  const total = cum[cum.length - 1];
  const arcs: number[][][] = [];
  for (let s = 0; s < segments; s++) {
    const arc: number[][] = [];
    for (let i = 0; i <= ptsPerArc; i++) {
      const t = (s + i / ptsPerArc) / segments;
      arc.push(pointAtArcLength(path, cum, total * t));
    }
    arcs.push(arc);
  }
  return arcs;
}

/**
 * একটি চাপের অবস্থা নির্ধারণ। `current` = ১-থেকে-শুরু বর্তমান চক্কর/পাক নম্বর।
 *   index <  current-1 => সম্পন্ন (সবুজ)
 *   index === current-1 => সক্রিয় (টিল)
 *   index >  current-1 => ভবিষ্যৎ (ম্লান)
 */
export function arcState(index: number, current: number, max = 7): ArcState {
  const c = Math.max(1, Math.min(current, max));
  if (index < c - 1) return "completed";
  if (index === c - 1) return "active";
  return "future";
}

/**
 * তওয়াফ রিং-এর ৭ চাপের GeoJSON FeatureCollection (প্রতিটি `state` ও `index` ট্যাগসহ)।
 * `drawingLap` দিলে সেই চাপের state "drawing" হয় (স্থায়ী লেয়ারে লুকানো) - অঙ্কন অ্যানিমেশন
 * চলাকালীন এটি ব্যবহৃত হয় যাতে চাপটি শেষে সবুজ হয়ে "লক" করে।
 */
export function buildTawafProgressGeoJSON(current: number, max = 7, drawingLap?: number | null) {
  const arcs = splitEllipseArcs(KAABA_CENTER, 20, 18, max);
  return {
    type: "FeatureCollection" as const,
    features: arcs.map((coordinates, index) => ({
      type: "Feature" as const,
      properties: {
        state: index === drawingLap ? "drawing" : arcState(index, current, max),
        index,
      },
      geometry: { type: "LineString" as const, coordinates },
    })),
  };
}

/**
 * সাঈ করিডোরের ৭ ভাগের GeoJSON FeatureCollection (প্রতিটি `state` ও `index` ট্যাগসহ)।
 * `drawingLap` একইভাবে কাজ করে।
 */
export function buildSaiProgressGeoJSON(current: number, max = 7, drawingLap?: number | null) {
  // সাফা -> মারওয়া গামী পথ (SAI_OUTBOUND) ধরে সমান ভাগে অগ্রগতি।
  const arcs = splitPolylineSegments(SAI_OUTBOUND, max);
  return {
    type: "FeatureCollection" as const,
    features: arcs.map((coordinates, index) => ({
      type: "Feature" as const,
      properties: {
        state: index === drawingLap ? "drawing" : arcState(index, current, max),
        index,
      },
      geometry: { type: "LineString" as const, coordinates },
    })),
  };
}

/** একটি নির্দিষ্ট তওয়াফ চাপের ঘন স্থানাঙ্ক (অঙ্কন অ্যানিমেশনের জন্য, বিশুদ্ধ)। */
export function getTawafLapCoords(lapIndex: number, max = 7, ptsPerArc = 24): number[][] {
  return splitEllipseArcs(KAABA_CENTER, 20, 18, max, 0, ptsPerArc)[lapIndex] ?? [];
}

/** একটি নির্দিষ্ট সাঈ ভাগের ঘন স্থানাঙ্ক (অঙ্কন অ্যানিমেশনের জন্য, বিশুদ্ধ)। */
export function getSaiLapCoords(lapIndex: number, max = 7, ptsPerArc = 14): number[][] {
  return splitPolylineSegments(SAI_OUTBOUND, max, ptsPerArc)[lapIndex] ?? [];
}

/** সম্পূর্ণ তওয়াফ বৃত্তের ঘন স্থানাঙ্ক - এক পূর্ণ চক্কর, ঘড়ির বিপরীত দিকে (বিশুদ্ধ)। */
export function getTawafCircleCoords(pts = 72): number[][] {
  return ellipseRingCoordinates(KAABA_CENTER, 20, 18, pts);
}

/** সাঈ-এর সম্পূর্ণ করিডোরের ঘন স্থানাঙ্ক - এক পূর্ণ পাক (দিক অনুযায়ী, বিশুদ্ধ)। */
/**
 * সাঈ-এর করিডোরের ঘন স্থানাঙ্ক (এক পাক, দিক অনুযায়ী) - প্রকৃত পলিলাইন পথ অনুসরণ করে।
 * "safa-to-marwa" = পূর্ব লেন (SAI_OUTBOUND), "marwa-to-safa" = পশ্চিম লেন (SAI_RETURN)।
 * বিশুদ্ধ ফাংশন।
 */
export function getSaiCorridorCoords(
  direction: "safa-to-marwa" | "marwa-to-safa" = "safa-to-marwa",
  pts = 48
): number[][] {
  const path = direction === "marwa-to-safa" ? SAI_RETURN : SAI_OUTBOUND;
  return densifyPolyline(path, pts);
}

// ----- অগ্রগতি সোর্স আইডি -----
export const TAWAF_PROGRESS_SOURCE = "umrah-tawaf-progress";
export const SAI_PROGRESS_SOURCE = "umrah-sai-progress";

// ----- অঙ্কন (draw) অ্যানিমেশন সোর্স আইডি -----
export const TAWAF_DRAW_SOURCE = "umrah-tawaf-draw";
export const SAI_DRAW_SOURCE = "umrah-sai-draw";

/** খালি FeatureCollection (অঙ্কন সোর্সের প্রাথমিক/পরিষ্কার অবস্থা)। */
export const EMPTY_FEATURE_COLLECTION = {
  type: "FeatureCollection" as const,
  features: [],
};

/** অঙ্কন লেয়ারের চকচকে emerald রেখা - সক্রিয়ভাবে আঁকা চাপের জন্য (ট্রেসার)। */
export const drawLineLayerPaint = {
  "line-color": MAP_COLORS.route,
  "line-width": 6,
  "line-opacity": 0.95,
  "line-blur": 1,
} as const;

/**
 * একটি অগ্রগতি চাপ লেয়ার-সেট তৈরি করে (ভবিষ্যৎ/সম্পন্ন/সক্রিয়)। `prefix` ও `source`
 * আলাদা রাখলে একই কনফিগ তওয়াফ ও সাঈ-এর জন্য পুনঃব্যবহার করা যায়, লেয়ার id সংঘর্ষ ছাড়াই।
 */
export function createProgressLayerSet(prefix: string, source: string) {
  const ids = {
    future: `${prefix}-progress-future`,
    completed: `${prefix}-progress-completed`,
    active: `${prefix}-progress-active`,
  } as const;
  const layout = { "line-cap": "round", "line-join": "round" } as const;

  return {
    ids,
    future: {
      id: ids.future,
      type: "line" as const,
      source,
      filter: ["==", ["get", "state"], "future"],
      paint: {
        "line-color": RITUAL_STATE_COLORS.future,
        "line-width": 3,
        "line-opacity": 0.45,
        "line-dasharray": [2, 2],
      },
      layout,
    },
    completed: {
      id: ids.completed,
      type: "line" as const,
      source,
      filter: ["==", ["get", "state"], "completed"],
      paint: {
        "line-color": RITUAL_STATE_COLORS.completed,
        "line-width": 4,
        "line-opacity": 0.9,
      },
      layout,
    },
    active: {
      id: ids.active,
      type: "line" as const,
      source,
      filter: ["==", ["get", "state"], "active"],
      paint: {
        "line-color": RITUAL_STATE_COLORS.active,
        "line-width": 6,
        "line-opacity": 1,
      },
      layout,
    },
  };
}

// ---------------------------------------------------------------------------
// দিকনির্দেশক তীর (চেভরন) - সক্রিয় আনুষ্ঠানিক পথে হাঁটার দিক দেখায়
//
// সম্পূর্ণ বিশুদ্ধ জ্যামিতি - কোনো পার্শ্বপ্রভাব নেই, সহজে পরীক্ষাযোগ্য।
// ---------------------------------------------------------------------------

export const DIRECTION_ARROWS_SOURCE = "umrah-direction-arrows";
export const DIRECTION_ARROWS_LAYER = "umrah-direction-arrows-layer";
export const DIRECTION_ARROW_ICON = "umrah-chevron";

/**
 * দুটি [lng, lat] বিন্দুর মধ্যে প্রারম্ভিক বিয়ারিং (ডিগ্রি; ০ = উত্তর, ঘড়ির দিকে বাড়ে)।
 * বিশুদ্ধ ফাংশন - চেভরন ঘোরাতে ও পরীক্ষাযোগ্যতার জন্য ব্যবহৃত।
 */
export function bearing(a: [number, number], b: [number, number]): number {
  const toRad = Math.PI / 180;
  const phi1 = a[1] * toRad;
  const phi2 = b[1] * toRad;
  const dLambda = (b[0] - a[0]) * toRad;
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * সক্রিয় আনুষ্ঠানিক পথ বরাবর সমান ব্যবধানে `count`-টি চেভরন বিন্দু স্থাপন করে।
 * প্রতিটি বিন্দুতে `seq` (০..count-১, হাঁটার ক্রম) ও `bearing` (ওই বিন্দুতে স্থানীয় স্পর্শক
 * অনুযায়ী হাঁটার দিক, ডিগ্রি) ট্যাগ থাকে। `closed=true` হলে পথ বৃত্তাকার (তওয়াফ) -
 * শেষ থেকে শুরুতে ফেরাটা মোড়ানো হয়; নাহলে খোলা পথ (সাঈ করিডোর) ধরা হয়।
 *
 * `coords`-এর ক্রমই হাঁটার দিক নির্ধারণ করে - তাই বিপরীতমুখী (marwa→safa) পেতে কলার
 * উল্টানো স্থানাঙ্ক দিতে হবে। বিশুদ্ধ ফাংশন।
 */
export function buildDirectionArrowsGeoJSON(coords: number[][], count: number, closed = false) {
  type ArrowFeature = {
    type: "Feature";
    properties: { seq: number; bearing: number };
    geometry: { type: "Point"; coordinates: number[] };
  };
  const features: ArrowFeature[] = [];

  const n = coords.length;
  if (n < 2 || count <= 0) {
    return { type: "FeatureCollection" as const, features };
  }

  // স্থানীয় স্পর্শক (tangent) পেতে কত ধাপ সামনে তাকানো যাবে - ঘন coord-এ ~৬° পরিসর
  const step = Math.max(1, Math.round(n / 60));

  for (let i = 0; i < count; i++) {
    const t = i / count;
    const idx = closed ? Math.floor(t * n) % n : Math.min(n - 1, Math.floor(t * (n - 1)));

    let aIdx = idx;
    let bIdx = closed ? (idx + step) % n : Math.min(n - 1, idx + step);
    // খোলা পথের শেষ প্রান্তে পৌঁছালে পেছনে তাকিয়ে দিক নেওয়া (বিপরীত দিক)
    if (!closed && bIdx === aIdx) {
      aIdx = Math.max(0, idx - step);
      bIdx = idx;
    }

    features.push({
      type: "Feature",
      properties: {
        seq: i,
        bearing: bearing(coords[aIdx] as [number, number], coords[bIdx] as [number, number]),
      },
      geometry: { type: "Point", coordinates: coords[idx] },
    });
  }

  return { type: "FeatureCollection" as const, features };
}

/**
 * দিকনির্দেশক চেভরন সিম্বল লেয়ার - প্রতিটি চেভরন তার `bearing` অনুযায়ী ঘোরানো
 * (icon-rotation-alignment: map, তাই মানচিত্র ঘুরলেও দিক ঠিক থাকে)। অস্বচ্ছতা
 * useDirectionArrows হুক দ্বারা অ্যানিমেট করা হয় (prefers-reduced-motion-এ স্থির)।
 */
export const directionArrowsLayer = {
  id: DIRECTION_ARROWS_LAYER,
  type: "symbol",
  source: DIRECTION_ARROWS_SOURCE,
  layout: {
    "icon-image": DIRECTION_ARROW_ICON,
    "icon-size": 1.35,
    "icon-rotate": ["get", "bearing"],
    "icon-rotation-alignment": "map",
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  },
  paint: {
    "icon-opacity": 0.7,
  },
} as const;
