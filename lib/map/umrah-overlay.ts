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
      // সাঈ করিডোর (সাফা -> মারওয়া)
      {
        type: "Feature" as const,
        properties: { kind: "sai-corridor" },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [39.82753, 21.42208], // সাফা
            [39.8319, 21.42213], // মারওয়া
          ],
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
              const start: [number, number] = [39.829, 21.4221];
              const end: [number, number] = [39.8304, 21.4221];
              const rLng = 3 * degPerMLng(21.4221);
              return [
                [start[0], start[1] - rLng],
                [end[0], end[1] - rLng],
                [end[0], end[1] + rLng],
                [start[0], start[1] + rLng],
                [start[0], start[1] - rLng],
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

/** তওয়াফ রিং লেয়ার (টিল রেখা) */
export const tawafRingLayer = {
  id: TAWAF_RING_LAYER,
  type: "line",
  filter: ["==", ["get", "kind"], "tawaf-ring"],
  paint: {
    "line-color": "#14b8a6", // teal-500
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
    "line-color": "#ffffff",
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

/** সাঈ করিডোর (সায়ান রেখা) */
export const saiCorridorLayer = {
  id: SAI_CORRIDOR_LAYER,
  type: "line",
  filter: ["==", ["get", "kind"], "sai-corridor"],
  paint: {
    "line-color": "#06b6d4", // cyan-500
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
    "line-color": "#14b8a6",
    "line-width": 3,
    "line-opacity": 0.7,
    "line-dasharray": [2, 2],
  },
  layout: { "line-cap": "round", "line-join": "round" },
} as const;

/** সমস্ত আনুষ্ঠানিক লেয়ার কনফিগের তালিকা (MapView যোগ/অপসারণের জন্য) */
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
