export type TouristPlaceCategory =
  | "historical_site"
  | "museum"
  | "mosque"
  | "park"
  | "mountain"
  | "shopping"
  | "cultural_center"
  | "landmark"
  | "agriculture"
  | "religious_site"
  | "cemetery";

export type City = "makkah" | "madinah";

export type VisitTiming = "any_time" | "morning" | "afternoon" | "evening" | "night";

export type TicketInfo = {
  required: boolean;
  price?: {
    adult: number;
    child: number;
    currency: string;
  };
  bookingUrl?: string;
  note?: string;
};

export interface HistoricalInfo {
  period: string;
  significance: string;
  keyEvents: string[];
  relatedFigures?: string[];
}

export interface VisitingInfo {
  bestTimeToVisit: string;
  duration: string;
  dressCode: string;
  accessibility: string;
  facilities: string[];
  tips: string[];
}

export interface TouristPlace {
  id: string;
  name: string;
  nameAr: string;
  nameBn?: string;
  city: City;
  category: TouristPlaceCategory;
  location: {
    coordinates: [number, number];
    address: string;
    addressBn?: string;
    nearestLandmark?: string;
    nearestLandmarkBn?: string;
  };
  description: {
    short: string;
    full: string;
    historical?: string;
  };
  descriptionBn?: {
    short: string;
    full: string;
    historical?: string;
  };
  historicalInfo?: HistoricalInfo;
  visitingInfo: VisitingInfo;
  ticketInfo?: TicketInfo;
  openingHours?: string;
  contact?: {
    phone?: string;
    website?: string;
    email?: string;
  };
  images?: {
    main: string;
    gallery?: string[];
  };
  rating?: number;
  popular: boolean;
  distanceFromHaram?: number; // in meters
  tags: string[];
  searchTerms?: string[]; // English/alternate names for search
}

export interface TouristPlaceFilters {
  categories: TouristPlaceCategory[];
  cities: City[];
  showPopularOnly: boolean;
  maxDistance?: number; // in meters
  searchQuery: string;
}

export interface SelectedTouristPlace {
  place: TouristPlace | null;
  distance: number | null;
  walkingTime: number | null;
  route: {
    coordinates: [number, number][];
    distance: number;
    duration: number;
  } | null;
}
