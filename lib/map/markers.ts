/**
 * Map marker icons and utilities
 * Generates SVG data URLs for map markers using lucide-style icons
 */

export type MarkerType = "gate" | "hotel" | "poi";
export type GateType = "king_fahd" | "umrah" | "salah";
export type PriceLevel = 1 | 2 | 3 | 4;

/**
 * Get color for gate type
 */
export function getGateTypeColor(type: GateType): string {
  switch (type) {
    case "king_fahd":
      return "#3b82f6"; // blue
    case "umrah":
      return "#22c55e"; // green
    case "salah":
      return "#f59e0b"; // amber
  }
}

/**
 * Get color for hotel price level
 */
export function getHotelPriceColor(priceLevel: PriceLevel): string {
  switch (priceLevel) {
    case 1:
      return "#22c55e"; // green - budget
    case 2:
      return "#3b82f6"; // blue - moderate
    case 3:
      return "#f59e0b"; // amber - expensive
    case 4:
      return "#8b5cf6"; // purple - luxury
  }
}

/**
 * Create SVG data URL for a gate marker icon
 */
export function createGateMarkerIcon(type: GateType, isSelected = false): string {
  const color = getGateTypeColor(type);
  const scale = isSelected ? 1.2 : 1;
  const size = 40 * scale;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Pin shape -->
      <path d="M20 4C12.268 4 6 10.268 6 18C6 28 20 38 20 38C20 38 34 28 34 18C34 10.268 27.732 4 20 4Z" fill="${color}" stroke="${isSelected ? "#1e40af" : "#ffffff"}" stroke-width="${isSelected ? 3 : 2}"/>
      <!-- Inner circle -->
      <circle cx="20" cy="18" r="6" fill="white" fill-opacity="0.9"/>
      <!-- Door/gate icon -->
      <path d="M17 15V21C17 21.5523 17.4477 22 18 22H22C22.5523 22 23 21.5523 23 21V15" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M17 15H23" stroke="${color}" stroke-width="1.5"/>
      <circle cx="21.5" cy="18.5" r="0.5" fill="${color}"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Create SVG data URL for a hotel marker icon
 */
export function createHotelMarkerIcon(priceLevel: PriceLevel, isSelected = false): string {
  const color = getHotelPriceColor(priceLevel);
  const scale = isSelected ? 1.2 : 1;
  const size = 40 * scale;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Pin shape -->
      <path d="M20 4C12.268 4 6 10.268 6 18C6 28 20 38 20 38C20 38 34 28 34 18C34 10.268 27.732 4 20 4Z" fill="${color}" stroke="${isSelected ? "#1e40af" : "#ffffff"}" stroke-width="${isSelected ? 3 : 2}"/>
      <!-- Hotel/building icon -->
      <rect x="13" y="12" width="14" height="12" rx="1" fill="white" fill-opacity="0.9"/>
      <!-- Windows -->
      <rect x="15" y="14" width="2" height="2" fill="${color}"/>
      <rect x="19" y="14" width="2" height="2" fill="${color}"/>
      <rect x="23" y="14" width="2" height="2" fill="${color}"/>
      <rect x="15" y="18" width="2" height="2" fill="${color}"/>
      <rect x="19" y="18" width="2" height="2" fill="${color}"/>
      <rect x="23" y="18" width="2" height="2" fill="${color}"/>
      <!-- Door -->
      <rect x="17" y="21" width="6" height="3" fill="${color}"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Create HTML element for a gate marker
 */
export function createGateMarkerElement(type: GateType, isSelected = false): HTMLElement {
  const color = getGateTypeColor(type);
  const el = document.createElement("div");
  el.className = `map-marker map-marker-gate ${isSelected ? "map-marker-selected" : ""}`;

  // Fixed size for consistent rendering
  const size = isSelected ? 42 : 34;
  const strokeWidth = isSelected ? 2.5 : 2;

  Object.assign(el.style, {
    width: `${size}px`,
    height: `${size}px`,
    cursor: "pointer",
  });

  // SVG with pin tip exactly at bottom-center (x=20, y=40 in viewBox)
  // Gate icon - represents an entrance/gate door
  el.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));">
      <!-- Pin shape - tip at (20, 40) which is bottom center -->
      <path d="M20 40C20 40 4 24 4 14C4 6.268 10.268 0 20 0C29.732 0 36 6.268 36 14C36 24 20 40 20 40Z" fill="${color}" stroke="white" stroke-width="${strokeWidth}"/>
      <!-- Inner white circle -->
      <circle cx="20" cy="14" r="8" fill="white" fill-opacity="0.95"/>
      <!-- Gate/door icon -->
      <path d="M15 9v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9M15 12h10" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Door opening -->
      <path d="M20 9v5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Arch top -->
      <path d="M17 9a3 3 0 0 1 6 0" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  return el;
}

/**
 * Create HTML element for a hotel marker
 */
export function createHotelMarkerElement(priceLevel: PriceLevel, isSelected = false): HTMLElement {
  const color = getHotelPriceColor(priceLevel);
  const el = document.createElement("div");
  el.className = `map-marker map-marker-hotel ${isSelected ? "map-marker-selected" : ""}`;

  // Fixed size for consistent rendering
  const size = isSelected ? 42 : 34;
  const strokeWidth = isSelected ? 2.5 : 2;

  Object.assign(el.style, {
    width: `${size}px`,
    height: `${size}px`,
    cursor: "pointer",
  });

  // SVG with pin tip exactly at bottom-center (x=20, y=40 in viewBox)
  // Hotel icon - building with H symbol
  el.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));">
      <!-- Pin shape - tip at (20, 40) which is bottom center -->
      <path d="M20 40C20 40 4 24 4 14C4 6.268 10.268 0 20 0C29.732 0 36 6.268 36 14C36 24 20 40 20 40Z" fill="${color}" stroke="white" stroke-width="${strokeWidth}"/>
      <!-- Inner white circle -->
      <circle cx="20" cy="14" r="8" fill="white" fill-opacity="0.95"/>
      <!-- Hotel building icon -->
      <path d="M14 17V9h12v8M14 11h12M17 17v-3M20 17v-3M23 17v-3" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- H letter for Hotel -->
      <path d="M17 10v3M23 10v3M17 11.5h2M21 11.5h2" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `;
  return el;
}

/**
 * Create HTML element for user location marker
 */
export function createUserLocationElement(): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-marker map-marker-user";

  Object.assign(el.style, {
    width: "24px",
    height: "24px",
  });

  el.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      background-color: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>
  `;
  return el;
}
