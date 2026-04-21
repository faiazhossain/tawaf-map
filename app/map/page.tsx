"use client";

import { useState } from "react";
import {
  MapView,
  MapControls,
  GateSelector,
  UserLocation,
  NearbyGatesPanel,
  TouristPlacesList,
} from "@/components/map";
import { useGateProximity } from "@/lib/hooks";
import {
  useGateStore,
  useHotelStore,
  useRouteStore,
  usePanelStore,
  useTouristPlaceStore,
} from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { TOURIST_PLACES } from "@/lib/data/tourist-places";
import { Button } from "@/components/ui/button";
import { Hotel, MapPin, Mountain, Building2, X, DoorOpen } from "lucide-react";
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
const TouristPlaceInfoPanel = dynamic(
  () =>
    import("@/components/panels/TouristPlaceInfoPanel").then((mod) => ({
      default: mod.TouristPlaceInfoPanel,
    })),
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
  const {
    setPlace: setTouristPlace,
    clearPlace: clearTouristPlace,
    selectedPlace,
  } = useTouristPlaceStore();

  const [showGates, setShowGates] = useState(true);
  const [showHotels, setShowHotels] = useState(false);
  const [showTerrain, setShowTerrain] = useState(false);
  const [showTouristPlaces, setShowTouristPlaces] = useState(false);
  const [showTouristList, setShowTouristList] = useState(false);
  // Show all cities by default
  const [selectedTouristCity, setSelectedTouristCity] = useState<"makkah" | "madinah" | null>(null);

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
    clearTouristPlace();
    setActivePanel("hotel");
    setShowTouristList(false);
  };

  const handleTouristPlaceClick = (placeId: string) => {
    const place = TOURIST_PLACES.find((p) => p.id === placeId);
    if (place) {
      setTouristPlace(place);
    }

    clearGate();
    clearSelectedHotel();
    setActivePanel("tourist-place");
    setShowTouristList(false);
  };

  const handleToggleGates = () => {
    setShowGates((prev) => !prev);
    // When turning on gates, turn off hotels and places
    if (!showGates) {
      setShowHotels(false);
      setShowTouristPlaces(false);
    }
  };

  const handleToggleHotels = () => {
    setShowHotels((prev) => !prev);
    if (showHotels) {
      clearSelectedHotel();
      if (activePanel === "hotel") {
        setActivePanel(null);
      }
    } else {
      // When turning on hotels, turn off gates and places
      setShowGates(false);
      setShowTouristPlaces(false);
    }
  };

  const handleToggleTouristPlaces = () => {
    setShowTouristPlaces((prev) => !prev);
    setShowTouristList(false);
    if (showTouristPlaces) {
      clearTouristPlace();
      if (activePanel === "tourist-place") {
        setActivePanel(null);
      }
    } else {
      // When turning on places, turn off gates and hotels
      setShowGates(false);
      setShowHotels(false);
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

  const handleCloseTouristPlacePanel = () => {
    clearTouristPlace();
    setActivePanel(null);
  };

  const handleCloseRoutePanel = () => {
    setActivePanel(null);
  };

  const showGatePanel = activePanel === "gate";
  const showHotelPanel = activePanel === "hotel" && selectedHotel !== null;
  const showTouristPlacePanel = activePanel === "tourist-place";
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
                  : "border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:text-white text-slate-300 min-w-[4.5rem] px-3 sm:px-4"
              }
            >
              <Hotel className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {showHotels ? "On" : "Hotels"}
              </span>
            </Button>
            <Button
              variant={showTouristPlaces ? "default" : "outline"}
              size={showTouristPlaces ? "sm" : "icon"}
              onClick={handleToggleTouristPlaces}
              className={
                showTouristPlaces
                  ? "bg-purple-600 text-white border-0 shadow-lg"
                  : "border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:text-white text-slate-300 min-w-[4.5rem] px-3 sm:px-4"
              }
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {showTouristPlaces ? "Places On" : "Places"}
              </span>
            </Button>
            <Button
              variant={showTerrain ? "default" : "outline"}
              size={showTerrain ? "sm" : "icon"}
              onClick={() => setShowTerrain((prev) => !prev)}
              className={
                showTerrain
                  ? "bg-blue-600 text-white border-0 shadow-lg"
                  : "border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:text-white text-slate-300 min-w-[4.5rem] px-3 sm:px-4"
              }
            >
              <Mountain className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {showTerrain ? "On" : "Terrain"}
              </span>
            </Button>
            <Button
              variant={showGates ? "default" : "outline"}
              size={showGates ? "sm" : "icon"}
              onClick={handleToggleGates}
              className={
                showGates
                  ? "bg-orange-600 text-white border-0 shadow-lg"
                  : "border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:text-white text-slate-300 min-w-[4.5rem] px-3 sm:px-4"
              }
            >
              <DoorOpen className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {showGates ? "On" : "Gates"}
              </span>
            </Button>
            <GateSelector />
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="relative flex-1">
        <MapView
          showGates={showGates}
          showHotels={showHotels}
          showTouristPlaces={showTouristPlaces}
          touristCity={selectedTouristCity}
          showUserLocation
          showTerrain={showTerrain}
          onGateClick={handleGateClick}
          onHotelClick={handleHotelClick}
          onTouristPlaceClick={handleTouristPlaceClick}
        />

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-[40]">
          <MapControls />
        </div>

        {/* Tourist Places List */}
        {showTouristList && !hasActivePanel && (
          <div className="absolute top-4 left-4 z-[40] w-80 sm:w-96">
            <div className="relative">
              <button
                onClick={() => setShowTouristList(false)}
                className="absolute -top-2 -right-2 p-1 bg-slate-800 hover:bg-slate-700 rounded-full z-10"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <TouristPlacesList
                initialCity={selectedTouristCity ?? undefined}
                onCityChange={setSelectedTouristCity}
                onPlaceClick={(placeId) => {
                  handleTouristPlaceClick(placeId);
                  setShowTouristList(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Info Panels */}
        {showGatePanel && <GateInfoPanel onClose={handleCloseGatePanel} />}
        {showHotelPanel && selectedHotel && (
          <HotelInfoPanel hotel={selectedHotel} onClose={handleCloseHotelPanel} />
        )}
        {showTouristPlacePanel && selectedPlace.place && (
          <TouristPlaceInfoPanel
            place={selectedPlace.place}
            onClose={handleCloseTouristPlacePanel}
          />
        )}

        {/* Route Panel */}
        {showRoutePanel && <RoutePanel onClose={handleCloseRoutePanel} />}

        {/* Debug Location Panel */}
        {!hasActivePanel && <DebugLocationPanel />}

        {/* Nearby Gates Panel */}
        {hasLocation && nearestGate && !hasActivePanel && (
          <NearbyGatesPanel onGateClick={handleGateClick} />
        )}

        {/* Tourist Places Floating Button (when list is closed and places toggle is on) */}
        {!showTouristList && !hasActivePanel && showTouristPlaces && (
          <div className="absolute bottom-20 left-4 z-[40]">
            <Button
              onClick={() => {
                setShowTouristList(true);
              }}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Places</span>
              <span className="sm:hidden">Places</span>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
