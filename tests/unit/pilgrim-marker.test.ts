import { describe, it, expect } from "vitest";
import { PILGRIM_ICON, pilgrimIconForGender, createPilgrimMarkerElement } from "@/lib/map/markers";

describe("pilgrimIconForGender - লিঙ্গ অনুযায়ী আইকন", () => {
  it("পুরুষ হলে পুরুষ আইকন, নারী হলে নারী আইকন", () => {
    expect(pilgrimIconForGender("male")).toBe(PILGRIM_ICON.male);
    expect(pilgrimIconForGender("female")).toBe(PILGRIM_ICON.female);
  });

  it("আইকন সোর্স আসলে public/icons পাথে নির্দেশ করে", () => {
    expect(PILGRIM_ICON.male).toBe("/icons/pilgrim_male.svg");
    expect(PILGRIM_ICON.female).toBe("/icons/pilgrim_female.svg");
  });

  it("অজানা/শূন্য লিঙ্গে নিরাপদ ডিফল্ট (পুরুষ)", () => {
    expect(pilgrimIconForGender(null)).toBe(PILGRIM_ICON.male);
    expect(pilgrimIconForGender(undefined)).toBe(PILGRIM_ICON.male);
  });

  it("দুটি আইকন আলাদা", () => {
    expect(PILGRIM_ICON.male).not.toBe(PILGRIM_ICON.female);
  });
});

describe("createPilgrimMarkerElement - হাজি মার্কার", () => {
  it("প্রদত্ত iconSrc দিয়ে <img> রেন্ডার করে", () => {
    const el = createPilgrimMarkerElement("/icons/pilgrim_female.svg");
    const img = el.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("/icons/pilgrim_female.svg");
  });

  it("প্রারম্ভে অদৃশ্য (opacity 0) - হুক ফেড-ইন করে", () => {
    const el = createPilgrimMarkerElement(PILGRIM_ICON.male);
    expect(el.style.opacity).toBe("0");
  });

  it("সঠিক ক্লাস ও pointer-events none (মানচিত্রে ক্লিক বাধা দেয় না)", () => {
    const el = createPilgrimMarkerElement(PILGRIM_ICON.male);
    expect(el.className).toContain("map-marker-pilgrim");
    expect(el.style.pointerEvents).toBe("none");
  });

  it("bob অ্যানিমেশন রাপার আছে", () => {
    const el = createPilgrimMarkerElement(PILGRIM_ICON.male);
    expect(el.querySelector(".pilgrim-bob")).toBeTruthy();
  });
});
