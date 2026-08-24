"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { MapView, GateSelector, UserLocation, BarikoiAttribution } from "@/components/map";
import { NearbyChipBar, NearbySettingsPanel } from "@/components/map/nearby";
import {
  NearbyCardsStrip,
  NearbyCategoryButton,
  NearbyListSheet,
  NearbyDetailSheet,
  NearbyDetailModal,
} from "@/components/map/nearby";
import { UmrahOnboarding, UmrahStepList, MiqatOverviewPanel } from "@/components/umrah";
import { GpsSimBadge } from "@/components/dev/GpsSimBadge";
import { isDemoWorldActive } from "@/lib/dev/demo-world";
import { BetaBadge } from "@/components/ui/beta-badge";
import { useGeolocation, useMediaQuery, useNearbyPlaces, useNavigation } from "@/lib/hooks";
import { NavigationBanner } from "@/components/navigation/NavigationBanner";
import {
  useLocationStore,
  useNearbyStore,
  useRouteStore,
  usePanelStore,
  useUmrahGuideStore,
  useGuideSheetStore,
  useMapStore,
} from "@/lib/store";
import { guideOverlayBottomPx, guideSheetRaised } from "@/lib/utils/guide-sheet";
import { NEARBY_CHIP_BAR_HEIGHT_PX, NEARBY_CARDS_STRIP_GAP_PX } from "@/lib/utils/nearby-sheet";
import type { NearbyCategory, NearbyItem } from "@/types/nearby";
import { getActiveGateById } from "@/lib/gates/active";
import { gateToNearbyItem } from "@/lib/nearby/query";
import { intentPreloadModelUrls } from "@/lib/map/model-config";
import { fetchModelBytes } from "@/lib/map/model-manager";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { Mountain, Box, X, Moon, Menu, type LucideIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Lazy load panels to avoid render overlap
import dynamic from "next/dynamic";

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

// মোবাইল হ্যামবার্গার মেনুর টগল-সারি: আইকন + বাংলা লেবেল বামে, সুইচ ডানে।
// সুইচের রঙ primary থিম অনুসরণ করে; বোতামটি aria-pressed-এ অবস্থা জানায়।
// (স্থায়ী মানচিত্র-পছন্দ — টেরেইন/3D — এর জন্য; "আমার কাছে" বিভাগগুলো
// NearbyCategoryButton দিয়ে যায়, চিপ-বারের মতোই।)
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
  // "আমার কাছে" — থ্রটল-করা লাইভ কোয়েরি (গণনা + সক্রিয় বিভাগের তালিকা)
  const nearby = useNearbyPlaces();
  const activeNearbyCategory = useNearbyStore((state) => state.activeCategory);
  const nearbySelectedItem = useNearbyStore((state) => state.selectedItem);
  const nearbySettingsOpen = useNearbyStore((state) => state.settingsOpen);
  const nearbyListMode = useNearbyStore((state) => state.listMode);
  const nearbyDetailModalOpen = useNearbyStore((state) => state.detailModalOpen);
  const nearbyRadius = useNearbyStore((state) => state.radius);
  const guideSheetSnap = useGuideSheetStore((state) => state.snapIndex);
  // GPS ওয়াচ পেজ লেভেলে — মোবাইলে UserLocation এখন হ্যামবার্গার মেনুর ভেতরে
  // শুধু মেনু খোলা থাকলে মাউন্ট হয়; ওয়াচ ওখানে থাকলে মেনু বন্ধ মানেই জিপিএস
  // বন্ধ (ইউজার ডট/কাছাকাছি প্যানেল/ডেমো-ওয়ার্ল্ড সব চুপচাপ মরে যেত)।
  const {
    latitude: userLat,
    longitude: userLng,
    accuracy: userAccuracy,
    error: userError,
    loading: userLoading,
    permission: userPermission,
    requestLocation,
  } = useGeolocation();
  // লাইভ নেভিগেশন অর্কেস্ট্রেশন — পেজে ঠিক একবারই মাউন্ট হয় (দ্বিতীয়বার হলে
  // প্রতি ফিক্সে ডাবল হিসাব/ডাবল রিয়ারাউট হবে)।
  useNavigation();
  const { activeRoute } = useRouteStore();
  const { activePanel, setActivePanel } = usePanelStore();
  const umrahOnboarded = useUmrahGuideStore((s) => s.onboarded);

  const [showTerrain, setShowTerrain] = useState(false);
  const [show3DModel, setShow3DModel] = useState(false);
  const [showUmrahOnboarding, setShowUmrahOnboarding] = useState(false);
  const [showUmrahGuide, setShowUmrahGuide] = useState(false);
  const [showMiqatOverview, setShowMiqatOverview] = useState(false);

  // ওমরাহ গাইড বোতাম: অনবোর্ডিং না থাকলে উইজার্ড, থাকলে ধাপ-তালিকা
  const handleToggleUmrah = () => {
    if (!umrahOnboarded) {
      setShowUmrahOnboarding(true);
    } else {
      setShowUmrahGuide((prev) => !prev);
    }
  };

  // "3D" বাটনে আঙুল/মাউস/ফোকাস পড়ামাত্রই মডেল ডাউনলোড শুরু (intent preload)।
  // ক্যামেরা যে শহরের সবচেয়ে কাছে, শুধু সেই ভিনিউ-এর মডেলই নামে — মক্কার ওপর
  // বাটন ছুঁয়ে ~৭৯.৫MB নাবাভি নামবে না (এবং উল্টোটাও)। ক্লিকের ১-২ সেকেন্ড
  // আগের এই হেড-স্টার্টই 3D চালু করার অপেক্ষা প্রায় মুছে দেয়; ক্যাশে থাকলে
  // কিছুই নামে না। ব্যর্থতা নীরব — ক্লিকে আবার চেষ্টা হবে।
  const handle3DIntent = useCallback(() => {
    const [lng, lat] = useMapStore.getState().center;
    for (const url of intentPreloadModelUrls([lng, lat])) {
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

  // ধাপ মার্কার ক্লিক — useCallback-এ স্থিতিশীল আইডেন্টিটি জরুরি: inline অ্যারো
  // হলে প্রতি রি-রেন্ডারে (GPS ফিক্সসহ) MapView-এর মার্কার ইফেক্ট পুনরায় চলে সব
  // ওমরাহ ধাপ-মার্কার ও যাত্রা রেখা ভেঙে নতুন করে বসাত।
  const handleUmrahStepClick = useCallback((stepId: string) => {
    useUmrahGuideStore.getState().goToStepId(stepId);
  }, []);

  // "আমার কাছে" হ্যান্ডলার — স্টোর getState() দিয়ে, তাই স্থিতিশীল (handleUmrahStepClick ধাঁচ)
  const handleNearbyItemClick = useCallback((item: NearbyItem) => {
    useNearbyStore.getState().selectItem(item);
  }, []);
  const handleNearbyCategorySelect = useCallback((category: NearbyCategory) => {
    useNearbyStore.getState().setActiveCategory(category);
  }, []);
  const handleNearbySettingsOpen = useCallback(() => {
    useNearbyStore.getState().openSettings();
  }, []);
  const handleNearbySettingsChange = useCallback((open: boolean) => {
    if (open) {
      useNearbyStore.getState().openSettings();
    } else {
      useNearbyStore.getState().closeSettings();
    }
  }, []);
  const handleNearbyExpand = useCallback(() => {
    useNearbyStore.getState().expandList();
  }, []);
  const handleNearbyListChange = useCallback((open: boolean) => {
    // টেনে-নামা/ব্যাকড্রপ-ট্যাপে তালিকা ভাঁজ হয়ে কার্ড-স্ট্রিপে ফেরে
    if (!open) {
      useNearbyStore.getState().collapseList();
    }
  }, []);
  const handleNearbyDetailChange = useCallback((open: boolean) => {
    if (!open) {
      useNearbyStore.getState().clearSelection();
    }
  }, []);
  const handleNearbyShowDetails = useCallback(() => {
    useNearbyStore.getState().openDetailModal();
  }, []);
  const handleNearbyModalClose = useCallback(() => {
    useNearbyStore.getState().closeDetailModal();
  }, []);

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
    const active = isDemoWorldActive();
    setDemoWorldActive(active);
    // ডেমো মোডে গেট বিভাগ ডিফল্টেই সক্রিয় — এরিনায় সরানো গেটগুলো এক নজরে
    // দেখা যায়। মার্কার/কার্ড প্রথম রিম্যাপ-করা জিপিএস ফিক্সের পরেই বসে।
    if (active && useNearbyStore.getState().activeCategory === null) {
      useNearbyStore.getState().setActiveCategory("gate");
    }
  }, []);

  // ভিউপোর্টের উচ্চতা — গাইড শিটের স্ন্যাপ অনুযায়ী চিপ-বারের bottom অফসেট
  // হিসাবে (প্রথম রেন্ডারে 0 = সার্ভারের সাথে মিল)।
  const [viewportHeight, setViewportHeight] = useState(0);
  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // গাইড শিটের স্ন্যাপ থেকে চিপ-বার/কার্ড-স্ট্রিপের bottom অফসেট। ডেস্কটপে (>=md)
  // গাইড পার্শ্ব-প্যানেল হিসেবে রেন্ডার হয়, মোবাইল শীটটি লুকানো থাকে — কিন্তু
  // স্টোরে স্ন্যাপ লেখা চলতেই থাকে, তাই MapView-এর (guideSheetActive) মতোই mdUp
  // গেট ছাড়া অফসেট প্রয়োগ করলে চিপ-বার পর্দার মাঝ বরাবর ভেসে যেত।
  const mdUp = useMediaQuery("(min-width: 768px)");
  const guideSheetActive = !mdUp && guideSheetSnap !== null;
  const nearbyOverlayBottomPx = guideSheetActive
    ? guideOverlayBottomPx(guideSheetSnap, viewportHeight)
    : undefined;
  // নিচের প্রান্তে একই সময়ে একজনই মালিক: গাইড শিট peek-এর ঊর্ধ্বে উঠলে
  // কাছাকাছি চিপ-বার/কার্ড-স্ট্রিপ লুকায় (চিপ চালু করলে শিট প্রথমেই peek-এ
  // নামে - useGuideSheetNearbySync; এই নিয়ম সেটেল-চলাকালীন ফাঁকও ঢাকে)।
  const guideBlocksNearby = guideSheetActive && guideSheetRaised(guideSheetSnap);

  // মোবাইল হেডার: লোগো বামে, ডানে শুধু ওমরাহ + মোড + হ্যামবার্গার; বাকি সব
  // টুলবার আইটেম হ্যামবার্গার মেনুর ভেতরে। ডেস্কটপে (>=sm) আগের মতো অনুভূমিক
  // টুলবার। প্রতিটি লেআউটে প্রতিটি আইটেম একবারই মাউন্ট হয়; GPS ওয়াচ এজন্যই
  // কম্পোনেন্টের বাইরে পেজ লেভেলে (উপরে) — মেনুর ভেতরের UserLocation এখন নিছক
  // ইন্ডিকেটর, তাই মেনু বন্ধ থাকলেও ওয়াচ চালু থাকে।
  // SSR/হাইড্রেশন ম্যাচ রাখতে হুক প্রথম রেন্ডারে false দেয়, তাই সার্ভার ও
  // প্রথম ক্লায়েন্ট রেন্ডার মোবাইল লেআউট দেখায়।
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [toolbarMenuOpen, setToolbarMenuOpen] = useState(false);

  // সার্চ থেকে গেট বাছাই: চিপ-ট্যাপের মতোই একই পথে যায় — গেট বিভাগ সক্রিয়
  // করে ডিটেইল শিট খোলে। setActiveCategory একই বিভাগে ডাকলে টগল-অফ হয়ে
  // যায় ও নির্বাচন রিসেট করে, তাই আগে বিভাগ মিলিয়ে নিয়ে তারপর selectItem।
  const handleSearchGateSelect = useCallback((gateId: string) => {
    // মোবাইল: হ্যামবার্গার মেনুর ভেতর থেকে বাছলে মেনু বন্ধ, নইলে ইনফো
    // শীটের সাথে ওভারল্যাপ করে পুরো স্ক্রিন ভরিয়ে রাখে।
    setToolbarMenuOpen(false);
    const gate = getActiveGateById(gateId);
    if (!gate) return;
    const { latitude, longitude } = useLocationStore.getState();
    const item = gateToNearbyItem(gate, latitude, longitude);
    const store = useNearbyStore.getState();
    if (store.activeCategory !== "gate") {
      store.setActiveCategory("gate");
    }
    store.selectItem(item);
  }, []);

  const handleCloseRoutePanel = () => {
    setActivePanel(null);
  };

  const showRoutePanel = activePanel === "route" && activeRoute !== null;
  const hasActivePanel = activePanel !== null;

  if (activeRoute !== null && activePanel === null) {
    setActivePanel("route");
  }

  // নির্বাচিত আইটেম ব্যাসার্ধের বাইরে হলেও (যেমন সার্চে বাছাই করা দূরের গেট)
  // MapView-এর মার্কার-তালিকায় জোর করে ঢোকানো হয় — selectNearbyMapMarkers-এর
  // alwaysIncludeIds তখন মার্কার বসায় ও ফ্লাই-টু চলে। কার্ড-স্ট্রিপ/তালিকা-
  // শিট আসল nearby.items-ই পায়, যাতে বাইরের আইটেম কার্ড হয়ে না ফুটে।
  const itemsWithSelected = useMemo(() => {
    if (!activeNearbyCategory || !nearbySelectedItem) return nearby.items;
    if (nearby.items.some((item) => item.id === nearbySelectedItem.id)) return nearby.items;
    return [...nearby.items, nearbySelectedItem];
  }, [nearby.items, activeNearbyCategory, nearbySelectedItem]);

  // হেডারের শেয়ার্ড আইটেম — ডেস্কটপ টুলবার ও মোবাইল ক্লাস্টার/মেনু একই JSX
  // ব্যবহার করে। isDesktop শর্তে যেকোনো সময় একটিই লেআউট রেন্ডার হয়, তাই প্রতিটি
  // আইটেম একবারই মাউন্ট হয়। লেয়ার টগলগুলো আলাদা: ডেস্কটপে Button, মোবাইল
  // মেনুতে MenuToggleRow।
  const themeToggle = <ThemeToggle />;
  const userLocationItem = (
    <UserLocation
      latitude={userLat}
      longitude={userLng}
      accuracy={userAccuracy}
      error={userError}
      loading={userLoading}
      permission={userPermission}
      onRequestLocation={requestLocation}
    />
  );
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
                  {/* "আমার কাছে" প্রধান তিন বিভাগ — চিপ-বারের মতোই একই বোতাম,
                      একই স্টোর; উভয় প্রবেশপথ সবসময় সিঙ্কে থাকে। */}
                  {(["hotel", "gate", "historical"] as const).map((category) => (
                    <NearbyCategoryButton
                      key={category}
                      category={category}
                      count={nearby.counts[category]}
                      active={activeNearbyCategory === category}
                      disabled={!nearby.hasLocation}
                      onSelect={handleNearbyCategorySelect}
                    />
                  ))}
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
                  <GateSelector onSelectGate={handleSearchGateSelect} />
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
            তালিকা হিসেবে, নিচে গেট সার্চ ও লোকেশন। z-[60] দরকার — ডেমো/সিম
            ব্যাজ (z-[45]) মেনুর প্রথম সারিগুলোর ওপর বসে ট্যাপ খেয়ে ফেলত। */}
        {!isDesktop && toolbarMenuOpen && (
          <div className="absolute inset-x-0 top-full z-[60] border-b border-border bg-surface/95 shadow-lg backdrop-blur-md">
            <div className="mx-auto max-w-screen-2xl max-h-[70vh] overflow-y-auto px-3 py-1.5">
              <div className="divide-y divide-border">
                {/* "আমার কাছে" তিন বিভাগ — চিপ-বারের একই বোতাম, উল্লম্ব তালিকার
                    জন্য প্রসারিত; সুইচ-সারি শুধু স্থায়ী পছন্দে (টেরেইন/3D)। */}
                <div className="flex flex-col items-stretch gap-1.5 py-1.5">
                  {(["hotel", "gate", "historical"] as const).map((category) => (
                    <NearbyCategoryButton
                      key={category}
                      category={category}
                      count={nearby.counts[category]}
                      active={activeNearbyCategory === category}
                      disabled={!nearby.hasLocation}
                      className="w-full justify-start"
                      onSelect={handleNearbyCategorySelect}
                    />
                  ))}
                </div>
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
              </div>
              <div className="mt-1.5 flex items-center justify-end gap-3 border-t border-border pt-2.5">
                <GateSelector showLabel onSelectGate={handleSearchGateSelect} />
                {userLocationItem}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Map */}
      <div className="relative flex-1">
        <MapView
          showUserLocation
          showTerrain={showTerrain}
          show3DModel={show3DModel}
          showUmrah={umrahOnboarded && showUmrahGuide}
          showMiqatOverview={umrahOnboarded && showMiqatOverview}
          nearbyCategory={activeNearbyCategory}
          nearbyItems={activeNearbyCategory ? itemsWithSelected : []}
          nearbySelectedItemId={nearbySelectedItem?.id ?? null}
          nearbyCenter={nearby.center}
          nearbyRadiusM={nearbyRadius}
          onUmrahStepClick={handleUmrahStepClick}
          onNearbyItemClick={handleNearbyItemClick}
        />

        {/* Route Panel */}
        {showRoutePanel && <RoutePanel onClose={handleCloseRoutePanel} />}

        {/* লাইভ নেভিগেশন ব্যানার — নেভিগেশন চালু না থাকলে নিজেই লুকায় */}
        <NavigationBanner />

        {/* Debug Location Panel */}
        {!hasActivePanel && <DebugLocationPanel />}

        {/* GPS simulator badge (dev/test harness, only renders while active) */}
        <GpsSimBadge />

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

        {/* বারিকই অ্যাট্রিবিউশন — নিচের বাম কোণে ছোট লোগো; NearbyChipBar
            (মোবাইলে ml-16) এই কোণটি রিজার্ভ করে রাখে। */}
        <BarikoiAttribution />

        {/* "আমার কাছে" — গাইড শিট/প্যানেলের পরে মাউন্ট, যাতে শিট-স্ট্যাকিংয়ে
            (একই z-[110]) পরে-বসা কাছাকাছি শিটগুলো ওপরে থাকে। */}
        <NearbyChipBar
          counts={nearby.counts}
          activeCategory={activeNearbyCategory}
          hidden={
            !nearby.hasLocation ||
            hasActivePanel ||
            guideBlocksNearby ||
            nearbyListMode === "expanded" ||
            nearbySelectedItem !== null
          }
          style={{ bottom: nearbyOverlayBottomPx }}
          onSelectCategory={handleNearbyCategorySelect}
          onOpenSettings={handleNearbySettingsOpen}
        />

        {activeNearbyCategory && (
          <NearbyCardsStrip
            category={activeNearbyCategory}
            items={nearby.items}
            hidden={
              !nearby.hasLocation ||
              hasActivePanel ||
              guideBlocksNearby ||
              nearbyListMode !== "cards" ||
              nearbySelectedItem !== null
            }
            style={{
              bottom:
                // অফসেট না থাকলে চিপ-বারের ক্লাস-ডিফল্ট (bottom-4 / md:bottom-6) মিরর
                (nearbyOverlayBottomPx ?? (mdUp ? 24 : 16)) +
                NEARBY_CHIP_BAR_HEIGHT_PX +
                NEARBY_CARDS_STRIP_GAP_PX,
            }}
            onSelect={handleNearbyItemClick}
            onExpand={handleNearbyExpand}
          />
        )}

        <NearbySettingsPanel open={nearbySettingsOpen} onOpenChange={handleNearbySettingsChange} />

        <NearbyListSheet
          open={
            activeNearbyCategory !== null &&
            nearbyListMode === "expanded" &&
            nearbySelectedItem === null
          }
          onOpenChange={handleNearbyListChange}
          category={activeNearbyCategory ?? "hotel"}
          items={nearby.items}
          selectedItemId={nearbySelectedItem?.id ?? null}
          onSelect={handleNearbyItemClick}
        />

        {nearbySelectedItem && (
          <NearbyDetailSheet
            open
            onOpenChange={handleNearbyDetailChange}
            item={nearbySelectedItem}
            onShowDetails={handleNearbyShowDetails}
          />
        )}

        <NearbyDetailModal
          item={nearbySelectedItem && nearbyDetailModalOpen ? nearbySelectedItem : null}
          onClose={handleNearbyModalClose}
        />
      </div>
    </main>
  );
}
