"use client";

import { MapPin, Compass, AlertTriangle, ArrowLeft, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { MIQAT_POINTS, resolveMiqatForTravelPath } from "@/lib/data/umrah/miqat";
import type { MiqatDirection } from "@/types/umrah";

/**
 * মিকাত সারসংক্ষেপ প্যানেল (পরিকল্পনা ৬.৪)
 *
 * মক্কার চারপাশে নবী নির্ধারিত মিকাত পয়েন্টগুলো তালিকাভুক্ত করে, ব্যবহারকারীর
 * যাত্রাপথ অনুযায়ী সক্রিয় মিকাত হাইলাইট করে এবং ব্যাখ্যা/সতর্কতা দেখায়।
 * দ্বৈত প্যানেল: মোবাইলে BottomSheet, ডেস্কটপে ভাসমান প্যানেল।
 */

const DIRECTION_LABEL: Record<MiqatDirection, string> = {
  north: "উত্তর",
  northwest: "উত্তর-পশ্চিম",
  east: "পূর্ব",
  northeast: "উত্তর-পূর্ব",
  south: "দক্ষিণ",
};

interface MiqatOverviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MiqatOverviewPanel({ open, onOpenChange }: MiqatOverviewPanelProps) {
  const profile = useUmrahGuideStore((s) => s.profile);

  const mapping = profile ? resolveMiqatForTravelPath(profile.travelPath) : null;
  const activeMiqatId = mapping?.miqatId ?? null;
  const activeMiqat = activeMiqatId
    ? (MIQAT_POINTS.find((m) => m.id === activeMiqatId) ?? null)
    : null;

  const content = (
    <div className="space-y-4">
      {/* সক্রিয় মিকাত কলআউট */}
      {mapping && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-primary/15 to-primary/5 border-b border-primary/20">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Navigation className="w-4 h-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-primary">আপনার যাত্রাপথ অনুযায়ী</p>
              <p className="text-sm font-bold text-foreground leading-tight">
                {activeMiqat ? activeMiqat.name.bn : "নির্দিষ্ট মিকাত নেই"}
              </p>
            </div>
          </div>
          <div className="px-3 py-3 space-y-2">
            <p className="text-xs text-foreground leading-relaxed">{mapping.explanation.bn}</p>
            {mapping.warning && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-200 leading-relaxed">{mapping.warning.bn}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* সমস্ত মিকাত পয়েন্ট */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Compass className="w-4 h-4 text-primary" />
          <p className="text-xs font-medium text-foreground">
            মক্কার চারপাশের মিকাতসমূহ ({MIQAT_POINTS.length})
          </p>
        </div>
        <div className="space-y-1.5">
          {MIQAT_POINTS.map((miqat) => {
            const isActive = miqat.id === activeMiqatId;
            return (
              <div
                key={miqat.id}
                className={cn(
                  "p-2.5 rounded-xl border transition-colors",
                  isActive
                    ? "bg-primary/15 border-primary/60 ring-1 ring-primary/30"
                    : "bg-muted/40 border-border/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <MapPin
                        className={cn(
                          "w-3.5 h-3.5 flex-shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isActive ? "text-foreground" : "text-foreground"
                        )}
                      >
                        {miqat.name.bn}
                      </p>
                      {isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                          আপনার মিকাত
                        </span>
                      )}
                    </div>
                    {miqat.nameAr && (
                      <p className="text-xs text-muted-foreground mt-0.5 ml-5" dir="rtl">
                        {miqat.nameAr}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground whitespace-nowrap">
                    {DIRECTION_LABEL[miqat.direction]}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 ml-5 text-[11px] text-muted-foreground">
                  <span>{miqat.distanceKm}</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="truncate">{miqat.serves.bn}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        মিকাত পয়েন্টের স্থানাঙ্ক আনুমানিক, শুধুমাত্র সারসংক্ষেপের জন্য। বিমানে আসলে মিকাত পার
        হওয়ার আগেই ইহরাম বাঁধা নিরাপদ।
      </p>

      {/* গাইডে ফেরা */}
      <Button
        onClick={() => onOpenChange(false)}
        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground border-0 gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> গাইডে ফিরুন
      </Button>
    </div>
  );

  // মোবাইল: BottomSheet
  const mobile = (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[0.3, 0.7, 0.95]}
      defaultSnap={1}
    >
      <BottomSheet.Header>
        <BottomSheet.Title>মিকাত সারসংক্ষেপ</BottomSheet.Title>
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
      className="absolute top-4 right-4 z-[100] w-96 max-h-[calc(100vh-7rem)]"
      data-testid="umrah-miqat-overview-desktop"
    >
      <div className="bg-surface/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-7rem)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/20 to-primary/5">
          <div>
            <h3 className="text-base font-bold text-foreground">মিকাত সারসংক্ষেপ</h3>
            <p className="text-[11px] text-primary">ইহরাম বাঁধার সীমানা</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-md hover:bg-muted transition-colors"
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
    </>
  );
}
