import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

type ChangeListener = (event: { matches: boolean }) => void;

/** tests/setup.ts-এর নো-অপ মকের বদলে নিয়ন্ত্রণযোগ্য matchMedia বসায়। */
function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<ChangeListener>();
  const mql = {
    matches: initialMatches,
    addEventListener: (_type: string, listener: ChangeListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: ChangeListener) => {
      listeners.delete(listener);
    },
  };
  const original = window.matchMedia;
  window.matchMedia = (() => mql) as unknown as typeof window.matchMedia;
  return {
    setMatches(matches: boolean) {
      mql.matches = matches;
      listeners.forEach((listener) => listener({ matches }));
    },
    listenerCount: () => listeners.size,
    restore() {
      window.matchMedia = original;
    },
  };
}

let media: ReturnType<typeof installMatchMedia>;
beforeEach(() => {
  media = installMatchMedia(true);
});
afterEach(() => media.restore());

describe("useMediaQuery", () => {
  it("মাউন্টের পরে মিডিয়া কোয়েরির বর্তমান অবস্থা দেয়", async () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 640px)"));

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("মিডিয়া অবস্থা পরিবর্তনে আপডেট হয়", async () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 640px)"));

    await waitFor(() => expect(result.current).toBe(true));

    act(() => media.setMatches(false));
    expect(result.current).toBe(false);

    act(() => media.setMatches(true));
    expect(result.current).toBe(true);
  });

  it("unmount-এ change listener সরিয়ে দেয়", async () => {
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 640px)"));

    await waitFor(() => expect(media.listenerCount()).toBe(1));

    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it("matchMedia না থাকলে নীরবে false থাকে (SSR/পুরনো jsdom গার্ড)", () => {
    media.restore();
    window.matchMedia = undefined as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useMediaQuery("(min-width: 640px)"));
    expect(result.current).toBe(false);
  });
});
