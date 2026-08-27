import { afterEach, describe, expect, it, vi } from "vitest";
import { reportError } from "@/lib/telemetry";

const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => {
  errorSpy.mockClear();
});

function lastLogged(): Record<string, unknown> {
  const raw = errorSpy.mock.calls.at(-1)?.[0];
  expect(typeof raw).toBe("string");
  return JSON.parse(raw as string) as Record<string, unknown>;
}

describe("reportError", () => {
  it("emits one parseable JSON line with message, digest and context merged", () => {
    const boom = Object.assign(new Error("route exploded"), { digest: "dg9" });
    reportError(boom, { scope: "route-boundary" });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = lastLogged();
    expect(logged.severity).toBe("error");
    expect(logged.message).toBe("route exploded");
    expect(logged.digest).toBe("dg9");
    expect(logged.scope).toBe("route-boundary");
    expect(typeof logged.time).toBe("string");
    expect(typeof logged.stack).toBe("string");
  });

  it("stringifies non-Error throws without crashing", () => {
    reportError("just a string rejection");

    const logged = lastLogged();
    expect(logged.message).toBe("just a string rejection");
    expect(logged.stack).toBeUndefined();
    expect(logged.digest).toBeUndefined();
  });
});
