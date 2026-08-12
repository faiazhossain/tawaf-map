import { describe, it, expect } from "vitest";
import { miqatRingOutline, MIQAT_POINTS } from "@/lib/data/umrah/miqat";
import { bearing } from "@/lib/map/umrah-overlay";

// কাবা কেন্দ্র — miqat.ts-এর MIQAT_RING_CENTER-এর সাথে সঙগত।
const KAABA_CENTER = [39.8262, 21.4225] as [number, number];

const OUTER_IDS = MIQAT_POINTS.map((m) => m.id).filter((id) => id !== "taneem");

function coordEqual(a: number[], b: number[]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

describe("miqatRingOutline - বাইরের মিকাত রিং", () => {
  const ring = miqatRingOutline();

  it("৬টি শীর্ষবিন্দু ফেরত দেয় (৫টি বাইরের পয়েন্ট + বদ্ধ রিং)", () => {
    expect(ring).toHaveLength(6);
  });

  it("বদ্ধ রিং - প্রথম === শেষ বিন্দু", () => {
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });

  it("তানাইম ('হিল' পয়েন্ট) রিংয়ে নেই", () => {
    const taneem = MIQAT_POINTS.find((m) => m.id === "taneem")!;
    const present = ring.some((c) => coordEqual(c, taneem.location.coordinates));
    expect(present).toBe(false);
  });

  it("প্রতিটি বাইরের মিকাত উপস্থিত (বদ্ধ রিংয়ে প্রথম বিন্দু শেষে পুনরাবৃত্ত)", () => {
    expect(OUTER_IDS).toHaveLength(5);
    for (const id of OUTER_IDS) {
      const m = MIQAT_POINTS.find((p) => p.id === id)!;
      const matches = ring.filter((c) => coordEqual(c, m.location.coordinates));
      expect(matches.length).toBeGreaterThanOrEqual(1);
      expect(matches.length).toBeLessThanOrEqual(2);
    }
  });

  it("ঘড়ির বিপরীত দিকে (counter-clockwise) - ধনাত্মক shoelace ক্ষেত্রফল", () => {
    // shoelace on (lng, lat): ধনাত্মক = গাণিতিক CCW = মানচিত্রে ঘড়ির বিপরীত দিক।
    let sum = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      sum += x1 * y2 - x2 * y1;
    }
    expect(sum).toBeGreaterThan(0);
  });

  it("কাবা থেকে প্রতিটি বিন্দুর bearing ক্রমান্বয়ে কমে (CCW ক্রম)", () => {
    const interior = ring.slice(0, ring.length - 1); // বদ্ধ প্রতিলিপি বাদ
    const bearings = interior.map((c) => bearing(KAABA_CENTER, c as [number, number]));
    for (let i = 0; i < bearings.length - 1; i++) {
      let diff = bearings[i] - bearings[i + 1];
      if (diff < -180) diff += 360; // ০°/৩৬০° সীমানা অতিক্রম ধরা
      expect(diff).toBeGreaterThan(0);
    }
  });
});
