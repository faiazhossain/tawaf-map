"use client";

import { MapPin, Clock, Navigation, Footprints, X, Route } from "lucide-react";
import { useRouteStore, usePanelStore } from "@/lib/store";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";

interface RoutePanelProps {
  onClose?: () => void;
}

export function RoutePanel({ onClose }: RoutePanelProps) {
  const { activeRoute, isRouting, routeError, clearRoute } = useRouteStore();
  const { setActivePanel } = usePanelStore();

  const handleClose = () => {
    clearRoute();
    setActivePanel(null);
    onClose?.();
  };

  if (isRouting) {
    return (
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[90]">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-300">রুট বের করা হচ্ছে...</p>
          </div>
        </div>
      </div>
    );
  }

  if (routeError) {
    return (
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[90]">
        <div className="bg-rose-500/10 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-400">রুট ত্রুটি</p>
              <p className="text-sm text-rose-400/80 mt-1">{routeError}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-rose-400/60 hover:text-rose-400 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeRoute) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[90]">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-white" />
            <h3 className="font-semibold text-white">হাঁটার রুট</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close route"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Route Summary */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Footprints className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">দূরত্ব</p>
                <p className="font-semibold text-white">{formatDistance(activeRoute.distance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">সময়</p>
                <p className="font-semibold text-white">
                  {formatWalkingTime(activeRoute.duration)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Turn-by-turn Instructions */}
        <div className="max-h-64 overflow-y-auto">
          <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 sticky top-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              দিক নির্দেশনা
            </p>
          </div>
          <div className="divide-y divide-slate-700/50">
            {activeRoute.steps.map((step, index) => (
              <div key={index} className="px-4 py-3 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{step.instruction}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        {formatDistance(step.distance)}
                      </span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">
                        {formatWalkingTime(step.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
          <p className="text-xs text-slate-600 text-center">
            গড় হাঁটার গতি ৫ কিমি/ঘণ্টা ধরে হিসাব করা হয়েছে
          </p>
        </div>
      </div>
    </div>
  );
}
