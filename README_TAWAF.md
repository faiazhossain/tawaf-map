# Project Tawaf

> Empowering the independent pilgrim through localized AI navigation - Barikoi's strategic expansion in Saudi Arabia.

## Overview

Project Tawaf is a visual, localized navigation platform engineered specifically for the spatial realities of Makkah and Madinah. It bridges the gap between global booking platforms and the fragmented local ground experience for Umrah and Hajj pilgrims.

## The Problem

### The Shift in Pilgrim Behavior

- Tech-savvy travelers increasingly prefer **solo Umrah** over rigid agency packages
- Pilgrims want flexible, self-managed journeys
- Global booking platforms get them to Saudi Arabia, but **localized ground experience remains fragmented**

### Ground Reality Challenges

| Challenge                 | Description                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Gate-Based Navigation** | Standard street addresses are irrelevant. Pilgrims navigate using specific gate numbers and names in Makkah and Madinah. |
| **Spatial Blindness**     | Heavy research required to understand actual walkable distance between hotels and the Haram.                             |
| **Opaque Amenities**      | Lack of immediate, transparent access to local transport options and nearby eateries.                                    |

## The Solution: TawafMap

A comprehensive digital ecosystem built for local spatial reality, designed for independent navigation.

### Core Features

1. **Micro-Positioning**
   - Immediate understanding of exact user position relative to specific gate numbers and gate names

2. **True Proximity**
   - Accurate calculation of actual walking distance from user's hotel to the Haram

3. **Curated Sustenance**
   - Discovery of all local eateries, dynamically filtered by cuisine type and price point

4. **Seamless Mobility**
   - Real-time aggregation of available transport options

5. **Future Expansion**
   - Built-in architecture for visa integration and comprehensive religious guidance

## Vision: Multimodal AI Assistant

The ultimate vision is an intelligent, location-based assistant for everyone performing Umrah and Hajj.

| Module                            | Capability                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **See (Visual Engine)**           | Dynamic rendering of spatial data, gate proximity, and visual navigation cues                                |
| **Listen (Auditory Interface)**   | Voice-guided localization and contextual audio assistance for hands-free guidance in dense crowds            |
| **Act (Actionable Intelligence)** | Direct integration with logistics, transport booking, and dynamic route adjustments based on real-time needs |

## Strategic Context

- Barikoi operates as an **independent company** in Saudi Arabia
- Uniquely positioned to solve localization challenges for religious tourism
- Organizes the fragmented reality of Makkah and Madinah into a seamless digital experience

## Target Users

- **Primary**: Independent, tech-enabled pilgrims performing solo Umrah
- **Secondary**: Non-tech-savvy pilgrims seeking simple, precise navigation
- **Future**: All pilgrims performing Umrah and Hajj

## Key Differentiators

- **Gate-based navigation** instead of street addresses
- **Walking distance accuracy** for hotel-to-Haram proximity
- **Localized content** for eateries and transport
- **Multimodal interface** (visual + voice + action)
- **Purpose-built** for religious tourism spatial challenges

## Project Structure

```
tileserver_staging/
├── styles/              # Map style configurations
│   └── planet_map.json  # Main map style
├── tiles/               # Vector tile data
├── fonts/               # Map fonts
└── config.json          # Server configuration
```

## Related Resources

- Tile Server: `https://tiles.bmapsbd.com/bangladesh`
- Documentation: `POI_Tile_Generation_Process.md`

---

## ওমরাহ গাইড (Interactive Umrah Guide)

মানচিত্র-কেন্দ্রিক, ধাপে ধাপে ব্যক্তিগতকৃত ওমরাহ গাইড — বাংলাদেশি তীর্থযাত্রীদের জন্য, বাংলা-প্রথম।
সম্পূর্ণ ব্লুপ্রিন্ট: [`UMRAH_GUIDE_PLAN.md`](./UMRAH_GUIDE_PLAN.md)। বাস্তবায়ন ধাপে ধাপে এগোচ্ছে।

### অগ্রগতি (Progress)

| ফেজ                                           | বিবরণ                                                                                                                          | অবস্থা                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| **U1** — কন্টেন্ট ভিত্তি                      | `types/umrah.ts`, `lib/data/umrah/` (anchors, miqat, duas, steps, mistakes, sequence), গেট `suitableFor` এক্সটেনশন             | **সম্পন্ন**                                               |
| **U2** — ধাপ ইঞ্জিন + অনবোর্ডিং               | `umrahGuideStore` (zustand + persist), সিকোয়েন্স সমাধান, কাউন্টার অটো-অ্যাডভান্স, অনবোর্ডিং উইজার্ড, ধাপ-তালিকা প্যানেল       | **সম্পন্ন**                                               |
| **U3** — মানচিত্র ইন্টিগ্রেশন                 | আনুষ্ঠানিক ওভারলে (কাবা, হাতিম, তওয়াফ রিং, সাঈ করিডোর, পবিত্র বিন্দু), ক্রমিক ধাপ মার্কার, যাত্রা রেখা, ফ্লাই-টু, গেট সুপারিশ | **সম্পন্ন**                                               |
| **U4** — রিচুয়াল কাউন্টার ভিউ + মিকাত ইঞ্জিন | তওয়াফ/সাঈ কাউন্টার (ধাপ-তালিকায়), মিকাত সারসংক্ষেপ মানচিত্র, বিমানে ইহরাম কার্ড                                              | **সম্পন্ন**                                               |
| **U5** — "আমি ভুল করেছি" সহায়ক               | `MistakeAssistant` — সিদ্ধান্ত বৃক্ষ UI, কাফফারা (তাকয়ীর/তারতিব), উৎস লিংক                                                    | **সম্পন্ন**                                               |
| **U6** — দোয়া অডিও + অফলাইন + পলিশ           | বাংলা/আরবি তেলাওয়াত, অফলাইন বান্ডলিং, হুইলচেয়ার পথ, "হারিয়ে গেছি" সহায়ক                                                    | **প্রায় সম্পন্ন** (সহায়ক সম্পন্ন; শুধু অডিও সম্পদ বাকি) |
| **U7** — ঐচ্ছিক উন্নতি                        | GPS অটো-কাউন্ট, বাস্তব Barikoi রাউটিং, ফ্লাইট ট্র্যাকিং, হজ্ব মোড                                                              | **বাকি**                                                  |

### যা তৈরি হয়েছে

- **মানচিত্রে প্রবেশ**: হেডারে **"ওমরাহ গাইড"** বোতাম (টিল অ্যাকসেন্ট)। প্রথমবার অনবোর্ডিং উইজার্ড খোলে, এরপর ধাপ-তালিকা।
- **ব্যক্তিগতকরণ**: লিঙ্গ, যাত্রাপথ (মিকাত ইঞ্জিন), সঙ্গ (নারী), প্রবেশযোগ্যতা, মাযহাব অনুযায়ী ফ্লো।
- **৯টি ধাপ**: প্রস্তুতি → মিকাতে ইহরাম → হারামে যাত্রা → প্রবেশ → তওয়াফ (৭ চক্কর কাউন্টার) → ২ রাকাআত + যমযম → সাঈ (৭ পাক কাউন্টার) → হালক/তাকসির → সমাপ্ত।
- **মানচিত্র ওভারলে**: টিল রঙের তওয়াফ রিং, কাবা পাদচিহ্ন, হাতিম, সাঈ করিডোর ও সবুজ মাইল, সোনালি পবিত্র বিন্দু, ক্রমিক ধাপ মার্কার।
- **প্রতিটি রেকর্ডে উৎস**: সব ধাপ/দোয়া/ভুল/অ্যাংকরে `sourceRefs` (IslamQA, Nusuk, Duas.com ইত্যাদি)।
- **ভুল সহায়ক**: শ্রেণি → প্রশ্ন → হ্যাঁ/না → ফলাফল (বৈধতা, করণীয়, কাফফারা, উৎস)। শান্ত ও সান্ত্বনাময় স্বর।
- **মিকাত সারসংক্ষেপ মানচিত্র**: মক্কার চারপাশে নবী নির্ধারিত ৫টি মিকাত পয়েন্টের রিং; ব্যবহারকারীর যাত্রাপথ অনুযায়ী নিজস্ব মিকাত "আপনার মিকাত" হিসেবে হাইলাইট, ব্যাখ্যা ও দম-সতর্কতা সহ। গাইড হেডারের "মিকাত" বোতাম থেকে খোলে।
- **বিমানে ইহরাম কার্ড**: ঢাকা → জেদ্দা পথে প্রস্তুতি ও মিকাতে ইহরাম ধাপে উড্ডয়ন-পূর্ব চেকলিস্ট, ম্যানুয়াল কাউন্টডাউন নির্দেশনা, বিস্তারিত তালবিয়াহ ও জেদ্দা বিমানবন্দরে ইহরামের দম-সতর্কতা।
- **অফলাইন সূচক**: গাইডের সমস্ত বিষয়বস্তু স্থিরভাবে বান্ডল করা — ইন্টারনেট ছাড়াই কাজ করে; হেডারে অনলাইন/অফলাইন স্থিতি ব্যাজ।
- **দলের সাথে যোগাযোগ**: দলনেতার ফোন (এক ট্যাপে কল) ও মিলনস্থল সংরক্ষণ — ভিড়ে দল থেকে আলাদা হলে দ্রুত খুঁজে পেতে (GPS থাকলে অবস্থানসহ)।
- **হুইলচেয়ার সহায়তা**: হুইলচেয়ার চিহ্নিত প্রোফাইলে মাটির স্তরের তওয়াফ, নিচতলার সাঈ ও বিনামূল্য/ভাড়া হুইলচেয়ারের তথ্য।
- **প্রস্থান-রিমাইন্ডার**: সমাপ্ত ধাপে বিদায় তওয়াফ, যমযম ও চলার আগের নামাজের স্মারক।
- **দোয়া "শুনুন" প্লেয়ার**: প্রতিটি দোয়ায় অডিও সম্পদ যোগ হলে "শুনুন" বোতাম আসবে (সম্পদ এখনও প্রয়োজন)।

### পরীক্ষা (Tests)

```bash
npm run type-check          # টাইপ যাচাই
npm run build               # প্রোডাকশন বিল্ড
npm run test                # ভিটেস্ট ইউনিট (৭০ টেস্ট)
npm run test:e2e            # প্লেরাইট e2e (গাইড, মানচিত্র, ভুল সহায়ক, মিকাত, সহায়ক ফ্লো)
```

ইউনিট: `tests/unit/umrah-content.test.ts` (৩৪), `umrah-sequence.test.ts` (৩৪, গেট সুপারিশ ও দলের তথ্য সহ)।
e2e: `tests/e2e/umrah-guide.spec.ts`, `umrah-map.spec.ts`, `umrah-mistake.spec.ts`, `umrah-miqat.spec.ts`, `umrah-helpers.spec.ts`।

### মূল ফাইল

```
types/umrah.ts                      # ডেটা মডেল
lib/data/umrah/                     # anchors, miqat (miqatRingBounds, AIR_IHRAM_CHECKLIST), duas, steps, mistakes, sequence, gate-recommendation
lib/store/umrahGuideStore.ts        # zustand স্টোর (persist)
lib/map/umrah-overlay.ts            # আনুষ্ঠানিক GeoJSON ওভারলে
lib/map/markers.ts                  # ধাপ, সুপারিশকৃত গেট ও মিকাত মার্কার নির্মাতা
components/umrah/                   # UmrahOnboarding, UmrahStepList, MistakeAssistant, FlightIhramCard, MiqatOverviewPanel, OfflineBadge, DuaAudioPlayer, LostGroupHelper, WheelchairTips, PragmaticReminders
app/map/page.tsx                    # হেডার টগল + প্যানেল সংযোজন (গাইড, মিকাত সারসংক্ষেপ)
```

### গুরুত্বপূর্ণ দাবিত্যাগ

এই গাইড শুধুমাত্র **তথ্য ও শিক্ষামূলক**। যেখানে আলেমদের মতভেদ আছে (তওয়াফে অজু, কাফফারায় তাকয়ীর বনাম তারতিব, মাহরাম, ওমরাহর ফরজিয়ত) অ্যাপ **উভয় মত দেখায়, রায় দেয় না**। নির্দিষ্ট পরিস্থিতির জন্য একজন যোগ্য আলেমের পরামর্শ নিন। সৌদি ভিসা/লজিস্টিক নীতি পরিবর্তনশীল — বর্তমান নিয়মের জন্য [Nusuk](https://www.nusuk.sa/) দেখুন।

---

**Mission**: Empower every pilgrim to navigate their journey with complete independence and confidence.
