import { create } from "zustand";

export type PanelType = "gate" | "hotel" | "tourist-place" | "route" | null;
export type PanelPosition = "top-right" | "bottom-right" | "bottom-left";
export type SheetSnapPoint = "peek" | "half" | "full";

interface PanelState {
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  clearActivePanel: () => void;
  // Mobile bottom sheet state
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  currentSnapPoint: SheetSnapPoint;
  setSnapPoint: (snap: SheetSnapPoint) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel, sheetOpen: panel !== null }),
  clearActivePanel: () => set({ activePanel: null, sheetOpen: false }),
  // Mobile bottom sheet state
  sheetOpen: false,
  setSheetOpen: (open) => set({ sheetOpen: open }),
  currentSnapPoint: "half",
  setSnapPoint: (snap) => set({ currentSnapPoint: snap }),
}));
