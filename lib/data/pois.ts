import type { POI } from "@/types/poi";

/**
 * ডেমো POI ডেটাসেট — "আমার কাছে" (Near Me) ফিচারের জন্য।
 *
 * রেস্টুরেন্ট, ক্যাফে, টয়লেট, এটিএম, ফার্মেসি ও মসজিদ — এই ছয় বিভাগের
 * এখনো প্রোডাকশন উৎস নেই, তাই হারাম-কেন্দ্রিক বাস্তবসম্মত নাম ও সম্ভাব্য
 * অবস্থানে হাতে-বসানো ডেমো ডেটা। সব পয়েন্ট মক্কা কেন্দ্র (MAKKAH_CENTER)
 * থেকে প্রায় ৮০ মি–১.৪ কিমি বলয়ে। ভবিষ্যতে আসল উৎস (যেমন OSM/Barikoi POI
 * API) এলে এই ফাইলটিই বদলে দিতে হবে — বাকি ফিচার অপরিবর্তিত থাকবে।
 *
 * Coordinates are [longitude, latitude] (GeoJSON/MapLibre order), same as
 * gates/hotels/tourist-places — demo-world চালু থাকলে applyDemoWorld এই
 * অ্যারের পয়েন্টগুলোও ঢাকা এরিনায় সরিয়ে নেয়।
 */
export const DEMO_POIS: POI[] = [
  // -------------------------------------------------------------------------
  // রেস্টুরেন্ট (১০)
  // -------------------------------------------------------------------------
  {
    id: "poi-restaurant-albaik-haram",
    name: "আল-বাইক (হারাম শাখা)",
    nameAr: "البيك",
    category: "restaurant",
    cuisine: ["middle_eastern"],
    priceLevel: 1,
    halal: true,
    prayerFriendly: true,
    location: {
      coordinates: [39.8275, 21.4235],
      address: "কিং ফাহদ গেট সংলগ্ন, মক্কা",
    },
    rating: 4.6,
    openingHours: "সকাল ৯টা – রাত ১২টা",
    phone: "+966 12 653 0000",
  },
  {
    id: "poi-restaurant-kudu",
    name: "কুদু",
    nameAr: "كودو",
    category: "restaurant",
    cuisine: ["middle_eastern"],
    priceLevel: 1,
    halal: true,
    prayerFriendly: true,
    location: {
      coordinates: [39.8265, 21.4243],
      address: "ইব্রাহিম আল-খলিল স্ট্রিট, মক্কা",
    },
    rating: 4.2,
    openingHours: "সকাল ৮টা – রাত ১১টা",
    phone: "+966 12 651 1111",
  },
  {
    id: "poi-restaurant-altazaj",
    name: "আল-তাজাজ",
    nameAr: "الطازج",
    category: "restaurant",
    cuisine: ["arabic"],
    priceLevel: 2,
    halal: true,
    prayerFriendly: true,
    location: {
      coordinates: [39.8288, 21.4228],
      address: "আজিয়াদ স্ট্রিট, মক্কা",
    },
    rating: 4.4,
    openingHours: "সকাল ১০টা – রাত ১২টা",
    phone: "+966 12 652 2222",
  },
  {
    id: "poi-restaurant-herfy",
    name: "হারফি",
    nameAr: "هرفي",
    category: "restaurant",
    cuisine: ["middle_eastern"],
    priceLevel: 1,
    halal: true,
    prayerFriendly: false,
    location: {
      coordinates: [39.8235, 21.4205],
      address: "মিসফালা, মক্কা",
    },
    rating: 4.0,
    openingHours: "সকাল ৮টা – রাত ১১টা",
    phone: "+966 12 655 3333",
  },
  {
    id: "poi-restaurant-shawarma-house",
    name: "শাওয়ার্মা হাউস",
    nameAr: "بيت الشاورما",
    category: "restaurant",
    cuisine: ["arabic"],
    priceLevel: 1,
    halal: true,
    prayerFriendly: true,
    location: {
      coordinates: [39.826, 21.421],
      address: "আবদুল আজিজ রোড, মক্কা",
    },
    rating: 4.3,
    openingHours: "দুপুর ১২টা – ভোর ৩টা",
    phone: "+966 12 654 4444",
  },
  {
    id: "poi-restaurant-alromi",
    name: "আল-রোমি চিকেন",
    nameAr: "الرومي",
    category: "restaurant",
    cuisine: ["middle_eastern"],
    priceLevel: 2,
    halal: true,
    prayerFriendly: false,
    location: {
      coordinates: [39.823, 21.4248],
      address: "আল-মাহমুদ এলাকা, মক্কা",
    },
    rating: 4.1,
    openingHours: "সকাল ১০টা – রাত ১১টা",
    phone: "+966 12 656 5555",
  },
  {
    id: "poi-restaurant-tamimi",
    name: "তামিমি রেস্টুরেন্ট (দেশি খাবার)",
    nameAr: "مطعم تميمي",
    category: "restaurant",
    cuisine: ["south_asian"],
    priceLevel: 2,
    halal: true,
    prayerFriendly: true,
    location: {
      coordinates: [39.8255, 21.419],
      address: "গঙ্গা বাজার এলাকা, মিসফালা, মক্কা",
    },
    rating: 4.5,
    openingHours: "সকাল ৭টা – রাত ১১টা",
    phone: "+966 12 657 6666",
  },
  {
    id: "poi-restaurant-makkah-biryani",
    name: "মক্কা বিরিয়ানি হাউস",
    nameAr: "بيت برياني مكة",
    category: "restaurant",
    cuisine: ["south_asian"],
    priceLevel: 1,
    halal: true,
    prayerFriendly: true,
    location: {
      coordinates: [39.8215, 21.422],
      address: "উমর বিন খাত্তাব স্ট্রিট, মক্কা",
    },
    rating: 4.4,
    openingHours: "সকাল ৯টা – রাত ১১টা",
    phone: "+966 12 658 7777",
  },
  {
    id: "poi-restaurant-albaik-ajyad",
    name: "আল-বাইক (আজিয়াদ শাখা)",
    nameAr: "البيك أجياد",
    category: "restaurant",
    cuisine: ["middle_eastern"],
    priceLevel: 1,
    halal: true,
    prayerFriendly: false,
    location: {
      coordinates: [39.833, 21.4235],
      address: "আজিয়াদ স্ট্রিট, মক্কা",
    },
    rating: 4.5,
    openingHours: "সকাল ৯টা – রাত ১২টা",
    phone: "+966 12 659 8888",
  },
  {
    id: "poi-restaurant-pak-bhaban",
    name: "পাক ভবন রেস্টুরেন্ট",
    nameAr: "مطعم باك بهوان",
    category: "restaurant",
    cuisine: ["south_asian"],
    priceLevel: 1,
    halal: true,
    prayerFriendly: true,
    location: {
      coordinates: [39.82, 21.4188],
      address: "মিসফালা, মক্কা",
    },
    rating: 4.2,
    openingHours: "সকাল ৭টা – রাত ১০টা",
    phone: "+966 12 650 9999",
  },

  // -------------------------------------------------------------------------
  // ক্যাফে (৫)
  // -------------------------------------------------------------------------
  {
    id: "poi-cafe-dar-al-tahura",
    name: "দার আল-তাহুরা ক্যাফে",
    nameAr: "قهوة الطهارة",
    category: "cafe",
    cuisine: ["arabic"],
    priceLevel: 2,
    halal: true,
    prayerFriendly: true,
    location: {
      coordinates: [39.827, 21.4222],
      address: "আবরাজ আল-বাইত সংলগ্ন, মক্কা",
    },
    rating: 4.3,
    openingHours: "সকাল ৮টা – রাত ১২টা",
  },
  {
    id: "poi-cafe-makkah-tea-house",
    name: "মক্কা টি হাউস",
    nameAr: "بيت شاي مكة",
    category: "cafe",
    cuisine: ["middle_eastern"],
    priceLevel: 1,
    halal: true,
    prayerFriendly: false,
    location: {
      coordinates: [39.825, 21.4238],
      address: "আল-মাহমুদ স্ট্রিট, মক্কা",
    },
    rating: 4.1,
    openingHours: "দুপুর ২টা – রাত ১২টা",
  },
  {
    id: "poi-cafe-corner-ajyad",
    name: "কর্নার ক্যাফে (আজিয়াদ)",
    nameAr: "كافيه كورنر",
    category: "cafe",
    cuisine: ["western"],
    priceLevel: 2,
    halal: false,
    prayerFriendly: false,
    location: {
      coordinates: [39.832, 21.424],
      address: "আজিয়াদ স্ট্রিট, মক্কা",
    },
    rating: 4.0,
    openingHours: "সকাল ৯টা – রাত ১১টা",
  },
  {
    id: "poi-cafe-bait-al-qahwa",
    name: "বাইত আল-কাহওয়া",
    nameAr: "بيت القهوة",
    category: "cafe",
    cuisine: ["arabic"],
    priceLevel: 1,
    halal: true,
    prayerFriendly: true,
    location: {
      coordinates: [39.824, 21.4195],
      address: "মিসফালা, মক্কা",
    },
    rating: 4.4,
    openingHours: "সকাল ৬টা – রাত ১১টা",
  },
  {
    id: "poi-cafe-rose-misfalah",
    name: "রোজ ক্যাফে (মিসফালা)",
    nameAr: "كافيه روز",
    category: "cafe",
    cuisine: ["western", "middle_eastern"],
    priceLevel: 2,
    halal: true,
    prayerFriendly: false,
    location: {
      coordinates: [39.8215, 21.42],
      address: "মিসফালা, মক্কা",
    },
    rating: 3.9,
    openingHours: "সকাল ৮টা – রাত ১০টা",
  },

  // -------------------------------------------------------------------------
  // টয়লেট (৮)
  // -------------------------------------------------------------------------
  {
    id: "poi-toilet-king-fahd-1",
    name: "হারাম গেট ১ টয়লেট",
    nameAr: "دورة مياه الباب ١",
    category: "toilet",
    prayerFriendly: true,
    location: {
      coordinates: [39.8361, 21.4239],
      address: "কিং ফাহদ গেট ১, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-toilet-king-fahd-3",
    name: "হারাম গেট ৩ টয়লেট",
    nameAr: "دورة مياه الباب ٣",
    category: "toilet",
    prayerFriendly: true,
    location: {
      coordinates: [39.8392, 21.4251],
      address: "কিং ফাহদ গেট ৩, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-toilet-abdul-aziz",
    name: "আবদুল আজিজ গেট টয়লেট",
    nameAr: "دورة مياه باب عبد العزيز",
    category: "toilet",
    prayerFriendly: true,
    location: {
      coordinates: [39.8245, 21.4198],
      address: "আবদুল আজিজ গেট, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-toilet-mahmoud",
    name: "আল-মাহমুদ গেট টয়লেট",
    nameAr: "دورة مياه باب المحمود",
    category: "toilet",
    prayerFriendly: true,
    location: {
      coordinates: [39.8268, 21.4272],
      address: "আল-মাহমুদ গেট, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-toilet-masa",
    name: "মাসআ (সাঈ পথ) টয়লেট",
    nameAr: "دورة مياه المسعى",
    category: "toilet",
    prayerFriendly: true,
    location: {
      coordinates: [39.837, 21.4245],
      address: "মাসআ, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-toilet-safa",
    name: "সাফা পাহাড় টয়লেট",
    nameAr: "دورة مياه الصفا",
    category: "toilet",
    location: {
      coordinates: [39.8355, 21.4231],
      address: "আস-সাফা, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-toilet-ibrahim-street",
    name: "ইব্রাহিম আল-খলিল স্ট্রিট পাবলিক টয়লেট",
    nameAr: "دورة مياه عامة",
    category: "toilet",
    location: {
      coordinates: [39.8258, 21.4215],
      address: "ইব্রাহিম আল-খলিল স্ট্রিট, মক্কা",
    },
    openingHours: "সকাল ৬টা – রাত ১২টা",
  },
  {
    id: "poi-toilet-misfalah",
    name: "মিসফালা পাবলিক টয়লেট",
    nameAr: "دورة مياه المسفلة",
    category: "toilet",
    location: {
      coordinates: [39.823, 21.418],
      address: "মিসফালা, মক্কা",
    },
    openingHours: "সকাল ৬টা – রাত ১১টা",
  },

  // -------------------------------------------------------------------------
  // এটিএম (৫)
  // -------------------------------------------------------------------------
  {
    id: "poi-atm-alrajhi",
    name: "আল-রাজহি ব্যাংক এটিএম",
    nameAr: "صراف الراجحي",
    category: "atm",
    location: {
      coordinates: [39.8266, 21.423],
      address: "ইব্রাহিম আল-খলিল স্ট্রিট, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-atm-albilad",
    name: "ব্যাংক আল-বিলাদ এটিএম",
    nameAr: "صراف البلاد",
    category: "atm",
    location: {
      coordinates: [39.8255, 21.422],
      address: "আবরাজ আল-বাইত এলাকা, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-atm-sba",
    name: "এসবিএ এটিএম (ক্লক টাওয়ার)",
    nameAr: "صراف سبا",
    category: "atm",
    location: {
      coordinates: [39.8258, 21.4216],
      address: "আবরাজ আল-বাইত, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-atm-alinma",
    name: "আল-ইনমা ব্যাংক এটিএম",
    nameAr: "صراف الإنماء",
    category: "atm",
    location: {
      coordinates: [39.829, 21.423],
      address: "আজিয়াদ স্ট্রিট, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-atm-jazira",
    name: "ব্যাংক আল-জাজিরা এটিএম",
    nameAr: "صراف الجزيرة",
    category: "atm",
    location: {
      coordinates: [39.8225, 21.421],
      address: "উমর বিন খাত্তাব স্ট্রিট, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },

  // -------------------------------------------------------------------------
  // ফার্মেসি (৪)
  // -------------------------------------------------------------------------
  {
    id: "poi-pharmacy-nahdi-abraj",
    name: "নাহদি ফার্মেসি (আবরাজ আল-বাইত)",
    nameAr: "صيدلية النهدي",
    category: "pharmacy",
    location: {
      coordinates: [39.825, 21.4218],
      address: "আবরাজ আল-বাইত, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
    phone: "+966 12 570 1234",
  },
  {
    id: "poi-pharmacy-aldawaa",
    name: "আল-দাওয়াইয়া ফার্মেসি",
    nameAr: "صيدلية الدواء",
    category: "pharmacy",
    location: {
      coordinates: [39.8272, 21.4232],
      address: "আল-হাজ স্ট্রিট, মক্কা",
    },
    openingHours: "সকাল ৮টা – রাত ১২টা",
    phone: "+966 12 571 2345",
  },
  {
    id: "poi-pharmacy-united-misfalah",
    name: "ইউনাইটেড ফার্মেসি (মিসফালা)",
    nameAr: "صيدلية يونايتد",
    category: "pharmacy",
    location: {
      coordinates: [39.8228, 21.4192],
      address: "মিসফালা, মক্কা",
    },
    openingHours: "সকাল ৯টা – রাত ১১টা",
    phone: "+966 12 572 3456",
  },
  {
    id: "poi-pharmacy-nahdi-ajyad",
    name: "নাহদি ফার্মেসি (আজিয়াদ শাখা)",
    nameAr: "صيدلية النهدي أجياد",
    category: "pharmacy",
    location: {
      coordinates: [39.831, 21.4242],
      address: "আজিয়াদ স্ট্রিট, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
    phone: "+966 12 573 4567",
  },

  // -------------------------------------------------------------------------
  // মসজিদ (৬) — হারাম-সংলগ্ন ছোট মসজিদ (নামাজের সময় কাছের বিকল্প)
  // -------------------------------------------------------------------------
  {
    id: "poi-mosque-abdul-aziz",
    name: "মসজিদ আবদুল আজিজ",
    nameAr: "مسجد عبد العزيز",
    category: "mosque",
    prayerFriendly: true,
    location: {
      coordinates: [39.8243, 21.4205],
      address: "আবদুল আজিজ রোড, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-mosque-al-noor-misfalah",
    name: "মসজিদ আল-নূর (মিসফালা)",
    nameAr: "مسجد النور",
    category: "mosque",
    prayerFriendly: true,
    location: {
      coordinates: [39.8235, 21.4185],
      address: "মিসফালা, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-mosque-bilal",
    name: "মসজিদ বিলাল",
    nameAr: "مسجد بلال",
    category: "mosque",
    prayerFriendly: true,
    location: {
      coordinates: [39.828, 21.4245],
      address: "আল-হাজ স্ট্রিট, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-mosque-al-hijra",
    name: "মসজিদ আল-হিজরা",
    nameAr: "مسجد الهجرة",
    category: "mosque",
    prayerFriendly: true,
    location: {
      coordinates: [39.8205, 21.4215],
      address: "উমর বিন খাত্তাব স্ট্রিট, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-mosque-umar-ajyad",
    name: "মসজিদ উমর বিন খাত্তাব (আজিয়াদ)",
    nameAr: "مسجد عمر بن الخطاب",
    category: "mosque",
    prayerFriendly: true,
    location: {
      coordinates: [39.8305, 21.4228],
      address: "আজিয়াদ স্ট্রিট, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
  {
    id: "poi-mosque-as-safa",
    name: "মসজিদ আস-সাফা",
    nameAr: "مسجد الصفا",
    category: "mosque",
    prayerFriendly: true,
    location: {
      coordinates: [39.834, 21.4225],
      address: "আস-সাফা এলাকা, মক্কা",
    },
    openingHours: "২৪ ঘণ্টা",
  },
];

/** বিভাগ অনুযায়ী POI ফিল্টার */
export function getPOIsByCategory(category: POI["category"]): POI[] {
  return DEMO_POIS.filter((poi) => poi.category === category);
}
