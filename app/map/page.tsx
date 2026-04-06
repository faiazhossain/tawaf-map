"use client";

import { useState } from "react";
import { MapView, MapControls, GateSelector, UserLocation } from "@/components/map";
import { useGateProximity } from "@/lib/hooks";
import { useGateStore, useHotelStore, useRouteStore, usePanelStore } from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { Button } from "@/components/ui/button";
import { Hotel, MapPin } from "lucide-react";
import Link from "next/link";

// Lazy load panels to avoid render overlap
import dynamic from "next/dynamic";

const GateInfoPanel = dynamic(
  () => import("@/components/map/GateInfoPanel").then((mod) => ({ default: mod.GateInfoPanel })),
  { ssr: false }
);
const HotelInfoPanel = dynamic(
  () =>
    import("@/components/panels/HotelInfoPanel").then((mod) => ({ default: mod.HotelInfoPanel })),
  { ssr: false }
);
const RoutePanel = dynamic(
  () => import("@/components/panels/RoutePanel").then((mod) => ({ default: mod.RoutePanel })),
  { ssr: false }
);
const DebugLocationPanel = dynamic(
  () =>
    import("@/components/map/DebugLocationPanel").then((mod) => ({
      default: mod.DebugLocationPanel,
    })),
  { ssr: false }
);

function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3L6 8v12c0 0.55.45 1 1 1h2c0.55 0 1-0.45 1-1v-5h4v5c0 0.55 0.45 1 1 1h2c0.55 0 1-0.45 1-1V8l-6-5z" />
      <path d="M12 3V1" />
      <circle cx="12" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M9 20v2M15 20v2" />
    </svg>
  );
}

export default function MapPage() {
  const { nearbyGates, nearestGate, hasLocation } = useGateProximity();
  const { setGate, setGateDistance, clearGate } = useGateStore();
  const { selectedHotel, setSelectedHotel, clearSelectedHotel } = useHotelStore();
  const { activeRoute } = useRouteStore();
  const { activePanel, setActivePanel } = usePanelStore();

  const [showHotels, setShowHotels] = useState(false);

  const handleGateClick = (gateId: string) => {
    const gate = HARAM_GATES.find((g) => g.id === gateId);
    const proximity = nearbyGates.find((g) => g.gate.id === gateId);

    if (gate) {
      setGate(gate);
      if (proximity) {
        setGateDistance(proximity.distance, proximity.walkingTime);
      }
    }

    clearSelectedHotel();
    setActivePanel("gate");
  };

  const handleHotelClick = (hotelId: string) => {
    const hotel = NEARBY_HOTELS.find((h) => h.id === hotelId);
    if (hotel) {
      setSelectedHotel(hotel);
    }

    clearGate();
    setActivePanel("hotel");
  };

  const handleToggleHotels = () => {
    setShowHotels((prev) => !prev);
    if (showHotels) {
      clearSelectedHotel();
      if (activePanel === "hotel") {
        setActivePanel(null);
      }
    }
  };

  const handleCloseGatePanel = () => {
    clearGate();
    setActivePanel(null);
  };

  const handleCloseHotelPanel = () => {
    clearSelectedHotel();
    setActivePanel(null);
  };

  const handleCloseRoutePanel = () => {
    setActivePanel(null);
  };

  const showGatePanel = activePanel === "gate";
  const showHotelPanel = activePanel === "hotel" && selectedHotel !== null;
  const showRoutePanel = activePanel === "route" && activeRoute !== null;
  const hasActivePanel = activePanel !== null;

  if (activeRoute !== null && activePanel === null) {
    setActivePanel("route");
  }

  return (
    <main className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <header className="relative px-4 py-3 bg-slate-900 border-b border-slate-800/50 z-10">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-emerald-600 rounded-xl shadow-lg">
              <MosqueIcon className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white">TawafMap</h1>
              <p className="text-xs text-emerald-500">মক্কা-মদিনায় হারাবেন না</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <UserLocation />
            <Button
              variant={showHotels ? "default" : "outline"}
              size={showHotels ? "sm" : "icon"}
              onClick={handleToggleHotels}
              className={
                showHotels
                  ? "bg-emerald-600 text-white border-0 shadow-lg"
                  : "border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300"
              }
            >
              <Hotel className="w-4 h-4" />
              <span className="hidden sm:inline">{showHotels ? "Hotels On" : "Hotels"}</span>
            </Button>
            <GateSelector />
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="relative flex-1">
        <MapView
          showGates
          showHotels={showHotels}
          showUserLocation
          onGateClick={handleGateClick}
          onHotelClick={handleHotelClick}
        />

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-[40]">
          <MapControls />
        </div>

        {/* Info Panels */}
        {showGatePanel && <GateInfoPanel onClose={handleCloseGatePanel} />}
        {showHotelPanel && selectedHotel && (
          <HotelInfoPanel hotel={selectedHotel} onClose={handleCloseHotelPanel} />
        )}

        {/* Route Panel */}
        {showRoutePanel && <RoutePanel onClose={handleCloseRoutePanel} />}

        {/* Debug Location Panel */}
        {!hasActivePanel && <DebugLocationPanel />}

        {/* Nearby Gates Panel */}
        {hasLocation && nearestGate && !hasActivePanel && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-2xl z-[60]">
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
                  onClick={() => handleGateClick(item.gate.id)}
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
        )}
      </div>
    </main>
  );
}
