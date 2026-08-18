export type POICategory =
  | "restaurant"
  | "cafe"
  | "grocery"
  | "pharmacy"
  | "hotel"
  | "atm"
  | "transport"
  | "mosque"
  | "toilet";

export type CuisineType =
  | "arabic"
  | "south_asian"
  | "east_asian"
  | "western"
  | "middle_eastern"
  | "african"
  | "other";

export type PriceLevel = 1 | 2 | 3 | 4;

export interface POI {
  id: string;
  /** বাংলা-প্রথম নাম (যেমন "আল-বাইক") */
  name: string;
  nameAr?: string;
  category: POICategory;
  cuisine?: CuisineType[];
  /** খাবারের দোকানে প্রযোজ্য; টয়লেট/এটিএম/মসজিদে বাদ থাকে */
  priceLevel?: PriceLevel;
  /** শুধু খাদ্য বিভাগে (restaurant/cafe) অর্থবহ */
  halal?: boolean;
  prayerFriendly?: boolean;
  location: {
    coordinates: [number, number];
    address?: string;
  };
  distance?: number;
  rating?: number;
  photos?: string[];
  openingHours?: string;
  phone?: string;
}

export interface POIFilters {
  categories: POICategory[];
  cuisineTypes: CuisineType[];
  priceLevels: PriceLevel[];
  halalOnly: boolean;
  prayerFriendlyOnly: boolean;
  maxDistance: number;
  searchQuery: string;
}
