/**
 * Shared geolocation request with a coarse-provider fallback.
 *
 * Android Chrome frequently cannot lock GPS within the classic 10s
 * high-accuracy window: location services off, "Google Location Accuracy"
 * off (no network provider), or simply no satellite line of sight indoors.
 * Requesting once with `enableHighAccuracy: true` and then, only on
 * TIMEOUT/POSITION_UNAVAILABLE, retrying once with `enableHighAccuracy:
 * false` gets a network/Wi-Fi fix within seconds in exactly those cases.
 * Permission denials are never retried: the browser will not re-prompt.
 */

/** High-accuracy (GPS) attempt budget. */
export const GPS_TIMEOUT_MS = 15000;
/** Coarse (network/Wi-Fi) fallback attempt budget. */
const FALLBACK_TIMEOUT_MS = 10000;
/** Fixes up to 30s old are accepted; demanding fresher ones only adds waits. */
export const MAXIMUM_AGE_MS = 30000;

const ERR_PERMISSION_DENIED = 1;
const ERR_POSITION_UNAVAILABLE = 2;
const ERR_TIMEOUT = 3;

/** Failure thrown by `getCurrentPositionWithFallback`. */
export interface LocateFailure {
  /** `GeolocationPositionError` code, or null when the API is missing/unknown. */
  code: number | null;
  /** User-facing Bangla message, including a recovery hint for GPS errors. */
  message: string;
  /** Permission state this failure implies for the location store. */
  permission: "denied" | "prompt" | "unknown";
}

const DENIED_MESSAGE = "লোকেশনের অনুমতি দেওয়া হয়নি";
const UNAVAILABLE_MESSAGE = "লোকেশন পাওয়া যাচ্ছে না - ডিভাইসের লোকেশন চালু আছে কি না দেখুন";
const TIMEOUT_MESSAGE = "জিপিএস সিগন্যাল পাওয়া যায়নি - ডিভাইসের লোকেশন চালু আছে কি না দেখুন";
export const UNSUPPORTED_MESSAGE = "এই ব্রাউজারে লোকেশন সুবিধা নেই";
const UNKNOWN_MESSAGE = "অজানা সমস্যায় লোকেশন নেওয়া যায়নি";

function isPositionError(error: unknown): error is GeolocationPositionError {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as GeolocationPositionError).code === "number"
  );
}

/** Failure for browsers/devices without the Geolocation API. */
export function unsupportedFailure(): LocateFailure {
  return { code: null, message: UNSUPPORTED_MESSAGE, permission: "unknown" };
}

/**
 * Map any geolocation error to a user-facing failure. Duck-types on `code`
 * (the `GeolocationPositionError` global is not guaranteed in test envs).
 */
export function describeGeolocationError(error: unknown): LocateFailure {
  if (!isPositionError(error)) {
    return { code: null, message: UNKNOWN_MESSAGE, permission: "unknown" };
  }
  if (error.code === ERR_PERMISSION_DENIED) {
    return { code: error.code, message: DENIED_MESSAGE, permission: "denied" };
  }
  const message = error.code === ERR_TIMEOUT ? TIMEOUT_MESSAGE : UNAVAILABLE_MESSAGE;
  return { code: error.code, message, permission: "prompt" };
}

function requestOnce(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    // Read `navigator.geolocation` at call time so the dev gps-sim wrapper
    // (which replaces it globally) keeps working through this helper.
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Get a position: GPS first, coarse network fallback once on timeout or
 * unavailability. Always rejects with a `LocateFailure`.
 */
export async function getCurrentPositionWithFallback(
  options: { timeout?: number; maximumAge?: number } = {}
): Promise<GeolocationPosition> {
  const timeout = options.timeout ?? GPS_TIMEOUT_MS;
  const maximumAge = options.maximumAge ?? MAXIMUM_AGE_MS;

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw unsupportedFailure();
  }

  try {
    return await requestOnce({ enableHighAccuracy: true, timeout, maximumAge });
  } catch (error) {
    const failure = describeGeolocationError(error);
    const retryable = failure.code === ERR_POSITION_UNAVAILABLE || failure.code === ERR_TIMEOUT;
    if (!retryable) {
      throw failure;
    }

    try {
      return await requestOnce({
        enableHighAccuracy: false,
        timeout: FALLBACK_TIMEOUT_MS,
        maximumAge,
      });
    } catch (fallbackError) {
      throw describeGeolocationError(fallbackError);
    }
  }
}
