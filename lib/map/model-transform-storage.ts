// localStorage persistence for the dev-only 3D-model tuner (see
// components/map/ModelTuner.tsx). Lets in-browser alignment tweaks survive the
// 3D toggle and page reloads, so tuning work isn't lost before you "Copy config"
// and bake the values into model-config.ts.
//
// Each model ("masjid" | "clock-tower" | "nabawi") stores under its own key.
// The key embeds a signature of that model's compiled-in defaults: whenever
// its constants in model-config.ts change, the key changes and the previously
// saved transform is ignored automatically (no manual cache-busting).
//
// Dev-only by design: every helper no-ops in production and when localStorage
// is unavailable, so production always renders the baked defaults.

import type { ModelTransform } from "./three-model-layer";
import {
  MODEL_CENTER,
  MODEL_CONFIG,
  MODEL_ORIGIN,
  CLOCK_TOWER_CENTER,
  CLOCK_TOWER_CONFIG,
  CLOCK_TOWER_ORIGIN,
  NABAWI_CENTER,
  NABAWI_CONFIG,
  NABAWI_ORIGIN,
  type ModelTunables,
} from "./model-config";

export type TunableModelKey = "masjid" | "clock-tower" | "nabawi";

const STORAGE_PREFIX = "tawaf:model-transform";

const DEFAULTS_BY_MODEL: Record<
  TunableModelKey,
  { origin: [number, number]; config: ModelTunables; center: [number, number, number] }
> = {
  masjid: { origin: MODEL_ORIGIN, config: MODEL_CONFIG, center: MODEL_CENTER },
  "clock-tower": {
    origin: CLOCK_TOWER_ORIGIN,
    config: CLOCK_TOWER_CONFIG,
    center: CLOCK_TOWER_CENTER,
  },
  nabawi: { origin: NABAWI_ORIGIN, config: NABAWI_CONFIG, center: NABAWI_CENTER },
};

function storageKey(model: TunableModelKey): string {
  const defaults = DEFAULTS_BY_MODEL[model];
  // Serialize the baked defaults into the key. Any edit to the constants
  // produces a new key, which naturally discards stale saved tuning.
  const signature = JSON.stringify(defaults);
  return `${STORAGE_PREFIX}:${model}:${signature}`;
}

function isStorageAvailable(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

/**
 * Read a previously tuned transform for the model, or null when none is saved,
 * the defaults changed, or we're in production / a non-browser context.
 */
export function loadTunedModelTransform(model: TunableModelKey): ModelTransform | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(storageKey(model));
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
 * Persist the model's current transform so tuning survives the 3D toggle and
 * reloads. Silently no-ops in production or when storage is unavailable.
 */
export function saveTunedModelTransform(model: TunableModelKey, transform: ModelTransform): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(storageKey(model), JSON.stringify(transform));
  } catch {
    // Quota exceeded / private mode — ignore; tuning just won't persist.
  }
}
