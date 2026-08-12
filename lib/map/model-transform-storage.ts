// localStorage persistence for the dev-only 3D-model tuner (see
// components/map/ModelTuner.tsx). Lets in-browser alignment tweaks survive the
// 3D toggle and page reloads, so tuning work isn't lost before you "Copy config"
// and bake the values into model-config.ts.
//
// The storage key embeds a signature of the compiled-in defaults: whenever
// MODEL_ORIGIN / MODEL_CONFIG / MODEL_CENTER change, the key changes and the
// previously saved transform is ignored automatically (no manual cache-busting).
//
// Dev-only by design: every helper no-ops in production and when localStorage
// is unavailable, so production always renders the baked defaults.

import type { ModelTransform } from "./three-model-layer";
import { MODEL_CENTER, MODEL_CONFIG, MODEL_ORIGIN } from "./model-config";

const STORAGE_PREFIX = "tawaf:model-transform";

// Serialize the baked defaults into the key. Any edit to the constants produces
// a new key, which naturally discards stale saved tuning.
const DEFAULTS_SIGNATURE = JSON.stringify({
  origin: MODEL_ORIGIN,
  config: MODEL_CONFIG,
  center: MODEL_CENTER,
});

const STORAGE_KEY = `${STORAGE_PREFIX}:${DEFAULTS_SIGNATURE}`;

function isStorageAvailable(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

/**
 * Read a previously tuned transform, or null when none is saved, the defaults
 * changed, or we're in production / a non-browser context.
 */
export function loadTunedModelTransform(): ModelTransform | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ModelTransform>;
    // Guard against a corrupt / partial entry crashing the layer downstream.
    if (
      typeof parsed.originLng !== "number" ||
      typeof parsed.originLat !== "number" ||
      typeof parsed.altitudeMeters !== "number" ||
      typeof parsed.rotateX !== "number" ||
      typeof parsed.rotateY !== "number" ||
      typeof parsed.rotateZ !== "number" ||
      typeof parsed.scaleMultiplier !== "number" ||
      typeof parsed.offsetEastMeters !== "number" ||
      typeof parsed.offsetNorthMeters !== "number" ||
      !Array.isArray(parsed.center) ||
      parsed.center.length !== 3
    ) {
      return null;
    }
    return {
      originLng: parsed.originLng,
      originLat: parsed.originLat,
      altitudeMeters: parsed.altitudeMeters,
      rotateX: parsed.rotateX,
      rotateY: parsed.rotateY,
      rotateZ: parsed.rotateZ,
      scaleMultiplier: parsed.scaleMultiplier,
      offsetEastMeters: parsed.offsetEastMeters,
      offsetNorthMeters: parsed.offsetNorthMeters,
      center: [parsed.center[0], parsed.center[1], parsed.center[2]],
    };
  } catch {
    // JSON.parse failure or storage edge case — ignore and fall back to defaults.
    return null;
  }
}

/**
 * Persist the current transform so tuning survives the 3D toggle and reloads.
 * Silently no-ops in production or when storage is unavailable.
 */
export function saveTunedModelTransform(transform: ModelTransform): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transform));
  } catch {
    // Quota exceeded / private mode — ignore; tuning just won't persist.
  }
}
