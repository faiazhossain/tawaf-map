import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useLocationStore } from "@/lib/store";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { useLiveNearbyItem, type NearbyLiveItemState } from "@/lib/hooks/useLiveNearbyItem";
import { getNearbyItems } from "@/lib/nearby/query";
import { haversineDistance, formatDistance } from "@/lib/utils/distance";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import { MAKKAH_CENTER } from "@/lib/utils/constants";
import type { NearbyItem } from "@/types/nearby";

const LAT = MAKKAH_CENTER.lat;
const LNG = MAKKAH_CENTER.lng;

/** সবচেয়ে কাছের গেট — স্থির ফিক্সচার */
const GATE = getNearbyItems("gate", LAT, LNG, 3000)[0];
if (!GATE) throw new Error("gate fixture missing");

/**
 * `factor` অনুপাতে গেটের দিকে (1.0 = ঠিক গেটে) অন্তর্বর্তী বিন্দু।
 * ছোট দূরত্বে রৈখিক অন্তর্বর্তীকরণ বৃহৎ-বৃত্তের প্রায়-নিখুঁত।
 */
function towardGate(factor: number): { lat: number; lng: number } {
  const [gateLng, gateLat] = GATE.coordinates;
  return { lat: LAT + (gateLat - LAT) * factor, lng: LNG + (gateLng - LNG) * factor };
}

/** প্রত্যাশিত দূরত্ব-লেখা — বাস্তব গণিত থেকে, হার্ডকোড নয় */
function expectedDistanceText(lat: number, lng: number): string {
  return formatDistance(haversineDistance(lat, lng, GATE.coordinates[1], GATE.coordinates[0]));
}

/** হুকের ফলাফল স্ক্রিনে তুলে ধরা ছোট হার্নেস; identity যাচাইয়েের জন্য
 * শেষ ফেরত অবজেক্ট ও রেন্ডার-গণনা মডিউল ভেরিয়েবলে ধরা হয় */
let latest: NearbyLiveItemState | null = null;
let renderCount = 0;

function Harness({ item }: { item: NearbyItem | null }) {
  const live = useLiveNearbyItem(item);
  latest = live;
  renderCount += 1;
  return (
    <div>
      <div data-testid="distance">{live.distanceFormatted}</div>
      <div data-testid="trend">{live.trend ?? "none"}</div>
      <div data-testid="is-near">{String(live.isNear)}</div>
      <div data-testid="has-location">{String(live.hasLocation)}</div>
      <div data-testid="renders">{renderCount}</div>
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
  latest = null;
  renderCount = 0;
}

describe("useLiveNearbyItem", () => {
  beforeEach(resetStores);
  afterEach(resetStores);

  it("falls back to the snapshot fields before the first fix", () => {
    render(<Harness item={GATE} />);
    expect(screen.getByTestId("distance").textContent).toBe(GATE.distanceFormatted);
    expect(screen.getByTestId("trend").textContent).toBe("none");
    expect(screen.getByTestId("has-location").textContent).toBe("false");
    expect(screen.getByTestId("is-near").textContent).toBe(String(GATE.distance < 50));
  });

  it("returns empty values for a null item", () => {
    render(<Harness item={null} />);
    expect(screen.getByTestId("distance").textContent).toBe("");
    expect(screen.getByTestId("has-location").textContent).toBe("false");
  });

  it("recomputes the formatted distance after moving past the display threshold", () => {
    render(<Harness item={GATE} />);
    // প্রথম ফিক্স
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    expect(screen.getByTestId("has-location").textContent).toBe("true");
    expect(screen.getByTestId("distance").textContent).toBe(expectedDistanceText(LAT, LNG));

    // গেটের দিকে ~১২ মি (১০০০ মি ব্যাসার্ধের গেটে ভগ্নাংশ হিসাবে)
    const step = 12 / GATE.distance;
    const next = towardGate(step);
    act(() => {
      useLocationStore.getState().setLocation(next.lat, next.lng, 10);
    });
    expect(screen.getByTestId("distance").textContent).toBe(
      expectedDistanceText(next.lat, next.lng)
    );
  });

  it("keeps the same result object on sub-threshold jitter", () => {
    render(<Harness item={GATE} />);
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    const before = latest;
    expect(before).not.toBeNull();

    // ~১ মি উত্তর — ২ মি নির্গমনের নিচে
    act(() => {
      useLocationStore.getState().setLocation(LAT + 0.00001, LNG, 10);
    });
    expect(latest).toBe(before);
    expect(screen.getByTestId("renders").textContent).not.toBe("1");
  });

  it("flips the trend to closer only after crossing the deadband", () => {
    render(<Harness item={GATE} />);
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    expect(screen.getByTestId("trend").textContent).toBe("none");

    // ~২ মি কাছে — নির্গমন হয়, কিন্তু ৩ মি ডেডব্যান্ডের ভেতরে
    const small = towardGate(2 / GATE.distance);
    act(() => {
      useLocationStore.getState().setLocation(small.lat, small.lng, 10);
    });
    expect(screen.getByTestId("trend").textContent).toBe("none");

    // মোট ~৫ মি কাছে — নোঙর থেকে ৩ মি পার → closer
    const crossed = towardGate(5 / GATE.distance);
    act(() => {
      useLocationStore.getState().setLocation(crossed.lat, crossed.lng, 10);
    });
    expect(screen.getByTestId("trend").textContent).toBe("closer");
  });

  it("flips the trend to farther when moving away", () => {
    render(<Harness item={GATE} />);
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    const away = towardGate(-8 / GATE.distance);
    act(() => {
      useLocationStore.getState().setLocation(away.lat, away.lng, 10);
    });
    expect(screen.getByTestId("trend").textContent).toBe("farther");
  });

  it("marks isNear inside the near threshold", () => {
    render(<Harness item={GATE} />);
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    expect(screen.getByTestId("is-near").textContent).toBe("false");

    const near = towardGate(1 - 20 / GATE.distance);
    act(() => {
      useLocationStore.getState().setLocation(near.lat, near.lng, 10);
    });
    expect(screen.getByTestId("is-near").textContent).toBe("true");
  });

  it("keeps updating far beyond any list radius (radius-independent)", () => {
    render(<Harness item={GATE} />);
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    // গেট থেকে অনেক দূরে (ক্ষুদ্রতম ২৫০ মি ব্যাসার্ধেরও বাইরে) সরে গেলেও
    // দূরত্ব বাড়তে থাকে — স্ন্যাপশটে জমে থাকে না
    const far = towardGate(-600 / GATE.distance);
    act(() => {
      useLocationStore.getState().setLocation(far.lat, far.lng, 10);
    });
    expect(screen.getByTestId("distance").textContent).toBe(expectedDistanceText(far.lat, far.lng));
    expect(screen.getByTestId("trend").textContent).toBe("farther");
  });

  it("resets the trend when switching to another item", () => {
    const other = getNearbyItems("gate", LAT, LNG, 3000)[1];
    if (!other) throw new Error("second gate fixture missing");
    const { rerender } = render(<Harness item={GATE} />);
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    const toward = towardGate(5 / GATE.distance);
    act(() => {
      useLocationStore.getState().setLocation(toward.lat, toward.lng, 10);
    });
    expect(screen.getByTestId("trend").textContent).toBe("closer");

    act(() => {
      rerender(<Harness item={other} />);
    });
    expect(screen.getByTestId("trend").textContent).toBe("none");
    expect(screen.getByTestId("distance").textContent).toBe(
      formatDistance(
        haversineDistance(toward.lat, toward.lng, other.coordinates[1], other.coordinates[0])
      )
    );
  });
});
