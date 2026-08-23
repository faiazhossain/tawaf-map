import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { useLocationStore, useRouteStore, useNavigationStore } from "@/lib/store";
import { useNavigation } from "@/lib/hooks/useNavigation";
import type { Route } from "@/types/navigation";

// ---------------------------------------------------------------------------
// টেস্ট ভূগোল: মক্কার কাছে একটি রেফারেন্স বিন্দু থেকে পূর্ব-পশ্চিমে ৪০০ মি
// সোজা রুট, আর তার সাথে `at(পূর্ব, উত্তর)` মিটার-অফসেট বিন্দু-নির্মাতা।
// ---------------------------------------------------------------------------

const ORIGIN: [number, number] = [39.8262, 21.4225];
const LNG_PER_M = 1 / (111320 * Math.cos((ORIGIN[1] * Math.PI) / 180));
const LAT_PER_M = 1 / 110540;

function at(eastM: number, northM: number): [number, number] {
  return [ORIGIN[0] + eastM * LNG_PER_M, ORIGIN[1] + northM * LAT_PER_M];
}

const ROUTE_GEOMETRY: number[][] = [at(0, 0), at(100, 0), at(200, 0), at(300, 0), at(400, 0)];
const DESTINATION: [number, number] = at(400, 0);

function makeRoute(id: string, geometry: number[][] = ROUTE_GEOMETRY): Route {
  return {
    id,
    geometry,
    distance: 400,
    duration: 288,
    steps: [
      { instruction: "হাঁটা শুরু করুন", distance: 200, duration: 144, maneuver: "depart" },
      { instruction: "গন্তব্যে পৌঁছেছেন", distance: 200, duration: 144, maneuver: "arrive" },
    ],
  };
}

/** রিয়ারাউট-ফেচের জন্য OSRM-আকৃতির সফল পেলোড। */
function reroutePayload(geometry: number[][]) {
  return {
    route: {
      geometry,
      distance: 300,
      duration: 216,
      steps: [
        { instruction: "নতুন পথে যান", distance: 300, duration: 216, maneuver: "turn right" },
      ],
    },
  };
}

/** হুকটাকে মাউন্ট করা ছোট হার্নেস — ফিক্স act() দিয়ে স্টোরে লেখা হয়। */
function Harness() {
  useNavigation();
  return null;
}

function resetStores() {
  useLocationStore.setState({
    latitude: null,
    longitude: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    loading: false,
    permission: "unknown",
  });
  useRouteStore.setState({ activeRoute: null, isRouting: false, routeError: null });
  useNavigationStore.setState({
    isNavigating: false,
    destination: null,
    currentStepIndex: 0,
    remainingDistance: null,
    remainingDuration: null,
    distanceToStepEnd: null,
    snappedPosition: null,
    remainingGeometry: null,
    offRoute: false,
    offRouteFixCount: 0,
    isRerouting: false,
    rerouteError: null,
    hasArrived: false,
    followEnabled: true,
  });
}

/** একটি GPS ফিক্স স্টোরে লেখে (accuracy ডিফল্ট ৮ মি — সিমুলেটরের মতো)। */
async function reportFix(point: [number, number], fixAccuracy = 8) {
  await act(async () => {
    useLocationStore.getState().setLocation(point[1], point[0], fixAccuracy);
  });
}

async function startNav() {
  await act(async () => {
    useNavigationStore.getState().startNavigation({ coordinates: DESTINATION, name: "টেস্ট গেট" });
  });
}

/** নেভিগেশন চলাকালীন রুট বদলালে রুট-id ওয়াচার-ইফেক্টও act-এর ভেতরে চলে। */
async function setRouteAct(route: Route) {
  await act(async () => {
    useRouteStore.getState().setRoute(route);
  });
}

function installFetch() {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/**
 * অ্যাসিনক্রোনাস চেইন (fetch -> json -> setRoute -> effect) পুরোপুরি
 * নিষ্পন্ন করে — এক ম্যাক্রোটাস্ক সব পেন্ডিং মাইক্রোটাস্ক নিষ্কাশন করে,
 * এবং act() মোড়া থাকায় স্টোর-আপডেট সতর্কতা আসে না।
 */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function okResponse(payload: unknown) {
  return { ok: true, status: 200, json: async () => payload } as Response;
}

describe("useNavigation", () => {
  beforeEach(() => {
    resetStores();
  });

  afterEach(async () => {
    // RTL-এর auto-cleanup এর আগেই চলে, তাই Harness এখনো মাউন্টেড — স্টোর
    // রিসেট act() দিয়ে মোড়া না হলে act-বাইরে রি-রেন্ডার সতর্কতা আসে।
    await act(async () => {
      resetStores();
    });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("নেভিগেশন চলাকালীন অবশিষ্ট দূরত্ব আপডেট হয়", async () => {
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();

    await reportFix(at(50, 0));
    const early = useNavigationStore.getState().remainingDistance;
    expect(early).not.toBeNull();
    expect(early).toBeGreaterThan(340);

    await reportFix(at(250, 0));
    const late = useNavigationStore.getState().remainingDistance;
    expect(late).not.toBeNull();
    expect(late).toBeLessThan(early!);
  });

  it("২ মি-র কম নড়াচড়ায় প্রগ্রেস বদলায় না (জিটার)", async () => {
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();

    await reportFix(at(100, 0));
    const before = useNavigationStore.getState().remainingDistance;
    await reportFix(at(101, 0)); // ১ মি — হিস্টেরিসিসের নিচে
    expect(useNavigationStore.getState().remainingDistance).toBe(before);
  });

  it("accuracy ৫০ মি-র খারাপ হলে ফিক্স উপেক্ষিত", async () => {
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();

    await reportFix(at(100, 0));
    const before = useNavigationStore.getState().remainingDistance;
    await reportFix(at(200, 0), 60);
    expect(useNavigationStore.getState().remainingDistance).toBe(before);
  });

  it("টানা অফ-রুট ফিক্সে রিয়ারাউট fetch হয় — origin বর্তমান অবস্থান", async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValue(okResponse(reroutePayload([at(150, 35), at(250, 0), at(400, 0)])));
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();

    await reportFix(at(100, 0));
    await reportFix(at(110, 35));
    await reportFix(at(120, 35));
    await reportFix(at(130, 35));

    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.destination).toEqual(DESTINATION);
    const [originLng, originLat] = body.origin as [number, number];
    expect(Math.abs(originLng - at(130, 35)[0])).toBeLessThan(1e-6);
    expect(Math.abs(originLat - at(130, 35)[1])).toBeLessThan(1e-6);
    expect(useRouteStore.getState().activeRoute?.id).not.toBe("route-a");
  });

  it("একক অফ-রুট ফিক্সে fetch হয় না", async () => {
    const fetchMock = installFetch();
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();

    await reportFix(at(100, 0));
    await reportFix(at(110, 35)); // একবারই বিচ্যুত
    await reportFix(at(120, 0)); // ফিরে এলো

    expect(fetchMock).not.toHaveBeenCalled();
    expect(useNavigationStore.getState().offRoute).toBe(false);
  });

  it("ইন-ফ্লাইট থাকলে দ্বিতীয় fetch নয় (dedupe)", async () => {
    const fetchMock = installFetch();
    let resolveFetch: (value: Response) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      })
    );
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();

    await reportFix(at(100, 0));
    await reportFix(at(110, 35));
    await reportFix(at(120, 35));
    await reportFix(at(130, 35)); // প্রথম রিয়ারাউট শুরু
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useNavigationStore.getState().isRerouting).toBe(true);

    await reportFix(at(140, 35));
    await reportFix(at(150, 35));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch(okResponse(reroutePayload([at(150, 35), at(400, 0)])));
      await Promise.resolve();
    });
  });

  it("কুলডাউনের ভিতরে পুনরায় রিয়ারাউট হয় না, পরে হয়", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const fetchMock = installFetch();
      fetchMock.mockRejectedValue(new Error("নেটওয়ার্ক সমস্যা"));
      render(<Harness />);
      act(() => {
        useRouteStore.getState().setRoute(makeRoute("route-a"));
      });
      await startNav();

      await reportFix(at(100, 0));
      await reportFix(at(110, 35));
      await reportFix(at(120, 35));
      await reportFix(at(130, 35)); // ব্যর্থ রিয়ারাউট
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(useNavigationStore.getState().rerouteError).not.toBeNull();

      await reportFix(at(140, 35));
      await reportFix(at(150, 35));
      await reportFix(at(160, 35)); // কুলডাউনে আটকানো উচিত
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(8500);
      });

      await reportFix(at(170, 35));
      await reportFix(at(180, 35));
      await reportFix(at(190, 35)); // কুলডাউন পেরিয়ে আবার চেষ্টা
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("নতুন রুট id-তে প্রগ্রেস রিসেট হয় কিন্তু গন্তব্য থাকে", async () => {
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();

    await reportFix(at(250, 0));
    expect(useNavigationStore.getState().currentStepIndex).toBe(1);

    await setRouteAct(makeRoute("route-b"));
    const nav = useNavigationStore.getState();
    expect(nav.currentStepIndex).toBe(0);
    expect(nav.remainingDistance).toBeNull();
    expect(nav.destination?.coordinates).toEqual(DESTINATION);
    expect(nav.isNavigating).toBe(true);
  });

  it("গন্তব্যে পৌঁছালে hasArrived ও রিয়ারাউট বন্ধ", async () => {
    const fetchMock = installFetch();
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();

    await reportFix(at(390, 8));
    expect(useNavigationStore.getState().hasArrived).toBe(true);

    // আগমনের পরে অফ-রুট-সদৃশ ফিক্স এলেও আর কিছু হবে না।
    await reportFix(at(390, 40));
    await reportFix(at(390, 45));
    await reportFix(at(390, 50));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("রিয়ারাউট ব্যর্থ হলে rerouteError সেট হয়, রুট অপরিবর্তিত থাকে", async () => {
    const fetchMock = installFetch();
    fetchMock.mockRejectedValue(new Error("নেটওয়ার্ক সমস্যা"));
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();

    await reportFix(at(100, 0));
    await reportFix(at(110, 35));
    await reportFix(at(120, 35));
    await reportFix(at(130, 35));

    await settle();

    expect(useNavigationStore.getState().rerouteError).toContain("নতুন রুট পাওয়া যায়নি");
    expect(useRouteStore.getState().activeRoute?.id).toBe("route-a");
    expect(useNavigationStore.getState().isRerouting).toBe(false);
  });

  it("stopNavigation সব পরিষ্কার করে", async () => {
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await startNav();
    await reportFix(at(100, 0));
    expect(useNavigationStore.getState().remainingDistance).not.toBeNull();

    act(() => {
      useNavigationStore.getState().stopNavigation();
    });
    const nav = useNavigationStore.getState();
    expect(nav.isNavigating).toBe(false);
    expect(nav.destination).toBeNull();
    expect(nav.remainingDistance).toBeNull();
    expect(nav.offRoute).toBe(false);
  });

  it("নেভিগেশন চালু না থাকলে ফিক্সে কিছু হিসাব হয় না", async () => {
    render(<Harness />);
    await setRouteAct(makeRoute("route-a"));
    await reportFix(at(100, 0));
    expect(useNavigationStore.getState().remainingDistance).toBeNull();
  });
});
