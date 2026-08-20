import { describe, it, expect, beforeEach } from "vitest";
import {
  MODEL_CONFIG,
  MODEL_ORIGIN,
  MODEL_URL,
  CLOCK_TOWER_CONFIG,
  CLOCK_TOWER_ORIGIN,
  NABAWI_CONFIG,
  NABAWI_ORIGIN,
  NABAWI_URL,
  PREFETCHABLE_MODEL_URLS,
  VENUES_3D,
  buildInitialModelTransform,
  buildInitialClockTowerTransform,
  buildInitialNabawiTransform,
  nearest3DVenue,
  intentPreloadModelUrls,
} from "@/lib/map/model-config";
import {
  loadTunedModelTransform,
  saveTunedModelTransform,
} from "@/lib/map/model-transform-storage";

describe("model-config builders", () => {
  it("seeds the masjid transform from the baked constants", () => {
    const t = buildInitialModelTransform();
    expect(t.originLng).toBe(MODEL_ORIGIN[0]);
    expect(t.originLat).toBe(MODEL_ORIGIN[1]);
    expect(t.altitudeMeters).toBe(MODEL_CONFIG.altitudeMeters);
    expect(t.rotateX).toBe(MODEL_CONFIG.rotateX);
    expect(t.rotateY).toBe(MODEL_CONFIG.rotateY);
    expect(t.rotateZ).toBe(MODEL_CONFIG.rotateZ);
    expect(t.scaleMultiplier).toBe(MODEL_CONFIG.scaleMultiplier);
    expect(t.offsetEastMeters).toBe(MODEL_CONFIG.offsetEastMeters);
    expect(t.offsetNorthMeters).toBe(MODEL_CONFIG.offsetNorthMeters);
  });

  it("seeds the clock tower transform from the baked constants", () => {
    const t = buildInitialClockTowerTransform();
    expect(t.originLng).toBe(CLOCK_TOWER_ORIGIN[0]);
    expect(t.originLat).toBe(CLOCK_TOWER_ORIGIN[1]);
    expect(t.altitudeMeters).toBe(CLOCK_TOWER_CONFIG.altitudeMeters);
    expect(t.rotateX).toBe(CLOCK_TOWER_CONFIG.rotateX);
    expect(t.rotateY).toBe(CLOCK_TOWER_CONFIG.rotateY);
    expect(t.rotateZ).toBe(CLOCK_TOWER_CONFIG.rotateZ);
    expect(t.scaleMultiplier).toBe(CLOCK_TOWER_CONFIG.scaleMultiplier);
    expect(t.offsetEastMeters).toBe(CLOCK_TOWER_CONFIG.offsetEastMeters);
    expect(t.offsetNorthMeters).toBe(CLOCK_TOWER_CONFIG.offsetNorthMeters);
  });

  it("seeds the nabawi transform from the baked constants", () => {
    const t = buildInitialNabawiTransform();
    expect(t.originLng).toBe(NABAWI_ORIGIN[0]);
    expect(t.originLat).toBe(NABAWI_ORIGIN[1]);
    expect(t.altitudeMeters).toBe(NABAWI_CONFIG.altitudeMeters);
    expect(t.rotateX).toBe(NABAWI_CONFIG.rotateX);
    expect(t.rotateY).toBe(NABAWI_CONFIG.rotateY);
    expect(t.rotateZ).toBe(NABAWI_CONFIG.rotateZ);
    expect(t.scaleMultiplier).toBe(NABAWI_CONFIG.scaleMultiplier);
    expect(t.offsetEastMeters).toBe(NABAWI_CONFIG.offsetEastMeters);
    expect(t.offsetNorthMeters).toBe(NABAWI_CONFIG.offsetNorthMeters);
  });

  it("returns fresh objects so callers cannot mutate the baked seed", () => {
    const a = buildInitialClockTowerTransform();
    a.rotateZ = 123;
    expect(buildInitialClockTowerTransform().rotateZ).toBe(CLOCK_TOWER_CONFIG.rotateZ);
  });

  it("keeps the loading policy honest: only cheap models background-prefetch", () => {
    // Even Draco-compressed the Masjid GLB is ~63MB and the Nabawi ~79.5MB —
    // too heavy to auto-download for every visitor on possibly-roaming data.
    expect(PREFETCHABLE_MODEL_URLS).not.toContain(MODEL_URL);
    expect(PREFETCHABLE_MODEL_URLS).not.toContain(NABAWI_URL);
    expect(PREFETCHABLE_MODEL_URLS).toContain("/models/clock_tower_compress.glb");
  });
});

describe("venue-aware loading", () => {
  it("maps every venue to its own model URLs and anchor", () => {
    expect(VENUES_3D.makkah.anchor).toEqual(MODEL_ORIGIN);
    expect(VENUES_3D.makkah.modelUrls).toEqual([MODEL_URL, "/models/clock_tower_compress.glb"]);
    expect(VENUES_3D.madinah.anchor).toEqual(NABAWI_ORIGIN);
    expect(VENUES_3D.madinah.modelUrls).toEqual([NABAWI_URL]);
  });

  it("picks the venue nearest the camera", () => {
    expect(nearest3DVenue([39.8262, 21.4225])).toBe("makkah"); // Makkah center
    expect(nearest3DVenue([39.6141, 24.4672])).toBe("madinah"); // Madinah center
    expect(nearest3DVenue([39.17, 21.54])).toBe("makkah"); // Jeddah, ~69km vs ~340km
  });

  it("intent preload covers only the nearest venue's models", () => {
    const overMakkah = intentPreloadModelUrls([39.8262, 21.4225]);
    expect(overMakkah).toContain(MODEL_URL);
    expect(overMakkah).toContain("/models/clock_tower_compress.glb");
    expect(overMakkah).not.toContain(NABAWI_URL);

    const overMadinah = intentPreloadModelUrls([39.6141, 24.4672]);
    expect(overMadinah).toContain(NABAWI_URL);
    expect(overMadinah).not.toContain(MODEL_URL);
    expect(overMadinah).not.toContain("/models/clock_tower_compress.glb");
  });
});

describe("model-transform-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a tuned clock tower transform", () => {
    const tuned = {
      ...buildInitialClockTowerTransform(),
      offsetEastMeters: -42,
      offsetNorthMeters: 17,
    };
    saveTunedModelTransform("clock-tower", tuned);
    expect(loadTunedModelTransform("clock-tower")).toEqual(tuned);
  });

  it("round-trips a tuned nabawi transform", () => {
    const tuned = {
      ...buildInitialNabawiTransform(),
      scaleMultiplier: 0.25,
      rotateZ: 0.35,
    };
    saveTunedModelTransform("nabawi", tuned);
    expect(loadTunedModelTransform("nabawi")).toEqual(tuned);
  });

  it("keeps models isolated — saving the tower does not affect the masjid", () => {
    saveTunedModelTransform("clock-tower", {
      ...buildInitialClockTowerTransform(),
      rotateZ: 1.5,
    });
    expect(loadTunedModelTransform("masjid")).toBeNull();
    expect(loadTunedModelTransform("nabawi")).toBeNull();
  });

  it("returns null for corrupt entries instead of crashing", () => {
    saveTunedModelTransform("clock-tower", buildInitialClockTowerTransform());
    // Overwrite the stored payload with garbage under the same key the saver used.
    const keys = Object.keys(window.localStorage).filter((k) =>
      k.startsWith("tawaf:model-transform:clock-tower:")
    );
    expect(keys).toHaveLength(1);
    window.localStorage.setItem(keys[0], "{not json");
    expect(loadTunedModelTransform("clock-tower")).toBeNull();
  });
});
