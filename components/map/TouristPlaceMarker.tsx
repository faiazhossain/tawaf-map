"use client";

import { memo } from "react";
import {
  MapPin,
  Building2,
  TreePine,
  Mountain,
  ShoppingBag,
  Landmark,
  Library,
  Leaf,
  Star,
  Trees,
} from "lucide-react";
import type { TouristPlace } from "@/types/tourist-place";

interface TouristPlaceMarkerProps {
  place: TouristPlace;
  isSelected?: boolean;
  onClick?: () => void;
  showLabel?: boolean;
}

// Category icons mapping
const CategoryIcons = {
  historical_site: Landmark,
  mosque: Building2, // Using Building2 as mosque icon
  museum: Building2,
  park: TreePine,
  mountain: Mountain,
  shopping: ShoppingBag,
  cultural_center: Library,
  landmark: MapPin,
  agriculture: Leaf,
  religious_site: Star,
  cemetery: Trees,
};

// Category colors with distinct visual styles
const categoryStyles = {
  historical_site: {
    bg: "bg-amber-500",
    border: "border-amber-600",
    iconBg: "bg-amber-600",
  },
  mosque: {
    bg: "bg-emerald-500",
    border: "border-emerald-600",
    iconBg: "bg-emerald-600",
  },
  museum: {
    bg: "bg-purple-500",
    border: "border-purple-600",
    iconBg: "bg-purple-600",
  },
  park: {
    bg: "bg-green-500",
    border: "border-green-600",
    iconBg: "bg-green-600",
  },
  mountain: {
    bg: "bg-stone-500",
    border: "border-stone-600",
    iconBg: "bg-stone-600",
  },
  shopping: {
    bg: "bg-rose-500",
    border: "border-rose-600",
    iconBg: "bg-rose-600",
  },
  cultural_center: {
    bg: "bg-indigo-500",
    border: "border-indigo-600",
    iconBg: "bg-indigo-600",
  },
  landmark: {
    bg: "bg-blue-500",
    border: "border-blue-600",
    iconBg: "bg-blue-600",
  },
  agriculture: {
    bg: "bg-lime-500",
    border: "border-lime-600",
    iconBg: "bg-lime-600",
  },
  religious_site: {
    bg: "bg-yellow-500",
    border: "border-yellow-600",
    iconBg: "bg-yellow-600",
  },
  cemetery: {
    bg: "bg-gray-500",
    border: "border-gray-600",
    iconBg: "bg-gray-600",
  },
};

export const TouristPlaceMarker = memo(function TouristPlaceMarker({
  place,
  isSelected = false,
  onClick,
  showLabel = true,
}: TouristPlaceMarkerProps) {
  const IconComponent = CategoryIcons[place.category];
  const styles = categoryStyles[place.category];

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-1 cursor-pointer
        transition-all duration-200 group
        ${isSelected ? "scale-110" : "hover:scale-105"}
      `}
    >
      {/* Marker pin */}
      <div className="relative">
        <div
          className={`
            w-10 h-10 rounded-full border-2 flex items-center justify-center
            ${styles.bg} ${styles.border}
            ${isSelected ? "ring-2 ring-offset-2 ring-background" : ""}
            shadow-lg
          `}
        >
          <IconComponent className="w-5 h-5 text-white" />
        </div>

        {/* Popular indicator */}
        {place.popular && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-[8px]">★</span>
          </div>
        )}

        {/* Selected ring */}
        {isSelected && (
          <div
            className={`absolute inset-0 rounded-full border-2 ${styles.border} animate-ping opacity-50`}
          />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex flex-col items-center max-w-32">
          <span className="text-sm font-semibold text-foreground text-center leading-tight">
            {place.nameBn || place.name}
          </span>
          {isSelected && (
            <>
              <span className="text-xs text-muted-foreground text-center" dir="rtl">
                {place.nameAr}
              </span>

              {/* Category tag */}
              <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 ${styles.bg} text-white`}>
                {formatCategory(place.category)}
              </span>

              {/* Distance from Haram (if available) */}
              {place.distanceFromHaram && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDistance(place.distanceFromHaram)} from Haram
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

// Helper function to format category names
function formatCategory(category: TouristPlace["category"]): string {
  const labels: Record<TouristPlace["category"], string> = {
    historical_site: "Historical",
    mosque: "Mosque",
    museum: "Museum",
    park: "Park",
    mountain: "Mountain",
    shopping: "Shopping",
    cultural_center: "Culture",
    landmark: "Landmark",
    agriculture: "Agriculture",
    religious_site: "Religious",
    cemetery: "Cemetery",
  };
  return labels[category];
}

// Helper function to format distance
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// Legend component for tourist place categories
interface TouristPlaceMarkerLegendProps {
  selectedCategory?: TouristPlace["category"] | null;
  onCategoryChange?: (category: TouristPlace["category"] | null) => void;
}

export function TouristPlaceMarkerLegend({
  selectedCategory,
  onCategoryChange,
}: TouristPlaceMarkerLegendProps) {
  const categories: { key: TouristPlace["category"]; label: string; icon: typeof MapPin }[] = [
    { key: "historical_site", label: "Historical Sites", icon: Landmark },
    { key: "mosque", label: "Mosques", icon: Building2 }, // Using Building2 as mosque icon
    { key: "museum", label: "Museums", icon: Building2 },
    { key: "park", label: "Parks", icon: TreePine },
    { key: "mountain", label: "Mountains", icon: Mountain },
    { key: "shopping", label: "Shopping", icon: ShoppingBag },
    { key: "cultural_center", label: "Cultural Centers", icon: Library },
    { key: "landmark", label: "Landmarks", icon: MapPin },
    { key: "agriculture", label: "Agriculture", icon: Leaf },
    { key: "religious_site", label: "Religious Sites", icon: Star },
    { key: "cemetery", label: "Cemeteries", icon: Trees },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-3">
      <p className="text-xs font-semibold text-gray-700 mb-2">Tourist Places</p>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        <button
          onClick={() => onCategoryChange?.(null)}
          className={`
            flex items-center gap-2 w-full rounded px-2 py-1 transition-colors
            ${
              selectedCategory === undefined || selectedCategory === null
                ? "bg-gray-100"
                : "hover:bg-gray-50"
            }
          `}
        >
          <div className="w-4 h-4 rounded-full bg-gray-400" />
          <span className="text-xs text-gray-600">All Categories</span>
        </button>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const styles = categoryStyles[cat.key];
          return (
            <button
              key={cat.key}
              onClick={() => onCategoryChange?.(cat.key)}
              className={`
                flex items-center gap-2 w-full rounded px-2 py-1 transition-colors
                ${selectedCategory === cat.key ? "bg-gray-100" : "hover:bg-gray-50"}
              `}
            >
              <div className={`w-4 h-4 rounded-full ${styles.bg}`} />
              <Icon className="w-3 h-3 text-gray-600" />
              <span className="text-xs text-gray-600">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
