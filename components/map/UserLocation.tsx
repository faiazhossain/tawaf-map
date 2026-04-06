"use client";

import { useGeolocation } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Navigation, NavigationOff } from "lucide-react";

interface UserLocationProps {
  onRequestLocation?: () => void;
}

export function UserLocation({ onRequestLocation }: UserLocationProps) {
  const { latitude, longitude, accuracy, error, loading, permission, requestLocation } =
    useGeolocation();

  const handleRequestLocation = () => {
    if (onRequestLocation) {
      onRequestLocation();
    } else {
      requestLocation();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-lg">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400 hidden sm:inline">লোকেশন নেওয়া হচ্ছে...</span>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 rounded-xl shadow-lg">
        <NavigationOff className="w-4 h-4 text-rose-400" />
        <span className="text-sm text-rose-400 hidden sm:inline">লোকেশন বন্ধ</span>
      </div>
    );
  }

  if (error && !latitude) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-lg">
        <NavigationOff className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-500 hidden sm:inline">{error}</span>
      </div>
    );
  }

  if (latitude && longitude) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-xl shadow-lg">
        <div className="relative">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-xs text-emerald-600 dark:text-emerald-400">আপনার লোকেশন</span>
          {accuracy && <span className="text-[10px] text-slate-500">±{Math.round(accuracy)}m</span>}
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleRequestLocation}
      variant="outline"
      size="sm"
      className="gap-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white"
    >
      <Navigation className="w-4 h-4" />
      <span className="hidden sm:inline">লোকেশন চালু করুন</span>
    </Button>
  );
}
