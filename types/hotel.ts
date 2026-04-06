export type HotelStarRating = 3 | 4 | 5;

export type HotelAmenity =
  | "wifi"
  | "restaurant"
  | "parking"
  | "pool"
  | "gym"
  | "spa"
  | "prayer_room"
  | "shuttle"
  | "room_service"
  | "ac"
  | "elevator";

export interface Hotel {
  id: string;
  name: string;
  nameAr: string;
  starRating: HotelStarRating;
  location: {
    coordinates: [number, number];
    address: string;
    addressAr: string;
  };
  distanceToHaram: number; // in meters
  walkingTime: number; // in seconds
  amenities: HotelAmenity[];
  contact?: {
    phone?: string;
    website?: string;
  };
  priceLevel: 1 | 2 | 3 | 4; // Budget to Luxury
  images?: string[];
}

export interface HotelProximity {
  hotel: Hotel;
  distance: number;
  walkingTime: number;
  distanceFormatted: string;
  walkingTimeFormatted: string;
  bearing: number;
  direction: string;
}
