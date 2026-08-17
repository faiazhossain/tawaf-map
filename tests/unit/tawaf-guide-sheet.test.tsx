import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { TawafGuideSheet } from "@/components/umrah/guide/TawafGuideSheet";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { useGuideSheetStore } from "@/lib/store/guideSheetStore";

// jsdom has no TouchEvent; dispatch plain Events with touches patched on.
function touchPayload(clientY: number): { touches: Touch[]; changedTouches: Touch[] } {
  const touch = { identifier: 1, clientX: 100, clientY } as Touch;
  return { touches: [touch], changedTouches: [touch] };
}

function fireTouch(
  target: Element,
  type: string,
  payload: { touches: Touch[]; changedTouches: Touch[] }
): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, payload);
  target.dispatchEvent(event);
}

function endTouches(clientY: number): { touches: Touch[]; changedTouches: Touch[] } {
  return { touches: [], changedTouches: [touchPayload(clientY).changedTouches[0]] };
}

/**
 * গাইড শীট কখনো ড্র্যাগে বন্ধ হবে না: ব্যবহারকারী বারবার নিচে টেনে ছোট করার
 * চেষ্টা করলেও onOpenChange(false) ডাকা যাবে না (গাইড নিষ্ক্রিয় হওয়া যাবে না)।
 */
describe("TawafGuideSheet drag dismissal", () => {
  it("repeated downward flings never close the guide", async () => {
    const onOpenChange = vi.fn();
    render(<TawafGuideSheet open onOpenChange={onOpenChange} onOpenMistake={vi.fn()} />);
    const sheet = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(sheet).not.toBeNull();
    const region = sheet.querySelector("[data-sheet-drag-region]") as HTMLElement;
    expect(region).not.toBeNull();
    sheet.getBoundingClientRect = () =>
      ({ width: 375, height: 300, top: 0, left: 0, right: 375, bottom: 300 }) as DOMRect;

    // Three hard downward flings in a row, each faster than the dismiss threshold.
    for (let attempt = 0; attempt < 3; attempt++) {
      fireTouch(region, "touchstart", touchPayload(200));
      fireTouch(sheet, "touchmove", touchPayload(300));
      fireTouch(sheet, "touchmove", touchPayload(420));
      fireTouch(sheet, "touchend", endTouches(420));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
      });
    }

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

/**
 * কোরিওগ্রাফি ইন্টিগ্রেশন: খোলা/ড্র্যাগ/বন্ধ অবস্থা guideSheetStore-এ প্রতিফলিত হয়,
 * আর ধাপ বদলালে বিস্তারিত (স্ন্যাপ ২) থেকে normal (স্ন্যাপ ১)-এ নেমে আসে।
 */
describe("TawafGuideSheet store + step choreography", () => {
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

  async function settle(ms = 500) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  }

  it("খোলা মাত্র ডিফল্ট স্ন্যাপ স্টোরে লেখে, বন্ধ করলে null করে", () => {
    const { rerender } = render(
      <TawafGuideSheet open onOpenChange={vi.fn()} onOpenMistake={vi.fn()} />
    );
    expect(useGuideSheetStore.getState().snapIndex).toBe(1);

    rerender(<TawafGuideSheet open={false} onOpenChange={vi.fn()} onOpenMistake={vi.fn()} />);
    expect(useGuideSheetStore.getState().snapIndex).toBeNull();
  });

  it("বিস্তারিত থেকে ধাপ এগোলে শীট normal স্ন্যাপে ফিরে আসে", async () => {
    const { getByText } = render(
      <TawafGuideSheet open onOpenChange={vi.fn()} onOpenMistake={vi.fn()} />
    );

    // বিস্তারিতে প্রসারণ
    act(() => {
      getByText("বিস্তারিত").click();
    });
    await settle();
    expect(useGuideSheetStore.getState().snapIndex).toBe(2);

    // বিস্তারিত ফুটারের পরবর্তী বোতাম এখন দৃশ্যমান
    const nextButtons = getByText("পরবর্তী ধাপ");
    expect(nextButtons).not.toBeNull();

    // prep সম্পন্ন চিহ্নিত করে রাখলে স্টোরের nextStep এগোবে
    act(() => {
      useUmrahGuideStore.setState({ completed: { prep: true } });
    });
    act(() => {
      nextButtons.click();
    });

    // স্টোরে টার্গেট স্ন্যাপ সঙ্গে সঙ্গে, ভিজ্যুয়াল সেটল সামান্য পরে
    expect(useGuideSheetStore.getState().snapIndex).toBe(1);
    await settle();
    expect(useGuideSheetStore.getState().snapIndex).toBe(1);
    expect(useUmrahGuideStore.getState().currentIndex).toBe(1);
    // কম্প্যাক্ট ভিউতে ফিরেছে - বিস্তারিত বোতাম আবার দেখা যাচ্ছে
    expect(getByText("বিস্তারিত")).not.toBeNull();
  });

  it("শেষ ধাপে বিস্তারিত ফুটারে সংক্ষেপে থাকে, পরবর্তী নয়", async () => {
    useUmrahGuideStore.setState({
      stepIds: ["prep", "ihram-miqat"],
      currentIndex: 1,
    });
    const { getByText, queryByText } = render(
      <TawafGuideSheet open onOpenChange={vi.fn()} onOpenMistake={vi.fn()} />
    );

    act(() => {
      getByText("বিস্তারিত").click();
    });
    await settle();

    expect(queryByText("পরবর্তী ধাপ")).toBeNull();
    expect(getByText("সংক্ষেপে")).not.toBeNull();
  });
});
