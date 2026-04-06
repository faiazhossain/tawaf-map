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
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetContextValue {
  close: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

function useBottomSheet() {
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
  dismissOnBackdropClick?: boolean;
  dismissOnDragDown?: boolean;
}

const SNAP_POINTS_DEFAULT = [0.15, 0.5, 0.92];
const DEFAULT_SNAP_INDEX = 1;
const DRAG_THRESHOLD = 10;
const VELOCITY_THRESHOLD = 0.5;
const SPRING_TENSION = 300;
const SPRING_FRICTION = 25;

export function BottomSheet({
  open,
  onOpenChange,
  children,
  snapPoints = SNAP_POINTS_DEFAULT,
  defaultSnap = DEFAULT_SNAP_INDEX,
  className,
  contentClassName,
  showHandle = true,
  dismissOnBackdropClick = true,
  dismissOnDragDown = true,
}: BottomSheetProps) {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnap);
  const [currentHeight, setCurrentHeight] = useState(snapPoints[defaultSnap]);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const startY = useRef(0);
  const startHeight = useRef(0);
  const currentY = useRef(0);
  const lastY = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const close = useCallback(() => {
    setIsClosing(true);
    onOpenChange(false);
    setIsClosing(false);
  }, [onOpenChange]);

  const snapTo = useCallback(
    (targetHeight: number, animate = true) => {
      if (!sheetRef.current) return;

      if (animate) {
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
      } else {
        setCurrentHeight(targetHeight);
        setCurrentSnapIndex(snapPoints.indexOf(targetHeight));
      }
    },
    [currentHeight, snapPoints]
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

  const contextValue = { close };

  if (!open) return null;

  return (
    <BottomSheetContext.Provider value={contextValue}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={cn(
          "fixed inset-0 z-[100] bg-black/40 transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[110] rounded-t-3xl",
          "bg-slate-900",
          "border-t border-slate-700/50",
          "shadow-2xl",
          "will-change-transform",
          "flex flex-col max-h-[100dvh]",
          className
        )}
        style={{
          height: `${currentHeight * 100}dvh`,
          transform: `translateY(0)`,
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
              className="p-2 rounded-full hover:bg-slate-800/50 active:bg-slate-800/50 transition-colors cursor-grab active:cursor-grabbing"
              aria-label="Drag to resize sheet"
              tabIndex={0}
            >
              <div className="w-10 h-1.5 bg-slate-700 rounded-full" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden min-h-0",
            "scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700",
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
  return <h2 className={cn("text-lg font-bold text-white", className)}>{children}</h2>;
};

BottomSheet.Subtitle = function BottomSheetSubtitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("text-sm text-slate-400", className)}>{children}</p>;
};

BottomSheet.CloseButton = function BottomSheetCloseButton({ className }: { className?: string }) {
  const { close } = useBottomSheet();
  return (
    <button
      onClick={close}
      className={cn(
        "p-2 rounded-lg hover:bg-slate-800 active:bg-slate-700",
        "text-slate-400 hover:text-white",
        "transition-colors",
        className
      )}
      aria-label="Close"
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
      className={cn(
        "overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700",
        className
      )}
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
      className={cn("p-4 border-t border-slate-700/50", "sticky bottom-0 bg-slate-900", className)}
      style={{
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0.5rem))",
      }}
    >
      {children}
    </div>
  );
};
