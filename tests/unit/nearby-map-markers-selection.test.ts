import { describe, it, expect } from "vitest";
import {
  selectNearbyMapMarkers,
  nearbySelectionSignature,
  EMPTY_NEARBY_MARKER_SELECTION,
  NEARBY_MAP_MARKER_CAP,
  NEARBY_MAP_MARKER_SPACING_PX,
  NEARBY_MAP_COMPACT_VISUAL_RADIUS_PX,
  NEARBY_MAP_PULSED_VISUAL_RADIUS_PX,
} from "@/lib/nearby/map-markers-selection";
import type { NearbyItem } from "@/types/nearby";
import type { NearbyMarkerPlacement, ScreenPoint } from "@/lib/nearby/map-markers-selection";

/** ন্যূনতম NearbyItem — নির্বাচন-লজিক শুধু id/distance পড়ে */
function makeItem(id: string, distance: number): NearbyItem {
  return { id, distance, coordinates: [0, 0] } as unknown as NearbyItem;
}

/** id -> স্ক্রিন-বিন্দু ম্যাপ থেকে ইনজেক্টেড প্রজেকশন স্টাব */
function pointsFrom(record: Record<string, [number, number]>): (item: NearbyItem) => ScreenPoint {
  return (item) => ({ x: record[item.id][0], y: record[item.id][1] });
}

/** ওভারল্যাপ-মুক্ত ছড়ানো বিন্দু — i-তম আইটেম (i*200, 0)-এ */
function spreadPoints(items: NearbyItem[]): (item: NearbyItem) => ScreenPoint {
  return (item) => {
    const index = items.findIndex((entry) => entry.id === item.id);
    return { x: index * 200, y: 0 };
  };
}

function itemsWithDistances(distances: number[]): NearbyItem[] {
  return distances.map((distance, index) => makeItem(`item-${index + 1}`, distance));
}

describe("selectNearbyMapMarkers", () => {
  it("respects the cap and keeps the nearest items", () => {
    const items = itemsWithDistances(Array.from({ length: 20 }, (_, i) => 100 + i * 50));
    const { kept, skipped } = selectNearbyMapMarkers(items, spreadPoints(items));

    expect(kept).toHaveLength(NEARBY_MAP_MARKER_CAP);
    expect(skipped).toHaveLength(8);
    expect(kept.map((p) => p.item.id)).toEqual(
      items.slice(0, NEARBY_MAP_MARKER_CAP).map((item) => item.id)
    );
    // শেষ রাখা আইটেমও প্রথম বাদ-পড়ার চেয়ে কাছে
    expect(kept.at(-1)?.item.distance).toBeLessThan(skipped[0].distance);
  });

  it("prefers the nearest item when two footprints overlap", () => {
    const near = makeItem("near", 100);
    const far = makeItem("far", 200);
    const project = pointsFrom({ near: [0, 0], far: [5, 5] });
    const { kept, skipped } = selectNearbyMapMarkers([far, near], project);

    expect(kept.map((p) => p.item.id)).toEqual(["near"]);
    expect(skipped.map((item) => item.id)).toEqual(["far"]);
  });

  it("skips overlapping markers and keeps ones beyond the combined radius", () => {
    const a = makeItem("a", 100);
    const b = makeItem("b", 110);

    // pulseCount 0 => দুটিই compact (14px), থ্রেশহোল্ড 14+14+4 = 32
    const overlapping = selectNearbyMapMarkers([a, b], pointsFrom({ a: [0, 0], b: [10, 0] }), {
      pulseCount: 0,
    });
    expect(overlapping.kept.map((p) => p.item.id)).toEqual(["a"]);
    expect(overlapping.skipped.map((item) => item.id)).toEqual(["b"]);

    const apart = selectNearbyMapMarkers([a, b], pointsFrom({ a: [0, 0], b: [60, 0] }), {
      pulseCount: 0,
    });
    expect(apart.kept.map((p) => p.item.id)).toEqual(["a", "b"]);

    // ঠিক সীমানায় (32px) কঠোর < — রাখা হয়
    const boundary = selectNearbyMapMarkers(
      [a, b],
      pointsFrom({
        a: [0, 0],
        b: [2 * NEARBY_MAP_COMPACT_VISUAL_RADIUS_PX + NEARBY_MAP_MARKER_SPACING_PX, 0],
      }),
      { pulseCount: 0 }
    );
    expect(boundary.kept.map((p) => p.item.id)).toEqual(["a", "b"]);
  });

  it("uses the larger pulsed radius in the overlap test", () => {
    const nearest = makeItem("nearest", 10);
    const second = makeItem("second", 20);
    const third = makeItem("third", 30);
    const compactItem = makeItem("compact", 500);
    const items = [nearest, second, third, compactItem];
    const base: Record<string, [number, number]> = {
      nearest: [0, 0],
      second: [1000, 1000],
      third: [-1000, -1000],
    };

    // compact প্রার্থী বনাম স্পন্দিত rank-1: থ্রেশহোল্ড 18+14+4 = 36
    const justUnder = selectNearbyMapMarkers(items, pointsFrom({ ...base, compact: [35.9, 0] }));
    expect(justUnder.skipped.map((item) => item.id)).toContain("compact");

    const atThreshold = selectNearbyMapMarkers(items, pointsFrom({ ...base, compact: [36, 0] }));
    expect(atThreshold.skipped.map((item) => item.id)).not.toContain("compact");
    expect(atThreshold.kept.find((p) => p.item.id === "compact")?.rank).toBeDefined();
  });

  it("assigns ascending ranks and pulses exactly the nearest three", () => {
    const items = itemsWithDistances(Array.from({ length: 15 }, (_, i) => 50 + i * 25));
    const { kept } = selectNearbyMapMarkers(items, spreadPoints(items));

    expect(kept.map((p) => p.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(kept.filter((p) => p.pulsed).map((p) => p.rank)).toEqual([1, 2, 3]);
    expect(kept.map((p) => p.item.distance)).toEqual(
      [...kept.map((p) => p.item.distance)].sort((a, b) => a - b)
    );
  });

  it("force-includes a selected far item beyond the cap without pulsing it", () => {
    const items = itemsWithDistances(Array.from({ length: 20 }, (_, i) => 100 + i * 50));
    const farId = items[19].id;
    const { kept } = selectNearbyMapMarkers(items, spreadPoints(items), {
      alwaysIncludeIds: [farId],
    });

    expect(kept).toHaveLength(NEARBY_MAP_MARKER_CAP + 1);
    const forced = kept.find((p) => p.item.id === farId);
    expect(forced).toBeDefined();
    expect(forced?.pulsed).toBe(false);
    expect(forced?.rank).toBe(NEARBY_MAP_MARKER_CAP + 1);
  });

  it("keeps everything when fewer items than the cap exist", () => {
    const items = itemsWithDistances([100, 200, 300, 400, 500]);
    const { kept, skipped } = selectNearbyMapMarkers(items, spreadPoints(items));

    expect(kept).toHaveLength(5);
    expect(skipped).toEqual([]);
  });

  it("returns the empty selection for zero items", () => {
    expect(selectNearbyMapMarkers([], () => ({ x: 0, y: 0 }))).toEqual(
      EMPTY_NEARBY_MARKER_SELECTION
    );
  });

  it("is deterministic for equal distances (stable input order)", () => {
    const first = makeItem("first", 100);
    const second = makeItem("second", 100);
    const project = pointsFrom({ first: [0, 0], second: [200, 0] });

    const one = selectNearbyMapMarkers([first, second], project);
    const two = selectNearbyMapMarkers([first, second], project);
    expect(one).toEqual(two);
    expect(one.kept.map((p) => p.item.id)).toEqual(["first", "second"]);
  });

  it("sorts unsorted input defensively", () => {
    const near = makeItem("near", 50);
    const far = makeItem("far", 900);
    const project = pointsFrom({ near: [0, 0], far: [200, 0] });
    const { kept } = selectNearbyMapMarkers([far, near], project);

    expect(kept.map((p) => p.item.id)).toEqual(["near", "far"]);
    expect(kept[0].rank).toBe(1);
  });
});

describe("nearbySelectionSignature", () => {
  function placement(id: string, rank: number, pulsed: boolean): NearbyMarkerPlacement {
    return { item: { id } as unknown as NearbyItem, rank, pulsed };
  }

  it("is order-insensitive for the same kept set", () => {
    const a = { kept: [placement("x", 1, true), placement("y", 2, false)], skipped: [] };
    const b = { kept: [placement("y", 2, false), placement("x", 1, true)], skipped: [] };
    expect(nearbySelectionSignature(a)).toBe(nearbySelectionSignature(b));
  });

  it("changes when the pulsed tier changes", () => {
    const rank1 = { kept: [placement("x", 1, true)], skipped: [] };
    const rank2 = { kept: [placement("x", 2, true)], skipped: [] };
    expect(nearbySelectionSignature(rank1)).not.toBe(nearbySelectionSignature(rank2));
  });

  it("changes when a kept id is swapped", () => {
    const withA = { kept: [placement("a", 4, false)], skipped: [] };
    const withB = { kept: [placement("b", 4, false)], skipped: [] };
    expect(nearbySelectionSignature(withA)).not.toBe(nearbySelectionSignature(withB));
  });

  it("changes when the skipped (dot) membership changes", () => {
    const emptySkipped = { kept: [placement("a", 1, true)], skipped: [] };
    const withDot = {
      kept: [placement("a", 1, true)],
      skipped: [{ id: "dot-1" } as unknown as NearbyItem],
    };
    expect(nearbySelectionSignature(emptySkipped)).not.toBe(nearbySelectionSignature(withDot));
  });

  it("treats two empty selections as equal", () => {
    expect(nearbySelectionSignature(EMPTY_NEARBY_MARKER_SELECTION)).toBe(
      nearbySelectionSignature({ kept: [], skipped: [] })
    );
  });

  it("includes the pulsed radius constant in the contract under test", () => {
    // স্পন্দিত ভিজ্যুয়াল 36px, compact 28px — ওভারল্যাপ গণিত এদের উপর দাঁড়ানো
    expect(NEARBY_MAP_PULSED_VISUAL_RADIUS_PX).toBe(18);
    expect(NEARBY_MAP_COMPACT_VISUAL_RADIUS_PX).toBe(14);
  });
});
