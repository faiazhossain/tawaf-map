import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NearbyDetailSheet } from "@/components/map/nearby/NearbyDetailSheet";
import { useLocationStore } from "@/lib/store";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { getNearbyItems } from "@/lib/nearby/query";
import { haversineDistance, formatDistance } from "@/lib/utils/distance";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import { MAKKAH_CENTER } from "@/lib/utils/constants";

const LAT = MAKKAH_CENTER.lat;
const LNG = MAKKAH_CENTER.lng;

/** সবচেয়ে কাছের গেট — স্থির ফিক্সচার (use-nearby-places প্যাটার্ন) */
const GATE = getNearbyItems("gate", LAT, LNG, 3000)[0];
if (!GATE) throw new Error("gate fixture missing");

/** `factor` অনুপাতে গেটের দিকে অন্তর্বর্তী বিন্দু (1.0 = ঠিক গেটে) */
function towardGate(factor: number): { lat: number; lng: number } {
  const [gateLng, gateLat] = GATE.coordinates;
  return { lat: LAT + (gateLat - LAT) * factor, lng: LNG + (gateLng - LNG) * factor };
}

function expectedDistanceText(lat: number, lng: number): string {
  return formatDistance(haversineDistance(lat, lng, GATE.coordinates[1], GATE.coordinates[0]));
}

/** শিট মাউন্টে BottomSheet-এর অ্যাসিনক্রোনাস স্ন্যাপ/মাপ-ইফেক্ট flush করা */
async function renderSheet() {
  render(<NearbyDetailSheet open onOpenChange={vi.fn()} item={GATE} onShowDetails={vi.fn()} />);
  await act(async () => {});
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

describe("NearbyDetailSheet live distance", () => {
  beforeEach(resetStores);
  afterEach(resetStores);

  it("shows the snapshot distance before any fix", async () => {
    await renderSheet();
    expect(screen.getByTestId("nearby-detail-distance").textContent).toBe(GATE.distanceFormatted);
    expect(screen.queryByTestId("nearby-detail-trend")).toBeNull();
    expect(screen.queryByTestId("nearby-near-state")).toBeNull();
  });

  it("updates the distance as the user walks toward the item (bug repro)", async () => {
    await renderSheet();
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    expect(screen.getByTestId("nearby-detail-distance").textContent).toBe(
      expectedDistanceText(LAT, LNG)
    );

    // গেটের দিকে ~১৫ মি এগোনো — শিটের দূরত্ব লাইভ বদলায়
    const step = towardGate(15 / GATE.distance);
    act(() => {
      useLocationStore.getState().setLocation(step.lat, step.lng, 10);
    });
    expect(screen.getByTestId("nearby-detail-distance").textContent).toBe(
      expectedDistanceText(step.lat, step.lng)
    );

    // হাঁটার সময়ও লাইভ
    expect(screen.getByTestId("nearby-detail-walk-time").textContent).toMatch(/হেঁটে$/);
  });

  it("announces the trend only after crossing the deadband", async () => {
    await renderSheet();
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    expect(screen.queryByTestId("nearby-detail-trend")).toBeNull();

    const crossed = towardGate(5 / GATE.distance);
    act(() => {
      useLocationStore.getState().setLocation(crossed.lat, crossed.lng, 10);
    });
    const trend = screen.getByTestId("nearby-detail-trend");
    expect(trend.textContent).toBe("কাছে আসছেন");
  });

  it("shows the near state instead of the trend inside 50 m", async () => {
    await renderSheet();
    const near = towardGate(1 - 20 / GATE.distance);
    act(() => {
      useLocationStore.getState().setLocation(near.lat, near.lng, 10);
    });
    expect(screen.getByTestId("nearby-near-state").textContent).toBe("প্রায় পৌঁছে গেছেন");
    expect(screen.queryByTestId("nearby-detail-trend")).toBeNull();
  });

  it("exposes the distance row as a polite atomic live region", async () => {
    await renderSheet();
    const row = screen.getByTestId("nearby-detail-distance").closest('[aria-live="polite"]');
    expect(row).not.toBeNull();
    expect(row).toHaveAttribute("aria-atomic", "true");
  });
});
