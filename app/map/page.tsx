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
import { GpsSimBadge } from "@/components/dev/GpsSimBadge";
import { isDemoWorldActive } from "@/lib/dev/demo-world";
import { BetaBadge } from "@/components/ui/beta-badge";
import { useGateProximity, useMediaQuery } from "@/lib/hooks";
import {
  useGateStore,
  useHotelStore,
  useRouteStore,
  usePanelStore,
  useTouristPlaceStore,
  useUmrahGuideStore,
} from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { INTENT_PRELOAD_MODEL_URLS } from "@/lib/map/model-config";
import { fetchModelBytes } from "@/lib/map/model-manager";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { TOURIST_PLACES } from "@/lib/data/tourist-places";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import {
  Hotel,
  Mountain,
  Building2,
  Box,
  X,
  DoorOpen,
  Moon,
  Menu,
  type LucideIcon,
} from "lucide-react";
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

// মোবাইল হ্যামবার্গার মেনুর টগল-সারি: আইকন + বাংলা লেবেল বামে, সুইচ ডানে।
// সুইচের রঙ primary থিম অনুসরণ করে; বোতামটি aria-pressed-এ অবস্থা জানায়।
function MenuToggleRow({
  label,
  icon: Icon,
  checked,
  onChange,
  onIntent,
}: {
  label: string;
  icon: LucideIcon;
  checked: boolean;
  onChange: () => void;
  onIntent?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onChange}
      onPointerEnter={onIntent}
      onTouchStart={onIntent}
      onFocus={onIntent}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-left transition-colors hover:bg-muted active:bg-muted"
    >
      <span className="flex items-center gap-2.5">
        <Icon
          className={cn("h-[18px] w-[18px]", checked ? "text-primary" : "text-muted-foreground")}
          aria-hidden
        />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full border px-[2px] transition-colors",
          checked ? "justify-end border-primary bg-primary" : "justify-start border-border bg-muted"
        )}
      >
        <span className="block h-4 w-4 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

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

  // "3D" বাটনে আঙুল/মাউস/ফোকাস পড়ামাত্রই মডেল ডাউনলোড শুরু (intent preload)।
  // ক্লিকের ১-২ সেকেন্ড আগের এই হেড-স্টার্টই 3D চালু করার অপেক্ষা প্রায় মুছে
  // দেয়; ক্যাশে থাকলে কিছুই নামে না। ব্যর্থতা নীরব — ক্লিকে আবার চেষ্টা হবে।
  const handle3DIntent = useCallback(() => {
    for (const url of INTENT_PRELOAD_MODEL_URLS) {
      void fetchModelBytes(url).catch(() => {});
    }
  }, []);

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
  // ডেমো ওয়ার্ল্ড মোডে গাইড স্বয়ংক্রিয় খোলা হয় না — গাইড ক্যামেরা মক্কায় ফ্লাই করে,
  // যা ঢাকার ডেমো এরিনা পরীক্ষার অভিজ্ঞতা নষ্ট করত।
  useEffect(() => {
    if (useUmrahGuideStore.getState().onboarded && !isDemoWorldActive()) {
      setShowUmrahGuide(true);
    }
  }, []);

  // ডেমো ওয়ার্ল্ড মোড মাউন্টের পরে জানা যায় (SSR-এ সবসময় false) — hydration
  // mismatch এড়াতে state ব্যবহার। 3D মডেল মক্কার কোঅর্ডিনেটে পিন করা, তাই
  // ডেমো মোডে বোতামটি লুকানো।
  const [demoWorldActive, setDemoWorldActive] = useState(false);
  useEffect(() => {
    setDemoWorldActive(isDemoWorldActive());
  }, []);

  // nearbyGates রেফ ধরে রাখা হয়েছে যাতে হ্যান্ডলার useCallback-এ স্থিতিশীল থাকে।
  // এতে লোকেশন আপডেটে পেইজ রি-রেন্ডার হলেও MapView-এর effect পুনরায় না চলে —
  // ফলে ট্যাব পরিবর্তনের পর গাইড ক্যামেরা জুম (যেমন তওয়াফে ১৮) অপরিবর্তিত থাকে।
  const nearbyGatesRef = useRef(nearbyGates);
  nearbyGatesRef.current = nearbyGates;

  // মোবাইল হেডার: লোগো বামে, ডানে শুধু ওমরাহ + মোড + হ্যামবার্গার; বাকি সব
  // টুলবার আইটেম হ্যামবার্গার মেনুর ভেতরে। ডেস্কটপে (>=sm) আগের মতো অনুভূমিক
  // টুলবার। শর্তভিত্তিক রেন্ডার ব্যবহার করা হয়েছে যাতে UserLocation-এর মতো
  // stateful আইটেম দুইবার মাউন্ট না হয় (ডুপ্লিকেট GPS সাবস্ক্রিপশন এড়াতে)।
  // SSR/হাইড্রেশন ম্যাচ রাখতে হুক প্রথম রেন্ডারে false দেয়, তাই সার্ভার ও
  // প্রথম ক্লায়েন্ট রেন্ডার মোবাইল লেআউট দেখায়।
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [toolbarMenuOpen, setToolbarMenuOpen] = useState(false);

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

  // হেডারের শেয়ার্ড আইটেম — ডেস্কটপ টুলবার ও মোবাইল ক্লাস্টার/মেনু একই JSX
  // ব্যবহার করে। isDesktop শর্তে যেকোনো সময় একটিই লেআউট রেন্ডার হয়, তাই প্রতিটি
  // আইটেম একবারই মাউন্ট হয়। লেয়ার টগলগুলো আলাদা: ডেস্কটপে Button, মোবাইল
  // মেনুতে MenuToggleRow।
  const themeToggle = <ThemeToggle />;
  const userLocationItem = <UserLocation />;
  const umrahButton = (
    <Button
      variant={showUmrahGuide ? "default" : "outline"}
      size={showUmrahGuide ? "sm" : "icon"}
      onClick={handleToggleUmrah}
      className={
        showUmrahGuide || showUmrahOnboarding
          ? "bg-primary text-primary-foreground border-0 shadow-lg shadow-primary/30 ring-2 ring-primary/25 text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
          : "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary hover:text-primary text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
      }
    >
      <Moon className="hidden sm:inline-block w-4 h-4" />
      <span className="inline whitespace-nowrap">
        {umrahOnboarded ? (showUmrahGuide ? "চলছে" : "ওমরাহ") : "ওমরাহ"}
      </span>
    </Button>
  );

  return (
    <main className="flex flex-col h-dvh w-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="relative px-4 py-3 bg-surface border-b border-border z-10">
        <div className="flex flex-row items-center justify-between gap-3 max-w-screen-2xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="p-1 sm:p-1.5 rounded-xl shadow-lg">
              <Image
                src="/icons/Tawafmap.webp"
                alt="TawafMap Logo"
                width={42}
                height={42}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">TawafMap</h1>
                <BetaBadge />
              </div>
              <p className="text-xs text-primary">মক্কা-মদিনায় হারাবেন না</p>
            </div>
          </Link>

          {isDesktop ? (
            /* ডেস্কটপ টুলবার: আগের মতো সব আইটেম অনুভূমিকভাবে */
            <div className="relative w-full">
              <div className="overflow-x-auto py-1 hide-scrollbar">
                <div className="flex items-center gap-3 min-w-max">
                  {themeToggle}
                  {userLocationItem}
                  {umrahButton}
                  <Button
                    variant={showHotels ? "default" : "outline"}
                    size={showHotels ? "sm" : "icon"}
                    onClick={handleToggleHotels}
                    className={
                      showHotels
                        ? "bg-primary text-primary-foreground border-0 shadow-lg text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                        : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                    }
                  >
                    <Hotel className="hidden sm:inline-block w-4 h-4" />
                    <span className="inline whitespace-nowrap">{showHotels ? "On" : "Hotels"}</span>
                  </Button>
                  <Button
                    variant={showTouristPlaces ? "default" : "outline"}
                    size={showTouristPlaces ? "sm" : "icon"}
                    onClick={handleToggleTouristPlaces}
                    className={
                      showTouristPlaces
                        ? "bg-primary text-primary-foreground border-0 shadow-lg text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                        : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                    }
                  >
                    <Building2 className="hidden sm:inline-block w-4 h-4" />
                    <span className="inline whitespace-nowrap">
                      {showTouristPlaces ? "Hist On" : "Hist"}
                    </span>
                  </Button>
                  <Button
                    variant={showTerrain ? "default" : "outline"}
                    size={showTerrain ? "sm" : "icon"}
                    onClick={() => setShowTerrain((prev) => !prev)}
                    className={
                      showTerrain
                        ? "bg-primary text-primary-foreground border-0 shadow-lg text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                        : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                    }
                  >
                    <Mountain className="hidden sm:inline-block w-4 h-4" />
                    <span className="inline whitespace-nowrap">{showTerrain ? "On" : "Terr"}</span>
                  </Button>
                  {!demoWorldActive && (
                    <Button
                      variant={show3DModel ? "default" : "outline"}
                      size={show3DModel ? "sm" : "icon"}
                      onClick={() => setShow3DModel((prev) => !prev)}
                      onPointerEnter={handle3DIntent}
                      onTouchStart={handle3DIntent}
                      onFocus={handle3DIntent}
                      className={
                        show3DModel
                          ? "bg-primary text-primary-foreground border-0 shadow-lg text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                          : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                      }
                      title="৩ডি মডেল"
                    >
                      <Box className="hidden sm:inline-block w-4 h-4" />
                      <span className="inline whitespace-nowrap">{show3DModel ? "On" : "3D"}</span>
                    </Button>
                  )}
                  <Button
                    variant={showGates ? "default" : "outline"}
                    size={showGates ? "sm" : "icon"}
                    onClick={handleToggleGates}
                    className={
                      showGates
                        ? "bg-primary text-primary-foreground border-0 shadow-lg text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                        : "border-border bg-surface/80 hover:bg-muted hover:text-foreground text-muted-foreground text-sm px-2 sm:px-4 sm:min-w-[4.5rem]"
                    }
                  >
                    <DoorOpen className="hidden sm:inline-block w-4 h-4" />
                    <span className="inline whitespace-nowrap">{showGates ? "On" : "Gates"}</span>
                  </Button>
                  <GateSelector />
                </div>
              </div>
            </div>
          ) : (
            /* মোবাইল ক্লাস্টার: শুধু ওমরাহ + মোড টগল + হ্যামবার্গার */
            <div className="flex items-center gap-2">
              {umrahButton}
              {themeToggle}
              <button
                type="button"
                onClick={() => setToolbarMenuOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={toolbarMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
                aria-expanded={toolbarMenuOpen}
              >
                {toolbarMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>

        {/* মোবাইল হ্যামবার্গার মেনু: মানচিত্রের উপর ওভারলে — মানচিত্রের মাপ
            অপরিবর্তিত থাকে, তাই ক্যানভাস রিসাইজ লাগে না। লেয়ার টগল উল্লম্ব
            তালিকা হিসেবে, নিচে গেট সার্চ ও লোকেশন। */}
        {!isDesktop && toolbarMenuOpen && (
          <div className="absolute inset-x-0 top-full z-20 border-b border-border bg-surface/95 shadow-lg backdrop-blur-md">
            <div className="mx-auto max-w-screen-2xl max-h-[70vh] overflow-y-auto px-3 py-1.5">
              <div className="divide-y divide-border">
                <MenuToggleRow
                  label="নিকটবর্তী হোটেল"
                  icon={Hotel}
                  checked={showHotels}
                  onChange={handleToggleHotels}
                />
                <MenuToggleRow
                  label="দর্শনীয় স্থানসমূহ"
                  icon={Building2}
                  checked={showTouristPlaces}
                  onChange={handleToggleTouristPlaces}
                />
                <MenuToggleRow
                  label="টেরেইন ম্যাপ"
                  icon={Mountain}
                  checked={showTerrain}
                  onChange={() => setShowTerrain((prev) => !prev)}
                />
                {!demoWorldActive && (
                  <MenuToggleRow
                    label="৩ডি মডেল"
                    icon={Box}
                    checked={show3DModel}
                    onChange={() => setShow3DModel((prev) => !prev)}
                    onIntent={handle3DIntent}
                  />
                )}
                <MenuToggleRow
                  label="হারামের গেট"
                  icon={DoorOpen}
                  checked={showGates}
                  onChange={handleToggleGates}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-end gap-3 border-t border-border pt-2.5">
                <GateSelector showLabel />
                {userLocationItem}
              </div>
            </div>
          </div>
        )}
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

        {/* GPS simulator badge (dev/test harness, only renders while active) */}
        <GpsSimBadge />

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
