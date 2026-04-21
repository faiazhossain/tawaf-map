"use client";

import { useState } from "react";
import {
  MapPin,
  Search,
  Filter,
  ChevronDown,
  Star,
  Building2,
  TreePine,
  Mountain,
  ShoppingBag,
  Library,
  Landmark as LandmarkIcon,
  Leaf,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTouristPlaceStore, usePanelStore } from "@/lib/store";
import { TOURIST_PLACES } from "@/lib/data/tourist-places";
import type { TouristPlaceCategory, City } from "@/types/tourist-place";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  historical_site: LandmarkIcon,
  mosque: Building2, // Using Building2 as mosque icon
  museum: Building2,
  park: TreePine,
  mountain: Mountain,
  shopping: ShoppingBag,
  cultural_center: Library,
  landmark: MapPin,
  agriculture: Leaf,
  religious_site: LandmarkIcon,
  cemetery: Minus,
};

const categoryLabels: Record<string, string> = {
  historical_site: "Historical Sites",
  mosque: "Mosques",
  museum: "Museums",
  park: "Parks",
  mountain: "Mountains",
  shopping: "Shopping",
  cultural_center: "Cultural Centers",
  landmark: "Landmarks",
  agriculture: "Agriculture",
  religious_site: "Religious Sites",
  cemetery: "Cemeteries",
};

interface TouristPlacesListProps {
  onPlaceClick?: (placeId: string) => void;
  onCityChange?: (city: "makkah" | "madinah") => void;
  initialCity?: "makkah" | "madinah";
  className?: string;
}

export function TouristPlacesList({
  onPlaceClick,
  onCityChange,
  initialCity = "makkah",
  className = "",
}: TouristPlacesListProps) {
  const { setActivePanel } = usePanelStore();
  const { setPlace, setShowOnMap, showPlacesOnMap, toggleShowOnMap } = useTouristPlaceStore();
  const [searchQuery, setSearchQuery] = useState("");
  // Start with null to show all places by default
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TouristPlaceCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Handle city change and notify parent
  const handleCityChange = (city: City | null) => {
    setSelectedCity(city);
    if (city && onCityChange) {
      onCityChange(city);
    }
  };

  // Filter places
  const filteredPlaces = TOURIST_PLACES.filter((place) => {
    // City filter
    if (selectedCity && place.city !== selectedCity) return false;

    // Category filter
    if (selectedCategory && place.category !== selectedCategory) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        place.name.toLowerCase().includes(query) ||
        (place.nameBn && place.nameBn.toLowerCase().includes(query)) ||
        place.nameAr.includes(query) ||
        place.id.toLowerCase().includes(query) ||
        place.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        place.description.short.toLowerCase().includes(query) ||
        (place.searchTerms && place.searchTerms.some((term) => term.toLowerCase().includes(query)))
      );
    }

    return true;
  });

  const handlePlaceClick = (placeId: string) => {
    const place = TOURIST_PLACES.find((p) => p.id === placeId);
    if (place) {
      setPlace(place);
      setActivePanel("tourist-place");
      setShowOnMap(true);
      onPlaceClick?.(placeId);
    }
  };

  const groupedPlaces = selectedCity
    ? { [selectedCity]: filteredPlaces }
    : {
        makkah: filteredPlaces.filter((p) => p.city === "makkah"),
        madinah: filteredPlaces.filter((p) => p.city === "madinah"),
      };

  return (
    <div
      className={`bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Tourist Places</h2>
          <Button
            onClick={toggleShowOnMap}
            size="sm"
            variant={showPlacesOnMap ? "default" : "outline"}
            className={showPlacesOnMap ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-600"}
          >
            <MapPin className="w-4 h-4 mr-1" />
            {showPlacesOnMap ? "On Map" : "Show on Map"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          size="sm"
          className="w-full border-slate-700 text-slate-300"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          <ChevronDown
            className={`w-4 h-4 ml-auto transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-slate-700/50 space-y-3">
          {/* City Filter */}
          <div>
            <p className="text-xs text-slate-500 mb-2">City</p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleCityChange("makkah")}
                size="sm"
                variant={selectedCity === "makkah" ? "default" : "outline"}
                className={selectedCity === "makkah" ? "bg-purple-600" : "border-slate-700"}
              >
                Makkah
              </Button>
              <Button
                onClick={() => handleCityChange("madinah")}
                size="sm"
                variant={selectedCity === "madinah" ? "default" : "outline"}
                className={selectedCity === "madinah" ? "bg-purple-600" : "border-slate-700"}
              >
                Madinah
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setSelectedCategory(null)}
                size="sm"
                variant={selectedCategory === null ? "default" : "outline"}
                className={selectedCategory === null ? "bg-purple-600" : "border-slate-700"}
              >
                All
              </Button>
              {Object.entries(categoryLabels).map(([key, label]) => {
                const Icon = categoryIcons[key as TouristPlaceCategory];
                return (
                  <Button
                    key={key}
                    onClick={() => setSelectedCategory(key as TouristPlaceCategory)}
                    size="sm"
                    variant={selectedCategory === key ? "default" : "outline"}
                    className={selectedCategory === key ? "bg-purple-600" : "border-slate-700"}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="px-4 py-2 border-b border-slate-700/50 flex justify-between items-center">
        <p className="text-xs text-slate-400">
          {filteredPlaces.length} place{filteredPlaces.length !== 1 ? "s" : ""} found
        </p>
        {(selectedCity || selectedCategory || searchQuery) && (
          <Button
            onClick={() => {
              setSelectedCity(null);
              setSelectedCategory(null);
              setSearchQuery("");
            }}
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Places List */}
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(groupedPlaces).map(
          ([city, places]) =>
            places.length > 0 && (
              <div key={city} className="border-b border-slate-700/50 last:border-b-0">
                <div className="px-4 py-2 bg-slate-800/50 sticky top-0">
                  <p className="text-sm font-semibold text-white capitalize">
                    {city === "makkah" ? "Makkah" : "Madinah"}
                  </p>
                </div>
                {places.map((place) => {
                  const IconComponent = categoryIcons[place.category];
                  return (
                    <button
                      key={place.id}
                      onClick={() => handlePlaceClick(place.id)}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-800/50 transition-colors border-b border-slate-700/30 last:border-b-0"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`p-2 rounded-lg ${getCategoryBgColor(place.category)}`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white truncate">
                            {place.nameBn || place.name}
                          </p>
                          {place.popular && (
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate" dir="rtl">
                          {place.nameAr}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {place.description.short}
                        </p>
                        {place.distanceFromHaram && (
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDistance(place.distanceFromHaram)} from Haram
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
        )}

        {filteredPlaces.length === 0 && (
          <div className="px-4 py-8 text-center">
            <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No places found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryBgColor(category: string): string {
  const colors: Record<string, string> = {
    historical_site: "bg-amber-500",
    mosque: "bg-emerald-500",
    museum: "bg-purple-500",
    park: "bg-green-500",
    mountain: "bg-stone-500",
    shopping: "bg-rose-500",
    cultural_center: "bg-indigo-500",
    landmark: "bg-blue-500",
    agriculture: "bg-lime-500",
    religious_site: "bg-teal-500",
    cemetery: "bg-gray-500",
  };
  return colors[category] || "bg-slate-500";
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
