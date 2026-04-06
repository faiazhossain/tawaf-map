"use client";

import { memo } from "react";
import { MapPin } from "lucide-react";
import type { Gate as GateType } from "@/types/gate";

interface GateMarkerProps {
  gate: GateType;
  isSelected?: boolean;
  onClick?: () => void;
  showLabel?: boolean;
}

export const GateMarker = memo(function GateMarker({
  gate,
  isSelected = false,
  onClick,
  showLabel = true,
}: GateMarkerProps) {
  const typeColors = {
    king_fahd: "bg-blue-500 border-blue-600",
    umrah: "bg-green-500 border-green-600",
    salah: "bg-amber-500 border-amber-600",
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-1 cursor-pointer
        transition-all duration-200
        ${isSelected ? "scale-110" : "hover:scale-105"}
      `}
    >
      <div
        className={`
          w-8 h-8 rounded-full border-2 flex items-center justify-center
          ${typeColors[gate.type]}
          ${isSelected ? "ring-2 ring-offset-2 ring-background" : ""}
        `}
      >
        <MapPin className="w-4 h-4 text-white" />
      </div>

      {showLabel && (
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium text-foreground">{gate.name}</span>
          {isSelected && (
            <>
              <span className="text-xs text-muted-foreground">{gate.nameAr}</span>
              <div className="flex gap-1 mt-1">
                {gate.facilities.includes("wheelchair") && (
                  <span className="text-xs" title="Wheelchair accessible">
                    ♿
                  </span>
                )}
                {gate.facilities.includes("escalator") && (
                  <span className="text-xs" title="Escalator">
                    ⚡
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});
