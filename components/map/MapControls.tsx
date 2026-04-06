"use client";

import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import { Plus, Minus, RotateCw, Navigation } from "lucide-react";

export function MapControls() {
  const { zoom, setZoom, setBearing, setPitch, style, setStyle } = useMapStore();

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

  const cycleStyle = () => {
    const styles: Array<"streets" | "satellite" | "dark"> = ["streets", "satellite", "dark"];
    const currentIndex = styles.indexOf(style as any);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setStyle(nextStyle);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col bg-background border rounded-lg overflow-hidden shadow-lg">
        <Button
          onClick={handleZoomIn}
          variant="ghost"
          size="icon"
          className="rounded-none border-b"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="ghost"
          size="icon"
          className="rounded-none border-b"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleReset}
          variant="ghost"
          size="icon"
          className="rounded-none border-b"
          title="Reset orientation"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button
          onClick={cycleStyle}
          variant="ghost"
          size="icon"
          className="rounded-none"
          title={`Change style (${style})`}
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
