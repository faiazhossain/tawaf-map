import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, fireEvent, within } from "@testing-library/react";
import { NearbyCardsStrip } from "@/components/map/nearby/NearbyCardsStrip";
import { useLocationStore } from "@/lib/store";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { getNearbyItems } from "@/lib/nearby/query";
import { haversineDistance, formatDistance } from "@/lib/utils/distance";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import { MAKKAH_CENTER } from "@/lib/utils/constants";
import type { NearbyItem } from "@/types/nearby";

const LAT = MAKKAH_CENTER.lat;
const LNG = MAKKAH_CENTER.lng;

/** দূরত্ব-সাজানো গেট — ক্রম-বদলের পরীক্ষায় অন্তত ৩টি লাগবে */
const GATES = getNearbyItems("gate", LAT, LNG, 3000);

function resetStores() {
  window.localStorage.removeItem("tawaf:nearby-settings");
  useNearbyStore.setState({
    radius: NEARBY_RADIUS_DEFAULT,
    enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    halalOnly: true,
    activeCategory: null,
    listMode: "cards",
    selectedItem: null,
    detailModalOpen: false,
    settingsOpen: false,
  });
  useLocationStore.setState({
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    loading: false,
    permission: "unknown",
  });
}

/** স্ক্রল-কন্টেইনার — এক্সপ্যান্ড বোতামের অভিভাবক */
function scrollContainer(): HTMLElement {
  const container = screen.getByTestId("nearby-expand-button").parentElement;
  if (!container) throw new Error("scroll container missing");
  return container;
}

function renderStrip(items: NearbyItem[] = GATES) {
  return render(
    <NearbyCardsStrip category="gate" items={items} onSelect={vi.fn()} onExpand={vi.fn()} />
  );
}

/** jsdom-এ Element.scrollTo নেই — স্ন্যাপের কল ধরতে স্পাই বসানো */
function installScrollToSpy() {
  const spy = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    writable: true,
    value: spy,
  });
  return spy;
}

describe("NearbyCardsStrip", () => {
  beforeEach(() => {
    resetStores();
  });
  afterEach(() => {
    resetStores();
    vi.restoreAllMocks();
    vi.useRealTimers();
    delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
  });

  it("renders three cards plus the expand button, nearest badge only on the first", () => {
    if (GATES.length < 3) throw new Error("need at least three gates for the fixture");
    renderStrip();

    for (const gate of GATES.slice(0, 3)) {
      expect(screen.getByTestId(`nearby-card-${gate.id}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId(`nearby-card-${GATES[3].id}`)).toBeNull();
    expect(screen.getByTestId("nearby-expand-button")).toBeInTheDocument();

    expect(
      within(screen.getByTestId(`nearby-card-${GATES[0].id}`)).getByTestId("nearby-nearest-badge")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId(`nearby-card-${GATES[1].id}`)).queryByTestId("nearby-nearest-badge")
    ).toBeNull();
  });

  it("updates a card's distance text live without any items change", async () => {
    renderStrip();
    const gate = GATES[0];
    const cardDistance = screen.getByTestId(`nearby-card-distance-${gate.id}`);
    expect(cardDistance.textContent).toContain(gate.distanceFormatted);

    await act(async () => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    // একই items প্রপ — শুধু ফিক্স বদলেছে; ~৪ মি এগিয়ে দূরত্ব-লেখা বদলায়
    const [gateLng, gateLat] = gate.coordinates;
    const step = 4 / gate.distance;
    const lat = LAT + (gateLat - LAT) * step;
    const lng = LNG + (gateLng - LNG) * step;
    await act(async () => {
      useLocationStore.getState().setLocation(lat, lng, 10);
    });
    const expected = formatDistance(haversineDistance(lat, lng, gateLat, gateLng));
    expect(cardDistance.textContent).toContain(expected);
  });

  it("does not snap on first mount", () => {
    const spy = installScrollToSpy();
    renderStrip();
    Object.defineProperty(scrollContainer(), "scrollLeft", {
      configurable: true,
      value: 120,
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("smooth-scrolls back to the nearest card when the order changes while idle", () => {
    const spy = installScrollToSpy();
    const { rerender } = renderStrip();
    Object.defineProperty(scrollContainer(), "scrollLeft", {
      configurable: true,
      value: 120,
    });

    // নতুন নিকটতম: প্রথম দুটির ক্রম বদলেছে (১০ মি হিস্টেরেসিস পার হলে যেমন হয়)
    const reordered = [GATES[1], GATES[0], ...GATES.slice(2)];
    rerender(
      <NearbyCardsStrip category="gate" items={reordered} onSelect={vi.fn()} onExpand={vi.fn()} />
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ left: 0, behavior: "smooth" }));
  });

  it("does not snap while the user is scrolling; snaps once idle again", () => {
    vi.useFakeTimers();
    const spy = installScrollToSpy();
    const { rerender } = renderStrip();
    Object.defineProperty(scrollContainer(), "scrollLeft", {
      configurable: true,
      value: 120,
    });

    const rerenderWith = (items: NearbyItem[]) =>
      rerender(
        <NearbyCardsStrip category="gate" items={items} onSelect={vi.fn()} onExpand={vi.fn()} />
      );

    // ব্যবহারকারী স্ক্রল ছুঁয়ে আছে — ক্রম বদলেও স্ন্যাপ নয়
    fireEvent.pointerDown(scrollContainer());
    rerenderWith([GATES[1], GATES[0], ...GATES.slice(2)]);
    expect(spy).not.toHaveBeenCalled();

    // ইন্টারঅ্যাকশনের পরের ক্রম-বদলে স্ন্যাপ হয়
    vi.advanceTimersByTime(2600);
    rerenderWith([GATES[2], GATES[1], GATES[0], ...GATES.slice(3)]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ left: 0 }));
  });

  it("skips the snap when already at the first card", () => {
    const spy = installScrollToSpy();
    const { rerender } = renderStrip();
    Object.defineProperty(scrollContainer(), "scrollLeft", {
      configurable: true,
      value: 0,
    });

    rerender(
      <NearbyCardsStrip
        category="gate"
        items={[GATES[1], GATES[0], ...GATES.slice(2)]}
        onSelect={vi.fn()}
        onExpand={vi.fn()}
      />
    );
    expect(spy).not.toHaveBeenCalled();
  });
});
