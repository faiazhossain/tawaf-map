// Canvas quality policy for the MapLibre WebGL context.
//
// Phones report devicePixelRatio up to 3 (some higher). At 3x the rasterizer
// shades ~9x the pixels of a 1x desktop for sharpness nobody can see on a
// hand-held screen, and MSAA (antialias) multiplies the fill cost again on
// top. Both are large, invisible costs on exactly the mid-range devices where
// the map feels "stuck" during pan/pinch.
//
// Policy:
//   - Cap the canvas backing resolution at 2x (MapLibre's maxPixelRatio).
//     Above 2x the extra density is imperceptible at hand distance.
//   - Enable MSAA only below 2x, where jaggies are actually visible (the
//     reason antialias was originally on) and the fill budget can afford it.

export const MAX_CANVAS_PIXEL_RATIO = 2;

export interface CanvasQualityOptions {
  antialias: boolean;
  maxPixelRatio: number;
}

/**
 * Resolve canvas quality options for a display's devicePixelRatio.
 * Spread directly into the maplibregl.Map constructor options.
 */
export function resolveCanvasQuality(devicePixelRatio: number): CanvasQualityOptions {
  return {
    antialias: devicePixelRatio < MAX_CANVAS_PIXEL_RATIO,
    maxPixelRatio: MAX_CANVAS_PIXEL_RATIO,
  };
}
