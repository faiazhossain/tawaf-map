"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapStore, useGateStore } from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { Search, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GateSelector() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { flyTo } = useMapStore();
  const { setGate, selectedGate } = useGateStore();

  const filteredGates = HARAM_GATES.filter(
    (gate) =>
      gate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gate.nameAr.includes(searchQuery)
  );

  const handleSelectGate = (gateId: string) => {
    const gate = HARAM_GATES.find((g) => g.id === gateId);
    if (gate) {
      setGate(gate);
      flyTo(gate.location.coordinates);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const typeConfig = {
    king_fahd: { color: "bg-blue-500", label: "কিং ফাহ্দ" },
    umrah: { color: "bg-emerald-500", label: "ওমরাহ" },
    salah: { color: "bg-amber-500", label: "নামাজ" },
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className={cn(
          "gap-2 transition-all duration-200",
          "border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white",
          isOpen && "border-emerald-500 bg-slate-800 text-white"
        )}
      >
        <MapPin className={cn("w-4 h-4 transition-colors", isOpen && "text-emerald-500")} />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {selectedGate.gate ? selectedGate.gate.name : "গেট খুঁজুন"}
        </span>
        {selectedGate.distance && (
          <span className="hidden md:inline-flex items-center px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
            {Math.round(selectedGate.distance)}m
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Search Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
              <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="গেট খুঁজুন..."
                className="flex-1 h-9 border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-slate-800 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>

            {/* Gate List */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {filteredGates.length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">কোনো গেট পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredGates.map((gate) => {
                    const config = typeConfig[gate.type];
                    return (
                      <button
                        key={gate.id}
                        onClick={() => handleSelectGate(gate.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/80 transition-all duration-150 group text-left"
                      >
                        <div className={`w-3 h-3 rounded-full ${config.color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                            {gate.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate" dir="rtl">
                            {gate.nameAr}
                          </div>
                        </div>
                        {gate.facilities.includes("wheelchair") && (
                          <span
                            className="text-xs text-slate-600 bg-slate-800/50 px-2 py-0.5 rounded-full"
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
            <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
              <div className="flex items-center justify-center gap-4 text-xs">
                {Object.entries(typeConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                    <span className="text-slate-500">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
