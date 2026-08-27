import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserLocation } from "@/components/map/UserLocation";
import type { UserLocationProps } from "@/components/map/UserLocation";

function baseProps(overrides: Partial<UserLocationProps> = {}): UserLocationProps {
  return {
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    permission: "unknown",
    onRequestLocation: () => {},
    ...overrides,
  };
}

describe("UserLocation", () => {
  it("ফিক্স না থাকলে 'লোকেশন চালু করুন' বোতাম দেখায় ও ক্লিকে রিকোয়েস্ট পাঠায়", async () => {
    const onRequestLocation = vi.fn();
    const user = userEvent.setup();
    render(<UserLocation {...baseProps({ onRequestLocation })} />);

    await user.click(screen.getByRole("button", { name: "লোকেশন চালু করুন" }));
    expect(onRequestLocation).toHaveBeenCalledTimes(1);
  });

  it("লোডিংয়ের সময় স্পিনার দেখায়, বোতাম নয়", () => {
    render(<UserLocation {...baseProps({ loading: true })} />);

    expect(screen.getByText("লোকেশন নেওয়া হচ্ছে...")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("অনুমতি না দিলে 'লোকেশন বন্ধ' দেখায়", () => {
    render(<UserLocation {...baseProps({ permission: "denied" })} />);

    expect(screen.getByText("লোকেশন বন্ধ")).toBeTruthy();
  });

  it("GPS ব্যর্থ হলে ত্রুটির বার্তা দেখায়", () => {
    render(
      <UserLocation
        {...baseProps({ error: "জিপিএস সিগন্যাল পাওয়া যায়নি", permission: "prompt" })}
      />
    );

    expect(screen.getByText("জিপিএস সিগন্যাল পাওয়া যায়নি")).toBeTruthy();
  });

  it("ফিক্স পেলে অ্যাকুরেসিসহ 'আপনার লোকেশন' দেখায়", () => {
    render(
      <UserLocation
        {...baseProps({
          latitude: 23.8236,
          longitude: 90.3639,
          accuracy: 12.4,
          permission: "granted",
        })}
      />
    );

    expect(screen.getByText("আপনার লোকেশন")).toBeTruthy();
    expect(screen.getByText("±12m")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "লোকেশন চালু করুন" })).toBeNull();
  });

  it("denied অবস্থা এখন ট্যাপযোগ্য — onExplainDenied ডাকে, নীরব পিল নয় (UX-001)", async () => {
    const onExplainDenied = vi.fn();
    const user = userEvent.setup();
    render(<UserLocation {...baseProps({ permission: "denied", onExplainDenied })} />);

    await user.click(screen.getByTestId("user-location-denied"));
    expect(onExplainDenied).toHaveBeenCalledTimes(1);
    // Screen-reader users hear an action, not a status-less icon.
    expect(screen.getByRole("button", { name: "লোকেশন বন্ধ — সমাধান দেখুন" })).toBeTruthy();
  });

  it("onExplainDenied না দিলে denied ট্যাপ legacy onRequestLocation-এ পড়ে", async () => {
    const onRequestLocation = vi.fn();
    const user = userEvent.setup();
    render(<UserLocation {...baseProps({ permission: "denied", onRequestLocation })} />);

    await user.click(screen.getByTestId("user-location-denied"));
    expect(onRequestLocation).toHaveBeenCalledTimes(1);
  });
});
