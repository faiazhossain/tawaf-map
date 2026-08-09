"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import maplibregl, { Map as MapLibreMap, LngLatBoundsLike, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTawafCamera } from "@/lib/hooks/useTawafCamera";
import { useRitualDrawAnimation } from "@/lib/hooks/useRitualDrawAnimation";
import { useDirectionArrows } from "@/lib/hooks/useDirectionArrows";
import {
  useMapStore,
  useLocationStore,
  useGateStore,
  useRouteStore,
  useHotelStore,
  useTouristPlaceStore,
  useUmrahGuideStore,
} from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
import { TOURIST_PLACES } from "@/lib/data/tourist-places";
import { getStepById } from "@/lib/data/umrah/steps";
import { getAnchorById } from "@/lib/data/umrah/anchors";
import { isStepComplete } from "@/lib/data/umrah/sequence";
import { MIQAT_POINTS, resolveMiqatForTravelPath, miqatRingBounds } from "@/lib/data/umrah/miqat";
import {
  UMRAH_OVERLAY_SOURCE,
  UMRAH_SACRED_SOURCE,
  UMRAH_JOURNEY_SOURCE,
  UMRAH_RITUAL_LAYERS,
  SACRED_POINTS_LAYER,
  UMRAH_JOURNEY_LAYER,
  TAWAF_DRAW_SOURCE,
  SAI_DRAW_SOURCE,
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

interface MapViewProps {
  className?: string;
  showGates?: boolean;
  showHotels?: boolean;
  showTouristPlaces?: boolean;
  touristCity?: "makkah" | "madinah" | null;
  showUserLocation?: boolean;
  showTerrain?: boolean;
  showUmrah?: boolean;
  showMiqatOverview?: boolean;
  onGateClick?: (gateId: string) => void;
  onHotelClick?: (hotelId: string) => void;
  onTouristPlaceClick?: (placeId: string) => void;
  onUmrahStepClick?: (stepId: string) => void;
  onMiqatClick?: (miqatId: string) => void;
}

// Barikoi Map Style URL
const BARIKOI_MAP_STYLE =
  "https://map.barikoi.com/styles/osm_barikoi_pl/style.json?key=MjY0NDpHRUswODE3R1VV";

export function MapView({
  className = "",
  showGates = true,
  showHotels = false,
  showTouristPlaces = false,
  touristCity = "makkah",
  showUserLocation = true,
  showTerrain = false,
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

  // Store state - use individual selectors to avoid object creation issues
  const center = useMapStore((state) => state.center);
  const zoom = useMapStore((state) => state.zoom);
  const bearing = useMapStore((state) => state.bearing);
  const pitch = useMapStore((state) => state.pitch);
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
  const activeStageId = umrahStepIds[umrahCurrentIndex];
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

  // Initialize map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BARIKOI_MAP_STYLE,
      center: [center[0], center[1]],
      zoom,
      bearing,
      pitch,
      minZoom: 6,
      maxZoom: 20,
      attributionControl: false,
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

    map.on("move", () => {
      const newCenter = map.getCenter();
      setCenter([newCenter.lng, newCenter.lat]);
      setZoom(map.getZoom());
    });

    map.on("zoom", () => {
      setZoom(map.getZoom());
    });

    mapRef.current = map;
    setMapInstance(map);

    return () => {
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
        const el = createGateMarkerElement(gate.type, isSelected);

        const marker = new Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(gate.location.coordinates as [number, number])
          .addTo(map);

        // Add click handler using DOM event (MapLibre's Marker uses standard DOM events for custom elements)
        el.addEventListener("click", () => {
          if (onGateClick) {
            onGateClick(gate.id);
          }
        });

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
        const el = createHotelMarkerElement(hotel.priceLevel, isSelected);

        const marker = new Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(hotel.location.coordinates as [number, number])
          .addTo(map);

        // Add click handler using DOM event (MapLibre's Marker uses standard DOM events for custom elements)
        el.addEventListener("click", () => {
          if (onHotelClick) {
            onHotelClick(hotel.id);
          }
        });

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
        const el = createTouristPlaceMarkerElement(place.category, isSelected, place.popular);

        const marker = new Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(place.location.coordinates as [number, number])
          .addTo(map);

        // Add click handler using DOM event
        el.addEventListener("click", () => {
          if (onTouristPlaceClick) {
            onTouristPlaceClick(place.id);
          }
        });

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

  // Add/update user location marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showUserLocation) return;

    const map = mapRef.current;

    // Remove existing marker
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }

    if (latitude !== null && longitude !== null) {
      const el = createUserLocationElement();

      const marker = new Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      userLocationMarkerRef.current = marker;

      // Add/update accuracy ring
      if (!map.getSource("user-accuracy")) {
        map.addSource("user-accuracy", createUserAccuracySource(null, null, null));
      }
      (map.getSource("user-accuracy") as any)?.setData(
        createUserAccuracySource(latitude, longitude, accuracy).data
      );

      if (!map.getLayer(USER_ACCURACY_LAYER_ID)) {
        const layerConfigs = getLayerConfigs();
        map.addLayer({
          id: USER_ACCURACY_LAYER_ID,
          type: "fill",
          source: "user-accuracy",
          paint: layerConfigs.userAccuracy.paint,
        });
      }
    }
  }, [mapLoaded, showUserLocation, latitude, longitude, accuracy]);

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
      allLayerIds.forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      allSourceIds.forEach((src) => {
        if (map.getSource(src)) map.removeSource(src);
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
      const el = createUmrahStepMarkerElement(p.order, p.status);
      el.addEventListener("click", () => onUmrahStepClick?.(p.id));
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
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" style={{ position: "relative" }} />
      {ritualHud && (
        <RitualRoundHud
          stageLabel={ritualHud.stageLabel}
          roundLabel={ritualHud.roundLabel}
          value={ritualHud.value}
          max={ritualHud.max}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[40]"
        />
      )}
      {showRecenter && (
        <RecenterButton
          onClick={handleRecenter}
          className="absolute bottom-28 right-4 z-[40] sm:bottom-8"
        />
      )}
    </div>
  );
}
