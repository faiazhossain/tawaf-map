import type { MiqatPoint, TravelPathMiqat, TravelPath, LocalizedString } from "@/types/umrah";

/**
 * মিকাত পয়েন্টসমূহ - ইহরাম বাঁধার সীমানা
 *
 * নবী নির্ধারিত পাঁচটি মিকাত (ইবনে আব্বাসের হাদিস, বুখারি ১৫২৪, মুসলিম ১১৮১)।
 * স্থানাঙ্ক আনুমানিক, শুধুমাত্র সারসংক্ষেপ মানচিত্রের জন্য।
 */
export const MIQAT_POINTS: MiqatPoint[] = [
  {
    id: "dhul-hulayfah",
    name: {
      bn: "যুল-হুলাইফা (আবইয়ার আলী)",
      en: "Dhul-Hulayfah (Abyar Ali)",
    },
    nameAr: "ذو الحليفة",
    direction: "north",
    distanceKm: "৪১০-৪৫০ কিমি",
    serves: {
      bn: "মদিনা হয়ে আসা তীর্থযাত্রীদের জন্য",
      en: "Those coming via Madinah",
    },
    location: { coordinates: [39.8717, 24.4486] },
    sourceRefs: [
      "https://hajjumrahplanner.com/miqat/",
      "https://bakkahtransport.com/blog/miqat-points/",
    ],
  },
  {
    id: "al-juhfah",
    name: {
      bn: "আল-জুহফাহ (রাবিগের নিকট)",
      en: "Al-Juhfah (near Rabigh)",
    },
    nameAr: "الجحفة",
    direction: "northwest",
    distanceKm: "~১৮৭ কিমি",
    serves: {
      bn: "মিশর, শাম ও উত্তর/পশ্চিম আফ্রিকা থেকে আসা তীর্থযাত্রীদের জন্য",
      en: "Egypt, Sham, North/West Africa",
    },
    location: { coordinates: [38.994, 22.193] },
    sourceRefs: ["https://hajjumrahplanner.com/miqat/", "https://en.wikipedia.org/wiki/Miqat"],
  },
  {
    id: "qarn-al-manazil",
    name: {
      bn: "কারনুল মানাযিল (আস-সাইল আল-কাবির)",
      en: "Qarn al-Manazil (As-Sayl al-Kabir)",
    },
    nameAr: "قرن المنازل",
    direction: "east",
    distanceKm: "~৭৫-৮২ কিমি",
    serves: {
      bn: "নাজদ ও তায়েফ থেকে আসা তীর্থযাত্রীদের জন্য",
      en: "Najd and Ta'if",
    },
    location: { coordinates: [40.184, 21.681] },
    sourceRefs: [
      "https://hajjumrahplanner.com/miqat/",
      "https://bakkahtransport.com/blog/miqat-points/",
    ],
  },
  {
    id: "yalamlam",
    name: {
      bn: "ইয়ালামলাম (আস-সাদিয়্যাহ)",
      en: "Yalamlam (as-Sa'diyyah)",
    },
    nameAr: "يلملم",
    direction: "south",
    distanceKm: "~৫৪ কিমি",
    serves: {
      bn: "ইয়েমেন ও দক্ষিণ অঞ্চল থেকে আসা তীর্থযাত্রীদের জন্য",
      en: "Yemen and southern regions",
    },
    location: { coordinates: [39.964, 21.086] },
    sourceRefs: ["https://hajjumrahplanner.com/miqat/", "https://en.wikipedia.org/wiki/Miqat"],
  },
  {
    id: "dhat-irq",
    name: {
      bn: "যাতে ইরক",
      en: "Dhat 'Irq",
    },
    nameAr: "ذات عرق",
    direction: "northeast",
    distanceKm: "~৮৫ কিমি",
    serves: {
      bn: "ইরাক, ইরান ও উত্তর-পূর্ব থেকে আসা তীর্থযাত্রীদের জন্য",
      en: "Iraq, Iran, and northeast",
    },
    location: { coordinates: [40.425, 21.775] },
    sourceRefs: [
      "https://hajjumrahplanner.com/miqat/",
      "https://bakkahtransport.com/blog/miqat-points/",
    ],
  },
  {
    id: "taneem",
    name: {
      bn: "আত-তানাইম / মসজিদে আয়িশা (হিল মিকাত)",
      en: "At-Tan'eem / Masjid Aisha (Hill miqat)",
    },
    nameAr: "مسجد التنعيم (مسجد عائشة)",
    direction: "north",
    distanceKm: "~৭ কিমি",
    serves: {
      bn: "হারামের ভেতরে অবস্থানকারীদের জন্য (মক্কায় থেকে ওমরাহর মিকাত)",
      en: "Those already inside the Haram boundary",
    },
    location: { coordinates: [39.80135, 21.46767] },
    sourceRefs: [
      "https://islamqa.info/en/answers/32845",
      "https://www.discovermakkah.sa/en/places-worth-visiting/landmarks/al-taneem-mosque-(lady-aisha)",
    ],
  },
];

/**
 * ভ্রমণপথ অনুযায়ী মিকাত নির্ধারণ - মিকাত ইঞ্জিনের মূল ম্যাপিং।
 * বাংলাদেশি তীর্থযাত্রীদের জন্য সবচেয়ে গুরুত্বপূর্ণ: বিমানে যাত্রার ক্ষেত্রে।
 */
export const TRAVEL_PATH_MIQAT: TravelPathMiqat[] = [
  {
    travelPath: "air-dhaka-jeddah",
    miqatId: "yalamlam",
    explanation: {
      bn:
        "জেদ্দা মিকাত সীমানার ভেতরে অবস্থিত, তাই ঢাকা থেকে বিমানে আসার ক্ষেত্রে " +
        "ইহরাম বাঁধতে হবে বিমানের ভেতরে - মিকাত পার হওয়ার আগে। সাধারণত ইয়ালামলাম " +
        "(দক্ষিণ/সমুদ্রপথ) বা কারনুল মানাযিলের সারিতে পৌঁছানোর আগেই। " +
        "বিমান সংস্থাগুলো অবতরণের আনুমানিক ৩০-৪৫ মিনিট আগে ঘোষণা দেয়।",
      en:
        "Jeddah is inside the miqat boundary, so for air travellers ihram must " +
        "be assumed on the aircraft before crossing the miqat (Yalamlam or " +
        "Qarn al-Manazil, depending on flight path). Airlines announce ~30-45 " +
        "minutes before landing.",
    },
    warning: {
      bn:
        "গুরুত্বপূর্ণ: জেদ্দা বিমানবন্দর মীকাত নয়। উমরাহর উদ্দেশ্যে জেদ্দায় যাওয়ার সময় " +
        "মীকাত অতিক্রম করে ইহরাম ছাড়া গেলে দম (একটি পশু কুরবানি) আবশ্যক হতে পারে।",
      en:
        "Important: Jeddah airport is not a miqat. Travelling to Jeddah for Umrah " +
        "without ihram after crossing the miqat may require a Dam (sacrifice of a sheep).",
    },
  },
  {
    travelPath: "via-madinah",
    miqatId: "dhul-hulayfah",
    explanation: {
      bn:
        "মদিনা হয়ে মক্কায় আসলে মিকাত হলো যুল-হুলাইফা (আবইয়ার আলী), যা মক্কা থেকে " +
        "প্রায় ৪৫০ কিমি উত্তরে। মদিনায় অবস্থান শেষে এখান থেকে ইহরাম বাঁধুন।",
      en:
        "Coming via Madinah, the miqat is Dhul-Hulayfah (Abyar Ali), ~450 km " +
        "north of Makkah. Assume ihram here before departing for Makkah.",
    },
  },
  {
    travelPath: "already-in-makkah",
    miqatId: "taneem",
    explanation: {
      bn:
        "ইতিমধ্যে হারামের ভেতরে (মক্কায়) অবস্থান করলে নিকটতম 'হিল' পয়েন্টে গিয়ে ইহরাম " +
        "বাঁধতে হবে - আত-তানাইমে অবস্থিত মসজিদে আয়িশা, মক্কা থেকে প্রায় ৭ কিমি উত্তরে। " +
        "এটি সেই স্থান যেখান থেকে আয়িশা (রা.) ওমরাহর ইহরাম বেঁধেছিলেন।",
      en:
        "Already inside the Haram boundary of Makkah: go out to the nearest " +
        "Hill point - Masjid Aisha at Tan'eem, ~7 km north. Aisha (RA) " +
        "assumed her Umrah ihram from here.",
    },
  },
  {
    travelPath: "already-in-jeddah",
    miqatId: null,
    explanation: {
      bn:
        "জেদ্দায় অবস্থানকারী (হিল এলাকায়) ব্যক্তিরা যেখান থেকে আসছেন সেখান থেকেই " +
        "ইহরাম বাঁধবেন। জেদ্দা মিকাতের ভেতরে (হিল) অবস্থিত, তাই আলাদা মিকাতে যেতে হয় না।",
      en:
        "Jeddah residents (within the Hill) assume ihram from where they are. " +
        "No need to travel to a miqat point.",
    },
  },
  {
    travelPath: "other",
    miqatId: null,
    explanation: {
      bn:
        "আপনার যাত্রাপথ নিশ্চিত না হলে মিকাত সারসংক্ষেপ মানচিত্র দেখুন এবং আপনার " +
        "ফ্লাইট/রুট অনুযায়ী নিকটতম মিকাত চিহ্নিত করুন। অনিশ্চিত হলে উড্ডয়নের আগেই " +
        "ইহরাম বাঁধে ফেলা নিরাপদ।",
      en:
        "If unsure of your route, view the miqat overview map and identify the " +
        "nearest miqat to your flight path. When in doubt, assume ihram " +
        "before takeoff to be safe.",
    },
  },
];

/** id দিয়ে মিকাত খুঁজে আনা */
export function getMiqatById(id: string): MiqatPoint | undefined {
  return MIQAT_POINTS.find((miqat) => miqat.id === id);
}

/** ভ্রমণপথ অনুযায়ী মিকাত নির্ধারণ (মিকাত ইঞ্জিন) */
export function resolveMiqatForTravelPath(travelPath: TravelPath): TravelPathMiqat {
  return (
    TRAVEL_PATH_MIQAT.find((entry) => entry.travelPath === travelPath) ??
    TRAVEL_PATH_MIQAT.find((entry) => entry.travelPath === "other")!
  );
}

// ---------------------------------------------------------------------------
// বিমানে ইহরাম — ঢাকা -> জেদ্দা পথের জন্য উড্ডয়ন-পূর্ব চেকলিস্ট (পরিকল্পনা ৫.৪)
// ---------------------------------------------------------------------------

/**
 * বোর্ডিংয়ের আগে সম্পন্ন করার চেকলিস্ট। বিমানে মিকাত পার হওয়ার আগেই ইহরাম
 * বাঁধতে হবে বলে ঢাকা/বাড়ি থেকেই এগুলো প্রস্তুত রাখা নিরাপদ।
 */
export const AIR_IHRAM_CHECKLIST: LocalizedString[] = [
  {
    bn: "গোসল করুন — ইহরামের আগে গোসল করা সুন্নাহ।",
    en: "Perform ghusl — it is sunnah before ihram.",
  },
  {
    bn: "পরিচ্ছন্নতা সম্পন্ন করুন — নখ ও অতিরিক্ত লোম পরিষ্কার করে নিন।",
    en: "Groom yourself — trim nails and remove excess hair.",
  },
  {
    bn: "ইহরামের পোশাক প্রস্তুত রাখুন — পুরুষের জন্য ইযার ও রিদা; নারীরা স্বাভাবিক পর্দাশীল পোশাক পরবেন।",
    en: "Ready the ihram garments — izar & rida for men; women wear normal modest clothing.",
  },
  {
    bn: "সুগন্ধি ব্যবহার করুন — ইহরামে প্রবেশের আগে শরীর বা চুলে সুগন্ধি ব্যবহার করা সুন্নাহ। ইহরামে প্রবেশের পর নতুন করে সুগন্ধি ব্যবহার করবেন না।",
    en: "Apply perfume — sunnah on the body or hair before ihram. Do not apply new perfume after entering ihram.",
  },
  {
    bn: "উপযুক্ত স্যান্ডেল প্রস্তুত রাখুন — পুরুষের জন্য এমন স্যান্ডেল/চপ্পল রাখুন যা টাখনু ঢাকে না।",
    en: "Keep suitable sandals — for men, sandals that do not cover the ankle bone.",
  },
];

// ---------------------------------------------------------------------------
// মিকাত সারসংক্ষেপ মানচিত্রের সীমা (fitBounds-এর জন্য)
// ---------------------------------------------------------------------------

/** দুই স্থানাঙ্ক বিন্দুর আকারে মিকাত রিং-এর বাউন্ডস [[SW lng,lat], [NE lng,lat]] */
export type LatLngBounds = [[number, number], [number, number]];

/**
 * সমস্ত মিকাত পয়েন্ট ঘিরে একটি বাউন্ডস ফেরত দেয় (মিকাত সারসংক্ষেপ মানচিত্রের জন্য)।
 * বিশুদ্ধ ফাংশন — MapLibre-এর শূন্য নির্ভরতা ছাড়াই পরীক্ষাযোগ্য। fitBounds-এ সরাসরি
 * ব্যবহারযোগ্য।
 */
export function miqatRingBounds(padding = 0.2): LatLngBounds {
  const lngs = MIQAT_POINTS.map((m) => m.location.coordinates[0]);
  const lats = MIQAT_POINTS.map((m) => m.location.coordinates[1]);
  return [
    [Math.min(...lngs) - padding, Math.min(...lats) - padding],
    [Math.max(...lngs) + padding, Math.max(...lats) + padding],
  ];
}

export interface MiqatInfoReference {
  label: string;
  detail: string;
}

export interface MiqatInfo {
  /** মীকাতের মূল সংজ্ঞা। */
  intro: string;
  /** নবী নির্ধারিত মীকাতসমূহের বিবরণ। */
  detail: string;
  /** এক লাইনের সহজ সংজ্ঞা। */
  short: string;
  /** বাস্তব উদাহরণ (বাংলাদেশ থেকে বিমানে)। */
  example: string;
  /** হাদিসের রেফারেন্স। */
  references: MiqatInfoReference[];
}

/**
 * "মীকাত কী?" তথ্য — মীকাতের ধারণা, নবী নির্ধারিত মীকাতসমূহ, সহজ সংজ্ঞা,
 * বাস্তব উদাহরণ ও রেফারেন্স। তথ্য বোতামে (info popover) দেখানো হয় যেখানে
 * "মীকাত" লেখা আছে।
 */
export const MIQAT_INFO: MiqatInfo = {
  intro:
    "মীকাত (Miqat / مِيقات) হলো হজ বা উমরাহ পালন করতে ইচ্ছুক ব্যক্তির জন্য নির্ধারিত সীমারেখা/স্থান, যার আগে ইহরামের প্রস্তুতি নিতে হয় এবং মীকাত অতিক্রম করার সময় ইহরাম অবস্থায় থাকতে হয়।",
  detail:
    "রাসুলুল্লাহ ﷺ বিভিন্ন দিক থেকে মক্কায় আগত মানুষের জন্য নির্দিষ্ট মীকাত নির্ধারণ করেছেন। যেমন—মদিনার দিক থেকে যুল-হুলাইফা, শামের দিক থেকে জুহফা, নাজদের দিক থেকে কারনুল মানাজিল, এবং ইয়েমেনের দিক থেকে ইয়ালামলাম।",
  short: "মীকাত = মক্কায় যাওয়ার পথে ইহরামের সীমা।",
  example:
    "উদাহরণস্বরূপ, বাংলাদেশ থেকে বিমানে জেদ্দার দিকে গেলে বিমান মীকাত অতিক্রম করার আগেই উমরাহর জন্য ইহরাম ও নিয়তের প্রস্তুতি নিতে হয়। মীকাত অতিক্রম করার পর ইহরাম শুরু করার বিষয়টি ফিকহের দৃষ্টিতে গুরুত্বপূর্ণ।",
  references: [
    { label: "সহিহ আল-বুখারি ১৫২৪", detail: "মীকাত নির্ধারণের হাদিস" },
    { label: "সহিহ মুসলিম ১১৮১b", detail: "হজ ও উমরাহর মীকাত" },
  ],
};
