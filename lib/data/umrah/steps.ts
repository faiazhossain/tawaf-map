import type { UmrahStep } from "@/types/umrah";

/**
 * ওমরাহর ধাপসমূহ - গাইডের মূল অনুক্রম
 *
 * সরল ক্রম: প্রস্তুতি -> মিকাতে ইহরাম -> হারামে যাত্রা -> মসজিদে প্রবেশ
 *   -> তওয়াফ (৭ চক্কর) -> ২ রাকাআত + যমযম -> সাঈ (৭ পাক) -> হালক/তাকসির -> তাহাল্লুল সম্পন্ন।
 *
 * লিঙ্গ ভিত্তিক শাখা (gender ফিল্ড) এবং কাউন্টার (তওয়াফ/সাঈ) স্টোর ও UI-এ ব্যবহৃত হবে।
 * সম্পূর্ণ বিষয়বস্তু পরিকল্পনার পরিচ্ছেদ ৩ থেকে নেওয়া, প্রতিটিতে উৎস রেফারেন্স আছে।
 */
export const UMRAH_STEPS: UmrahStep[] = [
  // -------------------------------------------------------------------------
  // ১. প্রস্তুতি (ইহরামের আগে, অধিকাংশই সুন্নাত)
  // -------------------------------------------------------------------------
  {
    id: "prep",
    stage: "prep",
    order: 1,
    title: { bn: "প্রস্তুতি নেওয়া", en: "Preparation" },
    summary: {
      bn: "গোসল, পরিচ্ছন্নতা ও ইহরামের পোশাক পরিধান (অধিকাংশই সুন্নাত, কিন্তু গুরুত্বপূর্ণ)।",
      en: "Ghusl, grooming, and donning the ihram garments (mostly sunnah but important).",
    },
    gender: "all",
    whatToDo: {
      bn:
        "• গোসল (রীতিমতো পরিচ্ছন্নতার স্নান) করুন, এটি সুন্নাত; নারী-পুরুষ উভয়ের জন্য।\n" +
        "• নখ কাটুন, অতিরিক্ত লোম দূর করুন, দাড়ি পরিপাটি করুন।\n" +
        "• ইহরামের পোশাক পরার আগে সুগন্ধি ব্যবহার করুন (ইহরামের পরে সুগন্ধি নিষিদ্ধ)।\n" +
        "• পুরুষ: দুই খণ্ড সেলাইহীন সাদা কাপড় - ইজার (নিচের) ও রিদা (উপরের)। " +
        "টাখনু ঢাকে না এমন সেলাইহীন চপ্পল। তওয়াফের সময় ডান কাঁধ খোলা রাখবেন (ইদতিবা)।\n" +
        "• নারী: স্বাভাবিক পর্দার পোশাক পরুন (যেকোনো রঙ, সেলাই করা হতে পারে)।",
      en:
        "• Perform ghusl (ritual bath) - sunnah for both men and women.\n" +
        "• Clip nails, remove excess hair, trim the beard.\n" +
        "• Apply perfume BEFORE putting on ihram garments (forbidden after ihram).\n" +
        "• Men: two unstitched white sheets - izar (lower) and rida (upper). " +
        "Unstitched sandals that do not cover the ankle bone. Bare the right " +
        "shoulder (idtiba') when Tawaf begins.\n" +
        "• Women: normal modest Islamic dress (any colour, may be stitched).",
    },
    rules: {
      bn:
        "ইহরাম বাঁধার পরে নিষিদ্ধ: সুগন্ধি, নখ/চুল কাটা, শিকার, অশ্লীল কথাবার্তা, " +
        "পুরুষের জন্য সেলাই করা পোশাক/টুপি পরা, এবং নারীর জন্য নিকাব (মুখে বাঁধা পর্দা) ও দস্তানা।",
      en:
        "Forbidden after ihram: perfume, cutting nails/hair, hunting, obscene speech, " +
        "for men stitched clothing or head coverings, and for women the niqab (face " +
        "veil tied to the face) and gloves.",
    },
    duas: ["niyyah-umrah"],
    isCompleteWhen: "manual",
    tip: {
      bn: "বিমানে ওমরাহর পথে জেদ্দাগামী হলে উড্ডয়নের আগেই প্রস্তুতি ও ইহরামের পোশাক পরে নিন।",
      en: "If flying to Jeddah, complete preparation and wear ihram garments before boarding.",
    },
    sourceRefs: [
      "https://islamqa.info/en/answers/31819",
      "https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/how-to-perform-umrah/",
      "https://umrah.nusuk.sa/Journey",
    ],
  },

  // -------------------------------------------------------------------------
  // ২. মিকাতে ইহরাম
  // -------------------------------------------------------------------------
  {
    id: "ihram-miqat",
    stage: "ihram",
    order: 2,
    title: { bn: "মিকাতে ইহরাম বাঁধা", en: "Ihram at the Miqat" },
    summary: {
      bn: "নিয়ত স্থির করুন ও তালবিয়াহ পড়ুন। সঠিক মিকাতে ইহরাম বাঁধা অত্যন্ত গুরুত্বপূর্ণ।",
      en: "Make the intention and recite the Talbiyah. Assuming ihram at the correct miqat is critical.",
    },
    gender: "all",
    whatToDo: {
      bn:
        "• নিয়ত করুন: অন্তরে 'ওমরাহর ইহরাম বাঁধছি' ভাবুন এবং বলুন - \"লাব্বাইকাল্লাহুম্মা বি-উমরাহ\"।\n" +
        "• তালবিয়াহ পড়তে শুরু করুন এবং তওয়াফ শুরুর আগ পর্যন্ত বারবার পড়ুন।\n" +
        "• পুরুষ উচ্চস্বরে, নারী নিচুস্বরে তালবিয়াহ পড়বেন।\n" +
        "• সঠিক মিকাত আপনার যাত্রাপথের উপর নির্ভরশীল - মিকাত ইঞ্জিন দেখুন।",
      en:
        "• Make the intention: form it in your heart and say 'Labbayk Allahumma " +
        "bi-'Umrah' (I am here, O Allah, for Umrah).\n" +
        "• Begin reciting the Talbiyah and repeat it frequently until Tawaf.\n" +
        "• Men recite aloud, women softly.\n" +
        "• The correct miqat depends on your travel path - see the miqat engine.",
    },
    rules: {
      bn:
        "সবচেয়ে সাধারণ ভুল: জেদ্দা বিমানবন্দরে ইহরাম বাঁধা। জেদ্দা মিকাতের ভেতরে অবস্থিত, " +
        "তাই বিমানে মিকাত পার হওয়ার আগেই ইহরাম বাঁধুন। বিমান সংস্থা অবতরণের ৩০-৪৫ মিনিট " +
        "আগে ঘোষণা দেয়। ভুল স্থানে ইহরাম বাঁধলে দম আবশ্যক হতে পারে।",
      en:
        "Most common error: assuming ihram at Jeddah airport. Jeddah is inside the " +
        "miqat boundary, so assume ihram on the plane before crossing it. Airlines " +
        "announce ~30-45 minutes before landing. Wrong place may require a Dam.",
    },
    duas: ["talbiyah", "niyyah-umrah"],
    commonMistakes: ["crossed-miqat-without-ihram"],
    isCompleteWhen: "manual",
    sourceRefs: [
      "https://islamqa.info/en/answers/31819",
      "https://umrah.nusuk.sa/Journey",
      "https://hajjumrahplanner.com/miqat/",
    ],
  },

  // -------------------------------------------------------------------------
  // ৩. হারামে যাত্রা
  // -------------------------------------------------------------------------
  {
    id: "travel-to-haram",
    stage: "travel",
    order: 3,
    title: { bn: "মসজিদুল হারামে যাত্রা", en: "Travel to Masjid al-Haram" },
    summary: {
      bn: "মক্কায় পৌঁছে হারামের দিকে যাত্রা করুন। পথে তালবিয়াহ চালিয়ে যান।",
      en: "Reach Makkah and make your way to the Haram. Keep reciting the Talbiyah on the way.",
    },
    gender: "all",
    whatToDo: {
      bn:
        "• মক্কায় পৌঁছে আবাসস্থলে লাগেজ রেখে হারামের দিকে বের হোন।\n" +
        "• পথে তালবিয়াহ পড়তে থাকুন (তওয়াফ শুরুর আগ পর্যন্ত)।\n" +
        "• কোন গেট দিয়ে প্রবেশ করবেন তা 'নিকটতম গেট' সুপারিশ থেকে দেখুন।\n" +
        "• তওয়াফের জন্য সাধারণত উমরাহ গেট বা কিং আব্দুল আজিজ গেট সুবিধাজনক।",
      en:
        "• After arriving in Makkah, drop luggage at your accommodation and head to the Haram.\n" +
        "• Keep reciting the Talbiyah along the way (until Tawaf begins).\n" +
        "• Check the 'nearest gate' recommendation for which gate to use.\n" +
        "• For Tawaf, the Umrah Gate or King Abdul Aziz Gate are convenient.",
    },
    isCompleteWhen: "proximity",
    tip: {
      bn: "প্রবেশযোগ্যতা প্রয়োজন হলে (হুইলচেয়ার/ধীরগতি) লিফট ও এসকেলেটর-সহ গেট বেছে নিন।",
      en: "If accessibility is needed (wheelchair/slow pace), pick a gate with lifts and escalators.",
    },
    sourceRefs: ["https://umrah.nusuk.sa/Journey"],
  },

  // -------------------------------------------------------------------------
  // ৪. মসজিদে প্রবেশ
  // -------------------------------------------------------------------------
  {
    id: "enter-haram",
    stage: "enter",
    order: 4,
    title: { bn: "মসজিদুল হারামে প্রবেশ", en: "Enter Masjid al-Haram" },
    summary: {
      bn: "ডান পা আগে রেখে প্রবেশের দোয়া পড়ুন। তাহিয়্যাতুল মসজিদ নামাজ আদায় করুন।",
      en: "Step in with the right foot first, recite the entry supplication, and pray Tahiyyatul Masjid.",
    },
    gender: "all",
    anchors: ["mataf"],
    duas: ["mosque-entry"],
    whatToDo: {
      bn:
        "• ডান পা আগে রেখে প্রবেশের দোয়া পড়ুন।\n" +
        "• প্রবেশের পর তাহিয়্যাতুল মসজিদ (২ রাকাআত) আদায় করা মুস্তাহাব।\n" +
        "• তালবিয়াহ পড়তে থাকুন - তওয়াফ শুরু হলে তালবিয়াহ থামিয়ে দিন।\n" +
        "• মাতাফের দিকে এগিয়ে তওয়াফের প্রস্তুতি নিন।",
      en:
        "• Step in with the right foot first and recite the entry supplication.\n" +
        "• It is recommended to pray Tahiyyatul Masjid (2 rak'ahs) upon entering.\n" +
        "• Continue the Talbiyah - stop it when Tawaf begins.\n" +
        "• Proceed toward the Mataf and prepare for Tawaf.",
    },
    isCompleteWhen: "manual",
    sourceRefs: [
      "https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/how-to-perform-umrah/",
      "https://islamqa.info/en/answers/31819",
    ],
  },

  // -------------------------------------------------------------------------
  // ৫. তওয়াফ (৭ চক্কর)
  // -------------------------------------------------------------------------
  {
    id: "tawaf",
    stage: "tawaf",
    order: 5,
    title: { bn: "তওয়াফ (৭ চক্কর)", en: "Tawaf (7 circuits)" },
    summary: {
      bn: "কাবা শরীফের চারপাশে সাতবার প্রদক্ষিণ করুন - কাবা বাম দিকে রেখে।",
      en: "Circumambulate the Kaaba seven times, keeping it on your left.",
    },
    gender: "all",
    anchors: ["black-stone", "rukn-yamani", "kaaba", "hateem", "mataf", "multazam"],
    counter: {
      min: 1,
      max: 7,
      label: { bn: "চক্কর", en: "circuit" },
      perRoundTips: [
        {
          bn:
            "১ম চক্কর - পুরুষ: ডান কাঁধ খোলা (ইদতিবা) ও দ্রুত ছোট পদক্ষেপে চলুন (রমল)। " +
            "কালো পাথরের সারিতে 'আল্লাহু আকবার' বলে শুরু করুন।",
          en:
            "Circuit 1 - men: bare the right shoulder (idtiba') and walk with brisk " +
            "short steps (raml). Start at the Black Stone with 'Allahu Akbar'.",
        },
        {
          bn: "২য় চক্কর - রমল চালিয়ে যান। রুকনে ইয়ামানি স্পর্শ করুন (চুম্বন বা তাকবির নয়)।",
          en: "Circuit 2 - continue raml. Touch the Yemeni Corner (no kiss, no takbir).",
        },
        {
          bn: "৩য় চক্কর - শেষ রমল চক্কর। এরপর পুরুষ স্বাভাবিক গতিতে চলবেন এবং কাঁধ ঢেকে নেবেন।",
          en: "Circuit 3 - last raml circuit. After this, men walk normally and cover the shoulder.",
        },
        {
          bn: "৪র্থ চক্কর - স্বাভাবিক গতিতে। রুকনে ইয়ামানি ও কালো পাথরের মধ্যে দোয়া পড়ুন।",
          en: "Circuit 4 - normal pace. Recite the dua between the Yemeni Corner and the Black Stone.",
        },
        {
          bn: "৫ম চক্কর - গণনা মনে রাখুন। সন্দেহ হলে নিশ্চিত (কম) সংখ্যার উপর ভিত্তি করুন।",
          en: "Circuit 5 - keep count. If unsure, build on the certain (lower) number.",
        },
        {
          bn: "৬ষ্ঠ চক্কর - হিজরে ইসমাইল (হাতিম) ঘেরা অংশের বাইরে দিয়ে চলুন, ভেতর দিয়ে নয়।",
          en: "Circuit 6 - walk around the outside of Hijr Ismail (Hateem), not through it.",
        },
        {
          bn: "৭ম চক্কর - শেষ চক্কর। কালো পাথরে পৌঁছে তওয়াফ সম্পন্ন করুন।",
          en: "Circuit 7 - final circuit. Complete the Tawaf upon reaching the Black Stone.",
        },
      ],
    },
    whatToDo: {
      bn:
        "• হাজরে আসওয়াদ (কালো পাথর) থেকে শুরু করুন - কাবা বাম দিকে রেখে।\n" +
        "• সম্ভব হলে কালো পাথর স্পর্শ/চুম্বন করুন, নয়তো ডান হাতে ইশারা করে 'আল্লাহু আকবার' বলুন।\n" +
        "• ঘড়ির কাঁটার বিপরীতে (বাম দিকে) চলুন; কাবা সবসময় বাম দিকে থাকবে।\n" +
        "• রুকনে ইয়ামানি (ইয়েমেনি কোণা) স্পর্শ করুন - চুম্বন করবেন না, তাকবির বলবেন না।\n" +
        '• রুকনে ইয়ামানি ও কালো পাথরের মধ্যে: "রব্বানা আতিনা ফিদ্দুনিয়া হাসানাহ..." পড়ুন।\n' +
        "• ৭টি চক্কর সম্পূর্ণ করুন। হিজরে ইসমাইল (হাতিম) চক্করের ভেতরে পড়ে - এটি ঘুরে চলুন।",
      en:
        "• Start at the Black Stone, keeping the Kaaba on your left.\n" +
        "• Touch/kiss the Black Stone if possible, else point with the right hand and say 'Allahu Akbar'.\n" +
        "• Walk counter-clockwise; the Kaaba stays on your left throughout.\n" +
        "• At the Yemeni Corner: touch if possible - do NOT kiss, do NOT say takbir.\n" +
        "• Between the Yemeni Corner and the Black Stone recite 'Rabbana atina...'.\n" +
        "• Complete 7 circuits. Hijr Ismail (Hateem) is enclosed inside the circuit - walk around it, not through it.",
    },
    rules: {
      bn:
        "• পুরুষ: ১ম ৩ চক্করে রমল (দ্রুত ছোট পদক্ষেপ) ও ইদতিবা (ডান কাঁধ খোলা)।\n" +
        "• নারী: রমল বা ইদতিবা নেই - স্বাভাবিক গতিতে ও ঢাকা কাঁধে চলুন।\n" +
        "• তওয়াফের জন্য অজু থাকা আবশ্যক (অধিকাংশ আলেমের মতে)। অজু ভেঙে গেলে নবায়ন করে পুনরায় শুরু করুন।",
      en:
        "• Men: raml (brisk short steps) and idtiba' (bare right shoulder) in the first 3 circuits.\n" +
        "• Women: no raml or idtiba' - walk normally with shoulders covered.\n" +
        "• Wudu is required for Tawaf (majority view). If it breaks, renew it and restart.",
    },
    duas: ["black-stone-takbir", "yamani-corner-dua"],
    commonMistakes: [
      "tawaf-wrong-start",
      "tawaf-lost-count",
      "tawaf-without-wudu",
      "walked-through-hateem",
    ],
    isCompleteWhen: "counter-max",
    tip: {
      bn:
        "দূরত্ব: এক চক্কর ~৮০ মি (নিকটে, নিচতলায়) থেকে ~২০০-৩০০ মি (ভিড়/উপরের তলায়)। " +
        "৭ চক্করে মোট ~১.২-১.৫ কিমি (নিচতলায়)।",
      en:
        "Distance: one circuit ~80 m (close, ground floor) to ~200-300 m (crowded/upper floors). " +
        "7 circuits ~1.2-1.5 km at ground level.",
    },
    sourceRefs: [
      "https://islamqa.info/en/answers/31819",
      "https://umrah.nusuk.sa/Journey",
      "https://madainproject.com/tawaf_distance",
    ],
  },

  // -------------------------------------------------------------------------
  // ৬. তওয়াফের পর ২ রাকাআত ও যমযম
  // -------------------------------------------------------------------------
  {
    id: "pray-after-tawaf",
    stage: "pray",
    order: 6,
    title: { bn: "মাকামে ইবরাহিমে ২ রাকাআত ও যমযম", en: "2 rak'ahs at Maqam Ibrahim & Zamzam" },
    summary: {
      bn: "মাকামে ইবরাহিমের নিকটে ২ রাকাআত নামাজ আদায় করুন, তারপর যমযম পান করুন।",
      en: "Pray 2 rak'ahs near Maqam Ibrahim, then drink Zamzam.",
    },
    gender: "all",
    anchors: ["maqam-ibrahim", "zamzam"],
    duas: ["yamani-corner-dua"],
    whatToDo: {
      bn:
        "• মাকামে ইবরাহিমের নিকটে/পেছনে ২ রাকাআত নামাজ আদায় করুন (সূরা বাকারা ২:১২৫)।\n" +
        "• সম্ভব না হলে মসজিদের যেকোনো স্থানে পড়ুন।\n" +
        "• সুন্নাত: প্রথম রাকাআতে সূরা আল-কাফিরুন (১০৯), দ্বিতীয়ে সূরা আল-ইখলাস (১১২)।\n" +
        "• এরপর যমযম পানি পান করুন। বরকতের নিয়তে পান করা সুন্নাত।",
      en:
        "• Pray 2 rak'ahs near/behind Maqam Ibrahim (Quran 2:125).\n" +
        "• If impractical, pray anywhere in the mosque.\n" +
        "• Sunnah: Surah al-Kafirun (109) in the first rak'ah, al-Ikhlas (112) in the second.\n" +
        "• Then drink Zamzam water. Drinking with intention for blessing is sunnah.",
    },
    isCompleteWhen: "manual",
    tip: {
      bn: "সম্ভব হলে আল-মুলতাযামে (কাবার দরজা ও কালো পাথরের মধ্যবর্তী স্থান) দোয়া করুন।",
      en: "If possible, make dua at Al-Multazam (between the Kaaba door and the Black Stone).",
    },
    sourceRefs: ["https://islamqa.info/en/answers/31819", "https://umrah.nusuk.sa/Journey"],
  },

  // -------------------------------------------------------------------------
  // ৭. সাঈ (সাফা -> মারওয়া, ৭ পাক)
  // -------------------------------------------------------------------------
  {
    id: "sai",
    stage: "sai",
    order: 7,
    title: { bn: "সাঈ (সাফা থেকে মারওয়া, ৭ পাক)", en: "Sa'i (Safa to Marwa, 7 laps)" },
    summary: {
      bn: "সাফা ও মারওয়ার মধ্যে সাতবার পায়ে হেঁটে চলুন - সাফা থেকে শুরু, মারওয়ায় শেষ।",
      en: "Walk between Safa and Marwa seven times - starting at Safa, ending at Marwa.",
    },
    gender: "all",
    anchors: ["safa", "marwa", "sai-green-markers"],
    counter: {
      min: 1,
      max: 7,
      label: { bn: "পাক", en: "lap" },
      perRoundTips: [
        {
          bn:
            "১ম পাক (সাফা -> মারওয়া): সাফায় উঠে কিবলামুখে সাফা-মারওয়ার আয়াত পড়ুন ও দোয়া করুন। " +
            "সবুজ মাইলে পুরুষ দ্রুত চলুন, নারী স্বাভাবিক গতিতে।",
          en:
            "Lap 1 (Safa -> Marwa): at Safa, face the Qibla, recite the Safa-Marwa verse, and make dua. " +
            "Men walk briskly between the green markers, women normally.",
        },
        {
          bn: "২য় পাক (মারওয়া -> সাফা): মারওয়া থেকে সাফায় ফেরা। সবুজ মাইলের মধ্যে পুরুষ দৌড়ান।",
          en: "Lap 2 (Marwa -> Safa): return from Marwa to Safa. Men jog between the green markers.",
        },
        {
          bn: "৩য় পাক (সাফা -> মারওয়া): দুই সবুজ মাইলের মধ্যে দ্রুত চলুন (পুরুষ)।",
          en: "Lap 3 (Safa -> Marwa): walk briskly between the two green markers (men).",
        },
        {
          bn: "৪র্থ পাক (মারওয়া -> সাফা): ধীরে চলুন, দোয়া চালিয়ে যান।",
          en: "Lap 4 (Marwa -> Safa): walk calmly, keep making dua.",
        },
        {
          bn: "৫ম পাক (সাফা -> মারওয়া): সবুজ মাইলের কথা মনে রাখুন।",
          en: "Lap 5 (Safa -> Marwa): remember the green-marker brisk walk (men).",
        },
        {
          bn: "৬ষ্ঠ পাক (মারওয়া -> সাফা): প্রায় শেষে - গণনা নিশ্চিত করুন।",
          en: "Lap 6 (Marwa -> Safa): almost done - confirm your count.",
        },
        {
          bn: "৭ম পাক (সাফা -> মারও়া): এই পাকে মারওয়ায় শেষ হবে। সাঈ সম্পন্ন করুন।",
          en: "Lap 7 (Safa -> Marwa): this lap ends at Marwa. Sa'i is complete.",
        },
      ],
    },
    whatToDo: {
      bn:
        '• সাফা থেকে শুরু করুন: "ইন্নাস্ সাফা ওয়াল মারওয়াতা মিন শা\'আয়িরিল্লাহ..." পড়ুন (সূরা বাকারা ২:১৫৮)।\n' +
        "• সাফা থেকে মারওয়ার দিকে হাঁটুন।\n" +
        "• দুই সবুজ মাইলের (আল-মিলায়িন আল-আখদারাইন) মধ্যে পুরুষ দ্রুত চলবেন; নারী স্বাভাবিক গতিতে।\n" +
        "• মারওয়ায় পৌঁছলে = ১ পাক। সাফায় ফিরে আসা = ২ পাক।\n" +
        "• ৭ম পাকে মারওয়ায় শেষ করুন। (মারওয়া থেকে শুরু করবেন না!)",
      en:
        "• Begin at Safa: recite 'Innas-Safa wal-Marwata min sha'a'irillah...' (Quran 2:158).\n" +
        "• Walk from Safa toward Marwa.\n" +
        "• Between the two green markers, men walk briskly; women walk normally.\n" +
        "• Reaching Marwa = lap 1; returning to Safa = lap 2.\n" +
        "• End at Marwa on lap 7. (Do NOT start from Marwa!)",
    },
    rules: {
      bn:
        "• পুরুষ: দুই সবুজ মাইলের মধ্যে দ্রুত চলুন (জগিং সুন্নাত)।\n" +
        "• নারী: সবুজ মাইলেও দৌড়াবেন না - স্বাভাবিক গতিতে চলুন।\n" +
        "• একমুখী ~৪৫০ মি; মোট ~৩.১৫ কিমি।",
      en:
        "• Men: walk briskly (jogging is sunnah) between the green markers.\n" +
        "• Women: do not jog even between the markers - walk normally.\n" +
        "• One-way ~450 m; total ~3.15 km.",
    },
    duas: ["safa-verse"],
    commonMistakes: ["sai-started-from-marwa", "sai-incomplete"],
    isCompleteWhen: "counter-max",
    sourceRefs: [
      "https://islamqa.info/en/answers/31819",
      "https://umrah.nusuk.sa/Journey",
      "https://en.wikipedia.org/wiki/Safa_and_Marwa",
    ],
  },

  // -------------------------------------------------------------------------
  // ৮. হালক / তাকসির (ইহরাম থেকে মুক্তি)
  // -------------------------------------------------------------------------
  {
    id: "halq-taqsir",
    stage: "halq",
    order: 8,
    title: { bn: "হালক / তাকসির (চুল কাটা)", en: "Halq / Taqsir (cutting the hair)" },
    summary: {
      bn: "চুল কাটুন - পুরুষ মুণ্ডন বা ছাঁটাই করুন, নারী কেবল আঙুলের ডগা পরিমাণ ছাঁটুন।",
      en: "Cut the hair - men shave or trim, women trim a fingertip-length.",
    },
    gender: "all",
    whatToDo: {
      bn:
        "• পুরুষ: হালক (মাথা মুণ্ডন) উত্তম; তাকসির (ছাঁটাই) ও জায়েজ। নবী (সা.) মুণ্ডনকারীদের জন্য " +
        "৩ বার ও ছাঁটাইকারীদের জন্য ১ বার দোয়া করেছেন (মুসলিম ১৩০৩)।\n" +
        "• নারী: কেবল তাকসির - চুলের ডগা থেকে আঙুলের ডগা পরিমাণ (~১-২ সেমি) ছাঁটুন। " +
        "মাথা মুণ্ডন নারীর জন্য নিষিদ্ধ।\n" +
        "• চুল কাটা হলেই ইহরামের সমস্ত নিষেধ উঠে যায় এবং ওমরাহ সম্পন্ন হয়।",
      en:
        "• Men: halq (shaving the head) is preferred; taqsir (trimming) is also valid. The Prophet " +
        "made du'a 3 times for those who shaved, 1 time for trimmers (Muslim 1303).\n" +
        "• Women: taqsir only - trim a fingertip-length (~1-2 cm) from the hair ends. Shaving " +
        "is forbidden for women.\n" +
        "• Once the hair is cut, all ihram prohibitions lift and Umrah is complete.",
    },
    rules: {
      bn:
        "পুরুষের জন্য মুণ্ডন (হালক) উত্তম। নারীর জন্য শুধু ছাঁটাই (তাকসির) - এটিই তাদের ওমরাহ " +
        "সমাপ্তির উপায়। ভুলে গেলে কোনো শাস্তি ছাড়াই এখন চুল কেটে নিন।",
      en:
        "For men, shaving (halq) is preferred. For women, only trimming (taqsir) - this completes " +
        "their Umrah. If forgotten, cut the hair now with no penalty.",
    },
    commonMistakes: ["forgot-halq-taqsir"],
    isCompleteWhen: "manual",
    sourceRefs: ["https://islamqa.info/en/answers/31819", "https://umrah.nusuk.sa/Journey"],
  },

  // -------------------------------------------------------------------------
  // ৯. তাহাল্লুল সম্পন্ন
  // -------------------------------------------------------------------------
  {
    id: "done",
    stage: "done",
    order: 9,
    title: { bn: "ওমরাহ সম্পন্ন (তাহাল্লুল)", en: "Umrah complete (Tahallul)" },
    summary: {
      bn: "মাশাআল্লাহ, আপনার ওমরাহ সম্পন্ন হয়েছে। সমস্ত ইহরামের নিষেধ উঠে গেছে।",
      en: "MashaAllah, your Umrah is complete. All ihram prohibitions have lifted.",
    },
    gender: "all",
    whatToDo: {
      bn:
        "• চুল কাটা হয়েছে - আপনার ওমরাহ সম্পন্ন।\n" +
        "• ইহরামের সমস্ত নিষেধ (সুগন্ধি, সেলাই করা পোশাক ইত্যাদি) এখন উঠে গেছে।\n" +
        "• দোয়া কবুলের আশায় বেশি বেশি ইবাদত ও দোয়া করুন।\n" +
        "• চাইলে আরেকটি ওমরাহর জন্য আত-তানাইম (মসজিদে আয়িশা) যেতে পারেন।",
      en:
        "• Hair has been cut - your Umrah is complete.\n" +
        "• All ihram prohibitions (perfume, stitched clothing, etc.) have now lifted.\n" +
        "• Increase worship and dua, hoping for acceptance.\n" +
        "• To perform another Umrah, you may go out to Tan'eem (Masjid Aisha).",
    },
    isCompleteWhen: "manual",
    sourceRefs: ["https://umrah.nusuk.sa/Journey", "https://islamqa.info/en/answers/31819"],
  },
];

/** id দিয়ে ধাপ খুঁজে আনা */
export function getStepById(id: string): UmrahStep | undefined {
  return UMRAH_STEPS.find((step) => step.id === id);
}
