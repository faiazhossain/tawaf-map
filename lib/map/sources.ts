import type { LngLatBoundsLike } from "maplibre-gl";
import type { Gate } from "@/types/gate";
import type { Route } from "@/types/navigation";

/**
 * GeoJSON source for gates
 */
export function createGatesSource(gates: Gate[]) {
  return {
    type: "geojson" as const,
    data: {
      type: "FeatureCollection" as const,
      features: gates.map((gate) => ({
        type: "Feature" as const,
        properties: {
          id: gate.id,
          name: gate.name,
          nameAr: gate.nameAr,
          type: gate.type,
        },
        geometry: {
          type: "Point" as const,
          coordinates: gate.location.coordinates,
        },
      })),
    },
  };
}

/**
 * GeoJSON source for POIs
 */
export function createPOISource(pois: any[]) {
  return {
    type: "geojson" as const,
    data: {
      type: "FeatureCollection" as const,
      features: pois.map((poi) => ({
        type: "Feature" as const,
        properties: {
          id: poi.id,
          name: poi.name,
          category: poi.category,
        },
        geometry: {
          type: "Point" as const,
          coordinates: poi.location.coordinates,
        },
      })),
    },
  };
}

/**
 * GeoJSON source for route
 */
export function createRouteSource(route: Route | null) {
  if (!route) {
    return {
      type: "geojson" as const,
      data: {
        type: "FeatureCollection" as const,
        features: [],
      },
    };
  }

  return {
    type: "geojson" as const,
    data: {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: route.geometry,
      },
    },
  };
}

/**
 * GeoJSON source for user location
 */
export function createUserLocationSource(lat: number | null, lon: number | null) {
  if (lat === null || lon === null) {
    return {
      type: "geojson" as const,
      data: {
        type: "FeatureCollection" as const,
        features: [],
      },
    };
  }

  return {
    type: "geojson" as const,
    data: {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Point" as const,
            coordinates: [lon, lat],
          },
        },
      ],
    },
  };
}

/**
 * GeoJSON source for user accuracy ring
 */
export function createUserAccuracySource(
  lat: number | null,
  lon: number | null,
  accuracy: number | null
) {
  if (lat === null || lon === null || accuracy === null) {
    return {
      type: "geojson" as const,
      data: {
        type: "FeatureCollection" as const,
        features: [],
      },
    };
  }

  // Create a circle polygon for accuracy
  const coordinates: number[][] = [];
  const steps = 64;
  const radiusInDegrees = accuracy / 111000; // Approximate conversion

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    coordinates.push([
      lon + radiusInDegrees * Math.cos(angle),
      lat + radiusInDegrees * Math.sin(angle),
    ]);
  }
  coordinates.push(coordinates[0]); // Close the ring

  return {
    type: "geojson" as const,
    data: {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Polygon" as const,
            coordinates: [coordinates],
          },
        },
      ],
    },
  };
}

/**
 * Get bounds for gates
 */
export function getGatesBounds(gates: Gate[]): LngLatBoundsLike {
  if (gates.length === 0) {
    return [
      [39.8, 21.4],
      [39.85, 21.45],
    ];
  }

  const lngs = gates.map((g) => g.location.coordinates[0]);
  const lats = gates.map((g) => g.location.coordinates[1]);

  const padding = 0.005;
  return [
    [Math.min(...lngs) - padding, Math.min(...lats) - padding],
    [Math.max(...lngs) + padding, Math.max(...lats) + padding],
  ];
}
