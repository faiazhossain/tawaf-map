"use client";

import { MapPin, Star, Navigation, Phone, Globe, X } from "lucide-react";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";
import type { Hotel, HotelAmenity } from "@/types/hotel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useMapRouting } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";

interface HotelInfoPanelProps {
  hotel: Hotel;
  onClose?: () => void;
  onShowOnMap?: () => void;
  onStartRoute?: () => void;
}

const AMENITY_ICONS: Record<HotelAmenity, string> = {
  wifi: "WiFi",
  restaurant: "Restaurant",
  parking: "Parking",
  pool: "Pool",
  gym: "Gym",
  spa: "Spa",
  prayer_room: "Prayer",
  shuttle: "Shuttle",
  room_service: "Service",
  ac: "AC",
  elevator: "Elevator",
};

export function HotelInfoPanel({ hotel, onClose, onShowOnMap, onStartRoute }: HotelInfoPanelProps) {
  const { calculateRoute, isCalculating } = useMapRouting();
  const [isRouting, setIsRouting] = useState(false);

  const handleGetDirections = async () => {
    setIsRouting(true);
    await calculateRoute(hotel.location.coordinates);
    setIsRouting(false);
    onStartRoute?.();
  };

  const getPriceColor = () => {
    switch (hotel.priceLevel) {
      case 1:
        return "text-green-600 dark:text-green-400";
      case 2:
        return "text-blue-600 dark:text-blue-400";
      case 3:
        return "text-amber-600 dark:text-amber-400";
      case 4:
        return "text-purple-600 dark:text-purple-400";
    }
  };

  const getPriceLabel = () => {
    return "$".repeat(hotel.priceLevel);
  };

  return (
    <Card className="absolute top-4 right-4 w-80 max-h-[calc(100vh-2rem)] z-10 overflow-hidden flex flex-col shadow-xl">
      {/* Header */}
      <div className="relative h-32 bg-gradient-to-br from-primary to-primary/80">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-black/30 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-primary-foreground" />
        </button>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-semibold text-primary-foreground drop-shadow-md">
            {hotel.name}
          </h3>
          <p className="text-sm text-primary-foreground/90 drop-shadow-md">{hotel.nameAr}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Rating and Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(hotel.starRating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{hotel.starRating} Star</span>
          </div>
          <Badge variant="secondary" className={getPriceColor()}>
            {getPriceLabel()}
          </Badge>
        </div>

        {/* Distance Info */}
        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Distance to Haram</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatDistance(hotel.distanceToHaram)}
              </p>
              <p className="text-xs text-muted-foreground">Walking distance</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatWalkingTime(hotel.walkingTime)}
              </p>
              <p className="text-xs text-muted-foreground">Walking time</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Address</p>
          <p className="text-sm text-foreground">{hotel.location.address}</p>
          <p className="text-sm text-muted-foreground" dir="rtl">
            {hotel.location.addressAr}
          </p>
        </div>

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.map((amenity) => (
                <Badge
                  key={amenity}
                  variant="outline"
                  className="text-xs"
                  title={amenity.replace(/_/g, " ")}
                >
                  {AMENITY_ICONS[amenity] || amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {hotel.contact && (hotel.contact.phone || hotel.contact.website) && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Contact</p>
            <div className="space-y-1">
              {hotel.contact.phone && (
                <a
                  href={`tel:${hotel.contact.phone}`}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  {hotel.contact.phone}
                </a>
              )}
              {hotel.contact.website && (
                <a
                  href={`https://${hotel.contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{hotel.contact.website}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2 bg-muted/20">
        <Button
          onClick={handleGetDirections}
          disabled={isCalculating || isRouting}
          className="w-full"
        >
          {isCalculating || isRouting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2" />
              Calculating route...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </>
          )}
        </Button>
        <Button onClick={onShowOnMap} variant="outline" className="w-full">
          Show on Map
        </Button>
      </div>
    </Card>
  );
}
