import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";

// jsdom has no TouchEvent; dispatch plain Events with touches patched on.
function touchPayload(
  clientY: number,
  clientX = 100
): { touches: Touch[]; changedTouches: Touch[] } {
  const touch = { identifier: 1, clientX, clientY } as Touch;
  return { touches: [touch], changedTouches: [touch] };
}

function fireTouch(
  target: Element,
  type: string,
  payload: { touches: Touch[]; changedTouches: Touch[] }
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, payload);
  target.dispatchEvent(event);
  return event;
}

function endTouches(lastClientY: number): { touches: Touch[]; changedTouches: Touch[] } {
  // touchend/touchcancel report the ended touch in changedTouches.
  const touch = { identifier: 1, clientX: 100, clientY: lastClientY } as Touch;
  return { touches: [], changedTouches: [touch] };
}

function getSheet(): HTMLElement {
  const sheet = document.querySelector('[role="dialog"]');
  if (!sheet) throw new Error("sheet not rendered");
  return sheet as HTMLElement;
}

function getHandleRegion(): HTMLElement {
  const region = document.querySelector("[data-sheet-drag-region]");
  if (!region) throw new Error("handle region not rendered");
  return region as HTMLElement;
}

function getContent(): HTMLElement {
  const content = getSheet().querySelector(".overscroll-contain.touch-pan-y");
  if (!content) throw new Error("content scroller not rendered");
  return content as HTMLElement;
}

function stubRect(element: HTMLElement, height: number): void {
  element.getBoundingClientRect = () =>
    ({
      width: 375,
      height,
      top: 0,
      left: 0,
      right: 375,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

/** Rect stub that tracks the imperative --sheet-height writes, so releases
    read the height the gesture layer actually rendered (jsdom does not apply
    CSS custom properties to layout). Resting dvh values fall back. */
function stubRectFromVar(element: HTMLElement, fallback: number): void {
  element.getBoundingClientRect = () => {
    const raw = element.style.getPropertyValue("--sheet-height");
    const match = /^(-?\d+(?:\.\d+)?)px$/.exec(raw);
    return { width: 375, height: match ? Number(match[1]) : fallback } as DOMRect;
  };
}

/** Synchronous dispatches give sub-millisecond (fling-looking) velocities;
    feed the tracker controlled timestamps instead. One per tracker sample. */
function mockClock(timesMs: number[]): void {
  const spy = vi.spyOn(performance, "now");
  timesMs.forEach((t) => spy.mockImplementationOnce(() => t));
}

beforeEach(() => {
  document.body.className = "";
});

describe("BottomSheet body lock", () => {
  it("adds bottom-sheet-open while open and removes it on close", () => {
    const { rerender } = render(
      <BottomSheet open onOpenChange={vi.fn()}>
        <p>sheet</p>
      </BottomSheet>
    );
    expect(document.body.classList.contains("bottom-sheet-open")).toBe(true);

    rerender(
      <BottomSheet open={false} onOpenChange={vi.fn()}>
        <p>sheet</p>
      </BottomSheet>
    );
    expect(document.body.classList.contains("bottom-sheet-open")).toBe(false);
  });

  it("keeps the body class while a second sheet is still open (refcount)", () => {
    const first = render(
      <BottomSheet open onOpenChange={vi.fn()}>
        <p>one</p>
      </BottomSheet>
    );
    render(
      <BottomSheet open onOpenChange={vi.fn()} snapPoints={[0.2, 0.5]} defaultSnap={0}>
        <p>two</p>
      </BottomSheet>
    );
    expect(document.body.classList.contains("bottom-sheet-open")).toBe(true);

    first.rerender(
      <BottomSheet open={false} onOpenChange={vi.fn()}>
        <p>one</p>
      </BottomSheet>
    );
    expect(document.body.classList.contains("bottom-sheet-open")).toBe(true);
  });
});

describe("BottomSheet accessibility", () => {
  it("keeps the dialog role and the Bengali handle label", () => {
    render(
      <BottomSheet open onOpenChange={vi.fn()}>
        <p>content</p>
      </BottomSheet>
    );
    expect(getSheet().getAttribute("aria-modal")).toBe("true");
    expect(document.querySelector('[aria-label="শীট সরাতে টানুন"]')).not.toBeNull();
  });

  it("closes on Escape with the 300ms close transition, and not while closed", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <BottomSheet open onOpenChange={onOpenChange}>
        <p>content</p>
      </BottomSheet>
    );

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onOpenChange).not.toHaveBeenCalled(); // exit animation pending

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <BottomSheet open={false} onOpenChange={onOpenChange}>
        <p>content</p>
      </BottomSheet>
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });
});

describe("BottomSheet snap context", () => {
  function Probe() {
    const { snapIndex, snapToIndex } = useBottomSheet();
    return (
      <button data-testid="probe" data-snap-index={snapIndex} onClick={() => snapToIndex(2)} />
    );
  }

  it("updates snapIndex once the settle completes (async timers)", async () => {
    const { getByTestId } = render(
      <BottomSheet open onOpenChange={vi.fn()}>
        <Probe />
      </BottomSheet>
    );
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("1");

    act(() => {
      getByTestId("probe").click();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("2");
  });
});

describe("BottomSheet gestures", () => {
  it("dragging on the handle writes --sheet-height without re-rendering", () => {
    let renderCount = 0;
    function Counter() {
      renderCount += 1;
      return null;
    }
    render(
      <BottomSheet open onOpenChange={vi.fn()}>
        <Counter />
      </BottomSheet>
    );
    const sheet = getSheet();
    const region = getHandleRegion();
    stubRect(sheet, 400);

    const base = renderCount;
    fireTouch(region, "touchstart", touchPayload(600));
    fireTouch(sheet, "touchmove", touchPayload(560));
    fireTouch(sheet, "touchmove", touchPayload(520));

    expect(renderCount).toBe(base);
    expect(sheet.style.getPropertyValue("--sheet-height")).toMatch(/px$/);
  });

  it("does not drag when content is not at its scroll top", () => {
    render(
      <BottomSheet open onOpenChange={vi.fn()} showHandle={false}>
        <p>content</p>
      </BottomSheet>
    );
    const sheet = getSheet();
    const content = getContent();
    stubRect(sheet, 400);
    Object.defineProperty(content, "scrollTop", { configurable: true, value: 120 });
    Object.defineProperty(content, "scrollHeight", { configurable: true, value: 2000 });
    Object.defineProperty(content, "clientHeight", { configurable: true, value: 400 });

    const initial = sheet.style.getPropertyValue("--sheet-height");
    fireTouch(content, "touchstart", touchPayload(600));
    const move = fireTouch(content, "touchmove", touchPayload(560));

    expect(sheet.style.getPropertyValue("--sheet-height")).toBe(initial);
    expect(move.defaultPrevented).toBe(false);
  });

  it("settles back on touchcancel without dismissing", () => {
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChange}>
        <p>content</p>
      </BottomSheet>
    );
    const sheet = getSheet();
    const region = getHandleRegion();
    stubRect(sheet, 400);

    fireTouch(region, "touchstart", touchPayload(600));
    fireTouch(sheet, "touchmove", touchPayload(700));
    fireTouch(sheet, "touchcancel", endTouches(700));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("a hard downward fling dismisses (real timers)", async () => {
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChange}>
        <p>content</p>
      </BottomSheet>
    );
    const sheet = getSheet();
    const region = getHandleRegion();
    stubRect(sheet, 400);

    fireTouch(region, "touchstart", touchPayload(200));
    fireTouch(sheet, "touchmove", touchPayload(320));
    fireTouch(sheet, "touchmove", touchPayload(440));
    fireTouch(sheet, "touchend", endTouches(440));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("dismissOnDragDown=false never dismisses on fling", async () => {
    const onOpenChange = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChange} dismissOnDragDown={false}>
        <p>content</p>
      </BottomSheet>
    );
    const sheet = getSheet();
    const region = getHandleRegion();
    stubRect(sheet, 400);

    fireTouch(region, "touchstart", touchPayload(200));
    fireTouch(sheet, "touchmove", touchPayload(320));
    fireTouch(sheet, "touchmove", touchPayload(440));
    fireTouch(sheet, "touchend", endTouches(440));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("dragging down never collapses the sheet to zero height", () => {
    render(
      <BottomSheet open onOpenChange={vi.fn()}>
        <p>content</p>
      </BottomSheet>
    );
    const sheet = getSheet();
    const region = getHandleRegion();
    stubRect(sheet, 400);

    fireTouch(region, "touchstart", touchPayload(200));
    // Pull far past the peek (0.15 * 768 = 115px on the jsdom viewport).
    fireTouch(sheet, "touchmove", touchPayload(700));
    fireTouch(sheet, "touchmove", touchPayload(1100));

    const heightPx = parseFloat(sheet.style.getPropertyValue("--sheet-height"));
    expect(heightPx).toBeGreaterThan(0);
    expect(heightPx).toBeLessThan(115);
  });

  it("grabbing mid-settle freezes the sheet at its visual height, not the target", async () => {
    function SnapButton() {
      const { snapToIndex } = useBottomSheet();
      return <button data-testid="snap" onClick={() => snapToIndex(2)} />;
    }
    const { getByTestId } = render(
      <BottomSheet open onOpenChange={vi.fn()}>
        <SnapButton />
      </BottomSheet>
    );
    const sheet = getSheet();
    const region = getHandleRegion();
    stubRect(sheet, 384);

    act(() => {
      getByTestId("snap").click();
    });
    // Let the settle's rAF apply the transition + target var (0.92 * 768).
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    });
    const midSettle = parseFloat(sheet.style.getPropertyValue("--sheet-height"));
    expect(midSettle).toBeCloseTo(706.56, 5);

    // Sheet is visually mid-animation at 200px: grabbing it must freeze 200px,
    // not snap to the 706.56px target (which would jump and over-trigger dismiss).
    stubRect(sheet, 200);
    fireTouch(region, "touchstart", touchPayload(300));
    expect(sheet.style.getPropertyValue("--sheet-height")).toBe("200px");
  });

  it("a long slow pull past the peek dismisses; a short one springs back", async () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <BottomSheet open onOpenChange={onOpenChange}>
        <p>content</p>
      </BottomSheet>
    );
    const sheet = getSheet();
    const region = getHandleRegion();
    stubRectFromVar(sheet, 384);

    // Long deliberate pull: 600px over 2000ms = 0.3 px/ms (below the fling
    // threshold), so the dismissal must come from the over-pull travel: the
    // sheet squishes to ~44px against the 57.5px dismiss threshold.
    mockClock([0, 2000]);
    fireTouch(region, "touchstart", touchPayload(500));
    fireTouch(sheet, "touchmove", touchPayload(1100));
    fireTouch(sheet, "touchend", endTouches(1100));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    unmount();

    // Short pull from the same height: settles back, no dismissal.
    const onOpenChangeShort = vi.fn();
    render(
      <BottomSheet open onOpenChange={onOpenChangeShort}>
        <p>content</p>
      </BottomSheet>
    );
    const sheet2 = getSheet();
    const region2 = getHandleRegion();
    stubRectFromVar(sheet2, 384);

    // Short pull: 120px over 400ms = 0.3 px/ms, and the height stays well
    // above the peek, so the sheet must settle back instead of dismissing.
    mockClock([0, 400]);
    fireTouch(region2, "touchstart", touchPayload(500));
    fireTouch(sheet2, "touchmove", touchPayload(620));
    fireTouch(sheet2, "touchend", endTouches(620));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    expect(onOpenChangeShort).not.toHaveBeenCalled();
  });
});
