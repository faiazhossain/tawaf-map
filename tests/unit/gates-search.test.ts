import { describe, it, expect } from "vitest";
import { normalizeGateText, filterGatesByQuery } from "@/lib/gates/search";
import type { Gate } from "@/types/gate";

/** ন্যূনতম বৈধ `Gate` — টেস্ট ফিক্সচার বানানোর সুবিধার জন্য। */
function gate(partial: Partial<Gate>): Gate {
  return {
    id: "test",
    name: "গেট",
    nameAr: "",
    location: { coordinates: [39.82, 21.42] },
    facilities: [],
    nearestLandmarks: [],
    ...partial,
  };
}

const FIXTURES: Gate[] = [
  gate({ id: "bn-numeric", name: "গেট ৯০", nameBn: "গেট ৯০" }),
  gate({
    id: "latin",
    name: "কিং ফাহদ গেট",
    nameAr: "باب الملك فھد",
    nameEn: "King Fahd Gate - 79",
  }),
  gate({ id: "arabic-only", name: "বাব আল-ফাতহ গেট", nameAr: "باب الفتح" }),
];

describe("normalizeGateText", () => {
  it("বাংলা অঙ্ককে লাতিন অঙ্কে রূপান্তর করে", () => {
    expect(normalizeGateText("গেট ৯০")).toBe("গেট 90");
    expect(normalizeGateText("৩১০, ৩১১")).toBe("310, 311");
  });

  it("ছোট-হাতের করে ও বাড়তি ফাঁকা সরায়", () => {
    expect(normalizeGateText("  King   Fahd ")).toBe("king fahd");
  });
});

describe("filterGatesByQuery", () => {
  it("লাতিন-অঙ্ক কোয়েরি বাংলা-অঙ্ক নামের গেট খুঁজে পায় (এবং উল্টোটাও)", () => {
    expect(filterGatesByQuery(FIXTURES, "90").map((g) => g.id)).toEqual(["bn-numeric"]);
    expect(filterGatesByQuery(FIXTURES, "৯০").map((g) => g.id)).toEqual(["bn-numeric"]);
  });

  it("ইংরেজি কোয়েরি nameEn থেকে কেস-অচেতনভাবে মেলে", () => {
    expect(filterGatesByQuery(FIXTURES, "FAHD").map((g) => g.id)).toEqual(["latin"]);
    expect(filterGatesByQuery(FIXTURES, "king fahd").map((g) => g.id)).toEqual(["latin"]);
  });

  it("বাংলা ও আরবি সাবস্ট্রিং আগের মতোই মেলে", () => {
    expect(filterGatesByQuery(FIXTURES, "ফাহদ").map((g) => g.id)).toEqual(["latin"]);
    expect(filterGatesByQuery(FIXTURES, "باب الفتح").map((g) => g.id)).toEqual(["arabic-only"]);
  });

  it("খালি বা শুধু-ফাঁকা কোয়েরিতে পুরো তালিকা ফেরত দেয়", () => {
    expect(filterGatesByQuery(FIXTURES, "")).toBe(FIXTURES);
    expect(filterGatesByQuery(FIXTURES, "   ")).toBe(FIXTURES);
  });

  it("না মিললে খালি তালিকা ফেরত দেয়", () => {
    expect(filterGatesByQuery(FIXTURES, "zzz")).toEqual([]);
  });

  it("nameEn/nameBn অনুপস্থিত গেটে ক্র্যাশ করে না", () => {
    expect(filterGatesByQuery([gate({ id: "bare" })], "গেট").map((g) => g.id)).toEqual(["bare"]);
  });
});
