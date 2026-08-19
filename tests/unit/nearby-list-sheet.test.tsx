import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NearbyListSheet } from "@/components/map/nearby/NearbyListSheet";
import { useLocationStore } from "@/lib/store";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { getNearbyItems } from "@/lib/nearby/query";
import { haversineDistance, formatDistance } from "@/lib/utils/distance";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import { MAKKAH_CENTER } from "@/lib/utils/constants";

const LAT = MAKKAH_CENTER.lat;
const LNG = MAKKAH_CENTER.lng;

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

/** মোবাইল পথ (matchMedia mock সবসময় false) — BottomSheet-এর অ্যাসিনক্রোনাস
 * মাউন্ট-ইফেক্ট flush করা হয় */
async function renderSheet() {
  render(
    <NearbyListSheet
      open
      onOpenChange={vi.fn()}
      category="gate"
      items={GATES}
      selectedItemId={null}
      onSelect={vi.fn()}
    />
  );
  await act(async () => {});
}

describe("NearbyListSheet live rows", () => {
  beforeEach(resetStores);
  afterEach(resetStores);

  it("renders all rows with snapshot distances before any fix", async () => {
    await renderSheet();
    const gate = GATES[0];
    const distance = screen.getByTestId(`nearby-row-distance-${gate.id}`);
    expect(distance.textContent).toContain(gate.distanceFormatted);
    expect(screen.getByTestId(`nearby-row-${GATES[1].id}`)).toBeInTheDocument();
  });

  it("updates a row's distance text live with an unchanged items prop", async () => {
    await renderSheet();
    const gate = GATES[0];
    const distance = screen.getByTestId(`nearby-row-distance-${gate.id}`);

    act(() => {
      useLocationStore.getState().setLocation(LAT, LNG, 10);
    });
    const [gateLng, gateLat] = gate.coordinates;
    const step = 5 / gate.distance;
    const lat = LAT + (gateLat - LAT) * step;
    const lng = LNG + (gateLng - LNG) * step;
    act(() => {
      useLocationStore.getState().setLocation(lat, lng, 10);
    });
    const expected = formatDistance(haversineDistance(lat, lng, gateLat, gateLng));
    expect(distance.textContent).toContain(expected);
  });

  it("keeps the selected row highlighted", async () => {
    const selected = GATES[1];
    render(
      <NearbyListSheet
        open
        onOpenChange={vi.fn()}
        category="gate"
        items={GATES}
        selectedItemId={selected.id}
        onSelect={vi.fn()}
      />
    );
    await act(async () => {});
    expect(screen.getByTestId(`nearby-row-${selected.id}`)).toHaveClass("bg-primary-soft");
  });
});
