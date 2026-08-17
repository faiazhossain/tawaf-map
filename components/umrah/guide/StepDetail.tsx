"use client";

import { Check, ListChecks, AlertTriangle, Lightbulb, BookOpen, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { useUmrahGuideStore, selectIsComplete } from "@/lib/store/umrahGuideStore";
import { getDuasByIds } from "@/lib/data/umrah/duas";
import { recommendGatesForStep, distanceToGate } from "@/lib/data/umrah/gate-recommendation";
import { useLocationStore } from "@/lib/store";
import { formatDistance } from "@/lib/utils/distance";
import { FlightIhramCard } from "@/components/umrah/FlightIhramCard";
import { WheelchairTips } from "@/components/umrah/WheelchairTips";
import { PragmaticReminders } from "@/components/umrah/PragmaticReminders";
import { DuaAudioPlayer } from "@/components/umrah/DuaAudioPlayer";
import { MarkdownText } from "@/components/umrah/guide/MarkdownText";
import { CircuitControl } from "@/components/umrah/guide/CircuitControl";
import { RoundDots } from "@/components/umrah/guide/RoundDots";
import { MiqatInfoButton } from "@/components/umrah/MiqatInfoButton";
import type { UmrahStep } from "@/types/umrah";

/**
 * একটি ধাপের সম্পূর্ণ বিস্তারিত — গাইডে এক সময়ে একটিমাত্র ধাপের জন্য দৃশ্যমান। প্রতিটি ধাপের
 * সমস্ত তথ্য (সারসংক্ষেপ, কী করবেন, নিয়ম, দোয়া, গেট, ইহরাম কার্ড, হুইলচেয়ার টিপ,
 * টিপ, সম্পন্ন টগল, প্রস্থান-রিমাইন্ডার) এই প্যানেলের ভেতরে থাকে, যাতে ব্যবহারকারী
 * একটি ধাপ পড়লে তার সবকিছু এক জায়গায় পান।
 *
 * এক-ধাপ-এ-সময় উপস্থাপনা (পেজিনেশন) এই কম্পোনেন্টটিকে কেবল বর্তমান ধাপের জন্য রেন্ডার করে।
 * বিশুদ্ধ উপস্থাপনমূলক; step প্রপ থেকে সবকিছু পড়ে।
 */
function GateRecommendationCard({ stepId }: { stepId: string }) {
  const latitude = useLocationStore((s) => s.latitude);
  const longitude = useLocationStore((s) => s.longitude);
  const userLocation =
    latitude !== null && longitude !== null ? ([longitude, latitude] as [number, number]) : null;

  const gates = recommendGatesForStep(stepId, userLocation, 2);
  if (gates.length === 0) return null;

  const primary = gates[0];
  const note = primary.suitableFor?.find((s) => s.stepId === stepId)?.note;

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <DoorOpen className="h-3.5 w-3.5 text-primary" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          সুপারিশকৃত গেট
        </p>
      </div>
      <div className="space-y-1.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="text-[13px] font-semibold text-foreground">{primary.name}</p>
        {note && <p className="text-xs leading-relaxed text-foreground">{note.bn}</p>}
        {userLocation && (
          <p className="text-[11px] text-primary">
            আনুমানিক দূরত্ব: {formatDistance(distanceToGate(userLocation, primary))}
          </p>
        )}
        {gates[1] && (
          <p className="border-t border-border/40 pt-1 text-[11px] text-muted-foreground">
            বিকল্প: {gates[1].name}
          </p>
        )}
      </div>
    </div>
  );
}

export function StepDetail({ step, counterValue }: { step: UmrahStep; counterValue: number }) {
  const counter = step.counter;
  const isDone = useUmrahGuideStore((s) => selectIsComplete(s, step.id));
  const markComplete = useUmrahGuideStore((s) => s.markComplete);
  const markIncomplete = useUmrahGuideStore((s) => s.markIncomplete);
  const duas = step.duas ? getDuasByIds(step.duas) : [];

  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-surface/70 p-3.5 text-left">
      {/* সম্পূর্ণ সারসংক্ষেপ — কেবল কাউন্টার ধাপে; হিরো কার্ড তখন প্রতি-চক্কর টিপ
          দেখায়, তাই ধাপের সারসংক্ষেপ এখানেই দৃশ্যমান। কাউন্টারহীন ধাপে হিরো কার্ডই
          সারসংক্ষেপ দেখায়, এখানে পুনরাবৃত্তি হয় না। */}
      {counter ? (
        <p className="text-[13px] leading-relaxed text-foreground">{step.summary.bn}</p>
      ) : null}

      {/* মীকাত তথ্য বোতাম (মিকাতে ইহরাম ধাপে) */}
      {step.id === "ihram-miqat" ? <MiqatInfoButton /> : null}

      {/* বিমানে ইহরাম কার্ড (প্রস্তুতি ও মিকাতে ইহরাম ধাপে) */}
      {(step.id === "prep" || step.id === "ihram-miqat") && <FlightIhramCard />}

      {/* হুইলচেয়ার-সচেতন পরামর্শ */}
      <WheelchairTips stepId={step.id} />

      {/* কী করবেন */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5 text-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">কী করবেন</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
          <MarkdownText content={step.whatToDo.bn} />
        </div>
      </div>

      {/* চক্কর/পাক কাউন্টার — ধাপের ভেতরেই গণনা করুন, উপরে স্ক্রল করতে হবে না। */}
      {counter ? (
        <div className="space-y-2">
          <CircuitControl step={step} />
          <div className="flex items-center justify-between">
            <RoundDots value={counterValue} max={counter.max} />
            <span className="text-[11px] text-muted-foreground">
              {counter.label.bn} {toBengaliNumber(counterValue)}/{toBengaliNumber(counter.max)}
            </span>
          </div>
        </div>
      ) : null}

      {/* সুপারিশকৃত গেট */}
      <GateRecommendationCard stepId={step.id} />

      {/* নিয়ম ও সতর্কতা */}
      {step.rules ? (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">
              নিয়ম ও সতর্কতা
            </p>
          </div>
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-3">
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground">
              {step.rules.bn}
            </p>
          </div>
        </div>
      ) : null}

      {/* দোয়া ও স্মরণবাক্য */}
      {duas.length > 0 ? (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              দোয়া ও স্মরণবাক্য
            </p>
          </div>
          <div className="space-y-2.5">
            {duas.map((dua) => (
              <div key={dua.id} className="rounded-xl border border-border/50 bg-muted/50 p-3">
                <p className="mb-1.5 text-[13px] font-medium text-primary">{dua.title.bn}</p>
                <p className="mb-2 text-right text-base leading-loose text-foreground" dir="rtl">
                  {dua.arabic}
                </p>
                {dua.transliteration ? (
                  <p className="mb-1.5 text-[11px] italic text-muted-foreground">
                    {dua.transliteration}
                  </p>
                ) : null}
                <p className="mb-1.5 text-[13px] leading-relaxed text-foreground">
                  <span className="text-muted-foreground">অর্থ: </span>
                  {dua.translationBn}
                </p>
                <p className="text-[11px] leading-relaxed text-primary/80">{dua.whenToRecite.bn}</p>
                <DuaAudioPlayer dua={dua} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* টিপ */}
      {step.tip ? (
        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
          <p className="text-[12px] leading-relaxed text-foreground">{step.tip.bn}</p>
        </div>
      ) : null}

      {/* সম্পন্ন টগল (শুধু ম্যানুয়াল ধাপের জন্য; কাউন্টার-ম্যাক্স ধাপ স্বয়ংক্রিয়ভাবে সম্পন্ন হয়) */}
      {step.isCompleteWhen !== "counter-max" ? (
        <Button
          onClick={() => (isDone ? markIncomplete(step.id) : markComplete(step.id))}
          variant={isDone ? "outline" : "default"}
          className={cn(
            "w-full gap-2 border-0",
            isDone
              ? "bg-muted text-primary hover:bg-muted"
              : "bg-primary hover:bg-primary-hover text-primary-foreground"
          )}
        >
          <Check className="h-4 w-4" />
          {isDone ? "সম্পন্ন হয়েছে (আবার খুলুন)" : "এই ধাপটি সম্পন্ন করুন"}
        </Button>
      ) : null}

      {/* প্রস্থান-রিমাইন্ডার (শুধু সমাপ্ত ধাপে) */}
      {step.id === "done" ? <PragmaticReminders /> : null}
    </div>
  );
}
