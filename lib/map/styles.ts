/**
 * MapLibre GL JS styles
 */
export const MAP_STYLES = {
  streets: "https://tiles.bmapsbd.com/styles/planet_map.json",
  satellite: "https://tiles.bmapsbd.com/styles/satellite_map.json",
  dark: "https://tiles.bmapsbd.com/styles/dark_map.json",
} as const;

export type MapStyleKey = keyof typeof MAP_STYLES;

/**
 * Custom map style configuration
 */
export const CUSTOM_MAP_STYLE = {
  version: 8,
  name: "tawaf-custom",
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "simple-tiles",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};
