import { describe, it, expect } from "vitest";
import { getActiveGates, getActiveGateById } from "@/lib/gates/active";
import { GATES_OSM } from "@/lib/data/gates-osm.generated";
import { HARAM_GATES } from "@/lib/data/gates";

/**
 * ডিফল্ট (jsdom, ডেমো-ইনঅ্যাক্টিভ): `isDemoWorldActive()` ডেকলে
 * `activationDemoWorld()` চালায় — কিন্তু কোনো URL/localStorage ফ্ল্যাগ ছাড়া
 * এটি মিশ্রিত হবে না। তাই ডিফল্টে `getActiveGates()` অবশ্যই real `GATES_OSM` দেবে।
 */
describe("getActiveGates (default, real mode)", () => {
  it("ডেমো ছাড়া Overpass ডেটাসেট (GATES_OSM) ফেরত দেয়", () => {
    const active = getActiveGates();
    expect(active).toBe(GATES_OSM);
    expect(active).not.toBe(HARAM_GATES);
    // OSM ডেটাসেটে 100+ মসজিদের গেট আছে
    expect(active.length).toBe(GATES_OSM.length);
    expect(active.length).toBeGreaterThan(100);
  });

  it("getActiveGateById অস্তিত্বশীল গেট খুঁজে পায়", () => {
    const first = getActiveGates()[0];
    if (!first) throw new Error("গেট ডেটাসেট খালি");
    expect(getActiveGateById(first.id)?.id).toBe(first.id);
    expect(getActiveGateById("no-such-gate")).toBeUndefined();
  });

  it("OSM গেটে কোনো curated type নেই (জাতীয় fallback 'umrah' প্রয়োজনে)", () => {
    GATES_OSM.forEach((g) => {
      expect(g.type).toBeUndefined();
    });
  });
});
