"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapStore, useGateStore } from "@/lib/store";
import { getActiveGates } from "@/lib/gates/active";
import { filterGatesByQuery } from "@/lib/gates/search";
import { Search, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GateSelectorProps {
  /** লেবেল বাধ্যতামূলক দেখাও (মোবাইল মেনুতে); ডিফল্টে শুধু >=sm-এ দেখায়। */
  showLabel?: boolean;
  /**
   * গেট বাছাই হলে ডাকা হয় — ইনফো প্যানেল খোলা ইত্যাদি পৃষ্ঠার দায়িত্ব
   * (মানচিত্রের মার্কার ক্লিকের মতো একই পথ)। না দিলে শুধু স্টোরে সেট হয়।
   */
  onSelectGate?: (gateId: string) => void;
}

const DROPDOWN_GAP = 8;
const VIEWPORT_PAD = 12;
// হেডার (~৭০px) + তালিকা (max-h-72 = ২৮৮px) + লেজেন্ড ফুটার (~৪৫px) — ফ্লিপ-সিদ্ধান্তের আনুমানিক উচ্চতা।
const APPROX_DROPDOWN_HEIGHT = 420;
const DROPDOWN_WIDTH_SM = 384;
const DROPDOWN_WIDTH_BASE = 320;

export function GateSelector({ showLabel = false, onSelectGate }: GateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  // Selector-sliced: a whole-store subscription here re-rendered the selector
  // on every per-frame center/zoom write from MapView's move handlers.
  const flyTo = useMapStore((state) => state.flyTo);
  const { setGate, selectedGate } = useGateStore();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const filteredGates = filterGatesByQuery(getActiveGates(), searchQuery);

  // Portal শুধুমাত্র ক্লায়েন্টে (SSR-এ document নেই)।
  useEffect(() => {
    setMounted(true);
  }, []);

  // ড্রপডাউন ও ব্যাকড্রপ document.body-তে portal করা হয়, কারণ টুলবারের
  // overflow-x-auto (ডেস্কটপ) ও হ্যামবার্গার মেনুর overflow-y-auto (মোবাইল)
  // কন্টেইনার ভেতরের absolute ড্রপডাউনকে ক্লিপ করে ফেলত — ফলাফল তালিকা
  // দেখাই যেত না, শুধু ঝাপসা ব্যাকড্রপ দেখা যেত। Portal + fixed অবস্থান
  // বোতামের rect থেকে হিসাব করা হয় (নিচে, জায়গা না থাকলে উপরে) এবং
  // স্ক্রল/রিসাইজে বোতামের সাথে লেগে থাকে।
  useEffect(() => {
    if (!isOpen) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(
        window.innerWidth >= 640 ? DROPDOWN_WIDTH_SM : DROPDOWN_WIDTH_BASE,
        window.innerWidth - 2 * VIEWPORT_PAD
      );

      let top = rect.bottom + DROPDOWN_GAP;
      if (top + APPROX_DROPDOWN_HEIGHT > window.innerHeight - VIEWPORT_PAD) {
        top = Math.max(VIEWPORT_PAD, rect.top - DROPDOWN_GAP - APPROX_DROPDOWN_HEIGHT);
      }

      // বোতানের ডান ধারের সাথে সারিবদ্ধ (আগের right-0 অ্যাঙ্করিং); বামে ক্ল্যাম্প।
      let left = rect.right - width;
      left = Math.min(left, window.innerWidth - VIEWPORT_PAD - width);
      left = Math.max(VIEWPORT_PAD, left);

      setCoords({ top, left, width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isOpen]);

  // Escape-এ ড্রপডাউন বন্ধ।
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleSelectGate = (gateId: string) => {
    const gate = getActiveGates().find((g) => g.id === gateId);
    if (gate) {
      // হ্যান্ডলার থাকলে নির্বাচন পৃষ্ঠায় গিয়ে প্যানেলসহ খোলে (মার্কার ক্লিকের
      // মতো); না থাকলে সরাসরি স্টোরে সেট হয়।
      if (onSelectGate) {
        onSelectGate(gate.id);
      } else {
        setGate(gate);
      }
      flyTo(gate.location.coordinates);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const typeConfig = {
    king_fahd: { color: "bg-blue-500", label: "কিং ফাহ্দ" },
    umrah: { color: "bg-primary", label: "ওমরাহ" },
    salah: { color: "bg-amber-500", label: "নামাজ" },
  };

  return (
    <div>
      <Button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        aria-label="গেট খুঁজুন"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          "gap-2 transition-all duration-200",
          "border-border bg-surface/50 hover:bg-muted text-foreground hover:text-foreground",
          isOpen && "border-primary bg-muted text-foreground"
        )}
      >
        <MapPin className={cn("w-4 h-4 transition-colors", isOpen && "text-primary")} />
        <span className={cn(showLabel ? "inline" : "hidden sm:inline", "max-w-[120px] truncate")}>
          {selectedGate.gate ? selectedGate.gate.name : "গেট খুঁজুন"}
        </span>
        {selectedGate.distance && (
          <span className="hidden md:inline-flex items-center px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
            {Math.round(selectedGate.distance)}m
          </span>
        )}
      </Button>

      {mounted && isOpen && coords
        ? createPortal(
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[180]"
                onClick={() => setIsOpen(false)}
              />

              {/* Dropdown — body-portal: overflow-clip হওয়া টুলবার/মেনু থেকে মুক্ত। */}
              <div
                role="dialog"
                aria-label="গেট তালিকা"
                style={{
                  position: "fixed",
                  top: coords.top,
                  left: coords.left,
                  width: coords.width,
                }}
                className="bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-[200] overflow-hidden"
              >
                {/* Search Header */}
                <div className="flex items-center gap-3 p-4 border-b border-border/50">
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="গেট খুঁজুন..."
                    className="flex-1 h-9 border-border bg-muted/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="p-1 hover:bg-muted rounded-md transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Gate List */}
                <div className="max-h-72 overflow-y-auto scrollbar-thin">
                  {filteredGates.length === 0 ? (
                    <div className="p-8 text-center">
                      <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">কোনো গেট পাওয়া যায়নি</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredGates.map((gate) => {
                        const config = typeConfig[gate.type ?? "umrah"];
                        return (
                          <button
                            key={gate.id}
                            onClick={() => handleSelectGate(gate.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all duration-150 group text-left"
                          >
                            <div className={`w-3 h-3 rounded-full ${config.color} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {gate.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate" dir="rtl">
                                {gate.nameAr}
                              </div>
                            </div>
                            {gate.facilities.includes("wheelchair") && (
                              <span
                                className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full"
                                title="Wheelchair accessible"
                              >
                                ♿
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Legend Footer */}
                <div className="p-3 border-t border-border/50 bg-surface/50">
                  <div className="flex items-center justify-center gap-4 text-xs">
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                        <span className="text-muted-foreground">{config.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}
