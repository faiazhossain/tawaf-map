"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { toBengaliNumber } from "@/lib/utils/bengali-number";
import type { UmrahStep } from "@/types/umrah";

interface IncompleteStepDialogProps {
  /** যে ধাপ অসম্পন্ন থাকায় বাধা দিচ্ছে। */
  step: UmrahStep;
  onClose: () => void;
  /** ব্যবহারকারী নিশ্চিত হয়ে ধাপ সম্পন্ন করতে চাইলে (শুধু ম্যানুয়াল/নৈকট্য ধাপে)। */
  onConfirm: () => void;
}

/**
 * "পরবর্তী ধাপ" চাপলে যদি বর্তমান ধাপ অসম্পন্ন থাকে, এই ডায়ালগ বাধা দেয়।
 *
 * দুটি রূপ:
 *  - ম্যানুয়াল/নৈকট্য ধাপ: "সম্পন্ন করেছি" বোতাম সহ সতর্কতা - তবে স্পষ্ট বার্তা যে
 *    শুধুমাত্র সত্যিই সম্পূর্ণ করলেই চিহ্নিত করতে হবে।
 *  - কাউন্টার-ম্যাক্স ধাপ (তওয়াফ/সাঈ): শুধু তথ্যমূলক - ম্যানুয়াল সম্পন্ন বোতাম নেই,
 *    কারণ এসব ধাপ কাউন্টার max হলে স্বয়ংক্রিয়ভাবে সম্পন্ন হয়।
 *
 * MistakeAssistant-এর মতো একই মডাল শেল: focus trap + Escape বন্ধ + body scroll lock,
 * z-[200], মোবাইলে নিচে স্ন্যাপ / ডেস্কটপে কেন্দ্রে।
 */
export function IncompleteStepDialog({ step, onClose, onConfirm }: IncompleteStepDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const isCounterStep = step.isCompleteWhen === "counter-max";
  const counterLabel = step.counter?.label.bn ?? "চক্কর";
  const counterMax = step.counter?.max;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="incomplete-step-title"
        className="w-full sm:max-w-sm flex flex-col bg-surface sm:rounded-2xl rounded-t-3xl border border-border/60 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        {/* হেডার */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-warning/15 to-warning/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <h2 id="incomplete-step-title" className="text-base font-bold text-foreground">
              ধাপটি এখনো সম্পন্ন হয়নি
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* বিষয়বস্তু */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm font-semibold text-primary">{step.title.bn}</p>

          <p className="text-[13px] leading-relaxed text-foreground">
            পরবর্তী ধাপে যেতে আগে এই ধাপটি সম্পূর্ণ করুন।
          </p>

          {isCounterStep ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-[12px] leading-relaxed text-foreground">
                এই ধাপের সমস্ত {counterLabel} শেষ করুন
                {counterMax ? ` (মোট ${toBengaliNumber(counterMax)} ${counterLabel})` : ""}। আপনি
                যখন সব {counterLabel} সম্পূর্ণ করবেন, এই ধাপ স্বয়ংক্রিয়ভাবে সম্পন্ন হয়ে যাবে।
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
              <p className="text-[11px] leading-relaxed text-foreground">
                গুরুত্বপূর্ণ: নিচের বোতামে চাপ দিন <span className="font-semibold">শুধুমাত্র</span>{" "}
                যদি আপনি সত্যিই এই ধাপটি সম্পূর্ণ করে থাকেন। এখনো কিছু বাকি থাকলে দয়া করে সম্পন্ন
                হিসেবে চিহ্নিত করবেন না।
              </p>
            </div>
          )}
        </div>

        {/* ফুটার */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border/60 bg-muted/30">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border bg-surface text-foreground hover:bg-muted"
          >
            {isCounterStep ? "ঠিক আছে" : "এখনো বাকি"}
          </Button>
          {!isCounterStep && (
            <Button
              type="button"
              onClick={onConfirm}
              className="flex-1 gap-2 border-0 bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              <Check className="h-4 w-4" />
              সম্পন্ন করেছি
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
