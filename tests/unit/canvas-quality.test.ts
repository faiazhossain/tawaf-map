import { describe, it, expect } from "vitest";
import { resolveCanvasQuality, MAX_CANVAS_PIXEL_RATIO } from "@/lib/map/canvas-quality";

describe("resolveCanvasQuality", () => {
  it("কম ঘনত্বের ডিসপ্লেতে (DPR < 2) MSAA চালু রাখে", () => {
    expect(resolveCanvasQuality(1)).toEqual({
      antialias: true,
      maxPixelRatio: MAX_CANVAS_PIXEL_RATIO,
    });
    expect(resolveCanvasQuality(1.5)).toEqual({
      antialias: true,
      maxPixelRatio: MAX_CANVAS_PIXEL_RATIO,
    });
  });

  it("উচ্চ-DPR ফোনে (DPR >= 2) MSAA বন্ধ করে রেজোলিউশন ২x-এ ক্যাপ করে", () => {
    expect(resolveCanvasQuality(2)).toEqual({
      antialias: false,
      maxPixelRatio: MAX_CANVAS_PIXEL_RATIO,
    });
    expect(resolveCanvasQuality(3)).toEqual({
      antialias: false,
      maxPixelRatio: MAX_CANVAS_PIXEL_RATIO,
    });
    // maxPixelRatio সবসময় একই — ক্যাপ ডিভাইস DPR-এর ওপর নির্ভর করে না।
    expect(resolveCanvasQuality(4).maxPixelRatio).toBe(MAX_CANVAS_PIXEL_RATIO);
  });

  it("ক্যাপ মানটি ২ — ডেস্কটপ ১x-এর চেয়ে বেশি, ফোন ৩x-এর চেয়ে কম", () => {
    expect(MAX_CANVAS_PIXEL_RATIO).toBe(2);
  });
});
