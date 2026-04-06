import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the heading", () => {
    render(<HomePage />);
    const heading = screen.getByText("TawafMap");
    expect(heading).toBeDefined();
  });

  it("renders the description", () => {
    render(<HomePage />);
    const description = screen.getByText(/মক্কা-মদিনায় হারাবেন না আর কখনও/);
    expect(description).toBeDefined();
  });
});
