import { describe, expect, it } from "vitest";
import { isFatalBasemapError, BASEMAP_LOAD_WATCHDOG_MS } from "@/lib/map/basemap-health";

describe("isFatalBasemapError", () => {
  it("treats any pre-load error as fatal (no tiles are in flight yet)", () => {
    expect(isFatalBasemapError({ status: 401, message: "Unauthorized" }, false)).toBe(true);
    expect(isFatalBasemapError({ message: "Failed to fetch" }, false)).toBe(true);
    expect(isFatalBasemapError({ message: "Unexpected token < in JSON" }, false)).toBe(true);
  });

  it("never fails the basemap after load succeeded", () => {
    // Post-load errors are single-tile hiccups; tiles retry themselves.
    expect(isFatalBasemapError({ status: 404, message: "tile not found" }, true)).toBe(false);
    expect(isFatalBasemapError({ message: "Failed to fetch" }, true)).toBe(false);
  });

  it("ignores in-flight aborts even before load", () => {
    expect(isFatalBasemapError({ message: "Request aborted during pan" }, false)).toBe(false);
    expect(
      isFatalBasemapError(new DOMException("signal is aborted without reason", "AbortError"), false)
    ).toBe(false);
  });

  it("returns false when there is no error object at all", () => {
    expect(isFatalBasemapError(null, false)).toBe(false);
    expect(isFatalBasemapError(undefined, false)).toBe(false);
  });
});

describe("BASEMAP_LOAD_WATCHDOG_MS", () => {
  it("allows slow Haram-grade networks before declaring failure", () => {
    // Well past a typical desktop load, generous enough for congested cells.
    expect(BASEMAP_LOAD_WATCHDOG_MS).toBeGreaterThanOrEqual(15_000);
  });
});
