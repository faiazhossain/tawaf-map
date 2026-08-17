import { describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { TawafGuideSheet } from "@/components/umrah/guide/TawafGuideSheet";

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
