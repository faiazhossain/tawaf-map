"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, LngLatBoundsLike, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  useMapStore,
  useLocationStore,
  useGateStore,
  useRouteStore,
  useHotelStore,
} from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { NEARBY_HOTELS } from "@/lib/data/hotels";
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
  createUserLocationElement,
} from "@/lib/map/markers";

interface MapViewProps {
  className?: string;
  showGates?: boolean;
  showHotels?: boolean;
  showUserLocation?: boolean;
  onGateClick?: (gateId: string) => void;
  onHotelClick?: (hotelId: string) => void;
}

// Barikoi Map Style URL
const BARIKOI_MAP_STYLE =
  "https://map.barikoi.com/styles/osm_barikoi_pl/style.json?key=NDE2NzpVNzkyTE5UMUoy";

export function MapView({
  className = "",
  showGates = true,
  showHotels = false,
  showUserLocation = true,
  onGateClick,
  onHotelClick,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Store references to markers for removal/update
  const gateMarkersRef = useRef<Map<string, Marker>>(new Map());
  const hotelMarkersRef = useRef<Map<string, Marker>>(new Map());
  const userLocationMarkerRef = useRef<Marker | null>(null);

  // Store state - use individual selectors to avoid object creation issues
  const center = useMapStore((state) => state.center);
  const zoom = useMapStore((state) => state.zoom);
  const bearing = useMapStore((state) => state.bearing);
  const pitch = useMapStore((state) => state.pitch);
  const setCenter = useMapStore((state) => state.setCenter);
  const setZoom = useMapStore((state) => state.setZoom);

  // Location state - individual selectors to avoid object creation on every render
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const accuracy = useLocationStore((state) => state.accuracy);

  const selectedGate = useGateStore((state) => state.selectedGate.gate);
  const activeRoute = useRouteStore((state) => state.activeRoute);
  const selectedHotel = useHotelStore((state) => state.selectedHotel);

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
      minZoom: 12,
      maxZoom: 20,
      attributionControl: false,
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Initialize map once with initial store values - these are only used for initial setup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        // Add click handler
        el.addEventListener("click", () => {
          if (onGateClick) {
            onGateClick(gate.id);
          }
        });

        // Add hover cursor
        el.addEventListener("mouseenter", () => {
          el.style.cursor = "pointer";
        });
        el.addEventListener("mouseleave", () => {
          el.style.cursor = "";
        });

        markersMap.set(gate.id, marker);
      });

      // Fit bounds to show all gates
      map.fitBounds(getGatesBounds(HARAM_GATES), {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
      });
    }
  }, [mapLoaded, showGates, selectedGate?.id, onGateClick]);

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

        // Add click handler
        el.addEventListener("click", () => {
          if (onHotelClick) {
            onHotelClick(hotel.id);
          }
        });

        // Add hover cursor
        el.addEventListener("mouseenter", () => {
          el.style.cursor = "pointer";
        });
        el.addEventListener("mouseleave", () => {
          el.style.cursor = "";
        });

        markersMap.set(hotel.id, marker);
      });
    }
  }, [mapLoaded, showHotels, selectedHotel?.id, onHotelClick]);

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

    const map = mapRef.current;
    map.flyTo({
      center: selectedGate.location.coordinates as [number, number],
      zoom: 17,
      duration: 1000,
    });
  }, [selectedGate, mapLoaded]);

  // Fly to selected hotel
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedHotel) return;

    const map = mapRef.current;
    map.flyTo({
      center: selectedHotel.location.coordinates as [number, number],
      zoom: 17,
      duration: 1000,
    });
  }, [selectedHotel, mapLoaded]);

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
        map.fitBounds(bounds, {
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
  }, [activeRoute, mapLoaded]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full ${className}`}
      style={{ position: "relative" }}
    />
  );
}
