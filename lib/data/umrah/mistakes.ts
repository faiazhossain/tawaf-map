import type { Mistake } from "@/types/umrah";

/**
 * "আমি একটি ভুল করেছি" সহায়কের ডেটা
 *
 * পরিকল্পনার পরিচ্ছেদ ৪.২ থেকে নেওয়া। এটি একটি সরল সিদ্ধান্ত বৃক্ষ: প্রতিটি নোড হয়
 * শাখা (branches - হ্যাঁ/না প্রশ্ন → nextId) অথবা টার্মিনাল (outcome - চূড়ান্ত ফলাফল)।
 *
 * নীতি: অধিকাংশ ভুলই ওমরাহকে বাতিল করে না। প্রয়োজন হয় কিছুই না (ভুলে গেলে),
 * কাফফারা (পছন্দমতো), অথবা কাজটি সম্পন্ন/পুনরাবৃত্তি। সত্যিকারের বাতিল মূলত শুধু
 * তাহাল্লুলের আগে সহবাস এবং (অধিকাংশের মতে) অপবিত্র অবস্থায় অপুনরাবৃত্তি তওয়াফ।
 *
 * যেখানে মতভেদ আছে (তাকয়ীর বনাম তারতিব), উভয় মত উপস্থাপন করা হয়েছে - রায় দেওয়া হয় না।
 */
export const UMRAH_MISTAKES: Mistake[] = [
  // --------------------- ইহরাম / মিকাত ---------------------
  {
    id: "crossed-miqat-without-ihram",
    category: "ihram",
    question: {
      bn: "মিকাত পার হওয়ার সময় কি আপনি ইহরাম বাঁধেননি?",
      en: "Did you cross the miqat without entering ihram?",
    },
    branches: [
      {
        condition: { bn: "হ্যাঁ, ওমরাহর নিয়ত নিয়েই ছিলাম", en: "Yes, I intended Umrah" },
        nextId: "crossed-miqat-returned-or-not",
      },
      {
        condition: { bn: "না, তখন ওমরাহর নিয়ত ছিল না", en: "No, I had no such intention" },
        nextId: "crossed-miqat-no-intention",
      },
    ],
    sourceRefs: ["https://islamqa.info/en/answers/69934"],
  },
  {
    id: "crossed-miqat-returned-or-not",
    category: "ihram",
    question: {
      bn: "আপনি কি মিকাতে ফিরে গিয়ে ইহরাম বেঁধেছেন?",
      en: "Did you return to the miqat and enter ihram there?",
    },
    branches: [
      {
        condition: { bn: "হ্যাঁ, ফিরে গেছি", en: "Yes, I returned" },
        nextId: "crossed-miqat-returned-ok",
      },
      {
        condition: { bn: "না, ফিরে যাইনি", en: "No, I did not return" },
        nextId: "crossed-miqat-not-returned",
      },
    ],
    sourceRefs: ["https://islamqa.info/en/answers/69934"],
  },
  {
    id: "crossed-miqat-returned-ok",
    category: "ihram",
    question: {
      bn: "মিকাতে ফিরে গিয়ে ইহরাম বেঁধেছেন।",
      en: "You returned to the miqat and entered ihram.",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "আপনার ওমরাহ বৈধ। মিকাতে ফিরে গিয়ে ইহরাম বেঁধে নেওয়ায় কোনো কাফফারা নেই। " +
          "স্বাভাবিকভাবে ওমরাহ চালিয়ে যান।",
        en:
          "Your Umrah is valid. Returning to the miqat to enter ihram means no expiation is owed. " +
          "Continue your Umrah normally.",
      },
      expiation: "none",
    },
    sourceRefs: ["https://islamqa.info/en/answers/69934"],
  },
  {
    id: "crossed-miqat-not-returned",
    category: "ihram",
    question: {
      bn: "মিকাত পার হয়েছেন কিন্তু ফিরে যাননি।",
      en: "You crossed the miqat and did not return.",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "অধিকাংশ আলেমের মতে ওমরাহ বৈধ, কিন্তু একটি দম (একটি পশু কুরবানি) আবশ্যক। " +
          "দম হারামের ভেতরে করতে হবে এবং মাংস হারামের গরিবদের মাঝে বিতরণ করতে হবে।",
        en:
          "By the majority view the Umrah is valid, but a Dam (sacrifice of one sheep) is required. " +
          "The slaughter must be inside the Haram and the meat given to the poor of the Haram.",
      },
      expiation: "dam",
    },
    sourceRefs: ["https://islamqa.info/en/answers/69934"],
  },
  {
    id: "crossed-miqat-no-intention",
    category: "ihram",
    question: {
      bn: "মিকাত পার হওয়ার সময় ওমরাহর নিয়ত ছিল না।",
      en: "You crossed the miqat without intending Umrah.",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "কোনো শাস্তি নেই। আপনি যখন ওমরাহর নিয়ত করেছেন, সেখান থেকেই ইহরাম বাঁধুন এবং " +
          "স্বাভাবিকভাবে ওমরাহ পালন করুন।",
        en:
          "No penalty is owed. When you decide on Umrah, enter ihram from where you are and perform " +
          "it normally.",
      },
      expiation: "none",
    },
    sourceRefs: ["https://islamqa.info/en/answers/69934"],
  },

  // --------------------- তওয়াফ ---------------------
  {
    id: "tawaf-wrong-start",
    category: "tawaf",
    question: {
      bn: "তওয়াফ কি ভুল স্থান থেকে শুরু করেছেন?",
      en: "Did you start Tawaf from the wrong point?",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "আগের চক্করগুলো গণ্য হবে না। কালো পাথরের সারি থেকে পুনরায় শুরু করুন এবং ৭ চক্কর " +
          "সম্পূর্ণ করুন। সম্পূর্ণ হলে তওয়াফ বৈধ।",
        en:
          "The earlier circuits do not count. Resume from the Black Stone alignment and complete 7 " +
          "circuits. Once complete, the Tawaf is valid.",
      },
    },
    sourceRefs: ["https://islamqa.info/en/answers/31819"],
  },
  {
    id: "tawaf-lost-count",
    category: "tawaf",
    question: {
      bn: "তওয়াফে চক্করের সংখ্যা নিয়ে সন্দেহ হয়েছে?",
      en: "Lost count / unsure how many circuits you have done?",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "নিশ্চিত (কম) সংখ্যার উপর ভিত্তি করে বাকিগুলো সম্পূর্ণ করে ৭-এ পৌঁছান। যেমন, ৬ বা ৭ " +
          "নিশ্চিত না হলে ৬ ধরে আরেকটি চক্কর দিন।",
        en:
          "Build on the certain (lower) number and complete to 7. For example, if unsure whether " +
          "you have done 6 or 7, assume 6 and do one more circuit.",
      },
    },
    sourceRefs: ["https://islamqa.info/en/answers/31819"],
  },
  {
    id: "tawaf-without-wudu",
    category: "tawaf",
    question: {
      bn: "তওয়াফের সময় কি অজু ভেঙে গিয়েছিল (বা অজু ছাড়াই করেছিলেন)?",
      en: "Did your wudu break during Tawaf (or did Tawaf without wudu)?",
    },
    branches: [
      {
        condition: {
          bn: "হ্যাঁ, আবার অজু নিয়ে তওয়াফ পুনরায় করেছি",
          en: "Yes, I renewed wudu and redid Tawaf",
        },
        nextId: "tawaf-wudu-redone",
      },
      {
        condition: { bn: "না, পুনরায় করিনি", en: "No, I did not redo it" },
        nextId: "tawaf-wudu-not-redone",
      },
    ],
    sourceRefs: ["https://islamqa.info/en/answers/34695"],
  },
  {
    id: "tawaf-wudu-redone",
    category: "tawaf",
    question: {
      bn: "অজু নবায়ন করে তওয়াফ পুনরায় করেছেন।",
      en: "You renewed wudu and redid the Tawaf.",
    },
    outcome: {
      valid: "valid",
      action: {
        bn: "আপনার তওয়াফ বৈধ। কোনো কাফফারা নেই।",
        en: "Your Tawaf is valid. No expiation is owed.",
      },
      expiation: "none",
    },
    sourceRefs: ["https://islamqa.info/en/answers/34695"],
  },
  {
    id: "tawaf-wudu-not-redone",
    category: "tawaf",
    question: {
      bn: "অজু ভেঙে যাওয়া সত্ত্বেও তওয়াফ পুনরায় করেননি।",
      en: "You did not redo the Tawaf despite the broken wudu.",
    },
    outcome: {
      valid: "depends",
      action: {
        bn:
          "অধিকাংশ আলেমের মতে তওয়াফ অবৈধ - মক্কায় থাকলে অজু নিয়ে তওয়াফ পুনরায় করুন। " +
          "(ইবনে তাইমিয়া ও আবু হানিফার মতে সামান্য অপবিত্রতায় তওয়াফ বৈধ, তবে নবায়ন " +
          "মুস্তাহাব।) এ বিষয়ে নিশ্চিত হতে আলেমের পরামর্শ নিন।",
        en:
          "By the majority view the Tawaf is invalid - redo it with wudu if you are still in Makkah. " +
          "(Ibn Taymiyyah and Abu Hanifah held minor impurity does not invalidate it, but renewal is " +
          "recommended.) Consult a scholar to be certain.",
      },
      expiation: "see-scholar",
    },
    sourceRefs: ["https://islamqa.info/en/answers/34695"],
  },
  {
    id: "walked-through-hateem",
    category: "tawaf",
    question: {
      bn: "কাবা ও হাতিম দেয়ালের মাঝখান দিয়ে হেঁটেছেন (কোনো চক্করে)?",
      en: "Did you walk between the Kaaba and the Hateem wall during a circuit?",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "সেই চক্করটি গণ্য হবে না - পুনরায় করুন। হিজরে ইসমাইল (হাতিম) কাবারই অংশ, তাই " +
          "এটি ঘুরে চলতে হয়, ভেতর দিয়ে নয়। ৭টি বৈধ চক্কর নিশ্চিত করুন।",
        en:
          "That circuit does not count - redo it. Hijr Ismail (Hateem) is part of the Kaaba, so you " +
          "must walk around it, not through it. Ensure 7 valid circuits.",
      },
    },
    sourceRefs: ["https://discoverharamain.com/guides/hijr-ismail"],
  },

  // --------------------- সাঈ ---------------------
  {
    id: "sai-started-from-marwa",
    category: "sai",
    question: {
      bn: "সাঈ কি মারওয়া থেকে শুরু করেছেন?",
      en: "Did you start Sa'i from Marwa?",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "সাফা থেকে মারওয়া পর্যন্ত যাওয়া = ১ পাক। মারওয়া থেকে শুরু করলে সেই দৈর্ঘ্য গণ্য হবে না। " +
          "সাফা থেকে পুনরায় শুরু করুন (সূরা বাকারা ২:১৫৮)।",
        en:
          "Going Safa -> Marwa counts as lap 1. Starting from Marwa means that length does not count. " +
          "Restart from Safa (Quran 2:158).",
      },
    },
    sourceRefs: ["https://islamqa.info/en/answers/31819"],
  },
  {
    id: "sai-incomplete",
    category: "sai",
    question: {
      bn: "সাঈ কি সম্পূর্ণ করতে পারেননি (৭ পাক হয়নি)?",
      en: "Did you not complete all 7 laps of Sa'i?",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "বাকি পাকগুলো সম্পূর্ণ করুন। সাফা -> মারওয়া = ১ পাক ... ৭ম পাকে মারওয়ায় শেষ করুন। " +
          "আগে যত পাক করেছেন তা ধরে বাকিটা পূরণ করুন।",
        en:
          "Complete the remaining laps. Safa -> Marwa = lap 1 ... end at Marwa on lap 7. Count what " +
          "you have already done and complete the rest.",
      },
    },
    sourceRefs: ["https://islamqa.info/en/answers/31819"],
  },

  // --------------------- হালক / তাকসির ---------------------
  {
    id: "forgot-halq-taqsir",
    category: "halq",
    question: {
      bn: "তওয়াফ-সাঈ শেষে চুল কাটতে ভুলে গেছেন?",
      en: "Did you forget to shave/trim your hair after Tawaf and Sa'i?",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "ইহরামের পোশাক পরে এখনই চুল কাটুন, তারপর পোশাক বদলান। ভুলে গেলে বা অজ্ঞতাবশত " +
          "করেননি তাহলে কোনো শাস্তি নেই (অধিকাংশের মতে)। চুল কাটা হলেই ইহরাম উঠে যাবে।",
        en:
          "Put the ihram garments back on, cut your hair now, then change. If it was forgotten or " +
          "done out of ignorance, no penalty is owed (majority view). Cutting the hair lifts ihram.",
      },
      expiation: "none",
    },
    sourceRefs: ["https://islamqa.info/en/answers/122795"],
  },

  // --------------------- গম্ভীর বিষয় (বাতিল) ---------------------
  {
    id: "intercourse-before-tahallul",
    category: "other",
    question: {
      bn: "তাহাল্লুলের আগে (চুল কাটার আগে) কি সহবাস হয়েছে?",
      en: "Did intercourse take place before tahallul (before cutting the hair)?",
    },
    outcome: {
      valid: "invalid",
      action: {
        bn:
          "এটি ওমরাহ বাতিল করে দেয়। তবু আনুষ্ঠানিকতাগুলো সম্পূর্ণ করুন, তারপর এই ওমরাহর কাযা " +
          "(পুনরায় পালন) এবং প্রত্যেকের জন্য একটি করে দম আবশ্যক। এ ক্ষেত্রে অবশ্যই আলেমের পরামর্শ নিন।",
        en:
          "This invalidates the Umrah. Still complete the rites, then perform a make-up (qada) Umrah " +
          "and offer a Dam (sheep) per person. You must consult a scholar in this case.",
      },
      expiation: "qada-plus-dam",
    },
    sourceRefs: ["https://islamqa.info/en/answers/119134"],
  },
  {
    id: "pushing-harsh-behavior",
    category: "other",
    question: {
      bn: "ভিড়ে কাউকে ধাক্কা দিয়েছেন বা রূঢ় আচরণ করেছেন?",
      en: "Did you push someone or behave harshly in the crowd?",
    },
    outcome: {
      valid: "valid",
      action: {
        bn:
          "এটি ওমরাহ বাতিল করে না, কিন্তু পাপ ও সওয়াব নষ্ট করে। তওবা করুন, ক্ষতিগ্রস্ত ব্যক্তির " +
          "কাছে ক্ষমা চান এবং আগামীতে ধৈর্য ও নম্রতা বজায় রাখুন।",
        en:
          "This does not invalidate Umrah, but it is sinful and forfeits reward. Make tawbah, seek " +
          "forgiveness from anyone you wronged, and keep patience and gentleness going forward.",
      },
      expiation: "none",
    },
    sourceRefs: ["https://islamqa.info/en/answers/31819"],
  },
];

/** id দিয়ে ভুল-নোড খুঁজে আনা */
export function getMistakeById(id: string): Mistake | undefined {
  return UMRAH_MISTAKES.find((mistake) => mistake.id === id);
}

/** শ্রেণি অনুযায়ী রুট ভুলগুলো খুঁজে আনা (assistant-এর প্রথম ধাপের জন্য) */
export function getMistakesByCategory(category: Mistake["category"]): Mistake[] {
  return UMRAH_MISTAKES.filter((mistake) => mistake.category === category);
}
