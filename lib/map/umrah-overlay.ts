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

/** সাফা ও মারওয়ার স্থানাঙ্ক (সাঈ করিডোরের দুই প্রান্ত - anchors.ts-এর সাথে সঙগত) */
const SAI_START: [number, number] = [39.82753, 21.42208]; // সাফা
const SAI_END: [number, number] = [39.8319, 21.42213]; // মারওয়া

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
  const arcs = splitLineSegments(SAI_START, SAI_END, max);
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
  return splitLineSegments(SAI_START, SAI_END, max, ptsPerArc)[lapIndex] ?? [];
}

/** সম্পূর্ণ তওয়াফ বৃত্তের ঘন স্থানাঙ্ক - এক পূর্ণ চক্কর, ঘড়ির বিপরীত দিকে (বিশুদ্ধ)। */
export function getTawafCircleCoords(pts = 72): number[][] {
  return ellipseRingCoordinates(KAABA_CENTER, 20, 18, pts);
}

/** সাঈ-এর সম্পূর্ণ করিডোরের ঘন স্থানাঙ্ক - এক পূর্ণ পাক (দিক অনুযায়ী, বিশুদ্ধ)। */
export function getSaiCorridorCoords(
  direction: "safa-to-marwa" | "marwa-to-safa" = "safa-to-marwa",
  pts = 48
): number[][] {
  const coords: number[][] = [];
  for (let i = 0; i <= pts; i++) {
    const t = i / pts;
    coords.push([
      SAI_START[0] + (SAI_END[0] - SAI_START[0]) * t,
      SAI_START[1] + (SAI_END[1] - SAI_START[1]) * t,
    ]);
  }
  return direction === "marwa-to-safa" ? [...coords].reverse() : coords;
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

/** অঙ্কন লেয়ারের চকচকে টিল রেখা - সক্রিয়ভাবে আঁকা চাপের জন্য। */
export const drawLineLayerPaint = {
  "line-color": "#5eead4", // teal-300 - উজ্জ্বল ট্রেসার
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
        "line-color": "#64748b", // slate-500 - ম্লান ভবিষ্যৎ
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
        "line-color": "#10b981", // emerald-500 - সম্পন্ন
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
        "line-color": "#2dd4bf", // teal-400 - সক্রিয়, সবচেয়ে গাঢ
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
