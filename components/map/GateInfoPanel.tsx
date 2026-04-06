"use client";

import { useMemo } from "react";
import { useGateStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, X, Accessibility, Zap, Droplet } from "lucide-react";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";

export function GateInfoPanel() {
  const { selectedGate, clearGate } = useGateStore();

  const gate = selectedGate.gate;
  const distance = selectedGate.distance;
  const walkingTime = selectedGate.walkingTime;

  const facilityIcons = {
    restroom: <Droplet className="w-4 h-4" />,
    escalator: <Zap className="w-4 h-4" />,
    elevator: <Accessibility className="w-4 h-4" />,
    wheelchair: <Accessibility className="w-4 h-4" />,
  };

  if (!gate) {
    return null;
  }

  return (
    <Card className="absolute top-4 right-4 z-10 w-80 max-h-[80vh] overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{gate.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{gate.nameAr}</p>
          </div>
          <Button onClick={clearGate} variant="ghost" size="icon" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Distance Info */}
        {distance !== null && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Navigation className="w-5 h-5 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Distance</div>
              <div className="font-semibold">
                {formatDistance(distance)}
                {walkingTime && ` (${formatWalkingTime(walkingTime)})`}
              </div>
            </div>
          </div>
        )}

        {/* Type Badge */}
        <div>
          <span className="text-xs text-muted-foreground">Gate Type</span>
          <div className="mt-1">
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                ${
                  gate.type === "king_fahd"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : gate.type === "umrah"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }
              `}
            >
              <MapPin className="w-3 h-3" />
              {gate.type === "king_fahd"
                ? "King Fahd Expansion"
                : gate.type === "umrah"
                  ? "Umrah Gate"
                  : "Prayer Gate"}
            </span>
          </div>
        </div>

        {/* Facilities */}
        {gate.facilities.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">Facilities</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {gate.facilities.map((facility) => (
                <span
                  key={facility}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-xs"
                >
                  {facilityIcons[facility as keyof typeof facilityIcons] || null}
                  <span className="capitalize">{facility}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Landmarks */}
        {gate.nearestLandmarks.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground">Nearby Landmarks</span>
            <ul className="mt-1 space-y-1">
              {gate.nearestLandmarks.map((landmark) => (
                <li key={landmark} className="text-sm flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {landmark}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Coordinates */}
        <div className="pt-2 border-t">
          <span className="text-xs text-muted-foreground">Coordinates</span>
          <div className="text-xs font-mono mt-1">
            {gate.location.coordinates[1].toFixed(6)}, {gate.location.coordinates[0].toFixed(6)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
