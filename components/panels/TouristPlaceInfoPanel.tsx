"use client";

import { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Navigation,
  X,
  Clock,
  Star,
  Info,
  Mountain,
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
  Trees,
  Star as ReligiousIcon,
} from "lucide-react";
import { formatDistance, formatWalkingTime } from "@/lib/utils/distance";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useMapRouting } from "@/lib/hooks";
import { usePanelStore, useTouristPlaceStore } from "@/lib/store";
import type { TouristPlace } from "@/types/tourist-place";

interface TouristPlaceInfoPanelProps {
  place: TouristPlace;
  onClose?: () => void;
}

// বিভাগ কনফিগারেশন — সব বিভাগ একই প্রাথমিক রঙ (emerald) ব্যবহার করে; আইকন পার্থক্য দেয়।
// আগের ১১টি রঙের বিভাজন (amber/purple/green/rose/indigo/...) সরানো হয়েছে।
const categoryConfigs = {
  historical_site: { label: "ঐতিহাসিক স্থান", icon: Landmark },
  mosque: { label: "মসজিদ", icon: Building2 },
  museum: { label: "জাদুঘর", icon: Building2 },
  park: { label: "পার্ক", icon: TreePine },
  mountain: { label: "পাহাড়", icon: Mountain },
  shopping: { label: "কেনাকাটা", icon: ShoppingBag },
  cultural_center: { label: "সাংস্কৃতিক কেন্দ্র", icon: Library },
  landmark: { label: "ল্যান্ডমার্ক", icon: MapPin },
  agriculture: { label: "কৃষি", icon: Leaf },
  religious_site: { label: "ধর্মীয় স্থান", icon: ReligiousIcon },
  cemetery: { label: "কবরস্থান", icon: Trees },
} as const;

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* হেডার: ছবি + প্রাথমিক রঙের ওভারলে */}
      <div className="relative h-40 sm:h-36 bg-primary shrink-0">
        {place.images?.main && (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={place.images.main}
              alt={place.name}
              fill
              sizes="(max-width: 640px) 100vw, 400px"
              loading="lazy"
              className="object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-primary opacity-70" />
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-3 sm:left-4 sm:right-4">
          {/* জনপ্রিয়তা ব্যাজ */}
          {place.popular && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gold rounded-full">
                <Star className="w-3 h-3 fill-primary-foreground text-primary-foreground" />
                <span className="text-[10px] font-semibold text-primary-foreground">জনপ্রিয়</span>
              </div>
              {place.rating && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur rounded-full">
                  <Star className="w-3 h-3 fill-white text-primary-foreground" />
                  <span className="text-[10px] font-semibold text-primary-foreground">
                    {toBengaliNumber(place.rating)}
                  </span>
                </div>
              )}
            </div>
          )}
          <h3 className="text-xl sm:text-lg font-bold text-primary-foreground drop-shadow-md">
            {place.nameBn || place.name}
          </h3>
          <p className="text-sm text-primary-foreground/90 drop-shadow-md" dir="rtl">
            {place.nameAr}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-soft border border-primary/20 rounded-full">
              <IconComponent className="w-3 h-3 text-primary-foreground" />
              <span className="text-[10px] font-medium text-primary-foreground">
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* স্ক্রলযোগ্য বিষয়বস্তু */}
      <div className="flex-1 overflow-y-auto space-y-4 px-4 scrollbar-tourist">
        {/* সংক্ষিপ্ত বিবরণ */}
        <div className="p-3 bg-muted/50 border border-border/50 rounded-xl">
          <p className="text-sm text-foreground leading-relaxed">{place.description.short}</p>
        </div>

        {/* দূরত্ব কার্ড */}
        {distance !== null && (
          <div className="p-4 bg-primary-soft border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2 text-primary mb-3">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">আপনার দূরত্ব</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-foreground">{formatDistance(distance)}</p>
                <p className="text-xs text-muted-foreground">হাঁটার দূরত্ব</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {walkingTime ? formatWalkingTime(walkingTime) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">হাঁটার সময়</p>
              </div>
            </div>
          </div>
        )}

        {/* ঐতিহাসিক গুরুত্ব */}
        {place.historicalInfo && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">ঐতিহাসিক গুরুত্ব</p>
            </div>
            <div className="p-3 bg-primary-soft border border-primary/20 rounded-xl">
              <p className="text-sm text-foreground mb-2">{place.historicalInfo.significance}</p>
              <div className="flex items-center gap-2 text-xs text-primary">
                <Clock className="w-3 h-3" />
                <span>{place.historicalInfo.period}</span>
              </div>
            </div>
          </div>
        )}

        {/* বিস্তারিত বিবরণ */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">এই স্থান সম্পর্কে</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{place.description.full}</p>
        </div>

        {/* ঐতিহাসিক প্রসঙ্গ */}
        {place.description.historical && (
          <div className="p-3 bg-muted/30 border border-border/30 rounded-xl">
            <p className="text-xs text-primary mb-1 font-medium">ঐতিহাসিক নোট</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {place.description.historical}
            </p>
          </div>
        )}

        {/* ভ্রমণ তথ্য */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">ভ্রমণ তথ্য</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">সেরা সময়</p>
                <p className="text-sm text-foreground">{place.visitingInfo.bestTimeToVisit}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
              <Clock className="w-4 h-4 text-info mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">সময়কাল</p>
                <p className="text-sm text-foreground">{place.visitingInfo.duration}</p>
              </div>
            </div>
          </div>
        </div>

        {/* পোশাক ও প্রবেশাধিকার */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">পোশাকবিধি</p>
            <p className="text-sm text-foreground">{place.visitingInfo.dressCode}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">প্রবেশাধিকার</p>
            <p className="text-sm text-foreground">{place.visitingInfo.accessibility}</p>
          </div>
        </div>

        {/* সুবিধা */}
        {place.visitingInfo.facilities.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">উপলব্ধ সুবিধা</p>
            <div className="flex flex-wrap gap-2">
              {place.visitingInfo.facilities.map((facility) => (
                <span
                  key={facility}
                  className="px-2.5 py-1 bg-muted border border-border rounded-lg text-xs text-foreground"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* টিপস */}
        {place.visitingInfo.tips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-gold" />
              <p className="text-xs text-muted-foreground font-medium">দর্শনার্থী টিপস</p>
            </div>
            <div className="space-y-1.5">
              {place.visitingInfo.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1 h-1 rounded-full bg-primary mt-2" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* খোলার সময় */}
        {place.openingHours && (
          <div className="p-3 bg-info/10 border border-info/20 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-info" />
              <p className="text-xs text-muted-foreground font-medium">খোলার সময়</p>
            </div>
            <p className="text-sm text-foreground">{place.openingHours}</p>
          </div>
        )}

        {/* টিকিট তথ্য */}
        {place.ticketInfo?.required && (
          <div className="p-3 bg-muted/50 border border-border/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground font-medium">টিকিট তথ্য</p>
            </div>
            {place.ticketInfo.price && (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">প্রাপ্তবয়স্ক</p>
                  <p className="text-lg font-bold text-foreground">
                    {toBengaliNumber(place.ticketInfo.price.adult)}{" "}
                    {place.ticketInfo.price.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">শিশু</p>
                  <p className="text-lg font-bold text-foreground">
                    {toBengaliNumber(place.ticketInfo.price.child)}{" "}
                    {place.ticketInfo.price.currency}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* যোগাযোগ */}
        {place.contact && (place.contact.phone || place.contact.website) && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">যোগাযোগ</p>
            <div className="space-y-2">
              {place.contact.phone && (
                <a
                  href={`tel:${place.contact.phone}`}
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
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
                  className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="truncate">{place.contact.website}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ঠিকানা */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">ঠিকানা</p>
          <p className="text-sm text-foreground">{place.location.address}</p>
          {place.location.nearestLandmark && (
            <p className="text-xs text-muted-foreground mt-1">
              কাছাকাছি: {place.location.nearestLandmark}
            </p>
          )}
        </div>

        {/* ট্যাগ */}
        {place.tags.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">ট্যাগ</p>
            <div className="flex flex-wrap gap-1.5">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-muted rounded text-[10px] text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* স্থানাঙ্ক */}
        <div className="p-3 bg-primary-soft border border-primary/20 rounded-xl">
          <p className="text-[10px] text-muted-foreground mb-1">স্থানাঙ্ক</p>
          <p className="text-xs font-mono text-muted-foreground">
            {toBengaliNumber(Number(place.location.coordinates[1].toFixed(6)))},{" "}
            {toBengaliNumber(Number(place.location.coordinates[0].toFixed(6)))}
          </p>
        </div>
      </div>

      {/* ফুটার অ্যাকশন */}
      <div className="p-4 border-t border-border/50 shrink-0">
        <Button
          onClick={onGetDirections}
          disabled={isCalculating || isRouting}
          className="w-full gap-2 bg-primary hover:bg-primary-hover text-primary-foreground border-0 shadow-lg"
        >
          {isCalculating || isRouting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              রুট হিসাব হচ্ছে…
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              দিকনির্দেশনা নিন
            </>
          )}
        </Button>
      </div>
    </div>
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

  // মোবাইল বটম শীট
  const mobileContent = (
    <BottomSheet
      open={activePanel === "tourist-place"}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      snapPoints={[0.6, 0.85]}
      defaultSnap={0}
      showBackdrop={false}
    >
      <BottomSheet.Header>
        <BottomSheet.CloseButton />
      </BottomSheet.Header>
      <div className="flex flex-col h-full overflow-hidden">
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

  // ডেস্কটপ ভাসমান প্যানেল
  const desktopContent = (
    <div className="absolute top-4 right-4 z-[100] w-96 h-[calc(100vh-7rem)]">
      <div className="bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/20 hover:bg-black/30 rounded-xl transition-colors"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>

        <div className="flex-1 overflow-hidden">
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
