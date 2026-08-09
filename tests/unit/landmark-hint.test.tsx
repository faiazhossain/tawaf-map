import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { LandmarkHint } from "@/components/umrah/guide/LandmarkHint";

describe("LandmarkHint", () => {
  it("renders title, description, and anchor name", () => {
    const { getByText } = render(
      <LandmarkHint
        title="টেস্ট ল্যান্ডমার্ক"
        description="এখানে একটি ছোট বর্ণনা থাকবে।"
        anchorName="হাজরে আসওয়াদ"
        onDismiss={() => undefined}
      />
    );

    expect(getByText("টেস্ট ল্যান্ডমার্ক")).toBeTruthy();
    expect(getByText("এখানে একটি ছোট বর্ণনা থাকবে।")).toBeTruthy();
    expect(getByText("হাজরে আসওয়াদ")).toBeTruthy();
  });

  it("calls onDismiss when dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    const { getByRole } = render(
      <LandmarkHint
        title="টেস্ট ল্যান্ডমার্ক"
        description="এখানে একটি ছোট বর্ণনা থাকবে।"
        anchorName="হাজরে আসওয়াদ"
        onDismiss={onDismiss}
      />
    );

    getByRole("button").click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
