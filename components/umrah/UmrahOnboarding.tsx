"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
}

function OptionCard({ selected, onClick, icon, title, description }: OptionCardProps) {
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
      title: "ঢাকা -> জেদ্দা (বিমানে)",
      desc: "সবচেয়ে সাধারণ পথ - বিমানেই ইহরাম বাঁধতে হবে",
    },
    {
      value: "via-madinah",
      icon: <Plane className="w-5 h-5" />,
      title: "মদিনা হয়ে",
      desc: "মিকাত: যুল-হুলাইফা (আবইয়ার আলী)",
    },
    {
      value: "already-in-makkah",
      icon: <Building2 className="w-5 h-5" />,
      title: "ইতিমধ্যে মক্কায়",
      desc: "মিকাত: আত-তানাইম (মসজিদে আয়িশা)",
    },
    {
      value: "already-in-jeddah",
      icon: <MapPin className="w-5 h-5" />,
      title: "ইতিমধ্যে জেদ্দায়",
      desc: "অবস্থানস্থল থেকেই ইহরাম",
    },
    {
      value: "other",
      icon: <MapPin className="w-5 h-5" />,
      title: "অন্যান্য / নিশ্চিত নই",
      desc: "মিকাত মানচিত্র দেখে নির্বাচন করব",
    },
  ];

const MADHHAB_OPTIONS: { value: Madhhab; title: string }[] = [
  { value: "all", title: "সব মত দেখাও (পরামর্শযোগ্য)" },
  { value: "hanafi", title: "হানাফী" },
  { value: "shafii", title: "শাফেয়ী" },
  { value: "maliki", title: "মালেকী" },
  { value: "hanbali", title: "হাম্বলী" },
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
      <div className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88vh] flex flex-col bg-surface sm:rounded-2xl rounded-t-3xl border border-border/60 shadow-2xl overflow-hidden">
        {/* হেডার */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/20 to-primary/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Moon className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">ওমরাহ গাইড</h2>
              <p className="text-[11px] text-primary">আপনার জন্য ব্যক্তিগতকৃত পথ</p>
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
            ধাপ {step + 1} / {totalSteps}
          </p>
        </div>

        {/* বিষয়বস্তু */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          {/* ধাপ ১: লিঙ্গ */}
          {step === 0 && (
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-foreground mb-1">আপনি কোন লিঙ্গের?</p>
              <p className="text-xs text-muted-foreground mb-3">
                এটি প্রস্তুতি, তওয়াফ ও চুল কাটার নিয়ম ঢালাই করবে।
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
              <p className="text-sm font-medium text-foreground mb-1">আপনি কীভাবে আসছেন?</p>
              <p className="text-xs text-muted-foreground mb-3">
                এটি আপনার মিকাত (ইহরামের সীমানা) নির্ধারণ করবে।
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
                <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs text-amber-300 leading-relaxed flex items-start gap-2">
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
                <p className="text-sm font-medium text-foreground">বিশেষ প্রয়োজন (ঐচ্ছিক)</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                এটি গেট ও পথ সুপারিশে সাহায্য করবে। প্রয়োজন না হলে এড়িয়ে যান।
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
                <span className="text-sm text-foreground">হুইলচেয়ার প্রয়োজন</span>
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
                <span className="text-sm text-foreground">ধীরগতিতে চলতে চাই (বয়স্ক/অসুস্থতা)</span>
              </label>
            </div>
          )}

          {/* ধাপ: মাযহাব */}
          {((step === 4 && needsCompanionship) || (step === 3 && !needsCompanionship)) && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">মাযহাব (ঐচ্ছিক)</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                ভুলের ক্ষেত্রে কাফফারার ব্যাখ্যা এ অনুযায়ী ঢালাই হবে। নিশ্চিত না হলে &ldquo;সব
                মত&rdquo; রাখুন।
              </p>
              {MADHHAB_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  selected={madhhab === opt.value}
                  onClick={() => setMadhhab(opt.value)}
                  icon={<BookOpen className="w-4 h-4" />}
                  title={opt.title}
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
