import { describe, it, expect, beforeEach } from "vitest";
import {
  MODEL_CONFIG,
  MODEL_ORIGIN,
  MODEL_URL,
  CLOCK_TOWER_CONFIG,
  CLOCK_TOWER_ORIGIN,
  PREFETCHABLE_MODEL_URLS,
  INTENT_PRELOAD_MODEL_URLS,
  buildInitialModelTransform,
  buildInitialClockTowerTransform,
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

  it("returns fresh objects so callers cannot mutate the baked seed", () => {
    const a = buildInitialClockTowerTransform();
    a.rotateZ = 123;
    expect(buildInitialClockTowerTransform().rotateZ).toBe(CLOCK_TOWER_CONFIG.rotateZ);
  });

  it("keeps the loading policy honest: only cheap models background-prefetch", () => {
    // Even Draco-compressed the Masjid GLB is ~63MB — too heavy to
    // auto-download for every visitor on possibly-roaming data.
    expect(PREFETCHABLE_MODEL_URLS).not.toContain(MODEL_URL);
    expect(PREFETCHABLE_MODEL_URLS).toContain("/models/clock_tower_compress.glb");
  });

  it("intent preload covers every model the 3D mode needs", () => {
    expect(INTENT_PRELOAD_MODEL_URLS).toContain(MODEL_URL);
    expect(INTENT_PRELOAD_MODEL_URLS).toContain("/models/clock_tower_compress.glb");
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

  it("keeps models isolated — saving the tower does not affect the masjid", () => {
    saveTunedModelTransform("clock-tower", {
      ...buildInitialClockTowerTransform(),
      rotateZ: 1.5,
    });
    expect(loadTunedModelTransform("masjid")).toBeNull();
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
