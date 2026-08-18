import { describe, it, expect, vi } from "vitest";
import {
  createNearbyPOIMarkerElement,
  createNearbyItemMarkerElement,
  NEARBY_POI_ICONS,
} from "@/lib/map/markers";
import { getNearbyItems } from "@/lib/nearby/query";
import { MAKKAH_CENTER } from "@/lib/utils/constants";
import type { NearbyItem } from "@/types/nearby";

const LAT = MAKKAH_CENTER.lat;
const LNG = MAKKAH_CENTER.lng;

describe("createNearbyPOIMarkerElement", () => {
  it("produces a 44px accessible button with the category class", () => {
    const el = createNearbyPOIMarkerElement("restaurant", false, () => {}, "আল-বাইক");
    expect(el.className).toContain("map-marker-nearby-poi");
    expect(el.getAttribute("role")).toBe("button");
    expect(el.tabIndex).toBe(0);
    expect(el.getAttribute("aria-label")).toBe("আল-বাইক");
    expect(el.style.width).toBe("44px");
  });

  it("marks selection with the selected class and Bengali aria-label", () => {
    const el = createNearbyPOIMarkerElement("toilet", true, undefined, "হারাম গেট ১ টয়লেট");
    expect(el.className).toContain("map-marker-selected");
    expect(el.getAttribute("aria-label")).toContain("নির্বাচিত");
  });

  it("embeds the category icon svg", () => {
    for (const category of Object.keys(NEARBY_POI_ICONS) as Array<keyof typeof NEARBY_POI_ICONS>) {
      const el = createNearbyPOIMarkerElement(category);
      expect(el.querySelector("svg")).not.toBeNull();
    }
  });

  it("activates on Enter and Space", () => {
    const onClick = vi.fn();
    const el = createNearbyPOIMarkerElement("atm", false, onClick, "এটিএম");
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

describe("createNearbyItemMarkerElement dispatch", () => {
  const cases: Array<{ category: NearbyItem["category"]; className: string }> = [
    { category: "gate", className: "map-marker-gate" },
    { category: "hotel", className: "map-marker-hotel" },
    { category: "historical", className: "map-marker-tourist-place" },
    { category: "restaurant", className: "map-marker-nearby-poi" },
    { category: "mosque", className: "map-marker-nearby-poi" },
  ];

  it("reuses family factories for gate/hotel/historical, POI factory otherwise", () => {
    for (const { category, className } of cases) {
      const item = getNearbyItems(category, LAT, LNG, 3000)[0];
      if (!item) throw new Error(`no item for ${category}`);
      const el = createNearbyItemMarkerElement(item);
      expect(el.className).toContain(className);
    }
  });

  it("uses the Bengali display name as the aria-label", () => {
    const hotel = getNearbyItems("hotel", LAT, LNG, 3000)[0];
    const el = createNearbyItemMarkerElement(hotel);
    expect(el.getAttribute("aria-label")).toBe(hotel.name);
    expect(hotel.name).toMatch(/[ঀ-৿]/);
  });
});
