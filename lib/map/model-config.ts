import type { ModelTransform } from "./three-model-layer";
import { haversineDistance } from "@/lib/utils/distance";

// Georeferencing + asset config for the 3D model layers (Makkah: Masjid
// Al-Haram + clock tower; Madinah: Masjid an-Nabawi).
//
// The GLBs are generic (non-georeferenced) models, so their real-world scale
// and heading are NOT baked into the files. The constants below are the single
// place to iterate alignment against the satellite basemap. See
// three-model-layer.ts for how they are consumed.
//
// HOW TO ALIGN A MODEL
// --------------------
// These constants are the source of truth — every layer renders the baked
// defaults in production. The Masjid + clock tower are ALIGNED; the Nabawi
// constants are the seed, with the dev tuner currently mounted for it in
// MapView.tsx (dev-only). Workflow to align a model: mount the dev tuner
// (components/map/ModelTuner.tsx — parameterized per model) in MapView.tsx,
// adjust the sliders live against the satellite basemap, click
// "Copy config", paste the values into the model's constants below, then
// remove the tuner render block again. "Reset" in the tuner reverts to the
// baked values here.

/** Shape shared by MODEL_CONFIG / CLOCK_TOWER_CONFIG (all plain tunables). */
export interface ModelTunables {
  altitudeMeters: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scaleMultiplier: number;
  offsetEastMeters: number;
  offsetNorthMeters: number;
}

// maplibre custom-layer id. Stable so idempotent getLayer/addLayer checks work
// across React StrictMode's dev double-invoke and repeated toggles.
export const MODEL_LAYER_ID = "haram-3d-model";

// Where the model's origin sits on the globe: the Kaaba, [lng, lat].
// (Same coordinate as KAABA_CENTER in lib/map/umrah-overlay.ts and
// MAKKAH_CENTER in lib/utils/constants.ts, inlined here as a tuple because
// those are not exported / use a {lat,lng} object shape.)
export const MODEL_ORIGIN: [number, number] = [39.827352, 21.422073];

// URL the browser fetches. Served straight from GitHub raw, which sends
// access-control-allow-origin: * (and Content-Length, so streaming progress
// works) — no need for the same-origin /models proxy the clock tower uses.
// Draco-compressed (~63MB, down from the 231MB uncompressed original); the
// layer's DRACOLoader (decoder at /draco/) handles it.
export const MODEL_URL =
  "https://raw.githubusercontent.com/golamrabbii/3d-models/main/masjid_al_haram_with_expansion.glb";

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
// Measured glTF metadata (bbox in model units, from the POSITION accessors),
// re-measured 2026-08-16 on the Draco-compressed file:
//   size X=780.95  Y=404.61  Z=857.28   (Y is the smallest axis => standard Y-up)
// The compression pass also pruned outlier geometry, which TIGHTENED the bbox
// vs the old 231MB export (X=807, Z=900) and moved its center ~15m — placement
// below was tuned against the OLD bbox, so expect a small (~10-15m) drift vs
// the satellite basemap; nudge offsetEast/North if it bothers.
// The ~857-unit max dimension matches the full Masjid Al-Haram complex *with
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
// POSITION accessor min/max (re-measured on the compressed file; the layer
// re-captures the real bbox center after load, so this is only the pre-load
// seed). The local origin is offset from this by a few hundred meters, so we
// recenter on the bbox center to land the model on the Kaaba instead of
// hundreds of meters off.
export const MODEL_CENTER: [number, number, number] = [29.77, -186.8, 68.28];

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
  return toTransform(MODEL_ORIGIN, MODEL_CONFIG, MODEL_CENTER);
}

// ---------------------------------------------------------------------------
// Clock tower (Abraj Al-Bait) — rendered beside the Masjid model while the
// same "3D" toggle is on. ALIGNED: the constants below are the final values
// tuned live with the dev tuner against the Barikoi satellite basemap (the
// starting point came from the standalone prototype at the repo root).
//
// GLB facts (measured from the file): Draco-compressed (decoder at /draco),
// authored Z-up in real-world METERS — clock faces at z~436 match the real
// 436m clock-face elevation and total height 589.6 ~= the 601m tower — so
// scaleMultiplier 1.0 would be real-world size; the tuned 0.855 is the look
// that matched the basemap. bbox min [-200.43, -64.33, -0.15],
// max [172.89, 117.23, 589.48].
// ---------------------------------------------------------------------------

// maplibre custom-layer id. Stable for idempotent getLayer/addLayer checks.
export const CLOCK_TOWER_LAYER_ID = "clock-tower-3d-model";

// Served through the same Next.js /models proxy as the Masjid GLB.
export const CLOCK_TOWER_URL = "/models/clock_tower_compress.glb";

// WHEN models download (loading policy; see lib/map/model-manager.ts):
//   - PREFETCHABLE: background-prefetched once the map settles (connection
//     permitting). Only cheap models belong here — even compressed, the ~63MB
//     Masjid GLB and the ~79.5MB Nabawi GLB must NOT auto-download for every
//     visitor (heavy on roaming data). Revisit only if they shrink
//     dramatically.
//   - INTENT_PRELOAD (intentPreloadModelUrls below): fetched the moment the
//     user touches the 3D button — explicit intent, but venue-aware: only the
//     URLs of the venue the camera is nearest to, so touching the button over
//     Makkah never pulls the Nabawi GLB (and vice versa).
export const PREFETCHABLE_MODEL_URLS = [CLOCK_TOWER_URL] as const;

// Measured glTF bbox center (see above). The layer re-captures the real bbox
// center after load, so this is only the pre-load seed.
export const CLOCK_TOWER_CENTER: [number, number, number] = [-13.77, 26.45, 294.67];

export const CLOCK_TOWER_ORIGIN: [number, number] = [39.825498, 21.420359];

export const CLOCK_TOWER_CONFIG = {
  altitudeMeters: -27,
  rotateX: 1.47,
  rotateY: 2.6234,
  rotateZ: 0.0484,
  scaleMultiplier: 0.855,
  offsetEastMeters: 9,
  offsetNorthMeters: -106,
} as const;

/**
 * Build the initial (mutable) transform for the clock tower layer. The layer
 * renders these baked defaults on every load; the dev tuner's "Reset" builds
 * from here too if it is ever re-enabled.
 */
export function buildInitialClockTowerTransform(): ModelTransform {
  return toTransform(CLOCK_TOWER_ORIGIN, CLOCK_TOWER_CONFIG, CLOCK_TOWER_CENTER);
}

// ---------------------------------------------------------------------------
// Masjid an-Nabawi (Madinah) — the second hero venue. NOT YET ALIGNED: the
// constants below are the seed; align with the dev tuner per the workflow at
// the top of this file (mounted for "nabawi" in MapView.tsx, dev-only), then
// bake the final values here.
//
// GLB facts (measured from the file): 79,462,760 bytes, Draco-compressed
// (decoder at /draco/), 122 meshes / 15 textured materials, uses
// KHR_materials_specular (three.js handles natively). The root node
// "Sketchfab_model" carries its own rotation + translation, so the effective
// bbox is the root-rotated one: min [-368.78, -127.48, -719.09],
// max [455.22, 295.24, 47.3] (size 824 x 423 x 766), center
// [43.22, 83.88, -335.89] — the pre-load CENTER seed below. Units are likely
// NOT meters (423 units of height vs the ~105m real minarets), so expect
// scaleMultiplier well below 1 after tuning.
// ---------------------------------------------------------------------------

// maplibre custom-layer id. Stable for idempotent getLayer/addLayer checks.
export const NABAWI_LAYER_ID = "nabawi-3d-model";

// Direct raw GitHub URL (CORS * + Content-Length like MODEL_URL, so streaming
// progress works — NOT the /models proxy). ~79.5MB even Draco-compressed:
// never add to PREFETCHABLE_MODEL_URLS, and never intent-preload outside the
// Madinah venue.
export const NABAWI_URL =
  "https://raw.githubusercontent.com/golamrabbii/3d-models/main/masjid_al_nababi.glb";

// Anchored on the Nabawi POI coordinate (id "madinah-al-masjid-al-nabawi" in
// lib/data/tourist-places.ts).
export const NABAWI_ORIGIN: [number, number] = [39.6147, 24.4672];

// Root-rotated bbox center seed (see above). The layer re-captures the real
// bbox center after load, so this is only the pre-load seed.
export const NABAWI_CENTER: [number, number, number] = [43.22, 83.88, -335.89];

// Seed tunables — first-time alignment pending (dev tuner, see MapView.tsx).
export const NABAWI_CONFIG = {
  altitudeMeters: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scaleMultiplier: 1.0,
  offsetEastMeters: 0,
  offsetNorthMeters: 0,
} as const;

/**
 * Build the initial (mutable) transform for the Nabawi layer, seeded from the
 * constants above. In dev, MapView prefers loadTunedModelTransform("nabawi")
 * over this so in-progress tuning survives reloads; production always gets
 * these baked defaults (the storage helper no-ops there).
 */
export function buildInitialNabawiTransform(): ModelTransform {
  return toTransform(NABAWI_ORIGIN, NABAWI_CONFIG, NABAWI_CENTER);
}

// ---------------------------------------------------------------------------
// Venue-aware 3D loading (production behavior)
// ---------------------------------------------------------------------------
// The two hero venues are ~340km apart. The "3D" toggle activates whichever
// venue the camera is nearest to, and ONLY that venue's models are created,
// downloaded and active — someone toggling 3D over Makkah must not pull the
// ~79.5MB Nabawi GLB, and vice versa.

export type Venue3DKey = "makkah" | "madinah";

export interface Venue3D {
  /** Fly-to anchor + nearest-venue reference point ([lng, lat]). */
  anchor: [number, number];
  /** Every GLB the 3D mode needs at this venue (intent preload + layers). */
  modelUrls: readonly string[];
}

export const VENUES_3D: Record<Venue3DKey, Venue3D> = {
  makkah: { anchor: MODEL_ORIGIN, modelUrls: [MODEL_URL, CLOCK_TOWER_URL] },
  madinah: { anchor: NABAWI_ORIGIN, modelUrls: [NABAWI_URL] },
};

/** Pure + three.js-free so page.tsx (intent preload) and MapView share it. */
export function nearest3DVenue(lngLat: [number, number]): Venue3DKey {
  const [lng, lat] = lngLat;
  const toMakkah = haversineDistance(lat, lng, MODEL_ORIGIN[1], MODEL_ORIGIN[0]);
  const toMadinah = haversineDistance(lat, lng, NABAWI_ORIGIN[1], NABAWI_ORIGIN[0]);
  return toMadinah < toMakkah ? "madinah" : "makkah"; // exact tie -> makkah
}

/** Intent-preload list for a camera position: only the NEAREST venue's URLs. */
export function intentPreloadModelUrls(lngLat: [number, number]): readonly string[] {
  return VENUES_3D[nearest3DVenue(lngLat)].modelUrls;
}

/** Map a model's baked constants onto the layer's mutable transform shape. */
function toTransform(
  origin: [number, number],
  config: ModelTunables,
  center: [number, number, number]
): ModelTransform {
  return {
    originLng: origin[0],
    originLat: origin[1],
    altitudeMeters: config.altitudeMeters,
    rotateX: config.rotateX,
    rotateY: config.rotateY,
    rotateZ: config.rotateZ,
    scaleMultiplier: config.scaleMultiplier,
    offsetEastMeters: config.offsetEastMeters,
    offsetNorthMeters: config.offsetNorthMeters,
    center: [center[0], center[1], center[2]],
  };
}
