import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  useNearbyStore,
  NEARBY_RADIUS_DEFAULT,
  NEARBY_RADIUS_MAX,
  NEARBY_RADIUS_MIN,
} from "@/lib/store/nearbyStore";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";
import { getNearbyItems } from "@/lib/nearby/query";
import { MAKKAH_CENTER } from "@/lib/utils/constants";
import type { NearbyItem } from "@/types/nearby";

/** প্রতি টেস্টের আগে স্টোর ডিফল্টে ফেরানো */
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

function sampleItem(): NearbyItem {
  return getNearbyItems("hotel", MAKKAH_CENTER.lat, MAKKAH_CENTER.lng, 3000)[0];
}

describe("nearbyStore radius", () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  it("clamps setRadius to the min/max band", () => {
    useNearbyStore.getState().setRadius(50);
    expect(useNearbyStore.getState().radius).toBe(NEARBY_RADIUS_MIN);
    useNearbyStore.getState().setRadius(99999);
    expect(useNearbyStore.getState().radius).toBe(NEARBY_RADIUS_MAX);
    useNearbyStore.getState().setRadius(750);
    expect(useNearbyStore.getState().radius).toBe(750);
  });

  it("stepRadius accumulates and clamps", () => {
    useNearbyStore.getState().setRadius(2900);
    useNearbyStore.getState().stepRadius(200);
    expect(useNearbyStore.getState().radius).toBe(NEARBY_RADIUS_MAX);
    useNearbyStore.getState().stepRadius(-1000);
    expect(useNearbyStore.getState().radius).toBe(NEARBY_RADIUS_MAX - 1000);
  });
});

describe("nearbyStore category lifecycle", () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  it("activating a category resets list and selection", () => {
    const item = sampleItem();
    useNearbyStore.getState().selectItem(item);
    useNearbyStore.getState().setActiveCategory("hotel");
    expect(useNearbyStore.getState().activeCategory).toBe("hotel");
    expect(useNearbyStore.getState().listMode).toBe("cards");
    expect(useNearbyStore.getState().selectedItem).toBeNull();
  });

  it("tapping the active category toggles it off", () => {
    useNearbyStore.getState().setActiveCategory("hotel");
    useNearbyStore.getState().setActiveCategory("hotel");
    expect(useNearbyStore.getState().activeCategory).toBeNull();
  });

  it("toggling off the active category clears its selection too", () => {
    // "গেট খুঁজুন"-এর মতো পথে সংশ্লিষ্ট বিভাগ সক্রিয় থাকলে ডাবল-সক্রিয়করণ
    // টগল-অফ হয়ে যায় — তাই কলারকে আগে activeCategory মিলিয়ে নিতে হয়
    useNearbyStore.getState().setActiveCategory("gate");
    useNearbyStore.getState().selectItem(sampleItem());
    useNearbyStore.getState().setActiveCategory("gate");
    const state = useNearbyStore.getState();
    expect(state.activeCategory).toBeNull();
    expect(state.selectedItem).toBeNull();
  });

  it("disabling an enabled category deactivates it if active", () => {
    useNearbyStore.getState().setActiveCategory("cafe");
    useNearbyStore.getState().toggleEnabledCategory("cafe");
    const state = useNearbyStore.getState();
    expect(state.enabledCategories).not.toContain("cafe");
    expect(state.activeCategory).toBeNull();
    expect(state.selectedItem).toBeNull();
    // পুনরায় চালু করা যায়
    useNearbyStore.getState().toggleEnabledCategory("cafe");
    expect(useNearbyStore.getState().enabledCategories).toContain("cafe");
  });
});

describe("nearbyStore selection", () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  it("selectItem stores the snapshot and collapses the list", () => {
    useNearbyStore.getState().setActiveCategory("hotel");
    useNearbyStore.getState().expandList();
    const item = sampleItem();
    useNearbyStore.getState().selectItem(item);
    const state = useNearbyStore.getState();
    expect(state.selectedItem).toBe(item);
    expect(state.listMode).toBe("cards");
    expect(state.activeCategory).toBe("hotel");
  });

  it("clearSelection also closes the modal", () => {
    const item = sampleItem();
    useNearbyStore.getState().selectItem(item);
    useNearbyStore.getState().openDetailModal();
    useNearbyStore.getState().clearSelection();
    const state = useNearbyStore.getState();
    expect(state.selectedItem).toBeNull();
    expect(state.detailModalOpen).toBe(false);
  });
});

describe("nearbyStore persistence", () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  it("persist partialize keeps only settings fields", () => {
    // persist মিডলওয়্যার স্টোরে partialize ফলাফল ধরে রাখে না; আচরণগত
    // যাচাই: সেটিংস বদলালে হাইড্রেশন-অংশ অক্ষত থাকে, ক্ষণস্থায়ী অংশ নয়।
    useNearbyStore.getState().setRadius(1500);
    useNearbyStore.getState().setHalalOnly(false);
    useNearbyStore.getState().setActiveCategory("gate");
    useNearbyStore.getState().openSettings();

    const raw = window.localStorage.getItem("tawaf:nearby-settings");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? "{}");
    expect(parsed.state.radius).toBe(1500);
    expect(parsed.state.halalOnly).toBe(false);
    expect(parsed.state.activeCategory).toBeUndefined();
    expect(parsed.state.settingsOpen).toBeUndefined();
  });
});
