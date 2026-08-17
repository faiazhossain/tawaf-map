import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { useGuideSheetStepSync } from "@/lib/hooks/useGuideSheetStepSync";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { useGuideSheetStore } from "@/lib/store/guideSheetStore";

// আসল ধাপের id - getStepById যেন ধাপ মিলাতে পারে।
beforeEach(() => {
  useUmrahGuideStore.setState({
    profile: null,
    onboarded: false,
    stepIds: ["prep", "ihram-miqat", "tawaf"],
    currentIndex: 0,
    completed: {},
    counters: {},
    mode: "guide",
  });
  useGuideSheetStore.getState().clearSheetSnap();
});

/** কোরিওগ্রাফি হুক ডাকে + বর্তমান snapIndex প্রকাশ করে; expand বোতাম দিয়ে স্ন্যাপ ২-এ যাওয়া যায়। */
function Harness() {
  useGuideSheetStepSync();
  const { snapIndex, snapToIndex } = useBottomSheet();
  return (
    <div>
      <span data-testid="probe" data-snap-index={snapIndex} />
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

describe("useGuideSheetStepSync", () => {
  it("ধাপ বদলালে টার্গেট স্ন্যাপ সিঙ্ক্রোনাস স্টোরে লেখে, ভিজ্যুয়াল সেটলের আগেই", async () => {
    const { getByTestId } = renderSheet();

    // শীট স্ন্যাপ ২-এ (বিস্তারিত) প্রসারিত করা
    act(() => {
      getByTestId("expand").click();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("2");

    act(() => {
      useUmrahGuideStore.setState({ currentIndex: 2 });
    });

    // স্টোরে সঙ্গে সঙ্গে টার্গেট (ক্যামেরার padding এটি পড়ে)...
    expect(useGuideSheetStore.getState().snapIndex).toBe(1);
    // ...কিন্তু ভিজ্যুয়াল সেটল এখনও চলছে
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("2");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("1");
  });

  it("কাউন্টার বা অন্য স্টেট বদলালে কিছু করে না", async () => {
    const { getByTestId } = renderSheet();
    act(() => {
      getByTestId("expand").click();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });
    expect(useGuideSheetStore.getState().snapIndex).toBe(2);

    act(() => {
      useUmrahGuideStore.setState({ counters: { tawaf: 3 } });
    });
    expect(useGuideSheetStore.getState().snapIndex).toBe(2);
    expect(getByTestId("probe").getAttribute("data-snap-index")).toBe("2");
  });

  it("আনমাউন্ট হলে সাবস্ক্রিপশন খুলে যায়", () => {
    const { unmount } = renderSheet();
    unmount();
    // খোলার সময়ের লেখা পরিষ্কার করে নেওয়া - তবেই লিক ধরা যায়।
    useGuideSheetStore.getState().clearSheetSnap();

    act(() => {
      useUmrahGuideStore.setState({ currentIndex: 1 });
    });
    expect(useGuideSheetStore.getState().snapIndex).toBeNull();
  });
});
