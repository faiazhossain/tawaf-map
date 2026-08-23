/**
 * গেট অনুসন্ধান সহায়ক (GateSelector-এর সার্চবক্স)
 *
 * ডেটাসেটে নাম একাধিক লিপিতে থাকে — বাংলা `name`, আরবি `nameAr`, লাতিন
 * `nameEn` — এবং গেট-সংখ্যা বাংলা অঙ্কে ("গেট ৯০")। তাই কোয়েরি ও নাম
 * দুটোকেই একই ক্যাননিকাল রূপে নামিয়ে মেলানো হয়: ছোট-হাতের, বাংলা অঙ্ক
 * লাতিন অঙ্কে, ফাঁকা-স্বাভাবিক — যাতে "90" ↔ "৯০" এবং "FAHD" ↔ "fahd" মেলে।
 */

import type { Gate } from "@/types/gate";

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

/** সার্চ-ম্যাচিংয়ের জন্য টেক্সট ক্যাননিকালাইজ করে। */
export function normalizeGateText(value: string): string {
  return value
    .replace(/[০-৯]/g, (d) => String(BENGALI_DIGITS.indexOf(d)))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** কোয়েরির সাথে মানানসই গেট ফেরত দেয়; খালি কোয়েরিতে পুরো তালিকা। */
export function filterGatesByQuery(gates: Gate[], query: string): Gate[] {
  const q = normalizeGateText(query ?? "");
  if (!q) return gates;
  return gates.filter((gate) =>
    [gate.name, gate.nameBn, gate.nameAr, gate.nameEn]
      .filter((field): field is string => typeof field === "string" && field.length > 0)
      .some((field) => normalizeGateText(field).includes(q))
  );
}
