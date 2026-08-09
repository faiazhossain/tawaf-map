"use client";

import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import { Plus, Minus, RotateCw, Compass } from "lucide-react";

export function MapControls() {
  const { zoom, setZoom, setBearing, setPitch } = useMapStore();

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 1, 20));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 1, 12));
  };

  const handleReset = () => {
    setBearing(0);
    setPitch(0);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Compass / Reset */}
      <Button
        onClick={handleReset}
        variant="ghost"
        size="icon"
        className="h-10 w-10 bg-surface/90 backdrop-blur-xl border border-border/50 text-foreground hover:bg-muted hover:border-primary/30 hover:text-primary transition-all shadow-xl rounded-xl"
        title="উত্তর দিকে ঘোরান"
      >
        <Compass className="w-5 h-5" />
      </Button>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-surface/90 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-xl">
        <Button
          onClick={handleZoomIn}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-none border-b border-border/50 text-foreground hover:bg-primary/20 hover:text-primary transition-all"
          title="জুম ইন"
        >
          <Plus className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-none text-foreground hover:bg-primary/20 hover:text-primary transition-all"
          title="জুম আউট"
        >
          <Minus className="w-5 h-5" />
        </Button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="bg-surface/90 backdrop-blur-xl border border-border/50 rounded-xl px-3 py-1.5 text-center shadow-xl">
        <span className="text-xs font-medium text-primary">{Math.round(zoom)}z</span>
      </div>
    </div>
  );
}
