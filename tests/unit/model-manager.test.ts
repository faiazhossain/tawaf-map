import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fetchModelBytes, prefetchModel, shouldBackgroundLoad } from "@/lib/map/model-manager";

/** Minimal Map-backed Cache Storage stub. */
function stubCaches() {
  const store = new Map<string, Response>();
  const cache = {
    match: (url: string) => Promise.resolve(store.get(url) ?? undefined),
    put: (url: string, response: Response) =>
      response
        .arrayBuffer()
        .then((buf) => store.set(url, new Response(buf as ArrayBuffer)))
        .then(() => undefined),
  };
  const cachesLike = {
    match: (url: string) => cache.match(url),
    open: () => Promise.resolve(cache),
  };
  vi.stubGlobal("caches", cachesLike);
  return store;
}

function stubFetch(bytes: Uint8Array) {
  const calls: string[] = [];
  const fn = vi.fn((url: string) => {
    calls.push(url);
    const body = new Uint8Array(bytes); // fresh copy, ArrayBuffer-typed body
    return Promise.resolve(
      new Response(body, {
        headers: { "Content-Length": String(bytes.byteLength) },
      })
    );
  });
  vi.stubGlobal("fetch", fn);
  return { fn, calls };
}

describe("model-manager", () => {
  beforeEach(() => {
    stubCaches();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("downloads once and then serves from Cache Storage on later calls", async () => {
    const { fn } = stubFetch(new Uint8Array([1, 2, 3, 4]));
    const url = "/models/a.glb";

    const first = await fetchModelBytes(url);
    expect(first.byteLength).toBe(4);
    expect(fn).toHaveBeenCalledTimes(1);

    // writeCachedBytes is fire-and-forget — let its promise chain land before
    // the next read.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Second call: served from the cache, no new network request.
    const second = await fetchModelBytes(url);
    expect(second.byteLength).toBe(4);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent requests for the same URL into one download", async () => {
    const { fn } = stubFetch(new Uint8Array([9, 9]));
    const url = "/models/b.glb";

    const [a, b] = await Promise.all([fetchModelBytes(url), fetchModelBytes(url)]);
    expect(a.byteLength).toBe(2);
    expect(b.byteLength).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives a late joiner live progress for a download started without a callback", async () => {
    // Reproduces the stuck-at-0% regression: the intent prefetch starts the
    // masjid download with NO progress callback, then the layer load joins
    // mid-flight WITH one — it must still receive progress events.
    stubCaches();
    let streamController!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        streamController = c;
      },
    });
    const fn = vi.fn(() =>
      Promise.resolve(new Response(stream, { headers: { "Content-Length": "4" } }))
    );
    vi.stubGlobal("fetch", fn);

    const url = "/models/join.glb";
    const first = fetchModelBytes(url); // no callback (prefetch)
    streamController.enqueue(new Uint8Array([1, 2]));
    // Let the reader loop deliver chunk 1 and record progress.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const events: Array<[number, number]> = [];
    const second = fetchModelBytes(url, (loaded, total) => events.push([loaded, total]));

    // The joiner immediately gets a snapshot of the current progress...
    expect(events[0]).toEqual([2, 4]);

    streamController.enqueue(new Uint8Array([3, 4]));
    streamController.close();
    await Promise.all([first, second]);

    // ...and keeps receiving chunks until completion. One download total.
    expect(events[events.length - 1]).toEqual([4, 4]);
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("surfaces HTTP failures as errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("nope", { status: 404 })))
    );
    await expect(fetchModelBytes("/models/missing.glb")).rejects.toThrow(/HTTP 404/);
  });

  it("skips background prefetch entirely when Data Saver is on", async () => {
    const { fn } = stubFetch(new Uint8Array([1]));
    vi.stubGlobal("navigator", { connection: { saveData: true } });
    // navigator is read inside shouldBackgroundLoad via the global, so verify
    // through the exported policy + prefetch behavior.
    expect(shouldBackgroundLoad()).toBe(false);
    await prefetchModel("/models/tower.glb");
    expect(fn).not.toHaveBeenCalled();
  });

  it("skips background prefetch on 2G/3G-class connections", () => {
    stubFetch(new Uint8Array([1]));
    vi.stubGlobal("navigator", { connection: { effectiveType: "3g" } });
    expect(shouldBackgroundLoad()).toBe(false);
  });

  it("allows background loading on 4G without Data Saver", () => {
    stubFetch(new Uint8Array([1]));
    vi.stubGlobal("navigator", { connection: { effectiveType: "4g", saveData: false } });
    expect(shouldBackgroundLoad()).toBe(true);
  });

  it("prefetch failures resolve silently (never surface errors)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline")))
    );
    vi.stubGlobal("navigator", { connection: { effectiveType: "4g" } });
    await expect(prefetchModel("/models/whatever.glb")).resolves.toBeUndefined();
  });
});
