import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/health/route";

function makeRequest(deep = false): NextRequest {
  const url = deep ? "http://localhost/api/health?deep=1" : "http://localhost/api/health";
  return new NextRequest(url, { method: "GET" });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/health (local mode)", () => {
  it("reports ok with all config present and never calls the network", () => {
    vi.stubEnv("BARIKOI_API_KEY", "test-routing-key");
    vi.stubEnv("NEXT_PUBLIC_BARIKOI_API_KEY", "test-style-key");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    // Promise-wrapping guards against a future accidental await in local mode.
    return GET(makeRequest()).then((res) => {
      expect(res.status).toBe(200);
      expect(fetchSpy).not.toHaveBeenCalled();
      void res.json().then((body) => {
        expect(body.status).toBe("ok");
        expect(typeof body.version).toBe("string");
        expect(body.degraded).toBe(false);
        expect(body.checks.barikoiRoutingKey).toBe(true);
        expect(body.checks.barikoiStyleKey).toBe(true);
        expect(body.deep).toBeUndefined();
      });
    });
  });

  it("flags degraded=true when keys are missing but stays 200", async () => {
    vi.stubEnv("BARIKOI_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_BARIKOI_API_KEY", "");

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.degraded).toBe(true);
    expect(body.checks.barikoiRoutingKey).toBe(false);
    expect(body.checks.barikoiStyleKey).toBe(false);
  });
});

describe("GET /api/health?deep=1", () => {
  it("probes barikoi origin and style endpoint, reporting reachable", async () => {
    vi.stubEnv("BARIKOI_API_KEY", "test-routing-key");
    vi.stubEnv("NEXT_PUBLIC_BARIKOI_API_KEY", "test-style-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200 }))
    );

    const res = await GET(makeRequest(true));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.deep.barikoiOrigin).toBe("reachable");
    expect(body.deep.styleEndpoint).toBe("reachable");
  });

  it("stays HTTP 200 with unreachable verdicts when the network is dead", async () => {
    vi.stubEnv("BARIKOI_API_KEY", "k");
    vi.stubEnv("NEXT_PUBLIC_BARIKOI_API_KEY", "s");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      })
    );

    const res = await GET(makeRequest(true));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.deep.barikoiOrigin).toBe("unreachable");
    expect(body.deep.styleEndpoint).toBe("unreachable");
  });

  it("marks the style probe skipped when no style key exists", async () => {
    vi.stubEnv("BARIKOI_API_KEY", "k");
    vi.stubEnv("NEXT_PUBLIC_BARIKOI_API_KEY", "");
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const body = await (await GET(makeRequest(true))).json();

    expect(body.deep.styleEndpoint).toBe("skipped-no-key");
    // Only the origin probe ran; nothing tried to call map.barikoi.com keyless.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
