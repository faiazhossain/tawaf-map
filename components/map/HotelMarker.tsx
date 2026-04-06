"use client";

import { Hotel } from "lucide-react";

interface HotelMarkerProps {
  hotel: {
    id: string;
    name: string;
    starRating: number;
    priceLevel: number;
  };
  isSelected?: boolean;
  size?: number;
}

export function HotelMarker({ hotel, isSelected = false, size = 24 }: HotelMarkerProps) {
  const sizeClass = isSelected ? "scale-125" : "scale-100";
  const starRating = hotel.starRating || 3;

  // Color based on price level
  const getMarkerColor = () => {
    switch (hotel.priceLevel) {
      case 1:
        return "#22c55e"; // green - budget
      case 2:
        return "#3b82f6"; // blue - moderate
      case 3:
        return "#f59e0b"; // amber - expensive
      case 4:
        return "#8b5cf6"; // purple - luxury
      default:
        return "#6b7280";
    }
  };

  const markerColor = getMarkerColor();

  return (
    <div
      className={`relative transition-transform duration-200 ${sizeClass}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Pin shape */}
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          fill={markerColor}
          stroke={isSelected ? "#ffffff" : markerColor}
          strokeWidth={isSelected ? 2 : 0}
        />
        {/* Hotel icon inside */}
        <g transform="translate(8, 8) scale(0.5)">
          <path
            d="M3 21h18v-8a2 2 0 0 0-2-2h-1.5V7.5a1.5 1.5 0 0 0-3 0V11h-5V7.5a1.5 1.5 0 0 0-3 0V11H5a2 2 0 0 0-2 2v8z"
            fill="white"
          />
        </g>
      </svg>

      {/* Star rating indicator */}
      <div className="absolute -top-1 -right-1 bg-white rounded-full px-1 min-w-4 h-4 flex items-center justify-center">
        <span className="text-[8px] font-bold text-gray-700">{starRating}</span>
      </div>
    </div>
  );
}

interface HotelMarkerLegendProps {
  onFilterChange?: (priceLevel: number | null) => void;
}

export function HotelMarkerLegend({ onFilterChange }: HotelMarkerLegendProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-3">
      <p className="text-xs font-semibold text-gray-700 mb-2">Hotel Price Levels</p>
      <div className="space-y-1">
        {[
          { level: 1, label: "Budget", color: "#22c55e" },
          { level: 2, label: "Moderate", color: "#3b82f6" },
          { level: 3, label: "Expensive", color: "#f59e0b" },
          { level: 4, label: "Luxury", color: "#8b5cf6" },
        ].map((item) => (
          <button
            key={item.level}
            onClick={() => onFilterChange?.(item.level)}
            className="flex items-center gap-2 w-full hover:bg-gray-50 rounded px-2 py-1 transition-colors"
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-600">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
