"use client";

import { useState } from "react";
import { MapView, MapControls, GateSelector, GateInfoPanel, UserLocation } from "@/components/map";
import { RoutePanel, HotelInfoPanel } from "@/components/panels";
import { useGateProximity } from "@/lib/hooks";
import { useGateStore, useHotelStore } from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { Button } from "@/components/ui/button";
import { Hotel } from "lucide-react";
import { useHotelProximity } from "@/lib/hooks";

export default function MapPage() {
  const { nearbyGates, nearestGate, hasLocation } = useGateProximity();
  const { setGate, setGateDistance, clearGate } = useGateStore();
  const { setSelectedHotel, clearSelectedHotel } = useHotelStore();
  const [showHotels, setShowHotels] = useState(false);
  const [showHotelPanel, setShowHotelPanel] = useState(false);
  const [selectedHotel, setSelectedHotelLocal] = useState<(typeof NEARBY_HOTELS)[0] | null>(null);

  const handleGateClick = (gateId: string) => {
    const gate = HARAM_GATES.find((g) => g.id === gateId);
    const proximity = nearbyGates.find((g) => g.gate.id === gateId);

    if (gate) {
      setGate(gate);

      // Set distance and walking time from proximity data
      if (proximity) {
        setGateDistance(proximity.distance, proximity.walkingTime);
      }
    }

    // Close hotel panel when selecting a gate
    setShowHotelPanel(false);
  };

  const handleHotelClick = (hotelId: string) => {
    const hotel = NEARBY_HOTELS.find((h) => h.id === hotelId);
    if (hotel) {
      setSelectedHotel(hotel);
      setSelectedHotelLocal(hotel);
      setShowHotelPanel(true);
    }

    // Clear gate selection when selecting a hotel
    clearGate();
  };

  const handleCloseHotelPanel = () => {
    setShowHotelPanel(false);
    clearSelectedHotel();
    setSelectedHotelLocal(null);
  };

  const handleToggleHotels = () => {
    setShowHotels((prev) => !prev);
    // Also close panel when toggling off
    if (showHotels) {
      setShowHotelPanel(false);
      clearSelectedHotel();
      setSelectedHotelLocal(null);
    }
  };

  return (
    <main className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-background border-b z-10">
        <div>
          <h1 className="text-xl font-bold">TawafMap</h1>
          <p className="text-sm text-muted-foreground">Navigate Makkah & Madinah</p>
        </div>

        <div className="flex items-center gap-3">
          <UserLocation />
          <Button
            variant={showHotels ? "default" : "outline"}
            size="sm"
            onClick={handleToggleHotels}
            className="gap-2"
          >
            <Hotel className="w-4 h-4" />
            <span className="hidden sm:inline">Hotels</span>
          </Button>
          <GateSelector />
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

        {/* Map Controls - overlaid on map */}
        <div className="absolute top-4 left-4 z-10">
          <MapControls />
        </div>

        {/* Gate Info Panel */}
        <GateInfoPanel />

        {/* Hotel Info Panel */}
        {showHotelPanel && selectedHotel && (
          <HotelInfoPanel
            hotel={selectedHotel}
            onClose={handleCloseHotelPanel}
            onShowOnMap={() => {
              // Keep panel open, map already centered by MapView
            }}
          />
        )}

        {/* Route Panel */}
        <RoutePanel />

        {/* Nearby Gates Panel */}
        {hasLocation && nearestGate && !showHotelPanel && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-background/95 backdrop-blur border rounded-lg p-4 shadow-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>Nearest Gates</span>
              <span className="text-xs text-muted-foreground">(to your location)</span>
            </h3>

            <div className="space-y-2">
              {nearbyGates.map((item) => (
                <button
                  key={item.gate.id}
                  onClick={() => handleGateClick(item.gate.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.gate.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.distanceFormatted} • {item.direction} • {item.bearingFormatted}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>{item.walkingTimeFormatted}</div>
                    <div>walk</div>
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
