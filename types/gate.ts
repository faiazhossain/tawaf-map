import type { GateSuitability } from "@/types/umrah";

export type GateType = "king_fahd" | "umrah" | "salah";

export interface Gate {
  id: string;
  name: string;
  nameAr: string;
  location: {
    coordinates: [number, number];
  };
  type: GateType;
  facilities: string[];
  nearestLandmarks: string[];
  /** ওমরাহ গাইডের জন্য - কোন ধাপে এই গেট উপযুক্ত (ঐচ্ছিক) */
  suitableFor?: GateSuitability[];
}

export interface SelectedGate {
  gate: Gate | null;
  distance: number | null;
  walkingTime: number | null;
}
