"use client";

import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";
import { Plus, Minus, RotateCw } from "lucide-react";

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
      <div className="flex flex-col bg-background border rounded-lg overflow-hidden shadow-lg">
        <Button
          onClick={handleZoomIn}
          variant="ghost"
          size="icon"
          className="rounded-none border-b"
          title="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleZoomOut}
          variant="ghost"
          size="icon"
          className="rounded-none border-b"
          title="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleReset}
          variant="ghost"
          size="icon"
          className="rounded-none"
          title="Reset orientation"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
