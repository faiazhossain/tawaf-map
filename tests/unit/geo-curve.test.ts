import { describe, it, expect } from "vitest";
import { curvedArc } from "@/lib/geo/curve";
import { metersOffset } from "@/lib/geo/plane";
import { haversineDistance } from "@/lib/utils/distance";

// মক্কার কাছাকাছি রেফারেন্স বিন্দু — বাস্তব অক্ষাংশে পরীক্ষণ করা ভালো।
const ORIGIN: [number, number] = [39.8262, 21.4225];

/** ORIGIN থেকে পূর্বে `eastM` ও উত্তরে `northM` সরে যাওয়া বিন্দু। */
function at(eastM: number, northM: number): [number, number] {
  const lngPerM = 1 / (111320 * Math.cos((ORIGIN[1] * Math.PI) / 180));
  return [ORIGIN[0] + eastM * lngPerM, ORIGIN[1] + northM / 110540];
}

/** জ্যার (from -> to) তীরের ওপর প্রতিটি নমুনা-বিন্দুর সাইনড লম্ব দূরত্ব। */
function signedPerpendicularM(
  point: [number, number],
  from: [number, number],
  to: [number, number]
) {
  const v = metersOffset({ lng: from[0], lat: from[1] }, { lng: to[0], lat: to[1] });
  const m = metersOffset({ lng: from[0], lat: from[1] }, { lng: point[0], lat: point[1] });
  const len = Math.hypot(v.east, v.north);
  // ক্রস-গুণনের চিহ্ন: ধনাত্মক = তীরের বাঁয়ে, ঋণাত্মক = ডানে।
  return (v.east * m.north - v.north * m.east) / len;
}

describe("curvedArc", () => {
  it("প্রান্ত দুটি হুবহু ইনপুট বিন্দু", () => {
    const from = at(0, 0);
    const to = at(60, 30);
    const arc = curvedArc(from, to);
    expect(arc.geometry[0]).toEqual(from);
    expect(arc.geometry[arc.geometry.length - 1]).toEqual(to);
  });

  it("দূরত্ব জ্যার চেয়ে বেশি, কিন্তু সর্বোচ্চ ৫% বেশি", () => {
    const from = at(0, 0);
    const to = at(80, -40);
    const chord = haversineDistance(from[1], from[0], to[1], to[0]);
    const arc = curvedArc(from, to);
    expect(arc.distance).toBeGreaterThan(chord);
    expect(arc.distance).toBeLessThan(chord * 1.05);
  });

  it("bowRatio 0 হলে কার্যত সরলরেখা", () => {
    const from = at(0, 0);
    const to = at(70, 20);
    const arc = curvedArc(from, to, { bowRatio: 0 });
    const chord = haversineDistance(from[1], from[0], to[1], to[0]);
    expect(arc.distance).toBeLessThan(chord * 1.001);
    for (const point of arc.geometry) {
      expect(Math.abs(signedPerpendicularM(point as [number, number], from, to))).toBeLessThan(0.5);
    }
  });

  it("ডিফল্টে বাঁক যাত্রার দিকের বাঁয়ে, bowSide -1 এ ডানে", () => {
    const from = at(0, 0);
    const to = at(100, 0);
    const midDefault = curvedArc(from, to).geometry.map((p) => p as [number, number]);
    const midFlipped = curvedArc(from, to, { bowSide: -1 }).geometry.map(
      (p) => p as [number, number]
    );
    expect(signedPerpendicularM(midDefault[6], from, to)).toBeGreaterThan(1);
    expect(signedPerpendicularM(midFlipped[6], from, to)).toBeLessThan(-1);
  });

  it("লম্বা জ্যায় বাঁক maxBowM-এ সীমাবদ্ধ", () => {
    // ১০০০ মি জ্যায় ০.১২ অনুপাত বলে ১২০ মি হত, কিন্তু সীমা ৪০ মি।
    const from = at(0, 0);
    const to = at(1000, 0);
    const arc = curvedArc(from, to).geometry.map((p) => p as [number, number]);
    const midOffset = Math.abs(signedPerpendicularM(arc[arc.length / 2], from, to));
    expect(midOffset).toBeGreaterThan(15); // কন্ট্রোল-অফসেট ৪০ মির অর্ধেকের কাছাকাছি
    expect(midOffset).toBeLessThan(25);
  });

  it("ছোট জ্যায়ও minSamples-এর নমুনা, বিন্দু-ব্যবধান sampleStepM-এর কাছাকাছি", () => {
    const small = curvedArc(at(0, 0), at(20, 5));
    expect(small.geometry.length).toBeGreaterThanOrEqual(12);

    const medium = curvedArc(at(0, 0), at(120, 0)).geometry;
    for (let i = 0; i < medium.length - 1; i++) {
      const step = haversineDistance(
        medium[i][1],
        medium[i][0],
        medium[i + 1][1],
        medium[i + 1][0]
      );
      // চাপের বক্রতায় সরল ব্যবধানের চেয়ে সামান্য বেশি — ১.৫ মি ছাড়।
      expect(step).toBeLessThan(6 + 1.5);
    }
  });

  it("কিলোমিটার-লম্বা জ্যায় নমুনা maxSamples-এ সীমাবদ্ধ", () => {
    const arc = curvedArc(at(0, 0), at(2000, 300));
    expect(arc.geometry.length).toBeLessThanOrEqual(256);
  });

  it("অভিন্ন বিন্দুতে NaN নয়, শূন্য-দূরত্ব", () => {
    const point = at(50, 50);
    const arc = curvedArc(point, point);
    expect(arc.geometry).toHaveLength(2);
    expect(arc.distance).toBe(0);
    expect(Number.isNaN(arc.geometry[0][0])).toBe(false);
    expect(Number.isNaN(arc.geometry[1][1])).toBe(false);
  });
});
