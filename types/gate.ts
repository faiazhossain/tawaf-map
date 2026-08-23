import type { GateSuitability } from "@/types/umrah";

export type GateType = "king_fahd" | "umrah" | "salah";

export interface Gate {
  id: string;
  name: string;
  nameAr: string;
  /** বাংলা প্রদর্শন-নাম (কাছাকাছি তালিকা/চিপে দেখানো হয়) */
  nameBn?: string;
  /** লাতিন নাম (OSM name:en) — সার্চ ম্যাচিং ও টাইল-লেবেলের জন্য */
  nameEn?: string;
  location: {
    coordinates: [number, number];
  };
  /** OSM-derived gates lack a curated type; falls back to "umrah" at read sites */
  type?: GateType;
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
