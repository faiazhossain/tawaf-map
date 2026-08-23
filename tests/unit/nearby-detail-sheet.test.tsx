import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NearbyDetailSheet } from "@/components/map/nearby/NearbyDetailSheet";
import { useLocationStore, useRouteStore, useNavigationStore, usePanelStore } from "@/lib/store";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { getNearbyItems } from "@/lib/nearby/query";
import { haversineDistance, formatDistance } from "@/lib/utils/distance";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import { MAKKAH_CENTER } from "@/lib/utils/constants";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import type { Route } from "@/types/navigation";

vi.mock("@/lib/hooks/useMediaQuery", () => ({
  useMediaQuery: vi.fn(() => false),
}));

const fetchWalkingRouteMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/routing/fetchRoute", () => ({
  fetchWalkingRoute: fetchWalkingRouteMock,
}));

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

describe("NearbyDetailSheet deselect", () => {
  beforeEach(() => {
    resetStores();
    vi.mocked(useMediaQuery).mockReturnValue(true);
  });
  afterEach(() => {
    vi.mocked(useMediaQuery).mockReturnValue(false);
    resetStores();
  });

  it("ডেস্কটপ কার্ডে বন্ধ-বাটন আছে — ক্লিকে onOpenChange(false)", async () => {
    const onOpenChange = vi.fn();
    render(
      <NearbyDetailSheet open onOpenChange={onOpenChange} item={GATE} onShowDetails={vi.fn()} />
    );
    await act(async () => {});
    fireEvent.click(screen.getByTestId("nearby-detail-close"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clearSelection নির্বাচন খুলে দেয় — তালিকা/স্ট্রিপ ফিরে আসে", () => {
    useNearbyStore.getState().selectItem(GATE);
    expect(useNearbyStore.getState().selectedItem?.id).toBe(GATE.id);

    useNearbyStore.getState().clearSelection();
    expect(useNearbyStore.getState().selectedItem).toBeNull();
    expect(useNearbyStore.getState().detailModalOpen).toBe(false);
  });
});

describe("NearbyDetailSheet directions", () => {
  const ROUTE: Route = {
    id: "test-route",
    geometry: [[LNG, LAT], GATE.coordinates],
    distance: GATE.distance,
    duration: GATE.walkingTime * 60,
    steps: [
      { instruction: "সোজা হাঁটুন", distance: GATE.distance, duration: GATE.walkingTime * 60 },
    ],
  };

  beforeEach(() => {
    resetStores();
    useRouteStore.getState().clearRoute();
    useNavigationStore.setState({ destination: null, isNavigating: false });
    usePanelStore.setState({ activePanel: null });
    fetchWalkingRouteMock.mockReset();
  });

  afterEach(() => {
    fetchWalkingRouteMock.mockReset();
    resetStores();
    useRouteStore.getState().clearRoute();
    useNavigationStore.setState({ destination: null, isNavigating: false });
    usePanelStore.setState({ activePanel: null });
  });

  it("গন্তব্য বসে, রুট আসে, নির্বাচন মুছে রুট প্যানেল খোলে", async () => {
    fetchWalkingRouteMock.mockResolvedValue(ROUTE);
    useLocationStore.getState().setLocation(LAT, LNG, 10);
    useNearbyStore.getState().selectItem(GATE);
    await renderSheet();

    fireEvent.click(screen.getByTestId("nearby-get-directions-button"));
    await act(async () => {});

    expect(fetchWalkingRouteMock).toHaveBeenCalledTimes(1);
    expect(fetchWalkingRouteMock).toHaveBeenCalledWith([LNG, LAT], GATE.coordinates);
    expect(useNavigationStore.getState().destination).toEqual({
      coordinates: GATE.coordinates,
      name: GATE.name,
    });
    expect(useRouteStore.getState().activeRoute?.id).toBe("test-route");
    expect(useNearbyStore.getState().selectedItem).toBeNull();
    expect(usePanelStore.getState().activePanel).toBe("route");
  });

  it("রুট ব্যর্থ হলে শিট থেকে যায় — এরর দেখায়, প্যানেল বদলায় না", async () => {
    fetchWalkingRouteMock.mockRejectedValue(new Error("নেটওয়ার্ক সমস্যা — রুট বের করা যায়নি।"));
    useLocationStore.getState().setLocation(LAT, LNG, 10);
    await renderSheet();

    fireEvent.click(screen.getByTestId("nearby-get-directions-button"));
    await act(async () => {});

    expect(screen.getByTestId("nearby-route-error").textContent).toBe(
      "নেটওয়ার্ক সমস্যা — রুট বের করা যায়নি।"
    );
    expect(usePanelStore.getState().activePanel).toBeNull();
    expect(useRouteStore.getState().routeError).not.toBeNull();
  });

  it("লোকেশন ছাড়া চাপলে বাংলা এরর — ফেচই হয় না", async () => {
    await renderSheet();

    fireEvent.click(screen.getByTestId("nearby-get-directions-button"));
    await act(async () => {});

    expect(fetchWalkingRouteMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("nearby-route-error").textContent).toBe(
      "লোকেশন পাওয়া যায়নি — লোকেশন সার্ভিস চালু করুন।"
    );
    expect(usePanelStore.getState().activePanel).toBeNull();
  });
});
