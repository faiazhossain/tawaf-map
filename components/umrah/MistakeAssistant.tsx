"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  LifeBuoy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { UMRAH_MISTAKES, getMistakeById, getMistakesByCategory } from "@/lib/data/umrah/mistakes";
import type { Mistake, MistakeCategory, ExpiationType, Validity } from "@/types/umrah";

/**
 * "আমি একটি ভুল করেছি" সহায়ক
 *
 * mistakes.ts এর সিদ্ধান্ত বৃক্ষের উপর চলমান UI (পরিকল্পনা ধারা ৫.৬)।
 * শ্রেণি নির্বাচন -> প্রশ্ন -> হ্যাঁ/না শাখা -> ফলাফল (বৈধতা, করণীয়, কাফফারা, উৎস)।
 * স্বর: শান্ত ও সান্ত্বনাময়; বৈধ হলে আগে বলা হয় যে "সম্ভবত আপনার ওমরাহ এখনও বৈধ"।
 */

const CATEGORIES: { id: MistakeCategory; label: string; icon: typeof LifeBuoy }[] = [
  { id: "ihram", label: "ইহরাম / মিকাত", icon: AlertTriangle },
  { id: "tawaf", label: "তওয়াফ", icon: AlertTriangle },
  { id: "sai", label: "সাঈ", icon: AlertTriangle },
  { id: "purity", label: "পবিত্রতা", icon: AlertTriangle },
  { id: "halq", label: "চুল কাটা", icon: AlertTriangle },
  { id: "other", label: "অন্যান্য", icon: HelpCircle },
];

const EXPIATION_LABELS: Record<ExpiationType, { bn: string; tone: string }> = {
  none: { bn: "কোনো কাফফারা নেই", tone: "text-primary" },
  sadaqah: { bn: "সাদাকা/ফিদয়া (গরিবদের মাঝে খাদ্য)", tone: "text-warning" },
  dam: { bn: "দম (একটি পশু কুরবানি, হারামের ভেতরে)", tone: "text-warning" },
  takhyir: {
    bn: "যেকোনো একটি: দম অথবা ৬ জনকে খাদ্য অথবা ৩ দিন রোজা (তাকয়ীর — মালেকি/শাফেয়ী/হাম্বলী)",
    tone: "text-warning",
  },
  tartib: {
    bn: "ক্রমান্বয়ে: সামর্থ্য থাকলে দম, না হলে রোজা, না হলে খাদ্য (তারতিব — হানাফী)",
    tone: "text-warning",
  },
  "qada-plus-dam": {
    bn: "কাযা (ওমরাহ পুনরায় পালন) + দম (প্রত্যেকের জন্য একটি পশু)",
    tone: "text-error",
  },
  "see-scholar": { bn: "এ বিষয়ে একজন যোগ্য আলেমের পরামর্শ নিন", tone: "text-error" },
};

function ValidityBadge({ valid }: { valid: Validity }) {
  const config = {
    valid: { icon: CheckCircle2, color: "text-primary", label: "ওমরাহ বৈধ" },
    invalid: { icon: XCircle, color: "text-error", label: "ওমরাহ বাতিল হয়েছে" },
    depends: { icon: HelpCircle, color: "text-warning", label: "মতভেদ / নির্ভরশীল" },
  }[valid];
  const Icon = config.icon;
  return (
    <div className={cn("flex items-center gap-2", config.color)}>
      <Icon className="w-5 h-5" />
      <span className="font-semibold">{config.label}</span>
    </div>
  );
}

function OutcomeView({ mistake, onRestart }: { mistake: Mistake; onRestart: () => void }) {
  const outcome = mistake.outcome!;
  const exp = outcome.expiation ? EXPIATION_LABELS[outcome.expiation] : null;
  const reassuring = outcome.valid === "valid";

  return (
    <div className="space-y-4">
      {reassuring && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/10 border border-primary/25">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary leading-relaxed">
            শান্ত হোন — সম্ভবত আপনার ওমরাহ এখনও বৈধ। বেশিরভাগ ভুলই ওমরাহ বাতিল করে না।
          </p>
        </div>
      )}

      <ValidityBadge valid={outcome.valid} />

      <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
        <p className="text-xs text-muted-foreground mb-1">কী করবেন</p>
        <p className="text-sm text-foreground leading-relaxed">{outcome.action.bn}</p>
      </div>

      {exp && (
        <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">কাফফারা / প্রায়শ্চিত্ত</p>
          <p className={cn("text-sm leading-relaxed", exp.tone)}>{exp.bn}</p>
        </div>
      )}

      {outcome.expiation === "takhyir" && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          দ্রষ্টব্য: কাফফারার ধরন আপনার মাযহাবের উপর নির্ভর করে। হানাফী মতে তারতিব (ক্রম), অন্যদের
          মতে তাকয়ীর (পছন্দ)। অ্যাপ রায় দেয় না — নিশ্চিত হতে আলেমের সাথে যাচাই করুন।
        </p>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-1.5">উৎস</p>
        <div className="space-y-1">
          {mistake.sourceRefs.map((ref) => (
            <a
              key={ref}
              href={ref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover break-all"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              {ref.replace(/^https?:\/\//, "")}
            </a>
          ))}
        </div>
      </div>

      <Button
        onClick={onRestart}
        variant="outline"
        size="sm"
        className="w-full border-border bg-muted/60 text-foreground hover:bg-muted gap-2"
      >
        <RotateCcw className="w-4 h-4" /> আবার একটি ভুল দেখুন
      </Button>
    </div>
  );
}

export function MistakeAssistant({ onClose }: { onClose?: () => void }) {
  const [category, setCategory] = useState<MistakeCategory | null>(null);
  const [path, setPath] = useState<string[]>([]); // ভ্রমণকৃত নোড id স্ট্যাক

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

  const currentId = path.length > 0 ? path[path.length - 1] : null;
  const current = currentId ? getMistakeById(currentId) : null;

  const restart = () => {
    setPath([]);
    setCategory(null);
  };

  const goBack = () => {
    if (path.length > 0) {
      setPath(path.slice(0, -1));
    } else if (category) {
      setCategory(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mistake-assistant-title"
        className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[85vh] flex flex-col bg-surface sm:rounded-2xl rounded-t-3xl border border-border/60 shadow-2xl overflow-hidden"
      >
        {/* হেডার */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-amber-600/15 to-rose-600/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 id="mistake-assistant-title" className="text-base font-bold text-foreground">
                আমি একটি ভুল করেছি
              </h2>
              <p className="text-[11px] text-gold">শান্ত হোন — একসাথে সমাধান করি</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(category || path.length > 0) && (
              <button
                onClick={goBack}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label="পেছনে"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-md hover:bg-muted transition-colors"
              >
                বন্ধ
              </button>
            )}
          </div>
        </div>

        {/* বিষয়বস্তু */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          {/* ধাপ ১: শ্রেণি নির্বাচন */}
          {!category && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                কোন ধরনের ভুল হয়েছে তা নির্বাচন করুন। কয়েকটি প্রশ্নের উত্তর দিলেই স্পষ্ট সমাধান
                পাবেন।
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const count = getMistakesByCategory(cat.id).length;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      disabled={count === 0}
                      className={cn(
                        "flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all",
                        count === 0
                          ? "bg-muted/30 border-border/30 opacity-40 cursor-not-allowed"
                          : "bg-muted/50 border-border/60 hover:bg-muted hover:border-amber-500/40"
                      )}
                    >
                      <Icon className="w-5 h-5 text-warning" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{cat.label}</p>
                        <p className="text-[10px] text-muted-foreground">{count} টি বিষয়</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ধাপ ২: শ্রেণির ভুল তালিকা */}
          {category && !current && (
            <div className="space-y-2.5">
              <p className="text-sm text-foreground mb-1">নিচের যেটি ঘটেছে তা নির্বাচন করুন:</p>
              {getMistakesByCategory(category).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPath([m.id])}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border bg-muted/50 border-border/60 hover:bg-muted hover:border-amber-500/40 text-left transition-all"
                >
                  <p className="flex-1 text-sm text-foreground">{m.question.bn}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* ধাপ ৩: বর্তমান নোড — শাখা বা ফলাফল */}
          {current && (
            <div>
              {current.outcome ? (
                <OutcomeView mistake={current} onRestart={restart} />
              ) : (
                <div className="space-y-3">
                  <p className="text-base font-medium text-foreground leading-relaxed">
                    {current.question.bn}
                  </p>
                  <div className="space-y-2">
                    {current.branches?.map((branch, i) => (
                      <button
                        key={i}
                        onClick={() => setPath([...path, branch.nextId])}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/50 border-border/60 hover:bg-muted hover:border-amber-500/40 text-left transition-all"
                      >
                        <span className="text-sm text-foreground">{branch.condition.bn}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ফুটার দাবি */}
        <div className="px-5 py-2.5 border-t border-border bg-surface">
          <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
            এটি শুধুমাত্র তথ্য ও শিক্ষামূলক। নির্দিষ্ট পরিস্থিতির জন্য একজন যোগ্য আলেমের পরামর্শ
            নিন।
          </p>
        </div>
      </div>
    </div>
  );
}

/** সকল ভুল-নোডের সংখ্যা (পরীক্ষা/পরিসংখ্যানের জন্য) */
export const MISTAKE_COUNT = UMRAH_MISTAKES.length;
