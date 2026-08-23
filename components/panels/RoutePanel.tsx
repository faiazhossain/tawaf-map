"use client";

import { useEffect, useRef } from "react";
import { MapPin, Clock, Navigation, Footprints, X, Route, AlertTriangle } from "lucide-react";
import { useRouteStore, useNavigationStore, usePanelStore } from "@/lib/store";
import { formatDistance, formatWalkingTime, estimateWalkingTime } from "@/lib/utils/distance";
import { useMapRouting } from "@/lib/hooks/useMapRouting";
import type { RouteApproach } from "@/types/navigation";
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
  isActive = false,
  isPast = false,
}: {
  instruction: string;
  distance: number;
  duration: number;
  index: number;
  isActive?: boolean;
  isPast?: boolean;
}) {
  return (
    <div
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "step" : undefined}
      className={`px-4 py-3 hover:bg-muted transition-colors -mx-4 border-l-4 ${
        isActive ? "border-primary bg-primary-soft/30" : "border-transparent"
      } ${isPast ? "opacity-50" : ""}`}
    >
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

function RouteSummaryGrid({ distance, duration }: { distance: number; duration: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary-soft rounded-lg">
          <Footprints className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">দূরত্ব</p>
          <p className="font-semibold text-foreground">{formatDistance(distance)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary-soft rounded-lg">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">সময়</p>
          <p className="font-semibold text-foreground">{formatWalkingTime(duration)}</p>
        </div>
      </div>
    </div>
  );
}

/** ফুটার: নেভিগেশন শুরুর বোতাম, চলাকালীন বন্ধের বোতাম, নাহলে গতি-নোট। */
function RouteFooter({
  isNavigating,
  onStart,
  onExit,
}: {
  isNavigating: boolean;
  onStart: () => void;
  onExit: () => void;
}) {
  if (isNavigating) {
    return (
      <div className="px-4 py-3 bg-muted/30 border-t border-border/50 -mx-4 mt-auto">
        <button
          onClick={onExit}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium hover:bg-rose-500/20 transition-colors"
        >
          <X className="w-4 h-4" />
          নেভিগেশন বন্ধ করুন
        </button>
      </div>
    );
  }
  return (
    <div className="px-4 py-3 bg-muted/30 border-t border-border/50 -mx-4 mt-auto">
      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Navigation className="w-4 h-4" />
        নেভিগেশন শুরু করুন
      </button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        গড় হাঁটার গতি ৫ কিমি/ঘণ্টা ধরে হিসাব করা হয়েছে
      </p>
    </div>
  );
}

interface NavigationMode {
  isNavigating: boolean;
  currentStepIndex: number;
  isRerouting: boolean;
  onStart: () => void;
  onExit: () => void;
}

function RoutePanelContent({
  route,
  navigation,
  onClose,
  onRetry,
}: {
  route: {
    distance: number;
    duration: number;
    steps: Array<{ instruction: string; distance: number; duration: number }>;
    approach?: RouteApproach | null;
    approximate?: boolean;
  };
  navigation: NavigationMode;
  onClose: () => void;
  onRetry: (() => void) | null;
}) {
  const { isNavigating, currentStepIndex, isRerouting } = navigation;
  const stepsContainerRef = useRef<HTMLDivElement | null>(null);

  // ধাপ বদলালে সক্রিয় সারি দৃশ্যের ভেতরে রাখা (হঠাৎ লাফ নয়, nearest-ই)।
  useEffect(() => {
    if (!isNavigating) return;
    stepsContainerRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [currentStepIndex, isNavigating]);

  return (
    <>
      {/* Header */}
      <div className="bg-primary px-4 py-4 flex items-center justify-between -mx-4 rounded-t-3xl">
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
        {route.approximate && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-600">
                  নির্দিষ্ট হাঁটার পথ পাওয়া যায়নি — সরলরেখায় আনুমানিক পথ দেখানো হচ্ছে
                </p>
                {/* রিট্রাই ব্যর্থ হলে এরর-কন্টেন্ট দেখায়, আনুমানিক রুট ম্যাপে থেকে যায়;
                    প্যানেল বন্ধ করলে সব পরিষ্কার হয়। নেভিগেশন চলাকালীন রিট্রাই নয়। */}
                {onRetry && !isNavigating && (
                  <button
                    onClick={onRetry}
                    className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-500 underline underline-offset-2 transition-colors"
                  >
                    আবার চেষ্টা করুন
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <RouteSummaryGrid distance={route.distance} duration={route.duration} />
        {route.approach && !isNavigating && (
          <p className="text-xs text-muted-foreground mt-3">
            গন্তব্যের শেষ প্রায় {formatDistance(route.approach.distance)} রাস্তার বাইরে — ডটেড রেখা
            ধরে হেঁটে যান
          </p>
        )}
        {isRerouting && (
          <div className="flex items-center gap-2 mt-3 text-sm text-amber-600">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            রুট পুনর্গণনা হচ্ছে...
          </div>
        )}
      </div>

      {/* Turn-by-turn Instructions — ডেস্কটপে স্ক্রল-সীমিত, মোবাইলে শিট নিজেই স্ক্রল করে */}
      <div ref={stepsContainerRef} className="sm:max-h-64 sm:overflow-y-auto">
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
              isActive={isNavigating && index === currentStepIndex}
              isPast={isNavigating && index < currentStepIndex}
            />
          ))}
        </div>
      </div>

      <RouteFooter
        isNavigating={isNavigating}
        onStart={navigation.onStart}
        onExit={navigation.onExit}
      />
    </>
  );
}

export function RoutePanel({ onClose }: RoutePanelProps) {
  const { activeRoute, isRouting, routeError, clearRoute } = useRouteStore();
  const { activePanel, setActivePanel } = usePanelStore();
  const isNavigating = useNavigationStore((state) => state.isNavigating);
  const destination = useNavigationStore((state) => state.destination);
  const currentStepIndex = useNavigationStore((state) => state.currentStepIndex);
  const remainingDistance = useNavigationStore((state) => state.remainingDistance);
  const remainingDuration = useNavigationStore((state) => state.remainingDuration);
  const isRerouting = useNavigationStore((state) => state.isRerouting);

  const handleClose = () => {
    if (isNavigating) {
      useNavigationStore.getState().stopNavigation();
    } else {
      useNavigationStore.getState().clearDestination();
    }
    clearRoute();
    setActivePanel(null);
    onClose?.();
  };

  const handleStartNavigation = () => {
    if (destination) {
      useNavigationStore.getState().startNavigation(destination);
      return;
    }
    // পুরনো রুটে গন্তব্য-স্টোর খালি থাকলে জ্যামিতির শেষ বিন্দুই গন্তব্য — তবে
    // সংযোগকারী থাকলে তার শেষ বিন্দুই প্রকৃত গন্তব্য, রাস্তার বিন্দু নয়।
    const approach = activeRoute?.approach ?? null;
    const last = approach
      ? approach.geometry[approach.geometry.length - 1]
      : activeRoute?.geometry[activeRoute.geometry.length - 1];
    if (last) {
      useNavigationStore
        .getState()
        .startNavigation({ coordinates: [last[0], last[1]], name: "গন্তব্য" });
    }
  };

  // আনুমানিক রুটে রিট্রাই — সফল হলে সত্যিকারের রুট এসে বদলে দেয়।
  const { calculateRoute } = useMapRouting();
  const handleRetryApproximate = () => {
    if (destination) {
      void calculateRoute(destination.coordinates);
    }
  };

  // নেভিগেশনে লাইভ অবশিষ্ট মান (ইঞ্জিন সংযোগকারীর বাকিটাও ধরে), নাহলে
  // রুটের মোট মানে সংযোগকারীর দূরত্ব ও হাঁটার সময় যোগ হয়।
  const approach = activeRoute?.approach ?? null;
  const summaryRoute = activeRoute
    ? {
        ...activeRoute,
        distance:
          isNavigating && remainingDistance !== null
            ? remainingDistance
            : activeRoute.distance + (approach?.distance ?? 0),
        duration:
          isNavigating && remainingDuration !== null
            ? remainingDuration
            : activeRoute.duration + (approach ? estimateWalkingTime(approach.distance) : 0),
      }
    : null;

  const navigation: NavigationMode = {
    isNavigating,
    currentStepIndex,
    isRerouting,
    onStart: handleStartNavigation,
    onExit: handleClose,
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
        {!isRouting && !routeError && summaryRoute && (
          <RoutePanelContent
            route={summaryRoute}
            navigation={navigation}
            onClose={handleClose}
            onRetry={summaryRoute.approximate ? handleRetryApproximate : null}
          />
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
        {!isRouting && !routeError && summaryRoute && (
          <div className="px-4">
            <RoutePanelContent
              route={summaryRoute}
              navigation={navigation}
              onClose={handleClose}
              onRetry={summaryRoute.approximate ? handleRetryApproximate : null}
            />
          </div>
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
