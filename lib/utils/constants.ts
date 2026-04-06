// Makkah coordinates
export const MAKKAH_CENTER = {
  lat: 21.4225,
  lng: 39.8262,
};

// Madinah coordinates
export const MADINAH_CENTER = {
  lat: 24.4672,
  lng: 39.6141,
};

// Default map configuration
export const MAP_CONFIG = {
  minZoom: 10,
  maxZoom: 20,
  defaultPitch: 0,
  defaultBearing: 0,
  animationDuration: 1000,
} as const;

// Walking speed (meters per second) - average 5 km/h
export const WALKING_SPEED = 1.39;

// Distance thresholds (in meters)
export const DISTANCE_THRESHOLDS = {
  NEARBY: 100,
  WALKING: 500,
  MODERATE: 1000,
  FAR: 2000,
} as const;

// Gate types
export const GATE_TYPES = {
  KING_FAHD: "king_fahd",
  UMRAH: "umrah",
  SALAH: "salah",
} as const;

// POI categories
export const POI_CATEGORIES = {
  RESTAURANT: "restaurant",
  CAFE: "cafe",
  GROCERY: "grocery",
  PHARMACY: "pharmacy",
  HOTEL: "hotel",
  ATM: "atm",
  TRANSPORT: "transport",
  WORSHIP: "worship",
} as const;

// Cuisine types
export const CUISINE_TYPES = {
  ARABIC: "arabic",
  SOUTH_ASIAN: "south_asian",
  EAST_ASIAN: "east_asian",
  WESTERN: "western",
  MIDDLE_EASTERN: "middle_eastern",
  AFRICAN: "african",
  OTHER: "other",
} as const;

// Price levels
export const PRICE_LEVELS = {
  BUDGET: 1,
  MODERATE: 2,
  EXPENSIVE: 3,
  LUXURY: 4,
} as const;
