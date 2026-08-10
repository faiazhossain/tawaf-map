import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MiqatInfoButton } from "@/components/umrah/MiqatInfoButton";
import { MIQAT_INFO } from "@/lib/data/umrah/miqat";

describe("MiqatInfoButton", () => {
  it("তথ্য বোতাম রেন্ডার করে এবং প্রাথমিকভাবে বিস্তারিত লুকায়", () => {
    render(<MiqatInfoButton />);

    expect(screen.getByRole("button", { name: "মীকাত কী?" })).toBeTruthy();
    expect(screen.queryByText(MIQAT_INFO.intro)).toBeNull();
    expect(screen.queryByText(/বুখারি ১৫২৪/)).toBeNull();
  });

  it("ক্লিকে মীকাতের ব্যাখ্যা, সহজ সংজ্ঞা ও রেফারেন্স দেখায়", async () => {
    const user = userEvent.setup();
    render(<MiqatInfoButton />);

    await user.click(screen.getByRole("button", { name: "মীকাত কী?" }));

    expect(screen.getByText(MIQAT_INFO.intro)).toBeTruthy();
    expect(screen.getByText(MIQAT_INFO.short)).toBeTruthy();
    expect(screen.getByText(MIQAT_INFO.example)).toBeTruthy();
    expect(screen.getByText(/বুখারি ১৫২৪/)).toBeTruthy();
    expect(screen.getByText(/মুসলিম ১১৮১b/)).toBeTruthy();
  });

  it("Escape চাপলে পপওভার বন্ধ করে", async () => {
    const user = userEvent.setup();
    render(<MiqatInfoButton />);

    await user.click(screen.getByRole("button", { name: "মীকাত কী?" }));
    expect(screen.getByText(MIQAT_INFO.intro)).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByText(MIQAT_INFO.intro)).toBeNull();
  });

  it("বাইরে ক্লিক করলে পপওভার বন্ধ করে", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <MiqatInfoButton />
        <button type="button">অন্য জায়গা</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "মীকাত কী?" }));
    expect(screen.getByText(MIQAT_INFO.intro)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "অন্য জায়গা" }));
    expect(screen.queryByText(MIQAT_INFO.intro)).toBeNull();
  });
});
