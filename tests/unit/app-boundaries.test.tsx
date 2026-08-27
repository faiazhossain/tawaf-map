import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RouteError from "@/app/error";
import GlobalError from "@/app/global-error";
import NotFound from "@/app/not-found";

const boom = Object.assign(new Error("exploded in prod"), { digest: "abc123" });

describe("app/error boundary", () => {
  it("offers a Bengali reset action that invokes reset()", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<RouteError error={boom} reset={reset} />);

    expect(screen.getByText("কিছু একটা ঠিক হচ্ছে না")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "আবার চেষ্টা করুন" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("links back to the map and reassures about persisted progress", () => {
    render(<RouteError error={boom} reset={() => {}} />);
    const backLink = screen.getByRole("link", { name: "মানচিত্রে ফিরে যান" });
    expect(backLink).toHaveAttribute("href", "/map");
    expect(screen.getByText(/অগ্রগতি.*সংরক্ষিত/)).toBeInTheDocument();
  });
});

describe("app/global-error boundary", () => {
  it("renders its own html/body shell with a working reset", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const { container } = render(<GlobalError error={boom} reset={reset} />);

    expect(container.querySelector("html[lang='bn']")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "আবার চেষ্টা করুন" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("app/not-found page", () => {
  it("points lost visitors at the map and home", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "মানচিত্র খুলুন" })).toHaveAttribute("href", "/map");
    expect(screen.getByRole("link", { name: "প্রথম পাতা" })).toHaveAttribute("href", "/");
  });
});
