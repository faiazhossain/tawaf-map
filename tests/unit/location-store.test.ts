import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useLocationStore } from "@/lib/store";

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

let behaviors: GeoBehavior[] = [];

/** Scripted navigator.geolocation stand-in; each call consumes one behavior. */
function installGeolocation() {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition(
        success: PositionCallback,
        error?: PositionErrorCallback | null,
        _options?: PositionOptions
      ) {
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
  behaviors = [];
  installGeolocation();
  useLocationStore.setState({
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    loading: false,
    permission: "unknown",
  });
});

afterEach(() => {
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });
});

describe("requestLocation", () => {
  it("stores the fix and marks the permission granted", async () => {
    behaviors.push(() => positionAt(21.4225, 39.8262));

    await useLocationStore.getState().requestLocation();

    const state = useLocationStore.getState();
    expect(state.latitude).toBe(21.4225);
    expect(state.longitude).toBe(39.8262);
    expect(state.permission).toBe("granted");
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("uses the coarse fallback fix after a GPS timeout", async () => {
    behaviors.push(
      () => geoError(3),
      () => positionAt(21.42, 39.82)
    );

    await useLocationStore.getState().requestLocation();

    const state = useLocationStore.getState();
    expect(state.latitude).toBe(21.42);
    expect(state.permission).toBe("granted");
    expect(state.error).toBeNull();
  });

  it("surfaces the Bangla GPS message when both attempts fail", async () => {
    behaviors.push(
      () => geoError(3),
      () => geoError(3)
    );

    await useLocationStore.getState().requestLocation();

    const state = useLocationStore.getState();
    expect(state.error).toContain("জিপিএস সিগন্যাল পাওয়া যায়নি");
    expect(state.error).toContain("ডিভাইসের লোকেশন চালু আছে কি না দেখুন");
    expect(state.permission).toBe("prompt");
    expect(state.loading).toBe(false);
  });

  it("records a denial without retrying", async () => {
    behaviors.push(() => geoError(1));

    await useLocationStore.getState().requestLocation();

    const state = useLocationStore.getState();
    expect(state.error).toContain("লোকেশনের অনুমতি দেওয়া হয়নি");
    expect(state.permission).toBe("denied");
    expect(state.latitude).toBeNull();
  });
});
