import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationRecoverySheet } from "@/components/map/LocationRecoverySheet";

interface SetupOptions {
  permission?: "granted" | "denied" | "prompt" | "unknown";
  error?: string | null;
  loading?: boolean;
}

function setup({ permission = "denied", error = null, loading = false }: SetupOptions = {}) {
  const onOpenChange = vi.fn();
  const onRetry = vi.fn();
  const user = userEvent.setup();
  const utils = render(
    <LocationRecoverySheet
      open
      onOpenChange={onOpenChange}
      permission={permission}
      error={error}
      loading={loading}
      onRetry={onRetry}
    />
  );
  return { onOpenChange, onRetry, user, ...utils };
}

describe("LocationRecoverySheet (UX-001)", () => {
  it("explains the denied state with browser-settings steps and offers retry", async () => {
    const { onRetry, user } = setup();

    expect(screen.getByText("লোকেশনের অনুমতি নেই")).toBeTruthy();
    expect(screen.getByText(/Permissions → Location → Allow/)).toBeTruthy();
    // No store error in this scenario, so no note row at all.
    expect(screen.queryByTestId("location-recovery-store-error")).toBeNull();

    await user.click(screen.getByTestId("location-recovery-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the store's failure message when one exists", () => {
    setup({
      permission: "prompt",
      error: "জিপিএস সিগন্যাল পাওয়া যায়নি - ডিভাইসের লোকেশন চালু আছে কি না দেখুন",
    });

    expect(screen.getByText("লোকেশন পাওয়া যায়নি")).toBeTruthy();
    expect(screen.getByTestId("location-recovery-store-error").textContent).toContain(
      "জিপিএস সিগন্যাল"
    );
  });

  it("browse mode closes the sheet instead of dead-ending the user", async () => {
    const { onOpenChange, user } = setup();

    await user.click(screen.getByRole("button", { name: /মানচিত্র ব্রাউজ করুন/ }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // The value-prop line is present so browse feels like a real choice.
    expect(screen.getByText(/গেট সার্চ, ওমরাহ গাইড/)).toBeTruthy();
  });

  it("disables retry while a fix attempt is running", () => {
    setup({ loading: true });

    const retry = screen.getByTestId("location-recovery-retry") as HTMLButtonElement;
    expect(retry.disabled).toBe(true);
    expect(screen.getByText("চেষ্টা চলছে…")).toBeTruthy();
  });
});
