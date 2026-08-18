import { describe, it, expect } from "vitest";
import { DEMO_POIS } from "@/lib/data/pois";
import { MAKKAH_CENTER } from "@/lib/utils/constants";
import { haversineDistance } from "@/lib/utils/distance";

/**
 * ডেমো POI ডেটার স্বাস্থ্য-পরীক্ষা — ভুল কোঅর্ডিনেট বা ফাঁকা নাম যেন
 * "আমার কাছে" তালিকায় নীরবে ঢুকে না যায়।
 */
describe("DEMO_POIS data sanity", () => {
  it("has a meaningful number of items in each expected category", () => {
    const byCategory = new Map<string, number>();
    for (const poi of DEMO_POIS) {
      byCategory.set(poi.category, (byCategory.get(poi.category) ?? 0) + 1);
    }
    expect(byCategory.get("restaurant") ?? 0).toBeGreaterThanOrEqual(8);
    expect(byCategory.get("cafe") ?? 0).toBeGreaterThanOrEqual(4);
    expect(byCategory.get("toilet") ?? 0).toBeGreaterThanOrEqual(6);
    expect(byCategory.get("atm") ?? 0).toBeGreaterThanOrEqual(4);
    expect(byCategory.get("pharmacy") ?? 0).toBeGreaterThanOrEqual(3);
    expect(byCategory.get("mosque") ?? 0).toBeGreaterThanOrEqual(4);
  });

  it("has unique ids", () => {
    const ids = new Set(DEMO_POIS.map((poi) => poi.id));
    expect(ids.size).toBe(DEMO_POIS.length);
  });

  it("every POI has a non-empty Bengali name and valid coordinates", () => {
    for (const poi of DEMO_POIS) {
      expect(poi.name.trim().length).toBeGreaterThan(0);
      // বাংলা অক্ষর আছে (ইউনিকোড ব্লপ 0980–09FF)
      expect(poi.name).toMatch(/[ঀ-৿]/);
      const [lng, lat] = poi.location.coordinates;
      expect(lng).toBeGreaterThan(39.7);
      expect(lng).toBeLessThan(39.95);
      expect(lat).toBeGreaterThan(21.3);
      expect(lat).toBeLessThan(21.55);
    }
  });

  it("keeps every POI within 3km of the Haram center (demo rings)", () => {
    for (const poi of DEMO_POIS) {
      const [lng, lat] = poi.location.coordinates;
      const dist = haversineDistance(MAKKAH_CENTER.lat, MAKKAH_CENTER.lng, lat, lng);
      expect(dist).toBeLessThan(3000);
    }
  });

  it("marks all restaurants halal except none accidentally missing the flag", () => {
    for (const poi of DEMO_POIS) {
      if (poi.category === "restaurant") {
        expect(poi.halal).toBe(true);
      }
    }
  });

  it("includes at least one non-halal cafe so the halal-only filter is observable", () => {
    const nonHalal = DEMO_POIS.filter((poi) => poi.halal === false);
    expect(nonHalal.length).toBeGreaterThanOrEqual(1);
  });
});
