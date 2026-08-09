"use client";

import { useState } from "react";
import { Users, Phone, MapPin, Pencil, Plus, Check, X, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUmrahGuideStore } from "@/lib/store/umrahGuideStore";
import { useLocationStore } from "@/lib/store";

/**
 * "দলের সাথে যোগাযোগ" সহায়ক (পরিকল্পনা ৬.৬ - lost-group helper)
 *
 * দলনেতার ফোন ও মিলনস্থল সংরক্ষণ করে (প্রোফাইলে একত্রিত, persist হয়)। ভিড়ে দলের
 * থেকে আলাদা হলে দ্রুত ফোন করা বা মিলনস্থল মনে করা যায়। GPS থাকলে বর্তমান অবস্থান
 * মিলনস্থল হিসেবে সংরক্ষণ করা যায়।
 */
const HARAM_CENTER: [number, number] = [39.8262, 21.4225];

export function LostGroupHelper() {
  const profile = useUmrahGuideStore((s) => s.profile);
  const setGroupLeaderPhone = useUmrahGuideStore((s) => s.setGroupLeaderPhone);
  const setMeetingPoint = useUmrahGuideStore((s) => s.setMeetingPoint);
  const clearGroupInfo = useUmrahGuideStore((s) => s.clearGroupInfo);
  const latitude = useLocationStore((s) => s.latitude);
  const longitude = useLocationStore((s) => s.longitude);

  const savedPhone = profile?.groupLeaderPhone ?? "";
  const savedMeeting = profile?.meetingPoint?.label ?? "";
  const usedGps = profile?.meetingPoint?.coordinates
    ? profile.meetingPoint.coordinates[0] !== HARAM_CENTER[0]
    : false;
  const hasInfo = savedPhone !== "" || savedMeeting !== "";

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(savedPhone);
  const [meeting, setMeeting] = useState(savedMeeting);

  const save = () => {
    const coords: [number, number] =
      latitude !== null && longitude !== null ? [longitude, latitude] : HARAM_CENTER;
    setGroupLeaderPhone(phone);
    setMeetingPoint(meeting, coords);
    setEditing(false);
  };

  const startEdit = () => {
    setPhone(savedPhone);
    setMeeting(savedMeeting);
    setEditing(true);
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      {/* শিরোনাম */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/40">
        <Users className="w-4 h-4 text-teal-400" />
        <p className="text-xs font-medium text-slate-200">দলের সাথে যোগাযোগ</p>
        {hasInfo && !editing && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={startEdit}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700/60"
              aria-label="সম্পাদনা"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                clearGroupInfo();
                setPhone("");
                setMeeting("");
              }}
              className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-700/60"
              aria-label="মুছুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5">
        {/* সম্পাদনা মোড */}
        {editing ? (
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3" /> দলনেতার ফোন নম্বর
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="যেমন: +8801XXXXXXXXX"
                className="w-full text-sm px-2.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" /> মিলনস্থল (চেনা কোনো জায়গা)
              </label>
              <input
                type="text"
                value={meeting}
                onChange={(e) => setMeeting(e.target.value)}
                placeholder="যেমন: কিং আব্দুল আজিজ গেট, ঘড়ি টাওয়ারের নিচে"
                className="w-full text-sm px-2.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
              />
              {latitude !== null && longitude !== null && (
                <p className="text-[10px] text-teal-300/80 mt-1 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> সংরক্ষণের সময় আপনার বর্তমান অবস্থানও সাথে
                  থাকবে।
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={save}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white"
              >
                <Check className="w-3.5 h-3.5" /> সংরক্ষণ
              </button>
              {hasInfo && (
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  বাতিল
                </button>
              )}
            </div>
          </div>
        ) : hasInfo ? (
          /* সংরক্ষিত তথ্য দেখানো */
          <div className="space-y-1.5">
            {savedPhone && (
              <a
                href={`tel:${savedPhone}`}
                className="flex items-center gap-2 text-sm text-teal-300 hover:text-teal-200"
              >
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span dir="ltr">{savedPhone}</span>
                <span className="text-[10px] text-slate-500">(কল করতে ট্যাপ)</span>
              </a>
            )}
            {savedMeeting && (
              <p className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {savedMeeting}
                {usedGps && (
                  <span className="text-[10px] text-teal-300/70">(অবস্থান সংরক্ষিত)</span>
                )}
              </p>
            )}
          </div>
        ) : (
          /* তথ্য নেই - যোগ করার প্রম্পট */
          <button
            onClick={startEdit}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-teal-300 py-1"
          >
            <Plus className="w-3.5 h-3.5" /> দলনেতার ফোন ও মিলনস্থল সংরক্ষণ করুন
          </button>
        )}
      </div>
    </div>
  );
}
