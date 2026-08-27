import { describe, it, expect, vi, afterEach } from "vitest";
import {
  DHAKA_TEST_ARENA,
  DEFAULT_GPS_SIM_SCALE,
  activateGpsSimulator,
  centroidLngLat,
  metersOffset,
  offsetToLngLat,
  mapSimFix,
  makeGpsSimTransform,
  autoWalkFix,
  resolveGpsSimPrefs,
  storeGpsSimPrefs,
  createSimulatedGeolocation,
  type SimFix,
} from "@/lib/dev/gps-sim";
import { haversineDistance } from "@/lib/utils/distance";
import { WALKING_SPEED } from "@/lib/utils/constants";

const ORIGIN = centroidLngLat(DHAKA_TEST_ARENA);
// Tawaf ring start: 20m due east of the Kaaba center.
const KAABA = { lng: 39.8262, lat: 21.4225 };
const TARGET = {
  lng: KAABA.lng + 20 / (111320 * Math.cos((KAABA.lat * Math.PI) / 180)),
  lat: KAABA.lat,
};

function rawFixAt(lat: number, lng: number): SimFix {
  return { latitude: lat, longitude: lng, accuracy: 10, heading: 45, speed: 1.2 };
}

function makePosition(fix: SimFix, timestamp = 1_700_000_000_000) {
  return {
    coords: { ...fix, altitude: null, altitudeAccuracy: null },
    timestamp,
  } as unknown as GeolocationPosition;
}

describe("centroidLngLat", () => {
  it("returns the arithmetic mean of the arena points", () => {
    const c = centroidLngLat(DHAKA_TEST_ARENA);
    expect(c.lng).toBeCloseTo(90.3639221, 6);
    expect(c.lat).toBeCloseTo(23.8236174, 6);
  });

  it("throws on an empty set", () => {
    expect(() => centroidLngLat([])).toThrow();
  });
});

describe("mapSimFix", () => {
  it("rejects a non-positive scale", () => {
    expect(() => makeGpsSimTransform(ORIGIN, TARGET, 0)).toThrow();
    expect(() => makeGpsSimTransform(ORIGIN, TARGET, -1)).toThrow();
  });

  it("maps the origin exactly onto the target", () => {
    const t = makeGpsSimTransform(ORIGIN, TARGET, DEFAULT_GPS_SIM_SCALE);
    const mapped = mapSimFix(rawFixAt(ORIGIN.lat, ORIGIN.lng), t);
    expect(mapped.latitude).toBeCloseTo(TARGET.lat, 8);
    expect(mapped.longitude).toBeCloseTo(TARGET.lng, 8);
  });

  it("scales an eastward walk by the scale factor", () => {
    const scale = 3;
    const t = makeGpsSimTransform(ORIGIN, TARGET, scale);
    const [eastLng, eastLat] = offsetToLngLat(ORIGIN, 100, 0);
    const mapped = mapSimFix(rawFixAt(eastLat, eastLng), t);

    const dist = haversineDistance(TARGET.lat, TARGET.lng, mapped.latitude, mapped.longitude);
    expect(dist).toBeGreaterThan(100 * scale * 0.98);
    expect(dist).toBeLessThan(100 * scale * 1.02);
  });

  it("preserves distances at scale 1 (isometry of the local frame)", () => {
    const t = makeGpsSimTransform(ORIGIN, TARGET, 1);
    const [aLng, aLat] = offsetToLngLat(ORIGIN, 25, 10);
    const [bLng, bLat] = offsetToLngLat(ORIGIN, -30, 44);
    const a = mapSimFix(rawFixAt(aLat, aLng), t);
    const b = mapSimFix(rawFixAt(bLat, bLng), t);

    const realDist = haversineDistance(aLat, aLng, bLat, bLng);
    const simDist = haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
    expect(Math.abs(realDist - simDist)).toBeLessThan(0.5);
  });

  it("scales accuracy and speed, passes heading through, keeps nulls", () => {
    const t = makeGpsSimTransform(ORIGIN, TARGET, 3);
    const mapped = mapSimFix(rawFixAt(ORIGIN.lat, ORIGIN.lng), t);
    expect(mapped.accuracy).toBeCloseTo(30, 6);
    expect(mapped.speed).toBeCloseTo(3.6, 6);
    expect(mapped.heading).toBe(45);

    const withNulls: SimFix = {
      latitude: ORIGIN.lat,
      longitude: ORIGIN.lng,
      accuracy: null,
      heading: null,
      speed: null,
    };
    const mappedNulls = mapSimFix(withNulls, t);
    expect(mappedNulls.accuracy).toBeNull();
    expect(mappedNulls.heading).toBeNull();
    expect(mappedNulls.speed).toBeNull();
  });
});

describe("autoWalkFix", () => {
  it("starts on the ring due east of the Kaaba", () => {
    const fix = autoWalkFix(0);
    const dist = haversineDistance(KAABA.lat, KAABA.lng, fix.latitude, fix.longitude);
    expect(dist).toBeCloseTo(20, 1);
    expect(fix.longitude).toBeGreaterThan(KAABA.lng);
    expect(fix.latitude).toBeCloseTo(KAABA.lat, 6);
  });

  it("stays on the ring over time", () => {
    for (const seconds of [3.7, 21.4, 63.9]) {
      const fix = autoWalkFix(seconds);
      const dist = haversineDistance(KAABA.lat, KAABA.lng, fix.latitude, fix.longitude);
      expect(dist).toBeGreaterThan(17.5);
      expect(dist).toBeLessThan(20.5);
    }
  });

  it("walks at walking speed", () => {
    const a = autoWalkFix(10);
    const b = autoWalkFix(11);
    const step = haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
    expect(Math.abs(step - WALKING_SPEED)).toBeLessThan(0.15);
  });

  it("walks counter-clockwise (northbound from the east point)", () => {
    const heading = autoWalkFix(0).heading ?? 0;
    // Near north, allowing wrap-around at 360 degrees.
    const deviation = Math.min(heading, 360 - heading);
    expect(deviation).toBeLessThan(35);
    expect(autoWalkFix(4).latitude).toBeGreaterThan(autoWalkFix(0).latitude);
  });
});

describe("resolveGpsSimPrefs", () => {
  it("enables live mode from the URL param", () => {
    expect(resolveGpsSimPrefs("?gps-sim=1", null)).toEqual({
      mode: "live",
      scale: DEFAULT_GPS_SIM_SCALE,
    });
    expect(resolveGpsSimPrefs("?gps-sim=live", null)?.mode).toBe("live");
  });

  it("enables auto mode from the URL param", () => {
    expect(resolveGpsSimPrefs("?gps-sim=auto", null)?.mode).toBe("auto");
  });

  it("falls back to stored prefs when no param is present", () => {
    expect(resolveGpsSimPrefs("", '{"mode":"auto","scale":5}')).toEqual({
      mode: "auto",
      scale: 5,
    });
  });

  it("URL param overrides and disables stored prefs", () => {
    expect(resolveGpsSimPrefs("?gps-sim=0", '{"mode":"live","scale":5}')).toBeNull();
    expect(resolveGpsSimPrefs("?gps-sim=off", '{"mode":"live","scale":5}')).toBeNull();
  });

  it("parses and clamps the scale param", () => {
    expect(resolveGpsSimPrefs("?gps-sim=live&gps-scale=8", null)?.scale).toBe(8);
    expect(resolveGpsSimPrefs("?gps-sim=live&gps-scale=0.2", null)?.scale).toBe(1);
    expect(resolveGpsSimPrefs("?gps-sim=live&gps-scale=999", null)?.scale).toBe(50);
    expect(resolveGpsSimPrefs("?gps-sim=live&gps-scale=abc", null)?.scale).toBe(
      DEFAULT_GPS_SIM_SCALE
    );
  });

  it("ignores corrupt stored prefs", () => {
    expect(resolveGpsSimPrefs("", "not-json")).toBeNull();
  });

  it("stays off with no param and nothing stored", () => {
    expect(resolveGpsSimPrefs("", null)).toBeNull();
  });
});

describe("createSimulatedGeolocation", () => {
  const transform = makeGpsSimTransform(ORIGIN, TARGET, 3);

  function fakeRealGeolocation(handlers: {
    onGetCurrent?: (success: PositionCallback, error?: PositionErrorCallback) => void;
    onWatch?: (success: PositionCallback, error?: PositionErrorCallback) => number;
  }) {
    return {
      getCurrentPosition: vi.fn((success: PositionCallback, error?: PositionErrorCallback) => {
        handlers.onGetCurrent?.(success, error);
      }),
      watchPosition: vi.fn((success: PositionCallback, error?: PositionErrorCallback) => {
        return handlers.onWatch?.(success, error) ?? 0;
      }),
      clearWatch: vi.fn(),
    } as unknown as Pick<Geolocation, "getCurrentPosition" | "watchPosition" | "clearWatch">;
  }

  it("live mode maps a real fix into the Makkah frame", () => {
    const [eastLng, eastLat] = offsetToLngLat(ORIGIN, 50, 0);
    const real = fakeRealGeolocation({
      onGetCurrent: (success) => success(makePosition(rawFixAt(eastLat, eastLng))),
    });
    const sim = createSimulatedGeolocation(real, transform, "live");

    const reported: GeolocationPosition[] = [];
    sim.getCurrentPosition((p) => reported.push(p));

    expect(reported).toHaveLength(1);
    // Raw fix is 50m east of the origin: maps to 50 x 3 = 150m east of target.
    expect(reported[0].coords.latitude).toBeCloseTo(TARGET.lat, 6);
    const dist = haversineDistance(
      TARGET.lat,
      TARGET.lng,
      reported[0].coords.latitude,
      reported[0].coords.longitude
    );
    expect(dist).toBeGreaterThan(150 * 0.98);
    expect(dist).toBeLessThan(150 * 1.02);
    expect(reported[0].coords.accuracy).toBeCloseTo(30, 6);
    expect(reported[0].coords.speed).toBeCloseTo(3.6, 6);
  });

  it("live mode reports the raw fix through onRaw", () => {
    const onRaw = vi.fn();
    const real = fakeRealGeolocation({
      onGetCurrent: (success) => success(makePosition(rawFixAt(ORIGIN.lat, ORIGIN.lng))),
    });
    const sim = createSimulatedGeolocation(real, transform, "live", () => Date.now(), onRaw);

    sim.getCurrentPosition(() => {});

    expect(onRaw).toHaveBeenCalledTimes(1);
    expect(onRaw.mock.calls[0][0].longitude).toBeCloseTo(ORIGIN.lng, 8);
  });

  it("live mode passes errors through untouched", () => {
    const sentinel = new Error("denied") as unknown as GeolocationPositionError;
    const real = fakeRealGeolocation({
      onGetCurrent: (_success, error) => error?.(sentinel),
    });
    const sim = createSimulatedGeolocation(real, transform, "live");

    const received: GeolocationPositionError[] = [];
    sim.getCurrentPosition(
      () => {},
      (e) => received.push(e)
    );

    expect(received).toHaveLength(1);
    expect(received[0]).toBe(sentinel);
  });

  it("auto mode never touches the real geolocation and reports a ring position", () => {
    const real = fakeRealGeolocation({
      onGetCurrent: () => {
        throw new Error("real geolocation must not be called in auto mode");
      },
    });
    let clock = 10_000;
    const sim = createSimulatedGeolocation(real, transform, "auto", () => clock);

    const reported: GeolocationPosition[] = [];
    sim.getCurrentPosition((p) => reported.push(p));

    expect(reported).toHaveLength(1);
    const dist = haversineDistance(
      KAABA.lat,
      KAABA.lng,
      reported[0].coords.latitude,
      reported[0].coords.longitude
    );
    expect(dist).toBeGreaterThan(17.5);
    expect(dist).toBeLessThan(20.5);
  });

  it("auto mode advances the walk with the clock", () => {
    const real = fakeRealGeolocation({});
    let clock = 0;
    const sim = createSimulatedGeolocation(real, transform, "auto", () => clock);

    const reported: GeolocationPosition[] = [];
    sim.getCurrentPosition((p) => reported.push(p));
    clock = 30_000; // 30 seconds in
    sim.getCurrentPosition((p) => reported.push(p));

    const at30 = autoWalkFix(30);
    expect(reported[1].coords.latitude).toBeCloseTo(at30.latitude, 8);
    expect(reported[1].coords.longitude).toBeCloseTo(at30.longitude, 8);
    expect(reported[1].coords.heading).toBeCloseTo(at30.heading ?? 0, 6);
  });

  it("auto mode watchPosition ticks and can be cleared", () => {
    vi.useFakeTimers();
    try {
      const real = fakeRealGeolocation({});
      const sim = createSimulatedGeolocation(real, transform, "auto", () => Date.now());

      const reported: GeolocationPosition[] = [];
      const id = sim.watchPosition((p) => reported.push(p));

      expect(reported).toHaveLength(1);
      vi.advanceTimersByTime(1000);
      expect(reported).toHaveLength(2);
      vi.advanceTimersByTime(1000);
      expect(reported).toHaveLength(3);

      sim.clearWatch(id);
      vi.advanceTimersByTime(5000);
      expect(reported).toHaveLength(3);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("metersOffset round trip", () => {
  it("recovers the original point after offset and back", () => {
    const east = 137.4;
    const north = -52.8;
    const [lng, lat] = offsetToLngLat(ORIGIN, east, north);
    const back = metersOffset(ORIGIN, { lng, lat });
    expect(back.east).toBeCloseTo(east, 4);
    expect(back.north).toBeCloseTo(north, 4);
  });
});

describe("dev-only gating and session persistence", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.__TAWAF_GPS_SIM__;
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("persists prefs in session storage only", () => {
    storeGpsSimPrefs({ mode: "auto", scale: 3 });
    expect(window.sessionStorage.getItem("tawaf:gps-sim")).not.toBeNull();
    // localStorage would leak one activated link into future sessions.
    expect(window.localStorage.getItem("tawaf:gps-sim")).toBeNull();
  });

  it("never activates under a production build, even with ?gps-sim=auto", () => {
    window.history.replaceState(null, "", "/map?gps-sim=auto");
    vi.stubEnv("NODE_ENV", "production");
    const realGeolocation = navigator.geolocation;

    const runtime = activateGpsSimulator();

    expect(runtime?.enabled).toBe(false);
    expect(navigator.geolocation).toBe(realGeolocation);
    expect(window.sessionStorage.getItem("tawaf:gps-sim")).toBeNull();
  });
});
