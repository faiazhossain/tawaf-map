"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

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
  className?: string;
  contentClassName?: string;
  showHandle?: boolean;
  showBackdrop?: boolean;
  dismissOnBackdropClick?: boolean;
  dismissOnDragDown?: boolean;
}

const SNAP_POINTS_DEFAULT = [0.15, 0.5, 0.92];
const DEFAULT_SNAP_INDEX = 1;
const DRAG_THRESHOLD = 10;
const VELOCITY_THRESHOLD = 0.5;
const CLOSE_TRANSITION_MS = 300;

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
}: BottomSheetProps) {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnap);
  const [currentHeight, setCurrentHeight] = useState(snapPoints[defaultSnap]);
  const [isClosing, setIsClosing] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Focus trap + restore: move focus into the sheet on open, constrain Tab,
  // restore to the trigger on close (audit: "No focus trap anywhere").
  useFocusTrap(sheetRef, open && !isClosing);

  const startY = useRef(0);
  const startHeight = useRef(0);
  const currentY = useRef(0);
  const lastY = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const isClosingRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Exit animation: slide the sheet down + fade the backdrop, then unmount.
  // Previously close() toggled isClosing synchronously (batched) so the sheet
  // popped out with no transition. Now it stays mounted for the transition.
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

  const snapTo = useCallback(
    (targetHeight: number, animate = true) => {
      if (!sheetRef.current) return;

      // Reduced-motion: snap instantly, no rAF.
      if (!animate || prefersReducedMotion()) {
        setCurrentHeight(targetHeight);
        setCurrentSnapIndex(snapPoints.indexOf(targetHeight));
        return;
      }

      const start = currentHeight;
      const distance = targetHeight - start;
      const startTime = performance.now();
      const duration = Math.min(Math.abs(distance) * 0.3 + 150, 400);

      const animateSpring = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const newHeight = start + distance * easeOut;

        setCurrentHeight(newHeight);

        if (progress < 1) {
          rafId.current = requestAnimationFrame(animateSpring);
        } else {
          setCurrentSnapIndex(snapPoints.indexOf(targetHeight));
        }
      };

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      rafId.current = requestAnimationFrame(animateSpring);
    },
    [currentHeight, snapPoints]
  );

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(snapPoints.length - 1, index));
      snapTo(snapPoints[clamped]);
    },
    [snapPoints, snapTo]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!sheetRef.current) return;

      isDraggingRef.current = true;
      startY.current = e.touches[0].clientY;
      startHeight.current = currentHeight;
      lastY.current = e.touches[0].clientY;
      velocity.current = 0;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      sheetRef.current.style.transition = "none";
    },
    [currentHeight]
  );

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current || !sheetRef.current) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - lastY.current;
    velocity.current = deltaY;
    lastY.current = currentY.current;

    const newHeight =
      startHeight.current - (currentY.current - startY.current) / window.innerHeight;

    if (newHeight >= 0 && newHeight <= 0.98) {
      setCurrentHeight(newHeight);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || !sheetRef.current) return;

    isDraggingRef.current = false;
    sheetRef.current.style.transition = "";

    const finalVelocity = Math.abs(velocity.current / (window.innerHeight || 1));

    // Check if should dismiss (dragged down past threshold or high velocity downward)
    if (
      dismissOnDragDown &&
      (currentHeight < 0.1 || (velocity.current > 0 && finalVelocity > VELOCITY_THRESHOLD))
    ) {
      close();
      return;
    }

    // Find nearest snap point
    const velocityDirection = velocity.current > 0 ? -1 : 1;
    let targetIndex = currentSnapIndex;

    if (finalVelocity > VELOCITY_THRESHOLD) {
      targetIndex = Math.max(
        0,
        Math.min(snapPoints.length - 1, currentSnapIndex + velocityDirection)
      );
    } else {
      let minDistance = Infinity;
      snapPoints.forEach((point, index) => {
        const distance = Math.abs(currentHeight - point);
        if (distance < minDistance) {
          minDistance = distance;
          targetIndex = index;
        }
      });
    }

    snapTo(snapPoints[targetIndex]);
  }, [currentHeight, currentSnapIndex, dismissOnDragDown, snapPoints, snapTo, close]);

  const handleBackdropClick = useCallback(() => {
    if (dismissOnBackdropClick) {
      close();
    }
  }, [dismissOnBackdropClick, close]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    },
    [close]
  );

  useEffect(() => {
    if (open) {
      setCurrentSnapIndex(defaultSnap);
      setCurrentHeight(snapPoints[defaultSnap]);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, defaultSnap, snapPoints]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Cancel any in-flight animation/timer on unmount.
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const contextValue: BottomSheetContextValue = {
    close,
    snapIndex: currentSnapIndex,
    snapCount: snapPoints.length,
    snapToIndex,
  };

  if (!open) return null;

  return (
    <BottomSheetContext.Provider value={contextValue}>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          ref={backdropRef}
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
          height: `${currentHeight * 100}dvh`,
          // Slide down to dismiss on close (CSS transition, off main thread).
          transform: isClosing ? "translateY(100%)" : "translateY(0)",
          transition: isClosing
            ? `transform ${CLOSE_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
            : undefined,
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle/Grabber */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <button
              className="p-2 rounded-full hover:bg-muted active:bg-muted transition-colors cursor-grab active:cursor-grabbing"
              aria-label="শীট সরাতে টানুন"
              tabIndex={0}
              // কীবোর্ড: Enter/Space পরবর্তী স্ন্যাপ পয়েন্টে যায় (উপরে থাকলে বড়, নিচে থাকলে ছোট)।
              // আগে এই <button> এ aria-label ছিল কিন্তু কীবোর্ড অ্যাকশন ছিল না (অডিট)।
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
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
            "scrollbar-thin",
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
      className={cn("overflow-y-auto scrollbar-thin", className)}
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
