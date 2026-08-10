"use client";

import { useState } from "react";
import { MistakeAssistant } from "./MistakeAssistant";
import { TawafGuideSheet } from "./guide/TawafGuideSheet";
import { TawafGuidePanel } from "./guide/TawafGuidePanel";

/**
 * ওমরাহ গাইড প্যানেল (ফেজ T5) - গাইডেড নেভিগেশন অভিজ্ঞতা।
 *
 * দ্বৈত উপস্থাপন: মোবাইলে TawafGuideSheet (বটম শীট: peek/normal/expanded),
 * ডেস্কটপে TawafGuidePanel (ডানদিকে সরু স্ক্রলযোগ্য প্যানেল)। "ভুল করেছি?" সহায়ক
 * উভয় আর্কেস্ট্রেটর থেকে এই কম্পোজারে ফিরে আসে।
 */
interface UmrahStepListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMiqatOverview?: () => void;
}

export function UmrahStepList({ open, onOpenChange, onOpenMiqatOverview }: UmrahStepListProps) {
  const [showAssistant, setShowAssistant] = useState(false);
  const openMistake = () => setShowAssistant(true);

  return (
    <>
      {/* মোবাইল/ট্যাবলেট (৬৪০px পর্যন্ত): গাইডেড বটম শীট — md: থেকে ডেস্কটপ প্যানেল।
          আগে sm: (৬৪০px) ছিল, যাতে ৬৪০-৭৬৮px টাচ-ট্যাবলেট ডেস্কটপ প্যানেল পেত। এখন md: (৭৬৮px)
          ব্যবহার করে ট্যাবলেট ব্যান্ড শীট ধরে রাখে (অডিট: "Mobile Design Strategy")। */}
      <div className="block md:hidden">
        <TawafGuideSheet
          open={open}
          onOpenChange={onOpenChange}
          onOpenMiqatOverview={onOpenMiqatOverview}
          onOpenMistake={openMistake}
        />
      </div>

      {/* ডেস্কটপ (≥৭৬৮px): ভাসমান গাইডেড প্যানেল */}
      {open && (
        <div className="hidden md:block">
          <TawafGuidePanel
            onOpenChange={onOpenChange}
            onOpenMiqatOverview={onOpenMiqatOverview}
            onOpenMistake={openMistake}
          />
        </div>
      )}

      {showAssistant && <MistakeAssistant onClose={() => setShowAssistant(false)} />}
    </>
  );
}
