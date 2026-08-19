import { afterEach, describe, expect, it } from "vitest";
import {
  GUIDE_CAMERA_BOTTOM_GAP_PX,
  GUIDE_NEARBY_SNAP,
  GUIDE_OVERLAY_GAP_PX,
  GUIDE_SHEET_SNAP_POINTS,
  GUIDE_STEP_SNAP,
  guideCameraPadding,
  guideOverlayBottomPx,
  guideSheetHeightPx,
  guideSheetRaised,
  withGuidePadding,
} from "@/lib/utils/guide-sheet";
import { useGuideSheetStore } from "@/lib/store";

const VIEWPORT = 844;

afterEach(() => {
  useGuideSheetStore.getState().clearSheetSnap();
});

describe("guideSheetHeightPx", () => {
  it("returns 0 when the sheet is closed (null snap)", () => {
    expect(guideSheetHeightPx(null, VIEWPORT)).toBe(0);
  });

  it("returns 0 for an unknown snap index", () => {
    expect(guideSheetHeightPx(99, VIEWPORT)).toBe(0);
    expect(guideSheetHeightPx(-1, VIEWPORT)).toBe(0);
  });

  it("scales the snap fraction by the viewport height", () => {
    expect(guideSheetHeightPx(GUIDE_STEP_SNAP, VIEWPORT)).toBe(
      Math.round(GUIDE_SHEET_SNAP_POINTS[GUIDE_STEP_SNAP] * VIEWPORT)
    );
    expect(guideSheetHeightPx(0, 1000)).toBe(120);
    expect(guideSheetHeightPx(2, 1000)).toBe(920);
  });

  it("clamps a non-positive viewport to 0", () => {
    expect(guideSheetHeightPx(1, 0)).toBe(0);
    expect(guideSheetHeightPx(1, -50)).toBe(0);
  });
});

describe("guideOverlayBottomPx", () => {
  it("returns undefined when the sheet is inactive", () => {
    expect(guideOverlayBottomPx(null, VIEWPORT)).toBeUndefined();
  });

  it("adds the overlay gap above the sheet height", () => {
    const height = guideSheetHeightPx(GUIDE_STEP_SNAP, VIEWPORT);
    expect(guideOverlayBottomPx(GUIDE_STEP_SNAP, VIEWPORT)).toBe(height + GUIDE_OVERLAY_GAP_PX);
  });
});

describe("guideSheetRaised", () => {
  it("is false when the sheet is closed or at peek", () => {
    expect(guideSheetRaised(null)).toBe(false);
    expect(guideSheetRaised(GUIDE_NEARBY_SNAP)).toBe(false);
  });

  it("is true above peek - the guide owns the bottom edge", () => {
    expect(guideSheetRaised(GUIDE_STEP_SNAP)).toBe(true);
    expect(guideSheetRaised(2)).toBe(true);
  });
});

describe("guideCameraPadding", () => {
  it("returns undefined when the sheet is inactive", () => {
    expect(guideCameraPadding(null, VIEWPORT)).toBeUndefined();
  });

  it("frames the anchor above the sheet with hud-clearing top padding", () => {
    const height = guideSheetHeightPx(GUIDE_STEP_SNAP, VIEWPORT);
    expect(guideCameraPadding(GUIDE_STEP_SNAP, VIEWPORT)).toEqual({
      top: 96,
      bottom: height + GUIDE_CAMERA_BOTTOM_GAP_PX,
      left: 24,
      right: 24,
    });
  });
});

describe("withGuidePadding", () => {
  it("returns the options untouched when padding is undefined", () => {
    const options = { center: [39.8262, 21.4225] as [number, number], zoom: 18 };
    expect(withGuidePadding(options, undefined)).toBe(options);
  });

  it("merges padding into the options", () => {
    const options = { center: [39.8262, 21.4225] as [number, number], zoom: 18 };
    const padding = { top: 96, bottom: 370, left: 24, right: 24 };
    expect(withGuidePadding(options, padding)).toEqual({ ...options, padding });
    // মূল অবজেক্ট অপরিবর্তিত থাকে
    expect(options).not.toHaveProperty("padding");
  });
});

describe("useGuideSheetStore", () => {
  it("starts closed and supports set/clear", () => {
    expect(useGuideSheetStore.getState().snapIndex).toBeNull();

    useGuideSheetStore.getState().setSheetSnap(2);
    expect(useGuideSheetStore.getState().snapIndex).toBe(2);

    useGuideSheetStore.getState().setSheetSnap(GUIDE_STEP_SNAP);
    expect(useGuideSheetStore.getState().snapIndex).toBe(GUIDE_STEP_SNAP);

    useGuideSheetStore.getState().clearSheetSnap();
    expect(useGuideSheetStore.getState().snapIndex).toBeNull();
  });

  it("is idempotent for same-value writes", () => {
    useGuideSheetStore.getState().setSheetSnap(1);
    useGuideSheetStore.getState().setSheetSnap(1);
    expect(useGuideSheetStore.getState().snapIndex).toBe(1);
  });
});
