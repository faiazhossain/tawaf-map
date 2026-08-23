import { describe, it, expect } from "vitest";
import {
  polylineArcLengths,
  walkPolyline,
  applyPerpendicularVeer,
  createRouteWalker,
  autoWalkFix,
  metersOffset,
  type SimFix,
} from "@/lib/dev/gps-sim";
import { WALKING_SPEED } from "@/lib/utils/constants";

const ORIGIN: [number, number] = [39.8262, 21.4225];
const LNG_PER_M = 1 / (111320 * Math.cos((ORIGIN[1] * Math.PI) / 180));
const LAT_PER_M = 1 / 110540;

function at(eastM: number, northM: number): [number, number] {
  return [ORIGIN[0] + eastM * LNG_PER_M, ORIGIN[1] + northM * LAT_PER_M];
}

/** পূর্ব দিকে ১০০ মি করে ৩ সেগমেন্টের (৩০০ মি) সোজা রুট। */
const ROUTE: [number, number][] = [at(0, 0), at(100, 0), at(200, 0), at(300, 0)];

describe("polylineArcLengths", () => {
  it("প্রতিটি সেগমেন্টের মিটার দৈর্ঘ্য দেয়", () => {
    const lengths = polylineArcLengths(ROUTE);
    expect(lengths).toHaveLength(3);
    for (const length of lengths) {
      expect(length).toBeGreaterThan(99);
      expect(length).toBeLessThan(101);
    }
  });
});

describe("walkPolyline", () => {
  it("গতি অনুযায়ী প্রবেশিত দূরত্ব ধরে হাঁটে", () => {
    const fix = walkPolyline(ROUTE, 150);
    const offset = metersOffset(
      { lng: at(150, 0)[0], lat: at(150, 0)[1] },
      { lng: fix.longitude, lat: fix.latitude }
    );
    expect(Math.hypot(offset.east, offset.north)).toBeLessThan(0.5);
  });

  it("শেষে পৌঁছে থেমে যায় (রিং-এর মতো ঘোরে না)", () => {
    const fix = walkPolyline(ROUTE, 999);
    const end = metersOffset(
      { lng: at(300, 0)[0], lat: at(300, 0)[1] },
      { lng: fix.longitude, lat: fix.latitude }
    );
    expect(Math.hypot(end.east, end.north)).toBeLessThan(0.5);
  });

  it("হেডিং চলার সেগমেন্টের দিকে (পূর্ব = ৯০°)", () => {
    const fix = walkPolyline(ROUTE, 150);
    expect(fix.heading).toBeGreaterThan(89);
    expect(fix.heading).toBeLessThan(91);
  });

  it("২টির কম বিন্দুতে থ্রো করে", () => {
    expect(() => walkPolyline([at(0, 0)], 10)).toThrow();
  });
});

describe("applyPerpendicularVeer", () => {
  it("লম্ব দিকে নির্দিষ্ট মিটার সরায় (পূর্বমুখী হাঁটায় ডানে = দক্ষিণ)", () => {
    const fix: SimFix = {
      latitude: at(150, 0)[1],
      longitude: at(150, 0)[0],
      accuracy: 8,
      heading: 90,
      speed: WALKING_SPEED,
    };
    const veered = applyPerpendicularVeer(fix, 20);
    const offset = metersOffset(
      { lng: fix.longitude, lat: fix.latitude },
      { lng: veered.longitude, lat: veered.latitude }
    );
    expect(offset.north).toBeLessThan(-19.5);
    expect(offset.north).toBeGreaterThan(-20.5);
    expect(Math.abs(offset.east)).toBeLessThan(0.5);
    expect(veered.heading).toBe(90);
  });

  it("শূন্য হলে অপরিবর্তিত", () => {
    const fix: SimFix = {
      latitude: at(150, 0)[1],
      longitude: at(150, 0)[0],
      accuracy: 8,
      heading: 90,
      speed: WALKING_SPEED,
    };
    expect(applyPerpendicularVeer(fix, 0)).toEqual(fix);
  });
});

describe("createRouteWalker", () => {
  function makeClock(startMs = 0) {
    let t = startMs;
    return {
      now: () => t,
      advance: (ms: number) => {
        t += ms;
      },
    };
  }

  it("রুট দিলে রুট ধরে হাঁটে, না দিলে রিং-এ ফিরে যায়", () => {
    const clock = makeClock();
    let path: [number, number][] | null = null;
    const walker = createRouteWalker({ now: clock.now, getRoutePath: () => path });

    const ringFix = walker.nextFix();
    const ringCompare = autoWalkFix(0);
    expect(ringFix.latitude).toBeCloseTo(ringCompare.latitude, 8);
    expect(ringFix.longitude).toBeCloseTo(ringCompare.longitude, 8);

    // রুট দেখা পড়ার টিকেই যাত্রা শুরু — প্রথম টিকে রুটের শুরুতেই থাকে।
    path = ROUTE;
    const routeStart = walker.nextFix();
    const atStart = metersOffset(
      { lng: at(0, 0)[0], lat: at(0, 0)[1] },
      { lng: routeStart.longitude, lat: routeStart.latitude }
    );
    expect(Math.hypot(atStart.east, atStart.north)).toBeLessThan(0.5);

    clock.advance(1000);
    const routeFix = walker.nextFix();
    const onRoute = metersOffset(
      { lng: at(WALKING_SPEED, 0)[0], lat: at(WALKING_SPEED, 0)[1] },
      { lng: routeFix.longitude, lat: routeFix.latitude }
    );
    expect(Math.hypot(onRoute.east, onRoute.north)).toBeLessThan(0.5);

    path = null;
    const backToRing = walker.nextFix();
    const ringFresh = autoWalkFix(0);
    expect(backToRing.latitude).toBeCloseTo(ringFresh.latitude, 8);
  });

  it("নতুন রুট (রেফারেন্স বদল) এ যাত্রা শূন্য থেকে শুরু", () => {
    const clock = makeClock();
    let path: [number, number][] | null = ROUTE;
    const walker = createRouteWalker({ now: clock.now, getRoutePath: () => path });

    walker.nextFix(); // রুট নিবন্ধিত
    clock.advance(20000);
    walker.nextFix(); // ~২৭.৮ মি হাঁটা

    path = [at(0, 0), at(50, 0), at(150, 0)]; // রিয়ারাউটকৃত জ্যামিতি
    walker.nextFix(); // নতুন রুট নিবন্ধিত — যাত্রা শূন্য
    clock.advance(1000);
    const fix = walker.nextFix();
    const fresh = metersOffset(
      { lng: at(WALKING_SPEED, 0)[0], lat: at(WALKING_SPEED, 0)[1] },
      { lng: fix.longitude, lat: fix.latitude }
    );
    expect(Math.hypot(fresh.east, fresh.north)).toBeLessThan(0.5);
  });

  it("veer মান প্রতি টিকে পড়ে এবং রিং-এ প্রযোজ্য নয়", () => {
    const clock = makeClock();
    let path: [number, number][] | null = ROUTE;
    let veer = 0;
    const walker = createRouteWalker({
      now: clock.now,
      getRoutePath: () => path,
      getVeerM: () => veer,
    });

    walker.nextFix(); // রুট নিবন্ধিত, veer এখনো ০
    veer = 20;
    clock.advance(1000);
    const veeredFix = walker.nextFix();
    const expectedBase = walkPolyline(ROUTE, WALKING_SPEED);
    const offset = metersOffset(
      { lng: expectedBase.longitude, lat: expectedBase.latitude },
      { lng: veeredFix.longitude, lat: veeredFix.latitude }
    );
    // ঠিক লম্ব দূরত্ব: পূর্বমুখী হাঁটায় বিচ্যুতি খাঁটি দক্ষিণে।
    expect(Math.hypot(offset.east, offset.north)).toBeGreaterThan(19.5);
    expect(Math.hypot(offset.east, offset.north)).toBeLessThan(20.5);
    expect(offset.north).toBeLessThan(-19.5);
    expect(Math.abs(offset.east)).toBeLessThan(0.5);

    path = null;
    const ringFix = walker.nextFix();
    const ringCompare = autoWalkFix(0);
    // রিং-হাঁটায় veer প্রয়োগ হয় না — রিং-এর শুরুতেই থাকা উচিত।
    expect(ringFix.latitude).toBeCloseTo(ringCompare.latitude, 8);
    expect(ringFix.longitude).toBeCloseTo(ringCompare.longitude, 8);
  });
});
