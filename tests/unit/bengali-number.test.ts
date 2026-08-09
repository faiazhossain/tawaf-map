import { describe, it, expect } from "vitest";
import { toBengaliNumber } from "@/lib/utils/bengali-number";

describe("toBengaliNumber - বাংলা সংখ্যা রূপান্তর", () => {
  it("একক অঙ্ক রূপান্তর করে", () => {
    expect(toBengaliNumber(0)).toBe("০");
    expect(toBengaliNumber(3)).toBe("৩");
    expect(toBengaliNumber(7)).toBe("৭");
    expect(toBengaliNumber(9)).toBe("৯");
  });

  it("বহুঅঙ্ক সংখ্যা রূপান্তর করে", () => {
    expect(toBengaliNumber(10)).toBe("১০");
    expect(toBengaliNumber(365)).toBe("৩৬৫");
    expect(toBengaliNumber(7)).toBe("৭");
  });

  it("তওয়াফ/সাঈ কাউন্টার ফরম্যাট (N / ৭)", () => {
    expect(toBengaliNumber(1)).toBe("১");
    expect(toBengaliNumber(7)).toBe("৭");
    expect(`${toBengaliNumber(3)} / ${toBengaliNumber(7)}`).toBe("৩ / ৭");
  });

  it("চিহ্ন ও দশমিক অপরিবর্তিত রাখে", () => {
    expect(toBengaliNumber(-5)).toBe("-৫");
    expect(toBengaliNumber(2.5)).toBe("২.৫");
  });

  it("সংখ্যাহীন ইনপুটে কিছু বদলায় না", () => {
    // String(value) সবসময় অঙ্ক ধারণ করে না; এখানে শুধু নিরাপত্তা যাচাই।
    expect(toBengaliNumber(NaN)).toBe("NaN");
  });
});
