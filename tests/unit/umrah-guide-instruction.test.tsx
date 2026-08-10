import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { InstructionCard } from "@/components/umrah/guide/InstructionCard";
import { RoundDots } from "@/components/umrah/guide/RoundDots";
import type { UmrahStep } from "@/types/umrah";

const perRoundTips = [
  { bn: "প্রথম চক্করের নির্দেশনা" },
  { bn: "দ্বিতীয় চক্করের নির্দেশনা" },
  { bn: "তৃতীয় চক্করের নির্দেশনা" },
  { bn: "চতুর্থ" },
  { bn: "পঞ্চম" },
  { bn: "ষষ্ঠ" },
  { bn: "সপ্তম" },
];

// InstructionCard শুধু এই ক্ষেত্রগুলো পড়ে; তাই ন্যূনতম অবজেক্ট কাস্ট করা নিরাপদ।
const tawafStep = {
  id: "tawaf",
  stage: "tawaf",
  title: { bn: "তওয়াফ" },
  summary: { bn: "তওয়াফের সারসংক্ষেপ" },
  counter: { min: 1, max: 7, label: { bn: "চক্কর" }, perRoundTips },
  whatToDo: { bn: "" },
  isCompleteWhen: "counter-max",
} as unknown as UmrahStep;

const prayStep = {
  id: "pray",
  stage: "pray",
  title: { bn: "নামাজ" },
  summary: { bn: "কাবার পেছনে দুই রাকাত নামাজ পড়ুন" },
  whatToDo: { bn: "" },
  isCompleteWhen: "manual",
} as unknown as UmrahStep;

// ---------------------------------------------------------------------------
// InstructionCard - হিরো নির্দেশ নির্বাচন
// ---------------------------------------------------------------------------

describe("InstructionCard - নির্দেশনা নির্বাচন", () => {
  it("কাউন্টার ধাপে বর্তমান চক্করের perRoundTip দেখায় (counterValue=3)", () => {
    const { getByText } = render(<InstructionCard step={tawafStep} counterValue={3} />);
    expect(getByText("তৃতীয় চক্করের নির্দেশনা")).toBeTruthy();
  });

  it("প্রথম চক্করে (counterValue=1) প্রথম টিপ দেখায়", () => {
    const { getByText } = render(<InstructionCard step={tawafStep} counterValue={1} />);
    expect(getByText("প্রথম চক্করের নির্দেশনা")).toBeTruthy();
  });

  it("counterValue max-এর বেশি হলে শেষ টিপ clamp করে দেখায়", () => {
    const { getByText } = render(<InstructionCard step={tawafStep} counterValue={99} />);
    expect(getByText("সপ্তম")).toBeTruthy();
  });

  it("কাউন্টারহীন ধাপে summary দেখায়", () => {
    const { getByText } = render(<InstructionCard step={prayStep} counterValue={0} />);
    expect(getByText("কাবার পেছনে দুই রাকাত নামাজ পড়ুন")).toBeTruthy();
  });

  it("স্টেজ লেবেল ও চক্কর চিপ দেখায়", () => {
    const { getByText } = render(<InstructionCard step={tawafStep} counterValue={2} />);
    expect(getByText("তওয়াফ")).toBeTruthy();
    expect(getByText(/চক্কর ২\/৭/)).toBeTruthy();
  });

  it("তওয়াফে হাঁটার দিকের ইঙ্গিত দেখায়", () => {
    const { getByText } = render(<InstructionCard step={tawafStep} counterValue={1} />);
    expect(getByText("ঘড়ির বিপরীত দিকে হাঁটুন")).toBeTruthy();
  });

  it("নামাজ ধাপে কোনো দিকের ইঙ্গিত নেই", () => {
    const { queryByText } = render(<InstructionCard step={prayStep} counterValue={0} />);
    expect(queryByText("ঘড়ির বিপরীত দিকে হাঁটুন")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// RoundDots - চক্কর/পাক পয়েন্ট ইন্ডিকেটর
// ---------------------------------------------------------------------------

describe("RoundDots - পয়েন্ট ইন্ডিকেটর", () => {
  it("max-সংখ্যক পয়েন্ট রেন্ডার করে", () => {
    const { container } = render(<RoundDots value={1} max={7} />);
    const root = container.querySelector('[aria-hidden="true"]');
    expect(root?.children).toHaveLength(7);
  });

  it("value=3 হলে ২ সম্পন্ন, ১ সক্রিয়, ৪ ভবিষ্যৎ", () => {
    const { container } = render(<RoundDots value={3} max={7} />);
    expect(container.querySelectorAll(".bg-map-route-completed")).toHaveLength(2);
    expect(container.querySelectorAll(".ritual-hud-dot-active")).toHaveLength(1);
    expect(container.querySelectorAll(".border-map-route-upcoming")).toHaveLength(4);
  });

  it("শুরুতে (value=1) প্রথমটিই সক্রিয়, বাকি ভবিষ্যৎ", () => {
    const { container } = render(<RoundDots value={1} max={7} />);
    expect(container.querySelectorAll(".ritual-hud-dot-active")).toHaveLength(1);
    expect(container.querySelectorAll(".border-map-route-upcoming")).toHaveLength(6);
    expect(container.querySelectorAll(".bg-map-route-completed")).toHaveLength(0);
  });

  it("সম্পূর্ণ হলে (value>=max) সব পয়েন্ট সবুজ, কোনো সক্রিয় নেই", () => {
    const { container } = render(<RoundDots value={7} max={7} />);
    expect(container.querySelectorAll(".bg-map-route-completed")).toHaveLength(7);
    expect(container.querySelectorAll(".ritual-hud-dot-active")).toHaveLength(0);
  });

  it("চক্কর বাড়ালে সদ্য-সম্পন্ন পয়েন্টে round-complete অ্যানিমেশন চলে", () => {
    const { container, rerender } = render(<RoundDots value={1} max={7} />);
    expect(container.querySelectorAll(".round-complete")).toHaveLength(0);
    rerender(<RoundDots value={2} max={7} />);
    const dots = container.querySelectorAll('[aria-hidden="true"] > span');
    // সদ্য-সম্পন্ন পয়েন্ট (index 0) সম্পন্ন-রঙ + round-complete ক্লাস
    expect(dots[0].classList.contains("bg-map-route-completed")).toBe(true);
    expect(dots[0].classList.contains("round-complete")).toBe(true);
    expect(container.querySelectorAll(".round-complete")).toHaveLength(1);
  });

  it("চক্কর কমালে (value কমে) round-complete চলে না", () => {
    const { container, rerender } = render(<RoundDots value={3} max={7} />);
    rerender(<RoundDots value={2} max={7} />);
    expect(container.querySelectorAll(".round-complete")).toHaveLength(0);
  });
});
