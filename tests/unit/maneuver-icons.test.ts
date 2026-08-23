import { describe, it, expect } from "vitest";
import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  MapPin,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { maneuverIconFor } from "@/components/navigation/maneuver-icons";

describe("maneuverIconFor", () => {
  it("বাঁয়ে মোড়ে CornerUpLeft", () => {
    expect(maneuverIconFor("turn left")).toBe(CornerUpLeft);
    expect(maneuverIconFor("sharp left")).toBe(CornerUpLeft);
    expect(maneuverIconFor("slight left")).toBe(CornerUpLeft);
    expect(maneuverIconFor("fork left")).toBe(CornerUpLeft);
  });

  it("ডানে মোড়ে CornerUpRight", () => {
    expect(maneuverIconFor("turn right")).toBe(CornerUpRight);
    expect(maneuverIconFor("continue right")).toBe(CornerUpRight);
  });

  it("ইউটার্নে RotateCcw", () => {
    expect(maneuverIconFor("uturn")).toBe(RotateCcw);
  });

  it("গোল চত্বরে RefreshCw", () => {
    expect(maneuverIconFor("roundabout")).toBe(RefreshCw);
  });

  it("যাত্রা শুরুতে Flag", () => {
    expect(maneuverIconFor("depart")).toBe(Flag);
  });

  it("গন্তব্যে MapPin", () => {
    expect(maneuverIconFor("arrive")).toBe(MapPin);
  });

  it("অজানা/অনুপস্থিত মানে সোজা ArrowUp", () => {
    expect(maneuverIconFor("continue")).toBe(ArrowUp);
    expect(maneuverIconFor("straight")).toBe(ArrowUp);
    expect(maneuverIconFor(undefined)).toBe(ArrowUp);
    expect(maneuverIconFor("")).toBe(ArrowUp);
  });
});
