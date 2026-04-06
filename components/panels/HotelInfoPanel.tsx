"use client";

import { useState } from "react";
import { MapPin, Star, Navigation, Phone, Globe, X } from "lucide-react";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";
import type { Hotel, HotelAmenity } from "@/types/hotel";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useMapRouting } from "@/lib/hooks";
import { usePanelStore } from "@/lib/store";

interface HotelInfoPanelProps {
  hotel: Hotel;
  onClose?: () => void;
  onShowOnMap?: () => void;
  onStartRoute?: () => void;
}

const AMENITY_ICONS: Record<HotelAmenity, string> = {
  wifi: "ওয়াইফাই",
  restaurant: "রেস্টুরেন্ট",
  parking: "পার্কিং",
  pool: "পুল",
  gym: "জিম",
  spa: "স্পা",
  prayer_room: "প্রার্থনা রুম",
  shuttle: "শাটল",
  room_service: "রুম সার্ভিস",
  ac: "এসি",
  elevator: "লিফট",
};

function HotelInfoContent({
  hotel,
  isCalculating,
  isRouting,
  onGetDirections,
  onShowOnMap,
}: {
  hotel: Hotel;
  isCalculating: boolean;
  isRouting: boolean;
  onGetDirections: () => void;
  onShowOnMap?: () => void;
}) {
  const getPriceColor = () => {
    switch (hotel.priceLevel) {
      case 1:
        return "text-emerald-400";
      case 2:
        return "text-blue-400";
      case 3:
        return "text-amber-400";
      case 4:
        return "text-purple-400";
    }
  };

  const getPriceLabel = () => {
    return "$".repeat(hotel.priceLevel);
  };

  return (
    <>
      {/* Header */}
      <div className="relative h-32 sm:h-28 bg-emerald-600 -mx-4 -mt-2 sm:mx-0 sm:mt-0">
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-3 sm:left-4 sm:right-4">
          <h3 className="text-xl sm:text-lg font-bold text-white drop-shadow-md">{hotel.name}</h3>
          <p className="text-sm text-white/90 drop-shadow-md" dir="rtl">
            {hotel.nameAr}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* Rating and Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(hotel.starRating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm text-slate-400">{hotel.starRating} স্টার</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-lg">
            <span className={`font-bold ${getPriceColor()}`}>{getPriceLabel()}</span>
          </div>
        </div>

        {/* Distance Info Card */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">হারাম থেকে দূরত্ব</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">
                {formatDistance(hotel.distanceToHaram)}
              </p>
              <p className="text-xs text-slate-500">হাঁটার দূরত্ব</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {formatWalkingTime(hotel.walkingTime)}
              </p>
              <p className="text-xs text-slate-500">হাঁটার সময়</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <p className="text-xs text-slate-500 mb-1">ঠিকানা</p>
          <p className="text-sm text-slate-300">{hotel.location.address}</p>
          <p className="text-sm text-slate-500" dir="rtl">
            {hotel.location.addressAr}
          </p>
        </div>

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">সুবিধা সমূহ</p>
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300"
                  title={amenity.replace(/_/g, " ")}
                >
                  {AMENITY_ICONS[amenity] || amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {hotel.contact && (hotel.contact.phone || hotel.contact.website) && (
          <div>
            <p className="text-xs text-slate-500 mb-2">যোগাযোগ</p>
            <div className="space-y-2">
              {hotel.contact.phone && (
                <a
                  href={`tel:${hotel.contact.phone}`}
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {hotel.contact.phone}
                </a>
              )}
              {hotel.contact.website && (
                <a
                  href={`https://${hotel.contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="truncate">{hotel.contact.website}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="space-y-2">
        <Button
          onClick={onGetDirections}
          disabled={isCalculating || isRouting}
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg"
        >
          {isCalculating || isRouting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              রুট বের করা হচ্ছে...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              দিক নির্দেশনা দেখুন
            </>
          )}
        </Button>
        {onShowOnMap && (
          <Button
            onClick={onShowOnMap}
            variant="outline"
            className="w-full border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white"
          >
            ম্যাপে দেখুন
          </Button>
        )}
      </div>
    </>
  );
}

export function HotelInfoPanel({ hotel, onClose, onShowOnMap, onStartRoute }: HotelInfoPanelProps) {
  const { calculateRoute, isCalculating } = useMapRouting();
  const { activePanel, setActivePanel } = usePanelStore();
  const [isRouting, setIsRouting] = useState(false);

  const handleGetDirections = async () => {
    setIsRouting(true);
    await calculateRoute(hotel.location.coordinates);
    setIsRouting(false);
    onStartRoute?.();
  };

  const handleClose = () => {
    setActivePanel(null);
    onClose?.();
  };

  // Mobile bottom sheet
  const mobileContent = (
    <BottomSheet
      open={activePanel === "hotel"}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      snapPoints={[0.3, 0.6, 0.92]}
      defaultSnap={1}
      showBackdrop={false}
      className="max-h-[90dvh]"
    >
      <BottomSheet.Header>
        <BottomSheet.CloseButton />
      </BottomSheet.Header>
      <div className="px-4 pb-4">
        <HotelInfoContent
          hotel={hotel}
          isCalculating={isCalculating}
          isRouting={isRouting}
          onGetDirections={handleGetDirections}
          onShowOnMap={onShowOnMap}
        />
      </div>
    </BottomSheet>
  );

  // Desktop floating panel
  const desktopContent = (
    <div className="absolute top-4 right-4 z-[100] w-80 max-h-[calc(100vh-2rem)]">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/20 hover:bg-black/30 rounded-xl transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
          <HotelInfoContent
            hotel={hotel}
            isCalculating={isCalculating}
            isRouting={isRouting}
            onGetDirections={handleGetDirections}
            onShowOnMap={onShowOnMap}
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
