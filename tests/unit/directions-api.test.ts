import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/directions/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/directions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

/** Barikoi/OSRM-ধাঁচের সফল রেসপন্স বানায়। */
function okPayload() {
  return {
    code: "Ok",
    routes: [
      {
        distance: 640,
        duration: 470,
        geometry: {
          coordinates: [
            [39.8263, 21.4189],
            [39.8268, 21.4199],
            [39.8241, 21.4212],
          ],
        },
        legs: [
          {
            steps: [
              {
                name: "Bab Al Malik Street",
                distance: 600,
                duration: 440,
                maneuver: { type: "depart", modifier: "" },
              },
              { distance: 40, duration: 30, maneuver: { type: "arrive" } },
            ],
          },
        ],
      },
    ],
  };
}

beforeEach(() => {
  vi.stubEnv("BARIKOI_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/directions", () => {
  it("অবৈধ স্থানাঙ্কে 400", async () => {
    const res = await POST(makeRequest({ origin: [400, 21], destination: [39.8, 21.4] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("অবৈধ");
  });

  it("কী না থাকলে 500 ও স্পষ্ট বার্তা", async () => {
    vi.stubEnv("BARIKOI_API_KEY", "");
    vi.stubEnv("MAP_API_ACCESS_TOKEN", "");
    const res = await POST(makeRequest({ origin: [39.8, 21.4], destination: [39.83, 21.43] }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain("BARIKOI_API_KEY");
  });

  it("আপস্ট্রিম না পেলে 502 ও বাংলা বার্তা", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down")))
    );
    const res = await POST(
      makeRequest({ origin: [39.8263, 21.4189], destination: [39.8241, 21.4212] })
    );
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("রাউটিং সার্ভারে পৌঁছানো যাচ্ছে না");
  });

  it("আপস্ট্রিম NoRoute দিলে code-সহ 422 (আনুমানিক রুটের ট্রিগার)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          Promise.resolve(
            new Response(JSON.stringify({ code: "NoRoute", message: "no path" }), {
              status: 200,
            })
          ) as never
      )
    );
    const res = await POST(
      makeRequest({ origin: [39.8263, 21.4189], destination: [39.8241, 21.4212] })
    );
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.code).toBe("NoRoute");
    expect(data.error).toContain("হাঁটার পথ পাওয়া যায়নি");
  });

  it("Ok হয়েও ফাঁকা routes দিলে একই 422 NoRoute", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          Promise.resolve(
            new Response(JSON.stringify({ code: "Ok", routes: [] }), {
              status: 200,
            })
          ) as never
      )
    );
    const res = await POST(
      makeRequest({ origin: [39.8263, 21.4189], destination: [39.8241, 21.4212] })
    );
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("NoRoute");
  });

  it("NoRoute ছাড়া অন্য আপস্ট্রিম কোডে 502, code ফিল্ড নেই", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          Promise.resolve(
            new Response(JSON.stringify({ code: "InvalidUrl", message: "bad" }), {
              status: 200,
            })
          ) as never
      )
    );
    const res = await POST(
      makeRequest({ origin: [39.8263, 21.4189], destination: [39.8241, 21.4212] })
    );
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.code).toBeUndefined();
    expect(data.error).toContain("পথ বের করা যায়নি");
  });

  it("সফল রুটে geometry/duration/বাংলা ধাপ ও সঠিক আপস্ট্রিম অনুরোধ", async () => {
    const fetchMock = vi.fn(
      () => Promise.resolve(new Response(JSON.stringify(okPayload()), { status: 200 })) as never
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest({ origin: [39.8263, 21.4189], destination: [39.8241, 21.4212] })
    );
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.route.geometry).toEqual([
      [39.8263, 21.4189],
      [39.8268, 21.4199],
      [39.8241, 21.4212],
    ]);
    expect(data.route.distance).toBe(640);
    expect(data.route.duration).toBe(470);
    expect(data.route.steps[0].instruction).toBe("Bab Al Malik Street ধরে হাঁটা শুরু করুন");
    expect(data.route.steps[1].instruction).toBe("গন্তব্যে পৌঁছেছেন");

    // lng,lat ক্রম + ';' জোড়া + foot প্রোফাইল + Origin হেডার
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("39.8263,21.4189;39.8241,21.4212");
    expect(url).toContain("profile=foot");
    expect(url).toContain("api_key=test-key");
    expect((init.headers as Record<string, string>).Origin).toBe("maps.barikoi.com");
  });

  it("অবক্ষয়িত জ্যামিতিতে (এক কোঅর্ডিনেট) 422 NoRoute", async () => {
    const payload = okPayload();
    payload.routes[0].geometry.coordinates = [[39.8263, 21.4189]];
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(payload), { status: 200 })) as never)
    );
    const res = await POST(
      makeRequest({ origin: [39.8263, 21.4189], destination: [39.8241, 21.4212] })
    );
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("NoRoute");
  });

  it("profile car চাইলে আপস্ট্রিমে যায়, অবৈধ profile-এ foot-এ পড়ে", async () => {
    const fetchMock = vi.fn(
      () => Promise.resolve(new Response(JSON.stringify(okPayload()), { status: 200 })) as never
    );
    vi.stubGlobal("fetch", fetchMock);

    await POST(makeRequest({ origin: [39.8, 21.4], destination: [39.83, 21.43], profile: "car" }));
    expect((fetchMock.mock.calls[0] as unknown as string[])[0]).toContain("profile=car");

    await POST(
      makeRequest({ origin: [39.8, 21.4], destination: [39.83, 21.43], profile: "jetpack" })
    );
    expect((fetchMock.mock.calls[1] as unknown as string[])[0]).toContain("profile=foot");
  });
});
