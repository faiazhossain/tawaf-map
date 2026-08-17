"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import {
  clampWithRubberBand,
  createVelocityTracker,
  dismissBandPx,
  DRAG_THRESHOLD_PX,
  MAX_HEIGHT_FRACTION,
  selectSnapIndex,
  settleDurationMs,
  shouldDismissOnRelease,
  shouldEngageDrag,
} from "@/lib/utils/sheet-physics";

interface BottomSheetContextValue {
  close: () => void;
  /** বর্তমান স্ন্যাপ অবস্থানের সূচক (snapPoints-এর ইনডেক্স)। */
  snapIndex: number;
  /** মোট স্ন্যাপ পয়েন্টের সংখ্যা। */
  snapCount: number;
  /** একটি নির্দিষ্ট স্ন্যাপ পয়েন্টে যাও (peek/normal/expanded নিয়ন্ত্রণের জন্য)। */
  snapToIndex: (index: number) => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function useBottomSheet() {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error("useBottomSheet must be used within BottomSheet");
  }
  return context;
}

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  snapPoints?: number[];
  defaultSnap?: number;
  /** প্রতিবার শীট একটি স্ন্যাপে সেটল করলে (খোলা, snapToIndex, ড্র্যাগ ছাড়া) তার ইনডেক্স জানায়। */
  onSnapChange?: (snapIndex: number) => void;
  className?: string;
  contentClassName?: string;
  showHandle?: boolean;
  showBackdrop?: boolean;
  dismissOnBackdropClick?: boolean;
  dismissOnDragDown?: boolean;
}

const SNAP_POINTS_DEFAULT = [0.15, 0.5, 0.92];
const DEFAULT_SNAP_INDEX = 1;
const CLOSE_TRANSITION_MS = 300;
/** iOS-style overshoot easing for the settle tween. */
const SETTLE_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
/** Data attribute marking the drag handle; gestures starting inside it always engage. */
const DRAG_REGION_ATTR = "data-sheet-drag-region";

type GestureState = "idle" | "pending" | "dragging" | "rejected";

// Ref-counted: two stacked sheets (e.g. the persistent NearbyGatesPanel plus
// GateInfoPanel on the map page) must hold the body lock until both close.
let openSheetCount = 0;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  snapPoints = SNAP_POINTS_DEFAULT,
  defaultSnap = DEFAULT_SNAP_INDEX,
  className,
  contentClassName,
  showHandle = true,
  showBackdrop = true,
  dismissOnBackdropClick = true,
  dismissOnDragDown = true,
  onSnapChange,
}: BottomSheetProps) {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnap);
  const [currentHeight, setCurrentHeight] = useState(snapPoints[defaultSnap]);
  const [isClosing, setIsClosing] = useState(false);

  // Ref-এ রাখা হয় যাতে settleToIndex-এর কলব্যাক আইডেন্টিটি স্থির থাকে - প্যারেন্ট
  // রি-রেন্ডারে জেসচার লেয়ারের নেটিভ লিসনার কখনো পুনরায় বাঁধা না পড়ে।
  const onSnapChangeRef = useRef(onSnapChange);
  onSnapChangeRef.current = onSnapChange;

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus trap + restore: move focus into the sheet on open, constrain Tab,
  // restore to the trigger on close (audit: "No focus trap anywhere").
  useFocusTrap(sheetRef, open && !isClosing);

  // Everything the gesture handlers touch lives in refs: the handlers are
  // attached natively (non-passive touchmove) and must never re-render.
  const gestureState = useRef<GestureState>("idle");
  const touchId = useRef<number | null>(null);
  const startY = useRef(0);
  const startX = useRef(0);
  const startHeightPx = useRef(0);
  const startedOnDragRegion = useRef(false);
  const tracker = useRef(createVelocityTracker());
  const settleTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const isClosingRef = useRef(false);

  // Exit animation: slide the sheet down + fade the backdrop, then unmount.
  const close = useCallback(() => {
    if (isClosingRef.current) return;
    if (prefersReducedMotion()) {
      onOpenChange(false);
      return;
    }
    isClosingRef.current = true;
    setIsClosing(true);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      isClosingRef.current = false;
      setIsClosing(false);
      onOpenChange(false);
    }, CLOSE_TRANSITION_MS);
  }, [onOpenChange]);

  /** Imperative height write - the only path the gesture layer uses, so a drag
      or settle causes zero React renders. */
  const writeHeightPx = useCallback((heightPx: number) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.setProperty("--sheet-height", `${heightPx}px`);
  }, []);

  /** Cancel any in-flight settle so a fresh drag takes over from the
      interpolated position. The height must be read WHILE the transition is
      still running; clearing the transition first would snap the rect to the
      already-written target and the sheet would visually jump. */
  const cancelSettle = useCallback((): number => {
    const sheet = sheetRef.current;
    const timer = settleTimerRef.current;
    const wasSettling = timer !== null;
    if (timer !== null) {
      window.clearTimeout(timer);
      settleTimerRef.current = null;
    }
    if (!sheet) return 0;
    if (wasSettling) {
      const visualPx = sheet.getBoundingClientRect().height;
      sheet.style.transition = "none";
      // Freeze the visually-current height so removing the transition does
      // not snap the sheet to the settle target mid-grab.
      sheet.style.setProperty("--sheet-height", `${visualPx}px`);
      return visualPx;
    }
    return sheet.getBoundingClientRect().height;
  }, []);

  const settleToIndex = useCallback(
    (index: number) => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const clamped = Math.max(0, Math.min(snapPoints.length - 1, index));
      const targetFraction = snapPoints[clamped];
      const targetPx = targetFraction * window.innerHeight;

      const finish = () => {
        setCurrentHeight(targetFraction);
        setCurrentSnapIndex(clamped);
        onSnapChangeRef.current?.(clamped);
      };

      sheet.style.transition = "none";
      const currentPx = sheet.getBoundingClientRect().height;

      if (prefersReducedMotion() || Math.abs(targetPx - currentPx) < 1) {
        settleTimerRef.current = null;
        writeHeightPx(targetPx);
        finish();
        return;
      }

      const duration = settleDurationMs(targetPx - currentPx);
      // The write happens on the next frame so the render before the
      // transition style lands uses the pre-settle value.
      requestAnimationFrame(() => {
        if (!sheetRef.current) return;
        sheet.style.transition = `height ${duration}ms ${SETTLE_EASING}`;
        sheet.style.setProperty("--sheet-height", `${targetPx}px`);
      });

      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        // Land the state where the transition ended; the layout effect keeps
        // the dvh write from visibly repositioning the sheet.
        sheet.style.transition = "";
        finish();
      }, duration + 10);
    },
    [snapPoints, writeHeightPx]
  );

  const snapToIndex = useCallback(
    (index: number) => {
      settleToIndex(index);
    },
    [settleToIndex]
  );

  const settleWithVelocity = useCallback(
    (heightPx: number, velocityPxPerMs: number) => {
      const viewport = Math.max(window.innerHeight, 1);
      const snapPointsPx = snapPoints.map((fraction) => fraction * viewport);
      settleToIndex(selectSnapIndex(heightPx, velocityPxPerMs, snapPointsPx));
    },
    [snapPoints, settleToIndex]
  );

  // Effect: open/close state, body scroll lock, gesture listeners. Heavily
  // ref-driven so it attaches once per open instead of re-binding per render.
  useEffect(() => {
    if (!open) return;

    openSheetCount += 1;
    document.body.classList.add("bottom-sheet-open");

    setCurrentSnapIndex(defaultSnap);
    onSnapChangeRef.current?.(defaultSnap);
    const restingFraction = snapPoints[defaultSnap];
    setCurrentHeight(restingFraction);
    const sheet = sheetRef.current;
    if (sheet) {
      sheet.style.setProperty("--sheet-height", `${restingFraction * 100}dvh`);
      sheet.style.transition = "";
    }
    gestureState.current = "idle";
    tracker.current.reset();

    return () => {
      openSheetCount = Math.max(0, openSheetCount - 1);
      if (openSheetCount === 0) {
        document.body.classList.remove("bottom-sheet-open");
      }
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      gestureState.current = "idle";
    };
  }, [open, defaultSnap, snapPoints]);

  const onGestureStart = useCallback(
    (clientX: number, clientY: number, target: EventTarget | null) => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      startHeightPx.current = cancelSettle();
      startX.current = clientX;
      startY.current = clientY;
      tracker.current.reset();
      tracker.current.add(clientY, performance.now());
      startedOnDragRegion.current =
        target instanceof HTMLElement && target.closest(`[${DRAG_REGION_ATTR}]`) !== null;
      gestureState.current = "pending";
    },
    [cancelSettle]
  );

  const onGestureMove = useCallback(
    (clientX: number, clientY: number, preventDefault: () => void) => {
      const sheet = sheetRef.current;
      const content = contentRef.current;
      if (!sheet || gestureState.current === "idle" || gestureState.current === "rejected") return;

      const dx = clientX - startX.current;
      const dy = clientY - startY.current;

      if (gestureState.current === "pending") {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
        // Horizontal swipes scroll carousels / switch tabs, never drag the sheet.
        if (Math.abs(dx) > Math.abs(dy)) {
          gestureState.current = "rejected";
          return;
        }
        const engage = shouldEngageDrag({
          dy,
          scrollTop: content?.scrollTop ?? 0,
          scrollHeight: content?.scrollHeight ?? 0,
          clientHeight: content?.clientHeight ?? 0,
          startedOnDragRegion: startedOnDragRegion.current,
        });
        if (!engage) return; // stay pending: native scroll owns the gesture
        gestureState.current = "dragging";
      }

      preventDefault();
      tracker.current.add(clientY, performance.now());

      const viewport = Math.max(window.innerHeight, 1);
      const snapPointsPx = snapPoints.map((fraction) => fraction * viewport);
      const peekPx = snapPointsPx[0];
      const rawHeightPx = startHeightPx.current - dy;
      const displayed = clampWithRubberBand(rawHeightPx, {
        // The drag never collapses the sheet past its peek strip: below the
        // lowest snap the pull becomes a rubber-banded over-pull, so the
        // grabbable handle stays on screen. Dismissal is decided on release
        // (fling or a long deliberate pull), never by the sheet vanishing.
        minPx: peekPx,
        maxPx: snapPointsPx[snapPointsPx.length - 1],
        hardMinPx: 0,
        hardMaxPx: MAX_HEIGHT_FRACTION * viewport,
        dimensionPx: viewport,
        overPullDimensionPx: dismissBandPx(peekPx, viewport),
      });
      writeHeightPx(displayed);
    },
    [snapPoints, writeHeightPx]
  );

  const onGestureEnd = useCallback(() => {
    if (gestureState.current !== "dragging") {
      gestureState.current = "idle";
      return;
    }
    gestureState.current = "idle";
    const sheet = sheetRef.current;
    if (!sheet) return;

    const viewport = Math.max(window.innerHeight, 1);
    const snapPointsPx = snapPoints.map((fraction) => fraction * viewport);
    const heightPx = sheet.getBoundingClientRect().height;
    const velocityPxPerMs = tracker.current.velocity();

    if (
      shouldDismissOnRelease({
        heightPx,
        peekPx: snapPointsPx[0],
        viewportPx: viewport,
        velocityPxPerMs,
        dismissOnDragDown,
      })
    ) {
      close();
      return;
    }
    settleWithVelocity(heightPx, velocityPxPerMs);
  }, [close, dismissOnDragDown, snapPoints, settleWithVelocity]);

  const onGestureCancel = useCallback(() => {
    if (gestureState.current !== "dragging") {
      gestureState.current = "idle";
      return;
    }
    gestureState.current = "idle";
    const sheet = sheetRef.current;
    if (!sheet) return;
    settleWithVelocity(sheet.getBoundingClientRect().height, 0);
  }, [settleWithVelocity]);

  // Native non-passive listeners: React attaches touchmove passively at the
  // root, which makes preventDefault (needed for the mid-gesture scroll
  // handoff) impossible - hence addEventListener on the sheet element itself.
  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const trackedTouch = (event: TouchEvent): Touch | null => {
      if (touchId.current === null) return null;
      for (const touch of Array.from(event.changedTouches)) {
        if (touch.identifier === touchId.current) return touch;
      }
      return null;
    };

    const handleTouchStart = (event: globalThis.TouchEvent) => {
      if (touchId.current !== null) return; // single-finger gesture only
      const touch = event.changedTouches[0];
      touchId.current = touch.identifier;
      onGestureStart(touch.clientX, touch.clientY, event.target);
    };

    const handleTouchMove = (event: globalThis.TouchEvent) => {
      const touch = trackedTouch(event);
      if (!touch) return;
      onGestureMove(touch.clientX, touch.clientY, () => event.preventDefault());
    };

    const handleTouchEnd = (event: globalThis.TouchEvent) => {
      const touch = trackedTouch(event);
      if (!touch) return;
      touchId.current = null;
      onGestureEnd();
    };

    const handleTouchCancel = (event: globalThis.TouchEvent) => {
      const touch = trackedTouch(event);
      if (!touch) return;
      touchId.current = null;
      onGestureCancel();
    };

    // Mouse/pen: touch is owned by the touch path above. Pointer capture শুধু
    // ড্র্যাগ শুরু হলে নেওয়া হয় - pointerdown-এ নিলে click ইভেন্ট শীটে redirect
    // হয়ে যায় এবং শীটের ভেতরের বোতামগুলো মাউসে কাজ করে না (৬৪০-৭৬৭px ব্যান্ডে
    // শীট দেখা যায় এমন ডেস্কটপ/ট্যাবলেটে সব বোতাম মৃত ছিল)।
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (!event.isPrimary) return;
      onGestureStart(event.clientX, event.clientY, event.target);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (!event.isPrimary) return;
      const wasDragging = gestureState.current === "dragging";
      onGestureMove(event.clientX, event.clientY, () => {
        if (gestureState.current === "dragging") {
          sheet.style.userSelect = "none";
        }
      });
      // ড্র্যাগ এই মুভেই engage হলে এখন capture নাও - এর পরের মুভ/আপ শীটের
      // বাইরে গেলেও ট্র্যাক হবে।
      if (!wasDragging && gestureState.current === "dragging") {
        sheet.setPointerCapture(event.pointerId);
        sheet.style.userSelect = "none";
      }
    };

    const finishPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (!event.isPrimary) return;
      sheet.style.userSelect = "";
      onGestureEnd();
    };

    const cancelPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (!event.isPrimary) return;
      sheet.style.userSelect = "";
      onGestureCancel();
    };

    sheet.addEventListener("touchstart", handleTouchStart, { passive: true });
    sheet.addEventListener("touchmove", handleTouchMove, { passive: false });
    sheet.addEventListener("touchend", handleTouchEnd);
    sheet.addEventListener("touchcancel", handleTouchCancel);
    sheet.addEventListener("pointerdown", handlePointerDown);
    sheet.addEventListener("pointermove", handlePointerMove);
    sheet.addEventListener("pointerup", finishPointer);
    sheet.addEventListener("pointercancel", cancelPointer);
    sheet.addEventListener("lostpointercapture", cancelPointer);

    return () => {
      sheet.removeEventListener("touchstart", handleTouchStart);
      sheet.removeEventListener("touchmove", handleTouchMove);
      sheet.removeEventListener("touchend", handleTouchEnd);
      sheet.removeEventListener("touchcancel", handleTouchCancel);
      sheet.removeEventListener("pointerdown", handlePointerDown);
      sheet.removeEventListener("pointermove", handlePointerMove);
      sheet.removeEventListener("pointerup", finishPointer);
      sheet.removeEventListener("pointercancel", cancelPointer);
      sheet.removeEventListener("lostpointercapture", cancelPointer);
      touchId.current = null;
      gestureState.current = "idle";
      sheet.style.userSelect = "";
    };
  }, [open, onGestureStart, onGestureMove, onGestureEnd, onGestureCancel]);

  const handleBackdropClick = useCallback(() => {
    if (dismissOnBackdropClick) {
      close();
    }
  }, [dismissOnBackdropClick, close]);

  const handleKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    },
    [close]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // State is the source of truth at rest: write the dvh-derived height whenever
  // the resting fraction changes (open, snap settle, resizes are left to dvh).
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !open) return;
    if (gestureState.current === "dragging") return; // never clobber a live drag
    sheet.style.transition = "";
    sheet.style.setProperty("--sheet-height", `${currentHeight * 100}dvh`);
  }, [currentHeight, open]);

  useEffect(() => {
    return () => {
      isClosingRef.current = false;
    };
  }, []);

  const contextValue = useMemo<BottomSheetContextValue>(
    () => ({
      close,
      snapIndex: currentSnapIndex,
      snapCount: snapPoints.length,
      snapToIndex,
    }),
    [close, currentSnapIndex, snapPoints.length, snapToIndex]
  );

  if (!open) return null;

  return (
    <BottomSheetContext.Provider value={contextValue}>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className={cn(
            "fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300",
            isClosing ? "opacity-0" : "opacity-100"
          )}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[110] rounded-t-3xl",
          "bg-surface",
          "border-t border-border",
          "shadow-2xl",
          "will-change-transform",
          "flex flex-col max-h-[100dvh]",
          className
        )}
        style={{
          height: "var(--sheet-height)",
          ["--sheet-height" as string]: `${currentHeight * 100}dvh`,
          // Slide down to dismiss on close (CSS transition, off the gesture path).
          transform: isClosing ? "translateY(100%)" : "translateY(0)",
          transition: isClosing
            ? `transform ${CLOSE_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
            : undefined,
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle/Grabber */}
        {showHandle && (
          <div
            {...{ [DRAG_REGION_ATTR]: "" }}
            className="flex justify-center pt-3 pb-1 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
          >
            <button
              className="p-2 rounded-full hover:bg-muted active:bg-muted transition-colors"
              aria-label="শীট সরাতে টানুন"
              tabIndex={0}
              // কীবোর্ড: Enter/Space পরবর্তী স্ন্যাপ পয়েন্টে যায়।
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  snapToIndex(Math.min(currentSnapIndex + 1, snapPoints.length - 1));
                }
              }}
            >
              <div className="w-10 h-1.5 bg-muted-foreground/40 rounded-full" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden min-h-0",
            "scrollbar-thin overscroll-contain touch-pan-y",
            contentClassName
          )}
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
          }}
        >
          {children}
        </div>
      </div>
    </BottomSheetContext.Provider>
  );
}

BottomSheet.Header = function BottomSheetHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-4 pb-4", className)}>{children}</div>
  );
};

BottomSheet.Title = function BottomSheetTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={cn("text-lg font-bold text-foreground", className)}>{children}</h2>;
};

BottomSheet.Subtitle = function BottomSheetSubtitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
};

BottomSheet.CloseButton = function BottomSheetCloseButton({ className }: { className?: string }) {
  const { close } = useBottomSheet();
  return (
    <button
      onClick={close}
      className={cn(
        "p-2 rounded-lg hover:bg-muted active:bg-muted",
        "text-muted-foreground hover:text-foreground",
        "transition-colors",
        className
      )}
      aria-label="বন্ধ করুন"
    >
      <X className="w-5 h-5" />
    </button>
  );
};

BottomSheet.Content = function BottomSheetContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("px-4", className)}>{children}</div>;
};

BottomSheet.ScrollContent = function BottomSheetScrollContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("overflow-y-auto scrollbar-thin overscroll-contain", className)}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 1rem)",
      }}
    >
      {children}
    </div>
  );
};

BottomSheet.Footer = function BottomSheetFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("p-4 border-t border-border", "sticky bottom-0 bg-surface", className)}
      style={{
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0.5rem))",
      }}
    >
      {children}
    </div>
  );
};
