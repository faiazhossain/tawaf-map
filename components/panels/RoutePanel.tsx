"use client";

import { MapPin, Clock, Navigation, Footprints, X } from "lucide-react";
import { useRouteStore } from "@/lib/store";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";
import { Card } from "@/components/ui/card";

export function RoutePanel() {
  const { activeRoute, isRouting, routeError, clearRoute } = useRouteStore();

  if (isRouting) {
    return (
      <Card className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10 p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Calculating route...</p>
        </div>
      </Card>
    );
  }

  if (routeError) {
    return (
      <Card className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10 p-4 border-destructive/50 bg-destructive/10">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Route Error</p>
            <p className="text-sm text-destructive/80 mt-1">{routeError}</p>
          </div>
          <button
            onClick={clearRoute}
            className="text-destructive/60 hover:text-destructive transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    );
  }

  if (!activeRoute) {
    return null;
  }

  return (
    <Card className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary-foreground" />
          <h3 className="font-semibold text-primary-foreground">Walking Route</h3>
        </div>
        <button
          onClick={clearRoute}
          className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          aria-label="Close route"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Route Summary */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="font-semibold text-foreground">
                {formatDistance(activeRoute.distance)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Walking Time</p>
              <p className="font-semibold text-foreground">
                {formatWalkingTime(activeRoute.duration)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Turn-by-turn Instructions */}
      <div className="max-h-64 overflow-y-auto">
        <div className="px-4 py-2 bg-muted/50 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Directions
          </p>
        </div>
        <div className="divide-y">
          {activeRoute.steps.map((step, index) => (
            <div key={index} className="px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{step.instruction}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDistance(step.distance)}
                    </span>
                    <span className="text-xs text-muted-foreground/60">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatWalkingTime(step.duration)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/30 border-t">
        <p className="text-xs text-muted-foreground text-center">
          Walking speed estimated at 5 km/h. Actual time may vary.
        </p>
      </div>
    </Card>
  );
}
