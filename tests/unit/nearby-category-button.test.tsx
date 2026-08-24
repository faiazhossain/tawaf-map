import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NearbyCategoryButton } from "@/components/map/nearby/NearbyCategoryButton";

describe("NearbyCategoryButton", () => {
  it("renders the Bengali count and plural label with the default testid", () => {
    render(<NearbyCategoryButton category="gate" count={5} active={false} onSelect={() => {}} />);
    const button = screen.getByTestId("nearby-category-button-gate");
    expect(button).toHaveTextContent("৫ গেট");
  });

  it("reflects the active state in aria-pressed", () => {
    const { rerender } = render(
      <NearbyCategoryButton category="hotel" count={3} active={false} onSelect={() => {}} />
    );
    expect(screen.getByTestId("nearby-category-button-hotel")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    rerender(<NearbyCategoryButton category="hotel" count={3} active={true} onSelect={() => {}} />);
    expect(screen.getByTestId("nearby-category-button-hotel")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("disables an inactive zero-count chip but keeps an active one tappable", () => {
    const { rerender } = render(
      <NearbyCategoryButton category="toilet" count={0} active={false} onSelect={() => {}} />
    );
    expect(screen.getByTestId("nearby-category-button-toilet")).toBeDisabled();
    rerender(
      <NearbyCategoryButton category="toilet" count={0} active={true} onSelect={() => {}} />
    );
    expect(screen.getByTestId("nearby-category-button-toilet")).not.toBeDisabled();
  });

  it("lets an external disabled flag override a non-zero count", () => {
    render(
      <NearbyCategoryButton
        category="hotel"
        count={10}
        active={false}
        disabled
        onSelect={() => {}}
      />
    );
    expect(screen.getByTestId("nearby-category-button-hotel")).toBeDisabled();
  });

  it("fires onSelect with the category on click", () => {
    const onSelect = vi.fn();
    render(<NearbyCategoryButton category="gate" count={2} active={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("nearby-category-button-gate"));
    expect(onSelect).toHaveBeenCalledWith("gate");
  });

  it("honors the testId override used by the chip bar", () => {
    render(
      <NearbyCategoryButton
        category="historical"
        count={1}
        active={false}
        testId="nearby-chip-historical"
        onSelect={() => {}}
      />
    );
    expect(screen.getByTestId("nearby-chip-historical")).toHaveTextContent("১ ঐতিহাসিক স্থান");
  });
});
