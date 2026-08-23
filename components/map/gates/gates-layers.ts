/**
 * গেট ভেক্টর-লেয়ার কনফিগ
 *
 * `gates.pmtiles`-এর `gates` লেয়ার থেকে মসজিদের গেট ড্র করা হয়।
 * Barikoi গ্লিফ Latin/সংখ্যা-শুধু — তাই টাইল-লেবেল ইংরেজি নাম + ref
 * ব্যবহার করে; বাংলা/আরবি শুধু পপআপে (ব্রাউজার ফন্ট) দেখানো হয়।
 *
 * শুধু ধ্রুবক/স্পেক — কোনো `map` ইনস্ট্যান্স বা ডোম এর উপর নির্ভর করে না।
 */
import type { FilterSpecification, LayerSpecification, SourceSpecification } from "maplibre-gl";

export const GATES_PMTILES_SOURCE_ID = "osm-gates-source";
export const GATES_PMTILES_LAYER_ID = "osm-gates-layer";
export const GATES_PMTILES_LABEL_ID = "osm-gates-label";
export const GATES_PMTILES_SELECTED_ID = "osm-gates-layer-selected";

/** গেট ভেক্টর-সোর্স (pmtiles প্রোটোকল URL)। */
export function gatesPmtilesSource(url: string): SourceSpecification {
  return {
    type: "vector",
    url,
  };
}

/** গেট বিন্দু (সার্কেল) লেয়ার। `interactive: true` যাতে ক্লিক ধরা যায়। */
export function gatesCircleLayer(): LayerSpecification {
  return {
    id: GATES_PMTILES_LAYER_ID,
    type: "circle",
    source: GATES_PMTILES_SOURCE_ID,
    "source-layer": "gates",
    paint: {
      "circle-radius": 5,
      "circle-color": "#5D665F",
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#FFFFFF",
      "circle-opacity": 0.9,
    },
  };
}

/** গেট লেবেল (ref/ইংরেজি নাম) লেয়ার — বিন্দুর উপরে। */
export function gatesLabelLayer(): LayerSpecification {
  return {
    id: GATES_PMTILES_LABEL_ID,
    type: "symbol",
    source: GATES_PMTILES_SOURCE_ID,
    "source-layer": "gates",
    minzoom: 14,
    layout: {
      "text-field": ["coalesce", ["get", "ref"], ["get", "name"]],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"] as any,
      "text-size": 11,
      "text-anchor": "top",
      "text-offset": [0, 0.7],
    },
    paint: {
      "text-color": "#333333",
      "text-halo-color": "#FFFFFF",
      "text-halo-width": 1,
    },
  };
}

/** ফিল্টার যা কোনো ফিচাররেই মেলে না — নির্বাচন না থাকলে হাইলাইট লুকানোর ডিফল্ট। */
export const NO_GATE_FILTER: FilterSpecification = ["==", ["get", "ogc_fid"], -1];

/**
 * নির্বাচিত গেট হাইলাইট — বেস সার্কেলের উপরে আলাদা এমারাল্ড বিন্দু।
 * ডিফল্ট ফিল্টার কাউকে মেলায় না; MapView-এর সিলেকশন ইফেক্ট `setFilter`-এ
 * নির্বাচিত গেটের `ogc_fid` (সংখ্যা) বসায়।
 */
export function gatesSelectedLayer(): LayerSpecification {
  return {
    id: GATES_PMTILES_SELECTED_ID,
    type: "circle",
    source: GATES_PMTILES_SOURCE_ID,
    "source-layer": "gates",
    filter: NO_GATE_FILTER,
    paint: {
      "circle-radius": 7,
      "circle-color": "#0F5C4D",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#FFFFFF",
    },
  };
}

/** নির্বাচিত গেটের id ("+osm-<ogc_fid>") থেকে টাইল-ফিল্টার বানায়। */
export function gateSelectionFilter(gateId: string | null | undefined): FilterSpecification {
  if (!gateId || !gateId.startsWith("+osm-")) return NO_GATE_FILTER;
  const fid = Number(gateId.slice("+osm-".length));
  if (Number.isNaN(fid)) return NO_GATE_FILTER;
  return ["==", ["get", "ogc_fid"], fid];
}
