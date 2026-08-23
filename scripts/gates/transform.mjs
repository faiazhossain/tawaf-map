/**
 * গেট ডেটা ট্রান্সফর্ম (বিশুদ্ধ, নির্ভরতা-মুক্ত ফাংশন)
 *
 * Overpass API রপ্তানি (`data/gates/*.overpass.json`) থেকে মসজিদের গেট
 * বের করে একটি স্বাভাবিক `Gate[]` তালিকায় রূপান্তর করে। প্রতিটি ফাংশন
 * সম্পূর্ণ বিশুদ্ধ — কোনো I/O নেই, ফলে vitest দিয়ে সহজে পরীক্ষাযোগ্য।
 *
 * ফিল্টারের নীতি: শুধু "মসজিদের গেট"। হোটেলের প্রবেশদ্বার, টয়লেট,
 * কাবার দরজা এবং অভ্যন্তরীণ দরজা বাদ।
 */

// হোটেল / বেসামরিক প্রবেশদ্বার (মসজিদের গেট নয়) — haraam রপ্তানি থেকে
const HARAM_HOTEL_BLOCKLIST = new Set([
  5077494802, // Gate 4 - Jabel Omar Jumeirah East Tower
  6347449492, // Makkah Tower 6 Entrance
  6463226586, // Entrance 2 - Jabal Omar Hilton Suites
  6463226587, // Entrance 2 - Jabel Omar Hyatt Regency
  6484866064, // Entrance 3 - Jabel Omar Conrad
  10838162448, // Gate 6 - Jabel Omar Jumeirah West Tower
  10838162449, // Gate 5 - Jabel Omar Jumeirah
]);

/** কাবার দরজা (access=no) */
const HARAM_KAABA_DOOR_ID = 4900636561;

// DenormalizedGate আকার:
// { id, osmId, name, nameAr, nameEn, ref, wheelchair, coordinates:[lng,lat] }

/** লাতিন অঙ্ককে বাংলা অঙ্কে রূপান্তর (বহিঃস্থা থেকে বিচ্ছিন্ন কপি)। */
export function toBengaliNumber(value) {
  return String(value).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)] ?? d);
}

/**
 * নাম-থেকে-বাংলা ওভাররাইড টেবিল। `tags.name{/ar}` এর সাথে মিলে গেলে
 * বাংলা প্রদর্শন-নাম বের করা হয়; না মিললে সংখ্যার ভিত্তিতে `গেট N`
 * বা ইংরেজি নামে ফিরে যায়।
 */
const NAME_TO_BN = {
  "باب قريش": "বাব কুরাইশ",
  "باب الملك فھد": "কিং ফাহদ গেট",
  "باب الملك عبد العزیز": "কিং আব্দুল আজিজ গেট",
  "باب الملك عبد الله": "কিং আব্দুল্লাহ গেট",
  "باب الفتح": "বাব আল-ফাতহ গেট",
  "باب العمرة": "উমরা গেট",
  "باب السلام": "বাব সালাম গেট",
  "باب المروة": "বাব মারওয়া গেট",
  "باب أجياد": "আজিয়াদ গেট",
  "باب الحديبية": "বাব হুদায়বিয়াহ গেট",
  "باب علي": "বাব আলী গেট",
  "باب النبي": "বাব আন-নবী গেট",
  "باب الكعبة": "বাব আল-কাবা",
  "مدخل النساء للروضة الشريفة": "নারীদের রওজা প্রবেশ",
  "مدخل النساء": "নারীদের প্রবেশ",
  "Women's Entry into noble Rawda": "নারীদের রওজা প্রবেশ",
  "Women's Entrance": "নারীদের প্রবেশ",
};

/** `tags{name:ar}` থেকে বাংলা নাম বের করার চেষ্টা (উপরের টেবিল ধরে)। */
function bengaliFromArabic(nameAr) {
  for (const [ar, bn] of Object.entries(NAME_TO_BN)) {
    if (nameAr.includes(ar)) return bn;
  }
  return undefined;
}

/**
 * নাম-নির্ভর বাংলা প্রদর্শন-নাম।
 * ১) ওভাররাইড টেবিল, ২) না হলে `গেট N` (সংখ্যার জন্য), ৩) ইংরেজি নাম।
 * `nameAr` অনুপস্থিত থাকলে `name` (নববীর সংখ্যানাম "301"/"301, 302") থেকেও
 * সংখ্যা বের করা হয় — যেন মদিনার নাম-সংখ্যাযুক্ত গেটগুলোও বাংলা হয়।
 */
export function makeBengaliName(nameAr, nameEn, ref, numericName) {
  const numberSource = ref || (numericName && /^[\d,\s]+$/.test(numericName) ? numericName : undefined);
  if (nameAr) {
    const fromTable = bengaliFromArabic(nameAr);
    if (fromTable) return fromTable;
  }
  if (numberSource) return `গেট ${toBengaliNumber(numberSource.trim())}`;
  return nameEn || "গেট";
}

/** শুধু সংখ্যামূলক ref আছে কিনা। */
function hasNumericRef(ref) {
  return typeof ref === "string" && /^\d+$/.test(ref.trim());
}

/** haraam (মক্কা) উপাদান ফিল্টার — শুধু মসজিদের প্রবেশদ্বার। */
export function filterHaramGates(elements) {
  return elements.filter((el) => {
    if (el.type !== "node" || !el.tags) return false;
    const t = el.tags;
    if (!["yes", "main"].includes(t.entrance)) return false;
    if (t.access === "no") return false;
    if (t.indoor === "door") return false;
    if (HARAM_HOTEL_BLOCKLIST.has(el.id)) return false;
    if (el.id === HARAM_KAABA_DOOR_ID) return false;
    // নাম বা সংখ্যাসূচক ref থাকতে হবে
    const hasName = !!(t.name || t["name:ar"] || t["name:en"]);
    return hasName || hasNumericRef(t.ref);
  });
}

/** নবী মসজিদ (মদিনা) উপাদান ফিল্টার — শুধু `barrier=gate` এবং প্রবেশযোগ্য। */
export function filterNabawiGates(elements) {
  return elements.filter((el) => {
    if (!el.tags) return false;
    if (el.tags.barrier !== "gate") return false;
    if (el.tags.access === "no") return false;
    return true;
  });
}

/** একটি তথ্য-উপাদান থেকে স্বাভাবিক গেট গঠন করে। */
export function denormalizeNode(node) {
  const t = node.tags || {};
  const nameAr = t["name:ar"] || t.name || "";
  const nameEn = t["name:en"] || t.name || "";
  const ref = typeof t.ref === "string" ? t.ref : "";
  const wheelchair = t.wheelchair === "yes";
  const hasPoint = Array.isArray(node.center) ? node.center : null;
  const lng = hasPoint ? node.center[0] : node.lon;
  const lat = hasPoint ? node.center[1] : node.lat;

  if (typeof lng !== "number" || typeof lat !== "number") {
    throw new Error(`গেট id=${node.id} কোনো স্থানাঙ্ক নেই`);
  }

  return {
    id: `+osm-${node.id}`,
    osmId: node.id,
    name: makeBengaliName(nameAr, nameEn, ref, nameEn),
    nameAr,
    nameEn,
    ref,
    wheelchair,
    coordinates: [lng, lat],
  };
}

/** স্বাভাবিক গেট থেকে তালিকা-ভিত্তিক `Gate[]` গঠন করে (সম্ভাব্য `type` বাদ)। */
export function toGate(g) {
  return {
    id: g.id,
    name: g.name,
    nameAr: g.nameAr,
    // লাতিন নাম সার্চের জন্য রাখা হয় ("fahd"/"gate 90" টাইপ কোয়েরি)
    ...(g.nameEn ? { nameEn: g.nameEn } : {}),
    nameBn: g.name,
    location: { coordinates: g.coordinates },
    facilities: g.wheelchair ? ["wheelchair"] : [],
    nearestLandmarks: [],
  };
}

/** একজন Overpass রপ্তানি থেকে মসজিদের গেটের তালিকা তৈরি করে। */
export function extractGatesFromOverpass(elements, venue) {
  const filtered = venue === "haram" ? filterHaramGates(elements) : filterNabawiGates(elements);
  return filtered.map((el) => denormalizeNode(el));
}