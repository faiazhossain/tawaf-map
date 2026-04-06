import { create } from "zustand";

export type PanelType = "gate" | "hotel" | "route" | null;
export type PanelPosition = "top-right" | "bottom-right" | "bottom-left";

interface PanelState {
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  clearActivePanel: () => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
  clearActivePanel: () => set({ activePanel: null }),
}));
