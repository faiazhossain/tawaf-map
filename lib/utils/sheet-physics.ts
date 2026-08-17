/**
 * Bottom sheet gesture math. Pure functions (no React/DOM) so the gesture layer
 * in components/ui/bottom-sheet.tsx stays declarative and the physics stays
 * unit-testable. Heights are in CSS pixels; velocities are px/ms with a
 * positive value meaning the finger is moving DOWN (sheet getting shorter).
 */
export const DRAG_THRESHOLD_PX = 10;
export const VELOCITY_WINDOW_MS = 100;
export const PROJECTION_MS = 200;
export const FLING_VELOCITY_PX_PER_MS = 0.5;
export const MAX_HEIGHT_FRACTION = 0.98;
export const RUBBER_BAND_CONSTANT = 0.55;
/** Cap (as a viewport fraction) on the over-pull band so tall peek sheets do
    not need impossible finger travel to reach the dismiss threshold. */
export const DISMISS_BAND_MAX_FRACTION = 0.25;
/** Share of the over-pull band that must be traveled before a slow release
    dismisses; below it the sheet springs back to the peek snap. */
export const DISMISS_TRAVEL_FRACTION = 0.5;

/**
 * Create a time-based velocity tracker. Keeps the last `windowMs` of samples
 * and reports px/ms over the oldest surviving sample, so a flicks at rest or a
 * flick-then-hold reports near-zero velocity (holding kills the fling).
 */
export function createVelocityTracker(windowMs: number = VELOCITY_WINDOW_MS) {
  let samples: { y: number; t: number }[] = [];

  return {
    reset(): void {
      samples = [];
    },

    add(y: number, t: number): void {
      samples.push({ y, t });
      const cutoff = t - windowMs;
      while (samples.length > 1 && samples[0].t < cutoff) {
        samples.shift();
      }
    },

    /** px/ms, positive = finger moving down; 0 when history is insufficient. */
    velocity(): number {
      if (samples.length < 2) return 0;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last.t - first.t;
      if (dt <= 0) return 0;
      return (last.y - first.y) / dt;
    },
  };
}

/**
 * iOS-style rubber-band resistance. offsetPx must be >= 0. The result is in
 * [0, dimensionPx) so out-of-range travel can never jump to the far edge.
 */
export function rubberBandOffset(offsetPx: number, dimensionPx: number): number {
  const dimension = Math.max(dimensionPx, 1); // avoid division by zero
  return (1 - 1 / ((offsetPx * RUBBER_BAND_CONSTANT) / dimension + 1)) * dimension;
}

export interface SheetBounds {
  /** Linear floor: the lowest snap point (the peek strip). */
  minPx: number;
  /** Linear ceiling: highest snap point. */
  maxPx: number;
  /** Absolute render floor (0 px). */
  hardMinPx: number;
  /** Absolute render ceiling (MAX_HEIGHT_FRACTION * viewport). */
  hardMaxPx: number;
  /** Viewport height used by the rubber-band formula above maxPx. */
  dimensionPx: number;
  /** Rubber-band dimension below minPx (over-pull); defaults to dimensionPx. */
  overPullDimensionPx?: number;
}

/**
 * Height shown during a drag: identity inside [minPx, maxPx], rubber-banded
 * past the edges and hard-capped at hardMinPx/hardMaxPx so the sheet can never
 * be dropped to nothing or stretched past the maximum fraction.
 */
export function clampWithRubberBand(valuePx: number, bounds: SheetBounds): number {
  if (valuePx > bounds.maxPx) {
    return Math.min(
      bounds.maxPx + rubberBandOffset(valuePx - bounds.maxPx, bounds.dimensionPx),
      bounds.hardMaxPx
    );
  }
  if (valuePx < bounds.minPx) {
    return Math.max(
      bounds.minPx -
        rubberBandOffset(bounds.minPx - valuePx, bounds.overPullDimensionPx ?? bounds.dimensionPx),
      bounds.hardMinPx
    );
  }
  return valuePx;
}

export interface EngageParams {
  /** Vertical finger travel since touch start, positive = down. */
  dy: number;
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  /** True when the gesture began on the drag handle (touch-action: none). */
  startedOnDragRegion: boolean;
}

/**
 * Decide whether the sheet (rather than the content scroller) should consume
 * this gesture. The handle always wins. Otherwise content scrolls natively
 * unless it cannot, or the gesture pushes away from the edge it is resting on
 * (top + down shrinks the sheet, bottom + up grows it).
 */
export function shouldEngageDrag(params: EngageParams): boolean {
  if (params.startedOnDragRegion) return true;
  const scrollable = params.scrollHeight > params.clientHeight + 1;
  if (!scrollable) return true;
  if (params.dy > 0 && params.scrollTop <= 0) return true;
  if (params.dy < 0 && params.scrollTop + params.clientHeight >= params.scrollHeight - 1) {
    return true;
  }
  return false;
}

/**
 * Velocity-projected snap selection (native scroll-snap feel): project where
 * the sheet would land after `projectionMs` ms at the current velocity and pick
 * the nearest snap to that point. Velocity is positive downward (shrinking), so
 * it subtracts from the height. Always returns a valid index.
 */
export function selectSnapIndex(
  heightPx: number,
  velocityPxPerMs: number,
  snapPointsPx: number[],
  projectionMs: number = PROJECTION_MS
): number {
  const projected = heightPx - velocityPxPerMs * projectionMs;
  let bestIndex = 0;
  let bestDistance = Infinity;
  snapPointsPx.forEach((pointPx, index) => {
    const distance = Math.abs(projected - pointPx);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return Math.max(0, Math.min(snapPointsPx.length - 1, bestIndex));
}

/** Settle animation duration, ported from the fraction model: 150-400ms. */
export function settleDurationMs(distancePx: number): number {
  return Math.min(Math.abs(distancePx) * 0.3 + 150, 400);
}

/**
 * The rubber-band dimension for dragging below the lowest snap ("over-pull"):
 * the peek height itself, capped at a fraction of the viewport.
 */
export function dismissBandPx(peekPx: number, viewportPx: number): number {
  return Math.min(peekPx, viewportPx * DISMISS_BAND_MAX_FRACTION);
}

export interface DismissReleaseParams {
  /** Rendered sheet height at the moment of release, in px. */
  heightPx: number;
  /** Lowest snap point height in px (the peek strip). */
  peekPx: number;
  viewportPx: number;
  velocityPxPerMs: number;
  dismissOnDragDown: boolean;
}

/**
 * Release dismissal rule: a downward fling dismisses from any height; a slow
 * drag dismisses only after the over-pull has carried the sheet past a fixed
 * share of its dismiss band. Otherwise the sheet stays a visible strip that
 * springs back to the peek snap - it can never silently collapse to nothing.
 */
export function shouldDismissOnRelease(params: DismissReleaseParams): boolean {
  if (!params.dismissOnDragDown) return false;
  if (params.velocityPxPerMs > FLING_VELOCITY_PX_PER_MS) return true;
  const bandPx = dismissBandPx(params.peekPx, params.viewportPx);
  return params.peekPx - params.heightPx >= bandPx * DISMISS_TRAVEL_FRACTION;
}
