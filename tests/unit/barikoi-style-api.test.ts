import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/barikoi-style/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/barikoi-style", () => {
  it("fetches the remote Barikoi style server-side and exposes same-origin JSON", async () => {
    vi.stubEnv("NEXT_PUBLIC_BARIKOI_API_KEY", "test-style-key");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain("https://map.barikoi.com/styles/osm_barikoi_pl/style.json");
      expect(url).toContain("key=test-style-key");

      return new Response(
        JSON.stringify({
          version: 8,
          sources: {
            map: {
              type: "vector",
              tiles: ["https://map.barikoi.com/tiles/{z}/{x}/{y}.pbf?key=test-style-key"],
            },
          },
          layers: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(new NextRequest("http://localhost/api/barikoi-style"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(body.version).toBe(8);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the Barikoi style key is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_BARIKOI_API_KEY", "");

    const res = await GET(new NextRequest("http://localhost/api/barikoi-style"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("NEXT_PUBLIC_BARIKOI_API_KEY");
  });
});
