import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NearbySettingsPanel } from "@/components/map/nearby/NearbySettingsPanel";
import {
  useNearbyStore,
  NEARBY_RADIUS_DEFAULT,
  NEARBY_RADIUS_MAX,
  NEARBY_RADIUS_MIN,
} from "@/lib/store/nearbyStore";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";

function resetStore() {
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
}

describe("NearbySettingsPanel", () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  it("shows the current radius in Bengali", () => {
    render(<NearbySettingsPanel open onOpenChange={() => {}} />);
    expect(screen.getAllByText("১ কিমি").length).toBeGreaterThan(0);
  });

  it("stepper buttons adjust the radius in 50m steps", () => {
    render(<NearbySettingsPanel open onOpenChange={() => {}} />);
    const increase = screen.getByRole("button", { name: /বাড়ান/ });
    fireEvent.click(increase);
    expect(useNearbyStore.getState().radius).toBe(1050);
    const decrease = screen.getByRole("button", { name: /কমান/ });
    fireEvent.click(decrease);
    fireEvent.click(decrease);
    expect(useNearbyStore.getState().radius).toBe(950);
  });

  it("clamps the radius at the band edges", () => {
    useNearbyStore.getState().setRadius(NEARBY_RADIUS_MAX);
    render(<NearbySettingsPanel open onOpenChange={() => {}} />);
    expect(screen.getByRole("button", { name: /বাড়ান/ })).toBeDisabled();

    act(() => {
      useNearbyStore.getState().setRadius(NEARBY_RADIUS_MIN);
    });
    expect(screen.getByRole("button", { name: /কমান/ })).toBeDisabled();
  });

  it("preset pills set the exact radius", () => {
    render(<NearbySettingsPanel open onOpenChange={() => {}} />);
    // প্রিসেটগুলোর একটি — ৩ কিমি
    fireEvent.click(screen.getByRole("button", { name: "৩ কিমি" }));
    expect(useNearbyStore.getState().radius).toBe(3000);
  });

  it("category toggles update the store", () => {
    render(<NearbySettingsPanel open onOpenChange={() => {}} />);
    const cafeRow = screen.getByRole("button", { name: /ক্যাফে/ });
    expect(cafeRow).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(cafeRow);
    expect(useNearbyStore.getState().enabledCategories).not.toContain("cafe");
  });

  it("halal-only toggle flips the filter", () => {
    render(<NearbySettingsPanel open onOpenChange={() => {}} />);
    const halalRow = screen.getByRole("button", { name: /শুধু হালাল/ });
    expect(halalRow).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(halalRow);
    expect(useNearbyStore.getState().halalOnly).toBe(false);
  });

  it("renders nothing when closed", () => {
    const { container } = render(<NearbySettingsPanel open={false} onOpenChange={() => {}} />);
    expect(container.textContent).toBe("");
  });
});
