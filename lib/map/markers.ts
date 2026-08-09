/**
 * Map marker icons and utilities
 * Generates SVG data URLs for map markers using lucide-style icons
 */

export type MarkerType = "gate" | "hotel" | "poi" | "tourist-place";
export type GateType = "king_fahd" | "umrah" | "salah";
export type PriceLevel = 1 | 2 | 3 | 4;
export type TouristPlaceCategory =
  | "historical_site"
  | "museum"
  | "mosque"
  | "park"
  | "mountain"
  | "shopping"
  | "cultural_center"
  | "landmark"
  | "agriculture"
  | "religious_site"
  | "cemetery";

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

  const circleSize = isSelected ? 44 : 36;
  const iconSize = isSelected ? 24 : 20;
  const strokeWidth = isSelected ? 3 : 2;

  Object.assign(el.style, {
    width: `${circleSize}px`,
    height: `${circleSize}px`,
    cursor: "pointer",
  });

  el.innerHTML = `
    <div style="
      width: ${circleSize}px;
      height: ${circleSize}px;
      border-radius: 50%;
      background: white;
      border: ${strokeWidth}px solid ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
    ">
      <img src="/markers/gate.png" width="${iconSize}" height="${iconSize}" alt="Gate marker" style="display:block;" />
    </div>
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

  const circleSize = isSelected ? 44 : 36;
  const iconSize = isSelected ? 24 : 20;
  const strokeWidth = isSelected ? 3 : 2;

  Object.assign(el.style, {
    width: `${circleSize}px`,
    height: `${circleSize}px`,
    cursor: "pointer",
  });

  el.innerHTML = `
    <div style="
      width: ${circleSize}px;
      height: ${circleSize}px;
      border-radius: 50%;
      background: white;
      border: ${strokeWidth}px solid ${color};
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
    ">
      <img src="/markers/hotel.png" width="${iconSize}" height="${iconSize}" alt="Hotel marker" style="display:block;" />
    </div>
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

/**
 * Get color for tourist place category
 */
export function getTouristPlaceCategoryColor(category: TouristPlaceCategory): string {
  switch (category) {
    case "historical_site":
      return "#f59e0b"; // amber
    case "mosque":
      return "#10b981"; // emerald
    case "museum":
      return "#8b5cf6"; // purple
    case "park":
      return "#22c55e"; // green
    case "mountain":
      return "#78716c"; // stone
    case "shopping":
      return "#f43f5e"; // rose
    case "cultural_center":
      return "#6366f1"; // indigo
    case "landmark":
      return "#3b82f6"; // blue
    case "agriculture":
      return "#84cc16"; // lime
    case "religious_site":
      return "#14b8a6"; // teal
    case "cemetery":
      return "#6b7280"; // gray
  }
}

/** ওমরাহ ধাপ মার্কারের অবস্থা */
export type UmrahStepStatus = "completed" | "active" | "upcoming";

/**
 * ওমরাহ ধাপের জন্য ক্রমিক নম্বরযুক্ত মার্কার উপাদান তৈরি
 * (completed = পূর্ণ সবুজ, active = টিল রিং + স্পন্দন, upcoming = ম্লান)
 */
export function createUmrahStepMarkerElement(number: number, status: UmrahStepStatus): HTMLElement {
  const el = document.createElement("div");
  el.className = `map-marker map-marker-umrah-step umrah-step-${status}`;

  const size = status === "active" ? 40 : 32;
  const fontSize = status === "active" ? 18 : 14;

  const styles: Record<UmrahStepStatus, { bg: string; border: string; text: string }> = {
    completed: { bg: "#10b981", border: "#ffffff", text: "#ffffff" },
    active: { bg: "#14b8a6", border: "#5eead4", text: "#ffffff" },
    upcoming: { bg: "#475569", border: "#64748b", text: "#cbd5e1" },
  };
  const s = styles[status];

  Object.assign(el.style, {
    width: `${size}px`,
    height: `${size}px`,
    cursor: "pointer",
  });

  const inner = status === "completed" ? checkSvg(18) : String(number);

  el.innerHTML = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${s.bg};
      border: ${status === "active" ? 3 : 2}px solid ${s.border};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${fontSize}px;
      font-weight: 700;
      color: ${s.text};
      ${status === "active" ? "box-shadow: 0 0 0 0 rgba(20,184,166,0.6); animation: umrah-pulse 2s infinite;" : "filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"}
    ">${inner}</div>
  `;
  return el;
}

/**
 * সুপারিশকৃত গেটের জন্য স্পন্দিত "এখানে শুরু করুন" মার্কার
 */
export function createRecommendedGateMarkerElement(label: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-marker map-marker-recommended-gate";

  Object.assign(el.style, {
    cursor: "pointer",
  });

  el.innerHTML = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #14b8a6;
        border: 3px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 0 rgba(20,184,166,0.7);
        animation: umrah-pulse 2s infinite;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
      ">
        ${checkSvg(22, "#ffffff")}
      </div>
      <div style="
        margin-top: 4px;
        padding: 2px 8px;
        background: rgba(15,23,42,0.85);
        color: #5eead4;
        font-size: 11px;
        font-weight: 600;
        border-radius: 6px;
        white-space: nowrap;
      ">${label}</div>
    </div>
  `;
  return el;
}

/** সাদা/রঙিন টিক চিহ্ন SVG */
function checkSvg(size: number, color = "#ffffff"): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;
}

/** অবস্থান পিন SVG (মিকাত মার্কারের জন্য) */
function pinSvg(size: number, color: string): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#ffffff" stroke="none"/></svg>`;
}

/**
 * মিকাত পয়েন্টের জন্য লেবেলযুক্ত পিন মার্কার (মিকাত সারসংক্ষেপ মানচিত্রের জন্য)।
 * সক্রিয় (ব্যবহারকারীর নিজস্ব) মিকাত = টিল রঙ + স্পন্দন + "আপনার মিকাত" ট্যাগ।
 */
export function createMiqatMarkerElement(label: string, isActive: boolean): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-marker map-marker-umrah-miqat";
  if (isActive) el.classList.add("map-marker-recommended-gate");

  const accent = "#14b8a6"; // teal-500
  const muted = "#64748b"; // slate-500

  el.innerHTML = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="
        position: relative;
        width: ${isActive ? 34 : 26}px;
        height: ${isActive ? 34 : 26}px;
        display: flex;
        align-items: center;
        justify-content: center;
        ${isActive ? "box-shadow: 0 0 0 0 rgba(20,184,166,0.6); animation: umrah-pulse 2s infinite;" : "filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));"}
      ">
        ${pinSvg(isActive ? 30 : 22, isActive ? accent : muted)}
      </div>
      <div style="
        margin-top: 3px;
        padding: 2px 7px;
        background: ${isActive ? "rgba(20,184,166,0.92)" : "rgba(15,23,42,0.82)"};
        color: #ffffff;
        font-size: 11px;
        font-weight: ${isActive ? 700 : 500};
        border-radius: 6px;
        white-space: nowrap;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        border: 1px solid ${isActive ? "#5eead4" : "rgba(255,255,255,0.12)"};
      ">${label}</div>
      ${isActive ? `<div style="margin-top:3px; padding:1px 6px; background:rgba(15,23,42,0.85); color:#5eead4; font-size:10px; font-weight:600; border-radius:5px; white-space:nowrap;">আপনার মিকাত</div>` : ""}
    </div>
  `;
  return el;
}

/**
 * Create HTML element for a tourist place marker
 */
export function createTouristPlaceMarkerElement(
  category: TouristPlaceCategory,
  isSelected = false,
  isPopular = false
): HTMLElement {
  const color = getTouristPlaceCategoryColor(category);
  const el = document.createElement("div");
  el.className = `map-marker map-marker-tourist-place ${isSelected ? "map-marker-selected" : ""}`;

  const circleSize = isSelected ? 44 : 40;
  const iconSize = isSelected ? 22 : 18;
  const strokeWidth = isSelected ? 3 : 2;

  Object.assign(el.style, {
    width: `${circleSize}px`,
    height: `${circleSize}px`,
    cursor: "pointer",
  });

  // SVG icons for each category
  const icons: Record<TouristPlaceCategory, string> = {
    historical_site: `<path d="M3 21h18v-2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H7a2 2 0 0 0-2-2H3v2z"/><path d="M5 21V7l8-4 8 4v14"/><path d="M8 21v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,
    mosque: `<path d="M7 21v-8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8"/><path d="M12 3v6"/><path d="M7 7l5-4 5 4"/><path d="M5 21h14"/><path d="M7 9h10v2H7z"/>`,
    museum: `<path d="M3 21h18v-2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H7a2 2 0 0 0-2-2H3v2z"/><rect x="4" y="7" width="16" height="12"/><rect x="9" y="3" width="6" height="4"/><path d="M9 11h1v1H9zm2 0h1v1h-1zm2 0h1v1h-1zm-4 2h1v1H9zm2 0h1v1h-1zm2 0h1v1h-1z"/>`,
    park: `<path d="M12 2L9 12H5l7 5 7-5h-4L12 2z"/><circle cx="12" cy="14" r="3"/><path d="M12 17v4"/><path d="M8 19h8"/>`,
    mountain: `<path d="M3 21h18"/><path d="M12 3l-8 14h16L12 3z"/><path d="M12 8l-5 9h10L12 8z"/>`,
    shopping: `<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
    cultural_center: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M12 6h5"/><path d="M12 10h5"/><path d="M12 14h5"/><path d="M12 18h5"/>`,
    landmark: `<path d="M12 2L2 22h20L12 2z"/><path d="M12 6v10"/><circle cx="12" cy="14" r="2"/>`,
    agriculture: `<path d="M12 22V7"/><path d="M5 12l7-5 7 5"/><path d="M12 7v8"/><circle cx="12" cy="3" r="2"/><path d="M7 16h10"/><path d="M9 18h6"/><path d="M11 20h2"/>`,
    religious_site: `<path d="M12 2L2 12h3v9h6v-6h2v6h6v-9h3L12 2z"/><circle cx="12" cy="8" r="2"/>`,
    cemetery: `<path d="M12 2v20"/><path d="M8 6l4-4 4 4"/><path d="M9 10h6v2H9z"/><path d="M10 14h4v2h-4z"/><path d="M12 16v4"/><circle cx="12" cy="20" r="1"/>`,
  };

  el.innerHTML = `
    <div style="
      width: ${circleSize}px;
      height: ${circleSize}px;
      border-radius: 50%;
      background: ${color};
      border: ${strokeWidth}px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
      position: relative;
    ">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${icons[category]}
      </svg>
      ${
        isPopular
          ? `<div style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            background: #fbbf24;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#78350f">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>`
          : ""
      }
    </div>
  `;
  return el;
}
