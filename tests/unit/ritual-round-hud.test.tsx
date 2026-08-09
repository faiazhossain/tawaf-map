import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RitualRoundHud } from "@/components/map/RitualRoundHud";

describe("RitualRoundHud - তওয়াফ/সাঈ রাউন্ড ট্র্যাকার", () => {
  it("স্টেজ ও চক্কর সংখ্যা বাংলা সংখ্যায় দেখায়", () => {
    const { getByText } = render(
      <RitualRoundHud stageLabel="তওয়াফ" roundLabel="চক্কর" value={3} max={7} />
    );
    expect(getByText("তওয়াফ")).toBeTruthy();
    expect(getByText(/চক্কর ৩ \/ ৭/)).toBeTruthy();
  });

  it("সর্বমোট max-সংখ্যক পয়েন্ট রেন্ডার করে", () => {
    const { container } = render(
      <RitualRoundHud stageLabel="তওয়াফ" roundLabel="চক্কর" value={1} max={7} />
    );
    // পয়েন্টগুলো aria-hidden রো-তে; সেই স্প্যানগুলো গণনা করি
    const dots = container.querySelectorAll('[aria-hidden="true"] span');
    expect(dots).toHaveLength(7);
  });

  it("value=3 হলে ২ সম্পন্ন, ১ সক্রিয়, ৪ বাকি", () => {
    const { container } = render(
      <RitualRoundHud stageLabel="তওয়াফ" roundLabel="চক্কর" value={3} max={7} />
    );
    expect(container.querySelectorAll(".bg-emerald-400")).toHaveLength(2);
    expect(container.querySelectorAll(".ritual-hud-dot-active")).toHaveLength(1);
    expect(container.querySelectorAll(".bg-slate-600")).toHaveLength(4);
  });

  it("শুরুতে (value=1) প্রথমটিই সক্রিয়, বাকি বাকি", () => {
    const { container } = render(
      <RitualRoundHud stageLabel="সাঈ" roundLabel="পাক" value={1} max={7} />
    );
    expect(container.querySelectorAll(".ritual-hud-dot-active")).toHaveLength(1);
    expect(container.querySelectorAll(".bg-slate-600")).toHaveLength(6);
    expect(container.querySelectorAll(".bg-emerald-400")).toHaveLength(0);
  });

  it("সম্পূর্ণ হলে (value>=max) সব পয়েন্ট সবুজ, কোনো সক্রিয় নেই", () => {
    const { container } = render(
      <RitualRoundHud stageLabel="তওয়াফ" roundLabel="চক্কর" value={7} max={7} />
    );
    expect(container.querySelectorAll(".bg-emerald-400")).toHaveLength(7);
    expect(container.querySelectorAll(".ritual-hud-dot-active")).toHaveLength(0);
    expect(container.querySelectorAll(".bg-slate-600")).toHaveLength(0);
  });

  it("className প্রপ প্রয়োগ করে", () => {
    const { container } = render(
      <RitualRoundHud
        stageLabel="তওয়াফ"
        roundLabel="চক্কর"
        value={2}
        max={7}
        className="custom-pos"
      />
    );
    // role="status" রুট উপাদানে কাস্টম ক্লাস আছে
    const root = container.querySelector('[role="status"]');
    expect(root?.className).toContain("custom-pos");
  });
});
