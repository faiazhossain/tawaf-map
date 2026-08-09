"use client";

import { MapPin, Clock, Navigation, Footprints, X, Route } from "lucide-react";
import { useRouteStore, usePanelStore } from "@/lib/store";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";
import { BottomSheet } from "@/components/ui/bottom-sheet";

interface RoutePanelProps {
  onClose?: () => void;
}

function RouteLoadingContent() {
  return (
    <div className="flex items-center gap-3 py-8">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-foreground">রুট বের করা হচ্ছে...</p>
    </div>
  );
}

function RouteErrorContent({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <div className="py-4">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-rose-400">রুট ত্রুটি</p>
            <p className="text-sm text-rose-400/80 mt-1">{error}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-rose-400/60 hover:text-rose-400 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RouteStepContent({
  instruction,
  distance,
  duration,
  index,
}: {
  instruction: string;
  distance: number;
  duration: number;
  index: number;
}) {
  return (
    <div className="px-4 py-3 hover:bg-muted transition-colors -mx-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{instruction}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">{formatDistance(distance)}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{formatWalkingTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoutePanelContent({
  route,
  onClose,
}: {
  route: {
    distance: number;
    duration: number;
    steps: Array<{ instruction: string; distance: number; duration: number }>;
  };
  onClose: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="bg-primary px-4 py-4 flex items-center justify-between -mx-4 sm:mx-0 rounded-t-3xl">
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-foreground" />
          <h3 className="font-semibold text-foreground">হাঁটার রুট</h3>
        </div>
        <button
          onClick={onClose}
          className="text-foreground/80 hover:text-foreground transition-colors"
          aria-label="Close route"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Route Summary */}
      <div className="p-4 border-b border-border/50">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-soft rounded-lg">
              <Footprints className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">দূরত্ব</p>
              <p className="font-semibold text-foreground">{formatDistance(route.distance)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-soft rounded-lg">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">সময়</p>
              <p className="font-semibold text-foreground">{formatWalkingTime(route.duration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Turn-by-turn Instructions */}
      <div>
        <div className="px-4 py-2 bg-muted/50 border-b border-border/50 sticky top-0 -mx-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            দিক নির্দেশনা
          </p>
        </div>
        <div className="divide-y divide-border/50">
          {route.steps.map((step, index) => (
            <RouteStepContent
              key={index}
              instruction={step.instruction}
              distance={step.distance}
              duration={step.duration}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/30 border-t border-border/50 -mx-4 mt-auto">
        <p className="text-xs text-muted-foreground text-center">
          গড় হাঁটার গতি ৫ কিমি/ঘণ্টা ধরে হিসাব করা হয়েছে
        </p>
      </div>
    </>
  );
}

export function RoutePanel({ onClose }: RoutePanelProps) {
  const { activeRoute, isRouting, routeError, clearRoute } = useRouteStore();
  const { activePanel, setActivePanel } = usePanelStore();

  const handleClose = () => {
    clearRoute();
    setActivePanel(null);
    onClose?.();
  };

  // Mobile bottom sheet
  const mobileContent = (
    <BottomSheet
      open={activePanel === "route"}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      snapPoints={[0.25, 0.5, 0.85]}
      defaultSnap={1}
      showBackdrop={false}
      className="max-h-[85dvh]"
    >
      <div className="px-4">
        {isRouting && <RouteLoadingContent />}
        {routeError && <RouteErrorContent error={routeError} onDismiss={handleClose} />}
        {!isRouting && !routeError && activeRoute && (
          <RoutePanelContent route={activeRoute} onClose={handleClose} />
        )}
      </div>
    </BottomSheet>
  );

  // Desktop floating panel
  const desktopContent = (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[90]">
      <div className="bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
        {isRouting && (
          <div className="p-4">
            <RouteLoadingContent />
          </div>
        )}
        {routeError && (
          <div className="p-4">
            <RouteErrorContent error={routeError} onDismiss={handleClose} />
          </div>
        )}
        {!isRouting && !routeError && activeRoute && (
          <>
            {/* Header */}
            <div className="bg-primary px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="w-5 h-5 text-foreground" />
                <h3 className="font-semibold text-foreground">হাঁটার রুট</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-foreground/80 hover:text-foreground transition-colors"
                aria-label="Close route"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Route Summary */}
            <div className="p-4 border-b border-border/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-soft rounded-lg">
                    <Footprints className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">দূরত্ব</p>
                    <p className="font-semibold text-foreground">
                      {formatDistance(activeRoute.distance)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-soft rounded-lg">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">সময়</p>
                    <p className="font-semibold text-foreground">
                      {formatWalkingTime(activeRoute.duration)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Turn-by-turn Instructions */}
            <div className="max-h-64 overflow-y-auto">
              <div className="px-4 py-2 bg-muted/50 border-b border-border/50 sticky top-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  দিক নির্দেশনা
                </p>
              </div>
              <div className="divide-y divide-border/50">
                {activeRoute.steps.map((step, index) => (
                  <RouteStepContent
                    key={index}
                    instruction={step.instruction}
                    distance={step.distance}
                    duration={step.duration}
                    index={index}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-muted/30 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                গড় হাঁটার গতি ৫ কিমি/ঘণ্টা ধরে হিসাব করা হয়েছে
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (!activeRoute && !isRouting && !routeError) {
    return null;
  }

  return (
    <>
      <div className="block sm:hidden">{mobileContent}</div>
      <div className="hidden sm:block">{desktopContent}</div>
    </>
  );
}
