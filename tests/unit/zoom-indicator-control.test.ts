import { describe, it, expect, vi, afterEach } from "vitest";
import type { Map as MapLibreMap } from "maplibre-gl";
import { ZoomIndicatorControl } from "@/components/map/ZoomIndicatorControl";

// MapLibre Map-এর ন্যূনতম ভূমিকা — কন্ট্রোল শুধু `on`/`off`/`getZoom` ব্যবহার করে।
class FakeMap {
  zoom: number;
  private readonly zoomHandlers = new Set<() => void>();
  readonly offCalls: Array<{ event: string; handler: () => void }> = [];

  constructor(zoom: number) {
    this.zoom = zoom;
  }

  getZoom(): number {
    return this.zoom;
  }

  on(event: string, handler: () => void): void {
    if (event === "zoom") this.zoomHandlers.add(handler);
  }

  off(event: string, handler: () => void): void {
    this.offCalls.push({ event, handler });
    if (event === "zoom") this.zoomHandlers.delete(handler);
  }

  emitZoom(): void {
    this.zoomHandlers.forEach((handler) => handler());
  }
}

function createFakeMap(zoom: number): FakeMap & MapLibreMap {
  return new FakeMap(zoom) as FakeMap & MapLibreMap;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ZoomIndicatorControl", () => {
  it("ম্যাপের কন্ট্রোল কলামের জন্য প্রস্তুত এলিমেন্ট দেয়, গোড়ার ভগ্নাংশ রাউন্ড করে দেখায়", () => {
    const map = createFakeMap(17.3);
    const control = new ZoomIndicatorControl();

    const el = control.onAdd(map);

    expect(el.className).toContain("maplibregl-ctrl");
    // ctrl-group ক্লাসটা MapLibre-এর নিজের স্টাইলশিট থেকে ব্যাকগ্রাউন্ড,
    // রেডিয়াস ও রিং-শ্যাডো আনে — সহোদর কন্ট্রোলগুলোর সাথে চেহারা মেলানোর চুক্তি।
    expect(el.className).toContain("maplibregl-ctrl-group");
    expect(el.className).toContain("h-[29px]");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.className).toContain("pointer-events-none");
    expect(el.textContent).toBe("17z");
  });

  it("জুম ইভেন্টে লেবেল আপডেট করে", () => {
    const map = createFakeMap(17.3);
    const control = new ZoomIndicatorControl();
    const el = control.onAdd(map);

    map.zoom = 18.6;
    map.emitZoom();
    expect(el.textContent).toBe("19z");

    map.zoom = 12.2;
    map.emitZoom();
    expect(el.textContent).toBe("12z");
  });

  it("একই পূর্ণসংখ্যার ভেতরে থাকা প্রতি-ফ্রেম ইভেন্টে DOM-এ লেখে না (পিঞ্চ জেসচারে সাশ্রয়)", () => {
    const textSetter = vi.spyOn(Node.prototype, "textContent", "set");
    const map = createFakeMap(17.3);
    const control = new ZoomIndicatorControl();
    const el = control.onAdd(map);
    // onAdd-এ প্রাথমিক মান লেখা হয়েছে একবার।
    expect(textSetter).toHaveBeenCalledTimes(1);

    map.zoom = 17.4;
    map.emitZoom(); // এখনো 17 — লেখা হওয়ার কথা নয়
    expect(textSetter).toHaveBeenCalledTimes(1);
    expect(el.textContent).toBe("17z");

    map.zoom = 17.6;
    map.emitZoom(); // 18 হয়েছে — একবার লেখা হবে
    expect(textSetter).toHaveBeenCalledTimes(2);
    expect(el.textContent).toBe("18z");

    map.zoom = 18.4;
    map.emitZoom(); // এখনো 18 — আবার নয়
    expect(textSetter).toHaveBeenCalledTimes(2);
  });

  it("onRemove-এ জুম লিসেনার খুলে দেয়", () => {
    const map = createFakeMap(17.3);
    const control = new ZoomIndicatorControl();
    control.onAdd(map);

    control.onRemove(map);

    expect(map.offCalls).toHaveLength(1);
    expect(map.offCalls[0].event).toBe("zoom");
    // খোলার পরে ইভেন্ট ছুড়লে আর কোনো লিসেনার কাজ করে না।
    map.zoom = 3;
    map.emitZoom();
    expect(() => map.emitZoom()).not.toThrow();
  });
});
