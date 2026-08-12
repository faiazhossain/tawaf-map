"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MapView,
  MapControls,
  GateSelector,
  UserLocation,
  NearbyGatesPanel,
  TouristPlacesList,
} from "@/components/map";
import { UmrahOnboarding, UmrahStepList, MiqatOverviewPanel } from "@/components/umrah";
import { BetaBadge } from "@/components/ui/beta-badge";
import { useGateProximity } from "@/lib/hooks";
import {
  useGateStore,
  useHotelStore,
  useRouteStore,
  usePanelStore,
  useTouristPlaceStore,
  useUmrahGuideStore,
} from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { TOURIST_PLACES } from "@/lib/data/tourist-places";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Hotel, MapPin, Mountain, Building2, Box, X, DoorOpen, Moon } from "lucide-react";
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
  const umrahOnboarded = useUmrahGuideStore((s) => s.onboarded);

  const [showGates, setShowGates] = useState(false);
  const [showHotels, setShowHotels] = useState(false);
  const [showTerrain, setShowTerrain] = useState(false);
  const [show3DModel, setShow3DModel] = useState(false);
  const [showTouristPlaces, setShowTouristPlaces] = useState(false);
  const [showTouristList, setShowTouristList] = useState(false);
  const [showUmrahOnboarding, setShowUmrahOnboarding] = useState(false);
  const [showUmrahGuide, setShowUmrahGuide] = useState(false);
  const [showMiqatOverview, setShowMiqatOverview] = useState(false);
  // Show all cities by default
  const [selectedTouristCity, setSelectedTouristCity] = useState<"makkah" | "madinah" | null>(null);

  // ওমরাহ গাইড বোতাম: অনবোর্ডিং না থাকলে উইজার্ড, থাকলে ধাপ-তালিকা
  const handleToggleUmrah = () => {
    if (!umrahOnboarded) {
      setShowUmrahOnboarding(true);
    } else {
      setShowUmrahGuide((prev) => !prev);
    }
  };

  // মিকাত সারসংক্ষেপ মানচিত্র খোলা/বন্ধ (স্টোর মোড সিঙ্ক্রোনাইজ; ধাপ-তালিকার সাথে পরস্পরবিরোধী)
  const handleOpenMiqatOverview = () => {
    setShowUmrahGuide(false);
    setShowMiqatOverview(true);
    useUmrahGuideStore.getState().setMode("miqat-overview");
  };
  const handleMiqatOverviewChange = (open: boolean) => {
    setShowMiqatOverview(open);
    if (!open) setShowUmrahGuide(true); // গাইডে ফেরা
    useUmrahGuideStore.getState().setMode(open ? "miqat-overview" : "guide");
  };

  // ওমরাহ গাইড ডিফল্টে চালু: অনবোর্ডেড ব্যবহারকারীর জন্য অ্যাপের মূল ফিচারটি
  // সরাসরি দৃশ্যমান রাখা। মাউন্টের পরে স্টোর হাইড্রেশন শেষ হয়েছে, তাই সঠিক মান পাওয়া যায়।
  useEffect(() => {
    if (useUmrahGuideStore.getState().onboarded) {
      setShowUmrahGuide(true);
    }
  }, []);

  // nearbyGates রেফ ধরে রাখা হয়েছে যাতে হ্যান্ডলার useCallback-এ স্থিতিশীল থাকে।
  // এতে লোকেশন আপডেটে পেইজ রি-রেন্ডার হলেও MapView-এর effect পুনরায় না চলে —
  // ফলে ট্যাব পরিবর্তনের পর গাইড ক্যামেরা জুম (যেমন তওয়াফে ১৮) অপরিবর্তিত থাকে।
  const nearbyGatesRef = useRef(nearbyGates);
  nearbyGatesRef.current = nearbyGates;

  const handleGateClick = useCallback(
    (gateId: string) => {
      const gate = HARAM_GATES.find((g) => g.id === gateId);
      const proximity = nearbyGatesRef.current.find((g) => g.gate.id === gateId);

      if (gate) {
        setGate(gate);
        if (proximity) {
          setGateDistance(proximity.distance, proximity.walkingTime);
        }
      }

      clearSelectedHotel();
      setActivePanel("gate");
    },
    [setGate, setGateDistance, clearSelectedHotel, setActivePanel]
  );

  const handleHotelClick = useCallback(
    (hotelId: string) => {
      const hotel = NEARBY_HOTELS.find((h) => h.id === hotelId);
      if (hotel) {
        setSelectedHotel(hotel);
      }

      clearGate();
      clearTouristPlace();
      setActivePanel("hotel");
      setShowTouristList(false);
    },
    [setSelectedHotel, clearGate, clearTouristPlace, setActivePanel]
  );

  const handleTouristPlaceClick = useCallback(
    (placeId: string) => {
      const place = TOURIST_PLACES.find((p) => p.id === placeId);
      if (place) {
        setTouristPlace(place);
      }

      clearGate();
      clearSelectedHotel();
      setActivePanel("tourist-place");
      setShowTouristList(false);
    },
    [setTouristPlace, clearGate, clearSelectedHotel, setActivePanel]
  );

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
    <main className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="relative px-4 py-3 bg-surface border-b border-border z-10">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-1.5 rounded-xl shadow-lg">
              <Image src="/icons/Tawafmap.webp" alt="TawafMap Logo" width={42} height={42} />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">TawafMap</h1>
                <BetaBadge />
              </div>
              <p className="text-xs text-primary">মক্কা-মদিনায় হারাবেন না</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <UserLocation />
            <Button
              variant={showUmrahGuide ? "default" : "outline"}
              size={showUmrahGuide ? "sm" : "icon"}
              onClick={handleToggleUmrah}
              className={
                showUmrahGuide || showUmrahOnboarding
                  ? "bg-primary text-primary-foreground border-0 shadow-lg shadow-primary/30 ring-2 ring-primary/25"
                  : "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary hover:text-primary min-w-[4.5rem] px-3 sm:px-4 shadow-sm"
              }
            >
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {umrahOnboarded ? (showUmrahGuide ? "চলছে" : "ওমরাহ") : "ওমরাহ গাইড"}
              </span>
            </Button>
            <Button
              variant={showHotels ? "default" : "outline"}
              size={showHotels ? "sm" : "icon"}
              onClick={handleToggleHotels}
              className={
                showHotels
                  ? "bg-primary text-primary-foreground border-0 shadow-lg"
                  : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground min-w-[4.5rem] px-3 sm:px-4"
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
                  ? "bg-primary text-primary-foreground border-0 shadow-lg"
                  : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground min-w-[4.5rem] px-3 sm:px-4"
              }
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {showTouristPlaces ? "Historical On" : "Historical"}
              </span>
            </Button>
            <Button
              variant={showTerrain ? "default" : "outline"}
              size={showTerrain ? "sm" : "icon"}
              onClick={() => setShowTerrain((prev) => !prev)}
              className={
                showTerrain
                  ? "bg-primary text-primary-foreground border-0 shadow-lg"
                  : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground min-w-[4.5rem] px-3 sm:px-4"
              }
            >
              <Mountain className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {showTerrain ? "On" : "Terrain"}
              </span>
            </Button>
            <Button
              variant={show3DModel ? "default" : "outline"}
              size={show3DModel ? "sm" : "icon"}
              onClick={() => setShow3DModel((prev) => !prev)}
              className={
                show3DModel
                  ? "bg-primary text-primary-foreground border-0 shadow-lg"
                  : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground min-w-[4.5rem] px-3 sm:px-4"
              }
              title="৩ডি মডেল"
            >
              <Box className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {show3DModel ? "On" : "3D"}
              </span>
            </Button>
            <Button
              variant={showGates ? "default" : "outline"}
              size={showGates ? "sm" : "icon"}
              onClick={handleToggleGates}
              className={
                showGates
                  ? "bg-primary text-primary-foreground border-0 shadow-lg"
                  : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground min-w-[4.5rem] px-3 sm:px-4"
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
          show3DModel={show3DModel}
          showUmrah={umrahOnboarded && showUmrahGuide}
          showMiqatOverview={umrahOnboarded && showMiqatOverview}
          onGateClick={handleGateClick}
          onHotelClick={handleHotelClick}
          onTouristPlaceClick={handleTouristPlaceClick}
          onUmrahStepClick={(stepId) => useUmrahGuideStore.getState().goToStepId(stepId)}
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
                className="absolute -top-2 -right-2 p-1 bg-muted hover:bg-muted-foreground/20 rounded-full z-10"
              >
                <X className="w-4 h-4 text-foreground" />
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
              className="bg-primary hover:bg-primary-hover text-primary-foreground border-0 shadow-lg flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Historical</span>
              <span className="sm:hidden">Historical</span>
            </Button>
          </div>
        )}

        {/* ওমরাহ গাইড - অনবোর্ডিং উইজার্ড */}
        {showUmrahOnboarding && (
          <UmrahOnboarding
            onClose={() => {
              setShowUmrahOnboarding(false);
              if (useUmrahGuideStore.getState().onboarded) {
                setShowUmrahGuide(true);
              }
            }}
          />
        )}

        {/* ওমরাহ গাইড - ধাপ-তালিকা প্যানেল */}
        {umrahOnboarded && (
          <UmrahStepList
            open={showUmrahGuide}
            onOpenChange={setShowUmrahGuide}
            onOpenMiqatOverview={handleOpenMiqatOverview}
          />
        )}

        {/* ওমরাহ গাইড - মিকাত সারসংক্ষেপ প্যানেল */}
        {umrahOnboarded && (
          <MiqatOverviewPanel open={showMiqatOverview} onOpenChange={handleMiqatOverviewChange} />
        )}
      </div>
    </main>
  );
}
