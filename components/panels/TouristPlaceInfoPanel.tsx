"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  X,
  Clock,
  Star,
  Info,
  Mountain,
  Camera,
  Phone,
  Globe,
  Ticket,
  Heart,
  Sparkles,
  BookOpen,
  TrendingUp,
  Landmark,
  Building2,
  TreePine,
  ShoppingBag,
  Library,
  Leaf,
} from "lucide-react";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useMapRouting } from "@/lib/hooks";
import { usePanelStore, useTouristPlaceStore } from "@/lib/store";
import type { TouristPlace } from "@/types/tourist-place";

interface TouristPlaceInfoPanelProps {
  place: TouristPlace;
  onClose?: () => void;
}

// Category configurations
const categoryConfigs = {
  historical_site: {
    color: "amber",
    label: "Historical Site",
    bg: "bg-amber-600",
    bgLight: "bg-amber-500/10",
    borderLight: "border-amber-500/20",
    textLight: "text-amber-400",
    icon: Landmark,
  },
  mosque: {
    color: "emerald",
    label: "Mosque",
    bg: "bg-emerald-600",
    bgLight: "bg-emerald-500/10",
    borderLight: "border-emerald-500/20",
    textLight: "text-emerald-400",
    icon: Building2, // Using Building2 as mosque icon
  },
  museum: {
    color: "purple",
    label: "Museum",
    bg: "bg-purple-600",
    bgLight: "bg-purple-500/10",
    borderLight: "border-purple-500/20",
    textLight: "text-purple-400",
    icon: Building2,
  },
  park: {
    color: "green",
    label: "Park",
    bg: "bg-green-600",
    bgLight: "bg-green-500/10",
    borderLight: "border-green-500/20",
    textLight: "text-green-400",
    icon: TreePine,
  },
  mountain: {
    color: "stone",
    label: "Mountain",
    bg: "bg-stone-600",
    bgLight: "bg-stone-500/10",
    borderLight: "border-stone-500/20",
    textLight: "text-stone-400",
    icon: Mountain,
  },
  shopping: {
    color: "rose",
    label: "Shopping",
    bg: "bg-rose-600",
    bgLight: "bg-rose-500/10",
    borderLight: "border-rose-500/20",
    textLight: "text-rose-400",
    icon: ShoppingBag,
  },
  cultural_center: {
    color: "indigo",
    label: "Cultural Center",
    bg: "bg-indigo-600",
    bgLight: "bg-indigo-500/10",
    borderLight: "border-indigo-500/20",
    textLight: "text-indigo-400",
    icon: Library,
  },
  landmark: {
    color: "blue",
    label: "Landmark",
    bg: "bg-blue-600",
    bgLight: "bg-blue-500/10",
    borderLight: "border-blue-500/20",
    textLight: "text-blue-400",
    icon: MapPin,
  },
  agriculture: {
    color: "lime",
    label: "Agriculture",
    bg: "bg-lime-600",
    bgLight: "bg-lime-500/10",
    borderLight: "border-lime-500/20",
    textLight: "text-lime-400",
    icon: Leaf,
  },
};

function TouristPlaceInfoContent({
  place,
  distance,
  walkingTime,
  isCalculating,
  isRouting,
  onGetDirections,
}: {
  place: TouristPlace;
  distance: number | null;
  walkingTime: number | null;
  isCalculating: boolean;
  isRouting: boolean;
  onGetDirections: () => void;
}) {
  const config = categoryConfigs[place.category];
  const IconComponent = config.icon;

  return (
    <>
      {/* Header with image and gradient based on category */}
      <div className={`relative h-36 sm:h-32 ${config.bg} -mx-4 -mt-2 sm:mx-0 sm:mt-0`}>
        {/* Background image if available */}
        {place.images?.main && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={place.images.main}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className={`absolute inset-0 ${config.bg} opacity-70`} />
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-3 sm:left-4 sm:right-4">
          {/* Popular badge */}
          {place.popular && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400/90 rounded-full">
                <Star className="w-3 h-3 fill-yellow-800 text-yellow-800" />
                <span className="text-[10px] font-semibold text-yellow-800">Popular</span>
              </div>
              {place.rating && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur rounded-full">
                  <Star className="w-3 h-3 fill-white text-white" />
                  <span className="text-[10px] font-semibold text-white">{place.rating}</span>
                </div>
              )}
            </div>
          )}
          <h3 className="text-xl sm:text-lg font-bold text-white drop-shadow-md">
            {place.nameBn || place.name}
          </h3>
          <p className="text-sm text-white/90 drop-shadow-md" dir="rtl">
            {place.nameAr}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${config.bgLight} ${config.borderLight} border rounded-full`}
            >
              <IconComponent className="w-3 h-3 text-white" />
              <span className="text-[10px] font-medium text-white">{config.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Short Description */}
        <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-300 leading-relaxed">{place.description.short}</p>
        </div>

        {/* Distance Card */}
        {distance !== null && (
          <div className={`p-4 ${config.bgLight} ${config.borderLight} border rounded-xl`}>
            <div className="flex items-center gap-2 ${config.textLight} mb-3">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Your Distance</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{formatDistance(distance)}</p>
                <p className="text-xs text-slate-500">Walking Distance</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {walkingTime ? formatWalkingTime(walkingTime) : "--"}
                </p>
                <p className="text-xs text-slate-500">Walking Time</p>
              </div>
            </div>
          </div>
        )}

        {/* Historical Significance */}
        {place.historicalInfo && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <p className="text-xs text-slate-500 font-medium">Historical Significance</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-sm text-slate-300 mb-2">{place.historicalInfo.significance}</p>
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <Clock className="w-3 h-3" />
                <span>{place.historicalInfo.period}</span>
              </div>
            </div>
          </div>
        )}

        {/* Full Description */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-slate-500" />
            <p className="text-xs text-slate-500 font-medium">About This Place</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{place.description.full}</p>
        </div>

        {/* Historical Context */}
        {place.description.historical && (
          <div className="p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
            <p className="text-xs text-amber-400/80 mb-1 font-medium">Historical Note</p>
            <p className="text-sm text-slate-400 leading-relaxed">{place.description.historical}</p>
          </div>
        )}

        {/* Visiting Information */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-slate-500 font-medium">Visiting Information</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Best Time to Visit</p>
                <p className="text-sm text-slate-300">{place.visitingInfo.bestTimeToVisit}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl">
              <Clock className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Duration</p>
                <p className="text-sm text-slate-300">{place.visitingInfo.duration}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dress Code & Accessibility */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-slate-800/50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Dress Code</p>
            <p className="text-sm text-slate-300">{place.visitingInfo.dressCode}</p>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Accessibility</p>
            <p className="text-sm text-slate-300">{place.visitingInfo.accessibility}</p>
          </div>
        </div>

        {/* Facilities */}
        {place.visitingInfo.facilities.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Available Facilities</p>
            <div className="flex flex-wrap gap-2">
              {place.visitingInfo.facilities.map((facility) => (
                <span
                  key={facility}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {place.visitingInfo.tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <p className="text-xs text-slate-500 font-medium">Visitor Tips</p>
            </div>
            <div className="space-y-1.5">
              {place.visitingInfo.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-slate-400">
                  <div className="w-1 h-1 rounded-full bg-emerald-400 mt-2" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opening Hours */}
        {place.openingHours && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-slate-500 font-medium">Opening Hours</p>
            </div>
            <p className="text-sm text-slate-300">{place.openingHours}</p>
          </div>
        )}

        {/* Ticket Information */}
        {place.ticketInfo?.required && (
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-slate-500 font-medium">Ticket Information</p>
            </div>
            {place.ticketInfo.price && (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500">Adult</p>
                  <p className="text-lg font-bold text-white">
                    {place.ticketInfo.price.adult} {place.ticketInfo.price.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Child</p>
                  <p className="text-lg font-bold text-white">
                    {place.ticketInfo.price.child} {place.ticketInfo.price.currency}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        {place.contact && (place.contact.phone || place.contact.website) && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Contact</p>
            <div className="space-y-2">
              {place.contact.phone && (
                <a
                  href={`tel:${place.contact.phone}`}
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {place.contact.phone}
                </a>
              )}
              {place.contact.website && (
                <a
                  href={`https://${place.contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="truncate">{place.contact.website}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Address */}
        <div>
          <p className="text-xs text-slate-500 mb-1">Address</p>
          <p className="text-sm text-slate-300">{place.location.address}</p>
          {place.location.nearestLandmark && (
            <p className="text-xs text-slate-500 mt-1">Near: {place.location.nearestLandmark}</p>
          )}
        </div>

        {/* Tags */}
        {place.tags.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Coordinates */}
        <div className={`p-3 ${config.bgLight} ${config.borderLight} border rounded-xl`}>
          <p className="text-[10px] text-slate-500 mb-1">Coordinates</p>
          <p className="text-xs font-mono text-slate-400">
            {place.location.coordinates[1].toFixed(6)}, {place.location.coordinates[0].toFixed(6)}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-700/50 -mx-4 mt-auto sm:mx-0">
        <Button
          onClick={onGetDirections}
          disabled={isCalculating || isRouting}
          className={`w-full gap-2 ${config.bg} hover:opacity-90 text-white border-0 shadow-lg`}
        >
          {isCalculating || isRouting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating route...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              Get Directions
            </>
          )}
        </Button>
      </div>
    </>
  );
}

export function TouristPlaceInfoPanel({ place, onClose }: TouristPlaceInfoPanelProps) {
  const { calculateRoute, isCalculating } = useMapRouting();
  const { activePanel, setActivePanel } = usePanelStore();
  const { selectedPlace } = useTouristPlaceStore();
  const [isRouting, setIsRouting] = useState(false);

  const distance = selectedPlace.distance;
  const walkingTime = selectedPlace.walkingTime;

  const handleClose = () => {
    setActivePanel(null);
    onClose?.();
  };

  const handleGetDirections = async () => {
    setIsRouting(true);
    await calculateRoute(place.location.coordinates);
    setIsRouting(false);
  };

  // Mobile bottom sheet
  const mobileContent = (
    <BottomSheet
      open={activePanel === "tourist-place"}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      snapPoints={[0.35, 0.6, 0.95]}
      defaultSnap={1}
      showBackdrop={false}
      className="max-h-[95dvh]"
    >
      <BottomSheet.Header>
        <BottomSheet.CloseButton />
      </BottomSheet.Header>
      <div className="px-4">
        <TouristPlaceInfoContent
          place={place}
          distance={distance}
          walkingTime={walkingTime}
          isCalculating={isCalculating}
          isRouting={isRouting}
          onGetDirections={handleGetDirections}
        />
      </div>
    </BottomSheet>
  );

  // Desktop floating panel
  const desktopContent = (
    <div className="absolute top-4 right-4 z-[100] w-96 max-h-[calc(100vh-2rem)]">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/20 hover:bg-black/30 rounded-xl transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <TouristPlaceInfoContent
            place={place}
            distance={distance}
            walkingTime={walkingTime}
            isCalculating={isCalculating}
            isRouting={isRouting}
            onGetDirections={handleGetDirections}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="block sm:hidden">{mobileContent}</div>
      <div className="hidden sm:block">{desktopContent}</div>
    </>
  );
}
