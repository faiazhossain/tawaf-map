import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GateSelector } from "@/components/map/GateSelector";
import { useGateStore } from "@/lib/store/gateStore";

/**
 * GateSelector-এর ড্রপডাউন document.body-তে portal করা হয় — ডেস্কটপ
 * টুলবারের overflow-x-auto ও মোবাইল হ্যামবার্গার মেনুর overflow-y-auto
 * কন্টেইনার absolute ড্রপডাউনকে ক্লিপ করে ফেলত, ফলে সার্চ ফলাফল
 * ঝাপসা ব্যাকড্রপের নিচে অদৃশ্য থাকত। এই টেস্টগুলো সেই রিগ্রেশন আটকায়।
 */

function resetState() {
  // রিয়েল মোড পিন করা (jsdom-এ URL/localStorage ফ্ল্যাগ নেই, তবু স্পষ্ট করা)
  window.__TAWAF_DEMO_WORLD__ = false;
  useGateStore.setState({
    selectedGate: { gate: null, distance: null, walkingTime: null },
    nearbyGates: [],
  });
}

async function openDropdown() {
  fireEvent.click(screen.getByRole("button", { name: "গেট খুঁজুন" }));
  await waitFor(() =>
    expect(screen.getByRole("dialog", { name: "গেট তালিকা" })).toBeInTheDocument()
  );
}

describe("GateSelector", () => {
  beforeEach(resetState);
  afterEach(resetState);

  it("ড্রপডাউন document.body-র সরাসরি সন্তান (overflow-clip থেকে মুক্ত)", async () => {
    render(<GateSelector />);
    await openDropdown();
    const dialog = screen.getByRole("dialog", { name: "গেট তালিকা" });
    expect(dialog.parentElement).toBe(document.body);
  });

  it("'king' লিখলে তিনটি কিং-গেট দেখায়", async () => {
    render(<GateSelector />);
    await openDropdown();
    fireEvent.change(screen.getByPlaceholderText("গেট খুঁজুন..."), {
      target: { value: "king" },
    });

    const dialog = screen.getByRole("dialog", { name: "গেট তালিকা" });
    const items = dialog.querySelectorAll(".max-h-72 button");
    expect(items).toHaveLength(3);
    expect(screen.getByText("কিং ফাহদ গেট")).toBeInTheDocument();
    expect(screen.getByText("কিং আব্দুল আজিজ গেট")).toBeInTheDocument();
    expect(screen.getByText("কিং আব্দুল্লাহ গেট")).toBeInTheDocument();
  });

  it("মিল না পেলে খালি-অবস্থা দেখায়, Escape বন্ধ করে", async () => {
    render(<GateSelector />);
    await openDropdown();
    fireEvent.change(screen.getByPlaceholderText("গেট খুঁজুন..."), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("কোনো গেট পাওয়া যায়নি")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "গেট তালিকা" })).not.toBeInTheDocument();
  });

  it("গেট বাছলে স্টোরে সেট হয় ও ড্রপডাউন বন্ধ হয়", async () => {
    render(<GateSelector />);
    await openDropdown();
    fireEvent.change(screen.getByPlaceholderText("গেট খুঁজুন..."), {
      target: { value: "king" },
    });
    fireEvent.click(screen.getByText("কিং ফাহদ গেট"));

    expect(useGateStore.getState().selectedGate.gate?.name).toBe("কিং ফাহদ গেট");
    expect(screen.queryByRole("dialog", { name: "গেট তালিকা" })).not.toBeInTheDocument();
  });

  it("onSelectGate দেওয়া থাকলে নির্বাচন হ্যান্ডলারের মাধ্যমে যায় (প্যানেল পথ)", async () => {
    const onSelectGate = vi.fn();
    render(<GateSelector onSelectGate={onSelectGate} />);
    await openDropdown();
    fireEvent.change(screen.getByPlaceholderText("গেট খুঁজুন..."), {
      target: { value: "king" },
    });
    fireEvent.click(screen.getByText("কিং ফাহদ গেট"));

    expect(onSelectGate).toHaveBeenCalledTimes(1);
    expect(onSelectGate).toHaveBeenCalledWith(expect.stringMatching(/^\+osm-\d+$/));
    // হ্যান্ডলার-পথে সিলেক্টর নিজে স্টোর লেখে না — পৃষ্ঠার হ্যান্ডলারের দায়
    expect(useGateStore.getState().selectedGate.gate).toBeNull();
  });
});
