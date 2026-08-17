"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import maplibregl, { Map as MapLibreMap, LngLatBoundsLike, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTawafCamera } from "@/lib/hooks/useTawafCamera";
import { useRitualDrawAnimation } from "@/lib/hooks/useRitualDrawAnimation";
import { useMiqatBoundaryAnimation } from "@/lib/hooks/useMiqatBoundaryAnimation";
import { useDirectionArrows } from "@/lib/hooks/useDirectionArrows";
import {
  MODEL_LAYER_ID,
  MODEL_ORIGIN,
  MODEL_URL,
  CLOCK_TOWER_LAYER_ID,
  CLOCK_TOWER_URL,
  PREFETCHABLE_MODEL_URLS,
  buildInitialModelTransform,
  buildInitialClockTowerTransform,
  BASEMAP_3D_HIDDEN_LAYERS,
} from "@/lib/map/model-config";
// Model loading policy (Cache Storage bytes + connection-gated prefetch).
// three.js-free module, safe to import statically.
import {
  fetchModelBytes,
  prefetchModel,
  pruneDeprecatedModelCaches,
  whenIdle,
} from "@/lib/map/model-manager";
import type { ModelLayerHandle } from "@/lib/map/three-model-layer";
// NOTE: the dev tuning tooling (ModelTuner + model-transform-storage) is kept
// for aligning FUTURE models but is DISABLED — both 3D layers render the baked
// defaults in lib/map/model-config.ts (the clock tower was aligned with the
// tuner and its final values are baked in). Re-enable only while tuning (see
// the 3D effect note below for what to restore).
import {
  useMapStore,
  useLocationStore,
  useGateStore,
  useRouteStore,
  useHotelStore,
  useTouristPlaceStore,
  useUmrahGuideStore,
} from "@/lib/store";
import { LandmarkHint } from "@/components/umrah/guide/LandmarkHint";
import type { LandmarkHintData } from "@/lib/map/landmark-utils";
import { getContextualLandmarkHint, getClosestAnchorId } from "@/lib/map/landmark-utils";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { TOURIST_PLACES } from "@/lib/data/tourist-places";
import { getStepById } from "@/lib/data/umrah/steps";
import { getAnchorById } from "@/lib/data/umrah/anchors";
import { isStepComplete } from "@/lib/data/umrah/sequence";
import {
  MIQAT_POINTS,
  resolveMiqatForTravelPath,
  miqatRingBounds,
  miqatRingOutline,
} from "@/lib/data/umrah/miqat";
import {
  UMRAH_OVERLAY_SOURCE,
  UMRAH_SACRED_SOURCE,
  UMRAH_JOURNEY_SOURCE,
  UMRAH_RITUAL_LAYERS,
  SACRED_POINTS_LAYER,
  UMRAH_JOURNEY_LAYER,
  TAWAF_RING_LAYER,
  SAI_CORRIDOR_LAYER,
  TAWAF_DRAW_SOURCE,
  SAI_DRAW_SOURCE,
  MIQAT_DRAW_SOURCE,
  createRitualOverlayGeoJSON,
  createSacredPointsGeoJSON,
  getTawafCircleCoords,
  getSaiCorridorCoords,
  sacredPointsLayer,
  umrahJourneyLayer,
} from "@/lib/map/umrah-overlay";
import { createUserAccuracySource, createRouteSource, getGatesBounds } from "@/lib/map/sources";
import {
  getLayerConfigs,
  ROUTE_LAYER_ID,
  ROUTE_CASING_LAYER_ID,
  USER_ACCURACY_LAYER_ID,
} from "@/lib/map/layers";
import {
  createGateMarkerElement,
  createHotelMarkerElement,
  createTouristPlaceMarkerElement,
  createUserLocationElement,
  createUmrahStepMarkerElement,
  createMiqatMarkerElement,
  pilgrimIconForGender,
  type UmrahStepStatus,
} from "@/lib/map/markers";
import { RecenterButton } from "./RecenterButton";
import { RitualRoundHud } from "./RitualRoundHud";
import { MapInstanceProvider } from "@/lib/map/MapInstanceContext";
import { MAP_COLORS } from "@/lib/map/colors";
import { resolveCanvasQuality } from "@/lib/map/canvas-quality";
import { getDemoWorldViewport } from "@/lib/dev/demo-world";

interface MapViewProps {
  className?: string;
  showGates?: boolean;
  showHotels?: boolean;
  showTouristPlaces?: boolean;
  touristCity?: "makkah" | "madinah" | null;
  showUserLocation?: boolean;
  showTerrain?: boolean;
  show3DModel?: boolean;
  showUmrah?: boolean;
  showMiqatOverview?: boolean;
  onGateClick?: (gateId: string) => void;
  onHotelClick?: (hotelId: string) => void;
  onTouristPlaceClick?: (placeId: string) => void;
  onUmrahStepClick?: (stepId: string) => void;
  onMiqatClick?: (miqatId: string) => void;
}

// Barikoi Map Style URL — key sourced from env so it isn't hardcoded in the
// client bundle. Falls back to a dev-only default so local dev still works.
// NOTE: any NEXT_PUBLIC_* value ships in the bundle; treat it as public.
const BARIKOI_API_KEY = process.env.NEXT_PUBLIC_BARIKOI_API_KEY ?? "MjY0NDpHRUswODE3R1VV";
const BARIKOI_MAP_STYLE = `https://map.barikoi.com/styles/osm_barikoi_pl/style.json?key=${BARIKOI_API_KEY}`;

/**
 * একটি আনুষ্ঠানিক রিং লেয়ারে সংক্ষিপ্ত ঝলক (flashColor → originalColor)। MapLibre-এর
 * ডিফল্ট paint-transition (~৩০০ms) রং পরিবর্তন মসৃণ করে, তাই এটি একটি শান্ত "round-complete"
 * ঝলক তৈরি করে। prefers-reduced-motion হলে কিছু করে না।
 */
function flashRitualRing(
  map: MapLibreMap,
  layerId: string,
  flashColor: string,
  originalColor: string
) {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  if (!map.getLayer(layerId)) return;
  try {
    map.setPaintProperty(layerId, "line-color", flashColor);
    window.setTimeout(() => {
      try {
        if (map.getLayer(layerId)) map.setPaintProperty(layerId, "line-color", originalColor);
      } catch {
        // লেয়ার সরানো হলে উপেক্ষা।
      }
    }, 500);
  } catch {
    // লেয়ার/স্টাইল প্রস্তুত না হলে উপেক্ষা।
  }
}

export function MapView({
  className = "",
  showGates = true,
  showHotels = false,
  showTouristPlaces = false,
  touristCity = "makkah",
  showUserLocation = true,
  showTerrain = false,
  show3DModel = false,
  showUmrah = false,
  showMiqatOverview = false,
  onGateClick,
  onHotelClick,
  onTouristPlaceClick,
  onUmrahStepClick,
  onMiqatClick,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // map instance-এর জন্য reactive state যাতে useTawafCamera পুনরায় রান করে
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);

  // ৩ডি মডেল লোডের অবস্থা — বড় GLB (~৬৩MB মসজিদ) স্ট্রিম হওয়ার সময় progress overlay দেখাতে
  const [modelLoadState, setModelLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [modelLoadProgress, setModelLoadProgress] = useState(0);

  // Cached instant-restore-এ loading অবস্থা মাত্র এক-দুই ফ্রেম থাকে — overlay
  // যেন এক বার্ষার মতো ফ্ল্যাশ না করে, তাই 350ms পরেই সেটি দেখানো শুরু হয়।
  const [overlayDelayElapsed, setOverlayDelayElapsed] = useState(false);
  useEffect(() => {
    if (modelLoadState !== "loading") {
      setOverlayDelayElapsed(false);
      return;
    }
    const id = window.setTimeout(() => setOverlayDelayElapsed(true), 350);
    return () => window.clearTimeout(id);
  }, [modelLoadState]);

  // ৩ডি লেয়ার হ্যান্ডেল — প্রথম টগলে একবারই তৈরি হয়। এরপর "3D" বাটন শুধু
  // visibility ফ্লিপ করে (handle.setActive), লেয়ার remove হয় না — তাই টগলের
  // প্রতিবার নতুন ডাউনলোড/পার্স/GPU রিবিল্ড খরচ হয় না।
  const modelHandlesRef = useRef<{
    masjid: ModelLayerHandle | null;
    tower: ModelLayerHandle | null;
  }>({ masjid: null, tower: null });
  const modelsBootingRef = useRef(false);
  // Async তৈরি শেষ হওয়ার মুহূর্তে সাম্প্রতিক টগল-অবস্থা জানতে (দ্রুত টগলে ভুল
  // করে মডেল ফ্ল্যাশ হওয়া এড়াতে)।
  const show3DModelRef = useRef(false);

  // এই সেশনে মসজিদ মডেলের প্রথম লোডের ফলাফল। টগল অফ→অন-এ লেয়ার remove/add
  // হয় না (শুধু visibility flip), তাই onLoadOK/onLoadError দ্বিতীয়বার ফায়ার
  // করে না — এই ref ছাড়া দ্বিতীয় টগল-অন-এ overlay "লোড হচ্ছে 0%"-এ চিরকাল
  // আটকে থাকত। unmount-এ ref-ও রিসেট হয়, তখন instance cache থেকে আবার
  // onLoadOK ফায়ার হয়ে এটি ভরে যায়।
  const modelLoadOutcomeRef = useRef<"ready" | "error" | null>(null);

  // গাইডেড ক্যামেরা নিয়ন্ত্রক - programmatic মুভ ও user-gesture শনাক্তকরণ
  const { programmaticFlyTo, programmaticEaseTo, programmaticFitBounds } =
    useTawafCamera(mapInstance);

  // Store references to markers for removal/update
  const gateMarkersRef = useRef<Map<string, Marker>>(new Map());
  const hotelMarkersRef = useRef<Map<string, Marker>>(new Map());
  const touristPlaceMarkersRef = useRef<Map<string, Marker>>(new Map());
  const umrahStepMarkersRef = useRef<Map<string, Marker>>(new Map());
  const miqatMarkersRef = useRef<Map<string, Marker>>(new Map());
  const userLocationMarkerRef = useRef<Marker | null>(null);

  // Store state - individual selectors only. Camera state (center/zoom/
  // bearing/pitch) is deliberately NOT subscribed to: the move/zoom handlers
  // below write those to the store every frame, so a reactive subscription
  // here re-rendered this whole component at up to 60fps while panning (the
  // top offender of the mobile-jank audit). Initial camera values are read
  // from the store once inside the init effect instead.
  const userTookControl = useMapStore((state) => state.userTookControl);
  const setCenter = useMapStore((state) => state.setCenter);
  const setZoom = useMapStore((state) => state.setZoom);

  // Location state - individual selectors to avoid object creation on every render
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const accuracy = useLocationStore((state) => state.accuracy);

  const selectedGate = useGateStore((state) => state.selectedGate.gate);
  const activeRoute = useRouteStore((state) => state.activeRoute);
  const selectedHotel = useHotelStore((state) => state.selectedHotel);
  const selectedTouristPlace = useTouristPlaceStore((state) => state.selectedPlace.place);

  // ওমরাহ গাইড স্টেট - স্থিতিশীল সিলেক্টর (নতুন অবজেক্ট রেফারেন্স এড়াতে হবে)
  const umrahStepIds = useUmrahGuideStore((s) => s.stepIds);
  const umrahCurrentIndex = useUmrahGuideStore((s) => s.currentIndex);
  const umrahCompleted = useUmrahGuideStore((s) => s.completed);
  const umrahCounters = useUmrahGuideStore((s) => s.counters);
  const umrahProfile = useUmrahGuideStore((s) => s.profile);
  // তওয়াফ/সাঈ কাউন্টার - বৃদ্ধি শনাক্ত করে অঙ্কন অ্যানিমেশন ট্রিগার করতে
  const tawafCounter = useUmrahGuideStore((s) => s.counters["tawaf"] ?? 1);
  const saiCounter = useUmrahGuideStore((s) => s.counters["sai"] ?? 1);
  const prevTawafCounterRef = useRef<number | null>(null);
  const prevSaiCounterRef = useRef<number | null>(null);

  const [hintDismissed, setHintDismissed] = useState(false);

  const activeStageId = umrahStepIds[umrahCurrentIndex];
  const activeStep = activeStageId ? getStepById(activeStageId) : null;

  const closestAnchor = useMemo(() => {
    if (!activeStep?.anchors?.length || latitude === null || longitude === null) return null;
    return getClosestAnchorId(activeStep.anchors, latitude, longitude);
  }, [activeStep?.anchors, latitude, longitude]);

  const contextualLandmarkHint = useMemo(() => {
    if (!showUmrah || showMiqatOverview || !activeStep) return null;
    return getContextualLandmarkHint(
      activeStep.stage,
      closestAnchor?.id ?? null,
      closestAnchor?.distance ?? null
    );
  }, [showUmrah, showMiqatOverview, activeStep, closestAnchor]);

  useEffect(() => {
    setHintDismissed(false);
  }, [activeStageId, showUmrah, showMiqatOverview]);

  // হাজি মার্কারের আইকন - প্রোফাইলের লিঙ্গ অনুযায়ী (পুরুষ/নারী)
  const pilgrimIconSrc = pilgrimIconForGender(umrahProfile?.gender);

  // জীবন্ত অঙ্কন অ্যানিমেশন - প্রতি পূর্ণ চক্কর/পাক সম্পন্ন হলে হাজি পুরো পথ ধরে হাঁটে
  const { play: playTawafDraw } = useRitualDrawAnimation(mapInstance, {
    show: showUmrah && mapLoaded,
    sourceId: TAWAF_DRAW_SOURCE,
    iconSrc: pilgrimIconSrc,
    getCoords: () => getTawafCircleCoords(),
  });
  const { play: playSaiDraw } = useRitualDrawAnimation(mapInstance, {
    show: showUmrah && mapLoaded,
    sourceId: SAI_DRAW_SOURCE,
    iconSrc: pilgrimIconSrc,
    getCoords: (round) => getSaiCorridorCoords(round % 2 === 1 ? "safa-to-marwa" : "marwa-to-safa"),
  });

  // ----- দিকনির্দেশক চেভরন - সক্রিয় তওয়াফ/সাঈ পথে হাঁটার দিক -----
  // তওয়াফ: সম্পূর্ণ বৃত্ত, ঘড়ির বিপরীত দিকে। সাঈ: সম্পূর্ণ করিডোর, পাক অনুযায়ী দিক
  // (বিজোড় পাক = সাফা→মারওয়া, জোড় পাক = মারওয়া→সাফা)। অন্য ধাপে কোনো তীর নেই।
  const activeStage = activeStageId ? getStepById(activeStageId)?.stage : undefined;
  const saiArrowDirection = saiCounter % 2 === 1 ? "safa-to-marwa" : "marwa-to-safa";
  const arrowCoords = useMemo(() => {
    if (activeStage === "tawaf") return getTawafCircleCoords();
    if (activeStage === "sai") return getSaiCorridorCoords(saiArrowDirection);
    return null;
  }, [activeStage, saiArrowDirection]);
  useDirectionArrows(mapInstance, {
    show: showUmrah && mapLoaded,
    active: arrowCoords !== null,
    coords: arrowCoords,
    count: activeStage === "tawaf" ? 10 : activeStage === "sai" ? 7 : 0,
    closed: activeStage === "tawaf",
  });

  // ----- মিকাত সীমানা রূপরেখার ভূমিকা অ্যানিমেশন (ihram ধাপে, প্রতি সেশনে একবার) -----
  const miqatIntroActive = showUmrah && mapLoaded && !showMiqatOverview && activeStage === "ihram";
  const miqatRingCoords = useMemo(() => miqatRingOutline(), []);
  const miqatIntroPrevCameraRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  useMiqatBoundaryAnimation(mapInstance, {
    show: showUmrah && mapLoaded,
    active: miqatIntroActive,
    sourceId: MIQAT_DRAW_SOURCE,
    ringCoords: miqatRingCoords,
    beforeLayerId: "building-metro",
    onComplete: () => {
      // ভূমিকা শেষে আগের ক্যামেরায় ফিরে যাওয়া।
      const prev = miqatIntroPrevCameraRef.current;
      if (prev) programmaticFlyTo({ center: prev.center, zoom: prev.zoom, duration: 1200 });
    },
  });
  // ihram ধাপে পৌঁছালে পুরো মিকাত রিং ফ্রেমে আনা, যাতে রূপরেখা অঙ্কন দৃশ্যমান হয়।
  useEffect(() => {
    if (!mapRef.current || !miqatIntroActive) return;
    const m = mapRef.current;
    miqatIntroPrevCameraRef.current = {
      center: [m.getCenter().lng, m.getCenter().lat],
      zoom: m.getZoom(),
    };
    programmaticFitBounds(miqatRingBounds(0), {
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      duration: 1000,
    });
    // miqatIntroActive ছাড়া অন্য deps নয় — ধাপে প্রবেশে একবারই ফ্রেম করা।
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miqatIntroActive]);

  // Initialize map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Demo world (dev harness): start framed on the translated arena instead
    // of Makkah. Only affects the very first map creation, so no fighting.
    const demoViewport = getDemoWorldViewport();

    // Initial camera from the store's CURRENT values (not subscriptions) —
    // see the selector note at the top of the component.
    const {
      center: initialCenter,
      zoom: initialZoom,
      bearing: initialBearing,
      pitch: initialPitch,
    } = useMapStore.getState();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BARIKOI_MAP_STYLE,
      center: demoViewport?.center ?? [initialCenter[0], initialCenter[1]],
      zoom: demoViewport?.zoom ?? initialZoom,
      bearing: initialBearing,
      pitch: initialPitch,
      // Canvas quality: capped pixel ratio + MSAA only on low-DPI displays —
      // see lib/map/canvas-quality.ts. (The context is created once here; the
      // 3D-model layer adopts this same context.)
      ...resolveCanvasQuality(window.devicePixelRatio),
      minZoom: 6,
      maxZoom: 20,
      // Allow steeper pitch for the 3D-model view (default max is 60, which
      // leaves no headroom when we want a dramatic low-angle of the mosque).
      maxPitch: 75,
      // OSM-derived tiles require attribution. Barikoi adds its own attribution
      // via the style; the AttributionControl shows the active source attributions.
      attributionControl: { compact: true },
      hash: "map",
    });

    // Add navigation control
    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "top-right"
    );

    // Add fullscreen control
    map.addControl(new maplibregl.FullscreenControl(), "top-right");

    // Add scale control
    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: "metric",
      }),
      "bottom-left"
    );

    map.on("load", () => {
      setMapLoaded(true);
    });

    // `move` ও `zoom` হ্যান্ডলার আগে প্রতি ফ্রেমে স্টোর লিখত (60×/s)। rAF কো-অলেসিংয়ের
    // মাধ্যমে একাধিক ইভেন্টকে পরবর্তী ফ্রেমে একবার লিখতে থ্রটল করা হয়েছে (অডিট:
    // "move handler writes the store ~60×/s during pan")।
    let moveRafId: number | null = null;
    let zoomRafId: number | null = null;
    const flushMove = () => {
      moveRafId = null;
      const c = map.getCenter();
      setCenter([c.lng, c.lat]);
      setZoom(map.getZoom());
    };
    const flushZoom = () => {
      zoomRafId = null;
      setZoom(map.getZoom());
    };

    map.on("move", () => {
      if (moveRafId != null) return;
      moveRafId = requestAnimationFrame(flushMove);
    });

    map.on("zoom", () => {
      if (zoomRafId != null) return;
      zoomRafId = requestAnimationFrame(flushZoom);
    });

    mapRef.current = map;
    setMapInstance(map);

    return () => {
      if (moveRafId != null) cancelAnimationFrame(moveRafId);
      if (zoomRafId != null) cancelAnimationFrame(zoomRafId);
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
    // Initialize map once with initial store values - these are only used for initial setup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Configure terrain
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const terrainSource = "maptiler-terrain";
    const hillshadeLayerId = "hillshade";
    const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

    if (!maptilerKey) {
      console.warn("MapTiler API key not found. Terrain will not be available.");
      return;
    }

    // Add terrain source if it doesn't exist
    if (!map.getSource(terrainSource)) {
      map.addSource(terrainSource, {
        type: "raster-dem",
        url: `https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=${maptilerKey}`,
        tileSize: 256,
      });
    }

    // Add or remove hillshade layer for terrain coloring
    if (showTerrain) {
      if (!map.getLayer(hillshadeLayerId)) {
        map.addLayer({
          id: hillshadeLayerId,
          source: terrainSource,
          type: "hillshade",
          layout: { visibility: "visible" },
          paint: {
            "hillshade-shadow-color": "#1a1a2e",
            "hillshade-highlight-color": "#F5F0E5",
            "hillshade-accent-color": "#2d2d4a",
            "hillshade-illumination-direction": 315,
            "hillshade-exaggeration": 0.5,
          },
        });
      }
      map.setTerrain({ source: terrainSource, exaggeration: 1 });
      // Wait for terrain to load before changing pitch, with fallback
      const terrainTimeout = setTimeout(() => {
        programmaticEaseTo({ pitch: 60, duration: 1000 });
      }, 500);
      map.once("terrainloaded", () => {
        clearTimeout(terrainTimeout);
        programmaticEaseTo({ pitch: 60, duration: 1000 });
      });
    } else {
      if (map.getLayer(hillshadeLayerId)) {
        map.removeLayer(hillshadeLayerId);
      }
      map.setTerrain(null);
      // Reset to flat view immediately
      programmaticEaseTo({ pitch: 0, duration: 1000 });
    }
  }, [mapLoaded, showTerrain, programmaticEaseTo]);

  // 3D models: the Masjid + clock tower custom three.js layers. Layers are
  // CREATED ONCE on the first toggle-on (bytes cached in Cache Storage, parsed
  // instances cached in three-model-layer), and from then on the 3D button only
  // flips visibility via handle.setActive — the production toggle semantic. No
  // re-download, re-parse or GPU rebuild per toggle. three.js is
  // dynamic-imported so it stays out of the SSR bundle and only loads when the
  // user opts in. While on, the basemap building layers are hidden so the
  // models stand alone.
  //
  // ALIGNING A MODEL (both are aligned; nothing to do right now)
  // ------------------------------------------------------------
  // Defaults are the baked constants in lib/map/model-config.ts; both layers
  // render them every time (the dev tuner is DISABLED). To re-align a model or
  // tune a future GLB, re-mount the dev tuner at the bottom of this component:
  // pass the model's buildInitial*Transform / a formatConfig that emits its
  // constant names, keep a transform state fed from handle.transform, and set
  // the layer's `initial:` to loadTunedModelTransform(<model>) ?? the builder.
  // Adjust live, click "Copy config", paste into model-config.ts, then remove
  // the tuner again (it must not ship).
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    show3DModelRef.current = show3DModel;

    // Hide/show the competing basemap building layers in sync with the model.
    // Do this regardless of the async GLB load so the basemap isn't cluttered
    // the moment the toggle flips. Idempotent per layer.
    const setBuildingLayersVisibility = (visible: boolean) => {
      for (const id of BASEMAP_3D_HIDDEN_LAYERS) {
        if (map.getLayer(id)) {
          try {
            map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
          } catch {
            // Layer exists but has no layout.visibility (e.g. already removed) —
            // ignore and move on.
          }
        }
      }
    };
    const syncBuildingLayerVisibility = () => setBuildingLayersVisibility(!show3DModelRef.current);

    setBuildingLayersVisibility(!show3DModel);
    map.on("styledata", syncBuildingLayerVisibility);

    // Create both layers if they don't exist yet (first toggle, or a remount
    // after navigation — the parsed-instance cache makes that instant).
    // Guarded by a booting flag so rapid toggles never double-create.
    const ensure3DLayers = async () => {
      if (modelsBootingRef.current) return;
      modelsBootingRef.current = true;
      try {
        const [{ createModelLayer }, { prepareClockTower }] = await Promise.all([
          import("@/lib/map/three-model-layer"),
          import("@/lib/map/clock-tower"),
        ]);
        const currentMap = mapRef.current;
        if (!currentMap) return;

        // Helper so both models insert at the same spot: just below the POI/label
        // symbols so POIs, road names, place labels etc. render ON TOP. Anchor =
        // the last layer of the hidden building group (building-metro, index ~92
        // in the Barikoi style); everything after it stays above.
        const addBelowLabels = (layer: maplibregl.CustomLayerInterface) => {
          if (currentMap.getLayer("building-metro")) {
            currentMap.addLayer(layer, "building-metro");
          } else {
            // Fallback if a future style omits that layer — insert above everything.
            currentMap.addLayer(layer);
          }
        };

        // Idempotent guards for StrictMode's dev double-invoke and rapid toggles.
        if (!modelHandlesRef.current.masjid && !currentMap.getLayer(MODEL_LAYER_ID)) {
          const handle = createModelLayer({
            id: MODEL_LAYER_ID,
            url: MODEL_URL,
            cacheKey: MODEL_LAYER_ID,
            // Baked config only — the Masjid is already aligned.
            initial: buildInitialModelTransform(),
            onLoadProgress: (loaded, total) => setModelLoadProgress(total > 0 ? loaded / total : 0),
            onLoadOK: () => {
              modelLoadOutcomeRef.current = "ready";
              setModelLoadState("ready");
              setModelLoadProgress(1);
            },
            onLoadError: (err) => {
              console.error("3D model failed to load:", err);
              modelLoadOutcomeRef.current = "error";
              setModelLoadState("error");
            },
          });
          addBelowLabels(handle.layer);
          modelHandlesRef.current.masjid = handle;
        }

        // Clock tower beside the mosque — baked config only (aligned with the
        // dev tuner; final values live in model-config.ts).
        if (!modelHandlesRef.current.tower && !currentMap.getLayer(CLOCK_TOWER_LAYER_ID)) {
          const towerHandle = createModelLayer({
            id: CLOCK_TOWER_LAYER_ID,
            url: CLOCK_TOWER_URL,
            cacheKey: CLOCK_TOWER_LAYER_ID,
            initial: buildInitialClockTowerTransform(),
            // The tower's flat Lambert materials need the brighter ambient the
            // standalone prototype was tuned with.
            lighting: { ambient: 2.0, directional: 0.55 },
            onModelReady: prepareClockTower,
            // The tower is a bonus beside the mosque — log failures instead of
            // hijacking the masjid-driven progress overlay.
            onLoadError: (err) => console.error("Clock tower model failed to load:", err),
          });
          addBelowLabels(towerHandle.layer);
          modelHandlesRef.current.tower = towerHandle;
        }
      } finally {
        modelsBootingRef.current = false;
      }
    };

    if (!show3DModel) {
      // OFF: hide both models (they stay cached for instant re-activation) and
      // ease the camera back to flat. The layers are NOT removed.
      modelHandlesRef.current.masjid?.setActive(false);
      modelHandlesRef.current.tower?.setActive(false);
      setModelLoadState("idle");
      setModelLoadProgress(0);
      programmaticEaseTo({ pitch: 0, duration: 1000 });
      return () => {
        map.off("styledata", syncBuildingLayerVisibility);
      };
    }

    // ON: create if needed (instant when cached), then reveal. Already loaded
    // (or failed) this session → apply that outcome directly: the layers are
    // NOT re-added on toggle, so no onLoadOK/onLoadError will fire again to
    // clear a "loading" state — without this the overlay would sit at 0%
    // forever while the model happily renders.
    const outcome = modelLoadOutcomeRef.current;
    setModelLoadState(outcome ?? "loading");
    setModelLoadProgress(outcome === "ready" ? 1 : 0);

    void ensure3DLayers().then(() => {
      modelHandlesRef.current.masjid?.setActive(true);
      modelHandlesRef.current.tower?.setActive(true);
      // If the user toggled OFF while the first load was still booting, respect
      // the latest state instead of flashing the models on.
      if (!show3DModelRef.current) {
        modelHandlesRef.current.masjid?.setActive(false);
        modelHandlesRef.current.tower?.setActive(false);
        return;
      }
      programmaticFlyTo({
        center: MODEL_ORIGIN,
        zoom: 16.5,
        pitch: 60,
        duration: 1500,
      });
    });

    return () => {
      map.off("styledata", syncBuildingLayerVisibility);
    };
  }, [mapLoaded, show3DModel, programmaticFlyTo, programmaticEaseTo]);

  // ----- ৩ডি মডেল ব্যাকগ্রাউন্ড প্রি-ফেচ -----
  // ম্যাপ স্থির হওয়ার পর idle-এ শুধু সস্তা মডেলগুলো নামানো হয় (PREFETCHABLE_
  // MODEL_URLS — ~63MB মসজিদ GLB এখনো অনেক ভারী, তাই নয়), সেটাও সংযোগ
  // অনুমতি দিলে (Data Saver / 2G-3G বাদ)। ফলে "3D" চাপার আগেই ক্লক টাওয়ার
  // প্রস্তুত থাকে; মসজিদটি বাটন স্পর্শের সাথে-সাথে (intent preload, page.tsx)
  // নামতে শুরু করে।
  useEffect(() => {
    if (!mapLoaded) return;
    whenIdle(() => {
      pruneDeprecatedModelCaches();
      for (const url of PREFETCHABLE_MODEL_URLS) {
        void prefetchModel(url);
      }
    });
  }, [mapLoaded]);

  // Add/update gate markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const markersMap = gateMarkersRef.current;

    // Remove all existing gate markers
    markersMap.forEach((marker) => marker.remove());
    markersMap.clear();

    if (showGates) {
      // Add gate markers
      HARAM_GATES.forEach((gate) => {
        const isSelected = selectedGate?.id === gate.id;
        const el = createGateMarkerElement(
          gate.type,
          isSelected,
          () => onGateClick?.(gate.id),
          (gate.name as string) ?? "গেট"
        );

        const marker = new Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(gate.location.coordinates as [number, number])
          .addTo(map);

        markersMap.set(gate.id, marker);
      });
    }
  }, [mapLoaded, showGates, selectedGate?.id, onGateClick]);

  // গেট বাউন্ডসে মানচিত্র সামঞ্জস্য - শুধু গেট টগল/লোডে, অন্য রি-রেন্ডারে নয়।
  // এটি আলাদা করা হয়েছে যাতে ট্যাব পরিবর্তন বা লোকেশন আপডেটের মতো আকস্মিক রি-রেন্ডারে
  // গাইডের ক্যামেরা জুম (যেমন তওয়াফে ১৮) গেট বাউন্ডসে (১৪.৮৫) পাল্টে না যায়।
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showGates) return;
    programmaticFitBounds(getGatesBounds(HARAM_GATES), {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      duration: 1000,
    });
  }, [mapLoaded, showGates, programmaticFitBounds]);

  // Add/update hotel markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const markersMap = hotelMarkersRef.current;

    // Remove all existing hotel markers
    markersMap.forEach((marker) => marker.remove());
    markersMap.clear();

    if (showHotels) {
      // Add hotel markers
      NEARBY_HOTELS.forEach((hotel) => {
        const isSelected = selectedHotel?.id === hotel.id;
        const el = createHotelMarkerElement(
          hotel.priceLevel,
          isSelected,
          () => onHotelClick?.(hotel.id),
          (hotel.name as string) ?? "হোটেল"
        );

        const marker = new Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(hotel.location.coordinates as [number, number])
          .addTo(map);

        markersMap.set(hotel.id, marker);
      });
    }
  }, [mapLoaded, showHotels, selectedHotel?.id, onHotelClick]);

  // Add/update tourist place markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    const markersMap = touristPlaceMarkersRef.current;

    // Remove all existing tourist place markers
    markersMap.forEach((marker) => marker.remove());
    markersMap.clear();

    if (showTouristPlaces) {
      // Filter places by selected city (Makkah or Madinah), or show all if null
      const placesToShow = touristCity
        ? TOURIST_PLACES.filter((place) => place.city === touristCity)
        : TOURIST_PLACES;

      // Add tourist place markers
      placesToShow.forEach((place) => {
        const isSelected = selectedTouristPlace?.id === place.id;
        const el = createTouristPlaceMarkerElement(
          place.category,
          isSelected,
          place.popular,
          () => onTouristPlaceClick?.(place.id),
          (place.name as string) ?? "চিহ্নিত স্থান"
        );

        const marker = new Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(place.location.coordinates as [number, number])
          .addTo(map);

        markersMap.set(place.id, marker);
      });

      // Optionally fit bounds to show the selected city's places
      if (placesToShow.length > 0 && touristCity === "makkah") {
        // For Makkah, we can fit bounds since places are clustered
        const bounds: LngLatBoundsLike = [
          [
            Math.min(...placesToShow.map((p) => p.location.coordinates[0])),
            Math.min(...placesToShow.map((p) => p.location.coordinates[1])),
          ],
          [
            Math.max(...placesToShow.map((p) => p.location.coordinates[0])),
            Math.max(...placesToShow.map((p) => p.location.coordinates[1])),
          ],
        ];
        programmaticFitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
        });
      }
    }
  }, [
    mapLoaded,
    showTouristPlaces,
    selectedTouristPlace?.id,
    onTouristPlaceClick,
    touristCity,
    programmaticFitBounds,
  ]);

  // Add/update user location marker.
  //
  // মার্কারটি একবারই তৈরি হয় (অবস্থান পাওয়া গেলে বা টগল বদলালে); প্রতি GPS
  // ফিক্সে শুধু marker.setLngLat + accuracy সোর্সের setData হয়। আগে প্রতি
  // ফিক্সে DOM এলিমেন্ট ভেঙে নতুন করে বানানো হতো (watchPosition ~১ সেকেন্ডে
  // একবার) — মোবাইলে সেই layout/GC চার্ণই জ্যাঙ্কের বড় একটি উৎস ছিল।
  const hasUserPosition = latitude !== null && longitude !== null;
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showUserLocation || !hasUserPosition) return;
    const map = mapRef.current;

    // create-effect শুধু "অবস্থান আছে কি না" দেখে; তাই মানগুলো স্টোর থেকে
    // সরাসরি নেওয়া হয় — প্রতি ফিক্সে এই ইফেক্ট পুনরায় চলে না।
    const { latitude: lat, longitude: lng, accuracy: acc } = useLocationStore.getState();
    if (lat === null || lng === null) return;

    const el = createUserLocationElement();
    const marker = new Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat([lng, lat])
      .addTo(map);
    userLocationMarkerRef.current = marker;

    // Accuracy ring
    if (!map.getSource("user-accuracy")) {
      map.addSource("user-accuracy", createUserAccuracySource(lat, lng, acc));
    }
    if (!map.getLayer(USER_ACCURACY_LAYER_ID)) {
      const layerConfigs = getLayerConfigs();
      map.addLayer({
        id: USER_ACCURACY_LAYER_ID,
        type: "fill",
        source: "user-accuracy",
        paint: layerConfigs.userAccuracy.paint,
      });
    }

    return () => {
      marker.remove();
      userLocationMarkerRef.current = null;
    };
  }, [mapLoaded, showUserLocation, hasUserPosition]);

  // প্রতি GPS ফিক্সে মার্কার সরানো + accuracy বৃত্ত আপডেট (কোনো DOM পুনঃনির্মাণ নেই)।
  useEffect(() => {
    const marker = userLocationMarkerRef.current;
    const map = mapRef.current;
    if (!marker || !map || latitude === null || longitude === null) return;
    marker.setLngLat([longitude, latitude]);
    (map.getSource("user-accuracy") as any)?.setData(
      createUserAccuracySource(latitude, longitude, accuracy).data
    );
  }, [latitude, longitude, accuracy]);

  // Fly to selected gate
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedGate) return;

    programmaticFlyTo({
      center: selectedGate.location.coordinates as [number, number],
      zoom: 17,
      duration: 1000,
    });
  }, [selectedGate, mapLoaded, programmaticFlyTo]);

  // Fly to selected hotel
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedHotel) return;

    programmaticFlyTo({
      center: selectedHotel.location.coordinates as [number, number],
      zoom: 17,
      duration: 1000,
    });
  }, [selectedHotel, mapLoaded, programmaticFlyTo]);

  // Fly to selected tourist place
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedTouristPlace) return;

    programmaticFlyTo({
      center: selectedTouristPlace.location.coordinates as [number, number],
      zoom: 16,
      duration: 1000,
    });
  }, [selectedTouristPlace, mapLoaded, programmaticFlyTo]);

  // Update route
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    if (!map.getSource("route")) {
      map.addSource("route", createRouteSource(null));
    }
    (map.getSource("route") as any)?.setData(createRouteSource(activeRoute).data);

    const layerConfigs = getLayerConfigs();

    if (activeRoute) {
      if (!map.getLayer(ROUTE_CASING_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_CASING_LAYER_ID,
          type: "line",
          source: "route",
          paint: layerConfigs.routeCasing.paint,
          layout: layerConfigs.routeCasing.layout,
        });
      }

      if (!map.getLayer(ROUTE_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_LAYER_ID,
          type: "line",
          source: "route",
          paint: layerConfigs.routeLine.paint,
          layout: layerConfigs.routeLine.layout,
        });
      }

      // Fit bounds to show route
      if (activeRoute.geometry.length > 0) {
        const coords = activeRoute.geometry;
        const bounds: LngLatBoundsLike = [
          [Math.min(...coords.map((c) => c[0])), Math.min(...coords.map((c) => c[1]))],
          [Math.max(...coords.map((c) => c[0])), Math.max(...coords.map((c) => c[1]))],
        ];
        programmaticFitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 100, right: 100 },
          duration: 1000,
        });
      }
    } else {
      if (map.getLayer(ROUTE_LAYER_ID)) {
        map.removeLayer(ROUTE_LAYER_ID);
      }
      if (map.getLayer(ROUTE_CASING_LAYER_ID)) {
        map.removeLayer(ROUTE_CASING_LAYER_ID);
      }
    }
  }, [activeRoute, mapLoaded, programmaticFitBounds]);

  // ----- ওমরাহ: আনুষ্ঠানিক ওভারলে ও পবিত্র বিন্দু -----
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const allLayerIds = [
      ...UMRAH_RITUAL_LAYERS.map((l) => l.id),
      SACRED_POINTS_LAYER,
      UMRAH_JOURNEY_LAYER,
    ];
    const allSourceIds = [UMRAH_OVERLAY_SOURCE, UMRAH_SACRED_SOURCE, UMRAH_JOURNEY_SOURCE];

    const removeUmrah = () => {
      const m = mapRef.current;
      if (!m) return;
      allLayerIds.forEach((id) => {
        if (m.getLayer(id)) m.removeLayer(id);
      });
      allSourceIds.forEach((src) => {
        if (m.getSource(src)) m.removeSource(src);
      });
    };

    if (!showUmrah) {
      removeUmrah();
      return;
    }

    // সোর্স যোগ
    if (!map.getSource(UMRAH_OVERLAY_SOURCE)) {
      map.addSource(UMRAH_OVERLAY_SOURCE, {
        type: "geojson",
        data: createRitualOverlayGeoJSON() as any,
      });
    }
    if (!map.getSource(UMRAH_SACRED_SOURCE)) {
      map.addSource(UMRAH_SACRED_SOURCE, {
        type: "geojson",
        data: createSacredPointsGeoJSON() as any,
      });
    }

    // লেয়ার যোগ (idempotent)
    UMRAH_RITUAL_LAYERS.forEach((layer) => {
      if (!map.getLayer(layer.id)) {
        map.addLayer({ ...(layer as any), source: UMRAH_OVERLAY_SOURCE });
      }
    });
    if (!map.getLayer(SACRED_POINTS_LAYER)) {
      map.addLayer({ ...(sacredPointsLayer as any), source: UMRAH_SACRED_SOURCE });
    }

    return () => {
      removeUmrah();
    };
  }, [showUmrah, mapLoaded]);

  // ----- ওমরাহ: জীবন্ত অঙ্কন - কাউন্টার বাড়লে এক পূর্ণ চক্কর/পাক অ্যানিমেশন -----
  // তওয়াফ: হাজি পুরো বৃত্ত ধরে ঘড়ির বিপরীত দিকে হাঁটে। সাঈ: পুরো করিডোর (দিক পালায়)।
  // আনুষ্ঠানিক পথ (একক রিং/করিডোর) UMRAH_RITUAL_LAYERS থেকে সবসময় দৃশ্যমান।
  useEffect(() => {
    const prev = prevTawafCounterRef.current;
    prevTawafCounterRef.current = tawafCounter;
    if (prev != null && tawafCounter > prev) {
      playTawafDraw(prev); // prev = সদ্য-সম্পন্ন চক্কর নম্বর
    }
  }, [tawafCounter, playTawafDraw]);

  useEffect(() => {
    const prev = prevSaiCounterRef.current;
    prevSaiCounterRef.current = saiCounter;
    if (prev != null && saiCounter > prev) {
      playSaiDraw(prev); // prev = সদ্য-সম্পন্ন পাক নম্বর (দিক নির্ধারণ করে)
    }
  }, [saiCounter, playSaiDraw]);

  // ----- ওমরাহ: চক্কর/পাক সম্পন্ন হলে আনুষ্ঠানিক রিং-এ সংক্ষিপ্ত ঝলক -----
  // অঙ্কন অ্যানিমেশনের পাশাপাশি রিংও ঝলক দেয়, যাতে মানচিত্র "+1" ট্যাপে সংযুক্তভাবে
  // প্রতিক্রিয়া দেখায়। prefers-reduced-motion হলে flashRitualRing নিজে ঝলক বাদ দেয়।
  const prevTawafFlashRef = useRef<number | null>(null);
  const prevSaiFlashRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showUmrah || !mapLoaded || !mapRef.current) return;
    const prev = prevTawafFlashRef.current;
    prevTawafFlashRef.current = tawafCounter;
    if (prev == null || tawafCounter <= prev) return;
    flashRitualRing(mapRef.current, TAWAF_RING_LAYER, MAP_COLORS.pilgrim, MAP_COLORS.route); // gold flash -> emerald base
  }, [tawafCounter, showUmrah, mapLoaded]);

  useEffect(() => {
    if (!showUmrah || !mapLoaded || !mapRef.current) return;
    const prev = prevSaiFlashRef.current;
    prevSaiFlashRef.current = saiCounter;
    if (prev == null || saiCounter <= prev) return;
    flashRitualRing(mapRef.current, SAI_CORRIDOR_LAYER, MAP_COLORS.pilgrim, MAP_COLORS.route);
  }, [saiCounter, showUmrah, mapLoaded]);

  // ----- ওমরাহ: ধাপ মার্কার ও যাত্রা রেখা -----
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showUmrah) return;
    const map = mapRef.current;
    const markersMap = umrahStepMarkersRef.current;

    // বিদ্যমান মার্কার সরানো
    markersMap.forEach((marker) => marker.remove());
    markersMap.clear();

    // প্রতিটি ধাপের প্রথম অ্যাংকর থেকে অবস্থান; অ্যাংকর না থাকলে মার্কার নেই
    const positioned: {
      id: string;
      coords: [number, number];
      order: number;
      status: UmrahStepStatus;
    }[] = [];

    umrahStepIds.forEach((stepId, index) => {
      const step = getStepById(stepId);
      if (!step || !step.anchors || step.anchors.length === 0) return;
      const anchor = getAnchorById(step.anchors[0]);
      if (!anchor) return;

      const counterValue = umrahCounters[stepId] ?? step.counter?.min ?? 0;
      const done = isStepComplete(step, counterValue, !!umrahCompleted[stepId]);
      const status: UmrahStepStatus = done
        ? "completed"
        : index === umrahCurrentIndex
          ? "active"
          : "upcoming";
      // ধাপের সিরিয়াল নম্বর = সমাধানকৃত তালিকায় অবস্থান (1-থেকে শুরু)
      positioned.push({
        id: stepId,
        coords: anchor.location.coordinates,
        order: index + 1,
        status,
      });
    });

    // যাত্রা রেখা (অবস্থান সহ ধাপগুলোর মধ্যে বিচ্ছিন্ন রেখা)
    if (positioned.length >= 2) {
      const journeyData = {
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: positioned.map((p) => p.coords),
        },
      };
      if (!map.getSource(UMRAH_JOURNEY_SOURCE)) {
        map.addSource(UMRAH_JOURNEY_SOURCE, { type: "geojson", data: journeyData as any });
      } else {
        (map.getSource(UMRAH_JOURNEY_SOURCE) as any)?.setData(journeyData);
      }
      if (!map.getLayer(UMRAH_JOURNEY_LAYER)) {
        map.addLayer({ ...(umrahJourneyLayer as any), source: UMRAH_JOURNEY_SOURCE });
      }
    }

    // DOM মার্কার যোগ
    positioned.forEach((p) => {
      const el = createUmrahStepMarkerElement(p.order, p.status, () => onUmrahStepClick?.(p.id));
      const marker = new Marker({ element: el, anchor: "center" }).setLngLat(p.coords).addTo(map);
      markersMap.set(p.id, marker);
    });
  }, [
    showUmrah,
    mapLoaded,
    umrahStepIds,
    umrahCurrentIndex,
    umrahCompleted,
    umrahCounters,
    onUmrahStepClick,
  ]);

  // ----- ওমরাহ: সক্রিয় ধাপের অ্যাংকরে ফ্লাই-টু (মিকাত সারসংক্ষেপ চলাকালীন বন্ধ) -----
  // শুধুমাত্র ধাপ পরিবর্তনে ক্যামেরা সরে - কাউন্টার (চক্কর/পাক) বাড়লে নয়।
  // ব্যবহারকারী ম্যানুয়ালি মানচিত্র সরালে userTookControl সত্য থাকে; তখন Recenter দিয়ে ফেরা যায়।
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showUmrah || showMiqatOverview) return;
    const activeId = umrahStepIds[umrahCurrentIndex];
    if (!activeId) return;
    const step = getStepById(activeId);
    if (!step?.anchors?.length) return;
    // ihram ধাপে মিকাত সীমানা ভূমিকা অ্যানিমেশন নিজ ক্যামেরা নিয়ন্ত্রণ করে।
    if (step.stage === "ihram") return;
    const anchor = getAnchorById(step.anchors[0]);
    if (!anchor) return;

    // তওয়াফ/সাঈ-এর সময় কাছে জুম করা; অন্যথা মাঝারি
    const targetZoom = step.stage === "tawaf" || step.stage === "sai" ? 18 : 16;
    programmaticFlyTo({
      center: anchor.location.coordinates,
      zoom: targetZoom,
      duration: 1200,
    });
  }, [showUmrah, showMiqatOverview, mapLoaded, umrahCurrentIndex, umrahStepIds, programmaticFlyTo]);

  // ----- ওমরাহ: মিকাত সারসংক্ষেপ মানচিত্র (৫ পয়েন্টের রিং) -----
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const markersMap = miqatMarkersRef.current;

    // বন্ধ হলে বা মোড বন্ধ থাকলে মার্কার পরিষ্কার
    if (!showMiqatOverview) {
      markersMap.forEach((marker) => marker.remove());
      markersMap.clear();
      return;
    }

    // ব্যবহারকারীর যাত্রাপথ থেকে সক্রিয় মিকাত নির্ধারণ
    const activeMiqatId = umrahProfile
      ? resolveMiqatForTravelPath(umrahProfile.travelPath).miqatId
      : null;

    // পুরোনো মার্কার পরিষ্কার করে নতুন করে বসানো
    markersMap.forEach((marker) => marker.remove());
    markersMap.clear();

    MIQAT_POINTS.forEach((miqat) => {
      const isActive = miqat.id === activeMiqatId;
      const el = createMiqatMarkerElement(miqat.name.bn, isActive);
      el.addEventListener("click", () => onMiqatClick?.(miqat.id));
      // Keyboard activation (Enter/Space) — miqat markers are focusable via makeAccessible.
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onMiqatClick?.(miqat.id);
        }
      });
      const marker = new Marker({ element: el, anchor: "center" })
        .setLngLat(miqat.location.coordinates)
        .addTo(map);
      markersMap.set(miqat.id, marker);
    });

    // সমস্ত মিকাত ঘিরে মানচিত্র সামঞ্জস্য করা
    programmaticFitBounds(miqatRingBounds(), {
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      duration: 1000,
    });
  }, [showMiqatOverview, mapLoaded, umrahProfile, onMiqatClick, programmaticFitBounds]);

  // ----- তওয়াফ/সাঈ রাউন্ড ট্র্যাকার (HUD) -----
  // সক্রিয় ধাপ তওয়াফ/সাঈ হলে বর্তমান চক্কর/পাক মানচিত্রের ওপর দেখানো হয়, যাতে হাজি
  // ট্র্যাক করতে পারেন তিনি কোন চক্করে আছেন। মিকাত সারসংক্ষেপ বা অ-কাউন্টার ধাপে null।
  const ritualHud = (() => {
    if (!showUmrah || showMiqatOverview) return null;
    const id = umrahStepIds[umrahCurrentIndex];
    const step = id ? getStepById(id) : null;
    if (!step?.counter) return null;
    if (step.stage !== "tawaf" && step.stage !== "sai") return null;
    return {
      stageLabel: step.stage === "tawaf" ? "তওয়াফ" : "সাঈ",
      roundLabel: step.counter.label.bn,
      value: umrahCounters[step.id] ?? step.counter.min,
      max: step.counter.max,
    };
  })();

  // Recenter টার্গেট - বর্তমান গাইড ধাপের অ্যাংকর (মিকাত সারসংক্ষেপ বা অ্যাংকরহীন ধাপে null)
  const recenterTarget = (() => {
    if (!showUmrah || showMiqatOverview) return null;
    const activeId = umrahStepIds[umrahCurrentIndex];
    const step = activeId ? getStepById(activeId) : null;
    const anchor = step?.anchors?.length ? getAnchorById(step.anchors[0]) : null;
    if (!step || !anchor) return null;
    return { coords: anchor.location.coordinates, stage: step.stage };
  })();

  const handleRecenter = () => {
    if (!recenterTarget) return;
    const targetZoom = recenterTarget.stage === "tawaf" || recenterTarget.stage === "sai" ? 18 : 16;
    programmaticFlyTo({ center: recenterTarget.coords, zoom: targetZoom, duration: 1000 });
  };

  // ব্যবহারকারী ম্যানুয়ালি মানচিত্র সরিয়েছে এবং একটি গাইড ধাপ সক্রিয় - Recenter দেখাও
  const showRecenter = userTookControl && recenterTarget !== null;

  return (
    <MapInstanceProvider map={mapInstance}>
      <div className={`relative w-full h-full ${className}`}>
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ position: "relative" }}
          role="application"
          aria-label="মক্কা-মদিনা ইন্টারঅ্যাক্টিভ ম্যাপ — গেট, হোটেল ও ওমরাহ গাইড দেখুন"
        />
        {ritualHud && (
          <RitualRoundHud
            stageLabel={ritualHud.stageLabel}
            roundLabel={ritualHud.roundLabel}
            value={ritualHud.value}
            max={ritualHud.max}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[40]"
          />
        )}
        {contextualLandmarkHint && !hintDismissed && (
          <LandmarkHint
            title={contextualLandmarkHint.title}
            description={contextualLandmarkHint.description}
            anchorName={contextualLandmarkHint.anchorName}
            onDismiss={() => setHintDismissed(true)}
            className="absolute bottom-28 left-4 z-[40] sm:bottom-8"
          />
        )}
        {showRecenter && (
          <RecenterButton
            onClick={handleRecenter}
            className="absolute bottom-28 right-4 z-[40] sm:bottom-8"
          />
        )}
        {show3DModel &&
          ((modelLoadState === "loading" && overlayDelayElapsed) || modelLoadState === "error") && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface/90 backdrop-blur-xl border border-border/50 shadow-xl">
              {modelLoadState === "loading" && (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-primary shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span className="text-sm text-foreground whitespace-nowrap">
                    {/* ডাউনলোড ১০০%-এর পরেও ৬৩MB Draco পার্সে কয়েক সেকেন্ড লাগে —
                      তখন "প্রস্তুত হচ্ছে" দেখানো হয়, "লোড হচ্ছে ১০০%" ঝুলে থাকে না। */}
                    {modelLoadProgress >= 1
                      ? "৩ডি মডেল প্রস্তুত হচ্ছে…"
                      : `৩ডি মডেল লোড হচ্ছে ${Math.round(modelLoadProgress * 100)}%`}
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-[width] duration-200 ease-out"
                      style={{
                        width: `${Math.round(modelLoadProgress * 100)}%`,
                      }}
                    />
                  </div>
                </>
              )}
              {modelLoadState === "error" && (
                <span className="text-sm text-foreground whitespace-nowrap">
                  মডেল লোডে সমস্যা — আবার চেষ্টা করুন
                </span>
              )}
            </div>
          )}
        {/* DEV-ONLY live tuner for aligning 3D models. Intentionally disabled —
            both layers render the baked defaults in model-config.ts and
            BASEMAP_3D_HIDDEN_LAYERS hides the basemap buildings. To re-align,
            restore the ModelTuner import + a transform state fed from the
            layer's handle.transform, and un-comment (clock tower shown as the
            example; pass the matching buildInitial/formatConfig per model):
        {show3DModel && clockTowerTransform && process.env.NODE_ENV !== "production" && (
          <ModelTuner
            title="Clock Tower Tuner"
            transform={clockTowerTransform}
            buildInitial={buildInitialClockTowerTransform}
            formatConfig={formatClockTowerConfig}
            onChange={(t) => saveTunedModelTransform("clock-tower", t)}
            onRepaint={() => mapRef.current?.triggerRepaint()}
          />
        )} */}
      </div>
    </MapInstanceProvider>
  );
}
