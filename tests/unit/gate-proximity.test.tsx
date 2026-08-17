import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGateProximity } from "@/lib/hooks/useGateProximity";
import { useLocationStore } from "@/lib/store";

// হুকটি লোকেশন স্টোরের শুধু latitude/longitude স্লাইস সাবস্ক্রাইব করে। GPS
// ফিক্সে স্টোরে heading/speed-ও লেখা হয় — সেই লেখায় কনজিউমার রি-রেন্ডার
// হবে না, অবস্থান বদলালে হবে (প্রতি ফিক্সে পুরো মানচিত্র পেজ রি-রেন্ডার
// এড়াতে স্লাইসিং)।
describe("useGateProximity subscription slicing", () => {
  afterEach(() => {
    useLocationStore.setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      heading: null,
      speed: null,
    });
  });

  it("অবস্থান না থাকলে ফাঁকা তালিকা দেয়", () => {
    const { result } = renderHook(() => useGateProximity());
    expect(result.current.nearbyGates).toEqual([]);
    expect(result.current.hasLocation).toBe(false);
  });

  it("heading/speed আপডেটে রি-রেন্ডার করে না, অবস্থান বদলালে করে", () => {
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useGateProximity();
    });

    // কাবার কাছে একটি অবস্থান বসাও — একবার রি-রেন্ডার হবে।
    act(() => {
      useLocationStore.getState().setLocation(21.4225, 39.8262, 10);
    });
    expect(result.current.hasLocation).toBe(true);
    const rendersAfterLocation = renderCount;

    // শুধু heading/speed লেখা হলে হুক রি-রেন্ডার করবে না।
    act(() => {
      useLocationStore.getState().setHeading(90);
      useLocationStore.getState().setSpeed(1.2);
    });
    expect(renderCount).toBe(rendersAfterLocation);

    // অবস্থান বদলালে অবশ্যই আপডেট হবে।
    act(() => {
      useLocationStore.getState().setLocation(21.4226, 39.8262, 10);
    });
    expect(renderCount).toBeGreaterThan(rendersAfterLocation);
    expect(result.current.hasLocation).toBe(true);
  });
});
