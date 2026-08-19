"use client";

import { Check, Star, Phone, Clock, MapPin, BadgeCheck } from "lucide-react";
import { NEARBY_CATEGORY_META } from "@/lib/nearby/categories";
import { HOTEL_AMENITIES_LABELS } from "@/lib/data/hotels";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import type { NearbyItem } from "@/types/nearby";
import type { Gate } from "@/types/gate";
import type { Hotel } from "@/types/hotel";
import type { TouristPlace } from "@/types/tourist-place";
import type { POI } from "@/types/poi";

/** সারাংশ তথ্য-চিপ (ডিটেইল শিট ও মোডাল উভয়ে) */
function InfoChip({ icon: Icon, label }: { icon: typeof Clock; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-muted/70 px-2.5 py-1 text-xs font-medium text-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
      {label}
    </span>
  );
}

/**
 * বিভাগ-ভিত্তিক পূর্ণ তথ্য — মোডালের বডি। NearbyItem.source থেকে
 * মূল রেকর্ডের সব তথ্য (গেটের সুবিধা, হোটেলের অ্যামেনিটি, ঐতিহাসিক
 * বিবরণ, POI-এর খাবার-তথ্য) বাংলায় সাজায়।
 */
export function NearbyDetailFullContent({ item }: { item: NearbyItem }) {
  const meta = NEARBY_CATEGORY_META[item.category];

  return (
    <div className="space-y-4">
      {/* দূরত্ব/সময় */}
      <div className="flex flex-wrap gap-2">
        <InfoChip icon={MapPin} label={`${item.distanceFormatted} • ${item.direction} দিকে`} />
        <InfoChip icon={Clock} label={`${item.walkingTimeFormatted} হেঁটে`} />
        {typeof item.rating === "number" && (
          <InfoChip icon={Star} label={`${toBengaliNumber(item.rating)} রেটিং (${meta.label})`} />
        )}
      </div>

      {/* বিভাগ-নির্দিষ্ট বিবরণ */}
      {item.category === "gate" && <GateDetails gate={item.source as Gate} />}
      {item.category === "hotel" && <HotelDetails hotel={item.source as Hotel} />}
      {item.category === "historical" && <PlaceDetails place={item.source as TouristPlace} />}
      {item.category !== "gate" && item.category !== "hotel" && item.category !== "historical" && (
        <PoiDetails poi={item.source as POI} />
      )}
    </div>
  );
}

function GateDetails({ gate }: { gate: Gate }) {
  const facilityLabels: Record<string, string> = {
    escalator: "এসকালেটর",
    elevator: "লিফট",
    restroom: "টয়লেট",
    wheelchair: "হুইলচেয়ার-বান্ধব",
    vending: "ভেন্ডিং মেশিন",
  };
  return (
    <>
      {gate.location.coordinates && null}
      {gate.facilities.length > 0 && (
        <section>
          <h4 className="mb-1.5 text-sm font-semibold text-foreground">সুবিধা</h4>
          <div className="flex flex-wrap gap-2">
            {gate.facilities.map((facility) => (
              <span
                key={facility}
                className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary"
              >
                <Check className="h-3 w-3" aria-hidden />
                {facilityLabels[facility] ?? facility}
              </span>
            ))}
          </div>
        </section>
      )}
      {gate.nearestLandmarks.length > 0 && (
        <section>
          <h4 className="mb-1.5 text-sm font-semibold text-foreground">নিকটবর্তী ল্যান্ডমার্ক</h4>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
            {gate.nearestLandmarks.map((landmark) => (
              <li key={landmark}>{landmark}</li>
            ))}
          </ul>
        </section>
      )}
      {gate.suitableFor?.map((entry) => (
        <p
          key={entry.stepId}
          className="rounded-xl bg-primary-soft px-3 py-2 text-sm leading-relaxed text-foreground"
        >
          {entry.note.bn}
        </p>
      ))}
    </>
  );
}

function HotelDetails({ hotel }: { hotel: Hotel }) {
  return (
    <>
      <section>
        <h4 className="mb-1.5 text-sm font-semibold text-foreground">
          {toBengaliNumber(hotel.starRating)} তারা • হারাম থেকে{" "}
          {toBengaliNumber(hotel.distanceToHaram)} মি
        </h4>
        <div className="flex flex-wrap gap-2">
          {hotel.amenities.map((amenity) => (
            <span
              key={amenity}
              className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary"
            >
              <Check className="h-3 w-3" aria-hidden />
              {HOTEL_AMENITIES_LABELS[amenity]?.en ?? amenity}
            </span>
          ))}
        </div>
      </section>
      <section className="space-y-1 text-sm text-muted-foreground">
        <p>{hotel.location.address}</p>
        {hotel.contact?.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-primary" aria-hidden />
            {hotel.contact.phone}
          </p>
        )}
        {hotel.contact?.website && <p className="text-primary">{hotel.contact.website}</p>}
      </section>
    </>
  );
}

function PlaceDetails({ place }: { place: TouristPlace }) {
  return (
    <>
      <p className="text-sm leading-relaxed text-foreground">{place.description.short}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{place.description.full}</p>
      <section className="rounded-xl bg-muted/60 p-3 text-sm text-foreground">
        <h4 className="mb-1 font-semibold">ভ্রমণ তথ্য</h4>
        <p className="text-muted-foreground">সেরা সময়: {place.visitingInfo.bestTimeToVisit}</p>
        <p className="text-muted-foreground">সময় লাগবে: {place.visitingInfo.duration}</p>
        {place.location.address && (
          <p className="mt-1 text-muted-foreground">{place.location.address}</p>
        )}
      </section>
      {place.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function PoiDetails({ poi }: { poi: POI }) {
  const priceLabels = ["", "সাশ্রয়ী", "মধ্যম", "দামি", "বিলাসবহুল"];
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {poi.halal === true && (
          <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            হালাল
          </span>
        )}
        {poi.halal === false && (
          <span className="rounded-full bg-error/10 px-2.5 py-1 text-xs font-semibold text-error">
            হালাল নয়
          </span>
        )}
        {poi.prayerFriendly && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            নামাজের ব্যবস্থা
          </span>
        )}
        {poi.priceLevel && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {priceLabels[poi.priceLevel]}
          </span>
        )}
      </div>
      <section className="space-y-1 text-sm text-muted-foreground">
        {poi.location.address && <p>{poi.location.address}</p>}
        {poi.openingHours && (
          <p className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
            {poi.openingHours}
          </p>
        )}
        {poi.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-primary" aria-hidden />
            {poi.phone}
          </p>
        )}
      </section>
    </>
  );
}
