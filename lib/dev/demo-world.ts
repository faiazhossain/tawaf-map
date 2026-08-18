/**
 * Demo world (dev/test harness)
 *
 * Instead of moving the developer's GPS into Makkah (see gps-sim.ts), this
 * harness moves the app's Makkah datasets to the developer: gates, hotels
 * and Makkah tourist places are translated in place into a small walkable
 * arena (Uttara, Dhaka), keeping their true distances, bearings and
 * relationships (scaled down so the whole Haram area fits around the
 * corner where testing happens).
 *
 * The user's GPS is NOT touched at all: the browser permission flow, the
 * "you are here" dot and every proximity panel (nearby gates, hotels,
 * places) run the exact production code path against the translated data.
 * Because the basemap is Barikoi, the arena renders on real Dhaka streets.
 *
 * Activation: `?demo-world=1` / `?demo-world=0` on any URL (persisted in
 * localStorage) or the one-tap toggle in DebugLocationPanel. Mutually
 * exclusive with the GPS simulator. Mutations happen at module load,
 * before any component reads the datasets, and a reload restores pristine
 * module state.
 */

import { MAKKAH_CENTER } from "@/lib/utils/constants";
import {
  DHAKA_TEST_ARENA,
  centroidLngLat,
  metersOffset,
  offsetToLngLat,
  resolveGpsSimPrefs,
  storeGpsSimPrefs,
  type LngLat,
} from "@/lib/dev/gps-sim";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { TOURIST_PLACES } from "@/lib/data/tourist-places";
import { DEMO_POIS } from "@/lib/data/pois";

/** Arena meters per Makkah meter (Haram ~600m gate radius -> ~200m walk). */
export const DEMO_WORLD_SCALE = 1 / 3;

/** Where the Kaaba lands: the centroid of the on-foot test arena. */
export const DEMO_ARENA_CENTER: LngLat = centroidLngLat(DHAKA_TEST_ARENA);

// ---------------------------------------------------------------------------
// Pure transform
// ---------------------------------------------------------------------------

export interface DemoWorldConfig {
  /** Makkah anchor the translation is measured from (the Kaaba). */
  source: LngLat;
  /** Arena anchor the translation lands on. */
  target: LngLat;
  /** Arena meters per Makkah meter. */
  scale: number;
}

export function makeDemoWorldConfig(
  target: LngLat = DEMO_ARENA_CENTER,
  scale: number = DEMO_WORLD_SCALE
): DemoWorldConfig {
  if (!(scale > 0)) {
    throw new Error("demo world scale must be positive");
  }
  return { source: { lng: MAKKAH_CENTER.lng, lat: MAKKAH_CENTER.lat }, target, scale };
}

/** Translate one [lng, lat] point from the Makkah frame into the arena. */
export function mapDemoPoint(point: [number, number], cfg: DemoWorldConfig): [number, number] {
  const offset = metersOffset(cfg.source, { lng: point[0], lat: point[1] });
  return offsetToLngLat(cfg.target, offset.east * cfg.scale, offset.north * cfg.scale);
}

/** Anything with GeoJSON-style `location.coordinates`. */
export interface CoordinatesHolder {
  location: { coordinates: [number, number] };
}

export interface DemoDatasets {
  gates: CoordinatesHolder[];
  hotels: CoordinatesHolder[];
  /** Only the entries the caller wants moved (e.g. Makkah-city places). */
  places: CoordinatesHolder[];
  /** Demo POIs (restaurants/cafes/toilets/…); optional so older callers keep compiling. */
  pois?: CoordinatesHolder[];
}

/**
 * Translate dataset coordinates in place (array identity is preserved so
 * every consumer that already holds a reference sees the moved points).
 * Returns how many items were moved.
 */
export function applyDemoWorld(
  datasets: DemoDatasets,
  cfg: DemoWorldConfig = makeDemoWorldConfig()
): number {
  let moved = 0;
  const families = [datasets.gates, datasets.hotels, datasets.places];
  if (datasets.pois) families.push(datasets.pois);
  for (const items of families) {
    for (const item of items) {
      item.location.coordinates = mapDemoPoint(item.location.coordinates, cfg);
      moved += 1;
    }
  }
  return moved;
}

// ---------------------------------------------------------------------------
// Activation state (URL param + localStorage), gps-sim mutually exclusive
// ---------------------------------------------------------------------------

const STORAGE_KEY = "tawaf:demo-world";
const TRUTHY = ["1", "true", "on", "yes"];

declare global {
  interface Window {
    __TAWAF_DEMO_WORLD__?: boolean;
  }
}

/** URL param wins over stored value; anything else falls back to storage. */
export function resolveDemoWorldActive(search: string, stored: string | null): boolean {
  const param = new URLSearchParams(search).get("demo-world");
  if (param !== null) {
    return TRUTHY.includes(param.toLowerCase());
  }
  return stored === "1";
}

export function storeDemoWorldActive(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (active) {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode); the URL param still works.
  }
}

function readStored(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Activate the demo world if requested. Runs at import time (see bottom) so
 * the datasets are translated before any component reads them. Idempotent.
 */
export function activateDemoWorld(): boolean {
  if (typeof window === "undefined") return false;
  if (window.__TAWAF_DEMO_WORLD__ !== undefined) {
    return window.__TAWAF_DEMO_WORLD__;
  }

  const active = resolveDemoWorldActive(window.location.search, readStored());
  window.__TAWAF_DEMO_WORLD__ = active;

  if (active) {
    // Persist URL activations and make sure the GPS simulator is off: both
    // harnesses together would put the user in Makkah and the data in Dhaka.
    storeDemoWorldActive(true);
    if (resolveGpsSimPrefs(window.location.search, readGpsSimStored()) !== null) {
      storeGpsSimPrefs(null);
    }
    applyDemoWorld({
      gates: HARAM_GATES,
      hotels: NEARBY_HOTELS,
      places: TOURIST_PLACES.filter((place) => place.city === "makkah"),
      pois: DEMO_POIS,
    });
  }

  return active;
}

function readGpsSimStored(): string | null {
  try {
    return window.localStorage.getItem("tawaf:gps-sim");
  } catch {
    return null;
  }
}

/** Whether the demo world is active (activating on first call if needed). */
export function isDemoWorldActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.__TAWAF_DEMO_WORLD__ ?? activateDemoWorld();
}

/** Initial map center/zoom for the demo arena, or null when inactive. */
export function getDemoWorldViewport(): { center: [number, number]; zoom: number } | null {
  if (!isDemoWorldActive()) return null;
  return { center: [DEMO_ARENA_CENTER.lng, DEMO_ARENA_CENTER.lat], zoom: 16.5 };
}

// Activate as soon as this module is evaluated on the client, before any
// component mounts. Statically imported by the map page (via GpsSimBadge)
// so the timing is guaranteed.
if (typeof window !== "undefined") {
  activateDemoWorld();
}
