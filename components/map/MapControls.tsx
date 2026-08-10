"use client";

import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import { useMapInstance } from "@/lib/map/MapInstanceContext";
import { Plus, Minus, Compass } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Map zoom / compass controls wired to the live MapLibre instance via context.
 *
 * Previously these buttons mutated the store but nothing pushed store values
 * back to the map, so the buttons were no-ops. The store stays in sync because
 * MapView's own `move`/`zoom` handlers write the live map state back into the
 * store — so we read `zoom` only for the indicator label, and drive the map
 * directly for actions.
 */
export function MapControls() {
  const map = useMapInstance();
  const zoom = useMapStore((state) => state.zoom);
  // Local indicator so taps feel responsive even before the map emits zoom.
  const [displayZoom, setDisplayZoom] = useState(zoom);

  useEffect(() => {
    setDisplayZoom(zoom);
  }, [zoom]);

  const handleZoomIn = () => {
    if (!map) return;
    const target = Math.min((map.getZoom() ?? zoom) + 1, 20);
    map.zoomTo(target, { duration: 250 });
    setDisplayZoom(target);
  };

  const handleZoomOut = () => {
    if (!map) return;
    const target = Math.max((map.getZoom() ?? zoom) - 1, 6);
    map.zoomTo(target, { duration: 250 });
    setDisplayZoom(target);
  };

  const handleReset = () => {
    if (!map) return;
    map.resetNorth({ duration: 300 });
    map.setPitch(0, { duration: 300 });
  };

  // Until the map instance exists, controls can't do anything — render inert
  // so the layout is stable during load.
  const disabled = !map;

  return (
    <div className="flex flex-col gap-2">
      {/* Compass / Reset */}
      <Button
        onClick={handleReset}
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label="উত্তর দিকে ঘোরান"
        className="h-11 w-11 bg-surface/90 backdrop-blur-xl border border-border/50 text-foreground hover:bg-muted hover:border-primary/30 hover:text-primary transition-all shadow-xl rounded-xl"
      >
        <Compass className="w-5 h-5" />
      </Button>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-surface/90 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-xl">
        <Button
          onClick={handleZoomIn}
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="জুম ইন"
          className="h-11 w-11 rounded-none border-b border-border/50 text-foreground hover:bg-primary/20 hover:text-primary transition-all"
        >
          <Plus className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="জুম আউট"
          className="h-11 w-11 rounded-none text-foreground hover:bg-primary/20 hover:text-primary transition-all"
        >
          <Minus className="w-5 h-5" />
        </Button>
      </div>

      {/* Zoom Level Indicator */}
      <div
        className="bg-surface/90 backdrop-blur-xl border border-border/50 rounded-xl px-3 py-1.5 text-center shadow-xl"
        aria-hidden="true"
      >
        <span className="text-xs font-medium text-primary">{Math.round(displayZoom)}z</span>
      </div>
    </div>
  );
}
