import type { ModelTransform } from "./three-model-layer";

// Georeferencing + asset config for the Masjid Al-Haram 3D model layer.
//
// The GLB is a generic (non-georeferenced) model, so its real-world scale and
// heading are NOT baked into the file. The constants below are the single place
// to iterate alignment against the satellite basemap. See three-model-layer.ts
// for how they are consumed.
//
// HOW TO ALIGN A (NEW) MODEL
// --------------------------
// These constants are the source of truth — the 3D layer always renders them
// (the dev tuner widget + localStorage persistence are disabled; see MapView.tsx).
// Workflow: enable the dev tuner temporarily (instructions in MapView.tsx),
// adjust the sliders live against the satellite basemap, click "Copy config",
// paste the values into MODEL_ORIGIN / MODEL_CONFIG below, then re-disable the
// tuner. "Reset" in the tuner reverts to these baked values.

// maplibre custom-layer id. Stable so idempotent getLayer/addLayer checks work
// across React StrictMode's dev double-invoke and repeated toggles.
export const MODEL_LAYER_ID = "haram-3d-model";

// Where the model's origin sits on the globe: the Kaaba, [lng, lat].
// (Same coordinate as KAABA_CENTER in lib/map/umrah-overlay.ts and
// MAKKAH_CENTER in lib/utils/constants.ts, inlined here as a tuple because
// those are not exported / use a {lat,lng} object shape.)
export const MODEL_ORIGIN: [number, number] = [39.827352, 21.422073];

// URL the browser fetches. Use the same-origin Next.js proxy path so the
// browser avoids CORS issues with the LAN asset server.
export const MODEL_URL = "/models/masjid_al_haram_with_expansion.glb";

// Barikoi basemap layers that compete with the 3D model and are hidden while
// show3DModel is on: the flattened building polygons + extruded 3D buildings +
// the metro overlay. Kept here so style/IDs are in one place.
export const BASEMAP_3D_HIDDEN_LAYERS = [
  "building",
  "building-commercial",
  "building-3d",
  "building-3d-commercial",
  "building-metro",
];

// Tunables. Adjust by eye against the satellite basemap.
//
// Measured glTF metadata (bbox in model units, from the POSITION accessors):
//   size X=807  Y=406  Z=900   (Y is the smallest axis => standard Y-up)
// The ~900-unit max dimension matches the full Masjid Al-Haram complex *with
// expansion* (~900m across), so the model is authored in meters and
// scaleMultiplier = 1 places the footprint at real-world size.
//   - scaleMultiplier: keep 1 unless the footprint is clearly too big/small vs
//     the satellite mosque outline (pure visual factor).
//   - Position: MODEL_CENTER auto-recenters the model on its bbox center over
//     the Kaaba. If it's still shifted vs the satellite outline, nudge with
//     offsetEastMeters / offsetNorthMeters below (east/north positive).
//   - rotateZ: HEADING alignment with true north. Start at 0, nudge in ~5deg
//     (0.087 rad) steps. The mosque's long axis runs roughly NW-SE.
//   - altitudeMeters: ground altitude for the model's base (meters). The render
//     layer lifts the model's lowest bbox point onto this altitude each frame;
//     0 places the base on the map surface (matching the official three.js
//     example). Negative values sit the base below the surface.
//   - rotateX: Math.PI / 2 tilts a standard Y-up export upright. Revisit only
//     if the model renders lying flat (use 0) or upside-down (use -PI/2).
// The model's geometric (bbox) center in its local space, computed from the
// POSITION accessor min/max. The local origin is offset from this by a few
// hundred meters, so we recenter on the bbox center to land the model on the
// Kaaba instead of hundreds of meters off.
export const MODEL_CENTER: [number, number, number] = [26.26, -186.19, 53.89];

export const MODEL_CONFIG = {
  altitudeMeters: -281,
  rotateX: 0.99,
  rotateY: 1.0734,
  rotateZ: 0.5184,
  scaleMultiplier: 1.0,
  // Fine-tune position against the satellite basemap (meters). 0 once centered.
  offsetEastMeters: -260,
  offsetNorthMeters: 292,
} as const;

/**
 * Build the initial (mutable) transform for the 3D model layer, seeded from the
 * constants above. The layer uses this for every load (dev tuning is disabled).
 * If you re-enable the dev tuning widget, its "Reset" builds from here too.
 */
export function buildInitialModelTransform(): ModelTransform {
  return {
    originLng: MODEL_ORIGIN[0],
    originLat: MODEL_ORIGIN[1],
    altitudeMeters: MODEL_CONFIG.altitudeMeters,
    rotateX: MODEL_CONFIG.rotateX,
    rotateY: MODEL_CONFIG.rotateY,
    rotateZ: MODEL_CONFIG.rotateZ,
    scaleMultiplier: MODEL_CONFIG.scaleMultiplier,
    offsetEastMeters: MODEL_CONFIG.offsetEastMeters,
    offsetNorthMeters: MODEL_CONFIG.offsetNorthMeters,
    center: [MODEL_CENTER[0], MODEL_CENTER[1], MODEL_CENTER[2]],
  };
}
