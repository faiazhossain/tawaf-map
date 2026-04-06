"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, LngLatBoundsLike } from "maplibre-gl";
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
import {
  createGatesSource,
  createUserLocationSource,
  createUserAccuracySource,
  createRouteSource,
  createHotelsSource,
  getGatesBounds,
} from "@/lib/map/sources";
import {
  getLayerConfigs,
  GATE_MARKER_LAYER_ID,
  GATE_LABEL_LAYER_ID,
  ROUTE_LAYER_ID,
  ROUTE_CASING_LAYER_ID,
  USER_LOCATION_LAYER_ID,
  USER_ACCURACY_LAYER_ID,
  HOTEL_MARKER_LAYER_ID,
  HOTEL_LABEL_LAYER_ID,
} from "@/lib/map/layers";

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
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

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

  // Add gates source and layers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showGates) return;

    const map = mapRef.current;

    // Remove existing layers first (before removing source)
    [GATE_MARKER_LAYER_ID, GATE_LABEL_LAYER_ID].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    // Then remove the source if it exists
    if (map.getSource("gates")) {
      map.removeSource("gates");
    }

    // Add gates source
    map.addSource("gates", createGatesSource(HARAM_GATES));

    // Add layers
    const layerConfigs = getLayerConfigs();

    map.addLayer({
      id: GATE_MARKER_LAYER_ID,
      type: "circle",
      source: "gates",
      paint: layerConfigs.gateMarkers.paint,
    });

    map.addLayer({
      id: GATE_LABEL_LAYER_ID,
      type: "symbol",
      source: "gates",
      layout: layerConfigs.gateLabels.layout,
      paint: layerConfigs.gateLabels.paint,
      minzoom: 15,
    });

    // Click handler for gates
    map.on("click", GATE_MARKER_LAYER_ID, (e) => {
      if (e.features && e.features[0]) {
        const gateId = e.features[0].properties?.id;
        if (gateId && onGateClick) {
          onGateClick(gateId);
        }
      }
    });

    // Cursor pointer on hover
    map.on("mouseenter", GATE_MARKER_LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", GATE_MARKER_LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });

    // Fit bounds to show all gates
    map.fitBounds(getGatesBounds(HARAM_GATES), {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      duration: 1000,
    });
  }, [mapLoaded, showGates, onGateClick]);

  // Add hotels source and layers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showHotels) return;

    const map = mapRef.current;

    // Remove existing layers first (before removing source)
    [HOTEL_MARKER_LAYER_ID, HOTEL_LABEL_LAYER_ID].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    // Then remove the source if it exists
    if (map.getSource("hotels")) {
      map.removeSource("hotels");
    }

    // Add hotels source
    map.addSource("hotels", createHotelsSource(NEARBY_HOTELS));

    // Add layers
    const layerConfigs = getLayerConfigs();

    map.addLayer({
      id: HOTEL_MARKER_LAYER_ID,
      type: "circle",
      source: "hotels",
      paint: layerConfigs.hotelMarkers.paint,
    });

    map.addLayer({
      id: HOTEL_LABEL_LAYER_ID,
      type: "symbol",
      source: "hotels",
      layout: layerConfigs.hotelLabels.layout,
      paint: layerConfigs.hotelLabels.paint,
      minzoom: 15,
    });

    // Click handler for hotels
    map.on("click", HOTEL_MARKER_LAYER_ID, (e) => {
      if (e.features && e.features[0]) {
        const hotelId = e.features[0].properties?.id;
        if (hotelId && onHotelClick) {
          onHotelClick(hotelId);
        }
      }
    });

    // Cursor pointer on hover
    map.on("mouseenter", HOTEL_MARKER_LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", HOTEL_MARKER_LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });
  }, [mapLoaded, showHotels, onHotelClick]);

  // Remove hotels when toggled off
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    if (!showHotels) {
      [HOTEL_MARKER_LAYER_ID, HOTEL_LABEL_LAYER_ID].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });

      if (map.getSource("hotels")) {
        map.removeSource("hotels");
      }
    }
  }, [mapLoaded, showHotels]);

  // Update user location
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showUserLocation) return;

    const map = mapRef.current;

    // Add/update user location source
    if (!map.getSource("user-location")) {
      map.addSource("user-location", createUserLocationSource(null, null));
    }
    (map.getSource("user-location") as any)?.setData(
      createUserLocationSource(latitude, longitude).data
    );

    // Add user location layer if not exists
    if (!map.getLayer(USER_LOCATION_LAYER_ID)) {
      const layerConfigs = getLayerConfigs();
      map.addLayer({
        id: USER_LOCATION_LAYER_ID,
        type: "circle",
        source: "user-location",
        paint: layerConfigs.userLocation.paint,
      });
    }

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
  }, [mapLoaded, showUserLocation, latitude, longitude, accuracy]);

  // Update selected gate marker style
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !mapRef.current.getLayer(GATE_MARKER_LAYER_ID)) return;

    const map = mapRef.current;
    const gateId = selectedGate?.id || null;

    if (gateId !== selectedGateId) {
      setSelectedGateId(gateId);

      if (gateId) {
        // Set filter to highlight selected gate
        map.setPaintProperty(GATE_MARKER_LAYER_ID, "circle-radius", [
          "case",
          ["==", ["get", "id"], gateId],
          12,
          ["match", ["get", "type"], "king_fahd", 8, "umrah", 8, "salah", 8, 8],
        ]);

        map.setPaintProperty(GATE_MARKER_LAYER_ID, "circle-stroke-width", [
          "case",
          ["==", ["get", "id"], gateId],
          3,
          2,
        ]);

        // Fly to selected gate
        const gate = HARAM_GATES.find((g) => g.id === gateId);
        if (gate) {
          map.flyTo({
            center: gate.location.coordinates as [number, number],
            zoom: 17,
            duration: 1000,
          });
        }
      } else {
        // Reset to default style
        map.setPaintProperty(GATE_MARKER_LAYER_ID, "circle-radius", 8);
        map.setPaintProperty(GATE_MARKER_LAYER_ID, "circle-stroke-width", 2);
      }
    }
  }, [selectedGate, mapLoaded, selectedGateId]);

  // Update selected hotel marker style
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !mapRef.current.getLayer(HOTEL_MARKER_LAYER_ID)) return;

    const map = mapRef.current;
    const hotelId = selectedHotel?.id || null;

    if (hotelId) {
      // Highlight selected hotel
      map.setPaintProperty(HOTEL_MARKER_LAYER_ID, "circle-radius", [
        "case",
        ["==", ["get", "id"], hotelId],
        14,
        10,
      ]);

      map.setPaintProperty(HOTEL_MARKER_LAYER_ID, "circle-stroke-width", [
        "case",
        ["==", ["get", "id"], hotelId],
        4,
        2,
      ]);

      // Fly to selected hotel
      const hotel = NEARBY_HOTELS.find((h) => h.id === hotelId);
      if (hotel) {
        map.flyTo({
          center: hotel.location.coordinates as [number, number],
          zoom: 17,
          duration: 1000,
        });
      }
    } else {
      // Reset to default style
      if (map.getLayer(HOTEL_MARKER_LAYER_ID)) {
        map.setPaintProperty(HOTEL_MARKER_LAYER_ID, "circle-radius", 10);
        map.setPaintProperty(HOTEL_MARKER_LAYER_ID, "circle-stroke-width", 2);
      }
    }
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
