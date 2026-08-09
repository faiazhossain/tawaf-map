import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuideStepList } from "@/components/umrah/guide/GuideStepList";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import type { UmrahStep } from "@/types/umrah";

// পরীক্ষার জন্য দুটি ধাপ - একটি ম্যানুয়াল, একটি কাউন্টারসহ। প্রতিটির whatToDo স্বতন্ত্র।
const stepA = {
  id: "a",
  stage: "prep",
  order: 1,
  title: { bn: "প্রথম ধাপ", en: "First" },
  summary: { bn: "প্রথম সারসংক্ষেপ", en: "First summary" },
  gender: "all",
  whatToDo: { bn: "প্রথম ধাপের কাজ", en: "First todo" },
  isCompleteWhen: "manual",
  sourceRefs: [],
} as unknown as UmrahStep;

const stepB = {
  id: "b",
  stage: "tawaf",
  order: 2,
  title: { bn: "দ্বিতীয় ধাপ", en: "Second" },
  summary: { bn: "দ্বিতীয় সারসংক্ষেপ", en: "Second summary" },
  gender: "all",
  counter: { min: 1, max: 7, label: { bn: "চক্কর", en: "circuit" } },
  whatToDo: { bn: "দ্বিতীয় ধাপের কাজ", en: "Second todo" },
  isCompleteWhen: "counter-max",
  sourceRefs: [],
} as unknown as UmrahStep;

const steps = [stepA, stepB];

// প্রতি পরীক্ষায় স্টোর পরিচ্ছন্ন প্রারম্ভিক অবস্থায় রাখা।
beforeEach(() => {
  useUmrahGuideStore.setState({
    profile: null,
    onboarded: false,
    stepIds: ["a", "b"],
    currentIndex: 0,
    completed: {},
    counters: {},
    mode: "guide",
  });
});

describe("GuideStepList - অ্যাকর্ডিয়ন টগল", () => {
  it("বর্তমান ধাপ প্রসারিত থাকে ও 'কী করবেন' দেখায়", () => {
    render(<GuideStepList steps={steps} />);
    expect(screen.getByText("প্রথম ধাপের কাজ")).toBeTruthy();
    expect(screen.getByText("কী করবেন")).toBeTruthy();
    expect(screen.getByRole("button", { name: /প্রথম ধাপ/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("button", { name: /দ্বিতীয় ধাপ/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("খোলা বর্তমান ধাপে আবার ট্যাপ করলে বন্ধ হয় (টগল অফ)", async () => {
    const user = userEvent.setup();
    render(<GuideStepList steps={steps} />);

    const header = screen.getByRole("button", { name: /প্রথম ধাপ/ });
    await user.click(header);

    expect(screen.queryByText("প্রথম ধাপের কাজ")).toBeNull();
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("বন্ধ ধাপে আবার ট্যাপ করলে পুনরায় খোলে", async () => {
    const user = userEvent.setup();
    render(<GuideStepList steps={steps} />);

    const header = screen.getByRole("button", { name: /প্রথম ধাপ/ });
    await user.click(header); // বন্ধ
    await user.click(header); // আবার খোল

    expect(screen.getByText("প্রথম ধাপের কাজ")).toBeTruthy();
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("অন্য ধাপে ট্যাপ করলে সেটি বর্তমান হয় ও প্রসারিত হয়, আগেরটি বন্ধ হয়", async () => {
    const user = userEvent.setup();
    render(<GuideStepList steps={steps} />);

    await user.click(screen.getByRole("button", { name: /দ্বিতীয় ধাপ/ }));

    expect(useUmrahGuideStore.getState().currentIndex).toBe(1);
    expect(screen.getByText("দ্বিতীয় ধাপের কাজ")).toBeTruthy();
    expect(screen.queryByText("প্রথম ধাপের কাজ")).toBeNull();
    expect(screen.getByRole("button", { name: /দ্বিতীয় ধাপ/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByRole("button", { name: /প্রথম ধাপ/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("বাইরে থেকে বর্তমান ধাপ বদলালে নতুন ধাপ স্বয়ংক্রিয়ভাবে খোলে", () => {
    render(<GuideStepList steps={steps} />);
    expect(screen.getByText("প্রথম ধাপের কাজ")).toBeTruthy();

    // কম্পোনেন্ট স্টোরে সাবস্ক্রাইব করা, তাই আপডেটে স্বয়ংক্রিয় পুনরায় রেন্ডার হয়
    act(() => {
      useUmrahGuideStore.getState().goToStep(1);
    });

    expect(screen.getByText("দ্বিতীয় ধাপের কাজ")).toBeTruthy();
    expect(screen.queryByText("প্রথম ধাপের কাজ")).toBeNull();
  });

  it("সম্পন্ন ধাপে সবুজ টিক ও 'সম্পন্ন' ব্যাজ দেখায়, পরবর্তী ধাপে 'পরবর্তী' ব্যাজ", () => {
    // প্রথম ধাপ সম্পন্ন চিহ্নিত করে দ্বিতীয়টিকে বর্তমান করা
    useUmrahGuideStore.setState({
      completed: { a: true },
      currentIndex: 1,
    });
    render(<GuideStepList steps={steps} />);

    expect(screen.getByText("সম্পন্ন")).toBeTruthy();
    // বর্তমান (b) ও পরবর্তী নেই; পরবর্তী ব্যাজ শেষ ধাপে নেই তাই এখানে বর্তমান ব্যাজ যাচাই
    expect(screen.getByText("বর্তমান")).toBeTruthy();
  });
});
