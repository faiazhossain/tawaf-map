import { describe, expect, it } from "vitest";
import {
  clampWithRubberBand,
  createVelocityTracker,
  dismissBandPx,
  MAX_HEIGHT_FRACTION,
  rubberBandOffset,
  selectSnapIndex,
  settleDurationMs,
  shouldDismissOnRelease,
  shouldEngageDrag,
  type SheetBounds,
} from "@/lib/utils/sheet-physics";

describe("createVelocityTracker", () => {
  it("reports 0 with no samples", () => {
    const tracker = createVelocityTracker();
    expect(tracker.velocity()).toBe(0);
  });

  it("reports 0 with a single sample", () => {
    const tracker = createVelocityTracker();
    tracker.add(500, 1000);
    expect(tracker.velocity()).toBe(0);
  });

  it("reports px/ms over the oldest sample inside the window", () => {
    const tracker = createVelocityTracker();
    tracker.add(100, 0);
    tracker.add(180, 40);
    tracker.add(220, 80);
    // oldest in window: (220 - 100) / (80 - 0) = 1.5 px/ms, moving down
    expect(tracker.velocity()).toBeCloseTo(1.5);
  });

  it("is positive when the finger moves down and negative when it moves up", () => {
    const down = createVelocityTracker();
    down.add(0, 0);
    down.add(50, 50);
    expect(down.velocity()).toBeGreaterThan(0);

    const up = createVelocityTracker();
    up.add(50, 0);
    up.add(0, 50);
    expect(up.velocity()).toBeLessThan(0);
  });

  it("ignores samples older than the window (flick then hold kills the fling)", () => {
    const tracker = createVelocityTracker(100);
    // fast flick:
    tracker.add(0, 0);
    tracker.add(200, 40);
    // finger then holds still well past the window:
    tracker.add(200, 300);
    expect(Math.abs(tracker.velocity())).toBeLessThan(0.01);
  });

  it("resets all history", () => {
    const tracker = createVelocityTracker();
    tracker.add(0, 0);
    tracker.add(100, 50);
    tracker.reset();
    expect(tracker.velocity()).toBe(0);
  });
});

describe("rubberBandOffset", () => {
  it("is 0 at 0", () => {
    expect(rubberBandOffset(0, 800)).toBe(0);
  });

  it("is strictly increasing", () => {
    const values = [10, 50, 150, 400, 1000].map((offset) => rubberBandOffset(offset, 800));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it("always resists (result below raw offset) but grows with the dimension", () => {
    expect(rubberBandOffset(200, 800)).toBeLessThan(200);
    expect(rubberBandOffset(200, 1600)).toBeGreaterThan(rubberBandOffset(200, 400));
  });

  it("never reaches the dimension (asymptotic)", () => {
    expect(rubberBandOffset(1_000_000, 800)).toBeLessThan(800);
  });
});

describe("clampWithRubberBand", () => {
  const bounds: SheetBounds = {
    minPx: 100,
    maxPx: 600,
    hardMinPx: 0,
    hardMaxPx: 0.98 * 800,
    dimensionPx: 800,
  };

  it("is identity inside the linear range", () => {
    expect(clampWithRubberBand(100, bounds)).toBe(100);
    expect(clampWithRubberBand(350, bounds)).toBe(350);
    expect(clampWithRubberBand(600, bounds)).toBe(600);
  });

  it("resists above maxPx without exceeding hardMaxPx", () => {
    const clamped = clampWithRubberBand(900, bounds);
    expect(clamped).toBeGreaterThan(600);
    expect(clamped).toBeLessThan(0.98 * 800);
    expect(clampWithRubberBand(1e9, bounds)).toBeLessThanOrEqual(bounds.hardMaxPx);
  });

  it("resists below minPx without exceeding hardMinPx (persistent sheets)", () => {
    const clamped = clampWithRubberBand(0, bounds);
    expect(clamped).toBeLessThan(100);
    expect(clamped).toBeGreaterThan(0);
    expect(clampWithRubberBand(-1e9, bounds)).toBeGreaterThanOrEqual(bounds.hardMinPx);
  });

  it("over-pull uses its own band dimension and never collapses to zero", () => {
    // Mirrors the component: minPx is the peek, band never exceeds the peek.
    const overPull: SheetBounds = {
      ...bounds,
      minPx: 115,
      overPullDimensionPx: 115,
    };
    // Finger dragged far below the peek: height squishes with resistance but
    // the strip (and its handle) stays on screen - asymptote, never zero.
    expect(clampWithRubberBand(-10_000, overPull)).toBeGreaterThan(0);
    expect(clampWithRubberBand(-1e9, overPull)).toBeGreaterThan(0);
    // A small over-pull keeps most of the peek visible.
    expect(clampWithRubberBand(100, overPull)).toBeGreaterThan(90);
  });
});

describe("shouldEngageDrag", () => {
  const base = { scrollTop: 100, scrollHeight: 1000, clientHeight: 300 };

  it("always engages from the drag region (the handle)", () => {
    expect(shouldEngageDrag({ ...base, dy: 5, startedOnDragRegion: true })).toBe(true);
  });

  it("engages when content is not scrollable", () => {
    expect(
      shouldEngageDrag({ ...base, scrollHeight: 300, dy: -20, startedOnDragRegion: false })
    ).toBe(true);
  });

  it("engages at the top with a downward gesture", () => {
    expect(shouldEngageDrag({ ...base, scrollTop: 0, dy: 20, startedOnDragRegion: false })).toBe(
      true
    );
  });

  it("does not engage at the top with an upward gesture (native scroll takes it)", () => {
    expect(shouldEngageDrag({ ...base, scrollTop: 0, dy: -20, startedOnDragRegion: false })).toBe(
      false
    );
  });

  it("engages at the bottom with an upward gesture", () => {
    expect(shouldEngageDrag({ ...base, scrollTop: 700, dy: -20, startedOnDragRegion: false })).toBe(
      true
    );
  });

  it("does not engage in the middle of a scrollable range", () => {
    expect(shouldEngageDrag({ ...base, dy: 20, startedOnDragRegion: false })).toBe(false);
    expect(shouldEngageDrag({ ...base, dy: -20, startedOnDragRegion: false })).toBe(false);
  });
});

describe("selectSnapIndex", () => {
  // viewport 800: snaps at fractions [0.15, 0.5, 0.92]
  const snaps = [120, 400, 736];

  it("picks the nearest snap when velocity is 0", () => {
    expect(selectSnapIndex(380, 0, snaps)).toBe(1);
    expect(selectSnapIndex(150, 0, snaps)).toBe(0);
    expect(selectSnapIndex(700, 0, snaps)).toBe(2);
  });

  it("velocity moving down pulls the projection toward the lower snap", () => {
    // resting exactly between snap 1 and 2 with a strong downward fling:
    expect(selectSnapIndex(570, 1.2, snaps)).toBe(1);
  });

  it("velocity moving up pulls the projection toward the higher snap", () => {
    // 350 is nearer to snap 1 (400) at rest, but a strong upward fling projects
    // it past the midpoint to snap 2.
    expect(selectSnapIndex(350, -1.4, snaps)).toBe(2);
    expect(selectSnapIndex(500, -1.4, snaps)).toBe(2);
    // A gentle upward velocity keeps the nearest snap.
    expect(selectSnapIndex(350, -0.2, snaps)).toBe(1);
  });

  it("clamps extreme velocities to the end indices (protects the lowest snap)", () => {
    expect(selectSnapIndex(736, 100, snaps)).toBe(0);
    expect(selectSnapIndex(120, -100, snaps)).toBe(2);
  });

  it("respects a custom projection window", () => {
    // Height 410 is nearer to snap 1 (400, distance 10) than snap 2 (736, 326);
    // with projection 0 the velocity is ignored.
    expect(selectSnapIndex(410, 1.4, snaps, 0)).toBe(1);
    // A long projection lets the same upward... let the downward velocity reach snap 0.
    expect(selectSnapIndex(410, 1.4, snaps, 300)).toBe(0);
  });
});

describe("dismissBandPx", () => {
  it("is the peek height for short peeks", () => {
    expect(dismissBandPx(115, 768)).toBe(115);
  });

  it("caps tall peeks at a viewport fraction", () => {
    expect(dismissBandPx(460, 768)).toBe(768 * 0.25);
  });
});

describe("shouldDismissOnRelease", () => {
  const release = (overrides: Partial<Parameters<typeof shouldDismissOnRelease>[0]> = {}) =>
    shouldDismissOnRelease({
      heightPx: 300,
      peekPx: 115,
      viewportPx: 768,
      velocityPxPerMs: 0,
      dismissOnDragDown: true,
      ...overrides,
    });

  it("never dismisses when dismissOnDragDown is false", () => {
    expect(release({ dismissOnDragDown: false, heightPx: 10, velocityPxPerMs: 5 })).toBe(false);
  });

  it("dismisses on a downward fling from any height", () => {
    expect(release({ heightPx: 700, velocityPxPerMs: 1.2 })).toBe(true);
  });

  it("does not dismiss on an upward fling", () => {
    expect(release({ velocityPxPerMs: -1.2 })).toBe(false);
  });

  it("a slow pull dismisses only past half the dismiss band", () => {
    // peek 115, band 115: threshold travel 57.5px, so height must drop under 57.5.
    expect(release({ heightPx: 50 })).toBe(true);
    expect(release({ heightPx: 80 })).toBe(false);
  });

  it("tall peeks use the capped band, not the peek itself", () => {
    // peek 460, band 192: threshold travel 96px -> height under 364.
    expect(release({ peekPx: 460, heightPx: 340 })).toBe(true);
    expect(release({ peekPx: 460, heightPx: 400 })).toBe(false);
  });
});

describe("settleDurationMs", () => {
  it("has a 150ms floor and a 400ms cap", () => {
    expect(settleDurationMs(0)).toBe(150);
    expect(settleDurationMs(10)).toBeGreaterThanOrEqual(150);
    expect(settleDurationMs(10_000)).toBe(400);
  });

  it("is linear in between", () => {
    expect(settleDurationMs(200)).toBeCloseTo(210);
    expect(settleDurationMs(500)).toBeCloseTo(300);
  });
});

it("MAX_HEIGHT_FRACTION stays the previous hard-clamp ceiling", () => {
  expect(MAX_HEIGHT_FRACTION).toBe(0.98);
});
