"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * হালকা অফলাইন সূচক (পরিকল্পনা ৫.৭)
 *
 * ওমরাহ গাইডের সমস্ত বিষয়বস্তু স্থিরভাবে বান্ডেল করা, তাই ইন্টারনেট ছাড়াই কাজ করে।
 * এই ব্যাজ `navigator.onLine` ও online/offline ইভেন্ট অনুসরণ করে বর্তমান অবস্থা দেখায়।
 * কোনো সার্ভিস ওয়ার্কার বা নতুন নির্ভরতা নেই।
 */
export function OfflineBadge() {
  // SSR-নিরাপদ ডিফল্ট; ক্লায়েন্টে mount হলে আসল মান বসবে
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <span
      title="গাইডের সমস্ত বিষয়বস্তু ডিভাইসে সংরক্ষিত — ইন্টারনেট ছাড়াই কাজ করে।"
      className={cn(
        "flex items-center gap-1 text-[10px] px-1.5 py-1 rounded-md transition-colors select-none",
        online ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/15 text-amber-300"
      )}
    >
      {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      <span className="hidden sm:inline whitespace-nowrap">
        {online ? "অনলাইন" : "অফলাইন — গাইড চলবে"}
      </span>
    </span>
  );
}
