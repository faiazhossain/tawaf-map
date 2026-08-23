import { describe, it, expect, afterEach, vi } from "vitest";
import { fetchWalkingRoute } from "@/lib/routing/fetchRoute";
import { APPROACH_MIN_GAP_M } from "@/lib/routing/approach";

// মক্কার কাছাকাছি রেফারেন্স বিন্দু।
const ORIGIN: [number, number] = [39.8262, 21.4225];

/** ORIGIN থেকে পূর্বে `eastM` ও উত্তরে `northM` সরে যাওয়া বিন্দু। */
function at(eastM: number, northM: number): [number, number] {
  const lngPerM = 1 / (111320 * Math.cos((ORIGIN[1] * Math.PI) / 180));
  return [ORIGIN[0] + eastM * lngPerM, ORIGIN[1] + northM / 110540];
}

/** জ্যামিতি `endAt`-এ শেষ হওয়া সফল রেসপন্স। */
function okBody(endAt: [number, number]) {
  return {
    route: {
      geometry: [at(0, 0), at(50, 0), endAt],
      distance: 640,
      duration: 470,
      steps: [{ instruction: "এগিয়ে চলুন", distance: 640, duration: 470, maneuver: "continue" }],
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchWalkingRoute", () => {
  it("জ্যামিতি গন্তব্যেই শেষ হলে সংযোগকারী নেই", async () => {
    const destination = at(100, 0);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          Promise.resolve(
            new Response(JSON.stringify(okBody(destination)), { status: 200 })
          ) as never
      )
    );

    const route = await fetchWalkingRoute(at(0, 0), destination);
    expect(route.approach).toBeNull();
    expect(route.id).toMatch(/^route-/);
  });

  it(`শেষ বিন্দু ${APPROACH_MIN_GAP_M} মির বেশি আগে থাকলে সংযোগকারী গন্তব্যে গিয়ে শেষ`, async () => {
    const destination = at(100, 40);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          Promise.resolve(
            new Response(JSON.stringify(okBody(at(100, 0))), { status: 200 })
          ) as never
      )
    );

    const route = await fetchWalkingRoute(at(0, 0), destination);
    expect(route.approach).not.toBeNull();
    expect(route.approach!.geometry[0]).toEqual(at(100, 0));
    expect(route.approach!.geometry[route.approach!.geometry.length - 1]).toEqual(destination);
  });

  it("422 NoRoute-এ Error নয়, আনুমানিক রুট রিজলভ করে", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          Promise.resolve(
            new Response(
              JSON.stringify({
                error: "এই দুই স্থানের মাঝে হাঁটার পথ পাওয়া যায়নি",
                code: "NoRoute",
              }),
              { status: 422 }
            )
          ) as never
      )
    );

    const route = await fetchWalkingRoute(at(0, 0), at(200, 80));
    expect(route.approximate).toBe(true);
    expect(route.geometry[0]).toEqual(at(0, 0));
    expect(route.geometry[route.geometry.length - 1]).toEqual(at(200, 80));
  });

  it("502-তে বাংলা বার্তাসহ throw", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          Promise.resolve(
            new Response(JSON.stringify({ error: "পথ বের করা যায়নি: আপস্ট্রিম 500" }), {
              status: 502,
            })
          ) as never
      )
    );

    await expect(fetchWalkingRoute(at(0, 0), at(100, 0))).rejects.toThrow(
      "পথ বের করা যায়নি: আপস্ট্রিম 500"
    );
  });

  it("নেটওয়ার্ক ব্যর্থতায় আলাদা বাংলা বার্তা", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline")) as never)
    );

    await expect(fetchWalkingRoute(at(0, 0), at(100, 0))).rejects.toThrow("নেটওয়ার্ক সমস্যা");
  });
});
