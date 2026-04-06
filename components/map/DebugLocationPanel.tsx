"use client";

import { useState } from "react";
import { MapPin, ChevronDown, ChevronUp, Crosshair, Trash2 } from "lucide-react";
import { useLocationStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";

// Popular test locations in Makkah
const TEST_LOCATIONS = [
  { name: "হারাম (কাবা)", nameAr: "الحرم المكي", lat: 21.4225, lng: 39.8262, icon: "kaaba" },
  { name: "রয়েল টাওয়ার", nameAr: "برج الساعة الملكي", lat: 21.4219, lng: 39.8253, icon: "clock" },
  { name: "সাফা-মারওয়া", nameAr: "الصفا والمروة", lat: 21.4235, lng: 39.8242, icon: "safa" },
  { name: "আবরাজ আল-বাইত", nameAr: "أبراج البيت", lat: 21.422, lng: 39.825, icon: "building" },
];

function TestLocationContent({
  latitude,
  longitude,
  customLat,
  customLng,
  setCustomLat,
  setCustomLng,
  onSetLocation,
  onSetCustomLocation,
  onClearLocation,
}: {
  latitude: number | null;
  longitude: number | null;
  customLat: string;
  customLng: string;
  setCustomLat: (val: string) => void;
  setCustomLng: (val: string) => void;
  onSetLocation: (lat: number, lng: number) => void;
  onSetCustomLocation: () => void;
  onClearLocation: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Current Location Display */}
      {latitude !== null && longitude !== null && (
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Crosshair className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">বর্তমান পজিশন</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">ল্যাট: </span>
              <span className="font-mono text-white">{latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-slate-500">লং: </span>
              <span className="font-mono text-white">{longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Preset locations */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">দ্রুত সেট (মক্কা)</p>
        <div className="space-y-1.5">
          {TEST_LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => onSetLocation(loc.lat, loc.lng)}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-800/50 hover:bg-emerald-500/10 border border-slate-700/50 hover:border-emerald-500/30 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-slate-900 rounded-lg">
                  <MapPin className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div>
                  <span className="text-sm font-medium text-white block group-hover:text-emerald-400 transition-colors">
                    {loc.name}
                  </span>
                  <span className="text-[10px] text-slate-600 block" dir="rtl">
                    {loc.nameAr}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom coordinates */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">কাস্টম কোঅর্ডিনেট</p>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.0001"
              min="-90"
              max="90"
              placeholder="ল্যাটিটিউড"
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-700 bg-slate-900 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
            />
            <input
              type="number"
              step="0.0001"
              min="-180"
              max="180"
              placeholder="লংগিটিউড"
              value={customLng}
              onChange={(e) => setCustomLng(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-700 bg-slate-900 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
            />
          </div>
          <Button
            onClick={onSetCustomLocation}
            size="sm"
            className="w-full gap-1.5 bg-slate-800 hover:bg-slate-700 text-white border-0"
          >
            <Crosshair className="w-3.5 h-3.5" />
            কাস্টম লোকেশন সেট করুন
          </Button>
        </div>
      </div>

      {/* Clear location */}
      <Button
        onClick={onClearLocation}
        size="sm"
        variant="outline"
        className="w-full gap-1.5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
      >
        <Trash2 className="w-3.5 h-3.5" />
        লোকেশন মুছুন
      </Button>
    </div>
  );
}

export function DebugLocationPanel() {
  const { latitude, longitude, setLocation, clearLocation } = useLocationStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [customLat, setCustomLat] = useState("21.4225");
  const [customLng, setCustomLng] = useState("39.8262");

  const handleSetLocation = (lat: number, lng: number) => {
    setLocation(lat, lng, 15);
    setIsExpanded(false);
  };

  const handleSetCustomLocation = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      setLocation(lat, lng, 15);
      setIsExpanded(false);
    }
  };

  const handleClearLocation = () => {
    clearLocation();
    setIsExpanded(false);
  };

  // Mobile bottom sheet
  const mobileContent = (
    <>
      <BottomSheet
        open={isExpanded}
        onOpenChange={setIsExpanded}
        snapPoints={[0.5, 0.85]}
        defaultSnap={0}
        showBackdrop={false}
      >
        <BottomSheet.Header>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-white block">টেস্ট লোকেশন</span>
              <span className="text-xs text-slate-500 block">
                {latitude !== null && longitude !== null
                  ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                  : "সেট করা নেই"}
              </span>
            </div>
          </div>
          <BottomSheet.CloseButton />
        </BottomSheet.Header>
        <div className="px-4 pb-4">
          <TestLocationContent
            latitude={latitude}
            longitude={longitude}
            customLat={customLat}
            customLng={customLng}
            setCustomLat={setCustomLat}
            setCustomLng={setCustomLng}
            onSetLocation={handleSetLocation}
            onSetCustomLocation={handleSetCustomLocation}
            onClearLocation={handleClearLocation}
          />
        </div>
      </BottomSheet>

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsExpanded(true)}
        className="sm:hidden absolute bottom-4 right-4 z-[50] p-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg transition-colors"
        aria-label="Open test location"
      >
        <MapPin className="w-5 h-5 text-white" />
      </button>
    </>
  );

  // Desktop floating panel
  const desktopContent = (
    <div className="hidden sm:block absolute bottom-4 right-4 z-[50] w-72">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-white block">টেস্ট লোকেশন</span>
              <span className="text-xs text-slate-500 block">
                {latitude !== null && longitude !== null
                  ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                  : "সেট করা নেই"}
              </span>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-800">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-slate-700/50 p-4">
            <TestLocationContent
              latitude={latitude}
              longitude={longitude}
              customLat={customLat}
              customLng={customLng}
              setCustomLat={setCustomLat}
              setCustomLng={setCustomLng}
              onSetLocation={handleSetLocation}
              onSetCustomLocation={handleSetCustomLocation}
              onClearLocation={handleClearLocation}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {mobileContent}
      {desktopContent}
    </>
  );
}
