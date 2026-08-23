import { describe, it, expect } from "vitest";
import { osrmStepToRouteStep, osrmLegsToSteps } from "@/lib/routing/osrm-instructions-bn";

describe("osrmStepToRouteStep", () => {
  it("যাত্রা শুরুর ধাপে রাস্তার নামসহ বাংলা বাক্য", () => {
    const step = osrmStepToRouteStep({
      name: "Ibrahim Al Khalil Street",
      distance: 320,
      duration: 240,
      maneuver: { type: "depart", modifier: "" },
    });
    expect(step.instruction).toBe("Ibrahim Al Khalil Street ধরে হাঁটা শুরু করুন");
    expect(step.distance).toBe(320);
    expect(step.duration).toBe(240);
    expect(step.maneuver).toBe("depart");
  });

  it("modifier অনুযায়ী বাঁয়ে/ডানে মোড়ের বাক্য", () => {
    expect(osrmStepToRouteStep({ maneuver: { type: "turn", modifier: "left" } }).instruction).toBe(
      "বাঁয়ে মোড় নিন"
    );
    expect(
      osrmStepToRouteStep({ name: "Ajyad Road", maneuver: { type: "turn", modifier: "right" } })
        .instruction
    ).toBe("Ajyad Road ধরে ডানে মোড় নিন");
    expect(
      osrmStepToRouteStep({ maneuver: { type: "turn", modifier: "sharp left" } }).instruction
    ).toBe("তীক্ষ্ণভাবে বাঁয়ে মোড় নিন");
    expect(
      osrmStepToRouteStep({ maneuver: { type: "turn", modifier: "slight right" } }).instruction
    ).toBe("সামান্য ডানে মোড় নিন");
    expect(
      osrmStepToRouteStep({ maneuver: { type: "continue", modifier: "uturn" } }).instruction
    ).toBe("উ-টার্ন নিন");
  });

  it("গন্তব্যে পৌঁছানোর ধাপ", () => {
    expect(osrmStepToRouteStep({ maneuver: { type: "arrive" } }).instruction).toBe(
      "গন্তব্যে পৌঁছেছেন"
    );
    expect(
      osrmStepToRouteStep({ name: "King Fahd Gate", maneuver: { type: "arrive" } }).instruction
    ).toBe("King Fahd Gate-এ গন্তব্যে পৌঁছেছেন");
  });

  it("গোল চত্বরের এক্সিট বাংলা অঙ্কে", () => {
    expect(osrmStepToRouteStep({ exit: 3, maneuver: { type: "roundabout" } }).instruction).toBe(
      "গোল চত্বর (রাউন্ডঅ্যাবাউট) ঘুরে ৩ নম্বর এক্সিট নিন"
    );
    expect(osrmStepToRouteStep({ maneuver: { type: "rotary" } }).instruction).toBe(
      "গোল চত্বর (রাউন্ডঅ্যাবাউট) ঘুরে বের হয়ে যান"
    );
  });

  it("fork ও merge-এর বাক্য", () => {
    expect(
      osrmStepToRouteStep({ maneuver: { type: "fork", modifier: "slight right" } }).instruction
    ).toBe("সামনে রাস্তা দুই ভাগে ভাগ হয়েছে — ডান দিকটি ধরুন");
    expect(osrmStepToRouteStep({ maneuver: { type: "merge", modifier: "left" } }).instruction).toBe(
      "মূল পথে বাঁ দিক থেকে মিশে যান"
    );
  });

  it("অজানা ধরনে আপস্ট্রিমের instruction-এ ফলব্যাক, না থাকলে সাধারণ বাক্য", () => {
    expect(
      osrmStepToRouteStep({ maneuver: { type: "notification", instruction: "Use caution" } })
        .instruction
    ).toBe("Use caution");
    expect(osrmStepToRouteStep({ maneuver: { type: "weird-future-type" } }).instruction).toBe(
      "এগিয়ে চলুন"
    );
  });

  it("অনুপস্থিত ফিল্ডে নিরাপদ ডিফল্ট", () => {
    const step = osrmStepToRouteStep({});
    expect(step.distance).toBe(0);
    expect(step.duration).toBe(0);
    expect(step.instruction).toBe("এগিয়ে চলুন");
  });
});

describe("osrmLegsToSteps", () => {
  it("সব leg-এর ধাপ এক তালিকায় সাজায়", () => {
    const steps = osrmLegsToSteps([
      {
        steps: [
          { maneuver: { type: "depart" } },
          { maneuver: { type: "turn", modifier: "right" } },
        ],
      },
      { steps: [{ maneuver: { type: "arrive" } }] },
    ]);
    expect(steps.map((s) => s.maneuver)).toEqual(["depart", "turn right", "arrive"]);
  });

  it("খালি/অনুপস্থিত legs-এ খালি তালিকা", () => {
    expect(osrmLegsToSteps([])).toEqual([]);
    expect(osrmLegsToSteps(undefined as never)).toEqual([]);
  });
});
