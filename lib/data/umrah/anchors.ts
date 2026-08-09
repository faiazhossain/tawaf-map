import type { RitualAnchor } from "@/types/umrah";

/**
 * মসজিদুল হারামের আনুষ্ঠানিক স্থানসমূহ (মানচিত্রের অ্যাংকর)
 *
 * স্থানাঙ্ক [longitude, latitude] ফরম্যাটে (GeoJSON/MapLibre রীতি)।
 *
 * দ্রষ্টব্য: কাবা ও তার আশেপাশের অবস্থানগুলোর স্থানাঙ্ক সর্বোত্তম প্রকাশিত মানের ভিত্তিতে
 * নেওয়া হয়েছে, কিন্তু এগুলো আনুমানিক। ইনডোর স্যাটেলাইট ডিটেল দুর্বল হওয়ায় এই অ্যাংকরগুলো
 * একটি স্কিমেটিক ওভারলে-এর ভিত্তি হিসেবে ব্যবহৃত হবে (পরিকল্পনা ধারা 6)।
 */
export const UMRAH_ANCHORS: RitualAnchor[] = [
  // ----- কাবা ও তার কোণা -----

  {
    id: "kaaba",
    name: {
      bn: "কাবা শরীফ (বাইতুল্লাহ)",
      en: "The Kaaba (Baitullah)",
    },
    nameAr: "الكعبة المشرفة",
    role: "kaaba",
    location: { coordinates: [39.8262, 21.4225] },
    image: "/images/tourist-places/kaaba.jpg",
    sourceRefs: ["https://en.wikipedia.org/wiki/Kaaba"],
  },
  {
    id: "black-stone",
    name: {
      bn: "হাজরে আসওয়াদ (কালো পাথর)",
      en: "Hajr al-Aswad (The Black Stone)",
    },
    nameAr: "الحجر الأسود",
    role: "tawaf-start",
    location: { coordinates: [39.8266, 21.4224] },
    sourceRefs: ["https://umrah.nusuk.sa/Journey", "https://islamqa.info/en/answers/31819"],
  },
  {
    id: "rukn-yamani",
    name: {
      bn: "রুকনে ইয়ামানি (ইয়েমেনি কোণা)",
      en: "Rukn al-Yamani (Yemeni Corner)",
    },
    nameAr: "الركن اليماني",
    role: "tawaf-corner",
    location: { coordinates: [39.82605, 21.4223] },
    sourceRefs: ["https://islamqa.info/en/answers/31819", "https://umrah.nusuk.sa/Journey"],
  },
  {
    id: "maqam-ibrahim",
    name: {
      bn: "মাকামে ইবরাহিম",
      en: "Maqam Ibrahim (Station of Abraham)",
    },
    nameAr: "مقام إبراهيم",
    role: "pray-after-tawaf",
    location: { coordinates: [39.827, 21.42255] },
    sourceRefs: ["https://islamqa.info/en/answers/31819", "https://umrah.nusuk.sa/Journey"],
  },
  {
    id: "hateem",
    name: {
      bn: "হিজরে ইসমাইল / হাতিম",
      en: "Hijr Ismail / Hateem",
    },
    nameAr: "حجر إسماعيل (الحطيم)",
    role: "hateem",
    location: { coordinates: [39.8262, 21.42285] },
    sourceRefs: [
      "https://en.wikipedia.org/wiki/Hijr_Ismail",
      "https://discoverharamain.com/guides/hijr-ismail",
    ],
  },
  {
    id: "multazam",
    name: {
      bn: "আল-মুলতাযাম",
      en: "Al-Multazam",
    },
    nameAr: "الملتزم",
    role: "multazam",
    location: { coordinates: [39.82645, 21.42243] },
    sourceRefs: ["https://islamqa.info/en/answers/31819"],
  },
  {
    id: "mizab-rahmah",
    name: {
      bn: "মিযাবে রহমত (রহমতের নর্দমা)",
      en: "Mizab al-Rahmah (Water Spout of Mercy)",
    },
    nameAr: "ميزاب الرحمة",
    role: "mizab",
    location: { coordinates: [39.8262, 21.42285] },
    sourceRefs: ["https://en.wikipedia.org/wiki/Hijr_Ismail"],
  },
  {
    id: "mataf",
    name: {
      bn: "মাতাফ (তওয়াফের ময়দান)",
      en: "Mataf (The Circumambulation Area)",
    },
    nameAr: "المطاف",
    role: "mataf",
    location: { coordinates: [39.8262, 21.4225] },
    sourceRefs: ["https://umrah.nusuk.sa/Journey"],
  },

  // ----- যমযম কূপ -----

  {
    id: "zamzam",
    name: {
      bn: "যমযম কূপ",
      en: "Well of Zamzam",
    },
    nameAr: "بئر زمزم",
    role: "zamzam",
    location: { coordinates: [39.82652, 21.42257] },
    image: "/images/tourist-places/makkah-zamzam-well.jpg",
    sourceRefs: ["https://islamqa.info/en/answers/31819", "https://umrah.nusuk.sa/Journey"],
  },

  // ----- সাফা ও মারওয়া (সাঈ করিডোর) -----

  {
    id: "safa",
    name: {
      bn: "আস-সাফা",
      en: "As-Safa",
    },
    nameAr: "الصفا",
    role: "sai-start",
    location: { coordinates: [39.8274384, 21.421763] },
    image: "/images/tourist-places/makkah-al-safa-al-marwa.jpeg",
    sourceRefs: [
      "https://islamqa.info/en/answers/31819",
      "https://en.wikipedia.org/wiki/Safa_and_Marwa",
    ],
  },
  {
    id: "marwa",
    name: {
      bn: "আল-মারওয়া",
      en: "Al-Marwa",
    },
    nameAr: "المروة",
    role: "sai-end",
    location: { coordinates: [39.8271296, 21.4252979] },
    sourceRefs: [
      "https://islamqa.info/en/answers/31819",
      "https://en.wikipedia.org/wiki/Safa_and_Marwa",
    ],
  },
  {
    id: "sai-green-markers",
    name: {
      bn: "দুই সবুজ মাইল (আল-মিলায়িন আল-আখদারাইন)",
      en: "Two Green Markers (al-Mila al-Akhdarayn)",
    },
    nameAr: "الميلان الأخضران",
    role: "sai-green-markers",
    location: { coordinates: [39.8273, 21.4236] },
    sourceRefs: ["https://umrah.nusuk.sa/Journey", "https://islamqa.info/en/answers/31819"],
  },
];

/** id দিয়ে অ্যাংকর খুঁজে আনা */
export function getAnchorById(id: string): RitualAnchor | undefined {
  return UMRAH_ANCHORS.find((anchor) => anchor.id === id);
}

/** ভূমিকা (role) দিয়ে অ্যাংকর খুঁজে আনা */
export function getAnchorsByRole(role: RitualAnchor["role"]): RitualAnchor[] {
  return UMRAH_ANCHORS.filter((anchor) => anchor.role === role);
}
