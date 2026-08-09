"use client";

import { Luggage, Droplets, BookOpenCheck, ExternalLink } from "lucide-react";

/**
 * বাস্তবমুখী প্রস্থান-রিমাইন্ডার (পরিকল্পনা ৬.৬)
 *
 * "সম্পন্ন" ধাপে দেখায়: বিদায় তওয়াফ (হজ্বে আবশ্যক; ওমরাহতে নয়), যমযম পান, চলার আগে
 * ২ রাকাআত ইত্যাদি — বিমানের তাড়ায় জরুরি আমল বাদ না যাওয়ার সতর্কতা।
 */
const REMINDERS = [
  {
    icon: Luggage,
    bn: "বিদায় তওয়াফ: ওমরাহর ক্ষেত্রে এটি ফরজ নয় (অধিকাংশ মতে), তবে হজ্বের পর আবশ্যক। থাকলে বিমানের তাড়ায় দেরি করবেন না।",
  },
  {
    icon: Droplets,
    bn: "বের হওয়ার আগে যমযম পান করে নিন এবং সম্ভব হলে সাথে কিছুটা নিন।",
  },
  {
    icon: BookOpenCheck,
    bn: "মসজিদ ত্যাগের আগে ২ রাকাআত তাহিয়্যাতুল মসজিদ/অন্য কোনো নামাজ আদায় করুন।",
  },
];

export function PragmaticReminders() {
  return (
    <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 px-3 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Luggage className="w-4 h-4 text-teal-400" />
        <p className="text-xs font-medium text-slate-200">মক্কা ত্যাগের আগে মনে রাখুন</p>
      </div>
      <ul className="space-y-1.5">
        {REMINDERS.map((r, i) => {
          const Icon = r.icon;
          return (
            <li key={i} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
              <Icon className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
              <span>{r.bn}</span>
            </li>
          );
        })}
      </ul>
      <a
        href="https://www.nusuk.sa/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300"
      >
        <ExternalLink className="w-3 h-3" /> বর্তমান সৌদি নিয়ম/ভিসার জন্য Nusuk
      </a>
    </div>
  );
}
