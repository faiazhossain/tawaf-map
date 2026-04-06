"use client";

import { useState } from "react";
import { useGateStore, useLocationStore, usePanelStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, X, Accessibility, Droplet, Zap } from "lucide-react";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";
import { useMapRouting } from "@/lib/hooks";
import { BottomSheet } from "@/components/ui/bottom-sheet";

interface GateInfoPanelProps {
  onClose?: () => void;
}

const facilityIcons = {
  restroom: <Droplet className="w-3.5 h-3.5" />,
  escalator: <Zap className="w-3.5 h-3.5" />,
  elevator: <Accessibility className="w-3.5 h-3.5" />,
  wheelchair: <Accessibility className="w-3.5 h-3.5" />,
};

const facilityLabels = {
  restroom: "টয়লেট",
  escalator: "এসকেলেটর",
  elevator: "লিফট",
  wheelchair: "হুইলচেয়ার",
};

const typeConfigs = {
  king_fahd: {
    color: "blue",
    label: "কিং ফাহ্দ এক্সপানশন",
    bg: "bg-blue-600",
    bgLight: "bg-blue-500/10",
    borderLight: "border-blue-500/20",
    textLight: "text-blue-400",
  },
  umrah: {
    color: "emerald",
    label: "ওমরাহ গেট",
    bg: "bg-emerald-600",
    bgLight: "bg-emerald-500/10",
    borderLight: "border-emerald-500/20",
    textLight: "text-emerald-400",
  },
  salah: {
    color: "amber",
    label: "নামাজ গেট",
    bg: "bg-amber-600",
    bgLight: "bg-amber-500/10",
    borderLight: "border-amber-500/20",
    textLight: "text-amber-400",
  },
};

function GateInfoContent({
  gate,
  distance,
  walkingTime,
  config,
  isCalculating,
  isRouting,
  onGetDirections,
  hasLocation,
}: {
  gate: {
    name: string;
    nameAr: string;
    type: "king_fahd" | "umrah" | "salah";
    facilities: string[];
    nearestLandmarks: string[];
    location: { coordinates: [number, number] };
  };
  distance: number | null;
  walkingTime: number | null;
  config: (typeof typeConfigs)[keyof typeof typeConfigs];
  isCalculating: boolean;
  isRouting: boolean;
  onGetDirections: () => void;
  hasLocation: boolean;
}) {
  return (
    <>
      {/* Header */}
      <div
        className={`${config.bg} px-4 py-4 flex items-start justify-between -mx-4 sm:mx-0 rounded-t-3xl`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{gate.name}</h3>
            <p className="text-xs text-white/80" dir="rtl">
              {gate.nameAr}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 -mx-4 sm:mx-0 sm:px-0 sm:py-0">
        {/* Distance Card */}
        {distance !== null && (
          <div className={`p-4 ${config.bgLight} ${config.borderLight} border rounded-xl`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">দূরত্ব</p>
                <p className={`text-xl font-bold ${config.textLight}`}>
                  {formatDistance(distance)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-1">হেঁটে যাওয়ার সময়</p>
                <p className={`text-xl font-bold ${config.textLight}`}>
                  {walkingTime ? formatWalkingTime(walkingTime) : "--"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Type Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.bgLight} ${config.borderLight} border rounded-full`}
        >
          <div className={`w-2 h-2 rounded-full bg-${config.color}-500`} />
          <span className={`text-xs font-medium ${config.textLight}`}>{config.label}</span>
        </div>

        {/* Facilities */}
        {gate.facilities.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">সুবিধা সমূহ</p>
            <div className="flex flex-wrap gap-2">
              {gate.facilities.map((facility) => (
                <span
                  key={facility}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300"
                >
                  {facilityIcons[facility as keyof typeof facilityIcons]}
                  <span>{facilityLabels[facility as keyof typeof facilityLabels] || facility}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Landmarks */}
        {gate.nearestLandmarks.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">কাছাকাছি জায়গা</p>
            <div className="space-y-1.5">
              {gate.nearestLandmarks.map((landmark) => (
                <div key={landmark} className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {landmark}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coordinates */}
        <div className={`p-3 ${config.bgLight} ${config.borderLight} border rounded-xl`}>
          <p className="text-[10px] text-slate-500 mb-1">কোঅর্ডিনেট</p>
          <p className="text-xs font-mono text-slate-400">
            {gate.location.coordinates[1].toFixed(6)}, {gate.location.coordinates[0].toFixed(6)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 -mx-4 mt-auto sm:mx-0">
        <Button
          onClick={onGetDirections}
          disabled={!hasLocation || isCalculating || isRouting}
          className={`w-full gap-2 ${config.bg} hover:opacity-90 text-white border-0 shadow-lg`}
        >
          {isCalculating || isRouting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              রুট বের করা হচ্ছে...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              দিক নির্দেশনা দেখুন
            </>
          )}
        </Button>
        {!hasLocation && (
          <p className="text-xs text-slate-600 text-center mt-2">
            লোকেশন চালু করুন দিক নির্দেশনা পেতে
          </p>
        )}
      </div>
    </>
  );
}

export function GateInfoPanel({ onClose }: GateInfoPanelProps) {
  const { selectedGate, clearGate } = useGateStore();
  const { latitude, longitude } = useLocationStore();
  const { calculateRoute, isCalculating } = useMapRouting();
  const { activePanel, setActivePanel } = usePanelStore();
  const [isRouting, setIsRouting] = useState(false);

  const gate = selectedGate.gate;
  const distance = selectedGate.distance;
  const walkingTime = selectedGate.walkingTime;

  const handleClose = () => {
    clearGate();
    setActivePanel(null);
    onClose?.();
  };

  const handleGetDirections = async () => {
    if (!gate || latitude === null || longitude === null) return;
    setIsRouting(true);
    await calculateRoute(gate.location.coordinates);
    setIsRouting(false);
  };

  if (!gate) return null;

  const hasLocation = latitude !== null && longitude !== null;
  const config = typeConfigs[gate.type];

  // Mobile bottom sheet
  const mobileContent = (
    <BottomSheet
      open={activePanel === "gate"}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      snapPoints={[0.35, 0.65, 0.9]}
      defaultSnap={1}
      showBackdrop={false}
      className="max-h-[90dvh]"
    >
      <BottomSheet.Header>
        <div className="flex-1" />
        <BottomSheet.CloseButton />
      </BottomSheet.Header>
      <div className="px-4">
        <GateInfoContent
          gate={gate}
          distance={distance}
          walkingTime={walkingTime}
          config={config}
          isCalculating={isCalculating}
          isRouting={isRouting}
          onGetDirections={handleGetDirections}
          hasLocation={hasLocation}
        />
      </div>
    </BottomSheet>
  );

  // Desktop floating panel
  const desktopContent = (
    <div className="absolute top-4 right-4 z-[100] w-80 max-h-[calc(100vh-2rem)] overflow-hidden">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`${config.bg} px-4 py-3`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">{gate.name}</h3>
                <p className="text-xs text-white/80" dir="rtl">
                  {gate.nameAr}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Distance Card */}
          {distance !== null && (
            <div className={`p-4 ${config.bgLight} ${config.borderLight} border rounded-xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">দূরত্ব</p>
                  <p className={`text-xl font-bold ${config.textLight}`}>
                    {formatDistance(distance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">হেঁটে যাওয়ার সময়</p>
                  <p className={`text-xl font-bold ${config.textLight}`}>
                    {walkingTime ? formatWalkingTime(walkingTime) : "--"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Type Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.bgLight} ${config.borderLight} border rounded-full`}
          >
            <div className={`w-2 h-2 rounded-full bg-${config.color}-500`} />
            <span className={`text-xs font-medium ${config.textLight}`}>{config.label}</span>
          </div>

          {/* Facilities */}
          {gate.facilities.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">সুবিধা সমূহ</p>
              <div className="flex flex-wrap gap-2">
                {gate.facilities.map((facility) => (
                  <span
                    key={facility}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300"
                  >
                    {facilityIcons[facility as keyof typeof facilityIcons]}
                    <span>
                      {facilityLabels[facility as keyof typeof facilityLabels] || facility}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Landmarks */}
          {gate.nearestLandmarks.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">কাছাকাছি জায়গা</p>
              <div className="space-y-1.5">
                {gate.nearestLandmarks.map((landmark) => (
                  <div key={landmark} className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {landmark}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coordinates */}
          <div className={`p-3 ${config.bgLight} ${config.borderLight} border rounded-xl`}>
            <p className="text-[10px] text-slate-500 mb-1">কোঅর্ডিনেট</p>
            <p className="text-xs font-mono text-slate-400">
              {gate.location.coordinates[1].toFixed(6)}, {gate.location.coordinates[0].toFixed(6)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <Button
            onClick={handleGetDirections}
            disabled={!hasLocation || isCalculating || isRouting}
            className={`w-full gap-2 ${config.bg} hover:opacity-90 text-white border-0 shadow-lg`}
          >
            {isCalculating || isRouting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                রুট বের করা হচ্ছে...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                দিক নির্দেশনা দেখুন
              </>
            )}
          </Button>
          {!hasLocation && (
            <p className="text-xs text-slate-600 text-center mt-2">
              লোকেশন চালু করুন দিক নির্দেশনা পেতে
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileContent}
      <div className="hidden md:block">{desktopContent}</div>
    </>
  );
}
