import { describe, it, expect } from "vitest";
import { UMRAH_ANCHORS, getAnchorById } from "@/lib/data/umrah/anchors";
import { UMRAH_DUAS, getDuasByIds } from "@/lib/data/umrah/duas";
import { UMRAH_STEPS, getStepById } from "@/lib/data/umrah/steps";
import { UMRAH_MISTAKES, getMistakeById } from "@/lib/data/umrah/mistakes";
import {
  MIQAT_POINTS,
  TRAVEL_PATH_MIQAT,
  resolveMiqatForTravelPath,
  miqatRingBounds,
  AIR_IHRAM_CHECKLIST,
} from "@/lib/data/umrah/miqat";
import type { TravelPath } from "@/types/umrah";

/**
 * বিষয়বস্তু যাচাই - পরিকল্পনা ধারা ৯ (testing) এর "content review" চেক:
 * প্রতিটি ধাপ/দোয়া/ভুল/অ্যাংকর/মিকাত অন্তত একটি sourceRef বহন করবে।
 * এছাড়া id সমূহ অদ্বিতীয় ও রেফারেন্স সমূহ সামঞ্জস্যপূর্ণ।
 */

describe("UMRAH_ANCHORS - বিষয়বস্তু অখণ্ডতা", () => {
  it("প্রতিটি অ্যাংকরে অন্তত একটি sourceRef থাকে", () => {
    for (const anchor of UMRAH_ANCHORS) {
      expect(anchor.sourceRefs.length, `anchor "${anchor.id}"`).toBeGreaterThan(0);
    }
  });

  it("প্রতিটি অ্যাংকরে বাংলা ও ইংরেজি নাম অ-খালি", () => {
    for (const anchor of UMRAH_ANCHORS) {
      expect(anchor.name.bn.trim().length, `anchor "${anchor.id}" bn name`).toBeGreaterThan(0);
      expect(anchor.name.en.trim().length, `anchor "${anchor.id}" en name`).toBeGreaterThan(0);
    }
  });

  it("সকল anchor id অদ্বিতীয়", () => {
    const ids = UMRAH_ANCHORS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("প্রতিটি অ্যাংকরে বৈধ [lng, lat] স্থানাঙ্ক আছে", () => {
    for (const anchor of UMRAH_ANCHORS) {
      const [lng, lat] = anchor.location.coordinates;
      expect(lng).toBeGreaterThan(-180);
      expect(lng).toBeLessThan(180);
      expect(lat).toBeGreaterThan(-90);
      expect(lat).toBeLessThan(90);
    }
  });
});

describe("UMRAH_DUAS - বিষয়বস্তু অখণ্ডতা", () => {
  it("প্রতিটি দোয়ায় অন্তত একটি sourceRef আছে", () => {
    for (const dua of UMRAH_DUAS) {
      expect(dua.sourceRefs.length, `dua "${dua.id}"`).toBeGreaterThan(0);
    }
  });

  it("প্রতিটি দোয়ায় আরবি, বাংলা অনুবাদ ও 'কখন পড়বেন' অ-খালি", () => {
    for (const dua of UMRAH_DUAS) {
      expect(dua.arabic.trim().length, `dua "${dua.id}" arabic`).toBeGreaterThan(0);
      expect(dua.translationBn.trim().length, `dua "${dua.id}" translationBn`).toBeGreaterThan(0);
      expect(dua.whenToRecite.bn.trim().length, `dua "${dua.id}" whenToRecite.bn`).toBeGreaterThan(
        0
      );
    }
  });

  it("সকল dua id অদ্বিতীয়", () => {
    const ids = UMRAH_DUAS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getDuasByIds ক্রম বজায় রাখে ও শুধু বৈধ দোয়া ফেরত দেয়", () => {
    const known = UMRAH_DUAS.slice(0, 2).map((d) => d.id);
    const result = getDuasByIds([known[1], "does-not-exist", known[0]]);
    expect(result.map((d) => d.id)).toEqual([known[1], known[0]]);
  });
});

describe("UMRAH_STEPS - বিষয়বস্তু অখণ্ডতা", () => {
  it("প্রতিটি ধাপে অন্তত একটি sourceRef আছে", () => {
    for (const step of UMRAH_STEPS) {
      expect(step.sourceRefs.length, `step "${step.id}"`).toBeGreaterThan(0);
    }
  });

  it("সকল step id অদ্বিতীয়", () => {
    const ids = UMRAH_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ধাপসমূহ order অনুসারে সাজানো", () => {
    const orders = UMRAH_STEPS.map((s) => s.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("প্রতিটি ধাপে বাংলা whatToDo অ-খালি", () => {
    for (const step of UMRAH_STEPS) {
      expect(step.whatToDo.bn.trim().length, `step "${step.id}" whatToDo.bn`).toBeGreaterThan(0);
    }
  });

  it("কাউন্টার ধাপগুলোতে বৈধ min/max ও perRoundTips আছে", () => {
    const counterSteps = UMRAH_STEPS.filter((s) => s.counter);
    expect(counterSteps.length).toBeGreaterThanOrEqual(2); // tawaf + sai
    for (const step of counterSteps) {
      const c = step.counter!;
      expect(c.max, `step "${step.id}" counter.max`).toBeGreaterThanOrEqual(c.min);
      expect(c.max, `step "${step.id}" counter.max`).toBeGreaterThan(0);
      if (c.perRoundTips) {
        expect(c.perRoundTips.length, `step "${step.id}" perRoundTips`).toBe(c.max);
      }
    }
  });

  it("তওয়াফ ও সাঈ ধাপ counter-max এ সম্পন্ন হয়", () => {
    const tawaf = getStepById("tawaf");
    const sai = getStepById("sai");
    expect(tawaf?.isCompleteWhen).toBe("counter-max");
    expect(sai?.isCompleteWhen).toBe("counter-max");
    expect(tawaf?.counter?.max).toBe(7);
    expect(sai?.counter?.max).toBe(7);
  });

  it("ধাপে রেফারেন্সকৃত অ্যাংকর সমূহ বিদ্যমান", () => {
    const anchorIds = new Set(UMRAH_ANCHORS.map((a) => a.id));
    for (const step of UMRAH_STEPS) {
      for (const anchorId of step.anchors ?? []) {
        expect(anchorIds.has(anchorId), `step "${step.id}" -> anchor "${anchorId}"`).toBe(true);
      }
    }
  });

  it("ধাপে রেফারেন্সকৃত দোয়া সমূহ বিদ্যমান", () => {
    const duaIds = new Set(UMRAH_DUAS.map((d) => d.id));
    for (const step of UMRAH_STEPS) {
      for (const duaId of step.duas ?? []) {
        expect(duaIds.has(duaId), `step "${step.id}" -> dua "${duaId}"`).toBe(true);
      }
    }
  });

  it("ধাপে রেফারেন্সকৃত ভুল সমূহ বিদ্যমান", () => {
    const mistakeIds = new Set(UMRAH_MISTAKES.map((m) => m.id));
    for (const step of UMRAH_STEPS) {
      for (const mistakeId of step.commonMistakes ?? []) {
        expect(mistakeIds.has(mistakeId), `step "${step.id}" -> mistake "${mistakeId}"`).toBe(true);
      }
    }
  });

  it("প্রতিটি gender ফিল্টার বৈধ মান", () => {
    const valid = new Set(["all", "male", "female"]);
    for (const step of UMRAH_STEPS) {
      expect(valid.has(step.gender), `step "${step.id}" gender`).toBe(true);
    }
  });
});

describe("UMRAH_MISTAKES - সিদ্ধান্ত বৃক্ষ অখণ্ডতা", () => {
  it("প্রতিটি ভুল-নোডে অন্তত একটি sourceRef আছে", () => {
    for (const mistake of UMRAH_MISTAKES) {
      expect(mistake.sourceRefs.length, `mistake "${mistake.id}"`).toBeGreaterThan(0);
    }
  });

  it("সকল mistake id অদ্বিতীয়", () => {
    const ids = UMRAH_MISTAKES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("প্রতিটি নোড হয় শাখা বা ফলাফল বহন করে", () => {
    for (const mistake of UMRAH_MISTAKES) {
      const hasBranches = !!mistake.branches && mistake.branches.length > 0;
      const hasOutcome = !!mistake.outcome;
      expect(hasBranches || hasOutcome, `mistake "${mistake.id}" has neither`).toBe(true);
    }
  });

  it("প্রতিটি শাখা-নোডের nextId বিদ্যমান নোডে নির্দেশ করে", () => {
    const ids = new Set(UMRAH_MISTAKES.map((m) => m.id));
    for (const mistake of UMRAH_MISTAKES) {
      for (const branch of mistake.branches ?? []) {
        expect(ids.has(branch.nextId), `mistake "${mistake.id}" -> branch "${branch.nextId}"`).toBe(
          true
        );
      }
    }
  });

  it("ফলাফল-নোডগুলোতে বৈধতা ও কর্ম অ-খালি, expiation বৈধ মান", () => {
    const validExpiations = new Set([
      "none",
      "sadaqah",
      "dam",
      "takhyir",
      "tartib",
      "qada-plus-dam",
      "see-scholar",
      undefined,
    ]);
    const validValidity = new Set(["valid", "invalid", "depends"]);
    for (const mistake of UMRAH_MISTAKES) {
      if (mistake.outcome) {
        expect(
          mistake.outcome.action.bn.trim().length,
          `mistake "${mistake.id}" action.bn`
        ).toBeGreaterThan(0);
        expect(validValidity.has(mistake.outcome.valid), `mistake "${mistake.id}" valid`).toBe(
          true
        );
        expect(
          validExpiations.has(mistake.outcome.expiation),
          `mistake "${mistake.id}" expiation`
        ).toBe(true);
      }
    }
  });

  it("টার্মিনাল ফলাফল নোডে আর শাখা নেই", () => {
    for (const mistake of UMRAH_MISTAKES) {
      if (mistake.outcome) {
        expect(mistake.branches ?? []).toHaveLength(0);
      }
    }
  });

  it("যোগাযোগের সব মিসটেক রেফারেন্স সমাধানযোগ্য", () => {
    // steps-এ commonMistakes এ referenced id গুলো getMistakeById দিয়ে পাওয়া যায়
    for (const step of UMRAH_STEPS) {
      for (const mId of step.commonMistakes ?? []) {
        expect(getMistakeById(mId), `getMistakeById("${mId}")`).toBeDefined();
      }
    }
  });
});

describe("MIQAT - ইঞ্জিন যাচাই", () => {
  it("প্রতিটি মিকাতে sourceRef আছে", () => {
    for (const miqat of MIQAT_POINTS) {
      expect(miqat.sourceRefs.length, `miqat "${miqat.id}"`).toBeGreaterThan(0);
    }
  });

  it("সকল miqat id অদ্বিতীয়", () => {
    const ids = MIQAT_POINTS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("প্রতিটি TravelPath এর জন্য এন্ট্রি আছে", () => {
    const paths: TravelPath[] = [
      "air-dhaka-jeddah",
      "via-madinah",
      "already-in-makkah",
      "already-in-jeddah",
      "other",
    ];
    const covered = new Set(TRAVEL_PATH_MIQAT.map((t) => t.travelPath));
    for (const p of paths) {
      expect(covered.has(p), `travelPath "${p}"`).toBe(true);
    }
  });

  it("resolveMiqatForTravelPath সর্বদা একটি এন্ট্রি ফেরত দেয়", () => {
    const paths: TravelPath[] = [
      "air-dhaka-jeddah",
      "via-madinah",
      "already-in-makkah",
      "already-in-jeddah",
      "other",
    ];
    for (const p of paths) {
      const resolved = resolveMiqatForTravelPath(p);
      expect(resolved, `resolveMiqatForTravelPath("${p}")`).toBeDefined();
      expect(resolved.travelPath).toBe(p);
    }
  });

  it("non-null miqatId গুলো বিদ্যমান মিকাতে নির্দেশ করে", () => {
    const miqatIds = new Set(MIQAT_POINTS.map((m) => m.id));
    for (const entry of TRAVEL_PATH_MIQAT) {
      if (entry.miqatId !== null) {
        expect(
          miqatIds.has(entry.miqatId),
          `travelPath "${entry.travelPath}" -> miqat "${entry.miqatId}"`
        ).toBe(true);
      }
    }
  });

  it("ঢাকা-জেদ্দা বিমান পথে ইহরাম-সম্পর্কিত সতর্কতা আছে", () => {
    const air = resolveMiqatForTravelPath("air-dhaka-jeddah");
    expect(air.warning?.bn).toBeTruthy();
    expect(air.miqatId).toBe("yalamlam");
  });
});

describe("মিকাত সারসংক্ষেপ সহায়ক - miqatRingBounds ও AIR_IHRAM_CHECKLIST", () => {
  it("miqatRingBounds সমস্ত মিকাতকে ঘিরে বৈধ SW/NE বাউন্ডস দেয়", () => {
    const [[swLng, swLat], [neLng, neLat]] = miqatRingBounds();
    // SW অবশ্যই NE এর চেয়ে ছোট হবে
    expect(swLng).toBeLessThan(neLng);
    expect(swLat).toBeLessThan(neLat);
    // মক্কার আশেপাশের যুক্তিযুক্ত পরিসর (~38–41 lng, ~21–25 lat)
    expect(swLng).toBeGreaterThan(38);
    expect(neLng).toBeLessThan(41);
    expect(swLat).toBeGreaterThan(20);
    expect(neLat).toBeLessThan(25);
  });

  it("miqatRingBounds-এর ভেতরে সমস্ত মিকাত পয়েন্ট পড়ে", () => {
    const [[swLng, swLat], [neLng, neLat]] = miqatRingBounds();
    for (const m of MIQAT_POINTS) {
      const [lng, lat] = m.location.coordinates;
      expect(lng, `miqat "${m.id}" lng`).toBeGreaterThanOrEqual(swLng);
      expect(lng, `miqat "${m.id}" lng`).toBeLessThanOrEqual(neLng);
      expect(lat, `miqat "${m.id}" lat`).toBeGreaterThanOrEqual(swLat);
      expect(lat, `miqat "${m.id}" lat`).toBeLessThanOrEqual(neLat);
    }
  });

  it("AIR_IHRAM_CHECKLIST অ-খালি এবং প্রতিটি আইটেমে বাংলা ও ইংরেজি আছে", () => {
    expect(AIR_IHRAM_CHECKLIST.length).toBeGreaterThan(0);
    for (const item of AIR_IHRAM_CHECKLIST) {
      expect(item.bn.trim().length, "checklist item bn").toBeGreaterThan(0);
      expect(item.en.trim().length, "checklist item en").toBeGreaterThan(0);
    }
  });
});
