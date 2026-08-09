"use client";

import { Check, AlertTriangle, BookOpen, Lightbulb, ListChecks, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useUmrahGuideStore,
  selectCurrentStep,
  selectCounter,
  selectIsComplete,
} from "@/lib/store/umrahGuideStore";
import { getDuasByIds } from "@/lib/data/umrah/duas";
import { recommendGatesForStep, distanceToGate } from "@/lib/data/umrah/gate-recommendation";
import { useLocationStore } from "@/lib/store";
import { formatDistance } from "@/lib/utils/distance";
import { FlightIhramCard } from "@/components/umrah/FlightIhramCard";
import { WheelchairTips } from "@/components/umrah/WheelchairTips";
import { PragmaticReminders } from "@/components/umrah/PragmaticReminders";
import { LostGroupHelper } from "@/components/umrah/LostGroupHelper";
import { DuaAudioPlayer } from "@/components/umrah/DuaAudioPlayer";

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

/**
 * সক্রিয় ধাপের সম্পূর্ণ বিস্তারিত - কী করবেন, নিয়ম, দোয়া, গেট, টিপ, সম্পন্ন টগল ও
 * সহায়ক উপাদান (ইহরাম কার্ড, হুইলচেয়ার, প্রস্থান-রিমাইন্ডার, দলের সাথে যোগাযোগ)।
 * হিরো নির্দেশনা (InstructionCard) ও কাউন্টার নিয়ন্ত্রণ (CircuitControl) এখানে নেই -
 * সেগুলো normal অবস্থায় আলাদাভাবে দেখানো হয়।
 */
export function GuideExpanded({ className }: { className?: string }) {
  const step = useUmrahGuideStore(selectCurrentStep);
  const counterValue = useUmrahGuideStore((s) => (step ? selectCounter(s, step.id) : 0));
  const isDone = useUmrahGuideStore((s) => (step ? selectIsComplete(s, step.id) : false));
  const markComplete = useUmrahGuideStore((s) => s.markComplete);
  const markIncomplete = useUmrahGuideStore((s) => s.markIncomplete);

  if (!step) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <ListChecks className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-sm text-slate-400">একটি ধাপ নির্বাচন করুন</p>
      </div>
    );
  }

  const duas = step.duas ? getDuasByIds(step.duas) : [];

  return (
    <div className={cn("space-y-4", className)}>
      {/* বিমানে ইহরাম কার্ড (প্রস্তুতি ও মিকাতে ইহরাম ধাপে) */}
      {(step.id === "prep" || step.id === "ihram-miqat") && <FlightIhramCard />}

      {/* হুইলচেয়ার-সচেতন পরামর্শ */}
      <WheelchairTips stepId={step.id} />

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

      {/* সুপারিশকৃত গেট */}
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

      {/* দলের সাথে যোগাযোগ */}
      <LostGroupHelper />
    </div>
  );
}
