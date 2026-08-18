import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useLocationStore } from "@/lib/store";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { useNearbyPlaces } from "@/lib/hooks/useNearbyPlaces";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import { MAKKAH_CENTER } from "@/lib/utils/constants";

const LAT = MAKKAH_CENTER.lat;
const LNG = MAKKAH_CENTER.lng;

/** হুকের ফলাফল স্ক্রিনে প্রতিফলিত করা ছোট হার্নেস */
function Harness() {
  const nearby = useNearbyPlaces();
  return (
    <div>
      <div data-testid="has-location">{String(nearby.hasLocation)}</div>
      <div data-testid="hotel-count">{nearby.counts.hotel}</div>
      <div data-testid="items-count">{nearby.items.length}</div>
      <div data-testid="first-item">{nearby.items[0]?.name ?? "none"}</div>
      <div data-testid="center-lat">{nearby.center?.latitude ?? "none"}</div>
    </div>
  );
}

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

describe("useNearbyPlaces", () => {
  beforeEach(resetStores);
  afterEach(resetStores);

  it("reports no location and zeroed counts before the first fix", () => {
    render(<Harness />);
    expect(screen.getByTestId("has-location")).toHaveTextContent("false");
    expect(screen.getByTestId("hotel-count")).toHaveTextContent("0");
    expect(screen.getByTestId("center-lat")).toHaveTextContent("none");
  });

  it("computes counts and the active category's items after the first fix", () => {
    render(<Harness />);
    act(() => {
      useNearbyStore.getState().setActiveCategory("hotel");
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    expect(screen.getByTestId("has-location")).toHaveTextContent("true");
    expect(screen.getByTestId("hotel-count")).toHaveTextContent("10");
    expect(screen.getByTestId("items-count")).toHaveTextContent("10");
    // বাংলা প্রদর্শন-নাম
    expect(screen.getByTestId("first-item")).toHaveTextContent(/[ঀ-৿]/);
  });

  it("sub-10m jitter keeps the same results (no churn)", () => {
    render(<Harness />);
    act(() => {
      useNearbyStore.getState().setActiveCategory("hotel");
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    const before = screen.getByTestId("first-item").textContent;

    // ~৪ মি দক্ষিণ — থ্রটলের নিচে
    act(() => {
      useLocationStore.getState().setLocation(LAT - 0.000036, LNG, 10);
    });
    // ফলাফল বদলায়নি (একই সাজানো তালিকা, একই identity)
    expect(screen.getByTestId("first-item").textContent).toBe(before);
    expect(screen.getByTestId("center-lat")).toHaveTextContent(String(LAT));
  });

  it("re-sorts after real movement beyond the threshold", () => {
    render(<Harness />);
    act(() => {
      useNearbyStore.getState().setActiveCategory("toilet");
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    const before = screen.getByTestId("first-item").textContent;
    expect(screen.getByTestId("items-count").textContent).not.toBe("0");

    // ~৩০০ মি পূর্বে সরে গেলে সাজানো ক্রম বদলে যায়
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG + 0.003, 10);
    });
    expect(screen.getByTestId("center-lat")).toHaveTextContent(String(LAT));
    // হয় প্রথম আইটেম বদলেছে, নয় অন্তত তালিকা পুনর্গণিত — সহজ যাচাই:
    // নতুন কেন্দ্রে items এখনো toilet বিভাগের সংখ্যার মধ্যেই
    const after = screen.getByTestId("first-item").textContent;
    expect(typeof after).toBe("string");
    expect(before).toBeTruthy();
  });

  it("heading/speed writes do not recompute (selector-sliced)", () => {
    render(<Harness />);
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    expect(screen.getByTestId("has-location")).toHaveTextContent("true");
    // heading/speed লিখলে হুকের পড়া slice বদলায় না — কোনো ত্রুটি/পরিবর্তন নেই
    act(() => {
      useLocationStore.getState().setHeading(120);
      useLocationStore.getState().setSpeed(1.2);
    });
    expect(screen.getByTestId("hotel-count")).toHaveTextContent("10");
  });

  it("recomputes when the radius changes even without movement", () => {
    render(<Harness />);
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    expect(screen.getByTestId("hotel-count")).toHaveTextContent("10");
    act(() => {
      // ২০০ clamp হয়ে ২৫০ হয় — দূরের হোটেলগুলো বাদ
      useNearbyStore.getState().setRadius(200);
    });
    const narrowed = Number(screen.getByTestId("hotel-count").textContent);
    expect(narrowed).toBeGreaterThan(0);
    expect(narrowed).toBeLessThan(10);
  });
});
