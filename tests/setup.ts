import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
// jest-dom ম্যাচার রানটাইমে যোগ করে এবং vitest-এর Assertion টাইপ সম্প্রসারণ করে
// (toBeVisible, toHaveAttribute ইত্যাদি)।
import "@testing-library/jest-dom/vitest";

// jsdom-এ window.matchMedia / IntersectionObserver নেই — যেসব ক্লায়েন্ট কম্পোনেন্ট
// (Reveal, BottomSheet, theme-provider) এগুলো ব্যবহার করে তাদের পরীক্ষার জন্য মক।
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }
  // maplibre-gl-এর কর্মী (worker) URL jsdom-এ Blob->objectURL মক প্রয়োজন
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = (() =>
      "blob:mock-worker") as unknown as typeof URL.createObjectURL;
  }
  if (!window.IntersectionObserver) {
    class FakeIO {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIO;
  }
}

afterEach(() => {
  cleanup();
});
