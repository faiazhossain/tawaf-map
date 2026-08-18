import { describe, it, expect } from "vitest";
import {
  DEMO_ARENA_CENTER,
  DEMO_WORLD_SCALE,
  makeDemoWorldConfig,
  mapDemoPoint,
  applyDemoWorld,
  resolveDemoWorldActive,
  type CoordinatesHolder,
} from "@/lib/dev/demo-world";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { TOURIST_PLACES } from "@/lib/data/tourist-places";
import { DEMO_POIS } from "@/lib/data/pois";
import { haversineDistance, calculateBearing } from "@/lib/utils/distance";
import { MAKKAH_CENTER } from "@/lib/utils/constants";

const MAKKAH = { lng: MAKKAH_CENTER.lng, lat: MAKKAH_CENTER.lat };

function degPerMLng(lat: number): number {
  return 1 / (111320 * Math.cos((lat * Math.PI) / 180));
}

/** A point `eastM`/`northM` meters away from the Makkah anchor. */
function makkahPoint(eastM: number, northM: number): [number, number] {
  return [MAKKAH.lng + eastM * degPerMLng(MAKKAH.lat), MAKKAH.lat + northM / 110540];
}

describe("mapDemoPoint", () => {
  it("rejects a non-positive scale", () => {
    expect(() => makeDemoWorldConfig(DEMO_ARENA_CENTER, 0)).toThrow();
    expect(() => makeDemoWorldConfig(DEMO_ARENA_CENTER, -2)).toThrow();
  });

  it("lands the Kaaba exactly on the arena center", () => {
    const cfg = makeDemoWorldConfig();
    const [lng, lat] = mapDemoPoint([MAKKAH.lng, MAKKAH.lat], cfg);
    expect(lng).toBeCloseTo(DEMO_ARENA_CENTER.lng, 8);
    expect(lat).toBeCloseTo(DEMO_ARENA_CENTER.lat, 8);
  });

  it("shrinks Makkah distances by the demo scale", () => {
    const cfg = makeDemoWorldConfig();
    const [lng, lat] = mapDemoPoint(makkahPoint(600, 0), cfg);
    const dist = haversineDistance(DEMO_ARENA_CENTER.lat, DEMO_ARENA_CENTER.lng, lat, lng);
    expect(dist).toBeGreaterThan(600 * DEMO_WORLD_SCALE * 0.98);
    expect(dist).toBeLessThan(600 * DEMO_WORLD_SCALE * 1.02);
  });

  it("preserves bearings (directions are not rotated)", () => {
    const cfg = makeDemoWorldConfig();

    const [northLng, northLat] = mapDemoPoint(makkahPoint(0, 400), cfg);
    const northBearing = calculateBearing(
      DEMO_ARENA_CENTER.lat,
      DEMO_ARENA_CENTER.lng,
      northLat,
      northLng
    );
    expect(northBearing).toBeLessThan(5);

    const [westLng, westLat] = mapDemoPoint(makkahPoint(-400, 0), cfg);
    const westBearing = calculateBearing(
      DEMO_ARENA_CENTER.lat,
      DEMO_ARENA_CENTER.lng,
      westLat,
      westLng
    );
    // Due west is 270 degrees (allowing a small numeric drift).
    expect(westBearing).toBeGreaterThan(265);
    expect(westBearing).toBeLessThan(275);
  });
});

describe("applyDemoWorld", () => {
  it("translates datasets in place, preserving array identity", () => {
    const gates: CoordinatesHolder[] = [{ location: { coordinates: [MAKKAH.lng, MAKKAH.lat] } }];
    const hotels: CoordinatesHolder[] = [{ location: { coordinates: makkahPoint(120, -80) } }];
    const places: CoordinatesHolder[] = [];
    const gatesRef = gates;

    const moved = applyDemoWorld({ gates, hotels, places });

    expect(moved).toBe(2);
    expect(gates).toBe(gatesRef);
    const [kaabaLng, kaabaLat] = gates[0].location.coordinates;
    expect(kaabaLng).toBeCloseTo(DEMO_ARENA_CENTER.lng, 8);
    expect(kaabaLat).toBeCloseTo(DEMO_ARENA_CENTER.lat, 8);
  });

  it("moves real Makkah datasets into a walkable radius of the arena", () => {
    const gates = structuredClone(HARAM_GATES);
    const hotels = structuredClone(NEARBY_HOTELS);
    const places = structuredClone(TOURIST_PLACES.filter((p) => p.city === "makkah"));
    const pois = structuredClone(DEMO_POIS);

    applyDemoWorld({ gates, hotels, places, pois });

    const all = [...gates, ...hotels, ...places, ...pois];
    expect(all.length).toBeGreaterThan(10);

    const distances = all.map((item) =>
      haversineDistance(
        DEMO_ARENA_CENTER.lat,
        DEMO_ARENA_CENTER.lng,
        item.location.coordinates[1],
        item.location.coordinates[0]
      )
    );

    // Everything lands within ~7km of the arena. Gates and hotels sit in a
    // walkable radius; far outliers are correct too (Arafat really is ~18km
    // from the Haram, so ~6km at demo scale).
    for (const dist of distances) {
      expect(dist).toBeLessThan(7000);
    }
    // And something is genuinely nearby for the proximity panels.
    const nearestGate = Math.min(
      ...gates.map((g) =>
        haversineDistance(
          DEMO_ARENA_CENTER.lat,
          DEMO_ARENA_CENTER.lng,
          g.location.coordinates[1],
          g.location.coordinates[0]
        )
      )
    );
    expect(nearestGate).toBeLessThan(2000);
  });

  it("translates demo POIs in place and keeps restaurants walkable from the arena", () => {
    const pois = structuredClone(DEMO_POIS);
    const poisRef = pois;

    const moved = applyDemoWorld({ gates: [], hotels: [], places: [], pois });

    expect(moved).toBe(DEMO_POIS.length);
    expect(pois).toBe(poisRef); // array identity preserved

    const restaurants = pois.filter((poi) => poi.category === "restaurant");
    expect(restaurants.length).toBeGreaterThanOrEqual(8);
    const nearestRestaurant = Math.min(
      ...restaurants.map((poi) =>
        haversineDistance(
          DEMO_ARENA_CENTER.lat,
          DEMO_ARENA_CENTER.lng,
          poi.location.coordinates[1],
          poi.location.coordinates[0]
        )
      )
    );
    // ডেমো স্কেলে (১/৩) ১.৪ কিমি রেস্টুরেন্ট ~৪৭০ মি হয় — হেঁটে যাওয়ার মতো
    expect(nearestRestaurant).toBeLessThan(1000);
  });

  it("keeps relative distances consistent with the demo scale", () => {
    const gates = structuredClone(HARAM_GATES.slice(0, 4));
    const before = haversineDistance(
      gates[0].location.coordinates[1],
      gates[0].location.coordinates[0],
      gates[1].location.coordinates[1],
      gates[1].location.coordinates[0]
    );

    applyDemoWorld({ gates, hotels: [], places: [] });

    const after = haversineDistance(
      gates[0].location.coordinates[1],
      gates[0].location.coordinates[0],
      gates[1].location.coordinates[1],
      gates[1].location.coordinates[0]
    );
    expect(after).toBeCloseTo(before * DEMO_WORLD_SCALE, 1);
  });
});

describe("resolveDemoWorldActive", () => {
  it("activates from the URL param", () => {
    expect(resolveDemoWorldActive("?demo-world=1", null)).toBe(true);
    expect(resolveDemoWorldActive("?demo-world=yes", null)).toBe(true);
    expect(resolveDemoWorldActive("?demo-world=0", null)).toBe(false);
  });

  it("falls back to the stored value", () => {
    expect(resolveDemoWorldActive("", "1")).toBe(true);
    expect(resolveDemoWorldActive("", null)).toBe(false);
    expect(resolveDemoWorldActive("", "0")).toBe(false);
  });

  it("URL param wins over storage", () => {
    expect(resolveDemoWorldActive("?demo-world=0", "1")).toBe(false);
  });
});
