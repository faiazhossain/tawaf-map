import { describe, it, expect } from "vitest";
import { buildApproach, buildApproximateRoute, APPROACH_MIN_GAP_M } from "@/lib/routing/approach";
import { haversineDistance, estimateWalkingTime } from "@/lib/utils/distance";

// মক্কার কাছাকাছি রেফারেন্স বিন্দু।
const ORIGIN: [number, number] = [39.8262, 21.4225];

/** ORIGIN থেকে পূর্বে `eastM` ও উত্তরে `northM` সরে যাওয়া বিন্দু। */
function at(eastM: number, northM: number): [number, number] {
  const lngPerM = 1 / (111320 * Math.cos((ORIGIN[1] * Math.PI) / 180));
  return [ORIGIN[0] + eastM * lngPerM, ORIGIN[1] + northM / 110540];
}

describe("buildApproach", () => {
  it(`${APPROACH_MIN_GAP_M} মির চেয়ে ছোট ফাঁকে কিছু নয়`, () => {
    const geometry = [at(0, 0), at(100, 0)];
    expect(buildApproach(geometry, at(105, 0))).toBeNull();
  });

  it("ফাঁক সীমা ছাড়ালে শেষ ভার্টেক্স থেকে গন্তব্য পর্যন্ত চাপ", () => {
    const last = at(100, 0);
    const geometry = [at(0, 0), last];
    const destination = at(100, 40);
    const approach = buildApproach(geometry, destination);

    expect(approach).not.toBeNull();
    expect(approach!.geometry[0]).toEqual(last);
    expect(approach!.geometry[approach!.geometry.length - 1]).toEqual(destination);

    const gap = haversineDistance(last[1], last[0], destination[1], destination[0]);
    expect(approach!.distance).toBeGreaterThan(gap);
    expect(approach!.distance).toBeLessThan(gap * 1.05);
  });

  it("ফাঁকা জ্যামিতিতে null", () => {
    expect(buildApproach([], at(50, 50))).toBeNull();
  });
});

describe("buildApproximateRoute", () => {
  const origin = at(0, 0);
  const destination = at(180, 90);

  it("approximate ফ্ল্যাগ, প্রান্তবিন্দু সঠিক, দূরত্ব-সময় সামঞ্জস্যপূর্ণ", () => {
    const route = buildApproximateRoute(origin, destination);

    expect(route.approximate).toBe(true);
    expect(route.approach).toBeNull();
    expect(route.geometry[0]).toEqual(origin);
    expect(route.geometry[route.geometry.length - 1]).toEqual(destination);
    expect(route.distance).toBeGreaterThan(
      haversineDistance(origin[1], origin[0], destination[1], destination[0])
    );
    expect(route.duration).toBe(estimateWalkingTime(route.distance));
  });

  it("একটাই ধাপ — বাংলা নির্দেশনা", () => {
    const route = buildApproximateRoute(origin, destination);

    expect(route.steps).toHaveLength(1);
    expect(route.steps[0].instruction).toBe("গন্তব্যের দিকে সোজা হেঁটে যান");
    expect(route.steps[0].maneuver).toBe("arrive");
  });

  it("আইডি আনুমানিক রুট বোঝায়", () => {
    const route = buildApproximateRoute(origin, destination);
    expect(route.id).toMatch(/^route-approx-/);
  });
});
