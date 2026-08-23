"use client";

/**
 * Floating indicator shown whenever the GPS simulator is active.
 * Always visible while simulating so simulated location data can never be
 * mistaken for a real fix. Also carries the harness controls: mode
 * (live remap / auto ring walk), scale, and disable.
 *
 * Importing this module activates the simulator patch (see gps-sim.ts).
 */

import { useEffect, useState } from "react";
import { Database, Footprints, Minus, Plus, Satellite, X } from "lucide-react";
import { useLocationStore, useRouteStore, useNavigationStore } from "@/lib/store";
import {
  getGpsSimRuntime,
  setGpsSimRoutePathProvider,
  storeGpsSimPrefs,
  type GpsSimMode,
  type GpsSimRuntime,
} from "@/lib/dev/gps-sim";
import { isDemoWorldActive, storeDemoWorldActive } from "@/lib/dev/demo-world";
import { toBengaliNumber } from "@/lib/utils/bengali-number";

// Reload without the query string so a disable is not immediately
// re-enabled by a lingering ?gps-sim=1 param.
function reloadWithoutQuery() {
  window.location.assign(window.location.pathname);
}

export function GpsSimBadge() {
  const [runtime, setRuntime] = useState<GpsSimRuntime | null>(null);
  const [demoWorld, setDemoWorld] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [raw, setRaw] = useState<{ lng: number; lat: number } | null>(null);
  const [veer, setVeer] = useState(0);

  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);

  useEffect(() => {
    // অটো-ওয়াকারকে সক্রিয় নেভিগেশন রুট সরবরাহ — getState() দিয়ে পড়ে বলে
    // প্রতি টিকে তাজা মান পায়, আর একই রুটে একই রেফারেন্স ফেরায় (zustand)।
    setGpsSimRoutePathProvider(() => {
      const nav = useNavigationStore.getState();
      const route = useRouteStore.getState().activeRoute;
      return nav.isNavigating && route ? (route.geometry as [number, number][]) : null;
    });
  }, []);

  useEffect(() => {
    const rt = getGpsSimRuntime();
    if (rt?.enabled) {
      setRuntime(rt);
      setVeer(rt.veerOffsetM);
      const id = window.setInterval(() => setRaw(rt.lastRaw), 1000);
      return () => window.clearInterval(id);
    }
    setDemoWorld(isDemoWorldActive());
    return;
  }, []);

  // GPS simulator badge (see gps-sim.ts)
  if (runtime) {
    const updatePrefs = (mode: GpsSimMode, scale: number) => {
      storeGpsSimPrefs({ mode, scale });
      reloadWithoutQuery();
    };

    const changeScale = (delta: number) => {
      const next = Math.min(50, Math.max(1, Math.round(runtime.scale + delta)));
      updatePrefs(runtime.mode, next);
    };

    // লম্ব বিচ্যুতি: রানটাইমে সরাসরি লেখা হয় — ওয়াকার প্রতি টিকে পড়ে।
    // ২ চাপ (৩০ মি) = নিশ্চিত অফ-রুট; ১ চাপ (১৫ মি) = হিস্টেরিসিস ব্যান্ডের
    // ভেতরে — "কোনো মিথ্যা রিয়ারাউট নয়" ডেমো করতে।
    const changeVeer = (delta: number) => {
      const next = Math.min(60, Math.max(-60, runtime.veerOffsetM + delta));
      runtime.veerOffsetM = next;
      setVeer(next);
    };

    const resetVeer = () => {
      runtime.veerOffsetM = 0;
      setVeer(0);
    };

    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[45]">
        <div className="bg-surface/95 backdrop-blur-xl border border-amber-500/40 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-amber-500/10 transition-colors"
            aria-expanded={expanded}
            aria-label="GPS simulator controls"
          >
            <span className="relative flex items-center">
              <Satellite className="w-4 h-4 text-amber-500" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              সিম জিপিএস
            </span>
            <span className="text-[10px] text-muted-foreground">
              {runtime.mode === "live" ? "লাইভ" : "অটো"} × {runtime.scale}
            </span>
          </button>

          {expanded && (
            <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-amber-500/20 w-64">
              {/* Simulated (mapped) position */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">
                  মক্কায় অবস্থান (সিমুলেটেড)
                </p>
                <p className="font-mono text-[11px] text-foreground truncate">
                  {latitude !== null && longitude !== null
                    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    : "কোনো ফিক্স নেই"}
                </p>
              </div>

              {/* Raw device position (live mode only) */}
              {runtime.mode === "live" && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">
                    আসল ডিভাইস পজিশন (ঢাকা)
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">
                    {raw ? `${raw.lat.toFixed(6)}, ${raw.lng.toFixed(6)}` : "অপেক্ষমাণ"}
                  </p>
                </div>
              )}

              {/* Veer control (auto mode): demo off-route + reroute */}
              {runtime.mode === "auto" && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">
                    রুট থেকে সরান (অফ-রুট পরীক্ষা)
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => changeVeer(-15)}
                      className="px-2 py-1 rounded-lg bg-muted/60 hover:bg-amber-500/15 border border-border text-[11px] text-foreground transition-colors"
                      aria-label="বাঁয়ে ১৫ মিটার সরান"
                    >
                      -১৫ মি
                    </button>
                    <span className="px-1 text-[11px] text-muted-foreground tabular-nums min-w-[3rem] text-center">
                      {toBengaliNumber(veer)} মি
                    </span>
                    <button
                      onClick={() => changeVeer(15)}
                      className="px-2 py-1 rounded-lg bg-muted/60 hover:bg-amber-500/15 border border-border text-[11px] text-foreground transition-colors"
                      aria-label="ডানে ১৫ মিটার সরান"
                    >
                      +১৫ মি
                    </button>
                    <button
                      onClick={resetVeer}
                      disabled={runtime.veerOffsetM === 0}
                      className="px-2 py-1 rounded-lg bg-muted/60 hover:bg-amber-500/15 border border-border text-[11px] text-muted-foreground transition-colors disabled:opacity-40"
                      aria-label="বিচ্যুতি রিসেট"
                    >
                      রিসেট
                    </button>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    updatePrefs(runtime.mode === "live" ? "auto" : "live", runtime.scale)
                  }
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-muted/60 hover:bg-amber-500/15 border border-border text-[11px] text-foreground transition-colors"
                >
                  {runtime.mode === "live" ? (
                    <>
                      <Footprints className="w-3 h-3" />
                      অটো হাঁটা
                    </>
                  ) : (
                    <>
                      <Satellite className="w-3 h-3" />
                      লাইভ জিপিএস
                    </>
                  )}
                </button>

                <div className="flex items-center rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => changeScale(-1)}
                    className="px-1.5 py-1.5 hover:bg-muted transition-colors"
                    aria-label="Decrease scale"
                  >
                    <Minus className="w-3 h-3 text-foreground" />
                  </button>
                  <span className="px-1 text-[11px] text-muted-foreground tabular-nums">
                    ×{runtime.scale}
                  </span>
                  <button
                    onClick={() => changeScale(1)}
                    className="px-1.5 py-1.5 hover:bg-muted transition-colors"
                    aria-label="Increase scale"
                  >
                    <Plus className="w-3 h-3 text-foreground" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    storeGpsSimPrefs(null);
                    reloadWithoutQuery();
                  }}
                  className="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                  aria-label="Disable GPS simulator"
                >
                  <X className="w-3 h-3 text-rose-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Demo world badge (see demo-world.ts): data moved around the developer.
  if (!demoWorld) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[45]">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface/95 backdrop-blur-xl border border-amber-500/40 rounded-xl shadow-lg">
        <Database className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          ডেমো ডেটা মোড
        </span>
        <button
          onClick={() => {
            storeDemoWorldActive(false);
            reloadWithoutQuery();
          }}
          className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          aria-label="Disable demo world"
        >
          <X className="w-3 h-3 text-rose-400" />
        </button>
      </div>
    </div>
  );
}
