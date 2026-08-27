/**
 * Single choke point for error reporting (OBS-001).
 *
 * Today every report lands in structured console output — docker logs pick it
 * up verbatim (JSON per line), and future sinks (Sentry/GlitchTip/etc.) only
 * require changing THIS file, not every call site. Call it from error
 * boundaries, map-level fatal paths, and unhandled-rejection hooks.
 */

export type ErrorContext = Record<string, unknown>;

export function reportError(error: unknown, context?: ErrorContext): void {
  const payload = {
    severity: "error" as const,
    time: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    digest:
      typeof error === "object" && error !== null && "digest" in error
        ? String((error as { digest?: unknown }).digest)
        : undefined,
    ...context,
  };
  // A boundary's user-facing UX is separate; this is the ops signal.
  console.error(JSON.stringify(payload));
}
