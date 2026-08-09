"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Minus,
  Plus,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  ListChecks,
  RotateCcw,
  LifeBuoy,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MistakeAssistant } from "./MistakeAssistant";
import { FlightIhramCard } from "./FlightIhramCard";
import { OfflineBadge } from "./OfflineBadge";
import { DuaAudioPlayer } from "./DuaAudioPlayer";
import { LostGroupHelper } from "./LostGroupHelper";
import { WheelchairTips } from "./WheelchairTips";
import { PragmaticReminders } from "./PragmaticReminders";
import { cn } from "@/lib/utils";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { selectCurrentStep, selectCounter, selectIsComplete } from "@/lib/store/umrahGuideStore";
import { getStepById } from "@/lib/data/umrah/steps";
import { getDuasByIds } from "@/lib/data/umrah/duas";
import { recommendGatesForStep, distanceToGate } from "@/lib/data/umrah/gate-recommendation";
import { useLocationStore } from "@/lib/store";
import { formatDistance } from "@/lib/utils/distance";
import { DoorOpen } from "lucide-react";
import type { UmrahStep } from "@/types/umrah";

/**
 * ওমরাহ ধাপ-তালিকা প্যানেল (ফেজ U2 - পঠনযোগ্য + কাউন্টার, মানচিত্র ছাড়া)
 *
 * দ্বৈত প্যানেল: মোবাইলে BottomSheet, ডেস্কটপে ভাসমান প্যানেল।
 * বাংলা-প্রথম সামগ্রী। টিল/সায়ান অ্যাকসেন্ট।
 */

// ---------------------------------------------------------------------------
// অগ্রগতি রিং (SVG)
// ---------------------------------------------------------------------------

function ProgressRing({ value, max, size = 56 }: { value: number; max: number; size?: number }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, value / max));
  const offset = circ * (1 - ratio);
  const done = value >= max;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={done ? "text-emerald-400" : "text-teal-400"}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-white">
        {value}/{max}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ধাপের সারি (তালিকায়)
// ---------------------------------------------------------------------------

function StepRow({
  step,
  index,
  isActive,
  isDone,
  counterValue,
  onClick,
}: {
  step: UmrahStep;
  index: number;
  isActive: boolean;
  isDone: boolean;
  counterValue: number;
  onClick: () => void;
}) {
  const counterText =
    step.counter && counterValue > 0 ? `${counterValue}/${step.counter.max}` : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all",
        isActive
          ? "bg-teal-500/15 border-teal-500/60"
          : isDone
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/70"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
          isDone
            ? "bg-emerald-500 text-white"
            : isActive
              ? "bg-teal-500 text-white ring-2 ring-teal-400/40"
              : "bg-slate-700 text-slate-300"
        )}
      >
        {isDone ? <Check className="w-4 h-4" /> : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isActive ? "text-white" : isDone ? "text-emerald-300" : "text-slate-200"
          )}
        >
          {step.title.bn}
        </p>
        {counterText && <p className="text-[11px] text-teal-300">{counterText}</p>}
      </div>
      {isActive && <ChevronRight className="w-4 h-4 text-teal-400 flex-shrink-0" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// গেট সুপারিশ কার্ড ("কোন গেট?")
// ---------------------------------------------------------------------------

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
      <div className="flex items-center gap-2 mb-1.5">
        <DoorOpen className="w-4 h-4 text-teal-400" />
        <p className="text-xs font-medium text-slate-300">সুপারিশকৃত গেট</p>
      </div>
      <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 space-y-1.5">
        <p className="text-sm font-semibold text-white">{primary.name}</p>
        {note && <p className="text-xs text-slate-300 leading-relaxed">{note.bn}</p>}
        {userLocation && (
          <p className="text-[11px] text-teal-300">
            আনুমানিক দূরত্ব: {formatDistance(distanceToGate(userLocation, primary))}
          </p>
        )}
        {gates[1] && (
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-700/40">
            বিকল্প: {gates[1].name}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// সক্রিয় ধাপের বিস্তারিত বিষয়বস্তু
// ---------------------------------------------------------------------------

function StepDetail() {
  const step = useUmrahGuideStore(selectCurrentStep);
  const counterValue = useUmrahGuideStore((s) => (step ? selectCounter(s, step.id) : 0));
  const isDone = useUmrahGuideStore((s) => (step ? selectIsComplete(s, step.id) : false));
  const incrementCounter = useUmrahGuideStore((s) => s.incrementCounter);
  const decrementCounter = useUmrahGuideStore((s) => s.decrementCounter);
  const markComplete = useUmrahGuideStore((s) => s.markComplete);
  const markIncomplete = useUmrahGuideStore((s) => s.markIncomplete);

  if (!step) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ListChecks className="w-10 h-10 text-slate-600 mb-3" />
        <p className="text-sm text-slate-400">একটি ধাপ নির্বাচন করুন</p>
      </div>
    );
  }

  const duas = step.duas ? getDuasByIds(step.duas) : [];
  const currentTip =
    step.counter && step.counter.perRoundTips
      ? step.counter.perRoundTips[Math.min(counterValue - 1, step.counter.max - 1)]
      : null;

  return (
    <div className="space-y-4">
      {/* শিরোনাম */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-teal-400 mb-1">
              {stageLabel(step.stage)}
            </p>
            <h3 className="text-lg font-bold text-white leading-tight">{step.title.bn}</h3>
            <p className="text-sm text-slate-400 mt-1">{step.summary.bn}</p>
          </div>
          {step.counter && <ProgressRing value={counterValue} max={step.counter.max} />}
        </div>
      </div>

      {/* বিমানে ইহরাম কার্ড (প্রস্তুতি ও মিকাতে ইহরাম ধাপে; নিজে ফিল্টার করে air পথে) */}
      {(step.id === "prep" || step.id === "ihram-miqat") && <FlightIhramCard />}

      {/* হুইলচেয়ার-সচেতন পরামর্শ (নিজে ফিল্টার করে: শুধু wheelchair + প্রাসঙ্গিক ধাপে) */}
      <WheelchairTips stepId={step.id} />

      {/* কাউন্টার নিয়ন্ত্রণ */}
      {step.counter && (
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          {currentTip && (
            <p className="text-xs text-teal-200 mb-2.5 leading-relaxed bg-teal-500/10 p-2 rounded-lg">
              {currentTip.bn}
            </p>
          )}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => decrementCounter(step.id)}
              className="h-11 w-11 rounded-full border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
              aria-label="কমান"
            >
              <Minus className="w-5 h-5" />
            </Button>
            <div className="text-center min-w-[5rem]">
              <p className="text-2xl font-bold text-white">{counterValue}</p>
              <p className="text-[11px] text-slate-400">{step.counter.label.bn}</p>
            </div>
            <Button
              size="icon"
              onClick={() => incrementCounter(step.id)}
              className="h-11 w-11 rounded-full bg-teal-600 hover:bg-teal-500 text-white border-0"
              aria-label="বাড়ান"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* কী করবেন */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <ListChecks className="w-4 h-4 text-teal-400" />
          <p className="text-xs font-medium text-slate-300">কী করবেন</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {step.whatToDo.bn}
          </p>
        </div>
      </div>

      {/* সুপারিশকৃত গেট (প্রবেশ/তওয়াফ/সাঈ ধাপে) */}
      <GateRecommendationCard stepId={step.id} />

      {/* নিয়ম */}
      {step.rules && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-medium text-slate-300">নিয়ম ও সতর্কতা</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {step.rules.bn}
            </p>
          </div>
        </div>
      )}

      {/* দোয়া */}
      {duas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <p className="text-xs font-medium text-slate-300">দোয়া ও স্মরণবাক্য</p>
          </div>
          <div className="space-y-2.5">
            {duas.map((dua) => (
              <div
                key={dua.id}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <p className="text-sm font-medium text-cyan-300 mb-1.5">{dua.title.bn}</p>
                <p className="text-lg leading-loose text-right text-white mb-2" dir="rtl">
                  {dua.arabic}
                </p>
                {dua.transliteration && (
                  <p className="text-xs italic text-slate-400 mb-1.5">{dua.transliteration}</p>
                )}
                <p className="text-sm text-slate-300 leading-relaxed mb-1.5">
                  <span className="text-slate-500">অর্থ: </span>
                  {dua.translationBn}
                </p>
                <p className="text-[11px] text-teal-300/80 leading-relaxed">
                  {dua.whenToRecite.bn}
                </p>
                <DuaAudioPlayer dua={dua} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* টিপ */}
      {step.tip && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-500/5 border border-teal-500/20">
          <Lightbulb className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-300 leading-relaxed">{step.tip.bn}</p>
        </div>
      )}

      {/* সম্পন্ন টগল (শুধু ম্যানুয়াল ধাপের জন্য) */}
      {step.isCompleteWhen !== "counter-max" && (
        <Button
          onClick={() => (isDone ? markIncomplete(step.id) : markComplete(step.id))}
          variant={isDone ? "outline" : "default"}
          className={cn(
            "w-full gap-2 border-0",
            isDone
              ? "bg-slate-800 text-emerald-300 hover:bg-slate-700"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          )}
        >
          <Check className="w-4 h-4" />
          {isDone ? "সম্পন্ন হয়েছে (আবার খুলুন)" : "এই ধাপ সম্পন্ন করুন"}
        </Button>
      )}

      {/* প্রস্থান-রিমাইন্ডার (শুধু সমাপ্ত ধাপে) */}
      {step.id === "done" && <PragmaticReminders />}

      {/* দলের সাথে যোগাযোগ (lost-group helper - সব সময় দৃশ্যমান) */}
      <LostGroupHelper />
    </div>
  );
}

// স্টেজ লেবেল
function stageLabel(stage: UmrahStep["stage"]): string {
  const map: Record<UmrahStep["stage"], string> = {
    prep: "প্রস্তুতি",
    ihram: "ইহরাম",
    travel: "যাত্রা",
    enter: "প্রবেশ",
    tawaf: "তওয়াফ",
    pray: "নামাজ",
    sai: "সাঈ",
    halq: "চুল কাটা",
    done: "সমাপ্ত",
  };
  return map[stage];
}

// ---------------------------------------------------------------------------
// প্রধান প্যানেল (দ্বৈত: মোবাইল + ডেস্কটপ)
// ---------------------------------------------------------------------------

interface UmrahStepListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMiqatOverview?: () => void;
}

export function UmrahStepList({ open, onOpenChange, onOpenMiqatOverview }: UmrahStepListProps) {
  const [showAssistant, setShowAssistant] = useState(false);
  // সিলেক্টর অবশ্যই স্থিতিশীল রেফারেন্স ফেরত দেবে; নতুবা অসীম রি-রেন্ডার হয়।
  // তাই stepIds (স্থিতিশীল স্টেট অ্যারে) সিলেক্ট করে useMemo দিয়ে ধাপে ম্যাপ করি।
  const stepIds = useUmrahGuideStore((s) => s.stepIds);
  const steps = useMemo<UmrahStep[]>(
    () => stepIds.map((id) => getStepById(id)).filter((s): s is UmrahStep => s !== undefined),
    [stepIds]
  );
  const currentIndex = useUmrahGuideStore((s) => s.currentIndex);
  const goToStep = useUmrahGuideStore((s) => s.goToStep);
  const nextStep = useUmrahGuideStore((s) => s.nextStep);
  const prevStep = useUmrahGuideStore((s) => s.prevStep);
  const counters = useUmrahGuideStore((s) => s.counters);
  const completed = useUmrahGuideStore((s) => s.completed);
  const reset = useUmrahGuideStore((s) => s.reset);

  const doneCount = steps.filter((s) => {
    const cv = counters[s.id] ?? s.counter?.min ?? 0;
    if (s.isCompleteWhen === "counter-max") return cv >= (s.counter?.max ?? Infinity);
    return !!completed[s.id];
  }).length;
  const progress = steps.length > 0 ? Math.round((doneCount / steps.length) * 100) : 0;

  const header = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-white">আপনার ওমরাহ যাত্রা</h3>
          <p className="text-[11px] text-teal-300">
            {doneCount} / {steps.length} ধাপ সম্পন্ন
          </p>
        </div>
        <div className="flex items-center gap-1">
          <OfflineBadge />
          {onOpenMiqatOverview && (
            <button
              onClick={onOpenMiqatOverview}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition-colors"
              title="মিকাত সারসংক্ষেপ মানচিত্র"
            >
              <Compass className="w-3.5 h-3.5" />
              মিকাত
            </button>
          )}
          <button
            onClick={() => setShowAssistant(true)}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors"
            title="আমি একটি ভুল করেছি"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            ভুল করেছি?
          </button>
          <button
            onClick={() => {
              if (confirm("গাইড রিসেট করবেন? আপনার অগ্রগতি মুছে যাবে।")) reset();
            }}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="রিসেট"
            title="রিসেট"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* অগ্রগতি বার */}
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  const navButtons = (
    <div className="flex items-center gap-2 pt-3 border-t border-slate-700/40">
      <Button
        variant="outline"
        size="sm"
        onClick={prevStep}
        disabled={currentIndex === 0}
        className="border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700"
      >
        <ChevronLeft className="w-4 h-4" /> পেছনে
      </Button>
      <Button
        size="sm"
        onClick={nextStep}
        disabled={currentIndex >= steps.length - 1}
        className="ml-auto bg-teal-600 hover:bg-teal-500 text-white border-0 gap-1"
      >
        পরবর্তী ধাপ <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );

  const content = (
    <div className="space-y-4">
      {header}

      {/* ধাপের তালিকা */}
      <div className="space-y-1.5">
        {steps.map((step, index) => {
          const cv = counters[step.id] ?? step.counter?.min ?? 0;
          const done =
            step.isCompleteWhen === "counter-max"
              ? cv >= (step.counter?.max ?? Infinity)
              : !!completed[step.id];
          return (
            <StepRow
              key={step.id}
              step={step}
              index={index}
              isActive={index === currentIndex}
              isDone={done}
              counterValue={cv}
              onClick={() => goToStep(index)}
            />
          );
        })}
      </div>

      {/* সক্রিয় ধাপের বিস্তারিত */}
      <div className="pt-2 border-t border-slate-700/40">
        <StepDetail />
      </div>

      {navButtons}
    </div>
  );

  // মোবাইল: BottomSheet
  const mobile = (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0.2, 0.6, 0.95]}
      defaultSnap={1}
    >
      <BottomSheet.Header>
        <BottomSheet.Title>ওমরাহ গাইড</BottomSheet.Title>
        <BottomSheet.CloseButton />
      </BottomSheet.Header>
      <BottomSheet.Content>
        <div className="pb-4">{content}</div>
      </BottomSheet.Content>
    </BottomSheet>
  );

  // ডেস্কটপ: ভাসমান প্যানেল
  const desktop = (
    <div
      className="absolute top-4 right-4 z-[100] w-96 h-[calc(100vh-7rem)]"
      data-testid="umrah-step-list-desktop"
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-teal-600/20 to-cyan-600/10">
          <h3 className="text-base font-bold text-white">ওমরাহ গাইড</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            বন্ধ
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">{content}</div>
      </div>
    </div>
  );

  return (
    <>
      <div className="block sm:hidden">{mobile}</div>
      {open && <div className="hidden sm:block">{desktop}</div>}
      {showAssistant && <MistakeAssistant onClose={() => setShowAssistant(false)} />}
    </>
  );
}
