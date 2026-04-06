export type GateType = "king_fahd" | "umrah" | "salah";

export interface Gate {
  id: string;
  name: string;
  nameAr: string;
  location: {
    coordinates: [number, number];
  };
  type: GateType;
  facilities: string[];
  nearestLandmarks: string[];
}

export interface SelectedGate {
  gate: Gate | null;
  distance: number | null;
  walkingTime: number | null;
}
