"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dua } from "@/types/umrah";

/**
 * দোয়া অডিও প্লেয়ার — "শুনুন" মোড (পরিকল্পনা ৫.৫ ও ৬-এর অডিও ধাপ)
 *
 * শুধুমাত্র তখনই রেন্ডার হয় যখন দোয়ার `audio` ফিল্ডে কোনো সম্পদের পথ থাকে
 * (`/public/audio/...`)। বাংলা তেলাওয়াত থাকলে সেটিই, নাহলে আরবি বাজবে।
 *
 * দ্রষ্টব্য: এখন পর্যন্ত কোনো দোয়ায় অডিও সম্পদ নেই, তাই এই উপাদানটি লুকানো থাকে।
 * `/public/audio/`-এ রেকর্ডিং রেখে দোয়ার `audio` ফিল্ড সেট করলেই "শুনুন" বোতাম আসবে।
 */
export function DuaAudioPlayer({ dua }: { dua: Dua }) {
  const src = dua.audio?.bn ?? dua.audio?.ar;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    el.addEventListener("ended", onEnd);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  if (!src) return null;

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md transition-colors",
          playing
            ? "bg-primary text-primary-foreground"
            : "bg-primary/15 text-primary hover:bg-primary/25"
        )}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        শুনুন
      </button>
      <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
      <audio ref={audioRef} src={src} preload="none" />
    </div>
  );
}
