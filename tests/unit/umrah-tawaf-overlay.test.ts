import { describe, it, expect } from "vitest";
import {
  splitEllipseArcs,
  splitLineSegments,
  arcState,
  buildTawafProgressGeoJSON,
  buildSaiProgressGeoJSON,
  getTawafLapCoords,
  getSaiLapCoords,
  getTawafCircleCoords,
  getSaiCorridorCoords,
  buildDirectionArrowsGeoJSON,
  bearing,
  EMPTY_FEATURE_COLLECTION,
  TAWAF_PROGRESS_SOURCE,
  SAI_PROGRESS_SOURCE,
} from "@/lib/map/umrah-overlay";

// ---------------------------------------------------------------------------
// splitEllipseArcs - তওয়াফ রিংকে ৭ চাপে ভাগ
// ---------------------------------------------------------------------------

describe("splitEllipseArcs - উপবৃত্ত চাপ বিভাজন", () => {
  it("ঠিক `segments` সংখ্যক চাপ ফেরত দেয়", () => {
    const arcs = splitEllipseArcs([0, 0], 20, 18, 7);
    expect(arcs).toHaveLength(7);
  });

  it("প্রতিটি চাপে (ptsPerArc + 1)টি বিন্দু আছে", () => {
    const arcs = splitEllipseArcs([0, 0], 20, 18, 7, 0, 12);
    arcs.forEach((arc) => expect(arc).toHaveLength(13));
  });

  it("পাশাপাশি চাপ সংযুক্ত - একটি চাপের শেষ বিন্দু পরের চাপের প্রথম বিন্দুর সমান", () => {
    const arcs = splitEllipseArcs([0, 0], 20, 18, 7);
    for (let i = 0; i < arcs.length - 1; i++) {
      expect(arcs[i][arcs[i].length - 1]).toEqual(arcs[i + 1][0]);
    }
  });

  it("ঘড়ির বিপরীত দিকে চলে (পূর্ব থেকে উত্তরে) - তওয়াফের সঠিক দিক", () => {
    const arcs = splitEllipseArcs([0, 0], 20, 18, 7, 0, 12);
    const arc0 = arcs[0];
    // প্রথম বিন্দু কোণ ০ (পূর্ব, y≈০); দ্বিতীয় বিন্দু উত্তরে (y বাড়ে) = ঘড়ির বিপরীত
    expect(arc0[0][1]).toBeCloseTo(0, 10);
    expect(arc0[1][1]).toBeGreaterThan(arc0[0][1]);
  });
});

// ---------------------------------------------------------------------------
// splitLineSegments - সাঈ করিডোর বিভাজন
// ---------------------------------------------------------------------------

describe("splitLineSegments - রেখা বিভাজন", () => {
  const start = [0, 0] as [number, number];
  const end = [7, 0] as [number, number];

  it("ঠিক `segments` সংখ্যক ভাগ ফেরত দেয়", () => {
    expect(splitLineSegments(start, end, 7)).toHaveLength(7);
  });

  it("প্রথম ভাগ শুরু বিন্দু থেকে শুরু; শেষ ভাগ শেষ বিন্দুতে গিয়ে শেষ", () => {
    const arcs = splitLineSegments(start, end, 7);
    expect(arcs[0][0]).toEqual(start);
    expect(arcs[6][arcs[6].length - 1]).toEqual(end);
  });

  it("পাশাপাশি ভাগ সংযুক্ত", () => {
    const arcs = splitLineSegments(start, end, 7);
    for (let i = 0; i < arcs.length - 1; i++) {
      expect(arcs[i][arcs[i].length - 1]).toEqual(arcs[i + 1][0]);
    }
  });
});

// ---------------------------------------------------------------------------
// arcState - অবস্থা ট্যাগিং
// ---------------------------------------------------------------------------

describe("arcState - চাপের অবস্থা", () => {
  it("শুরুতে (current=1): প্রথমটি সক্রিয়, বাকি ভবিষ্যৎ", () => {
    expect(arcState(0, 1)).toBe("active");
    for (let i = 1; i < 7; i++) expect(arcState(i, 1)).toBe("future");
  });

  it("মাঝে (current=4): ০-২ সম্পন্ন, ৩ সক্রিয়, ৪-৬ ভবিষ্যৎ", () => {
    expect(arcState(0, 4)).toBe("completed");
    expect(arcState(2, 4)).toBe("completed");
    expect(arcState(3, 4)).toBe("active");
    expect(arcState(4, 4)).toBe("future");
    expect(arcState(6, 4)).toBe("future");
  });

  it("শেষে (current=7): ০-৫ সম্পন্ন, ৬ সক্রিয়", () => {
    for (let i = 0; i < 6; i++) expect(arcState(i, 7)).toBe("completed");
    expect(arcState(6, 7)).toBe("active");
  });

  it("সীমা বাইরের মান clamp করে (current<=0 => ১, current>max => max)", () => {
    expect(arcState(0, 0)).toBe("active");
    expect(arcState(0, -3)).toBe("active");
    // current>max কে max=7-এ clamp করে; তাই সর্বশেষ চাপ (index 6) সক্রিয়, ষষ্ঠ (index 5) সম্পন্ন
    expect(arcState(6, 99)).toBe("active");
    expect(arcState(5, 99)).toBe("completed");
  });
});

// ---------------------------------------------------------------------------
// buildTawafProgressGeoJSON / buildSaiProgressGeoJSON - সম্পূর্ণ ফিচার সেট
// ---------------------------------------------------------------------------

describe("buildTawafProgressGeoJSON - তওয়াফ অগ্রগতি", () => {
  it("৭টি LineString ফিচার, প্রতিটি state ও index ট্যাগসহ", () => {
    const fc = buildTawafProgressGeoJSON(3);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(7);
    fc.features.forEach((f, i) => {
      expect(f.geometry.type).toBe("LineString");
      expect(f.properties.index).toBe(i);
      expect(["completed", "active", "future"]).toContain(f.properties.state);
    });
  });

  it("current=3 হলে ঠিক একটি সক্রিয়, দুটি সম্পন্ন, চারটি ভবিষ্যৎ", () => {
    const states = buildTawafProgressGeoJSON(3).features.map((f) => f.properties.state);
    expect(states.filter((s) => s === "completed")).toHaveLength(2);
    expect(states.filter((s) => s === "active")).toHaveLength(1);
    expect(states.filter((s) => s === "future")).toHaveLength(4);
  });
});

describe("buildSaiProgressGeoJSON - সাঈ অগ্রগতি", () => {
  it("৭টি ফিচার এবং state ট্যাগ সঠিক", () => {
    const fc = buildSaiProgressGeoJSON(5);
    expect(fc.features).toHaveLength(7);
    const states = fc.features.map((f) => f.properties.state);
    // current=5 => ৪ সম্পন্ন, ১ সক্রিয়, ২ ভবিষ্যৎ
    expect(states.filter((s) => s === "completed")).toHaveLength(4);
    expect(states.filter((s) => s === "active")).toHaveLength(1);
    expect(states.filter((s) => s === "future")).toHaveLength(2);
  });

  it("সাফা (দক্ষিণ) থেকে মারওয়া (উত্তর-প্রান্ত) পর্যন্ত বিস্তৃত", () => {
    const fc = buildSaiProgressGeoJSON(1);
    const first = fc.features[0].geometry.coordinates[0];
    const last = fc.features[6].geometry.coordinates;
    const lastPt = last[last.length - 1];
    // সাফা lat ২১.৪২১৯..., মারওয়া lat ২১.৪২৫৩... (উত্তর দিকে বৃদ্ধি)
    expect(first[1]).toBeLessThan(lastPt[1]);
  });
});

// ---------------------------------------------------------------------------
// সোর্স আইডি স্থিতিশীলতা
// ---------------------------------------------------------------------------

describe("অগ্রগতি সোর্স আইডি", () => {
  it("তওয়াফ ও সাঈ সোর্স আইডি আলাদা ও স্থির", () => {
    expect(TAWAF_PROGRESS_SOURCE).not.toBe(SAI_PROGRESS_SOURCE);
    expect(TAWAF_PROGRESS_SOURCE).toContain("tawaf");
    expect(SAI_PROGRESS_SOURCE).toContain("sai");
  });

  it("EMPTY_FEATURE_COLLECTION খালি FeatureCollection", () => {
    expect(EMPTY_FEATURE_COLLECTION.type).toBe("FeatureCollection");
    expect(EMPTY_FEATURE_COLLECTION.features).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// drawingLap ট্যাগিং (অঙ্কন অ্যানিমেশনের সময় চাপ লুকানো)
// ---------------------------------------------------------------------------

describe("drawingLap - অঙ্কনরত চাপ লুকানো", () => {
  it("তওয়াফ: drawingLap চাপের state 'drawing' হয়, বাকিগুলো স্বাভাবিক", () => {
    const fc = buildTawafProgressGeoJSON(3, 7, 2);
    const states = fc.features.map((f) => f.properties.state);
    expect(states[2]).toBe("drawing");
    // বাকি চাপগুলো arcState অনুযায়ী (current=3: ০-১ সম্পন্ন, ৩-৬ ভবিষ্যৎ)
    expect(states[0]).toBe("completed");
    expect(states[1]).toBe("completed");
    expect(states[3]).toBe("future");
    expect(states[6]).toBe("future");
    // কোনো "active" থাকা উচিত নয় কারণ সক্রিয় চাপটিই drawingLap
    expect(states.filter((s) => s === "active")).toHaveLength(0);
  });

  it("drawingLap না দিলে কোনো 'drawing' state থাকে না", () => {
    const fc = buildTawafProgressGeoJSON(3);
    const states = fc.features.map((f) => f.properties.state);
    expect(states.filter((s) => s === "drawing")).toHaveLength(0);
    expect(states.filter((s) => s === "active")).toHaveLength(1);
  });

  it("সাঈ: drawingLap একইভাবে কাজ করে", () => {
    const fc = buildSaiProgressGeoJSON(5, 7, 3);
    expect(fc.features[3].properties.state).toBe("drawing");
    expect(fc.features[0].properties.state).toBe("completed");
  });
});

// ---------------------------------------------------------------------------
// getTawafLapCoords / getSaiLapCoords - অঙ্কন অ্যানিমেশনের ঘন স্থানাঙ্ক
// ---------------------------------------------------------------------------

describe("getTawafLapCoords - চাপের ঘন স্থানাঙ্ক", () => {
  it("যথেষ্ট ঘন (২৫টি বিন্দু) এবং পূর্ব দিক থেকে শুরু", () => {
    const coords = getTawafLapCoords(0);
    expect(coords.length).toBeGreaterThanOrEqual(20);
    // প্রথম বিন্দু কাবার পূর্বে (lng কেন্দ্রের চেয়ে বেশি), অক্ষাংশ কেন্দ্রের কাছে
    expect(coords[0][0]).toBeGreaterThan(39.8262);
    expect(Math.abs(coords[0][1] - 21.4225)).toBeLessThan(0.0001);
  });

  it("অগ্রগতি ঘড়ির বিপরীত দিকে (দ্বিতীয় বিন্দু উত্তরে)", () => {
    const coords = getTawafLapCoords(0);
    expect(coords[1][1]).toBeGreaterThan(coords[0][1]);
  });

  it("সীমা বাইরের সূচকে খালি অ্যারে", () => {
    expect(getTawafLapCoords(99)).toEqual([]);
  });
});

describe("getSaiLapCoords - সাঈ ভাগের ঘন স্থানাঙ্ক", () => {
  it("সাফা থেকে শুরু", () => {
    const coords = getSaiLapCoords(0);
    expect(coords.length).toBeGreaterThanOrEqual(10);
    expect(coords[0][0]).toBeCloseTo(39.8274, 4);
    expect(coords[0][1]).toBeCloseTo(21.4218, 4);
  });
});

// ---------------------------------------------------------------------------
// getTawafCircleCoords / getSaiCorridorCoords - পূর্ণ চক্কর/পাকের ঘন স্থানাঙ্ক
// ---------------------------------------------------------------------------

describe("getTawafCircleCoords - সম্পূর্ণ তওয়াফ বৃত্ত", () => {
  it("একটি বদ্ধ-মতো পূর্ণ বৃত্ত (ঘন পয়েন্ট)", () => {
    const coords = getTawafCircleCoords();
    expect(coords.length).toBeGreaterThanOrEqual(60);
    // শেষ বিন্দু প্রথম বিন্দুর কাছে (প্রায় বদ্ধ)
    const [f, l] = [coords[0], coords[coords.length - 1]];
    expect(Math.abs(f[0] - l[0])).toBeLessThan(0.00001);
    expect(Math.abs(f[1] - l[1])).toBeLessThan(0.00001);
  });

  it("ঘড়ির বিপরীত দিকে (পূর্ব থেকে উত্তরে)", () => {
    const coords = getTawafCircleCoords();
    expect(coords[1][1]).toBeGreaterThan(coords[0][1]);
  });
});

describe("getSaiCorridorCoords - সম্পূর্ণ সাঈ করিডোর", () => {
  it("safa-to-marwa: সাফা (দক্ষিণ) থেকে মারওয়া (উত্তর), বাঁকা পথ অনুসরণ করে", () => {
    const coords = getSaiCorridorCoords("safa-to-marwa");
    expect(coords.length).toBeGreaterThanOrEqual(20);
    // দক্ষিণ প্রান্ত (সাফা) থেকে উত্তর প্রান্ত (মারওয়া)
    expect(coords[0][1]).toBeLessThan(coords[coords.length - 1][1]);
    // মাঝের বিন্দু সরল রেখার চেয়ে পূর্বে - অর্থাৎ সরল রেখা নয়, পলিলাইন অনুসরণ করছে
    const midLng = coords[Math.floor(coords.length / 2)][0];
    const chordLng = (coords[0][0] + coords[coords.length - 1][0]) / 2;
    expect(midLng).toBeGreaterThan(chordLng);
  });

  it("marwa-to-safa: বিপরীত দিক (উত্তর থেকে দক্ষিণ)", () => {
    const fwd = getSaiCorridorCoords("safa-to-marwa");
    const rev = getSaiCorridorCoords("marwa-to-safa");
    expect(rev.length).toBe(fwd.length);
    // উত্তর প্রান্ত (মারওয়া) থেকে দক্ষিণ প্রান্ত (সাফা)
    expect(rev[0][1]).toBeGreaterThan(rev[rev.length - 1][1]);
    // শেষ বিন্দু সাফার কাছে (লুপ প্রায় বন্ধ - ফেরার পথের শেষ ≈ যাওয়ার পথের শুরু)
    expect(rev[rev.length - 1][1]).toBeCloseTo(fwd[0][1], 4);
  });
});

// ---------------------------------------------------------------------------
// bearing - ভৌগোলিক বিয়ারিং
// ---------------------------------------------------------------------------

describe("bearing - ভৌগোলিক বিয়ারিং", () => {
  const o: [number, number] = [0, 0];

  it("মূল দিক: উত্তর=০, পূর্ব=৯০, দক্ষিণ=১৮০, পশ্চিম=২৭০", () => {
    expect(bearing(o, [0, 0.001])).toBeCloseTo(0, 5); // north
    expect(bearing(o, [0.001, 0])).toBeCloseTo(90, 5); // east
    expect(bearing(o, [0, -0.001])).toBeCloseTo(180, 5); // south
    expect(bearing(o, [-0.001, 0])).toBeCloseTo(270, 5); // west
  });

  it("বিপরীতমুখী গন্তব্যে বিয়ারিং পার্থক্য ~১৮০°", () => {
    const a: [number, number] = [0, 0];
    const b: [number, number] = [0.001, 0];
    const fwd = bearing(a, b);
    const rev = bearing(b, a);
    const diff = Math.abs(fwd - rev);
    expect(Math.min(diff, 360 - diff)).toBeCloseTo(180, 5);
  });

  it("ফলাফল সর্বদা [০, ৩৬০) পরিসরে", () => {
    expect(bearing([0, 0], [0, 0.001])).toBeGreaterThanOrEqual(0);
    expect(bearing([0, 0], [0, 0.001])).toBeLessThan(360);
  });
});

// ---------------------------------------------------------------------------
// buildDirectionArrowsGeoJSON - দিকনির্দেশক চেভরন স্থাপন
// ---------------------------------------------------------------------------

describe("buildDirectionArrowsGeoJSON - দিকনির্দেশক তীর", () => {
  it("ঠিক count-টি Point ফিচার, seq ০..count-১, বৈধ bearing", () => {
    const ring = getTawafCircleCoords();
    const fc = buildDirectionArrowsGeoJSON(ring, 8, true);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(8);
    fc.features.forEach((f, i) => {
      expect(f.geometry.type).toBe("Point");
      expect(f.properties.seq).toBe(i);
      expect(typeof f.properties.bearing).toBe("number");
      expect(f.properties.bearing).toBeGreaterThanOrEqual(0);
      expect(f.properties.bearing).toBeLessThan(360);
    });
  });

  it("তওয়াফ: পূর্ব বিন্দুতে (seq ০) হাঁটার দিক উত্তর অভিমুখে (~০°) - ঘড়ির বিপরীত", () => {
    // getTawafCircleCoords পূর্ব (lng বেশি, lat কেন্দ্রে) থেকে ঘড়ির বিপরীতে (উত্তরে) যায়।
    const fc = buildDirectionArrowsGeoJSON(getTawafCircleCoords(), 8, true);
    const b0 = fc.features[0].properties.bearing as number;
    // ০° বা ৩৬০° কাছাকাছি (সামান্য নিচে/ওপরে নমনীয়তার পরিসর)
    const fromNorth = Math.min(b0, 360 - b0);
    expect(fromNorth).toBeLessThan(20);
  });

  it("সাঈ (খোলা পথ): প্রতিটি তীর বৈধ bearing পায় [০, ৩৬০)", () => {
    const fc = buildDirectionArrowsGeoJSON(getSaiCorridorCoords("safa-to-marwa"), 4, false);
    expect(fc.features).toHaveLength(4);
    fc.features.forEach((f) => {
      const b = f.properties.bearing as number;
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
      expect(Number.isNaN(b)).toBe(false);
    });
  });

  it("সাঈ: সাফা→মারওয়া মোট দিশা উত্তরাভিমুখী (সাফা দক্ষিণ, মারওয়া উত্তর)", () => {
    // সাফার ক্যাপে স্থানীয় স্পর্শক দক্ষিণমুখী হতে পারে, তাই মোট সরণের দিশা দেখি।
    const coords = getSaiCorridorCoords("safa-to-marwa");
    const b = bearing(coords[0] as [number, number], coords[coords.length - 1] as [number, number]);
    expect(Math.min(b, 360 - b)).toBeLessThan(20);
  });

  it("পথ উল্টালে মোট দিশাও উল্টে যায় (মারওয়া→সাফা ~১৮০°)", () => {
    const fwd = getSaiCorridorCoords("safa-to-marwa");
    const rev = getSaiCorridorCoords("marwa-to-safa");
    const fb = bearing(fwd[0] as [number, number], fwd[fwd.length - 1] as [number, number]);
    const rb = bearing(rev[0] as [number, number], rev[rev.length - 1] as [number, number]);
    const diff = Math.abs(fb - rb);
    expect(Math.min(diff, 360 - diff)).toBeCloseTo(180, 0);
  });

  it("বদ্ধ বৃত্তে শেষ চেভরনটিও বৈধ bearing পায় (সীম মোড়ানো)", () => {
    const fc = buildDirectionArrowsGeoJSON(getTawafCircleCoords(), 10, true);
    const last = fc.features[9].properties.bearing as number;
    expect(last).toBeGreaterThanOrEqual(0);
    expect(last).toBeLessThan(360);
    // সংখ্যাত্মক নয় (NaN নয়)
    expect(Number.isNaN(last)).toBe(false);
  });

  it("অবৈধ ইনপুটে খালি FeatureCollection", () => {
    expect(buildDirectionArrowsGeoJSON([], 5, true).features).toHaveLength(0);
    expect(buildDirectionArrowsGeoJSON([[0, 0]], 5, true).features).toHaveLength(0);
    expect(buildDirectionArrowsGeoJSON(getTawafCircleCoords(), 0, true).features).toHaveLength(0);
  });
});
