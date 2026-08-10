import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IncompleteStepDialog } from "@/components/umrah/guide/IncompleteStepDialog";
import type { UmrahStep } from "@/types/umrah";

// ম্যানুয়াল ধাপ - "সম্পন্ন করেছি" বোতাম প্রত্যাশিত।
const manualStep = {
  id: "prep",
  title: { bn: "ইহরামের প্রস্তুতি", en: "Preparation" },
  isCompleteWhen: "manual",
} as unknown as UmrahStep;

// কাউন্টার-ম্যাক্স ধাপ (তওয়াফ) - শুধু তথ্যমূলক, ম্যানুয়াল বোতাম নেই।
const counterStep = {
  id: "tawaf",
  title: { bn: "তওয়াফ (৭ চক্কর)", en: "Tawaf" },
  isCompleteWhen: "counter-max",
  counter: { min: 1, max: 7, label: { bn: "চক্কর", en: "circuit" } },
} as unknown as UmrahStep;

describe("IncompleteStepDialog", () => {
  it("ম্যানুয়াল ধাপে সতর্কবার্তা ও 'সম্পন্ন করেছি' বোতাম দেখায়", () => {
    render(<IncompleteStepDialog step={manualStep} onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByText("ধাপটি এখনো সম্পন্ন হয়নি")).toBeTruthy();
    expect(screen.getByText("ইহরামের প্রস্তুতি")).toBeTruthy();
    expect(screen.getByText(/পরবর্তী ধাপে যেতে আগে/)).toBeTruthy();
    // সততার সতর্কবার্তা: শুধুমাত্র সত্যিই সম্পূর্ণ করলে চিহ্নিত করতে হবে।
    expect(screen.getByText(/গুরুত্বপূর্ণ/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "সম্পন্ন করেছি" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "এখনো বাকি" })).toBeTruthy();
  });

  it("'সম্পন্ন করেছি' চাপলে onConfirm, 'এখনো বাকি' চাপলে onClose ডাকে", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<IncompleteStepDialog step={manualStep} onClose={onClose} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "সম্পন্ন করেছি" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "এখনো বাকি" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape চাপলে onClose ডাকে", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<IncompleteStepDialog step={manualStep} onClose={onClose} onConfirm={vi.fn()} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("counter-max ধাপে 'সম্পন্ন করেছি' বোতাম থাকে না, শুধু তথ্য ও 'ঠিক আছে'", () => {
    render(<IncompleteStepDialog step={counterStep} onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "সম্পন্ন করেছি" })).toBeNull();
    expect(screen.getByText(/স্বয়ংক্রিয়ভাবে সম্পন্ন/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "ঠিক আছে" })).toBeTruthy();
  });

  it("counter-max ধাপে 'ঠিক আছে' চাপলে onClose ডাকে, onConfirm নয়", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<IncompleteStepDialog step={counterStep} onClose={onClose} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "ঠিক আছে" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
