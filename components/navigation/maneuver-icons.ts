import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  MapPin,
  RefreshCw,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

/**
 * osrm-instructions-bn-এর স্বাভাবিক ম্যানুভার স্ট্রিং ("turn left",
 * "roundabout", "depart", ...) থেকে আইকন। অজানা মান সোজা-সামনে।
 */
export function maneuverIconFor(maneuver: string | undefined): LucideIcon {
  const value = maneuver ?? "";
  if (value.includes("uturn")) return RotateCcw;
  if (value.includes("roundabout")) return RefreshCw;
  if (value.includes("depart")) return Flag;
  if (value.includes("arrive")) return MapPin;
  if (value.includes("left")) return CornerUpLeft;
  if (value.includes("right")) return CornerUpRight;
  return ArrowUp;
}
