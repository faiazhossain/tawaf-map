import type { Dua } from "@/types/umrah";

/**
 * ওমরাহর দোয়া ও প্রার্থনা সামগ্রী
 *
 * প্রতিটি দোয়ায় আছে: আরবি (dir="rtl" এ রেন্ডার হবে), রোমান লিপি (transliteration),
 * বাংলা অনুবাদ এবং কখন পড়বেন। আরবি টেক্সট যথাযথ উৎস থেকে নেওয়া; তবে স্বরচিহ্ন (হারকত)
 * উচ্চারণের সুবিধার্থে রাখা হয়েছে।
 */
export const UMRAH_DUAS: Dua[] = [
  {
    id: "talbiyah",
    title: { bn: "তালবিয়াহ (ইহরামের স্মরণবাক্য)", en: "Talbiyah (the chant of ihram)" },
    arabic:
      "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ. لَبَّيْكَ إِلَهَ الْحَقِّ.",
    transliteration:
      "Labbayk Allahumma labbayk. Labbayka la sharika laka labbayk. " +
      "Innal-hamda wan-ni'mata laka wal-mulk, la sharika lak. Labbayka ilahal-haqq.",
    translationBn:
      "আমি হাজির হয়েছি, হে আল্লাহ! আমি হাজির। আমি হাজির, আপনার কোনো অংশীদার নেই, " +
      "আমি হাজির। নিশ্চয়ই সমস্ত প্রশংসা, নিয়ামত ও রাজত্ব একমাত্র আপনারই; আপনার কোনো অংশীদার নেই। " +
      "আমি হাজির, হে সত্যের ইলাহ!",
    translationEn:
      "Here I am, O Allah, here I am. Here I am, You have no partner, here I am. " +
      "Indeed all praise, grace and sovereignty belong to You. You have no partner. " +
      "Here I am, O God of Truth.",
    whenToRecite: {
      bn: "ইহরাম বাঁধার পর থেকে তওয়াফ শুরুর আগ পর্যন্ত বারবার পড়ুন। পুরুষ উচ্চস্বরে, নারী নিচুস্বরে।",
      en: "Recite frequently after entering ihram until Tawaf begins. Men aloud, women softly.",
    },
    sourceRefs: [
      "https://duas.com/dua/371/the-talbiyah-chant-of-hajj-and-umrah",
      "https://hajjumrahplanner.com/talbiyah/",
      "https://umrah.nusuk.sa/Journey",
    ],
  },
  {
    id: "niyyah-umrah",
    title: { bn: "ওমরাহর নিয়ত", en: "Intention (Niyyah) for Umrah" },
    arabic: "لَبَّيْكَ اللَّهُمَّ بِعُمْرَةٍ",
    transliteration: "Labbayk Allahumma bi-'Umrah.",
    translationBn: "আমি ওমরাহর জন্য হাজির হয়েছি, হে আল্লাহ।",
    translationEn: "Here I am, O Allah, performing Umrah.",
    whenToRecite: {
      bn:
        "মিকাতে ইহরামের পোশাক পরে ও নামাজ আদায়ের পর, কিবলামুখী হয়ে অন্তরে নিয়ত স্থির করুন " +
        "এবং এই বাক্য উচ্চারণ করুন। নিয়ত মূলত অন্তরে; এটি উচ্চারণ সুন্নাত।",
      en:
        "At the miqat, after wearing ihram garments and praying, face the Qibla, " +
        "make the intention in your heart, then say this. The intention is " +
        "fundamentally of the heart; uttering it is sunnah.",
    },
    sourceRefs: ["https://islamqa.info/en/answers/31819", "https://umrah.nusuk.sa/Journey"],
  },
  {
    id: "mosque-entry",
    title: { bn: "মসজিদে প্রবেশের দোয়া", en: "Supplication for entering the mosque" },
    arabic:
      "بِسْمِ اللَّهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration:
      "Bismillahi was-salatu was-salamu 'ala Rasulillah. Allahummaftah li abwaba rahmatik.",
    translationBn:
      "আল্লাহর নামে (প্রবেশ করছি), এবং আল্লাহর রাসূলের প্রতি দরূদ ও সালাম। " +
      "হে আল্লাহ! আমার জন্য আপনার রহমতের দরজাসমূহ খুলে দিন।",
    translationEn:
      "In the name of Allah, and blessings and peace upon the Messenger of Allah. " +
      "O Allah, open for me the gates of Your mercy.",
    whenToRecite: {
      bn: "মসজিদুল হারামে প্রবেশের সময় ডান পা আগে রেখে এই দোয়া পড়ুন।",
      en: "Upon entering Masjid al-Haram, step in with the right foot first and recite this.",
    },
    sourceRefs: [
      "https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/how-to-perform-umrah/",
    ],
  },
  {
    id: "black-stone-takbir",
    title: {
      bn: "কালো পাথরে তাকবির",
      en: "Takbir at the Black Stone",
    },
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allahu Akbar.",
    translationBn: "আল্লাহু আকবার (আল্লাহ সবচেয়ে মহান)।",
    translationEn: "Allah is the Greatest.",
    whenToRecite: {
      bn:
        "প্রতিটি চক্কর শুরুতে হাজরে আসওয়াদের সারিতে। স্পর্শ করতে বা চুম্বন করতে পারলে ভালো, " +
        "না পারলে ডান হাত বাড়িয়ে ইশারা করে 'আল্লাহু আকবার' বলুন।",
      en:
        "At the start of each circuit, aligned with the Black Stone. Touch or kiss " +
        "it if possible; otherwise point with the right hand and say 'Allahu Akbar'.",
    },
    sourceRefs: ["https://islamqa.info/en/answers/31819", "https://umrah.nusuk.sa/Journey"],
  },
  {
    id: "yamani-corner-dua",
    title: {
      bn: "রুকনে ইয়ামানি ও কালো পাথরের মধ্যের দোয়া",
      en: "Dua between the Yemeni Corner and the Black Stone",
    },
    arabic:
      "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration:
      "Rabbana atina fid-dunya hasanah, wa fil-akhirati hasanah, wa qina 'adhaban-nar.",
    translationBn:
      "হে আমাদের রব! আমাদের দুনিয়াতে কল্যাণ দান করুন এবং আখিরাতেও কল্যাণ দান করুন, " +
      "আর আমাদের জাহান্নামের শাস্তি থেকে রক্ষা করুন। (সূরা বাকারা ২:২০১)",
    translationEn:
      "Our Lord, give us in this world good and in the Hereafter good, and protect us " +
      "from the punishment of the Fire. (Quran 2:201)",
    whenToRecite: {
      bn:
        "প্রতি চক্করে রুকনে ইয়ামানি থেকে কালো পাথর পর্যন্ত পথে এই দোয়া পড়ুন। " +
        "রুকনে ইয়ামানিতে স্পর্শ করুন (কিন্তু চুম্বন করবেন না বা তাকবির বলবেন না)।",
      en:
        "Recite this each circuit on the stretch between the Yemeni Corner and the " +
        "Black Stone. Touch the Yemeni Corner if possible (do not kiss it or say takbir).",
    },
    sourceRefs: [
      "https://duas.com/dua/373/dua-said-between-the-yemeni-corner-and-the-black-stone",
      "https://islamqa.info/en/answers/31819",
    ],
  },
  {
    id: "safa-verse",
    title: {
      bn: "সাফায় সাঈ শুরুর আয়াত",
      en: "Verse recited at Safa to begin Sa'i",
    },
    arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ",
    transliteration: "Innas-Safa wal-Marwata min sha'a'irillah.",
    translationBn: "নিশ্চয়ই সাফা ও মারওয়া আল্লাহর নিদর্শনসমূহের অন্তর্ভুক্ত। (সূরা বাকারা ২:১৫৮)",
    translationEn: "Indeed, as-Safa and al-Marwah are among the symbols of Allah. (Quran 2:158)",
    whenToRecite: {
      bn:
        "সাঈ শুরুতে সাফায় উঠে কিবলামুখী হয়ে এই আয়াত পড়ুন, তারপর নিজের জন্য দোয়া করুন। " +
        "মারওয়া থেকে শুরু করবেন না - সাফা থেকেই শুরু।",
      en:
        "At the start of Sa'i, climb Safa, face the Qibla, recite this verse, then make " +
        "your personal dua. Do NOT begin from Marwa - always start at Safa.",
    },
    sourceRefs: ["https://islamqa.info/en/answers/31819"],
  },
];

/** id দিয়ে দোয়া খুঁজে আনা */
export function getDuaById(id: string): Dua | undefined {
  return UMRAH_DUAS.find((dua) => dua.id === id);
}

/** একাধিক id দিয়ে দোয়াসমূহ খুঁজে আনা (ধাপে প্রদর্শনের ক্রম বজায় রাখে) */
export function getDuasByIds(ids: string[]): Dua[] {
  return ids
    .map((id) => UMRAH_DUAS.find((dua) => dua.id === id))
    .filter((dua): dua is Dua => dua !== undefined);
}
