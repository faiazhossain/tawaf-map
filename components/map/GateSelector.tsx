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
    umrah: { color: "bg-primary", label: "ওমরাহ" },
    salah: { color: "bg-amber-500", label: "নামাজ" },
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className={cn(
          "gap-2 transition-all duration-200",
          "border-border bg-surface/50 hover:bg-muted text-foreground hover:text-foreground",
          isOpen && "border-primary bg-muted text-foreground"
        )}
      >
        <MapPin className={cn("w-4 h-4 transition-colors", isOpen && "text-primary")} />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {selectedGate.gate ? selectedGate.gate.name : "গেট খুঁজুন"}
        </span>
        {selectedGate.distance && (
          <span className="hidden md:inline-flex items-center px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
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
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden">
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
                    const config = typeConfig[gate.type];
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
        </>
      )}
    </div>
  );
}
