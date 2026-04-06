"use client";

import { useState } from "react";
import {
  MapView,
  MapControls,
  GateSelector,
  UserLocation,
  NearbyGatesPanel,
} from "@/components/map";
import { useGateProximity } from "@/lib/hooks";
import { useGateStore, useHotelStore, useRouteStore, usePanelStore } from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { Button } from "@/components/ui/button";
import { Hotel, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    <main className="flex flex-col h-dvh bg-slate-950">
      {/* Header */}
      <header className="relative px-4 py-3 bg-slate-900 border-b border-slate-800/50 z-10">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-1.5 rounded-xl shadow-lg">
              <Image src="/icons/Tawafmap.webp" alt="TawafMap Logo" width={42} height={42} />
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
          <NearbyGatesPanel onGateClick={handleGateClick} />
        )}
      </div>
    </main>
  );
}
