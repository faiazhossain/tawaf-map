"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plane,
  Moon,
  MapPin,
  Users,
  User,
  Accessibility,
  BookOpen,
  ChevronLeft,
  Check,
  Sparkles,
  PlaneTakeoff,
  Building2,
  Turtle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useUmrahGuideStore, miqatIdForTravelPath } from "@/lib/store/umrahGuideStore";
import { resolveMiqatForTravelPath, getMiqatById } from "@/lib/data/umrah/miqat";
import type { TravelPath, TravelGroup, Madhhab, UmrahProfile } from "@/types/umrah";

/**
 * ওমরাহ গাইড অনবোর্ডিং উইজার্ড
 *
 * বাংলা-প্রথম সংক্ষিপ্ত উইজার্ড যা ব্যক্তিগতকৃত ফ্লো নির্ধারণ করে:
 * লিঙ্গ -> যাত্রাপথ -> (নারী হলে) সঙ্গ -> প্রবেশযোগ্যতা -> মাযহাব -> শুরু।
 */

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description?: string;
  note?: string;
}

function OptionCard({ selected, onClick, icon, title, description, note }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
        selected
          ? "bg-primary/15 border-primary ring-1 ring-primary/40"
          : "bg-muted/50 border-border/60 hover:bg-muted hover:border-border"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", selected ? "text-foreground" : "text-foreground")}>
          {title}
          {note && (
            <span className="ml-1.5 text-xs font-normal italic text-muted-foreground">{note}</span>
          )}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {selected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
    </button>
  );
}

const TRAVEL_OPTIONS: { value: TravelPath; icon: React.ReactNode; title: string; desc: string }[] =
  [
    {
      value: "air-dhaka-jeddah",
      icon: <PlaneTakeoff className="w-5 h-5" />,
      title: "ঢাকা → জেদ্দা (বিমানে)",
      desc: "সবচেয়ে প্রচলিত যাত্রাপথ। বিমানে মিকাত অতিক্রম করার আগে ইহরাম বাঁধতে হবে।",
    },
    {
      value: "via-madinah",
      icon: <Plane className="w-5 h-5" />,
      title: "মদিনা হয়ে",
      desc: "মিকাত: যুল-হুলাইফা (আবিয়ার আলী)",
    },
    {
      value: "already-in-makkah",
      icon: <Building2 className="w-5 h-5" />,
      title: "ইতিমধ্যে মক্কায়",
      desc: "মিকাত: আত-তানঈম (মসজিদে আয়িশা)",
    },
    {
      value: "already-in-jeddah",
      icon: <MapPin className="w-5 h-5" />,
      title: "ইতিমধ্যে জেদ্দায়",
      desc: "আপনার অবস্থান অনুযায়ী মিকাত ও ইহরামের নির্দেশনা দেখুন।",
    },
    {
      value: "other",
      icon: <MapPin className="w-5 h-5" />,
      title: "অন্যান্য / নিশ্চিত নই",
      desc: "ম্যাপে আপনার জন্য প্রযোজ্য মিকাত খুঁজে নিন।",
    },
  ];

const MADHHAB_OPTIONS: { value: Madhhab; title: string; note?: string }[] = [
  { value: "all", title: "সব মত দেখুন", note: "(প্রস্তাবিত)" },
  { value: "hanafi", title: "হানাফি" },
  { value: "shafii", title: "শাফেয়ি" },
  { value: "maliki", title: "মালিকি" },
  { value: "hanbali", title: "হাম্বলি" },
];

export function UmrahOnboarding({ onClose }: { onClose?: () => void }) {
  const setProfile = useUmrahGuideStore((s) => s.setProfile);

  // উইজার্ড অবস্থা
  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [travelPath, setTravelPath] = useState<TravelPath | null>(null);
  const [travelGroup, setTravelGroup] = useState<TravelGroup | null>(null);
  const [hasMahram, setHasMahram] = useState<boolean | null>(null);
  const [wheelchair, setWheelchair] = useState(false);
  const [slowPace, setSlowPace] = useState(false);
  const [madhhab, setMadhhab] = useState<Madhhab>("all");

  // ডায়ালগ অ্যাক্সেসিবিলিটি: focus trap + Escape বন্ধ + body scroll lock।
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // নারী হলে সঙ্গ-ধাপ যোগ হয়; নাহলে বাদ যায়
  const needsCompanionship = gender === "female";
  const totalSteps = needsCompanionship ? 5 : 4;

  const canProceed = (): boolean => {
    if (step === 0) return gender !== null;
    if (step === 1) return travelPath !== null;
    if (step === 2 && needsCompanionship) return travelGroup !== null;
    return true; // accessibility ও madhhab ধাপ ঐচ্ছিক
  };

  const handleFinish = () => {
    if (!gender || !travelPath) return;
    const profile: UmrahProfile = {
      gender,
      travelPath,
      travelGroup: travelGroup ?? undefined,
      hasMahram: gender === "female" ? (hasMahram ?? undefined) : undefined,
      accessibility: wheelchair || slowPace ? { wheelchair, slowPace } : undefined,
      madhhab,
      miqatId: miqatIdForTravelPath(travelPath) ?? "",
    };
    setProfile(profile);
    onClose?.();
  };

  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const mapping = travelPath ? resolveMiqatForTravelPath(travelPath) : null;
  const miqat = mapping?.miqatId ? getMiqatById(mapping.miqatId) : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="umrah-onboarding-title"
        className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col bg-surface sm:rounded-2xl rounded-t-3xl border border-border/60 shadow-2xl overflow-hidden"
      >
        {/* হেডার */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/20 to-primary/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Moon className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 id="umrah-onboarding-title" className="text-base font-bold text-foreground">
                ওমরাহ গাইড
              </h2>
              <p className="text-[11px] text-primary">আপনার জন্য ধাপে ধাপে নির্দেশনা</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              বন্ধ
            </button>
          )}
        </div>

        {/* অগ্রগতি */}
        <div className="px-5 pt-3">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < step ? "bg-primary" : i === step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            ধাপ {toBengaliNumber(step + 1)} / {toBengaliNumber(totalSteps)}
          </p>
        </div>

        {/* বিষয়বস্তু */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          {/* ধাপ ১: লিঙ্গ */}
          {step === 0 && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-foreground mb-1">আপনি কি পুরুষ, নাকি নারী?</p>
              <p className="text-xs text-muted-foreground mb-3">
                আপনার উত্তরের ভিত্তিতে প্রস্তুতি, তওয়াফ এবং চুল কাটার বিষয়ে প্রয়োজনীয় নির্দেশনা
                দেখানো হবে।
              </p>
              <OptionCard
                selected={gender === "male"}
                onClick={() => setGender("male")}
                icon={<User className="w-5 h-5" />}
                title="পুরুষ"
              />
              <OptionCard
                selected={gender === "female"}
                onClick={() => setGender("female")}
                icon={<User className="w-5 h-5" />}
                title="নারী"
              />
            </div>
          )}

          {/* ধাপ ২: যাত্রাপথ */}
          {step === 1 && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-foreground mb-1">
                আপনি কোথা থেকে মক্কায় আসছেন?
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                আপনার যাত্রাপথ অনুযায়ী মিকাত ও ইহরাম সম্পর্কিত প্রয়োজনীয় নির্দেশনা দেখানো হবে।
              </p>
              {TRAVEL_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  selected={travelPath === opt.value}
                  onClick={() => setTravelPath(opt.value)}
                  icon={opt.icon}
                  title={opt.title}
                  description={opt.desc}
                />
              ))}
              {mapping?.warning && (
                <div className="mt-2 p-3 rounded-xl bg-warning/10 border border-warning/30">
                  <p className="text-xs text-warning leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{mapping.warning.bn}</span>
                  </p>
                </div>
              )}
              {miqat && (
                <p className="text-xs text-primary mt-1">
                  আপনার মিকাত: <span className="font-semibold">{miqat.name.bn}</span>
                </p>
              )}
            </div>
          )}

          {/* ধাপ ৩ (নারী): সঙ্গ ও মাহরাম */}
          {step === 2 && needsCompanionship && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-foreground mb-1">আপনি কার সাথে ভ্রমণ করছেন?</p>
              <OptionCard
                selected={travelGroup === "family"}
                onClick={() => {
                  setTravelGroup("family");
                  setHasMahram(true);
                }}
                icon={<Users className="w-5 h-5" />}
                title="পরিবারের সাথে (মাহরাম আছে)"
                description="স্বামী/পিতা/ভাই সহ"
              />
              <OptionCard
                selected={travelGroup === "group"}
                onClick={() => setTravelGroup("group")}
                icon={<Users className="w-5 h-5" />}
                title="দলের সাথে"
                description="সংগঠিত গ্রুপে"
              />
              <OptionCard
                selected={travelGroup === "solo"}
                onClick={() => setTravelGroup("solo")}
                icon={<User className="w-5 h-5" />}
                title="একা"
              />
              <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  দ্রষ্টব্য: মাহরাম বিষয়ে আলেমদের মতভেদ আছে। অধিকাংশ (হানাফী, হাম্বলী) মতে মাহরাম
                  আবশ্যক; শাফেয়ী ও একটি মালেকী মতে নিরাপদ দলে ভ্রমণ জায়েজ। অ্যাপ উভয় মত দেখায়,
                  রায় দেয় না। বর্তমান সৌদি ভিসা নীতির জন্য Nusuk দেখুন।
                </p>
              </div>
            </div>
          )}

          {/* ধাপ: প্রবেশযোগ্যতা */}
          {((step === 3 && needsCompanionship) || (step === 2 && !needsCompanionship)) && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <Accessibility className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  বিশেষ সহায়তা প্রয়োজন? (ঐচ্ছিক)
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                আপনার প্রয়োজন অনুযায়ী গেট ও চলার পথের নির্দেশনা আরও উপযোগী করে দেওয়া হবে।
                প্রয়োজন না থাকলে এই ধাপটি এড়িয়ে যেতে পারেন।
              </p>
              <label
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  wheelchair
                    ? "bg-primary/15 border-primary"
                    : "bg-muted/50 border-border/60 hover:bg-muted"
                )}
              >
                <input
                  type="checkbox"
                  checked={wheelchair}
                  onChange={(e) => setWheelchair(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <Accessibility className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">হুইলচেয়ার ব্যবহার করব</span>
              </label>
              <label
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  slowPace
                    ? "bg-primary/15 border-primary"
                    : "bg-muted/50 border-border/60 hover:bg-muted"
                )}
              >
                <input
                  type="checkbox"
                  checked={slowPace}
                  onChange={(e) => setSlowPace(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <Turtle className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground block">ধীরে চলার উপযোগী পথ চাই</span>
                  <span className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    বয়স্ক বা শারীরিকভাবে দুর্বল ব্যক্তিদের জন্য
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* ধাপ: মাযহাব */}
          {((step === 4 && needsCompanionship) || (step === 3 && !needsCompanionship)) && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  মাযহাব <span className="font-normal italic text-muted-foreground">(ঐচ্ছিক)</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                কোনো ভুল বা প্রয়োজনীয় সংশোধনের ক্ষেত্রে আপনার নির্বাচিত মাযহাব অনুযায়ী নির্দেশনা
                দেখানো হবে। নিশ্চিত না হলে{" "}
                <span className="font-medium text-foreground">&ldquo;সব মত&rdquo;</span> নির্বাচন
                করুন।
              </p>
              {MADHHAB_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  selected={madhhab === opt.value}
                  onClick={() => setMadhhab(opt.value)}
                  icon={<BookOpen className="w-4 h-4" />}
                  title={opt.title}
                  note={opt.note}
                />
              ))}
            </div>
          )}
        </div>

        {/* ফুটার */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border bg-surface">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={back} className="text-foreground">
              <ChevronLeft className="w-4 h-4" /> পেছনে
            </Button>
          ) : (
            <div />
          )}
          {step < totalSteps - 1 ? (
            <Button
              onClick={next}
              disabled={!canProceed()}
              size="sm"
              className="ml-auto bg-primary hover:bg-primary-hover text-primary-foreground border-0"
            >
              পরবর্তী
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              size="sm"
              className="ml-auto bg-primary hover:bg-primary-hover text-primary-foreground border-0 gap-2"
            >
              <Check className="w-4 h-4" /> গাইড শুরু করুন
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
