import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Eye,
  Ear,
  Zap,
  ArrowRight,
  Users,
  Footprints,
  Utensils,
  Car,
  XCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative px-4 pt-16 sm:pt-24 max-w-6xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative p-3 rounded-2xl shadow-2xl">
                <Image src="/icons/Tawafmap.webp" alt="TawafMap Logo" width={84} height={84} />
              </div>
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-center text-white mb-4 tracking-tight">
            TawafMap
          </h1>
          <p className="text-xl sm:text-2xl text-center text-emerald-500 font-medium mb-6">
            মক্কা-মদিনায় হারাবেন না আর কখনও
          </p>
          <p className="text-base sm:text-lg text-center text-slate-400 max-w-xl mx-auto leading-relaxed">
            স্মার্ট ম্যাপ - যেখানে আপনি পাবেন গেট নাম্বার, হাঁটার দূরত্ব, খাবারের দোকান আর
            ট্রান্সপোর্টের সব তথ্য
          </p>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
            <XCircle className="w-4 h-4" />
            সমস্যা কী?
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-6 mb-3">
            হজ ও ওমরাহ যাত্রীদের মূল সমস্যাগুলো
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            অনলাইনে বুকিং করা গেলেও সেখানকার চলাচল নিয়ে কোনো ধারণাই থাকে না
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: GateIcon,
              title: "গেট দিয়ে চলাচল",
              description:
                "সেখানে ঠিকানা বলে কিছু নেই। সবাই গেট নাম্বার দিয়ে পথ চেনে। কিন্তু কোন গেট দিয়ে কাছে?",
              color: "bg-amber-600",
            },
            {
              icon: SpatialIcon,
              title: "দূরত্ব বোঝা কঠিন",
              description:
                "হোটেল থেকে হারাম কত দূর? হেঁটে যাওয়া যাবে নাকি গাড়ি লাগবে? কিছুই বোঝা যায় না।",
              color: "bg-purple-600",
            },
            {
              icon: OpaqueIcon,
              title: "খাবার আর যাতায়াত",
              description:
                "আশেপাশে ভালো রেস্টুরেন্ট কোথায়? ট্যাক্সি বা বাস পাওয়া যাবে? কোনো তথ্যই নেই।",
              color: "bg-rose-600",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300"
            >
              <div className="relative">
                <div className={`mb-4 p-3 w-fit ${item.color} rounded-xl`}>
                  <item.icon />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Solution Section */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            <Zap className="w-4 h-4" />
            সমাধান
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-6 mb-3">
            TawafMap - এক অ্যাপেই সব সমাধান
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            মক্কা-মদিনার জন্য বিশেষ ভাবে তৈরি - এমন কিছু যা আগে কখনও হয়নি
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              icon: <TargetIcon />,
              title: "সঠিক লোকেশন",
              description: "আপনি কোন গেটের কত কাছে জানুন",
              stat: "গেট",
            },
            {
              icon: <Footprints className="w-6 h-6" />,
              title: "হাঁটার দূরত্ব",
              description: "হোটেল থেকে হারামের সঠিক দূরত্ব",
              stat: "হাঁটা",
            },
            {
              icon: <Utensils className="w-6 h-6" />,
              title: "খাবার খুঁজুন",
              description: "আশেপাশের সব রেস্টুরেন্টের তালিকা",
              stat: "খাবার",
            },
            {
              icon: <Car className="w-6 h-6" />,
              title: "যাতায়াত",
              description: "ট্যাক্সি, বাস সব তথ্য এক জায়গায়",
              stat: "যাতায়াত",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="relative bg-slate-900/50 backdrop-blur border border-slate-700/50 rounded-2xl p-5 text-center group hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-full">
                {item.stat}
              </div>
              <div className="mb-3 inline-flex p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-[11px] text-slate-500 leading-snug">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vision Section */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium">
            <Eye className="w-4 h-4" />
            আমাদের স্বপ্ন
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-6 mb-3">
            এমন এক অ্যাসিস্ট্যান্ট যা সব করবে
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            আপনার হজ ও ওমরাহ যাত্রা আরও সহজ করতে আমরা তৈরি করছি এক শক্তিশালী AI সহকারী
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: <Eye className="w-7 h-7" />,
              title: "দেখাবে",
              subtitle: "ভিজ্যুয়াল গাইড",
              description: "ম্যাপে দেখুন আপনি কোথায় আছেন, কোন গেট কত দূরে আর কোন পথে যাবেন",
              color: "bg-cyan-600",
              bgPattern: "bg-cyan-500/5",
            },
            {
              icon: <Ear className="w-7 h-7" />,
              title: "বলবে",
              subtitle: "ভয়েস গাইড",
              description: "হাতে মোবাইল ধরে হাঁটবেন না, কানে শুনুন বামে যান, ডানে যান",
              color: "bg-violet-600",
              bgPattern: "bg-violet-500/5",
            },
            {
              icon: <Zap className="w-7 h-7" />,
              title: "কাজ করবে",
              subtitle: "স্মার্ট অ্যাকশন",
              description: "ট্যাক্সি বুকিং, রুট পরিবর্তন, সব কিছু অ্যাপ থেকেই",
              color: "bg-amber-600",
              bgPattern: "bg-amber-500/5",
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`group relative ${item.bgPattern} backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 overflow-hidden`}
            >
              <div className="relative">
                <div className={`mb-4 p-3 w-fit ${item.color} rounded-xl shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                  {item.subtitle}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Target Users Section */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-3xl p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <div className="flex-shrink-0">
              <div className="p-4 bg-emerald-500/10 rounded-2xl">
                <Users className="w-12 h-12 text-emerald-400" strokeWidth={1.5} />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">কার জন্য এটা?</h3>
              <p className="text-slate-400 leading-relaxed">
                যারা একা ওমরাহ বা হজ করতে চান, প্যাকেজ ছাড়া নিজের মতো ঘুরতে চান - তাদের জন্যই এই
                অ্যাপ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 pb-24 max-w-6xl mx-auto text-center">
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10">
            <Image
              src="/icons/Tawafmap.webp"
              alt="TawafMap Logo"
              width={48}
              height={48}
              className="mx-auto mb-4"
            />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">আজই শুরু করুন</h2>
            <p className="text-slate-400 mb-6">
              মক্কা-মদিনায় চিন্তা ছাড়া ঘুরুন, TawafMap আছে পাশে
            </p>
            <Link href="/map">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 px-8 text-base"
              >
                <MapPin className="w-5 h-5" />
                ম্যাপ দেখুন
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-600 text-sm">প্রতিটি হজ যাত্রীর নিরাপদ যাত্রার সাথী - Barikoi</p>
          <p className="text-slate-700 text-xs mt-2">বারিকয় সৌদি আরবিয়া</p>
        </div>
      </footer>
    </main>
  );
}

// Custom SVG Components
function GateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M8 21V10a2 2 0 012-2h4a2 2 0 012 2v11" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-emerald-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function SpatialIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function OpaqueIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
