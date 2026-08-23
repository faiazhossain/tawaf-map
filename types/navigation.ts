/** রাস্তার শেষ বিন্দু থেকে প্রকৃত গন্তব্য পর্যন্ত বাঁকা ডটেড সংযোগকারী। */
export interface RouteApproach {
  /** [lng, lat] নমুনা-বিন্দু — চাপের জ্যামিতি (lib/geo/curve) */
  geometry: number[][];
  /** চাপ ধরে হাঁটা দূরত্ব, মিটারে (haversine যোগফল) */
  distance: number;
}

export interface Route {
  id: string;
  geometry: number[][];
  distance: number;
  duration: number;
  steps: RouteStep[];
  /** রাস্তার শেষ বিন্দু ও প্রকৃত গন্তব্যের ফাঁক প্রাসঙ্গিক সীমা ছাড়ালে বাঁকা সংযোগকারী */
  approach?: RouteApproach | null;
  /** পথ না পাওয়া গেলে সরলরেখা-ভিত্তিক আনুমানিক পুরো রুট */
  approximate?: boolean;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver?: string;
}

export interface NavigationDestination {
  /** [lng, lat] — MapLibre GeoJSON ক্রম */
  coordinates: [number, number];
  /** ব্যানারে দেখানোর বাংলা নাম */
  name: string;
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
