/**
 * ওমরাহ গাইড - ডেটা মডেল টাইপসমূহ
 *
 * এই ফাইলটি ওমরাহ গাইড ফিচারের সমস্ত ইন্টারফেস ও টাইপ সংজ্ঞা ধারণ করে।
 * ব্যবহারকারীর জন্য দৃশ্যমান সকল টেক্সট ফিল্ড দ্বিভাষিক { bn, en } অবজেক্ট হিসেবে সংজ্ঞায়িত,
 * আরবি টেক্সট (প্রার্থনা/স্থানের নাম) আলাদাভাবে dir="rtl" এ রেন্ডারের জন্য রাখা হয়েছে।
 *
 * স্থানাঙ্ক সবসময় [longitude, latitude] (GeoJSON/MapLibre রীতি)।
 */

/** দ্বিভাষিক টেক্সট - বাংলা প্রাথমিক, ইংরেজি গৌণ */
export interface LocalizedString {
  bn: string;
  en: string;
}

/** দ্বিভাষিক মার্কডাউন টেক্সট (whatToDo, rules ইত্যাদির জন্য) */
export type LocalizedMarkdown = LocalizedString;

// ---------------------------------------------------------------------------
// 7.1 আনুষ্ঠানিক স্থান / অ্যাংকর
// ---------------------------------------------------------------------------

/** একটি আনুষ্ঠানিক স্থানের মানচিত্রে ভূমিকা */
export type AnchorRole =
  | "tawaf-start" // হাজরে আসওয়াদ - তওয়াফ শুরু/শেষ
  | "tawaf-corner" // রুকনে ইয়ামানি - তওয়াফের কোণা
  | "pray-after-tawaf" // মাকামে ইবরাহিম - তওয়াফের পর ২ রাকাআত
  | "sai-start" // সাফা - সাঈ শুরু
  | "sai-end" // মারওয়া - সাঈ শেষ
  | "sai-green-markers" // দুই সবুজ মাইল - সাঈ-এর দৌড়ের অংশ
  | "kaaba" // কাবা গৃহ
  | "hateem" // হিজরে ইসমাইল / হাতিম
  | "multazam" // আল-মুলতাযাম
  | "mizab" // মিযাবে রহমত (রহমতের নর্দমা)
  | "mataf" // মাতাফ - তওয়াফের উন্মুক্ত এলাকা
  | "zamzam"; // যমযম কূপ

/** মানচিত্রে নোঙর করা একটি আনুষ্ঠানিক স্থান */
export interface RitualAnchor {
  id: string; // "black-stone" | "maqam-ibrahim" | "rukn-yamani" | ...
  name: LocalizedString;
  nameAr?: string; // আরবি, dir="rtl" এ রেন্ডার হবে
  role: AnchorRole;
  /** [longitude, latitude] - স্থানাঙ্ক আনুমানিক, তবে যথাযথ উৎস থেকে নেওয়া */
  location: { coordinates: [number, number] };
  image?: string; // /public/images থেকে পুনঃব্যবহার যোগ্য
  sourceRefs: string[];
}

// ---------------------------------------------------------------------------
// 7.2 ওমরাহ ধাপ
// ---------------------------------------------------------------------------

/** লিঙ্গ অনুসারে ধাপ দেখানো/আড়াল */
export type GenderFilter = "all" | "male" | "female";

/** একটি ধাপের পর্যায় */
export type UmrahStage =
  | "prep"
  | "ihram"
  | "travel"
  | "enter"
  | "tawaf"
  | "pray"
  | "sai"
  | "halq"
  | "done";

/** ধাপ সম্পন্ন হওয়ার শর্ত */
export type CompletionCondition = "manual" | "counter-max" | "proximity" | "manual|proximity";

/** কাউন্টার সহ ধাপের (তওয়াফ/সাঈ) কাউন্টার কনফিগ */
export interface StepCounter {
  min: number; // সাধারণত 1
  max: number; // তওয়াফ/সাঈ-এর জন্য 7
  label: LocalizedString;
  /** প্রতি চক্কর/পাকের জন্য নির্দেশনা (ঐচ্ছিক) - index 0..max-1 */
  perRoundTips?: LocalizedString[];
}

/** একটি ওমরাহ ধাপ */
export interface UmrahStep {
  id: string; // "ihram-miqat" | "tawaf" | "sai" | ...
  stage: UmrahStage;
  order: number; // সরল অনুক্রমের ক্রম
  title: LocalizedString;
  summary: LocalizedString;
  gender: GenderFilter; // লিঙ্গ অনুযায়ী শাখা
  anchors?: RitualAnchor["id"][]; // মানচিত্রের অবস্থান
  counter?: StepCounter; // তওয়াফ/সাঈ-এর জন্য 1..7
  whatToDo: LocalizedMarkdown; // কী করবেন (মার্কডাউন)
  rules?: LocalizedMarkdown; // করণীয়/বর্জনীয়
  duas?: string[]; // dua id সমূহ
  commonMistakes?: string[]; // mistakes টেবিলের id (পরিচ্ছেদ 4)
  isCompleteWhen: CompletionCondition;
  tip?: LocalizedString;
  sourceRefs: string[];
}

// ---------------------------------------------------------------------------
// 7.3 অনবোর্ডিং প্রোফাইল
// ---------------------------------------------------------------------------

/** ভ্রমণপথ - মিকাত ইঞ্জিন চালায় */
export type TravelPath =
  | "air-dhaka-jeddah" // ঢাকা -> জেদ্দা (বিমানে, ডিফল্ট)
  | "via-madinah" // মদিনা হয়ে
  | "already-in-makkah" // ইতিমধ্যে মক্কায়
  | "already-in-jeddah" // ইতিমধ্যে জেদ্দায়
  | "other"; // অন্যান্য / নিশ্চিত নই

export type TravelGroup = "solo" | "group" | "family";

export type Madhhab = "hanafi" | "maliki" | "shafii" | "hanbali" | "all";

/** প্রবেশযোগ্যতা চাহিদা */
export interface Accessibility {
  wheelchair: boolean; // হুইলচেয়ার প্রয়োজন
  slowPace: boolean; // ধীরগতি প্রয়োজন
}

/** ব্যবহারকারীর অনবোর্ডিং থেকে তৈরি প্রোফাইল - শাখা নির্ধারণ করে */
export interface UmrahProfile {
  gender: "male" | "female";
  travelPath: TravelPath;
  hasMahram?: boolean; // নারী হলে প্রাসঙ্গিক
  travelGroup?: TravelGroup;
  accessibility?: Accessibility;
  madhhab?: Madhhab; // ডিফল্ট "all" (সব মত দেখাও)
  miqatId: string; // মিকাত ইঞ্জিন travelPath থেকে নির্ধারণ করে
  groupLeaderPhone?: string;
  meetingPoint?: { label: string; coordinates: [number, number] };
}

// ---------------------------------------------------------------------------
// 7.4 দোয়া / প্রার্থনা
// ---------------------------------------------------------------------------

/** একটি দোয়া / প্রার্থনা সামগ্রী */
export interface Dua {
  id: string; // "talbiyah" | "yamani-corner-dua" | "safa-verse" ...
  title: LocalizedString;
  arabic: string; // dir="rtl" এ রেন্ডার হবে
  transliteration?: string; // রোমান লিপি
  translationBn: string; // বাংলা অনুবাদ
  translationEn?: string; // ইংরেজি অনুবাদ
  whenToRecite: LocalizedString; // কখন পড়বেন
  audio?: { ar?: string; bn?: string }; // /public/audio এর নিচে
  sourceRefs: string[];
}

// ---------------------------------------------------------------------------
// 7.5 ভুল / পরিত্রাণ (assistant এর জন্য)
// ---------------------------------------------------------------------------

/** কাফফারের ধরন */
export type ExpiationType =
  | "none"
  | "sadaqah" // সাদাকা/ফিদয়া - খাদ্য
  | "dam" // দম - পশু কুরবানি
  | "takhyir" // যেকোনো একটি (মালেকি/শাফেয়ী/হাম্বলী)
  | "tartib" // ক্রমানুসারে (হানাফী)
  | "qada-plus-dam" // কাযা + দম
  | "see-scholar"; // আলেমের পরামর্শ নিন

/** ওমরাহ বৈধতা */
export type Validity = "valid" | "invalid" | "depends";

/** একটি ভুলের ফলাফল */
export interface MistakeOutcome {
  valid: Validity;
  action: LocalizedString; // কী করবেন
  expiation?: ExpiationType;
}

/** ভুলের শ্রেণি */
export type MistakeCategory = "ihram" | "tawaf" | "sai" | "purity" | "halq" | "other";

/** সিদ্ধান্ত বৃক্ষের একটি শাখা */
export interface MistakeBranch {
  condition: LocalizedString; // হ্যাঁ/না প্রশ্ন
  /** condition সত্য হলে যে nextId তে যাবে */
  nextId: string;
}

/** "আমি একটি ভুল করেছি" সহায়কের একটি এন্ট্রি */
export interface Mistake {
  id: string;
  category: MistakeCategory;
  question: LocalizedString;
  /** সরল সিদ্ধান্ত বৃক্ষ - উত্তর অনুযায়ী পরবর্তী নোড */
  branches?: MistakeBranch[];
  outcome?: MistakeOutcome; // টার্মিনাল নোডে ফলাফল
  sourceRefs: string[];
}

// ---------------------------------------------------------------------------
// 7.6 গেট এক্সটেনশন (types/gate.ts এ Gate এ যোগ করা হয়েছে)
// ---------------------------------------------------------------------------

/** একটি গেট কোন ধাপের জন্য উপযুক্ত তার নির্দেশ */
export interface GateSuitability {
  stepId: string;
  note: LocalizedString;
}

// ---------------------------------------------------------------------------
// মিকাত (7.x) - miqat.ts এর জন্য
// ---------------------------------------------------------------------------

/** মক্কা থেকে দিক */
export type MiqatDirection = "north" | "northwest" | "east" | "northeast" | "south";

/** একটি মিকাত পয়েন্ট */
export interface MiqatPoint {
  id: string;
  name: LocalizedString;
  nameAr?: string;
  direction: MiqatDirection; // মক্কা থেকে দিক
  distanceKm: string; // আনুমানিক দূরত্ব (পরিসর সহ)
  serves: LocalizedString; // কাদের জন্য
  location: { coordinates: [number, number] };
  sourceRefs: string[];
}

/** কোন TravelPath এ কোন মিকাত প্রযোজ্য তার ম্যাপিং */
export interface TravelPathMiqat {
  travelPath: TravelPath;
  /** প্রাথমিক মিকাত id; "other" এর জন্য null (মিকাত মানচিত্র দেখাও) */
  miqatId: string | null;
  /** যাত্রাপথ সম্পর্কে ব্যাখ্যা (যেমন: বিমানে মিকাত পার হওয়ার আগে ইহরাম) */
  explanation: LocalizedString;
  warning?: LocalizedString; // যেমন: জেদ্দা বিমানবন্দরে ইহরাম নিষিদ্ধ
}
