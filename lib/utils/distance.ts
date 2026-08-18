const EARTH_RADIUS = 6371000; // Earth's radius in meters

import { toBengaliNumber } from "@/lib/utils/bengali-number";

/**
 * Calculate the Haversine distance between two coordinates
 * @param lat1 - First point latitude
 * @param lon1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lon2 - Second point longitude
 * @returns Distance in meters
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
}

/**
 * Calculate the bearing between two coordinates
 * @param lat1 - First point latitude
 * @param lon1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lon2 - Second point longitude
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const toDeg = (value: number) => (value * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);

  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  const bearing = toDeg(Math.atan2(y, x));

  return (bearing + 360) % 360;
}

/**
 * Estimate walking time based on distance
 * @param distance - Distance in meters
 * @param speed - Walking speed in m/s (default: 1.39 m/s ~ 5 km/h)
 * @returns Walking time in seconds
 */
export function estimateWalkingTime(distance: number, speed = 1.39): number {
  return Math.ceil(distance / speed);
}

/**
 * Format distance for display (Bengali-first: বাংলা সংখ্যা + বাংলা একক)।
 * প্রোডাক্ট বাংলা-প্রথম, তাই আগের "1.2km" / "5 min" ল্যাটিন রূপ বাদ।
 * @param meters - Distance in meters
 * @returns Bengali formatted distance (যেমন "৪৫০ মি", "১.২ কিমি")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${toBengaliNumber(Math.round(meters))} মি`;
  }
  return `${toBengaliNumber(Number((meters / 1000).toFixed(1)))} কিমি`;
}

/**
 * Format walking time for display (Bengali-first)।
 * @param seconds - Time in seconds
 * @returns Bengali formatted time (যেমন "৫ মিনিট", "২ ঘ ৩০ মিনিট")
 */
export function formatWalkingTime(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${toBengaliNumber(minutes)} মিনিট`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${toBengaliNumber(hours)} ঘ ${toBengaliNumber(remainingMinutes)} মিনিট`
    : `${toBengaliNumber(hours)} ঘণ্টা`;
}

/**
 * Get compass direction label from bearing (8-way).
 * Previously duplicated in useGateProximity and useHotelProximity.
 * @param bearing - Bearing in degrees (0-360)
 * @returns Compass label ("N", "NE", …)
 */
export function getDirectionFromBearing(bearing: number): string {
  const directions = [
    { label: "N", min: 352.5, max: 7.5 },
    { label: "NE", min: 22.5, max: 67.5 },
    { label: "E", min: 67.5, max: 112.5 },
    { label: "SE", min: 112.5, max: 157.5 },
    { label: "S", min: 157.5, max: 202.5 },
    { label: "SW", min: 202.5, max: 247.5 },
    { label: "W", min: 247.5, max: 292.5 },
    { label: "NW", min: 292.5, max: 337.5 },
  ];

  for (const direction of directions) {
    if (bearing >= direction.min && bearing < direction.max) {
      return direction.label;
    }
    if (direction.min > direction.max && (bearing >= direction.min || bearing < direction.max)) {
      return direction.label;
    }
  }
  return "N";
}

/**
 * Calculate the midpoint between two coordinates
 * @param lat1 - First point latitude
 * @param lon1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lon2 - Second point longitude
 * @returns Midpoint coordinates [lat, lon]
 */
export function calculateMidpoint(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): [number, number] {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const toDeg = (value: number) => (value * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);

  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const lon1Rad = toRad(lon1);

  const bx = Math.cos(lat2Rad) * Math.cos(dLon);
  const by = Math.cos(lat2Rad) * Math.sin(dLon);

  const latMid = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + bx) ** 2 + by ** 2)
  );
  const lonMid = lon1Rad + Math.atan2(by, Math.cos(lat1Rad) + bx);

  return [toDeg(latMid), toDeg(lonMid)];
}
