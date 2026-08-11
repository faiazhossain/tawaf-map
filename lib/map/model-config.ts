// Georeferencing + asset config for the Masjid Al-Haram 3D model layer.
//
// The GLB is a generic (non-georeferenced) model, so its real-world scale and
// heading are NOT baked into the file. The constants below are the single place
// to iterate alignment against the satellite basemap. See three-model-layer.ts
// for how they are consumed.

// maplibre custom-layer id. Stable so idempotent getLayer/addLayer checks work
// across React StrictMode's dev double-invoke and repeated toggles.
export const MODEL_LAYER_ID = "haram-3d-model";

// Where the model's origin sits on the globe: the Kaaba, [lng, lat].
// (Same coordinate as KAABA_CENTER in lib/map/umrah-overlay.ts and
// MAKKAH_CENTER in lib/utils/constants.ts, inlined here as a tuple because
// those are not exported / use a {lat,lng} object shape.)
export const MODEL_ORIGIN: [number, number] = [39.8258584, 21.4225362];

// URL the browser fetches. Defaults to the same-origin Next.js proxy path
// (see next.config.ts rewrites) so we avoid CORS on the LAN asset server.
// Override per-environment with NEXT_PUBLIC_3D_MODEL_URL.
export const MODEL_URL =
  process.env.NEXT_PUBLIC_3D_MODEL_URL ?? "/models/Masjid_Al-Haram_Mecca_With_Expansion.glb";

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
//   - altitudeMeters: leave 0 unless terrain is on (the terrain DEM at ~300m
//     would bury a z=0 model).
//   - rotateX: Math.PI / 2 tilts a standard Y-up export upright. Revisit only
//     if the model renders lying flat (use 0) or upside-down (use -PI/2).
// The model's geometric (bbox) center in its local space, computed from the
// POSITION accessor min/max. The local origin is offset from this by a few
// hundred meters, so we recenter on the bbox center to land the model on the
// Kaaba instead of hundreds of meters off.
export const MODEL_CENTER: [number, number, number] = [26.26, -186.19, 53.89];

export const MODEL_CONFIG = {
  altitudeMeters: 0,
  rotateX: Math.PI / 1.6,
  rotateY: 0.99,
  rotateZ: 0.18, // ~165deg to align with true north (Kaaba long axis runs NW-SE)
  scaleMultiplier: 1,
  // Fine-tune position against the satellite basemap (meters). 0 once centered.
  offsetEastMeters: 0,
  offsetNorthMeters: 0,
} as const;
