"use client";

import { AlertTriangle, MapPin, X } from "lucide-react";
import { useRouteStore, useNavigationStore, usePanelStore } from "@/lib/store";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";
import { maneuverIconFor } from "./maneuver-icons";

/**
 * লাইভ নেভিগেশন ব্যানার — বর্তমান নির্দেশনা, অবশিষ্ট দূরত্ব/সময়, রিয়ারাউট
 * ও আগমনের অবস্থা। নেভিগেশন চালু না থাকলে কিছুই রেন্ডার করে না।
 */

export interface NavigationBannerContentProps {
  instruction: string;
  maneuver: string | undefined;
  remainingDistanceM: number | null;
  remainingDurationS: number | null;
  distanceToStepEndM: number | null;
  destinationName: string | null;
  isRerouting: boolean;
  offRoute: boolean;
  rerouteError: string | null;
  hasArrived: boolean;
  onExit: () => void;
}

export function NavigationBannerContent({
  instruction,
  maneuver,
  remainingDistanceM,
  remainingDurationS,
  distanceToStepEndM,
  destinationName,
  isRerouting,
  offRoute,
  rerouteError,
  hasArrived,
  onExit,
}: NavigationBannerContentProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
          {(() => {
            // অবস্থার প্রাধিকার: আগমন > রিয়ারাউট > সতর্কতা > স্বাভাবিক ধাপ
            if (hasArrived) {
              return <MapPin className="w-5 h-5 text-primary" />;
            }
            if (isRerouting) {
              return (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              );
            }
            if (rerouteError || offRoute) {
              return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            }
            const Icon = maneuverIconFor(maneuver);
            return <Icon className="w-5 h-5 text-primary" />;
          })()}
        </div>

        <div className="flex-1 min-w-0">
          {hasArrived ? (
            <>
              <p className="text-sm font-semibold text-foreground">আপনি গন্তব্যে পৌঁছেছেন</p>
              {destinationName && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{destinationName}</p>
              )}
            </>
          ) : isRerouting ? (
            <p className="text-sm font-medium text-foreground">রুট পুনর্গণনা হচ্ছে...</p>
          ) : rerouteError ? (
            <p className="text-sm font-medium text-amber-600">{rerouteError}</p>
          ) : offRoute ? (
            <p className="text-sm font-medium text-amber-600">
              রুট থেকে সরে গেছেন — নতুন রুট আনা হচ্ছে...
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground truncate">{instruction}</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                {distanceToStepEndM !== null && (
                  <span className="text-lg font-bold text-primary leading-none">
                    {formatDistance(distanceToStepEndM)}
                  </span>
                )}
                {remainingDistanceM !== null && remainingDurationS !== null && (
                  <span className="text-xs text-muted-foreground">
                    মোট {formatDistance(remainingDistanceM)} •{" "}
                    {formatWalkingTime(remainingDurationS)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <button
          onClick={onExit}
          className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="নেভিগেশন বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function NavigationBanner() {
  const isNavigating = useNavigationStore((state) => state.isNavigating);
  const destination = useNavigationStore((state) => state.destination);
  const currentStepIndex = useNavigationStore((state) => state.currentStepIndex);
  const remainingDistance = useNavigationStore((state) => state.remainingDistance);
  const remainingDuration = useNavigationStore((state) => state.remainingDuration);
  const distanceToStepEnd = useNavigationStore((state) => state.distanceToStepEnd);
  const offRoute = useNavigationStore((state) => state.offRoute);
  const isRerouting = useNavigationStore((state) => state.isRerouting);
  const rerouteError = useNavigationStore((state) => state.rerouteError);
  const hasArrived = useNavigationStore((state) => state.hasArrived);
  const activeRoute = useRouteStore((state) => state.activeRoute);

  if (!isNavigating) return null;

  const currentStep = activeRoute?.steps[currentStepIndex];

  const handleExit = () => {
    useNavigationStore.getState().stopNavigation();
    useRouteStore.getState().clearRoute();
    usePanelStore.getState().setActivePanel(null);
  };

  return (
    <div className="absolute top-16 left-4 right-4 z-[40] sm:top-4 sm:right-auto sm:w-96">
      <NavigationBannerContent
        instruction={currentStep?.instruction ?? "এগিয়ে চলুন"}
        maneuver={currentStep?.maneuver}
        remainingDistanceM={remainingDistance}
        remainingDurationS={remainingDuration}
        distanceToStepEndM={distanceToStepEnd}
        destinationName={destination?.name ?? null}
        isRerouting={isRerouting}
        offRoute={offRoute}
        rerouteError={rerouteError}
        hasArrived={hasArrived}
        onExit={handleExit}
      />
    </div>
  );
}
