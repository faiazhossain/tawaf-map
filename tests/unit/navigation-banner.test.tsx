import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  NavigationBanner,
  NavigationBannerContent,
} from "@/components/navigation/NavigationBanner";
import { useRouteStore, useNavigationStore, usePanelStore } from "@/lib/store";

function resetStores() {
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
    inApproach: false,
    approachRemainingM: null,
    offRoute: false,
    offRouteFixCount: 0,
    isRerouting: false,
    rerouteError: null,
    hasArrived: false,
    followEnabled: true,
  });
  usePanelStore.setState({ activePanel: null });
}

describe("NavigationBannerContent", () => {
  it("স্বাভাবিক অবস্থায় বর্তমান ধাপের নির্দেশনা ও অবশিষ্ট দূরত্ব দেখায়", () => {
    render(
      <NavigationBannerContent
        instruction="বাঁয়ে মোড় নিন"
        maneuver="turn left"
        remainingDistanceM={350}
        remainingDurationS={252}
        distanceToStepEndM={40}
        destinationName="কিং ফাহ্দ গেট"
        isRerouting={false}
        offRoute={false}
        rerouteError={null}
        hasArrived={false}
        onExit={() => {}}
      />
    );
    expect(screen.getByText("বাঁয়ে মোড় নিন")).toBeTruthy();
    expect(screen.getByText(/মোট/)).toBeTruthy();
  });

  it("রিয়ারাউটিং অবস্থায় 'রুট পুনর্গণনা হচ্ছে...'", () => {
    render(
      <NavigationBannerContent
        instruction="এগিয়ে চলুন"
        maneuver={undefined}
        remainingDistanceM={null}
        remainingDurationS={null}
        distanceToStepEndM={null}
        destinationName={null}
        isRerouting
        offRoute={false}
        rerouteError={null}
        hasArrived={false}
        onExit={() => {}}
      />
    );
    expect(screen.getByText("রুট পুনর্গণনা হচ্ছে...")).toBeTruthy();
  });

  it("অফ-রুট নোটিশ দেখায়", () => {
    render(
      <NavigationBannerContent
        instruction="এগিয়ে চলুন"
        maneuver="continue"
        remainingDistanceM={100}
        remainingDurationS={72}
        distanceToStepEndM={20}
        destinationName={null}
        isRerouting={false}
        offRoute
        rerouteError={null}
        hasArrived={false}
        onExit={() => {}}
      />
    );
    expect(screen.getByText(/রুট থেকে সরে গেছেন/)).toBeTruthy();
  });

  it("ব্যর্থ রিয়ারাউটের বার্তা দেখায়", () => {
    render(
      <NavigationBannerContent
        instruction="এগিয়ে চলুন"
        maneuver="continue"
        remainingDistanceM={100}
        remainingDurationS={72}
        distanceToStepEndM={20}
        destinationName={null}
        isRerouting={false}
        offRoute={false}
        rerouteError="নতুন রুট পাওয়া যায়নি — আবার চেষ্টা হচ্ছে..."
        hasArrived={false}
        onExit={() => {}}
      />
    );
    expect(screen.getByText(/নতুন রুট পাওয়া যায়নি/)).toBeTruthy();
  });

  it("আগমনে 'আপনি গন্তব্যে পৌঁছেছেন' ও গন্তব্যের নাম", () => {
    render(
      <NavigationBannerContent
        instruction="এগিয়ে চলুন"
        maneuver="arrive"
        remainingDistanceM={0}
        remainingDurationS={0}
        distanceToStepEndM={0}
        destinationName="মাসজিদুল হারাম"
        isRerouting={false}
        offRoute={false}
        rerouteError={null}
        hasArrived
        onExit={() => {}}
      />
    );
    expect(screen.getByText("আপনি গন্তব্যে পৌঁছেছেন")).toBeTruthy();
    expect(screen.getByText("মাসজিদুল হারাম")).toBeTruthy();
  });

  it("চূড়ান্ত পর্যায়ে 'গন্তব্যের দিকে হেঁটে যান' ও সংযোগকারীর দূরত্ব, ধাপের নির্দেশনা নয়", () => {
    render(
      <NavigationBannerContent
        instruction="বাঁয়ে মোড় নিন"
        maneuver="turn left"
        remainingDistanceM={45}
        remainingDurationS={33}
        distanceToStepEndM={0}
        destinationName="কিং ফাহ্দ গেট"
        isRerouting={false}
        offRoute={false}
        rerouteError={null}
        hasArrived={false}
        inApproach
        approachRemainingM={35}
        onExit={() => {}}
      />
    );
    expect(screen.getByText("গন্তব্যের দিকে হেঁটে যান")).toBeTruthy();
    expect(screen.getByText("৩৫ মি")).toBeTruthy();
    expect(screen.queryByText("বাঁয়ে মোড় নিন")).toBeNull();
  });

  it("চূড়ান্ত পর্যায় আগমনের কাছে হার যায়", () => {
    render(
      <NavigationBannerContent
        instruction="এগিয়ে চলুন"
        maneuver="arrive"
        remainingDistanceM={0}
        remainingDurationS={0}
        distanceToStepEndM={0}
        destinationName={null}
        isRerouting={false}
        offRoute={false}
        rerouteError={null}
        hasArrived
        inApproach
        approachRemainingM={5}
        onExit={() => {}}
      />
    );
    expect(screen.getByText("আপনি গন্তব্যে পৌঁছেছেন")).toBeTruthy();
    expect(screen.queryByText("গন্তব্যের দিকে হেঁটে যান")).toBeNull();
  });

  it("আনুমানিক রুটে নির্দেশনার পাশে 'আনুমানিক পথ' ট্যাগ", () => {
    render(
      <NavigationBannerContent
        instruction="গন্তব্যের দিকে সোজা হেঁটে যান"
        maneuver="arrive"
        remainingDistanceM={300}
        remainingDurationS={216}
        distanceToStepEndM={300}
        destinationName={null}
        isRerouting={false}
        offRoute={false}
        rerouteError={null}
        hasArrived={false}
        approximate
        onExit={() => {}}
      />
    );
    expect(screen.getByText("(আনুমানিক পথ)")).toBeTruthy();
  });

  it("বাহির বোতামে onExit কল হয়", () => {
    const onExit = vi.fn();
    render(
      <NavigationBannerContent
        instruction="এগিয়ে চলুন"
        maneuver="continue"
        remainingDistanceM={100}
        remainingDurationS={72}
        distanceToStepEndM={20}
        destinationName={null}
        isRerouting={false}
        offRoute={false}
        rerouteError={null}
        hasArrived={false}
        onExit={onExit}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "নেভিগেশন বন্ধ করুন" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe("NavigationBanner (container)", () => {
  beforeEach(() => {
    resetStores();
  });

  afterEach(async () => {
    await act(async () => {
      resetStores();
    });
  });

  it("নেভিগেট না হলে কিছু রেন্ডার হয় না", () => {
    const { container } = render(<NavigationBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("নেভিগেট করলে বর্তমান ধাপ ব্যানারে ওঠে", () => {
    act(() => {
      useRouteStore.getState().setRoute({
        id: "route-x",
        geometry: [
          [39.8262, 21.4225],
          [39.83, 21.423],
        ],
        distance: 400,
        duration: 288,
        steps: [
          { instruction: "হাঁটা শুরু করুন", distance: 400, duration: 288, maneuver: "depart" },
        ],
      });
      useNavigationStore.getState().startNavigation({
        coordinates: [39.83, 21.423],
        name: "টেস্ট গেট",
      });
    });
    render(<NavigationBanner />);
    expect(screen.getByText("হাঁটা শুরু করুন")).toBeTruthy();

    // বাহির বোতাম নেভিগেশন/রুট/প্যানেল সব বন্ধ করে।
    fireEvent.click(screen.getByRole("button", { name: "নেভিগেশন বন্ধ করুন" }));
    expect(useNavigationStore.getState().isNavigating).toBe(false);
    expect(useRouteStore.getState().activeRoute).toBeNull();
    expect(usePanelStore.getState().activePanel).toBeNull();
  });

  it("চূড়ান্ত পর্যায়ের অবস্থা স্টোর থেকে ব্যানারে ওঠে", () => {
    act(() => {
      useRouteStore.getState().setRoute({
        id: "route-y",
        geometry: [
          [39.8262, 21.4225],
          [39.83, 21.423],
        ],
        distance: 400,
        duration: 288,
        steps: [
          { instruction: "হাঁটা শুরু করুন", distance: 400, duration: 288, maneuver: "depart" },
        ],
        approach: {
          geometry: [
            [39.83, 21.423],
            [39.8301, 21.4233],
          ],
          distance: 42,
        },
      });
      useNavigationStore.getState().startNavigation({
        coordinates: [39.8301, 21.4233],
        name: "উঠানের গন্তব্য",
      });
      useNavigationStore.setState({ inApproach: true, approachRemainingM: 42 });
    });
    render(<NavigationBanner />);
    expect(screen.getByText("গন্তব্যের দিকে হেঁটে যান")).toBeTruthy();
    expect(screen.getByText("৪২ মি")).toBeTruthy();
  });
});
