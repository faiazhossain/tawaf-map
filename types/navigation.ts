export interface Route {
  id: string;
  geometry: number[][];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver?: string;
}

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error: string | null;
  loading: boolean;
  permission: "granted" | "denied" | "prompt" | "unknown";
}

export interface LocationActions {
  setLocation: (lat: number, lon: number, accuracy?: number) => void;
  setHeading: (heading: number) => void;
  setSpeed: (speed: number) => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  setPermission: (permission: "granted" | "denied" | "prompt" | "unknown") => void;
  clearLocation: () => void;
  requestLocation: () => Promise<void>;
}
