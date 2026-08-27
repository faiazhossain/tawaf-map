"use client";

import { Button } from "@/components/ui/button";
import { Navigation, NavigationOff } from "lucide-react";

export interface UserLocationProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permission: "granted" | "denied" | "prompt" | "unknown";
  onRequestLocation: () => void;
  /**
   * UX-001: denied অবস্থায় নীরব পিলের বদলে ট্যাপযোগ্য — রিকভারি শীট খোলে
   * (ব্রাউজার-সেটিংস নির্দেশনা + retry)। না দিলে আগের মতো onRequestLocation।
   */
  onExplainDenied?: () => void;
}

/**
 * লোকেশন স্ট্যাটাস ইন্ডিকেটর — সম্পূর্ণ প্রেজেন্টেশনাল।
 *
 * GPS ওয়াচের মালিকানা এই কম্পোনেন্টে নেই (আগে ছিল): মোবাইলে এটি হ্যামবার্গার
 * মেনুর ভেতরে শুধু মেনু খোলা থাকলে মাউন্ট হয়, ফলে মেনু বন্ধ থাকলে ওয়াচটি
 * বন্ধ হয়ে যেত — ইউজার ডট, কাছাকাছি গেট প্যানেল, ডেমো-ওয়ার্ল্ড সবই নীরবে
 * অকেজো হতো। এখন useGeolocation() পেজ লেভেলে একবারই চলে; এই কম্পোনেন্ট
 * শুধু স্টোরের অবস্থা দেখায় ও রিকোয়েস্ট ফরোয়ার্ড করে।
 */
export function UserLocation({
  latitude,
  longitude,
  accuracy,
  error,
  loading,
  permission,
  onRequestLocation,
  onExplainDenied,
}: UserLocationProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-surface/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground hidden sm:inline">
          লোকেশন নেওয়া হচ্ছে...
        </span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      // UX-001: passive pill → actionable; taps open the recovery guidance.
      <button
        type="button"
        onClick={onExplainDenied ?? onRequestLocation}
        aria-label="লোকেশন বন্ধ — সমাধান দেখুন"
        data-testid="user-location-denied"
        className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 rounded-xl shadow-lg cursor-pointer transition-colors hover:bg-rose-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <NavigationOff className="w-4 h-4 text-rose-400" />
        <span className="text-sm text-rose-400 hidden sm:inline">লোকেশন বন্ধ</span>
      </button>
    );
  }

  if (error && !latitude) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-surface/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg">
        <NavigationOff className="w-4 h-4 shrink-0 text-muted-foreground" />
        {/* মোবাইলেও দেখা যায় — GPS ব্যর্থ হলে ইঙ্গিতটুকু প্রয়োজন। */}
        <span className="text-xs sm:text-sm text-muted-foreground leading-snug">{error}</span>
      </div>
    );
  }

  if (latitude && longitude) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-primary-soft backdrop-blur-xl border border-primary/20 rounded-xl shadow-lg">
        <div className="relative">
          <Navigation className="w-4 h-4 text-primary" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-ping" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-xs text-primary dark:text-primary">আপনার লোকেশন</span>
          {accuracy && (
            <span className="text-[10px] text-muted-foreground">±{Math.round(accuracy)}m</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={onRequestLocation}
      variant="outline"
      size="sm"
      className="gap-2 border-border bg-surface/50 hover:bg-muted text-foreground hover:text-foreground"
    >
      <Navigation className="w-4 h-4" />
      <span className="hidden sm:inline">লোকেশন চালু করুন</span>
    </Button>
  );
}
