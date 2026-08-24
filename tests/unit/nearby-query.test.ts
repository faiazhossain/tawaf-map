import { describe, it, expect } from "vitest";
import {
  getNearbyItems,
  getNearbyCounts,
  gateToNearbyItem,
  shouldEmitPositionChange,
  nearbyRadiusBounds,
  nearbySubtitle,
  nearbyLiveFields,
  nextDistanceTrend,
} from "@/lib/nearby/query";
import { DEMO_POIS } from "@/lib/data/pois";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { HARAM_GATES } from "@/lib/data/gates";
import { getActiveGates } from "@/lib/gates/active";
import { haversineDistance } from "@/lib/utils/distance";
import { MAKKAH_CENTER } from "@/lib/utils/constants";
import type { NearbyCategory } from "@/types/nearby";
import type { POI } from "@/types/poi";

const LAT = MAKKAH_CENTER.lat;
const LNG = MAKKAH_CENTER.lng;

describe("getNearbyItems", () => {
  it("returns items sorted by distance within the radius", () => {
    const items = getNearbyItems("hotel", LAT, LNG, 2000);
    expect(items.length).toBe(NEARBY_HOTELS.length);
    for (let i = 1; i < items.length; i += 1) {
      expect(items[i].distance).toBeGreaterThanOrEqual(items[i - 1].distance);
    }
  });

  it("filters out everything beyond the radius", () => {
    const items = getNearbyItems("hotel", LAT, LNG, 200);
    for (const item of items) {
      expect(item.distance).toBeLessThanOrEqual(200);
    }
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThan(NEARBY_HOTELS.length);
  });

  it("prefers the Bengali display name for gates and hotels", () => {
    const items = getNearbyItems("hotel", LAT, LNG, 2000);
    const clockTower = items.find((item) => item.id === "hotel-clock-royal-tower");
    expect(clockTower?.name).toBe("ক্লক রয়্যাল টাওয়ার ফেয়ারমন্ট");
  });

  it("carries the original record in source with preformatted Bengali strings", () => {
    const items = getNearbyItems("restaurant", LAT, LNG, 3000);
    expect(items.length).toBeGreaterThan(0);
    const first = items[0];
    expect((first.source as POI).category).toBe("restaurant");
    // বাংলা সংখ্যায় দূরত্ব/সময়
    expect(first.distanceFormatted).toMatch(/[ঀ-৿]/);
    expect(first.walkingTimeFormatted).toMatch(/[ঀ-৿]/);
    expect(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]).toContain(first.direction);
  });

  it("halalOnly excludes non-halal food but leaves other categories untouched", () => {
    const allCafes = getNearbyItems("cafe", LAT, LNG, 3000);
    const halalCafes = getNearbyItems("cafe", LAT, LNG, 3000, { halalOnly: true });
    expect(halalCafes.length).toBe(allCafes.length - 1); // কর্নার ক্যাফে বাদ

    const toiletsAll = getNearbyItems("toilet", LAT, LNG, 3000);
    const toiletsHalal = getNearbyItems("toilet", LAT, LNG, 3000, { halalOnly: true });
    expect(toiletsHalal.length).toBe(toiletsAll.length);
  });

  it("sees demo-world's in-place coordinate reassignment (lazy reads)", () => {
    const poi = DEMO_POIS.find((p) => p.id === "poi-atm-alrajhi");
    if (!poi) throw new Error("test POI missing");
    const original = poi.location.coordinates;
    try {
      // প্রায় ২ কিমি দক্ষিণে সরানো হলে ১ কিমি ব্যাসার্ধে আর থাকে না
      poi.location.coordinates = [original[0], original[1] - 0.018];
      const near = getNearbyItems("atm", LAT, LNG, 1000);
      expect(near.find((item) => item.id === "poi-atm-alrajhi")).toBeUndefined();
    } finally {
      poi.location.coordinates = original;
    }
  });
});

describe("getNearbyCounts", () => {
  it("counts match getNearbyItems lengths for every category", () => {
    const counts = getNearbyCounts(LAT, LNG, 1000);
    for (const category of [
      "gate",
      "hotel",
      "historical",
      "restaurant",
      "cafe",
      "toilet",
      "atm",
      "pharmacy",
      "mosque",
    ] as NearbyCategory[]) {
      expect(counts[category]).toBe(getNearbyItems(category, LAT, LNG, 1000).length);
    }
  });

  it("reports zero for disabled categories", () => {
    const counts = getNearbyCounts(LAT, LNG, 1000, {
      enabledCategories: ["hotel"],
    });
    expect(counts.hotel).toBeGreaterThan(0);
    expect(counts.gate).toBe(0);
    expect(counts.restaurant).toBe(0);
  });

  it("respects halalOnly for food categories", () => {
    const without = getNearbyCounts(LAT, LNG, 3000);
    const withHalal = getNearbyCounts(LAT, LNG, 3000, { halalOnly: true });
    expect(withHalal.cafe).toBe(without.cafe - 1);
    expect(withHalal.restaurant).toBe(without.restaurant);
  });
});

describe("gateToNearbyItem", () => {
  it("builds a live-measured item from the user's fix", () => {
    const gate = HARAM_GATES.find((g) => g.type === "king_fahd");
    if (!gate) throw new Error("king fahd gate missing");
    const item = gateToNearbyItem(gate, LAT, LNG);
    expect(item.category).toBe("gate");
    expect(item.name).toBe(gate.nameBn);
    expect(item.subtitle).toBe("কিং ফাহদ সম্প্রসারণ");
    expect(item.coordinates).toBe(gate.location.coordinates);
    expect(item.source).toBe(gate);
    expect(item.distance).toBeCloseTo(
      haversineDistance(LAT, LNG, gate.location.coordinates[1], gate.location.coordinates[0]),
      6
    );
    expect(item.distanceFormatted).toMatch(/[ঀ-৿]/);
    expect(item.walkingTimeFormatted).toMatch(/[ঀ-৿]/);
    expect(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]).toContain(item.direction);
  });

  it("falls back to the plain name for OSM gates without a Bengali name", () => {
    const osmGate = getActiveGates().find((g) => g.id.startsWith("+osm-"));
    if (!osmGate) throw new Error("osm gate fixture missing");
    const item = gateToNearbyItem(osmGate, LAT, LNG);
    expect(item.name).toBe(osmGate.name);
  });

  it("without a fix yields placeholder fields that stay isNear-safe", () => {
    const gate = HARAM_GATES[0];
    const item = gateToNearbyItem(gate, null, null);
    expect(item.distanceFormatted).toBe("—");
    expect(item.walkingTimeFormatted).toBe("—");
    expect(item.direction).toBe("");
    // অসীম দূরত্ব — no-fix ফলব্যাকে "প্রায় পৌঁছে গেছেন" দেখাবে না
    expect(item.distance).not.toBeLessThan(50);
    expect(item.name).toBe(gate.nameBn);
    expect(item.source).toBe(gate);
  });
});

describe("shouldEmitPositionChange", () => {
  it("always emits the first fix", () => {
    expect(shouldEmitPositionChange(null, null, LAT, LNG)).toBe(true);
  });

  it("suppresses sub-threshold jitter", () => {
    // ~5 মি উত্তর
    const jitterLat = LAT + 0.000045;
    expect(shouldEmitPositionChange(LAT, LNG, jitterLat, LNG)).toBe(false);
  });

  it("emits after moving past the threshold", () => {
    // ~100 মি পূর্ব
    const movedLng = LNG + 0.001;
    expect(shouldEmitPositionChange(LAT, LNG, LAT, movedLng)).toBe(true);
  });
});

describe("nearbyRadiusBounds", () => {
  it("produces a box whose center is the user and spans roughly the radius", () => {
    const [[west, south], [east, north]] = nearbyRadiusBounds(LAT, LNG, 1000);
    expect(west).toBeLessThan(LNG);
    expect(east).toBeGreaterThan(LNG);
    expect(south).toBeLessThan(LAT);
    expect(north).toBeGreaterThan(LAT);
    const halfWidth = haversineDistance(LAT, LNG, LAT, east);
    expect(halfWidth).toBeGreaterThan(950);
    expect(halfWidth).toBeLessThan(1050);
  });
});

describe("nearbyLiveFields", () => {
  it("recomputes fields from item coordinates at an arbitrary fix (radius-independent)", () => {
    const gate = getNearbyItems("gate", LAT, LNG, 3000)[0];
    if (!gate) throw new Error("gate fixture missing");
    // ~২০০ মি পূর্বে নতুন ফিক্স
    const live = nearbyLiveFields(gate.coordinates, LAT, LNG + 0.002);
    expect(live.distance).toBeCloseTo(
      haversineDistance(LAT, LNG + 0.002, gate.coordinates[1], gate.coordinates[0]),
      6
    );
    expect(live.distanceFormatted).toMatch(/[ঀ-৿]/);
    expect(live.walkingTime).toBe(Math.ceil(live.distance / 1.39));
    expect(live.walkingTimeFormatted).toMatch(/[ঀ-৿]/);
    expect(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]).toContain(live.direction);
  });

  it("matches toItem's snapshot fields at the same fix", () => {
    const gate = getNearbyItems("gate", LAT, LNG, 3000)[0];
    if (!gate) throw new Error("gate fixture missing");
    const live = nearbyLiveFields(gate.coordinates, LAT, LNG);
    expect(live.distance).toBeCloseTo(gate.distance, 6);
    expect(live.distanceFormatted).toBe(gate.distanceFormatted);
    expect(live.walkingTimeFormatted).toBe(gate.walkingTimeFormatted);
    expect(live.direction).toBe(gate.direction);
  });
});

describe("nextDistanceTrend", () => {
  it("anchors without a trend on the first fix", () => {
    expect(nextDistanceTrend(null, null, 500, 3)).toEqual({ trend: null, anchor: 500 });
  });

  it("keeps the previous trend and anchor inside the deadband (jitter)", () => {
    const kept = nextDistanceTrend("closer", 500, 502, 3);
    expect(kept).toEqual({ trend: "closer", anchor: 500 });
    const back = nextDistanceTrend("closer", 500, 498, 3);
    expect(back).toEqual({ trend: "closer", anchor: 500 });
  });

  it("flips to closer only after crossing the deadband downward", () => {
    const flipped = nextDistanceTrend(null, 500, 496, 3);
    expect(flipped).toEqual({ trend: "closer", anchor: 496 });
    // ট্রেন্ড থাকলেও নোঙর সরে — পরের তুলনা নতুন বিন্দু থেকে
    const again = nextDistanceTrend("closer", 496, 490, 3);
    expect(again).toEqual({ trend: "closer", anchor: 490 });
  });

  it("flips to farther after crossing the deadband upward", () => {
    const flipped = nextDistanceTrend("closer", 500, 504, 3);
    expect(flipped).toEqual({ trend: "farther", anchor: 504 });
  });

  it("does not oscillate when jitter stays inside the deadband of the anchor", () => {
    let state = { trend: null as ReturnType<typeof nextDistanceTrend>["trend"], anchor: 500 };
    for (const distance of [502, 498, 501, 499, 502]) {
      state = nextDistanceTrend(state.trend, state.anchor, distance, 3);
    }
    expect(state.trend).toBeNull();
    expect(state.anchor).toBe(500);
  });
});

describe("nearbySubtitle", () => {
  it("builds category-appropriate Bengali subtitles", () => {
    const hotel = NEARBY_HOTELS.find((h) => h.starRating === 5);
    if (!hotel) throw new Error("five-star hotel missing");
    expect(nearbySubtitle("hotel", hotel)).toBe("৫ তারা হোটেল");

    const restaurant = DEMO_POIS.find((p) => p.id === "poi-restaurant-albaik-haram");
    if (!restaurant) throw new Error("test restaurant missing");
    expect(nearbySubtitle("restaurant", restaurant)).toContain("মধ্যপ্রাচ্য");
    expect(nearbySubtitle("restaurant", restaurant)).toContain("হালাল");

    expect(nearbySubtitle("toilet", DEMO_POIS[0])).toBe("পাবলিক টয়লেট");
  });
});
