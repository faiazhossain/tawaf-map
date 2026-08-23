import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NearbyDetailFullContent } from "@/components/map/nearby/nearby-detail-content";
import { useLocationStore, useRouteStore, useNavigationStore, usePanelStore } from "@/lib/store";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { getNearbyItems } from "@/lib/nearby/query";
import { haversineDistance, formatDistance } from "@/lib/utils/distance";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import { MAKKAH_CENTER } from "@/lib/utils/constants";
import type { Route } from "@/types/navigation";

const fetchWalkingRouteMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/routing/fetchRoute", () => ({
  fetchWalkingRoute: fetchWalkingRouteMock,
}));

const LAT = MAKKAH_CENTER.lat;
const LNG = MAKKAH_CENTER.lng;

const GATE = getNearbyItems("gate", LAT, LNG, 3000)[0];
if (!GATE) throw new Error("gate fixture missing");

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

describe("NearbyDetailFullContent live chips", () => {
  beforeEach(resetStores);
  afterEach(resetStores);

  it("uses the snapshot distance before any fix", () => {
    render(<NearbyDetailFullContent item={GATE} />);
    expect(screen.getByTestId("nearby-full-distance-chip").textContent).toBe(
      `${GATE.distanceFormatted} • ${GATE.direction} দিকে`
    );
  });

  it("updates the distance chip text as the user moves", () => {
    render(<NearbyDetailFullContent item={GATE} />);
    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    const [gateLng, gateLat] = GATE.coordinates;
    const step = 12 / GATE.distance;
    const lat = LAT + (gateLat - LAT) * step;
    const lng = LNG + (gateLng - LNG) * step;
    act(() => {
      useLocationStore.getState().setLocation(lat, lng, 10);
    });
    const expected = formatDistance(haversineDistance(lat, lng, gateLat, gateLng));
    expect(screen.getByTestId("nearby-full-distance-chip").textContent).toContain(expected);
    expect(screen.getByTestId("nearby-full-distance-chip").textContent).toMatch(/দিকে$/);
  });
});

describe("NearbyDetailFullContent directions", () => {
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

  it("মোডালের বোতামও একই রুট-প্রবাহ চালায় — গন্তব্য, রুট, রুট প্যানেল", async () => {
    fetchWalkingRouteMock.mockResolvedValue(ROUTE);
    useLocationStore.getState().setLocation(LAT, LNG, 10);
    useNearbyStore.getState().selectItem(GATE);
    render(<NearbyDetailFullContent item={GATE} />);
    await act(async () => {});

    fireEvent.click(screen.getByTestId("nearby-full-get-directions-button"));
    await act(async () => {});

    expect(fetchWalkingRouteMock).toHaveBeenCalledWith([LNG, LAT], GATE.coordinates);
    expect(useNavigationStore.getState().destination).toEqual({
      coordinates: GATE.coordinates,
      name: GATE.name,
    });
    expect(useNearbyStore.getState().selectedItem).toBeNull();
    expect(usePanelStore.getState().activePanel).toBe("route");
  });

  it("রুট ব্যর্থ হলে মোডালে এরর দেখায়, নির্বাচন বহাল থাকে", async () => {
    fetchWalkingRouteMock.mockRejectedValue(new Error("নেটওয়ার্ক সমস্যা — রুট বের করা যায়নি।"));
    useLocationStore.getState().setLocation(LAT, LNG, 10);
    useNearbyStore.getState().selectItem(GATE);
    render(<NearbyDetailFullContent item={GATE} />);
    await act(async () => {});

    fireEvent.click(screen.getByTestId("nearby-full-get-directions-button"));
    await act(async () => {});

    expect(screen.getByTestId("nearby-full-route-error").textContent).toBe(
      "নেটওয়ার্ক সমস্যা — রুট বের করা যায়নি।"
    );
    expect(useNearbyStore.getState().selectedItem?.id).toBe(GATE.id);
    expect(usePanelStore.getState().activePanel).toBeNull();
  });
});
