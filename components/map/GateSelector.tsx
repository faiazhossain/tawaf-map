"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMapStore, useGateStore } from "@/lib/store";
import { HARAM_GATES } from "@/lib/data/gates";
import { Search, MapPin } from "lucide-react";

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

  const typeColors = {
    king_fahd: "bg-blue-500",
    umrah: "bg-green-500",
    salah: "bg-amber-500",
  };

  const typeLabels = {
    king_fahd: "King Fahd",
    umrah: "Umrah",
    salah: "Salah",
  };

  return (
    <div className="relative w-full max-w-md">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {selectedGate.gate ? selectedGate.gate.name : "Select a gate"}
        </span>
        <span className="text-xs text-muted-foreground">
          {selectedGate.distance && `${Math.round(selectedGate.distance)}m`}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg">
          <div className="flex items-center gap-2 p-3 border-b">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gates..."
              className="flex-1 h-9 border-none focus-visible:ring-0"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredGates.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No gates found</div>
            ) : (
              <div className="py-1">
                {filteredGates.map((gate) => (
                  <button
                    key={gate.id}
                    onClick={() => handleSelectGate(gate.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${typeColors[gate.type]}`}
                      title={typeLabels[gate.type]}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{gate.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{gate.nameAr}</div>
                    </div>
                    {gate.facilities.includes("wheelchair") && (
                      <span className="text-xs text-muted-foreground" title="Wheelchair accessible">
                        ♿
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t bg-muted/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>King Fahd</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Umrah</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Salah</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
