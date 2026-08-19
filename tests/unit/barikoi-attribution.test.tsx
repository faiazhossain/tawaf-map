import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BarikoiAttribution } from "@/components/map/BarikoiAttribution";

describe("BarikoiAttribution", () => {
  it("links to barikoi.com in a new tab", () => {
    render(<BarikoiAttribution />);
    const link = screen.getByTestId("barikoi-attribution");
    expect(link).toHaveAttribute("href", "https://www.barikoi.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the small Barikoi logo for reference", () => {
    render(<BarikoiAttribution />);
    const logo = screen.getByAltText("Barikoi");
    expect(logo).toHaveAttribute(
      "src",
      expect.stringContaining("/images/tourist-places/barikoi_logo.svg")
    );
    expect(logo.getAttribute("width")).toBe("56");
    expect(logo.getAttribute("height")).toBe("16");
  });

  it("carries a Bengali accessible label naming the data provider", () => {
    render(<BarikoiAttribution />);
    expect(screen.getByTestId("barikoi-attribution")).toHaveAttribute(
      "aria-label",
      "বারিকই — মানচিত্রের তথ্য সরবরাহকারী"
    );
  });
});
