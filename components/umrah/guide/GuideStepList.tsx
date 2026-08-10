"use client";

import { useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ListChecks,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import { useUmrahGuideStore, selectIsComplete } from "@/lib/store/umrahGuideStore";
import { isStepComplete } from "@/lib/data/umrah/sequence";
import { getDuasByIds } from "@/lib/data/umrah/duas";
import { recommendGatesForStep, distanceToGate } from "@/lib/data/umrah/gate-recommendation";
import { useLocationStore } from "@/lib/store";
import { formatDistance } from "@/lib/utils/distance";
import { FlightIhramCard } from "@/components/umrah/FlightIhramCard";
import { WheelchairTips } from "@/components/umrah/WheelchairTips";
import { PragmaticReminders } from "@/components/umrah/PragmaticReminders";
import { DuaAudioPlayer } from "@/components/umrah/DuaAudioPlayer";
import { MarkdownText } from "@/components/umrah/guide/MarkdownText";
import { MiqatInfoButton } from "@/components/umrah/MiqatInfoButton";
import type { UmrahStep } from "@/types/umrah";

/** সুপারিশকৃত গেট কার্ড (প্রবেশ/তওয়াফ/সাঈ ধাপে)। */
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

/**
 * প্রসারিত অবস্থায় একটি ধাপের সম্পূর্ণ বিস্তারিত — একটিমাত্র স্থানে। প্রতিটি ধাপের
 * সমস্ত তথ্য (সারসংক্ষেপ, কী করবেন, নিয়ম, দোয়া, গেট, ইহরাম কার্ড, হুইলচেয়ার টিপ,
 * টিপ, সম্পন্ন টগল, প্রস্থান-রিমাইন্ডার) এই প্যানেলের ভেতরে থাকে, যাতে ব্যবহারকারী
 * একটি ধাপ খুললে তার সবকিছু এক জায়গায় পান — বিচ্ছিন্ন বা পুনরাবৃত্ত নয়।
 * বিশুদ্ধ উপস্থাপনমূলক; step প্রপ থেকে সবকিছু পড়ে।
 */
function StepDetail({ step, counterValue }: { step: UmrahStep; counterValue: number }) {
  const counter = step.counter;
  const isDone = useUmrahGuideStore((s) => selectIsComplete(s, step.id));
  const markComplete = useUmrahGuideStore((s) => s.markComplete);
  const markIncomplete = useUmrahGuideStore((s) => s.markIncomplete);
  const duas = step.duas ? getDuasByIds(step.duas) : [];

  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-surface/70 p-3.5 text-left">
      {/* সম্পূর্ণ সারসংক্ষেপ */}
      <p className="text-[13px] leading-relaxed text-foreground">
        {step.summary.bn}
        {step.id === "ihram-miqat" && <MiqatInfoButton className="ml-1" />}
      </p>

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

      {/* কাউন্টার অবস্থা */}
      {counter ? (
        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
          <span className="text-[11px] text-muted-foreground">{counter.label.bn}</span>
          <span className="text-xs font-semibold text-primary">
            {toBengaliNumber(counterValue)}/{toBengaliNumber(counter.max)}
          </span>
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
          {isDone ? "সম্পন্ন হয়েছে (আবার খুলুন)" : "এই ধাপ সম্পন্ন করুন"}
        </Button>
      ) : null}

      {/* প্রস্থান-রিমাইন্ডার (শুধু সমাপ্ত ধাপে) */}
      {step.id === "done" ? <PragmaticReminders /> : null}
    </div>
  );
}

/** রেলের নোড (বৃত্ত) - সম্পন্ন/বর্তমান/পরবর্তী/ভবিষ্যৎ অবস্থা অনুযায়ী রং (টোকেন)। */
function StepNode({
  index,
  isDone,
  isActive,
  isNext,
}: {
  index: number;
  isDone: boolean;
  isActive: boolean;
  isNext: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
        isDone
          ? "bg-map-route-completed text-primary-foreground"
          : isActive
            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
            : isNext
              ? "bg-muted text-primary ring-1 ring-inset ring-primary/40"
              : "bg-muted text-muted-foreground"
      )}
    >
      {isDone ? <Check className="h-3.5 w-3.5" /> : toBengaliNumber(index + 1)}
    </div>
  );
}

/**
 * ধাপের তালিকা - বাম পাশে অগ্রগতি রেল, প্রতিটি ধাপ একটি অ্যাকর্ডিয়ন সারি। প্রতিটি ধাপের
 * সম্পূর্ণ বিস্তারিত সেই ধাপের নিজস্ব কোলাপসিবলের ভেতরে থাকে (StepDetail)।
 *
 * ইন্টারঅ্যাকশন:
 *  - কোনো ধাপে ট্যাপ করলে সেটি বর্তমান ধাপে পরিণত হয় এবং তার বিস্তারিত প্যানেল খোলে।
 *  - খোলা বর্তমান ধাপে আবার ট্যাপ করলে প্যানেল বন্ধ হয় (টগল)।
 *  - নেক্সট/প্রিভ বা কাউন্টার দিয়ে এগোলে নতুন বর্তমান ধাপ স্বয়ংক্রিয়ভাবে খোলে।
 *
 * অবস্থা স্পষ্টভাবে আলাদা: সম্পন্ন (সবুজ টিক), বর্তমান (টিল, রিং, পালস),
 * পরবর্তী (টিল আউটলাইন), ভবিষ্যৎ (স্লেট)।
 */
export function GuideStepList({ steps, className }: { steps: UmrahStep[]; className?: string }) {
  const currentIndex = useUmrahGuideStore((s) => s.currentIndex);
  const counters = useUmrahGuideStore((s) => s.counters);
  const completed = useUmrahGuideStore((s) => s.completed);
  const goToStep = useUmrahGuideStore((s) => s.goToStep);

  const currentStepId = steps[currentIndex]?.id ?? null;
  const [openId, setOpenId] = useState<string | null>(currentStepId);

  // বাইরে থেকে বর্তমান ধাপ বদলালে (নেক্সট/প্রিভ/কাউন্টার) নতুন ধাপটি খোলে।
  // "রেন্ডারকালীন স্টেট সমন্বয়" প্যাটার্ন: currentIndex বদলালেই শর্তটি সত্য হয় এবং
  // সঙ্গে সঙ্গে openId আপডেট করে। ম্যানুয়াল টগল-বন্ধ এতে ওভাররাইড হয় না (currentIndex অপরিবর্তিত)।
  const prevIndexRef = useRef(currentIndex);
  if (prevIndexRef.current !== currentIndex) {
    prevIndexRef.current = currentIndex;
    setOpenId(currentStepId);
  }

  function handleRowClick(step: UmrahStep, index: number) {
    if (index === currentIndex) {
      // বর্তমান ধাপ: প্যানেল টগল করো (খোলা থাকলে বন্ধ, বন্ধ থাকলে খোলা)
      setOpenId((prev) => (prev === step.id ? null : step.id));
    } else {
      // অন্য ধাপ: সেটি বর্তমান করো ও খোলো
      goToStep(index);
      setOpenId(step.id);
    }
  }

  return (
    <div className={cn("flex flex-col", className)} role="list" aria-label="ওমরাহর ধাপসমূহ">
      {steps.map((step, index) => {
        const cv = counters[step.id] ?? step.counter?.min ?? 0;
        const done = isStepComplete(step, cv, !!completed[step.id]);
        const isActive = index === currentIndex;
        const isNext = index === currentIndex + 1;
        const isOpen = openId === step.id;
        const isLast = index === steps.length - 1;
        const counterText =
          step.counter && cv > 0
            ? `${toBengaliNumber(cv)}/${toBengaliNumber(step.counter.max)}`
            : null;
        const panelId = `step-${step.id}-detail`;

        return (
          <div key={step.id} className="flex gap-2.5" role="listitem">
            {/* অগ্রগতি রেল: নোড ও নিচের সংযোগকারী রেখা। রেখা সেগমেন্টগুলো নোডে স্পর্শ করে
                যেন একটানা দেখায়; সম্পন্ন সেগমেন্ট সবুজ, বাকি স্লেট। */}
            <div className="flex flex-col items-center self-stretch">
              <StepNode index={index} isDone={done} isActive={isActive} isNext={isNext} />
              {!isLast && (
                <span
                  className={cn(
                    "w-0.5 flex-1 rounded-full",
                    done ? "bg-map-route-completed/60" : "bg-muted/60"
                  )}
                />
              )}
            </div>

            {/* সারির বিষয়বস্তু: হেডার বোতাম + প্রসারিত প্যানেল (pb কার্ডের মধ্যে ফাঁক দেয়,
                যা রেলের self-stretch সেগমেন্ট দিয়ে ঢাকা পড়ে) */}
            <div className="min-w-0 flex-1 pb-3">
              <button
                type="button"
                onClick={() => handleRowClick(step, index)}
                aria-current={isActive ? "step" : undefined}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={cn(
                  "w-full rounded-xl border p-2.5 text-left transition-colors",
                  isActive
                    ? "border-primary/60 bg-primary/10"
                    : isNext
                      ? "border-primary/25 bg-muted/40 hover:bg-muted/70"
                      : done
                        ? "border-map-route-completed/30 bg-primary-soft hover:bg-primary/10"
                        : "border-border/40 bg-muted/30 hover:bg-muted/60"
                )}
              >
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "flex-1 truncate text-[13px] font-semibold",
                      isActive
                        ? "text-primary"
                        : done
                          ? "text-map-route-completed"
                          : "text-foreground"
                    )}
                  >
                    {step.title.bn}
                  </p>

                  {isActive && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      বর্তমান
                    </span>
                  )}
                  {isNext && (
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      পরবর্তী
                    </span>
                  )}
                  {done && !isActive && (
                    <span className="rounded-full bg-map-route-completed/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-map-route-completed">
                      সম্পন্ন
                    </span>
                  )}

                  {counterText && (
                    <span className="rounded-full bg-surface/70 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {counterText}
                    </span>
                  )}

                  <ChevronDown
                    className={cn(
                      "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-muted-foreground">
                  {step.summary.bn}
                </p>
              </button>

              {/* প্রসারিত প্যানেল - খোলা অবস্থায় ভেতরের বিষয়বস্তু রেন্ডার হয় (animate-in দিয়ে মসৃণ প্রবেশ)।
                  বাইরের div সবসময় id ধরে রাখে যেন aria-controls সর্বদা বৈধ থাকে। */}
              <div id={panelId}>
                {isOpen ? (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <StepDetail step={step} counterValue={cv} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
