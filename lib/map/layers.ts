/**
 * Map layer configurations for gates, POIs, routes, and user location
 */

import { MAP_COLORS } from "@/lib/map/colors";

// Gate marker layer
export const GATE_MARKER_LAYER_ID = "gate-markers";
export const GATE_LABEL_LAYER_ID = "gate-labels";

// POI marker layer
export const POI_MARKER_LAYER_ID = "poi-markers";
export const POI_LABEL_LAYER_ID = "poi-labels";

// Route layer
export const ROUTE_LAYER_ID = "active-route";
export const ROUTE_CASING_LAYER_ID = "active-route-casing";

// Dotted curved approach/approximate layer (route source "route-approach")
export const ROUTE_APPROACH_LAYER_ID = "active-route-approach";

// User location layer
export const USER_LOCATION_LAYER_ID = "user-location";
export const USER_ACCURACY_LAYER_ID = "user-accuracy";

// Hotel marker layer
export const HOTEL_MARKER_LAYER_ID = "hotel-markers";
export const HOTEL_LABEL_LAYER_ID = "hotel-labels";

// "Near me" radius ring layers
export const NEARBY_RADIUS_SOURCE_ID = "nearby-radius";
export const NEARBY_RADIUS_FILL_LAYER_ID = "nearby-radius-fill";
export const NEARBY_RADIUS_LINE_LAYER_ID = "nearby-radius-line";

/**
 * Radius ring paints — emerald guidance color: soft fill + dashed outline.
 */
export const nearbyRadiusFillPaint: any = {
  "fill-color": MAP_COLORS.route,
  "fill-opacity": 0.06,
};

export const nearbyRadiusLinePaint: any = {
  "line-color": MAP_COLORS.route,
  "line-width": 1.5,
  "line-opacity": 0.5,
  "line-dasharray": [2, 2],
};

/**
 * Gate marker paint properties
 */
export const gateMarkerPaint: any = {
  "circle-color": [
    "match",
    ["get", "type"],
    "king_fahd",
    "#3b82f6", // blue for King Fahd gates
    "umrah",
    "#22c55e", // green for Umrah gates
    "salah",
    "#f59e0b", // amber for Salah gates
    "#ef4444", // red fallback
  ],
  "circle-radius": 8,
  "circle-stroke-width": 2,
  "circle-stroke-color": "#ffffff",
};

/**
 * Gate marker paint properties when selected
 */
export const gateMarkerSelectedPaint: any = {
  "circle-color": [
    "match",
    ["get", "type"],
    "king_fahd",
    "#2563eb", // darker blue
    "umrah",
    "#16a34a", // darker green
    "salah",
    "#d97706", // darker amber
    "#dc2626", // darker red
  ],
  "circle-radius": 12,
  "circle-stroke-width": 3,
  "circle-stroke-color": "#ffffff",
};

/**
 * Route line paint properties — emerald guidance line (was blue #3b82f6).
 * Unified with ritual active line via --map-route token.
 */
export const routeLinePaint: any = {
  "line-color": MAP_COLORS.route,
  "line-width": 5,
  "line-opacity": 0.85,
};

/**
 * Route casing paint properties
 */
export const routeCasingPaint: any = {
  "line-color": MAP_COLORS.casing,
  "line-width": 8,
  "line-opacity": 0.9,
};

/**
 * Dotted approach paint — Google-style "walk the rest of the way" beads.
 * Round cap + a near-zero dash turns each dash into a circle: period
 * (0.05 + 2.2) * 4.5 ~= 10 px center-to-center, dot ~= 4.5 px. No casing —
 * a white halo's dashes cannot align with the dots, and emerald reads fine
 * on the light basemap by itself.
 */
export const routeApproachPaint: any = {
  "line-color": MAP_COLORS.route,
  "line-width": 4.5,
  "line-opacity": 0.9,
  "line-dasharray": [0.05, 2.2],
};

/**
 * User location paint properties — gold ("you" marker), was blue.
 */
export const userLocationPaint: any = {
  "circle-radius": 8,
  "circle-color": MAP_COLORS.pilgrim,
  "circle-stroke-width": 3,
  "circle-stroke-color": "#ffffff",
};

/**
 * User accuracy ring paint properties — gold tint (matches pilgrim marker).
 */
export const userAccuracyPaint: any = {
  "fill-color": MAP_COLORS.pilgrim,
  "fill-opacity": 0.15,
};

/**
 * Hotel marker paint properties - color by price level
 */
export const hotelMarkerPaint: any = {
  "circle-color": [
    "match",
    ["get", "priceLevel"],
    1,
    "#22c55e", // green - budget
    2,
    "#3b82f6", // blue - moderate
    3,
    "#f59e0b", // amber - expensive
    4,
    "#8b5cf6", // purple - luxury
    "#6b7280", // gray fallback
  ],
  "circle-radius": 10,
  "circle-stroke-width": 2,
  "circle-stroke-color": "#ffffff",
};

/**
 * Get layer configurations for a map instance
 */
export function getLayerConfigs() {
  return {
    gateMarkers: {
      id: GATE_MARKER_LAYER_ID,
      type: "circle",
      paint: gateMarkerPaint,
    },
    gateLabels: {
      id: GATE_LABEL_LAYER_ID,
      type: "symbol",
      layout: {
        "text-field": ["get", "name"] as any,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"] as any,
        "text-offset": [0, 1.25] as any,
        "text-anchor": "top" as any,
        "text-size": 12,
      } as any,
      paint: {
        "text-color": "#1f2937",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
    hotelMarkers: {
      id: HOTEL_MARKER_LAYER_ID,
      type: "circle",
      paint: hotelMarkerPaint,
    },
    hotelLabels: {
      id: HOTEL_LABEL_LAYER_ID,
      type: "symbol",
      layout: {
        "text-field": ["get", "name"] as any,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"] as any,
        "text-offset": [0, 1.25] as any,
        "text-anchor": "top" as any,
        "text-size": 11,
      } as any,
      paint: {
        "text-color": "#1f2937",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2,
      },
    },
    routeLine: {
      id: ROUTE_LAYER_ID,
      type: "line",
      paint: routeLinePaint,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    },
    routeCasing: {
      id: ROUTE_CASING_LAYER_ID,
      type: "line",
      paint: routeCasingPaint,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    },
    routeApproach: {
      id: ROUTE_APPROACH_LAYER_ID,
      type: "line",
      paint: routeApproachPaint,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    },
    userLocation: {
      id: USER_LOCATION_LAYER_ID,
      type: "circle",
      paint: userLocationPaint,
    },
    userAccuracy: {
      id: USER_ACCURACY_LAYER_ID,
      type: "fill",
      paint: userAccuracyPaint,
    },
  } as const;
}
