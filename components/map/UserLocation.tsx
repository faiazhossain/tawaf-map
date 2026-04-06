"use client";

import { useGeolocation } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Navigation, NavigationOff } from "lucide-react";

interface UserLocationProps {
  onRequestLocation?: () => void;
}

export function UserLocation({ onRequestLocation }: UserLocationProps) {
  const { latitude, longitude, accuracy, error, loading, permission, requestLocation } =
    useGeolocation();

  const handleRequestLocation = () => {
    if (onRequestLocation) {
      onRequestLocation();
    } else {
      requestLocation();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-background border rounded-lg">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Getting location...</span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg">
        <NavigationOff className="w-4 h-4 text-destructive" />
        <span className="text-sm text-destructive">Location access denied</span>
      </div>
    );
  }

  if (error && !latitude) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
        <NavigationOff className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{error}</span>
      </div>
    );
  }

  if (latitude && longitude) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
        <Navigation className="w-4 h-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Your location</span>
          <span className="text-sm font-medium">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
          {accuracy && (
            <span className="text-xs text-muted-foreground">
              Accuracy: ±{Math.round(accuracy)}m
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Button onClick={handleRequestLocation} variant="outline" size="sm">
      <Navigation className="w-4 h-4 mr-2" />
      Enable Location
    </Button>
  );
}
