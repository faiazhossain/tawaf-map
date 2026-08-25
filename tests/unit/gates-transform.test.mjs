import { describe, it, expect } from "vitest";
import {
  toBengaliNumber,
  makeBengaliName,
  filterHaramGates,
  filterNabawiGates,
  denormalizeNode,
  toGate,
  extractGatesFromOverpass,
} from "../../scripts/gates/transform.mjs";

// হোটেল / বেসামরিক / কাবার দরজার OSM id — ব্লকলিস্টে থাকা উচিত
const HOTEL_IDS = [
  5077494802, 6347449492, 6463226586, 6463226587, 6484866064, 10838162448, 10838162449,
];
const KAABA_DOOR_ID = 4900636561;

/** একটি haraam নোড তৈরি করে (filterHaramGates-এর ইনপুট আকার)। */
function node(id, tags) {
  return { type: "node", id, lat: 21.42, lon: 39.82, tags };
}

describe("toBengaliNumber", () => {
  it("রূপান্তর করে লাতিন থেকে বাংলা অঙ্কে", () => {
    expect(toBengaliNumber("301")).toBe("৩০১");
    expect(toBengaliNumber(90)).toBe("৯০");
    expect(toBengaliNumber("310, 311")).toBe("৩১০, ৩১১");
  });
});

describe("makeBengaliName", () => {
  it("উপরের ওভাররাইড টেবিল থেকে বাংলা নাম দেয়", () => {
    expect(makeBengaliName("باب الملك فھد - 79", "King Fahd Gate - 79", "79")).toBe("কিং ফাহদ গেট");
    expect(makeBengaliName("باب السلام", "Bab Al Salam", "")).toBe("বাব সালাম গেট");
    expect(
      makeBengaliName("مدخل النساء للروضة الشريفة", "Women's Entry into noble Rawda", "")
    ).toBe("নারীদের রওজা প্রবেশ");
  });

  it("সংখ্যামূলক ref থেকে গেট N বাংলা নাম দেয়", () => {
    expect(makeBengaliName("", "", "79")).toBe("গেট ৭৯");
  });

  it("নব্বীর সংখ্যা-নাম (নামই সংখ্যা) থেকেও গেট N দেয়", () => {
    // denormalizeNode পড়ার মতো nameEn (সংখ্যা-নাম) numericName হিসাবে যায়।
    // এখানে nameAr নামহীন, নামটাই সংখ্যা → numericName থেকে গেট N।
    expect(makeBengaliName("", "301", "")).toBe("301"); // numericName না গেলে ইংরেজি সংখ্যা
    expect(makeBengaliName("", "310, 311", "", "310, 311")).toBe("গেট ৩১০, ৩১১");
    expect(makeBengaliName("301", "301", "", "301")).toBe("গেট ৩০১");
  });

  it("কিছুই না থাকলে 'গেট' ফেরত", () => {
    expect(makeBengaliName("", "", "")).toBe("গেট");
  });
});

describe("filterHaramGates", () => {
  it("শুধু entrance yes/main + নাম/ref + অ-ব্লকলিস্ট নোড রাখে", () => {
    const el = [
      node(1, { entrance: "yes", name: "باب" }), // keep
      node(2, { entrance: "main", ref: "40", name: "باب العمرة" }), // keep
      node(3, { entrance: "no", name: "x" }), // drop
      node(4, { name: "no entrance" }), // drop (no entrance)
      node(5, { entrance: "yes" }), // drop (no name/ref)
      node(HOTEL_IDS[0], { entrance: "main", name: "Gate 4 - Jabel Omar" }), // drop hotel
      node(KAABA_DOOR_ID, { entrance: "no", name: "باب الكعبة" }), // drop kaaba
      node(6, { entrance: "yes", indoor: "door", name: "in" }), // drop indoor
      node(7, { entrance: "yes", access: "no", name: "blocked" }), // drop access=no
    ];
    const kept = filterHaramGates(el).map((e) => e.id);
    expect(kept).toEqual([1, 2]);
  });
});

describe("filterNabawiGates", () => {
  it("শুধু barrier=gate + access!==no রাখে", () => {
    const el = [
      { id: 1, tags: { barrier: "gate", name: "301" } }, // keep
      { id: 2, tags: { barrier: "gate", access: "no", name: "Door 42" } }, // drop access=no
      { id: 3, tags: { amenity: "toilets", building: "yes", entrance: "yes", name: "206" } }, // drop toilet way
      { id: 4, tags: { entrance: "yes" } }, // drop no barrier
    ];
    const kept = filterNabawiGates(el).map((e) => e.id);
    expect(kept).toEqual([1]);
  });
});

describe("denormalizeNode / toGate", () => {
  it("stabilizes ওয়েলচেয়ার + আয়কার", () => {
    const g = denormalizeNode(
      node(123, { entrance: "main", name: "باب الملك عبد العزیز", wheelchair: "yes", ref: "1" })
    );
    expect(g).toMatchObject({
      id: "+osm-123",
      osmId: 123,
      wheelchair: true,
      coordinates: [39.82, 21.42],
    });
    expect(g.name).toBe("কিং আব্দুল আজিজ গেট");

    const gate = toGate(g);
    expect(gate.location.coordinates).toEqual([39.82, 21.42]);
    expect(gate.facilities).toEqual(["wheelchair"]);
    // type বাদ (optional) — OSM গেটে কোনো curated type থাকে না
    expect(gate).not.toHaveProperty("type");
  });

  it("nameEn থাকলে Gate-এ রাখে (লাতিন সার্চের জন্য)", () => {
    const g = denormalizeNode(
      node(124, {
        entrance: "yes",
        "name:en": "King Fahd Gate - 79",
        "name:ar": "باب الملك فھد",
        ref: "79",
      })
    );
    expect(toGate(g).nameEn).toBe("King Fahd Gate - 79");
  });
});

describe("extractGatesFromOverpass", () => {
  it("haraam veneur-এর জন্য সঠিক ফিল্টার প্রয়োগ করে", () => {
    const els = [
      node(1, { entrance: "yes", name: "باب" }),
      { id: 2, tags: { amenity: "toilets" } }, // nabawi-style way
    ];
    expect(extractGatesFromOverpass(els, "haram").map((g) => g.osmId)).toEqual([1]);
  });
});
