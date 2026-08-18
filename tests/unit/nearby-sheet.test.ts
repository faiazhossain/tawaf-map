import { describe, it, expect } from "vitest";
import {
  NEARBY_DETAIL_SHEET_FRACTION,
  nearbyDetailSheetHeightPx,
  nearbyCameraPadding,
} from "@/lib/utils/nearby-sheet";
import { guideCameraPadding, GUIDE_SHEET_SNAP_POINTS } from "@/lib/utils/guide-sheet";

const VH = 800;

describe("nearbyDetailSheetHeightPx", () => {
  it("is 30% of the viewport", () => {
    expect(nearbyDetailSheetHeightPx(VH)).toBe(Math.round(NEARBY_DETAIL_SHEET_FRACTION * VH));
    expect(nearbyDetailSheetHeightPx(VH)).toBe(240);
  });

  it("never goes negative", () => {
    expect(nearbyDetailSheetHeightPx(0)).toBe(0);
    expect(nearbyDetailSheetHeightPx(-100)).toBe(0);
  });
});

describe("nearbyCameraPadding (composed with guide sheet)", () => {
  it("returns undefined when both sheets are closed", () => {
    expect(nearbyCameraPadding(null, false, VH)).toBeUndefined();
  });

  it("matches guide-only padding when the detail sheet is closed", () => {
    for (const snap of [0, 1, 2]) {
      expect(nearbyCameraPadding(snap, false, VH)).toEqual(guideCameraPadding(snap as number, VH));
    }
  });

  it("pads for the taller sheet when detail is open", () => {
    // গাইড peek (১২% = ৯৬px) < ডিটেইল (২৪০px) → ডিটেইল জেতে
    const peek = nearbyCameraPadding(0, true, VH);
    expect(peek?.bottom).toBe(240 + 16);

    // গাইড expanded (৯২% = ৭৩৬px) > ডিটেইল → গাইড জেতে
    const expanded = nearbyCameraPadding(2, true, VH);
    const guideHeight = Math.round(GUIDE_SHEET_SNAP_POINTS[2] * VH);
    expect(expanded?.bottom).toBe(guideHeight + 16);

    // গাইড বন্ধ + ডিটেইল খোলা
    const detailOnly = nearbyCameraPadding(null, true, VH);
    expect(detailOnly?.bottom).toBe(240 + 16);
    expect(detailOnly?.top).toBe(96);
    expect(detailOnly?.left).toBe(24);
    expect(detailOnly?.right).toBe(24);
  });
});
