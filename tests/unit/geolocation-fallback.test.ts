import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  GPS_TIMEOUT_MS,
  MAXIMUM_AGE_MS,
  UNSUPPORTED_MESSAGE,
  describeGeolocationError,
  getCurrentPositionWithFallback,
} from "@/lib/utils/geolocation";

type GeoBehavior = () => GeolocationPosition | GeolocationPositionError;

function geoError(code: number) {
  return { code, message: `mock geolocation error ${code}` } as GeolocationPositionError;
}

function positionAt(lat: number, lng: number): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 12,
      heading: null,
      speed: null,
      altitude: null,
      altitudeAccuracy: null,
    },
    timestamp: 1_700_000_000_000,
  } as unknown as GeolocationPosition;
}

const calls: PositionOptions[] = [];
let behaviors: GeoBehavior[] = [];

/** Scripted navigator.geolocation stand-in; each call consumes one behavior. */
function installGeolocation() {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition(
        success: PositionCallback,
        error?: PositionErrorCallback | null,
        options?: PositionOptions
      ) {
        calls.push(options ?? {});
        const behavior = behaviors.shift();
        if (!behavior) {
          throw new Error("unexpected extra getCurrentPosition call");
        }
        const result = behavior();
        if (typeof (result as GeolocationPositionError).code === "number") {
          error?.(result as GeolocationPositionError);
        } else {
          success(result as GeolocationPosition);
        }
      },
      watchPosition: () => 0,
      clearWatch: () => {},
    },
  });
}

beforeEach(() => {
  calls.length = 0;
  behaviors = [];
  installGeolocation();
});

afterEach(() => {
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });
});

describe("getCurrentPositionWithFallback", () => {
  it("resolves the first GPS fix without a fallback call", async () => {
    behaviors.push(() => positionAt(21.4225, 39.8262));

    const position = await getCurrentPositionWithFallback();

    expect(position.coords.latitude).toBe(21.4225);
    expect(position.coords.longitude).toBe(39.8262);
    expect(calls).toHaveLength(1);
    expect(calls[0].enableHighAccuracy).toBe(true);
    expect(calls[0].timeout).toBe(GPS_TIMEOUT_MS);
    expect(calls[0].maximumAge).toBe(MAXIMUM_AGE_MS);
  });

  it("retries on the coarse provider after a GPS timeout", async () => {
    behaviors.push(
      () => geoError(3),
      () => positionAt(21.42, 39.82)
    );

    const position = await getCurrentPositionWithFallback();

    expect(position.coords.latitude).toBe(21.42);
    expect(calls).toHaveLength(2);
    expect(calls[0].enableHighAccuracy).toBe(true);
    expect(calls[1].enableHighAccuracy).toBe(false);
  });

  it("retries on the coarse provider after position-unavailable", async () => {
    behaviors.push(
      () => geoError(2),
      () => positionAt(21.42, 39.82)
    );

    await getCurrentPositionWithFallback();

    expect(calls).toHaveLength(2);
    expect(calls[1].enableHighAccuracy).toBe(false);
  });

  it("never retries a permission denial", async () => {
    behaviors.push(() => geoError(1));

    await expect(getCurrentPositionWithFallback()).rejects.toMatchObject({
      code: 1,
      permission: "denied",
      message: "লোকেশনের অনুমতি দেওয়া হয়নি",
    });
    expect(calls).toHaveLength(1);
  });

  it("reports the Bangla GPS message when both attempts time out", async () => {
    behaviors.push(
      () => geoError(3),
      () => geoError(3)
    );

    const failure = await getCurrentPositionWithFallback().then(
      () => {
        throw new Error("expected a rejection");
      },
      (e) => e
    );

    expect(failure.code).toBe(3);
    expect(failure.permission).toBe("prompt");
    expect(failure.message).toContain("জিপিএস সিগন্যাল পাওয়া যায়নি");
    expect(failure.message).toContain("ডিভাইসের লোকেশন চালু আছে কি না দেখুন");
  });

  it("fails without any call when the API is missing", async () => {
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });

    await expect(getCurrentPositionWithFallback()).rejects.toMatchObject({
      code: null,
      permission: "unknown",
      message: UNSUPPORTED_MESSAGE,
    });
    expect(calls).toHaveLength(0);
  });

  it("honors custom timeout and maximumAge on the first attempt", async () => {
    behaviors.push(() => positionAt(0, 0));

    await getCurrentPositionWithFallback({ timeout: 25000, maximumAge: 60000 });

    expect(calls[0].timeout).toBe(25000);
    expect(calls[0].maximumAge).toBe(60000);
  });
});

describe("describeGeolocationError", () => {
  it("maps a denial to the denied permission state", () => {
    expect(describeGeolocationError(geoError(1))).toMatchObject({
      code: 1,
      permission: "denied",
    });
  });

  it("maps timeout and unavailable to prompt with the recovery hint", () => {
    for (const code of [2, 3]) {
      const failure = describeGeolocationError(geoError(code));
      expect(failure.permission).toBe("prompt");
      expect(failure.message).toContain("ডিভাইসের লোকেশন চালু আছে কি না দেখুন");
    }
  });

  it("maps unknown objects to an unknown failure", () => {
    expect(describeGeolocationError(new Error("boom"))).toMatchObject({
      code: null,
      permission: "unknown",
    });
  });
});
