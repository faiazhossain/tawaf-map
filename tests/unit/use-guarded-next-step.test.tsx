import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGuardedNextStep } from "@/lib/hooks/useGuardedNextStep";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";

// আসল ধাপের id ব্যবহার করা হয়েছে যাতে getStepById (selectCurrentStep/selectIsComplete
// ভেতরে) ধাপ মিলাতে পারে: prep=manual, tawaf=counter-max।
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
});

describe("useGuardedNextStep", () => {
  it("অসম্পন্ন ধাপে ব্লক করে: blocker সেট হয়, সামনে যায় না", () => {
    const { result } = renderHook(() => useGuardedNextStep());
    expect(result.current.blocker).toBeNull();

    act(() => result.current.handleNext());

    expect(result.current.blocker?.id).toBe("prep");
    expect(useUmrahGuideStore.getState().currentIndex).toBe(0);
  });

  it("সম্পন্ন ধাপে সাধারণভাবে পরবর্তীতে যায়, কোনো ব্লক নেই", () => {
    useUmrahGuideStore.setState({ completed: { prep: true } });
    const { result } = renderHook(() => useGuardedNextStep());

    act(() => result.current.handleNext());

    expect(result.current.blocker).toBeNull();
    expect(useUmrahGuideStore.getState().currentIndex).toBe(1);
  });

  it("confirmMarkComplete: ধাপ সম্পন্ন চিহ্নিত করে পরবর্তীতে এগোয়", () => {
    const { result } = renderHook(() => useGuardedNextStep());
    act(() => result.current.handleNext()); // ব্লক: prep
    expect(result.current.blocker?.id).toBe("prep");

    act(() => result.current.confirmMarkComplete());

    expect(result.current.blocker).toBeNull();
    expect(useUmrahGuideStore.getState().completed.prep).toBe(true);
    expect(useUmrahGuideStore.getState().currentIndex).toBe(1);
  });

  it("closeDialog: blocker ফেলে দেয়, ধাপ/অবস্থান অপরিবর্তিত", () => {
    const { result } = renderHook(() => useGuardedNextStep());
    act(() => result.current.handleNext()); // ব্লক

    act(() => result.current.closeDialog());

    expect(result.current.blocker).toBeNull();
    expect(useUmrahGuideStore.getState().completed.prep).toBeUndefined();
    expect(useUmrahGuideStore.getState().currentIndex).toBe(0);
  });

  it("counter-max ধাপে confirmMarkComplete কিছু পরিবর্তন না করে শুধু বন্ধ করে", () => {
    useUmrahGuideStore.setState({ currentIndex: 2 }); // tawaf (counter-max, অসম্পন্ন)
    const { result } = renderHook(() => useGuardedNextStep());

    act(() => result.current.handleNext()); // ব্লক: tawaf
    expect(result.current.blocker?.id).toBe("tawaf");

    act(() => result.current.confirmMarkComplete());

    expect(result.current.blocker).toBeNull();
    expect(useUmrahGuideStore.getState().completed.tawaf).toBeUndefined();
    expect(useUmrahGuideStore.getState().currentIndex).toBe(2);
  });
});
