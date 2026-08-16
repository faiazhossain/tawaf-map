/**
 * GPS simulator (dev/test harness)
 *
 * Lets a developer far from Makkah experience the real-time navigation
 * features ("where am I", nearby gates/hotels, closest anchor) as if they
 * were walking inside the Haram.
 *
 * How it works: while enabled, `navigator.geolocation` is replaced with a
 * wrapper (same trick as Chrome DevTools sensors), so every consumer
 * (`useGeolocation`, `locationStore.requestLocation`) keeps running the
 * exact production code path. Two modes:
 *
 * - "live": real device GPS fixes are remapped into Makkah coordinates.
 *   The reference point (origin, from the test arena in Dhaka) maps onto
 *   the tawaf ring start; every real meter walked becomes `scale` meters
 *   at the Haram. Heading is unchanged (uniform scale, no rotation), so
 *   walking north in Dhaka reads as walking north in Makkah.
 * - "auto": no real GPS needed. Synthesizes a pilgrim walking the
 *   schematic tawaf ring counter-clockwise at average walking speed.
 *
 * Activation: `?gps-sim=live` / `?gps-sim=auto` / `?gps-sim=0` on any URL
 * (persisted in localStorage so it survives navigation), optional
 * `?gps-scale=N`. While active a badge (`GpsSimBadge`) is always visible
 * so simulated GPS can never be mistaken for the real thing.
 */

import { ellipseRingCoordinates } from "@/lib/map/umrah-overlay";
import { WALKING_SPEED } from "@/lib/utils/constants";

// ---------------------------------------------------------------------------
// Config: the on-foot test arena (Uttara, Dhaka) and where it maps to
// ---------------------------------------------------------------------------

/**
 * Walkable arena captured on site. Only the centroid matters for the
 * transform (it maps onto the tawaf ring start); the individual points are
 * kept as documentation of the walking area and for future waypoint modes.
 */
export const DHAKA_TEST_ARENA: [number, number][] = [
  [90.3635908, 23.8244213],
  [90.3642057, 23.8239994],
  [90.3642375, 23.8227093],
  [90.3636544, 23.8233398],
];

/** Kaaba center [lng, lat], same value the ritual overlay uses. */
const KAABA_CENTER: [number, number] = [39.8262, 21.4225];

/** Schematic tawaf ring (20m x 18m ellipse around the Kaaba). */
const TAWAF_RING = dropClosingPoint(ellipseRingCoordinates(KAABA_CENTER, 20, 18, 64));

/** The ring start (due east of the Kaaba, on the Black Stone line). */
const RING_START = TAWAF_RING[0];

export const DEFAULT_GPS_SIM_SCALE = 3;

// ---------------------------------------------------------------------------
// Pure geo helpers (meters <-> degrees, small-distance local frame)
// ---------------------------------------------------------------------------

const DEG_PER_M_LAT = 1 / 110540;

function degPerMLng(lat: number): number {
  return 1 / (111320 * Math.cos((lat * Math.PI) / 180));
}

export interface LngLat {
  lng: number;
  lat: number;
}

/** Centroid (arithmetic mean) of a set of [lng, lat] points. */
export function centroidLngLat(points: [number, number][]): LngLat {
  if (points.length === 0) {
    throw new Error("centroidLngLat requires at least one point");
  }
  let lng = 0;
  let lat = 0;
  for (const [pLng, pLat] of points) {
    lng += pLng;
    lat += pLat;
  }
  return { lng: lng / points.length, lat: lat / points.length };
}

/** Local-plane offset from `from` to `to` in meters (east/north). */
export function metersOffset(from: LngLat, to: LngLat): { east: number; north: number } {
  return {
    east: (to.lng - from.lng) / degPerMLng(from.lat),
    north: (to.lat - from.lat) / DEG_PER_M_LAT,
  };
}

/** Convert an east/north meter offset from `base` back to [lng, lat]. */
export function offsetToLngLat(base: LngLat, eastM: number, northM: number): [number, number] {
  return [base.lng + eastM * degPerMLng(base.lat), base.lat + northM * DEG_PER_M_LAT];
}

function dropClosingPoint(ring: number[][]): [number, number][] {
  const pts = ring.map((p) => [p[0], p[1]] as [number, number]);
  if (pts.length > 1) {
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) {
      pts.pop();
    }
  }
  return pts;
}

// ---------------------------------------------------------------------------
// The transform: real fix (Dhaka) -> simulated fix (Makkah)
// ---------------------------------------------------------------------------

export interface GpsSimTransform {
  origin: LngLat;
  target: LngLat;
  scale: number;
}

export interface SimFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export function makeGpsSimTransform(
  origin: LngLat,
  target: LngLat,
  scale: number
): GpsSimTransform {
  if (!(scale > 0)) {
    throw new Error("gps sim scale must be positive");
  }
  return { origin, target, scale };
}

/** Map one raw GPS fix into the simulated Makkah frame. */
export function mapSimFix(raw: SimFix, t: GpsSimTransform): SimFix {
  const offset = metersOffset(t.origin, { lng: raw.longitude, lat: raw.latitude });
  const [lng, lat] = offsetToLngLat(t.target, offset.east * t.scale, offset.north * t.scale);
  return {
    latitude: lat,
    longitude: lng,
    // Real error grows with the same scale as the position itself.
    accuracy: raw.accuracy === null ? null : raw.accuracy * t.scale,
    // Uniform scale, no rotation: heading passes through, speed scales.
    heading: raw.heading,
    speed: raw.speed === null ? null : raw.speed * t.scale,
  };
}

// ---------------------------------------------------------------------------
// Auto-walk: synthetic pilgrim on the tawaf ring (pure, clock injectable)
// ---------------------------------------------------------------------------

/** Per-segment arc lengths of a ring, in meters (not degrees). */
function ringArcLengths(ring: [number, number][]): number[] {
  const lengths: number[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const east = (b[0] - a[0]) / degPerMLng(a[1]);
    const north = (b[1] - a[1]) / DEG_PER_M_LAT;
    lengths.push(Math.hypot(east, north));
  }
  return lengths;
}

function ringPerimeter(ring: [number, number][]): number {
  return ringArcLengths(ring).reduce((sum, l) => sum + l, 0);
}

function bearingDeg(a: [number, number], b: [number, number]): number {
  const dx = (b[0] - a[0]) * Math.cos((a[1] * Math.PI) / 180);
  const dy = b[1] - a[1];
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Position of the synthetic pilgrim `elapsedSeconds` into the walk.
 * Ring order runs counter-clockwise (the tawaf direction).
 */
export function autoWalkFix(elapsedSeconds: number, speed = WALKING_SPEED): SimFix {
  const perimeter = ringPerimeter(TAWAF_RING);
  const arcLengths = ringArcLengths(TAWAF_RING);
  let travelled = (elapsedSeconds * speed) % perimeter;

  let index = 0;
  while (travelled > arcLengths[index]) {
    travelled -= arcLengths[index];
    index = (index + 1) % TAWAF_RING.length;
  }

  const from = TAWAF_RING[index];
  const to = TAWAF_RING[(index + 1) % TAWAF_RING.length];
  const fraction = arcLengths[index] === 0 ? 0 : travelled / arcLengths[index];
  const lng = from[0] + (to[0] - from[0]) * fraction;
  const lat = from[1] + (to[1] - from[1]) * fraction;

  return {
    latitude: lat,
    longitude: lng,
    accuracy: 8,
    heading: bearingDeg(from, to),
    speed,
  };
}

// ---------------------------------------------------------------------------
// Geolocation patch (injectable geolocation object for testability)
// ---------------------------------------------------------------------------

type MinimalCoords = SimFix;
type PositionLike = { coords: MinimalCoords & GeolocationCoordinates; timestamp: number };

function toPosition(fix: SimFix, timestamp: number): GeolocationPosition {
  return {
    coords: {
      latitude: fix.latitude,
      longitude: fix.longitude,
      accuracy: fix.accuracy ?? 0,
      heading: fix.heading,
      speed: fix.speed,
      altitude: null,
      altitudeAccuracy: null,
      toJSON: () => ({}),
    } as GeolocationCoordinates,
    timestamp,
    toJSON: () => ({}),
  } as GeolocationPosition;
}

const noop = () => {};

/**
 * Wrap a geolocation object so every fix it reports is a simulated one.
 * `mode: "live"` transforms real fixes; `mode: "auto"` ignores them and
 * synthesizes the ring walk. Errors pass through untouched in live mode.
 */
export function createSimulatedGeolocation(
  real: Pick<Geolocation, "getCurrentPosition" | "watchPosition" | "clearWatch">,
  transform: GpsSimTransform,
  mode: GpsSimMode,
  now: () => number = () => Date.now(),
  onRaw?: (fix: SimFix) => void
): Geolocation {
  const startedAt = now();

  const simulateSuccess = (raw: PositionLike, report: (p: GeolocationPosition) => void) => {
    if (mode === "auto") {
      report(toPosition(autoWalkFix((now() - startedAt) / 1000), now()));
      return;
    }
    onRaw?.(raw.coords);
    const mapped = mapSimFix(raw.coords, transform);
    report(toPosition(mapped, raw.timestamp));
  };

  const wrapError = (err: GeolocationPositionError) => err;

  const wrapSuccess =
    (report: (p: GeolocationPosition) => void) =>
    (raw: PositionLike): void =>
      simulateSuccess(raw, report);

  return {
    getCurrentPosition(
      success: PositionCallback,
      error?: PositionErrorCallback | null,
      _options?: PositionOptions
    ) {
      if (mode === "auto") {
        success(toPosition(autoWalkFix((now() - startedAt) / 1000), now()));
        return;
      }
      real.getCurrentPosition(
        wrapSuccess(success),
        error ? (e) => error(wrapError(e)) : undefined,
        { enableHighAccuracy: true }
      );
    },
    watchPosition(
      success: PositionCallback,
      error?: PositionErrorCallback | null,
      _options?: PositionOptions
    ): number {
      if (mode === "auto") {
        // No real GPS involved: tick the synthetic walker ourselves.
        const report = (p: GeolocationPosition) => success(p);
        report(toPosition(autoWalkFix((now() - startedAt) / 1000), now()));
        const id = window.setInterval(
          () => report(toPosition(autoWalkFix((now() - startedAt) / 1000), now())),
          1000
        );
        return id;
      }
      return real.watchPosition(
        wrapSuccess(success),
        error ? (e) => error(wrapError(e)) : undefined,
        {
          enableHighAccuracy: true,
        }
      );
    },
    clearWatch(id: number) {
      if (mode === "auto") {
        window.clearInterval(id);
        return;
      }
      real.clearWatch(id);
    },
  } as Geolocation;
}

// ---------------------------------------------------------------------------
// Activation state (URL param + localStorage)
// ---------------------------------------------------------------------------

export type GpsSimMode = "live" | "auto";

export interface GpsSimPrefs {
  mode: GpsSimMode;
  scale: number;
}

export interface GpsSimRuntime extends GpsSimPrefs {
  enabled: boolean;
  origin: LngLat;
  target: LngLat;
  /** Latest raw device fix (live mode), for the badge readout. */
  lastRaw: LngLat | null;
}

const STORAGE_KEY = "tawaf:gps-sim";
const SCALE_MIN = 1;
const SCALE_MAX = 50;

declare global {
  interface Window {
    __TAWAF_GPS_SIM__?: GpsSimRuntime;
  }
}

/**
 * Resolve simulator prefs from the URL (wins, and is persisted) with the
 * stored prefs as fallback. Returns null when the simulator is off.
 */
export function resolveGpsSimPrefs(search: string, stored: string | null): GpsSimPrefs | null {
  const params = new URLSearchParams(search);
  const param = params.get("gps-sim");

  let prefs: GpsSimPrefs | null = null;
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<GpsSimPrefs>;
      if (parsed.mode === "live" || parsed.mode === "auto") {
        prefs = {
          mode: parsed.mode,
          scale: clampScale(parsed.scale) ?? DEFAULT_GPS_SIM_SCALE,
        };
      }
    } catch {
      // Corrupt stored prefs are ignored; the simulator just stays off.
    }
  }

  if (param !== null) {
    const normalized = param.toLowerCase();
    if (normalized === "auto") {
      prefs = { mode: "auto", scale: prefs?.scale ?? DEFAULT_GPS_SIM_SCALE };
    } else if (
      normalized === "live" ||
      normalized === "1" ||
      normalized === "on" ||
      normalized === "true"
    ) {
      prefs = { mode: "live", scale: prefs?.scale ?? DEFAULT_GPS_SIM_SCALE };
    } else {
      prefs = null;
    }
  }

  const scaleParam = params.get("gps-scale");
  if (prefs && scaleParam !== null) {
    const parsedScale = clampScale(parseFloat(scaleParam));
    if (parsedScale !== null) {
      prefs = { ...prefs, scale: parsedScale };
    }
  }

  return prefs;
}

function clampScale(value: number | undefined | null): number | null {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return null;
  }
  if (!(value >= SCALE_MIN)) {
    return SCALE_MIN;
  }
  return Math.min(value, SCALE_MAX);
}

/** Persist prefs (or clear when null) so the setting survives navigation. */
export function storeGpsSimPrefs(prefs: GpsSimPrefs | null): void {
  if (typeof window === "undefined") return;
  if (prefs === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }
}

function readStoredPrefs(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Install the simulated geolocation if the URL/localStorage asked for it.
 * Safe to call multiple times; runs at import time (see bottom of file) so
 * the patch is in place before any component effect reads a position.
 */
export function activateGpsSimulator(): GpsSimRuntime | null {
  if (typeof window === "undefined") return null;
  if (window.__TAWAF_GPS_SIM__ !== undefined) {
    return window.__TAWAF_GPS_SIM__;
  }

  const prefs = resolveGpsSimPrefs(window.location.search, readStoredPrefs());
  if (!prefs) {
    window.__TAWAF_GPS_SIM__ = {
      enabled: false,
      mode: "live",
      scale: DEFAULT_GPS_SIM_SCALE,
      origin: { lng: 0, lat: 0 },
      target: { lng: 0, lat: 0 },
      lastRaw: null,
    };
    return window.__TAWAF_GPS_SIM__;
  }

  // URL params win over stored prefs; persist the result for next loads.
  storeGpsSimPrefs(prefs);

  const origin = centroidLngLat(DHAKA_TEST_ARENA);
  const runtime: GpsSimRuntime = {
    enabled: true,
    mode: prefs.mode,
    scale: prefs.scale,
    origin,
    target: { lng: RING_START[0], lat: RING_START[1] },
    lastRaw: null,
  };
  window.__TAWAF_GPS_SIM__ = runtime;

  if (!navigator.geolocation) {
    // Auto mode still works without device GPS; live mode cannot.
    if (prefs.mode === "auto") {
      const syntheticSource = {
        getCurrentPosition: (_s: unknown, _e?: unknown) => noop(),
        watchPosition: (_s: unknown, _e?: unknown) => 0,
        clearWatch: (_id: number) => noop(),
      };
      replaceGeolocation(
        createSimulatedGeolocation(
          syntheticSource as unknown as Geolocation,
          makeGpsSimTransform(origin, runtime.target, prefs.scale),
          "auto"
        )
      );
    }
    return runtime;
  }

  const transform = makeGpsSimTransform(origin, runtime.target, prefs.scale);
  const simulated = createSimulatedGeolocation(
    navigator.geolocation,
    transform,
    prefs.mode,
    () => Date.now(),
    // Keep the latest raw fix visible for the badge readout (live mode).
    (fix) => {
      runtime.lastRaw = { lng: fix.longitude, lat: fix.latitude };
    }
  );

  replaceGeolocation(simulated);
  return runtime;
}

/** Current runtime state (null before activation / on the server). */
export function getGpsSimRuntime(): GpsSimRuntime | null {
  if (typeof window === "undefined") return null;
  return window.__TAWAF_GPS_SIM__ ?? null;
}

/**
 * Replace `navigator.geolocation` (a read-only prototype getter, so a plain
 * assignment does not type-check or work on every engine).
 */
function replaceGeolocation(simulated: Geolocation): void {
  Object.defineProperty(navigator, "geolocation", {
    value: simulated,
    configurable: true,
    writable: true,
  });
}

// Activate as soon as this module is evaluated on the client, so the patch
// exists before any geolocation consumer mounts. Importing this module from
// a client component (GpsSimBadge) is enough.
if (typeof window !== "undefined") {
  activateGpsSimulator();
}
