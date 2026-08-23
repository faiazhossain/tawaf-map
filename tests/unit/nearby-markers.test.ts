import { describe, it, expect, vi } from "vitest";
import {
  createNearbyPOIMarkerElement,
  createNearbyItemMarkerElement,
  createNearbyItemDotMarkerElement,
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

describe("createNearbyItemMarkerElement nearby variants", () => {
  const gate = getNearbyItems("gate", LAT, LNG, 3000)[0];
  const poi = getNearbyItems("restaurant", LAT, LNG, 3000)[0];

  it("marks pulsed rank 1 with the strong-pulse class (gate and POI dispatch)", () => {
    for (const item of [gate, poi]) {
      const el = createNearbyItemMarkerElement(item, false, undefined, { rank: 1, pulsed: true });
      expect(el.className).toContain("map-marker-nearby");
      expect(el.className).toContain("map-marker-nearby-pulse-strong");
    }
  });

  it("marks pulsed ranks 2 and 3 with the soft-pulse class", () => {
    for (const rank of [2, 3]) {
      const el = createNearbyItemMarkerElement(gate, false, undefined, { rank, pulsed: true });
      expect(el.className).toContain("map-marker-nearby-pulse-soft");
      expect(el.className).not.toContain("map-marker-nearby-pulse-strong");
    }
  });

  it("marks non-pulsed ranks compact with no pulse class", () => {
    const el = createNearbyItemMarkerElement(gate, false, undefined, { rank: 4, pulsed: false });
    expect(el.className).toContain("map-marker-nearby-compact");
    expect(el.className).not.toContain("map-marker-nearby-pulse-strong");
    expect(el.className).not.toContain("map-marker-nearby-pulse-soft");
  });

  it("composes selection with the pulse tier", () => {
    const el = createNearbyItemMarkerElement(gate, true, undefined, { rank: 1, pulsed: true });
    expect(el.className).toContain("map-marker-selected");
    expect(el.className).toContain("map-marker-nearby-pulse-strong");
  });

  it("keeps the 44px hit area in every variant", () => {
    for (const placement of [
      { rank: 1, pulsed: true },
      { rank: 2, pulsed: true },
      { rank: 4, pulsed: false },
    ]) {
      const el = createNearbyItemMarkerElement(gate, false, undefined, placement);
      expect(el.style.width).toBe("44px");
      expect(el.style.height).toBe("44px");
    }
  });

  it("sizes the inner visual circle 36px for pulse tiers and 28px for compact", () => {
    const pulsed = createNearbyItemMarkerElement(gate, false, undefined, { rank: 1, pulsed: true });
    expect(pulsed.querySelector("div")?.style.width).toBe("36px");

    const compact = createNearbyItemMarkerElement(gate, false, undefined, {
      rank: 5,
      pulsed: false,
    });
    expect(compact.querySelector("div")?.style.width).toBe("28px");
  });

  it("centers the smaller visual circle inside the hit area", () => {
    const compact = createNearbyItemMarkerElement(gate, false, undefined, {
      rank: 5,
      pulsed: false,
    });
    expect(compact.style.display).toBe("flex");
    expect(compact.style.alignItems).toBe("center");
    expect(compact.style.justifyContent).toBe("center");
  });

  it("falls back to the legacy 44px look without a placement (standalone layers)", () => {
    const el = createNearbyItemMarkerElement(gate);
    expect(el.className).not.toMatch(/map-marker-nearby/);
    expect(el.querySelector("div")?.style.width).toBe("44px");
    expect(el.style.display).toBe("");
  });

  it("keeps marker accessibility intact with a placement", () => {
    const onClick = vi.fn();
    const el = createNearbyItemMarkerElement(poi, false, onClick, { rank: 1, pulsed: true });
    expect(el.getAttribute("role")).toBe("button");
    expect(el.tabIndex).toBe(0);
    expect(el.getAttribute("aria-label")).toBe(poi.name);
    expect(poi.name).toMatch(/[ঀ-৿]/);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    el.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

describe("createNearbyItemDotMarkerElement", () => {
  const gate = getNearbyItems("gate", LAT, LNG, 3000)[0];

  it("renders a named dot with the 44px anchor box and no tab stop", () => {
    const el = createNearbyItemDotMarkerElement(gate);
    expect(el.className).toContain("map-marker-nearby-dot");
    expect(el.style.width).toBe("44px");
    expect(el.style.height).toBe("44px");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe(gate.name);
    expect(el.tabIndex).not.toBe(0);
  });

  it("keeps the outer box inert and the inner hit circle interactive", () => {
    const el = createNearbyItemDotMarkerElement(gate);
    expect(el.style.pointerEvents).toBe("none");
    const hit = el.querySelector("div");
    expect(hit?.style.pointerEvents).toBe("auto");
    expect(hit?.style.width).toBe("16px");
    expect(hit?.querySelector("div")?.style.width).toBe("10px");
  });

  it("selects the item on click", () => {
    const onClick = vi.fn();
    const el = createNearbyItemDotMarkerElement(gate, onClick);
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("pre-builds both persistent states and toggles only display on hover", () => {
    const el = createNearbyItemDotMarkerElement(gate);
    const states = Array.from(el.querySelectorAll(":scope > div")) as HTMLElement[];
    expect(states.length).toBe(2);

    const hitState = states[0];
    const expandedState = states[1];
    expect(hitState.style.display).toBe("flex");
    expect(expandedState.style.display).toBe("none");
    expect(expandedState.style.pointerEvents).toBe("auto");
    expect(expandedState.querySelector("div")?.style.width).toBe("28px"); // compact ভিজ্যুয়াল

    el.querySelector("div")!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    expect(el.className).toContain("map-marker-nearby-dot-expanded");
    expect(el.className).toContain("map-marker-nearby-dot"); // ভিত্তি-ক্লাস অটুট
    expect(hitState.style.display).toBe("none");
    expect(expandedState.style.display).toBe("flex");
    expect(el.style.zIndex).toBe("1"); // প্রতিবেশীদের উপরে

    el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: null }));
    expect(el.className).not.toContain("map-marker-nearby-dot-expanded");
    expect(hitState.style.display).toBe("flex");
    expect(expandedState.style.display).toBe("none");
    expect(el.style.zIndex).toBe("");
  });

  it("stays expanded while the pointer moves between its own children", () => {
    const el = createNearbyItemDotMarkerElement(gate);
    el.querySelector("div")!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    const expandedState = Array.from(el.querySelectorAll(":scope > div"))[1];
    const expandedCircle = expandedState.querySelector("div")!;
    el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: expandedCircle }));
    expect(el.className).toContain("map-marker-nearby-dot-expanded");
  });
});
