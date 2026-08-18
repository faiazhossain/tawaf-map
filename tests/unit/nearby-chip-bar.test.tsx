import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NearbyChipBar } from "@/components/map/nearby/NearbyChipBar";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import type { NearbyCategory, NearbyCounts } from "@/types/nearby";

function makeCounts(overrides: Partial<NearbyCounts> = {}): NearbyCounts {
  return {
    gate: 5,
    hotel: 10,
    historical: 3,
    restaurant: 8,
    cafe: 4,
    toilet: 6,
    atm: 2,
    pharmacy: 0,
    mosque: 3,
    ...overrides,
  };
}

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

describe("NearbyChipBar", () => {
  const noop = () => {};

  beforeEach(resetStore);
  afterEach(resetStore);

  it("renders a chip per enabled category with Bengali counts", () => {
    render(
      <NearbyChipBar
        counts={makeCounts()}
        activeCategory={null}
        onSelectCategory={noop}
        onOpenSettings={noop}
      />
    );
    expect(screen.getByTestId("nearby-chip-hotel")).toHaveTextContent("১০ হোটেল");
    expect(screen.getByTestId("nearby-chip-gate")).toHaveTextContent("৫ গেট");
    expect(screen.getByTestId("nearby-chip-restaurant")).toHaveTextContent("৮ রেস্টুরেন্ট");
  });

  it("marks the active chip as pressed", () => {
    render(
      <NearbyChipBar
        counts={makeCounts()}
        activeCategory={"hotel" as NearbyCategory}
        onSelectCategory={noop}
        onOpenSettings={noop}
      />
    );
    expect(screen.getByTestId("nearby-chip-hotel")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("nearby-chip-gate")).toHaveAttribute("aria-pressed", "false");
  });

  it("disables zero-count inactive chips but keeps active ones tappable", () => {
    render(
      <NearbyChipBar
        counts={makeCounts()}
        activeCategory={"pharmacy" as NearbyCategory}
        onSelectCategory={noop}
        onOpenSettings={noop}
      />
    );
    // pharmacy: ০টি কিন্তু সক্রিয় — টগল-অফ করা যায়
    expect(screen.getByTestId("nearby-chip-pharmacy")).not.toBeDisabled();
    // mosque সক্রিয় নয়, গণনা ৩ — সক্রিয়
    expect(screen.getByTestId("nearby-chip-mosque")).not.toBeDisabled();
  });

  it("disables inactive zero-count chips", () => {
    render(
      <NearbyChipBar
        counts={makeCounts()}
        activeCategory={null}
        onSelectCategory={noop}
        onOpenSettings={noop}
      />
    );
    expect(screen.getByTestId("nearby-chip-pharmacy")).toBeDisabled();
  });

  it("hides disabled categories from settings", () => {
    useNearbyStore.setState({
      enabledCategories: DEFAULT_ENABLED_CATEGORIES.filter((c) => c !== "mosque"),
    });
    render(
      <NearbyChipBar
        counts={makeCounts()}
        activeCategory={null}
        onSelectCategory={noop}
        onOpenSettings={noop}
      />
    );
    expect(screen.queryByTestId("nearby-chip-mosque")).toBeNull();
    expect(screen.getByTestId("nearby-chip-hotel")).toBeInTheDocument();
  });

  it("fires category selection and settings callbacks", () => {
    const onSelect = vi.fn();
    const onSettings = vi.fn();
    render(
      <NearbyChipBar
        counts={makeCounts()}
        activeCategory={null}
        onSelectCategory={onSelect}
        onOpenSettings={onSettings}
      />
    );
    fireEvent.click(screen.getByTestId("nearby-chip-hotel"));
    expect(onSelect).toHaveBeenCalledWith("hotel");
    fireEvent.click(screen.getByTestId("nearby-settings-button"));
    expect(onSettings).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when hidden", () => {
    const { container } = render(
      <NearbyChipBar
        counts={makeCounts()}
        activeCategory={null}
        hidden
        onSelectCategory={noop}
        onOpenSettings={noop}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
