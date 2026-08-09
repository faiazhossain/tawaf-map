import { describe, it, expect } from "vitest";
import { getClosestAnchorId, getContextualLandmarkHint } from "@/lib/map/landmark-utils";

describe("landmark-utils", () => {
  it("finds the closest anchor from a list of anchors", () => {
    const result = getClosestAnchorId(["black-stone", "rukn-yamani"], 21.42245, 39.82655);
    expect(result).not.toBeNull();
    expect(result?.id).toBe("black-stone");
    expect(result?.distance).toBeGreaterThan(0);
  });

  it("returns default tawaf hint for tawaf stage", () => {
    const hint = getContextualLandmarkHint("tawaf", "black-stone", 10);
    expect(hint).not.toBeNull();
    expect(hint?.title).toContain("কালো পাথর");
  });

  it("returns prayer hint for pray stage", () => {
    const hint = getContextualLandmarkHint("pray", "maqam-ibrahim", 15);
    expect(hint).not.toBeNull();
    expect(hint?.title).toContain("মাকামে ইবরাহিমে");
  });

  it("returns marwa end hint for sai stage when closest anchor is marwa", () => {
    const hint = getContextualLandmarkHint("sai", "marwa", 12);
    expect(hint).not.toBeNull();
    expect(hint?.title).toContain("মারওয়ায়");
  });
});
