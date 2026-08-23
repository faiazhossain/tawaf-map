import { describe, it, expect } from "vitest";
import {
  locateOnPolyline,
  buildStepBoundaries,
  stepIndexForDistance,
  nextOffRouteCounters,
  computeRouteProgress,
  sliceRemainingGeometry,
  totalPolylineDistance,
  OFF_ROUTE_ENTER_M,
  OFF_ROUTE_EXIT_M,
  ARRIVAL_RADIUS_M,
  APPROACH_ENTER_REMAINING_M,
} from "@/lib/routing/route-progress";
import { haversineDistance, estimateWalkingTime } from "@/lib/utils/distance";
import type { RouteStep } from "@/types/navigation";

// মক্কার কাছাকাছি একটি রেফারেন্স বিন্দু — স্থানীয়-সমতল গণিত যেকোনো
// অক্ষাংশেই একই আচরণ করে, তবে বাস্তব মান দিয়ে টেস্ট করা ভালো।
const ORIGIN: [number, number] = [39.8262, 21.4225];

/** ORIGIN থেকে পূর্বে `eastM` ও উত্তরে `northM` সরে যাওয়া বিন্দু। */
function at(eastM: number, northM: number): [number, number] {
  const lngPerM = 1 / (111320 * Math.cos((ORIGIN[1] * Math.PI) / 180));
  return [ORIGIN[0] + eastM * lngPerM, ORIGIN[1] + northM / 110540];
}

/** পূর্ব-পশ্চিমে টানা ১০০ মিটার করে ৪ সেগমেন্টের (৪০০ মি) সোজা পলিলাইন। */
const LINE: number[][] = [at(0, 0), at(100, 0), at(200, 0), at(300, 0), at(400, 0)];

function makeSteps(distances: number[]): RouteStep[] {
  return distances.map((distance) => ({
    instruction: "এগিয়ে চলুন",
    distance,
    duration: distance / 1.39,
    maneuver: "continue",
  }));
}

describe("locateOnPolyline", () => {
  it("রুটের ঠিক ওপরের পয়েন্টে দূরত্ব শূন্য ও স্ন্যাপ নিজেই", () => {
    const located = locateOnPolyline(LINE, at(150, 0));
    expect(located.distanceFromRoute).toBeLessThan(0.01);
    expect(
      haversineDistance(located.snapped[1], located.snapped[0], at(150, 0)[1], at(150, 0)[0])
    ).toBeLessThan(0.05);
  });

  it("লম্ব দূরত্ব মিটারে মাপে", () => {
    const located = locateOnPolyline(LINE, at(150, 40));
    expect(located.distanceFromRoute).toBeGreaterThan(39.9);
    expect(located.distanceFromRoute).toBeLessThan(40.1);
  });

  it("দূরত্ব-বরাবর অবস্থান হাঁটার সাথে একঘণ্যভাবে বাড়ে", () => {
    const at25 = locateOnPolyline(LINE, at(25, 0)).distanceAlongRoute;
    const at150 = locateOnPolyline(LINE, at(150, 0)).distanceAlongRoute;
    const at350 = locateOnPolyline(LINE, at(350, 0)).distanceAlongRoute;
    expect(at25).toBeGreaterThan(24.5);
    expect(at25).toBeLessThan(25.5);
    expect(at150).toBeGreaterThan(149.5);
    expect(at150).toBeLessThan(150.5);
    expect(at350).toBeGreaterThan(at150);
    expect(at150).toBeGreaterThan(at25);
  });

  it("শেষ বিন্দুর পরে গেলে শেষ ভার্টেক্সে ক্ল্যাম্প হয়", () => {
    const located = locateOnPolyline(LINE, at(500, 30));
    expect(located.distanceAlongRoute).toBeGreaterThan(399.5);
    expect(located.snapped[0]).toBeCloseTo(at(400, 0)[0], 8);
    expect(located.snapped[1]).toBeCloseTo(at(400, 0)[1], 8);
  });

  it("২টির কম বিন্দুতে থ্রো করে", () => {
    expect(() => locateOnPolyline([at(0, 0)], at(1, 1))).toThrow();
  });
});

describe("nextOffRouteCounters", () => {
  it("একক জিটার ফিক্সে sustained হয় না", () => {
    const next = nextOffRouteCounters({ consecutive: 0, sustained: false }, 45);
    expect(next).toEqual({ consecutive: 1, sustained: false });
  });

  it("টানা ৩ ফিক্সে sustained হয়", () => {
    let state = { consecutive: 0, sustained: false };
    state = nextOffRouteCounters(state, 45);
    state = nextOffRouteCounters(state, 45);
    state = nextOffRouteCounters(state, 45);
    expect(state.sustained).toBe(true);
    expect(state.consecutive).toBe(3);
  });

  it("২০-৩০ মি ব্যান্ডে গণনা আটকে থাকে (জিটার জমে না)", () => {
    let state = nextOffRouteCounters({ consecutive: 0, sustained: false }, 45);
    expect(state.consecutive).toBe(1);
    state = nextOffRouteCounters(state, 25);
    expect(state.consecutive).toBe(1);
    state = nextOffRouteCounters(state, 25);
    expect(state.consecutive).toBe(1);
    expect(state.sustained).toBe(false);
  });

  it(`${OFF_ROUTE_EXIT_M} মি-র ভিতরে ফিরলে রিসেট হয়`, () => {
    let state = nextOffRouteCounters({ consecutive: 2, sustained: false }, 45);
    state = nextOffRouteCounters(state, OFF_ROUTE_EXIT_M);
    expect(state).toEqual({ consecutive: 0, sustained: false });
  });

  it("কাস্টম থ্রেশহোল্ড মানে", () => {
    const next = nextOffRouteCounters({ consecutive: 0, sustained: false }, 12, {
      enterM: 10,
      sustainedFixes: 1,
    });
    expect(next).toEqual({ consecutive: 1, sustained: true });
  });
});

describe("buildStepBoundaries + stepIndexForDistance", () => {
  it("ধাপের দূরত্বের যোগফল মোট দূরত্বের সাথে না মিললে স্কেল হয়", () => {
    const steps = makeSteps([100, 100, 100]); // যোগফল ৩০০
    const boundaries = buildStepBoundaries(steps, 400);
    expect(boundaries).toHaveLength(3);
    expect(boundaries[2]).toBe(400);
    expect(boundaries[0]).toBeCloseTo(400 / 3, 5);
    expect(boundaries[1]).toBeCloseTo((400 * 2) / 3, 5);
  });

  it("ইনডেক্স কখনো পিছায় না (একমুখী ক্ল্যাম্প)", () => {
    const boundaries = buildStepBoundaries(makeSteps([100, 100]), 200);
    expect(stepIndexForDistance(boundaries, 150, 0)).toBe(1);
    expect(stepIndexForDistance(boundaries, 50, 1)).toBe(1);
    expect(stepIndexForDistance(boundaries, 0, 1)).toBe(1);
  });

  it("ফাঁকা steps-এ একক সীমানা — ইনডেক্স সবসময় ০ (বা minStepIndex)", () => {
    expect(buildStepBoundaries([], 400)).toEqual([400]);
    expect(buildStepBoundaries(makeSteps([0, 0]), 400)).toEqual([400]);
    const boundaries = buildStepBoundaries([], 400);
    expect(stepIndexForDistance(boundaries, 250, 0)).toBe(0);
  });
});

describe("computeRouteProgress", () => {
  const DEST: [number, number] = at(400, 0);

  it("হাঁটার সাথে অবশিষ্ট দূরত্ব ও সময় হ্রাস পায়", () => {
    const early = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([200, 200]),
      point: at(50, 0),
      destination: DEST,
    });
    const late = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([200, 200]),
      point: at(300, 0),
      destination: DEST,
    });
    expect(late.remainingDistance).toBeLessThan(early.remainingDistance);
    expect(late.remainingDuration).toBe(estimateWalkingTime(late.remainingDistance));
    expect(early.remainingDistance).toBeGreaterThan(340);
    expect(early.remainingDistance).toBeLessThan(360);
    expect(late.remainingDistance).toBeGreaterThan(90);
    expect(late.remainingDistance).toBeLessThan(110);
  });

  it("ধাপ সীমানা পেরোলে currentStepIndex বাড়ে", () => {
    const before = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([200, 200]),
      point: at(150, 0),
      destination: DEST,
    });
    const after = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([200, 200]),
      point: at(250, 0),
      destination: DEST,
      minStepIndex: before.currentStepIndex,
    });
    expect(before.currentStepIndex).toBe(0);
    expect(after.currentStepIndex).toBe(1);
  });

  it("remainingGeometry স্ন্যাপড বিন্দু থেকে শুরু হয় ও রুটের শেষে শেষ হয়", () => {
    const progress = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([200, 200]),
      point: at(150, 0),
      destination: DEST,
    });
    expect(progress.remainingGeometry.length).toBeGreaterThan(1);
    expect(progress.remainingGeometry[0][0]).toBeCloseTo(at(150, 0)[0], 8);
    const last = progress.remainingGeometry[progress.remainingGeometry.length - 1];
    expect(last[0]).toBeCloseTo(at(400, 0)[0], 8);
    expect(last[1]).toBeCloseTo(at(400, 0)[1], 8);
  });

  it(`গন্তব্যের ${ARRIVAL_RADIUS_M} মি-র মধ্যে এলে hasArrived (কাঁচা ফিক্স থেকে)`, () => {
    const arrived = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: at(395, 10),
      destination: DEST,
    });
    expect(arrived.hasArrived).toBe(true);

    const far = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: at(350, 0),
      destination: DEST,
    });
    expect(far.hasArrived).toBe(false);
  });

  it("destination null হলে কখনো আগমন নয়", () => {
    const progress = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: at(400, 0),
      destination: null,
    });
    expect(progress.hasArrived).toBe(false);
  });

  it("অফ-রুট দূরত্ব রিপোর্ট করে", () => {
    const onRoute = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: at(150, 0),
      destination: DEST,
    });
    const offRoute = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: at(150, 35),
      destination: DEST,
    });
    expect(onRoute.distanceFromRoute).toBeLessThan(1);
    expect(offRoute.distanceFromRoute).toBeGreaterThan(OFF_ROUTE_ENTER_M - 1);
  });
});

describe("computeRouteProgress — চূড়ান্ত পর্যায় (সংযোগকারী)", () => {
  // গন্তব্য রাস্তার শেষ বিন্দুর ৪০ মি উত্তরে — রাস্তার তথ্য নেই এমন উঠানে।
  const APPROACH_DEST: [number, number] = at(400, 40);
  const approach = {
    geometry: [at(400, 0), APPROACH_DEST],
    distance: 40,
  };

  it("রাস্তায় বহু বাকি থাকলে চূড়ান্ত পর্যায় নয়", () => {
    const progress = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: at(350, 0),
      destination: APPROACH_DEST,
      approach,
    });
    expect(progress.inApproach).toBe(false);
    expect(progress.snapped[0]).toBeCloseTo(at(350, 0)[0], 8);
  });

  it(`রাস্তায় ${APPROACH_ENTER_REMAINING_M} মি বা কম বাকি থাকলে চূড়ান্ত পর্যায়`, () => {
    const fix = at(395, 0);
    const progress = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: fix,
      destination: APPROACH_DEST,
      approach,
    });

    const direct = haversineDistance(fix[1], fix[0], APPROACH_DEST[1], APPROACH_DEST[0]);
    expect(progress.inApproach).toBe(true);
    expect(progress.approachRemainingM).toBeGreaterThan(direct - 0.5);
    expect(progress.approachRemainingM).toBeLessThan(direct + 0.5);
    // স্ন্যাপ নয়, কাঁচা ফিক্সই অবস্থান।
    expect(progress.snapped).toEqual(fix);
    // অবশিষ্ট = রাস্তার বাকি (~৫ মি) + গন্তব্য পর্যন্ত সরলরেখা।
    expect(progress.remainingDistance).toBeGreaterThan(direct + 4);
    expect(progress.remainingDistance).toBeLessThan(direct + 6);
  });

  it("শেষ বিন্দু পেরিয়ে গেলে পর্যায় অটল — অবশিষ্ট শুধু গন্তব্য পর্যন্ত", () => {
    const fix = at(410, 5);
    const progress = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: fix,
      destination: APPROACH_DEST,
      approach,
    });

    const direct = haversineDistance(fix[1], fix[0], APPROACH_DEST[1], APPROACH_DEST[0]);
    expect(progress.inApproach).toBe(true);
    expect(progress.remainingDistance).toBeGreaterThan(direct - 0.5);
    expect(progress.remainingDistance).toBeLessThan(direct + 0.5);
  });

  it("সংযোগকারী না থাকলে শেষ বিন্দুতেও চূড়ান্ত পর্যায় নয়", () => {
    const progress = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: at(400, 0),
      destination: at(400, 0),
    });
    expect(progress.inApproach).toBe(false);
    expect(progress.approachRemainingM).toBe(0);
  });

  it("গন্তব্য null হলে চূড়ান্ত পর্যায় অসম্ভব", () => {
    const progress = computeRouteProgress({
      geometry: LINE,
      steps: makeSteps([400]),
      point: at(400, 0),
      destination: null,
      approach,
    });
    expect(progress.inApproach).toBe(false);
  });
});

describe("sliceRemainingGeometry", () => {
  it("প্রথম বিন্দু স্ন্যাপড, শেষ বিন্দু রুটের শেষ", () => {
    const located = locateOnPolyline(LINE, at(150, 0));
    const remaining = sliceRemainingGeometry(LINE, located);
    expect(remaining[0][0]).toBeCloseTo(at(150, 0)[0], 8);
    expect(remaining[0][1]).toBeCloseTo(at(150, 0)[1], 8);
    expect(remaining[remaining.length - 1]).toEqual(LINE[LINE.length - 1]);
  });

  it("রুটের শেষে একক স্ন্যাপড বিন্দু", () => {
    const located = locateOnPolyline(LINE, at(400, 0));
    const remaining = sliceRemainingGeometry(LINE, located);
    expect(remaining).toHaveLength(1);
  });
});

describe("totalPolylineDistance", () => {
  it("সেগমেন্ট দৈর্ঘ্যের যোগফল", () => {
    expect(totalPolylineDistance(LINE)).toBeGreaterThan(399);
    expect(totalPolylineDistance(LINE)).toBeLessThan(401);
  });
});
