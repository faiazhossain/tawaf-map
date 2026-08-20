// Byte-level loading + caching for the 3D model GLBs, with the prefetch
// policy that decides WHEN models download (see also the per-model parsed
// instance cache in three-model-layer.ts, which makes re-adding a loaded model
// instant without re-parsing).
//
// Tiers: Cache Storage (durable across sessions) -> network. Concurrent
// requests for the same URL are deduped. Deliberately free of three.js so it
// can be imported statically anywhere (including the map page) without
// affecting the bundle.
//
// Loading policy (production behavior, mirrors how map services load landmark
// models):
//   1. BACKGROUND: after the map settles, prefetch only the cheap models
//      (PREFETCHABLE_MODEL_URLS) and only when the connection allows it
//      (shouldBackgroundLoad: never with Data Saver / 2G / 3G).
//   2. INTENT: touching the 3D button preloads what the 3D mode needs at the
//      camera's nearest venue (intentPreloadModelUrls in model-config.ts) —
//      explicit user intent, so no connection gating.
//   3. CLICK: the layer itself fetches through here, streaming progress.

const CACHE_NAME = "tawaf-3d-models-v2";
// v1 cached the 231MB masjid GLB under its old proxied URL (/models/...) before
// the asset was compressed and moved to a direct raw.githubusercontent URL —
// that ~231MB entry is unreachable dead weight now and gets pruned once.
const DEPRECATED_CACHE_NAMES = ["tawaf-3d-models-v1"];

/**
 * One-time cleanup of superseded cache versions. Fire-and-forget; safe to call
 * repeatedly (deleting a nonexistent cache resolves false).
 */
export function pruneDeprecatedModelCaches(): void {
  if (typeof caches === "undefined") return;
  for (const name of DEPRECATED_CACHE_NAMES) {
    try {
      void caches.delete(name).catch(() => undefined);
    } catch {
      // Cache Storage unavailable — nothing to prune.
    }
  }
}

// URL -> in-flight download, so the prefetch, the intent preload and the layer
// load never download the same GLB twice concurrently.
const inflight = new Map<string, Promise<ArrayBuffer>>();

// Progress fan-out per URL. A download often STARTS without a progress
// callback (the background prefetch / intent preload) and is later JOINED by
// the layer load, which needs the progress events for its overlay — so
// progress is broadcast to every current subscriber, and a new subscriber
// immediately receives the latest snapshot instead of showing 0% until the
// next chunk.
type ProgressListener = (loaded: number, total: number) => void;
const progressListeners = new Map<string, Set<ProgressListener>>();
const latestProgress = new Map<string, { loaded: number; total: number }>();

function emitProgress(url: string, loaded: number, total: number): void {
  latestProgress.set(url, { loaded, total });
  const listeners = progressListeners.get(url);
  if (!listeners) return;
  for (const listener of listeners) {
    try {
      listener(loaded, total);
    } catch {
      // A broken listener must never break the download.
    }
  }
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * May we download in the background without an explicit user intent for 3D?
 * Conservative: refuse on Data Saver and on 2G/3G-class connections (many
 * pilgrims are on expensive roaming data). Defaults to true when the
 * Network Information API is unavailable (desktop browsers).
 */
export function shouldBackgroundLoad(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as { connection?: NetworkInformationLike }).connection;
  if (!conn) return true;
  if (conn.saveData) return false;
  const type = conn.effectiveType;
  if (type === "slow-2g" || type === "2g" || type === "3g") return false;
  return true;
}

/** Run a low-priority task once the browser is idle (fallback: timeout). */
export function whenIdle(task: () => void, timeoutMs = 4000): void {
  if (typeof window === "undefined") return;
  const scheduler = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof scheduler.requestIdleCallback === "function") {
    scheduler.requestIdleCallback(task, { timeout: timeoutMs });
    return;
  }
  window.setTimeout(task, 1500);
}

async function readCachedBytes(url: string): Promise<ArrayBuffer | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cached = await caches.match(url, { cacheName: CACHE_NAME });
    if (!cached) return null;
    return await cached.arrayBuffer();
  } catch {
    // Cache Storage unavailable (insecure context / private mode) — network only.
    return null;
  }
}

function writeCachedBytes(url: string, bytes: ArrayBuffer): void {
  if (typeof caches === "undefined") return;
  try {
    void caches
      .open(CACHE_NAME)
      .then((cache) => cache.put(url, new Response(bytes)))
      .catch(() => {
        // Quota exceeded / private mode — memory instance cache still works.
      });
  } catch {
    // Synchronous failure opening caches — ignore.
  }
}

/**
 * Fetch a model's bytes, streaming progress. Resolves from Cache Storage when
 * possible; otherwise downloads and populates the cache for next time.
 */
export function fetchModelBytes(
  url: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  // Subscribe FIRST (and get the current snapshot immediately) so progress
  // works whichever promise this call ends up awaiting — its own new download
  // or one already in flight that was started without a callback.
  if (onProgress) {
    let listeners = progressListeners.get(url);
    if (!listeners) {
      listeners = new Set();
      progressListeners.set(url, listeners);
    }
    listeners.add(onProgress);
    const snapshot = latestProgress.get(url);
    if (snapshot) {
      try {
        onProgress(snapshot.loaded, snapshot.total);
      } catch {
        // Listener error — ignore.
      }
    }
  }

  const existing = inflight.get(url);
  if (existing) return existing;

  const promise = (async () => {
    const cached = await readCachedBytes(url);
    if (cached) {
      emitProgress(url, cached.byteLength, cached.byteLength);
      return cached;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Model fetch failed: ${url} (HTTP ${response.status})`);
    }

    const total = Number(response.headers.get("Content-Length")) || 0;
    if (!response.body || total <= 0) {
      // No streamable body or unknown size — fall back to a plain read.
      const bytes = await response.arrayBuffer();
      writeCachedBytes(url, bytes);
      emitProgress(url, bytes.byteLength, bytes.byteLength);
      return bytes;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      emitProgress(url, received, total);
    }
    const bytes = new ArrayBuffer(received);
    const view = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      view.set(chunk, offset);
      offset += chunk.byteLength;
    }
    writeCachedBytes(url, bytes);
    return bytes;
  })().finally(() => {
    inflight.delete(url);
    progressListeners.delete(url);
    latestProgress.delete(url);
  });

  inflight.set(url, promise);
  return promise;
}

/**
 * Background prefetch for after the map settles. Silently skips when the
 * connection policy says no or the download fails — prefetch must never
 * surface an error or cost a constrained user their data.
 */
export function prefetchModel(url: string): Promise<void> {
  if (!shouldBackgroundLoad()) return Promise.resolve();
  return fetchModelBytes(url).then(
    () => undefined,
    () => undefined
  );
}
