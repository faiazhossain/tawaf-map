import { create } from "zustand";
import type { Gate, SelectedGate } from "@/types/gate";

interface GateStore {
  selectedGate: SelectedGate;
  nearbyGates: Gate[];
  setGate: (gate: Gate | null) => void;
  setGateDistance: (distance: number, walkingTime: number) => void;
  setNearbyGates: (gates: Gate[]) => void;
  clearGate: () => void;
}

export const useGateStore = create<GateStore>((set) => ({
  selectedGate: {
    gate: null,
    distance: null,
    walkingTime: null,
  },
  nearbyGates: [],

  setGate: (gate) =>
    set((state) => ({
      selectedGate: { ...state.selectedGate, gate },
    })),

  setGateDistance: (distance, walkingTime) =>
    set((state) => ({
      selectedGate: { ...state.selectedGate, distance, walkingTime },
    })),

  setNearbyGates: (nearbyGates) => set({ nearbyGates }),

  clearGate: () =>
    set({
      selectedGate: {
        gate: null,
        distance: null,
        walkingTime: null,
      },
    }),
}));
