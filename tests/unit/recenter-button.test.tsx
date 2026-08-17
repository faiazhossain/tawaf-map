import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { RecenterButton } from "@/components/map/RecenterButton";

describe("RecenterButton", () => {
  it("renders with the default Bengali label", () => {
    const { getByRole } = render(<RecenterButton onClick={vi.fn()} />);
    expect(getByRole("button").getAttribute("aria-label")).toBe("কেন্দ্রে ফেরান");
  });

  it("fires onClick on tap", () => {
    const onClick = vi.fn();
    const { getByRole } = render(<RecenterButton onClick={onClick} />);
    getByRole("button").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("passes the style prop through to the root element", () => {
    const { container } = render(<RecenterButton onClick={vi.fn()} style={{ bottom: "370px" }} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.bottom).toBe("370px");
  });
});
