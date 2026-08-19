import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { useGuideSheetNearbySync } from "@/lib/hooks/useGuideSheetNearbySync";
import { useNearbyStore, NEARBY_RADIUS_DEFAULT } from "@/lib/store/nearbyStore";
import { useGuideSheetStore } from "@/lib/store/guideSheetStore";
import { DEFAULT_ENABLED_CATEGORIES } from "@/lib/nearby/categories";

// প্রতি টেস্টে কাছাকাছি স্টোর নতুন করে - সেশন-স্টেট (বিভাগ/তালিকা) বাদ দিয়ে।
beforeEach(() => {
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
  useGuideSheetStore.getState().clearSheetSnap();
});

/** কোরিওগ্রাফি হুক ডাকে + বর্তমান snapIndex প্রকাশ করে; বোতামে নামানো/তোলা যায়। */
function Harness() {
  useGuideSheetNearbySync();
  const { snapIndex, snapToIndex } = useBottomSheet();
  return (
    <div>
      <span data-testid="probe" data-snap-index={snapIndex} />
      <button data-testid="peek" onClick={() => snapToIndex(0)} />
      <button data-testid="expand" onClick={() => snapToIndex(2)} />
    </div>
  );
}

function renderSheet() {
  // TawafGuideSheet-এর মতোই onSnapChange স্টোরে যুক্ত - উৎপাদন ওয়্যারিংয়ের প্রতিচ্ছবি।
  return render(
    <BottomSheet
      open
      onOpenChange={vi.fn()}
      snapPoints={[0.12, 0.42, 0.92]}
      defaultSnap={1}
      onSnapChange={(index) => useGuideSheetStore.getState().setSheetSnap(index)}
    >
      <Harness />
    </BottomSheet>
  );
}

/** সেটেল-টুইন (সর্বোচ্চ ~৪০০ms) শেষ হওয়ার অপেক্ষা। */
async function waitForSettle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
}

describe("useGuideSheetNearbySync", () => {
  it("চিপ চালু হলে টার্গেট স্ন্যাপ সিঙ্ক্রোনাস স্টোরে peek হয়, ভিজ্যুয়াল সেটলের আগেই", async () => {
    const { getByTestId } = renderSheet();
    await waitForSettle();
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("1");

    act(() => {
      useNearbyStore.getState().setActiveCategory("hotel");
    });

    // ক্যামেরার padding/ওভারলে এটি পড়ে - ভিজ্যুয়াল সেটলের আগেই
    expect(useGuideSheetStore.getState().snapIndex).toBe(0);
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("1");

    await waitForSettle();
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("0");
    expect(useNearbyStore.getState().activeCategory).toBe("hotel");
  });

  it("চিপ বন্ধ হলে আমাদের নামানো শিট আগের স্ন্যাপে ফেরে", async () => {
    const { getByTestId } = renderSheet();
    act(() => {
      useNearbyStore.getState().setActiveCategory("hotel");
    });
    await waitForSettle();
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("0");

    act(() => {
      useNearbyStore.getState().setActiveCategory(null);
    });
    expect(useGuideSheetStore.getState().snapIndex).toBe(1);

    await waitForSettle();
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("1");
  });

  it("ব্যবহারকারী শিট নিজে তুললে সক্রিয় বিভাগ নিভে যায় - গাইড জেতে", async () => {
    const { getByTestId } = renderSheet();
    act(() => {
      useNearbyStore.getState().setActiveCategory("hotel");
    });
    await waitForSettle();
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("0");

    act(() => {
      getByTestId("expand").click();
    });
    await waitForSettle();
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("2");
    expect(useNearbyStore.getState().activeCategory).toBeNull();
  });

  it("ব্যবহারকারীর নিজে নামানো peek-এ চিপ চালু/বন্ধ হলে শিট নড়ে না", async () => {
    const { getByTestId } = renderSheet();
    act(() => {
      getByTestId("peek").click();
    });
    await waitForSettle();
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("0");

    act(() => {
      useNearbyStore.getState().setActiveCategory("hotel");
    });
    await waitForSettle();
    expect(useGuideSheetStore.getState().snapIndex).toBe(0);

    act(() => {
      useNearbyStore.getState().setActiveCategory(null);
    });
    await waitForSettle();
    // আমরা নামাইনি - তাই ফেরতও তোলা হয় না
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("0");
  });

  it("শিট খোলা মুহূর্তে বিভাগ সক্রিয় থাকলে গাইডই দখল নেয় - চিপ নিভে যায়", async () => {
    act(() => {
      useNearbyStore.getState().setActiveCategory("hotel");
    });

    renderSheet();
    expect(useNearbyStore.getState().activeCategory).toBeNull();

    await waitForSettle();
    // শিট normal স্ন্যাপেই খোলা থাকে - peek-এ নামার দরকার নেই
    expect(useGuideSheetStore.getState().snapIndex).toBe(1);
  });

  it("আনমাউন্ট হলে সাবস্ক্রিপশন খুলে যায়", async () => {
    const { unmount } = renderSheet();
    unmount();
    // খোলার সময়ের লেখা পরিষ্কার করে নেওয়া - তবেই লিক ধরা যায়।
    useGuideSheetStore.getState().clearSheetSnap();

    act(() => {
      useNearbyStore.getState().setActiveCategory("hotel");
    });
    expect(useGuideSheetStore.getState().snapIndex).toBeNull();
  });
});
