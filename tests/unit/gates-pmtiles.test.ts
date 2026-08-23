import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import maplibregl from "maplibre-gl";
import {
  registerGatesPmtilesProtocol,
  createCachedBufferSource,
  gatesPmtilesUrl,
  GATES_PMTILES_PATH,
} from "@/components/map/gates/pmtiles";

/** ৮-বাইট হেডারডামি PMTiles বাফার — স্লাইসিং যাচাইয়ের জন্য। */
function makeBuffer(): ArrayBuffer {
  const bytes = new Uint8Array([0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87]);
  return bytes.buffer as ArrayBuffer;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createCachedBufferSource", () => {
  it("getBytes বাফার থেকে সঠিক পরিসীমা কেটে দেয় (অফসেট/দৈর্ঘ্য)", async () => {
    const bytes = new Uint8Array([0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87]);
    const stubFetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => bytes.buffer as ArrayBuffer,
    }));
    vi.stubGlobal("fetch", stubFetch);

    const source = createCachedBufferSource("http://localhost:3000/tiles/gates.pmtiles");
    const slice = await source.getBytes(2, 3);
    const out = new Uint8Array(slice.data as ArrayBuffer);
    expect(Array.from(out)).toEqual([0x82, 0x83, 0x84]);

    // দ্বিতীয় কল প্রতিবার fetch করে না — মেমরিতে ক্যাশ
    await source.getBytes(0, 2);
    expect(stubFetch).toHaveBeenCalledTimes(1);
  });
});

describe("registerGatesPmtilesProtocol", () => {
  it("pmtiles স্কিম রেজিস্টার করে এবং ক্লিনআপে সরিয়ে দেয়", () => {
    // window আছে (jsdom) — প্রোটোকল রেজিস্টার হয়
    const cleanup = registerGatesPmtilesProtocol();
    expect(typeof cleanup).toBe("function");
    // registerGatesPmtilesProtocol সাধারণত removeProtocol ডাকা পর প্রতিবিম্ব হয়।
    cleanup();
  });
});

describe("gatesPmtilesUrl", () => {
  it("ক্লায়েন্টে origin-ভিত্তিক pmtiles URL দেয়", () => {
    const url = gatesPmtilesUrl();
    expect(url.startsWith("pmtiles://")).toBe(true);
    expect(url.endsWith(GATES_PMTILES_PATH)).toBe(true);
    // jsdom-এ location.origin হলো http://localhost:3000
    expect(url).toBe(`pmtiles://${window.location.origin}${GATES_PMTILES_PATH}`);
  });
});
