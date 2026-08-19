"use client";

import Image from "next/image";

/**
 * বারিকই অ্যাট্রিবিউশন — মানচিত্রের নিচের বাম কোণে ছোট লোগো, ট্যাপে barikoi.com
 * (নতুন ট্যাবে)। MapLibre-এর AttributionControl বন্ধ থাকে, তাই টাইল সরবরাহকারীর
 * এই নির্দেশই কৃতজ্ঞতাস্বরূপ।
 *
 * বিন্যাস-চুক্তি: NearbyChipBar মোবাইলে ml-16 (64px) দিয়ে এই কোণটি খালি রাখে —
 * লোগোর প্রস্থ (left-3 + 56px) বদলালে ওই মার্জিনও বদলাতে হবে।
 */
export function BarikoiAttribution() {
  return (
    <a
      href="https://www.barikoi.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="বারিকই — মানচিত্রের তথ্য সরবরাহকারী"
      data-testid="barikoi-attribution"
      className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] left-3 z-[40] flex h-11 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]"
    >
      <Image
        src="/images/tourist-places/barikoi_logo.svg"
        alt="Barikoi"
        width={56}
        height={16}
        // SVG next/image অপ্টিমাইজারের ভেতর দিয়ে যায় না — যেমনটা আছে তেমনই দেখাও
        unoptimized
        className="h-4 w-auto"
      />
    </a>
  );
}
