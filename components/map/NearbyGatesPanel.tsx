"use client";

import { MapPin } from "lucide-react";
import { useGateProximity } from "@/lib/hooks";
import { BottomSheet } from "@/components/ui/bottom-sheet";

interface NearbyGatesPanelProps {
  onGateClick: (gateId: string) => void;
}

export function NearbyGatesPanel({ onGateClick }: NearbyGatesPanelProps) {
  const { nearbyGates, hasLocation, nearestGate } = useGateProximity();

  if (!hasLocation || !nearestGate) return null;

  return (
    <>
      {/* Mobile bottom sheet */}
      <div className="md:hidden">
        <BottomSheet
          open={true}
          onOpenChange={() => {}}
          snapPoints={[0.2, 0.45]}
          defaultSnap={0}
          showBackdrop={false}
          dismissOnBackdropClick={false}
          dismissOnDragDown={false}
          showHandle={true}
        >
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <h3 className="font-semibold text-white">কাছাকাছি গেট</h3>
              <span className="text-xs text-slate-500">(আপনার লোকেশন থেকে)</span>
            </div>

            <div className="space-y-2">
              {nearbyGates.slice(0, 4).map((item) => (
                <button
                  key={item.gate.id}
                  onClick={() => onGateClick(item.gate.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.gate.type === "king_fahd"
                          ? "bg-blue-500"
                          : item.gate.type === "umrah"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                      }`}
                    />
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                        {item.gate.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.distanceFormatted} • {item.direction}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-emerald-500">
                      {item.walkingTimeFormatted}
                    </div>
                    <div className="text-[10px] text-slate-600">হেঁটে</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      </div>

      {/* Desktop floating panel */}
      <div className="hidden md:block absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-slate-900 border border-slate-700/50 rounded-2xl p-4 shadow-2xl z-[60]">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-emerald-500/20 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <h3 className="font-semibold text-white">কাছাকাছি গেট</h3>
          <span className="text-xs text-slate-500">(আপনার লোকেশন থেকে)</span>
        </div>

        <div className="space-y-2">
          {nearbyGates.slice(0, 4).map((item) => (
            <button
              key={item.gate.id}
              onClick={() => onGateClick(item.gate.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.gate.type === "king_fahd"
                      ? "bg-blue-500"
                      : item.gate.type === "umrah"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                  }`}
                />
                <div className="text-left min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                    {item.gate.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {item.distanceFormatted} • {item.direction}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-semibold text-emerald-500">
                  {item.walkingTimeFormatted}
                </div>
                <div className="text-[10px] text-slate-600">হেঁটে</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
