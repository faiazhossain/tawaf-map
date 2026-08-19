import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NearbyDetailFullContent } from "@/components/map/nearby/nearby-detail-content";
import { useLocationStore } from "@/lib/store";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { getNearbyItems } from "@/lib/nearby/query";
import { haversineDistance, formatDistance } from "@/lib/utils/distance";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import { MAKKAH_CENTER } from "@/lib/utils/constants";

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
