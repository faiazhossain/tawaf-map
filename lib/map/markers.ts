/**
 * Map marker icons and utilities
 *
 * Single source of truth for HTML marker elements. Markers migrate to the
 * semantic palette in `lib/map/colors.ts` (emerald = active/guidance,
 * gold = pilgrim/"you", neutral landmark = pins). Every clickable marker is
 * keyboard-accessible: role=button, tabindex=0, aria-label, Enter/Space.
 */

import { MAP_COLORS } from "@/lib/map/colors";

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

// ---------------------------------------------------------------------------
// Semantic colors (was: 11+ hardcoded hex values; now: tokens)
// ---------------------------------------------------------------------------

/**
 * Landmark pin colors per category. Categories now share a tight neutral
 * palette (MAP_COLORS.landmark) with two informational accents for the two
 * "religious" categories (mosque / religious_site) which keep emerald to aid
 * recognition. Selected state always becomes emerald regardless of category.
 */
export function getTouristPlaceCategoryColor(_category: TouristPlaceCategory): string {
  // Category distinction is conveyed by the SVG icon inside the pin, not by
  // 11 random hues. Selected state handled by caller (emerald ring).
  void _category;
  return MAP_COLORS.landmark;
}

/** Gate type colors — all gates now share the neutral landmark pin color;
 *  the gate icon (door) inside communicates type. Selected becomes emerald. */
export function getGateTypeColor(_type: GateType): string {
  void _type;
  return MAP_COLORS.landmark;
}

/** Hotel price-level color — neutral landmark pin; price is shown via the
 *  hotel icon and selected becomes emerald. */
export function getHotelPriceColor(_level: PriceLevel): string {
  void _level;
  return MAP_COLORS.landmark;
}

// ---------------------------------------------------------------------------
// Accessibility helpers
// ---------------------------------------------------------------------------

/**
 * Make an HTML element keyboard-activatable and screen-reader-named.
 * The same click handler fires on Enter/Space. Call after the element exists.
 */
function makeAccessible(el: HTMLElement, label: string, onClick?: () => void) {
  if (onClick) {
    el.setAttribute("role", "button");
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    });
  } else {
    el.setAttribute("role", "img");
  }
  el.setAttribute("aria-label", label);
}

// ---------------------------------------------------------------------------
// SVG icons (paths reused across marker variants)
// ---------------------------------------------------------------------------

function checkSvg(size: number, color = "#ffffff"): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;
}

function pinSvg(size: number, color: string): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#ffffff" stroke="none"/></svg>`;
}

const TOURIST_ICONS: Record<TouristPlaceCategory, string> = {
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

// ---------------------------------------------------------------------------
// Marker factories — every clickable marker is keyboard-accessible
// ---------------------------------------------------------------------------

/**
 * Create HTML element for a gate marker. Neutral landmark pin with door icon;
 * selected becomes emerald ring. Keyboard-activatable.
 */
export function createGateMarkerElement(
  type: GateType,
  isSelected = false,
  onClick?: () => void,
  label = "গেট"
): HTMLElement {
  void type;
  const color = MAP_COLORS.landmark;
  const accent = isSelected ? MAP_COLORS.route : color;
  const el = document.createElement("div");
  el.className = `map-marker map-marker-gate ${isSelected ? "map-marker-selected" : ""}`;

  const circleSize = 44; // 44px touch target
  const iconSize = 22;
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
      border: ${strokeWidth}px solid ${accent};
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
    ">
      <img src="/markers/gate.png" width="${iconSize}" height="${iconSize}" alt="" style="display:block;" />
    </div>
  `;
  makeAccessible(el, isSelected ? `নির্বাচিত ${label}` : label, onClick);
  return el;
}

/**
 * Create HTML element for a hotel marker. Neutral landmark pin; selected emerald.
 */
export function createHotelMarkerElement(
  priceLevel: PriceLevel,
  isSelected = false,
  onClick?: () => void,
  label = "হোটেল"
): HTMLElement {
  void priceLevel;
  const color = MAP_COLORS.landmark;
  const accent = isSelected ? MAP_COLORS.route : color;
  const el = document.createElement("div");
  el.className = `map-marker map-marker-hotel ${isSelected ? "map-marker-selected" : ""}`;

  const circleSize = 44;
  const iconSize = 22;
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
      border: ${strokeWidth}px solid ${accent};
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
    ">
      <img src="/markers/hotel.png" width="${iconSize}" height="${iconSize}" alt="" style="display:block;" />
    </div>
  `;
  makeAccessible(el, isSelected ? `নির্বাচিত ${label}` : label, onClick);
  return el;
}

/**
 * Create HTML element for user location marker — gold ("you") dot with halo.
 * The pulsing halo is owned by globals.css `.map-marker-user` (reduced-motion safe).
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
      background-color: ${MAP_COLORS.pilgrim};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(201, 162, 39, 0.5);
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
  makeAccessible(el, "আপনার বর্তমান অবস্থান");
  return el;
}

/** ওমরাহ ধাপ মার্কারের অবস্থা */
export type UmrahStepStatus = "completed" | "active" | "upcoming";

/**
 * ওমরাহ ধাপের জন্য ক্রমিক নম্বরযুক্ত মার্কার উপাদান তৈরি
 * (completed = emerald-soft + ✓, active = emerald + স্পন্দন, upcoming = neutral)
 */
export function createUmrahStepMarkerElement(
  number: number,
  status: UmrahStepStatus,
  onClick?: () => void,
  label?: string
): HTMLElement {
  const el = document.createElement("div");
  el.className = `map-marker map-marker-umrah-step umrah-step-${status}`;

  const size = status === "active" ? 44 : 36; // 36px+ touch targets
  const fontSize = status === "active" ? 18 : 14;

  const styles: Record<UmrahStepStatus, { bg: string; border: string; text: string }> = {
    completed: { bg: MAP_COLORS.routeCompleted, border: "#ffffff", text: "#ffffff" },
    active: { bg: MAP_COLORS.route, border: MAP_COLORS.route, text: "#ffffff" },
    upcoming: { bg: MAP_COLORS.routeUpcoming, border: "#ffffff", text: "#ffffff" },
  };
  const s = styles[status];

  Object.assign(el.style, {
    width: `${size}px`,
    height: `${size}px`,
    cursor: "pointer",
  });

  const inner = status === "completed" ? checkSvg(18) : String(number);
  const aria =
    label ??
    (status === "completed"
      ? `সম্পন্ন ধাপ ${number}`
      : status === "active"
        ? `বর্তমান ধাপ ${number}`
        : `ধাপ ${number}`);

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
      ${status === "active" ? `box-shadow: 0 0 0 0 hsl(var(--primary) / 0.6); animation: umrah-pulse 2s infinite;` : "filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"}
    ">${inner}</div>
  `;
  makeAccessible(el, aria, onClick);
  return el;
}

/**
 * সুপারিশকৃত গেটের জন্য স্পন্দিত "এখানে শুরু করুন" মার্কার (emerald + স্পন্দন)।
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
        background: ${MAP_COLORS.route};
        border: 3px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 0 hsl(var(--primary) / 0.7);
        animation: umrah-pulse 2s infinite;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
      ">
        ${checkSvg(22, "#ffffff")}
      </div>
      <div style="
        margin-top: 4px;
        padding: 2px 8px;
        background: rgba(15,23,42,0.85);
        color: hsl(var(--primary-foreground));
        font-size: 11px;
        font-weight: 600;
        border-radius: 6px;
        white-space: nowrap;
      ">${label}</div>
    </div>
  `;
  makeAccessible(el, `সুপারিশকৃত শুরুর গেট: ${label}`);
  return el;
}

/** হাজির লিঙ্গ অনুযায়ী মিনিয়েচার আইকন (ইহরাম-পরিহিত পুরুষ/নারী রূপ)। */
export const PILGRIM_ICON = {
  male: "/icons/pilgrim_male.svg",
  female: "/icons/pilgrim_female.svg",
} as const;

/**
 * লিঙ্গ অনুযায়ী হাজি আইকনের সোর্স ফেরত দেয়। অজানা/শূন্য লিঙ্গে পুরুষ আইকন (নিরাপদ ডিফল্ট)।
 * বিশুদ্ধ ফাংশন - সহজে পরীক্ষাযোগ্য।
 */
export function pilgrimIconForGender(gender: "male" | "female" | null | undefined): string {
  return gender === "female" ? PILGRIM_ICON.female : PILGRIM_ICON.male;
}

/**
 * তওয়াফরত হাজির মিনিয়েচার মার্কার - অঙ্কন অ্যানিমেশনে চাপ ধরে হাঁটে।
 * লিঙ্গ অনুযায়ী আইকন (iconSrc) ব্যবহার করে; হালকা bob সহ। opacity প্রারম্ভে 0 (হুক ফেড-ইন করে)।
 */
export function createPilgrimMarkerElement(iconSrc: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-marker map-marker-pilgrim";
  Object.assign(el.style, {
    width: "30px",
    height: "76px",
    cursor: "default",
    opacity: "0",
    transition: "opacity 0.3s ease",
    filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.45))",
    pointerEvents: "none",
  });

  el.innerHTML = `
    <div class="pilgrim-bob" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
      <img src="${iconSrc}" alt="" draggable="false" aria-hidden="true"
        style="width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;" />
    </div>`;
  // Decorative — the draw-animation hook owns visibility; no keyboard interaction.
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", "তওয়াফরত হাজি");
  return el;
}

/**
 * মিকাত পয়েন্টের জন্য লেবেলযুক্ত পিন মার্কার (মিকাত সারসংক্ষেপ মানচিত্রের জন্য)।
 * সক্রিয় (ব্যবহারকারীর নিজস্ব) মিকাত = emerald + স্পন্দন + "আপনার মিকাত" ট্যাগ।
 */
export function createMiqatMarkerElement(label: string, isActive: boolean): HTMLElement {
  const el = document.createElement("div");
  el.className = "map-marker map-marker-umrah-miqat";
  if (isActive) el.classList.add("map-marker-recommended-gate");

  const accent = MAP_COLORS.route;
  const muted = MAP_COLORS.landmark;

  el.innerHTML = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="
        position: relative;
        width: ${isActive ? 34 : 26}px;
        height: ${isActive ? 34 : 26}px;
        display: flex;
        align-items: center;
        justify-content: center;
        ${isActive ? `box-shadow: 0 0 0 0 hsl(var(--primary) / 0.6); animation: umrah-pulse 2s infinite;` : "filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));"}
      ">
        ${pinSvg(isActive ? 30 : 22, isActive ? accent : muted)}
      </div>
      <div style="
        margin-top: 3px;
        padding: 2px 7px;
        background: ${isActive ? "hsl(var(--primary) / 0.92)" : "rgba(15,23,42,0.82)"};
        color: #ffffff;
        font-size: 11px;
        font-weight: ${isActive ? 700 : 500};
        border-radius: 6px;
        white-space: nowrap;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        border: 1px solid ${isActive ? "hsl(var(--primary-hover))" : "rgba(255,255,255,0.12)"};
      ">${label}</div>
      ${isActive ? `<div style="margin-top:3px; padding:1px 6px; background:rgba(15,23,42,0.85); color:hsl(var(--primary-foreground)); font-size:10px; font-weight:600; border-radius:5px; white-space:nowrap;">আপনার মিকাত</div>` : ""}
    </div>
  `;
  makeAccessible(el, isActive ? `আপনার মিকাত: ${label}` : `মিকাত: ${label}`);
  return el;
}

/**
 * Create HTML element for a tourist place marker.
 * Neutral landmark pin with category icon (was 11 random colors); selected emerald.
 * Popular badge stays gold (the "milestone/star" semantic).
 */
export function createTouristPlaceMarkerElement(
  category: TouristPlaceCategory,
  isSelected = false,
  isPopular = false,
  onClick?: () => void,
  label = "চিহ্নিত স্থান"
): HTMLElement {
  const color = MAP_COLORS.landmark;
  const accent = isSelected ? MAP_COLORS.route : color;
  const el = document.createElement("div");
  el.className = `map-marker map-marker-tourist-place ${isSelected ? "map-marker-selected" : ""}`;

  const circleSize = 44; // 44px touch target (was 40)
  const iconSize = 22;
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
      background: ${accent};
      border: ${strokeWidth}px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
      position: relative;
    ">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${TOURIST_ICONS[category]}
      </svg>
      ${
        isPopular
          ? `<div style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            background: ${MAP_COLORS.pilgrim};
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
  makeAccessible(el, `${label}${isPopular ? " (জনপ্রিয়)" : ""}`, onClick);
  return el;
}

// ---------------------------------------------------------------------------
// Legacy SVG-data-URL icons — kept for backward compatibility with any
// callers still using <img src> markers. Not used by MapView's HTML markers.
// ---------------------------------------------------------------------------

/**
 * Create SVG data URL for a gate marker icon (legacy).
 */
export function createGateMarkerIcon(type: GateType, isSelected = false): string {
  const color = getGateTypeColor(type);
  const scale = isSelected ? 1.2 : 1;
  const size = 40 * scale;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4C12.268 4 6 10.268 6 18C6 28 20 38 20 38C20 38 34 28 34 18C34 10.268 27.732 4 20 4Z" fill="${color}" stroke="#ffffff" stroke-width="${isSelected ? 3 : 2}"/>
      <circle cx="20" cy="18" r="6" fill="white" fill-opacity="0.9"/>
      <path d="M17 15V21C17 21.5523 17.4477 22 18 22H22C22.5523 22 23 21.5523 23 21V15" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M17 15H23" stroke="${color}" stroke-width="1.5"/>
      <circle cx="21.5" cy="18.5" r="0.5" fill="${color}"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Create SVG data URL for a hotel marker icon (legacy).
 */
export function createHotelMarkerIcon(priceLevel: PriceLevel, isSelected = false): string {
  const color = getHotelPriceColor(priceLevel);
  const scale = isSelected ? 1.2 : 1;
  const size = 40 * scale;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4C12.268 4 6 10.268 6 18C6 28 20 38 20 38C20 38 34 28 34 18C34 10.268 27.732 4 20 4Z" fill="${color}" stroke="#ffffff" stroke-width="${isSelected ? 3 : 2}"/>
      <rect x="13" y="12" width="14" height="12" rx="1" fill="white" fill-opacity="0.9"/>
      <rect x="15" y="14" width="2" height="2" fill="${color}"/>
      <rect x="19" y="14" width="2" height="2" fill="${color}"/>
      <rect x="23" y="14" width="2" height="2" fill="${color}"/>
      <rect x="15" y="18" width="2" height="2" fill="${color}"/>
      <rect x="19" y="18" width="2" height="2" fill="${color}"/>
      <rect x="23" y="18" width="2" height="2" fill="${color}"/>
      <rect x="17" y="21" width="6" height="3" fill="${color}"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
