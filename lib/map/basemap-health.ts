/**
 * Basemap health classification (REL-001).
 *
 * MapLibre raises "error" events for many benign situations once the map is up
 * — single tile 404s, aborted requests during fast pans, per-source hiccups.
 * Those must never alarm the user. But before the style JSON resolves there
 * are no tile requests in flight at all, so an error arriving that early is
 * effectively fatal (offline, rejected key, unreachable CDN): without surfacing
 * it the page stays a permanent blank canvas while looking like a hang.
 */

export interface BasemapErrorSignal {
  status?: number;
  message?: string;
}

/** In-flight fetch aborts are navigation churn, not outages. */
const TRANSIENT_PATTERNS = ["aborted", "aborterror"];

export const BASEMAP_LOAD_WATCHDOG_MS = 20_000;

/** Decides whether one map "error" event should mark the basemap as failed. */
export function isFatalBasemapError(
  error: BasemapErrorSignal | null | undefined,
  styleLoaded: boolean
): boolean {
  if (!error) return false;
  // Post-load failures are transient by definition: tiles retry themselves,
  // and zoom/pan re-requests healthy ones.
  if (styleLoaded) return false;
  const message = (error.message ?? "").toLowerCase();
  return !TRANSIENT_PATTERNS.some((pattern) => message.includes(pattern));
}
