"use client";

import * as React from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Live MapLibre `Map` instance context.
 *
 * The map instance is created imperatively inside `MapView` and is needed by
 * sibling overlays (future class-toggle marker updates and similar direct-map
 * consumers). React context avoids prop-drilling and the brittle store→map
 * binding that previously left overlay controls as no-ops (the store was
 * updated but nothing pushed the change back to the live map).
 */
const MapInstanceContext = React.createContext<MapLibreMap | null>(null);

export function MapInstanceProvider({
  map,
  children,
}: {
  map: MapLibreMap | null;
  children: React.ReactNode;
}) {
  return <MapInstanceContext.Provider value={map}>{children}</MapInstanceContext.Provider>;
}

export function useMapInstance(): MapLibreMap | null {
  return React.useContext(MapInstanceContext);
}
