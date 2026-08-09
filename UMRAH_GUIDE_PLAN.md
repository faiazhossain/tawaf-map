# TawafMap - Interactive Umrah Guide Blueprint

> A planning document for turning TawafMap into a fully interactive, map-first, step-by-step
> Umrah guide personalized for pilgrims from Bangladesh.
>
> This is a **plan, not an implementation**. It covers the ritual content (with sources), the
> product design, the map experience, the data model, and a phased roadmap. Code-shaped blocks
> below are **design sketches** (interfaces and data shapes), not files to be dropped into the repo.

---

## Table of Contents

1. [Vision and Goals](#1-vision-and-goals)
2. [Current State of the Project](#2-current-state-of-the-project)
3. [The Umrah Journey - Authoritative Reference](#3-the-umrah-journey---authoritative-reference)
4. [Mistakes and Recovery - Reference](#4-mistakes-and-recovery---reference)
5. [Product Design - The Guided Experience](#5-product-design---the-guided-experience)
6. [Map Experience Design](#6-map-experience-design)
7. [Data Model (Design Sketches)](#7-data-model-design-sketches)
8. [State and Step Engine](#8-state-and-step-engine)
9. [Implementation Approach (fitting the existing codebase)](#9-implementation-approach-fitting-the-existing-codebase)
10. [Phased Roadmap](#10-phased-roadmap)
11. [Open Decisions / Trade-offs](#11-open-decisions--trade-offs)
12. [Sources and References](#12-sources-and-references)
13. [Important Disclaimer](#13-important-disclaimer)

---

## 1. Vision and Goals

### One-line vision

A pilgrim from Bangladesh opens the app, tells it who they are and how they are traveling, and
the map walks them through Umrah **step by step** - showing where they are, where to go next,
which gate to use, what to do and say at each point, and what to do if something goes wrong.

### Primary goals

1. **Map-first, visual guidance.** Every step is anchored to a real place on the map. The map is
   the hero; text supports it, not the other way around.
2. **Personalized flow.** The guide branches on gender, travel method, and companionship
   (mahram) so each pilgrim sees only the path that applies to them.
3. **Location-aware.** "Where am I?", "Where do I go next?", "Which gate should I use?" are
   answered from the user's live GPS position.
4. **Forgiving.** A dedicated "I made a mistake" assistant turns a panic moment into a clear,
   referenced action.
5. **Bangladesh-native.** Bengali-first copy, Arabic for prayers/place names, default travel
   path Dhaka -> Jeddah, offline-friendly, low-data conscious.

### Non-goals (for v1)

- Hajj rites (Mina/Muzdalifah/Arafat/Rami). TawafMap already has these as place data; the
  guided flow targets **Umrah** only. Hajj can be a later mode.
- Live crowd/heat data, ticketing, group chat, payments.
- Issuing religious verdicts (fatwa). The app informs and cites; it does not adjudicate (see
  [Section 13](#13-important-disclaimer)).

---

## 2. Current State of the Project

The Explore pass confirmed TawafMap is already a strong foundation for this feature. Relevant
facts that shape the plan:

| Area                    | Current state                                                                                                                          | Implication for Umrah guide                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Stack                   | Next.js 15 (App Router), TypeScript, standalone build                                                                                  | Add an `/umrah` mode within `app/map/page.tsx` or a parallel route   |
| Map                     | `maplibre-gl` 4.7, hardcoded Barikoi basestyle, Makkah-centered, DOM markers, `flyTo`, `fitBounds`, terrain+pitch toggle               | Reuse marker/fly-to/terrain patterns; ritual overlay is additive     |
| State                   | `zustand` (8 stores) + `@tanstack/react-query` (unused so far)                                                                         | Add an `umrahGuideStore`; no backend needed for v1                   |
| Data                    | Hardcoded TS in `lib/data/` (gates, hotels, tourist-places) with rich bilingual schemas                                                | Add `lib/data/umrah/...` in the same style                           |
| UI                      | Tailwind + shadcn-style (`button/card/badge/input/bottom-sheet`), dark slate theme, dual mobile `BottomSheet` + desktop floating panel | Reuse the dual-panel pattern and color system                        |
| Existing ritual content | Safa/Marwa, Zamzam, Tan'eem miqat, etc. exist as passive tourist-place entries                                                         | Promote these into first-class ritual steps; reuse their coordinates |
| Routing                 | `useMapRouting` simulates routes client-side (real Barikoi routing marked TODO)                                                        | Adequate for guide "go to next step"; upgrade to Barikoi later       |
| Geolocation             | `useGeolocation` watch hook exists                                                                                                     | Powers "where am I / nearest gate"                                   |
| Docs                    | `TAWAF_IMPLEMENTATION_PLAN.md`, `README_TAWAF.md`, deploy runbooks                                                                     | This guide is a new track alongside the existing phases              |

**Key load-bearing files** the implementation will touch: `app/map/page.tsx`,
`components/map/MapView.tsx`, `lib/store/panelStore.ts`, `lib/map/markers.ts`,
`lib/map/layers.ts`, `lib/data/tourist-places.ts` (coordinate source), `types/tourist-place.ts`
(schema template).

---

## 3. The Umrah Journey - Authoritative Reference

> Source for the core sequence: [IslamQA #31819](https://islamqa.info/en/answers/31819) and the
> official Saudi portal [Nusuk Umrah Journey](https://umrah.nusuk.sa/Journey).

Umrah is four rites in order: **Ihram -> Tawaf -> Sa'i -> Halq/Taqsir**. Below is the full
content the guide must encode, each item tagged so the data model in Section 7 can consume it.

### 3.1 Stage A - Preparation (before Ihram, mostly Sunnah)

- **Ghusl** (ritual bath) and grooming (clip nails, remove hair). Sunnah, not obligatory.
  [Islamic Relief](https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/how-to-perform-umrah/)
- **Men apply perfume** before putting on Ihram garments (perfume becomes forbidden _after_
  ihram). [IslamQA #31819](https://islamqa.info/en/answers/31819)
- **Men don the Ihram dress:** two unstitched white sheets - _izar_ (lower) and _rida'_ (upper).
  Footwear: unstitched sandals not covering the ankle bone. The right shoulder is uncovered
  (_idtiba'_) when Tawaf begins.
  [Nusuk](https://umrah.nusuk.sa/Journey);
  [Islamic Relief](https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/how-to-perform-umrah/)
- **Women** wear normal modest Islamic dress (any colour, may be stitched); see gender rules
  in 3.4.

### 3.2 Stage B - Ihram at the Miqat

- **Intention (Niyyah):** "Labbayk Allahumma bi-'Umrah."
  [IslamQA #31819](https://islamqa.info/en/answers/31819)
- Optional (if fearing an obstacle): "...my exiting ihram is where You prevent me" - based on
  al-Bukhari 5089, Muslim 1207.
- **Recite Talbiyah** frequently (men aloud, women softly) until Tawaf begins.
  [Nusuk](https://umrah.nusuk.sa/Journey)

**Talbiyah wording (for the app's dua content):**

> _Labbaik Allahumma labbaik. Labbaik la sharika laka labbaik. Innal-hamda wan-ni'mata laka
> wal-mulk. La sharika lak._ (Plus: _Labbaika ilahal-haqq._)
> Meaning: "Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Indeed all
> praise, grace and sovereignty belong to You. You have no partner."
> [Duas.com](https://duas.com/dua/371/the-talbiyah-chant-of-hajj-and-umrah);
> [Hajj Umrah Planner](https://hajjumrahplanner.com/talbiyah/)

### 3.3 Miqat points (the "where does Ihram begin?" engine)

Prophet-designated points (hadith of Ibn Abbas, al-Bukhari 1524, Muslim 1181).
[Hajj Umrah Planner](https://hajjumrahplanner.com/miqat/);
[Bakkah Transport](https://bakkahtransport.com/blog/miqat-points/)

| Miqat                              | Direction from Makkah | ~Distance   | Serves                         |
| ---------------------------------- | --------------------- | ----------- | ------------------------------ |
| Dhul-Hulayfah / Abyar Ali          | North                 | ~410-450 km | Those coming via Madinah       |
| Al-Juhfah (near Rabigh)            | Northwest             | ~187 km     | Egypt, Sham, North/West Africa |
| Qarn al-Manazil / As-Sayl al-Kabir | East/NE               | ~75-82 km   | Najd, Ta'if                    |
| Yalamlam (as-Sa'diyyah)            | South                 | ~54 km      | Yemen, southern regions        |
| Dhat 'Irq                          | Northeast             | ~85 km      | Iraq, Iran, NE                 |

**Special cases the app must handle:**

- **Flying into Jeddah (the common Bangladesh path):** assume ihram **on the aircraft before
  crossing the miqat** - typically aligned with **Yalamlam** (south/sea approach) or
  **Qarn al-Manazil** depending on flight path. Airlines announce ~30-45 min before landing.
  Assuming ihram at Jeddah airport is impermissible and may require a _dam_.
  [Saudi Ministry of Hajj & Umrah](https://www.facebook.com/SaudiMOHUEn/posts/695696863193701/);
  [AboutIslam](https://aboutislam.net/counseling/ask-the-scholar/umrah/can-assume-ihram-umrah-jeddah-airport/);
  [Jordan Iftaa #2982](https://www.aliftaa.jo/research-fatwa-english/2982/)
- **Via Madinah first:** miqat is **Dhul-Hulayfah / Abyar Ali** (~450 km).
- **Already within the miqat boundary (the _Hill_)** e.g. Jeddah residents: assume ihram from
  where they live. [IslamOnline Fiqh](https://fiqh.islamonline.net/en/miqat-for-those-who-live-in-jeddah/)
- **Already inside the Haram boundary of Makkah:** go out to the nearest Hill point -
  **Masjid Aisha / Tan'eem** (~7 km north), per Aisha's (RA) practice.
  [IslamQA #32845](https://islamqa.info/en/answers/32845);
  [Discover Makkah](<https://www.discovermakkah.sa/en/places-worth-visiting/landmarks/al-taneem-mosque-(lady-aisha)>)

> This is the single most common error for international pilgrims. The app's Miqat engine
> (Section 5.4) is built around it.

### 3.4 Gender-specific rules

**Men**

- Two unstitched sheets only; no stitched/fitted clothes, no underwear, no head covering.
  [Islamic Relief](https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/how-to-perform-umrah/)
- _Idtiba'_ (right shoulder bare) and _raml_ (brisk short steps) in the first 3 Tawaf circuits.
  [Nusuk](https://umrah.nusuk.sa/Journey)
- _Halq_ (shave head) preferred, _taqsir_ (trim) also valid. [IslamQA #31819](https://islamqa.info/en/answers/31819)

**Women**

- Modest dress, any colour, may be stitched. Must NOT wear **niqab** (face veil tied to face) or
  **gloves** (al-Bukhari 1707). A loose cloth held over the face without tying is permitted.
  [Saudi MOHU](https://www.facebook.com/SaudiMOHUEn/posts/979986444764740/);
  [iLink Tours](https://ilinktours.com/umrah-rules-for-women/)
- No _raml_, no _idtiba'_; walk normally. In Sa'i, do not jog between the green markers.
  [Nusuk](https://umrah.nusuk.sa/Journey)
- **Taqsir only** - trim a fingertip-length (~1-2 cm) from hair ends; shaving is forbidden.
  [IslamQA #31819](https://islamqa.info/en/answers/31819)

**Mahram requirement - scholars differ (the app must present both, not choose):**

- Majority (Hanafi, Hanbali, and a Maliki position): a woman must travel with a **mahram**.
  [Islamic Portal](https://islamicportal.co.uk/is-travelling-without-mahram-permissible-according-to-imam-shafiee/)
- Shafi'i school and a known Maliki view: mahram not strictly required; condition is **safety of
  the road**, so a woman may travel with a safe group.
  [SeekersGuidance (Shafi'i)](https://seekersguidance.org/answers/shafii-fiqh/can-women-travel-without-a-mahram-according-to-the-shafii-school/);
  [Dar al-Ifta #8127](https://www.dar-alifta.org/en/fatwa/details/8127/)
- **Saudi visa policy** is separate from fiqh: the tourist e-visa does not require a mahram; the
  Umrah visa has historically allowed women 45+ in organized groups. Policies change - link to
  [Nusuk](https://www.nusuk.sa/) for the live rule.
  [Islamic Relief - Umrah Rules](https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/umrah-rules/)

### 3.5 Stage C - Entering Masjid al-Haram

- Enter with the right foot first, reciting the mosque-entry supplication and salawat.
  [Islamic Relief](https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/how-to-perform-umrah/)

### 3.6 Stage D - Tawaf (7 circuits)

1. **Start at the Black Stone (Hajr al-Aswad)** corner, Kaaba on the left.
   [Nusuk](https://umrah.nusuk.sa/Journey)
2. Touch/kiss it if possible, else point with the right hand, say **"Allahu Akbar,"** begin.
3. **Counter-clockwise**, Kaaba always on the left.
4. **Men only:** _idtiba'_ + _raml_ in circuits 1-3.
5. At the **Rukn al-Yamani (Yemeni corner):** touch if possible, do NOT kiss, do NOT say takbir.
   [IslamQA #31819](https://islamqa.info/en/answers/31819)
6. **Between the Yemeni corner and the Black Stone** recite: _"Rabbana atina fid-dunya hasanah,
   wa fil-akhirati hasanah, wa qina 'adhab an-nar"_ (Quran 2:201).
   [Duas.com #373](https://duas.com/dua/373/dua-said-between-the-yemeni-corner-and-the-black-stone)
7. Complete **7 circuits**, each restarting at the Black Stone. The **Hijr Ismail / Hatim** is
   enclosed _inside_ the circuit - walk around it, not through it.
   [Wikipedia - Hijr Ismail](https://en.wikipedia.org/wiki/Hijr_Ismail)

**Distances (use ranges, not single numbers):**

- One circuit ~80 m (close, ground floor) to ~200-300 m (crowded/upper floors).
- 7 circuits total ~1.2-1.5 km ground level close in, ~2 km+ on upper levels.
  [Madain Project](https://madainproject.com/tawaf_distance);
  [The Pilgrim](https://thepilgrim.co/tawaf-distance/)
- Kaaba base perimeter ~47.8 m (12.86 x 11.03 m). [Wikipedia - Kaaba](https://en.wikipedia.org/wiki/Kaaba)

### 3.7 Stage E - Two rak'ahs after Tawaf

- Pray 2 rak'ahs near/behind **Maqam Ibrahim** (Quran 2:125); if impractical, anywhere in the
  mosque. Sunnah: Surah al-Kafirun (109) then al-Ikhlas (112). Drink **Zamzam** after.
  [IslamQA #31819](https://islamqa.info/en/answers/31819);
  [Nusuk](https://umrah.nusuk.sa/Journey)

### 3.8 Stage F - Sa'i (Safa -> Marwa, 7 laps)

1. **Begin at Safa**, recite _"Inna as-Safa wa al-Marwata min sha'a'ir Allah..."_ (Quran 2:158).
   [IslamQA #31819](https://islamqa.info/en/answers/31819)
2. Walk toward Marwa. Between the **two green markers (al-mila al-akhdarayn)** men jog; women walk.
   [Nusuk](https://umrah.nusuk.sa/Journey)
3. Reaching Marwa = lap 1; return to Safa = lap 2; ... **end at Marwa on lap 7.**

- One-way ~450 m; total ~3.15 km. [Wikipedia - Safa and Marwa](https://en.wikipedia.org/wiki/Safa_and_Marwa)

### 3.9 Stage G - Halq / Taqsir (exit of Ihram)

- **Men:** halq preferred, taqsir valid (Prophet made du'a 3x for those who shaved, 1x for
  trimmers - Muslim 1303). [IslamQA #31819](https://islamqa.info/en/answers/31819)
- **Women:** taqsir only, fingertip-length (~1-2 cm).
- Once hair is cut, **all Ihram prohibitions lift** and Umrah is complete.
  [Nusuk](https://umrah.nusuk.sa/Journey)

### 3.10 Pillars vs Obligatory vs Sunnah (validity logic)

This classification powers the "is my Umrah valid?" helper. Omitting a **pillar** invalidates;
omitting a **wajib** requires expiation but Umrah stays valid; omitting a **sunnah** has no penalty.
[Guide to Islam](https://guidetoislam.com/en/articles/the-pillars-obligations-and-supererogatory-acts-of-umrah-11002)

| Question             | Hanafi | Maliki       | Shafi'i  | Hanbali  |
| -------------------- | ------ | ------------ | -------- | -------- |
| Is Umrah obligatory? | Sunnah | Sunnah       | **Fard** | **Fard** |
| Sa'i                 | Wajib  | Pillar       | Pillar   | Pillar   |
| Halq/Taqsir          | Wajib  | Wajib        | Pillar   | Pillar   |
| Ihram from miqat     | Wajib  | Wajib/Sunnah | Wajib    | Wajib    |

> Flag for the app: "Is Umrah fard?" depends on school ([IslamQA #39524](https://islamqa.info/en/answers/39524)). Present both; do not assert one.

### 3.11 Key locations in Masjid al-Haram (map anchors)

| Location                       | Role in ritual                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Hajr al-Aswad (Black Stone)    | Tawaf start/end; touch/kiss or point, say Allahu Akbar                                                            |
| Maqam Ibrahim                  | Pray 2 rak'ahs nearby after Tawaf (Quran 2:125)                                                                   |
| Hijr Ismail / Hatim            | Semi-circular low wall north of Kaaba; **inside** the Tawaf circuit; praying here equals praying inside the Kaaba |
| Rukn al-Yamani (Yemeni corner) | Touch (no kiss, no takbir) during Tawaf                                                                           |
| Al-Multazam                    | Wall between Kaaba door and Black Stone; cling and make du'a                                                      |
| Mizab al-Rahmah                | Gold rain-spout above Hijr Ismail                                                                                 |
| Safa and Marwa                 | Sa'i start/end hills (~450 m apart)                                                                               |
| Mataf                          | Open circular area where Tawaf is performed                                                                       |

**Notable gates** (pin by name + GPS; treat numbers as advisory because they shift with each
expansion):
King Abdul Aziz (Gate 1, west, faces Clock Tower), King Fahd (Gate 79), **Umrah Gate (~63,
traditionally used by Umrah performers)**, Bab al-Fath (north), King Abdullah, Bab al-Salam,
King Faisal, Ajyad, Bilal.
[Ziyuf al-Rahman](https://ziyufalrahman.co.uk/the-main-gates-of-masjid-al-haram/);
[Saif Hajj Umrah](https://www.saifhajjumrahtravels.com/about-us/blog/45-gates-of-masjid-al-haram)

> **Existing project data already has gates** (`lib/data/gates.ts`, 19 gates typed as
> king_fahd/umrah/salah). The Umrah Gate type is already green. Reuse it.

---

## 4. Mistakes and Recovery - Reference

> Primary source: [IslamQA Topic #133](https://islamqa.info/en/categories/topics/133)
> (index of common errors) and [Dar al-Ifta #6531](https://www.dar-alifta.org/en/fatwa/details/6531/)
> (expiation categories). Where schools differ, both views are shown.

### 4.1 The expiation system (powers the "what do I owe?" helper)

| Term                 | Meaning                                                                     | Where                                           |
| -------------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| **Dam**              | Slaughter a sheep (or 1/7 cow/camel)                                        | Inside the Haram; meat to the poor of the Haram |
| **Sadaqah / Fidyah** | Staple food (~2.25 kg per person to 6 poor)                                 | To the poor                                     |
| **Siyam**            | Fasting (3 days for typical Ihram violations; 10 for omitting a Hajj wajib) | -                                               |

**Choice (Takhyir) vs Gradation (Tartib):**

- **Majority (Maliki, Shafi'i, Hanbali):** for ordinary non-sexual violations, free choice among
  slaughter 1 sheep OR feed 6 poor OR fast 3 days - any one suffices.
  ([IslamQA #49027](https://islamqa.info/en/answers/49027); [Dar al-Ifta #6531](https://www.dar-alifta.org/en/fatwa/details/6531/))
- **Hanafi:** gradation - slaughter if able, else fast, else feed.
  ([SeekersGuidance Hanafi](https://seekersguidance.org/answers/hanafi-fiqh/what-are-the-expiations-for-the-following-violations-in-ihram/))
- **Forgetful / ignorant / asleep / forced:** no expiation owed at all. ([IslamQA #49027](https://islamqa.info/en/answers/49027))

### 4.2 Mistake -> What to do (core table for the assistant)

| Mistake                                       | What to do                                                                                                             | Source                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Crossed Miqat without Ihram (intending Umrah) | Return to the Miqat and enter Ihram there. If not returned: **Dam (sheep)**.                                           | [IslamQA #69934](https://islamqa.info/en/answers/69934)              |
| Crossed Miqat without intending Umrah         | No penalty; enter Ihram from where you are when you decide.                                                            | [IslamQA #69934](https://islamqa.info/en/answers/69934)              |
| Started Tawaf from wrong point                | Earlier circuits don't count; resume from the Black Stone alignment.                                                   | general fiqh                                                         |
| Lost count / unsure of circuits               | Build on the **certain (lower)** number, complete to 7.                                                                | Saudi MOHU                                                           |
| Tawaf without wudu / wudu broke mid-Tawaf     | **Majority:** renew wudu, restart Tawaf. **Ibn Taymiyyah / Abu Hanifah (minor impurity):** valid, renewal recommended. | [IslamQA #34695](https://islamqa.info/en/answers/34695)              |
| Walked between Kaaba and Hateem wall          | That circuit is invalid; redo it (Hijr Ismail is part of the Kaaba).                                                   | [Discover Haramain](https://discoverharamain.com/guides/hijr-ismail) |
| Started Sa'i from Marwa                       | That length doesn't count; restart from Safa.                                                                          | Saudi MOHU; Quran 2:158                                              |
| Did not complete Sa'i                         | Complete remaining laps (Safa->Marwa = 1 ... end Marwa = 7).                                                           | general                                                              |
| Forgot to shave/trim hair                     | Put Ihram back on, cut hair now, then change. **No penalty** if forgetful/ignorant.                                    | [IslamQA #122795](https://islamqa.info/en/answers/122795)            |
| Period started after Ihram                    | Wait until pure, then Tawaf then Sa'i then taqsir (Aisha precedent, al-Bukhari 305). Do not reverse order.             | [IslamQA #39814](https://islamqa.info/en/answers/39814)              |
| Group leaving before she is pure              | Strict: stay/return. Lenient (Ibn Taymiyyah, distant country): medication/pad out of necessity.                        | [IslamQA #112271](https://islamqa.info/en/answers/112271)            |
| Intercourse before tahallul                   | **Invalidates Umrah**; complete rites, then make up (qada) + Dam (sheep/person).                                       | [IslamQA #119134](https://islamqa.info/en/answers/119134)            |
| Pushing / harsh behaviour                     | Sinful; tawbah required; does not invalidate but forfeits reward.                                                      | Quran 2:197                                                          |

### 4.3 Valid vs Repeat vs Sacrifice (quick triage)

| Situation                               | Valid?                            | Repeat (qada)? | Sacrifice (Dam)?             |
| --------------------------------------- | --------------------------------- | -------------- | ---------------------------- |
| Minor violation, forgetful/ignorant     | Yes                               | No             | No                           |
| Minor violation, deliberate             | Yes (sinful)                      | No             | Yes (one of three)           |
| Crossed Miqat, returned to Miqat        | Yes                               | No             | No                           |
| Crossed Miqat, did not return           | Yes (majority)                    | No             | Yes (sheep)                  |
| Wudu broke in Tawaf, restarted          | Yes                               | No             | No                           |
| Wudu broke, not restarted (majority)    | Invalid - redo if still in Makkah | redo Tawaf     | no / opinion differs if left |
| Forgot to cut hair; cut when remembered | Yes                               | No             | No (most)                    |
| Intercourse before tahallul             | **Invalidated**                   | Yes - make up  | Yes - sheep/person           |

> **Guiding principle for the UI copy:** most mistakes do NOT invalidate Umrah. They require
> nothing (forgetfulness), an expiation (choice), or the act performed/repeated. True
> invalidation is essentially limited to intercourse before tahallul and (majority view) Tawaf
> in impurity that was not repeated.

---

## 5. Product Design - The Guided Experience

### 5.1 The onboarding wizard (personalization)

A short, friendly wizard (Bengali-first) that determines the personalized flow. Captures:

1. **Gender** (male / female) - branches preparation, Tawaf (raml/idtiba), Sa'i (jog), halq/taqsir.
2. **Travel path / arrival** - drives the Miqat engine:
   - Dhaka -> Jeddah by air (default)
   - Via Madinah first (miqat Dhul-Hulayfah)
   - Already in Makkah (miqat Tan'eem/Masjid Aisha)
   - Already in Jeddah (assume from residence)
   - Other / not sure (offer the miqat map)
3. **Companionship** (if female) - traveling with mahram? Group? Solo? Triggers the mahram note
   (both scholarly views) and practical tips; never blocks.
4. **Accessibility needs** - elderly / wheelchair / needs slower pace (affects gate and path
   recommendations, links to free wheelchair info at the Haram).
5. **Madhhab preference** (optional) - default "show all views"; if user picks Hanafi, expiation
   copy defaults to Tartib; if Shafi'i/Maliki/Hanbali, Takhyir.

### 5.2 The step engine (the heart of guidance)

A deterministic state machine. Each step has: id, title, stage, anchor coordinate(s), gender
filter, prerequisite steps, content blocks (what to do, dua, rules, common mistakes), and a
"done" condition (manual tap, GPS proximity, or sub-counter completion).

```
[Onboard] -> [Prep] -> [Ihram@Miqat] -> [Travel to Haram] -> [Enter mosque]
   -> [Tawaf (7x counter)] -> [2 rak'ahs + Zamzam] -> [Sa'i (7x counter)]
   -> [Halq/Taqsir] -> [Tahallul done]
```

Counter sub-steps (Tawaf 1..7, Sa'i 1..7) get their own mini-UI: a progress ring, current
circuit, and per-circuit tips (e.g., circuit 1-3 raml reminder for men; Yemeni corner dua
prompt each circuit).

### 5.3 "Where am I / Where next / Which gate" (the live map)

Three always-available questions, answered from GPS + step state:

- **Where am I?** - geolocation dot (reuse `useGeolocation` + user accuracy layer).
- **Where do I go next?** - fly-to the next step's anchor; draw a gentle route line from user
  to anchor (reuse `useMapRouting`); show distance + ETA on foot.
- **Which gate?** - given current location + the next step, recommend the nearest appropriate
  gate. Examples:
  - Entering for Tawaf -> recommend **Umrah Gate** / King Abdul Aziz (closest to Mataf).
  - After Sa'i (ending at Marwa, east side) -> recommend the nearest east-side gate to exit.
  - Going out to Tan'eem for a second Umrah -> recommend the gate nearest the Tan'eem road.

  Implementation: rank gates by haversine distance to user, filtered by a `suitableFor` tag per
  step. Reuse `useGateProximity`.

### 5.4 Miqat engine (the flight-alert feature)

For "Dhaka -> Jeddah by air":

- Explain that Jeddah is **inside** the miqat boundary, so ihram must be assumed **on the plane**
  before crossing **Yalamlam** (or **Qarn al-Manazil**, depending on route).
- Provide a checklist to do **before boarding**: ghusl, wear Ihram garments, trim nails, perfume
  (only before ihram).
- A **countdown card** ("Assume Ihram in ~X min") with Talbiyah text + audio to recite at the
  moment. (v1: manual; v2: could use flight-tracking/ADS-B if a data source is allowed.)
- Clear warning: assuming ihram at Jeddah airport may require a Dam.
  ([Saudi MOHU](https://www.facebook.com/SaudiMOHUEn/posts/695696863193701/))

### 5.5 Dua and prayer content

A dedicated content type (see 7.4) carrying: Arabic (with `dir="rtl"`), transliteration, Bengali
translation, optional English, and an audio asset (Bengali + Arabic recitation). Per-step: niyyah
wording, Talbiyah, mosque-entry dua, Allahu Akbar at Black Stone, the Yemeni-corner dua, Safa
verse, etc. Audio enables the "Listen" mode the existing vision doc references.

### 5.6 "I made a mistake" assistant

A searchable, branchable helper built on Section 4.2. Flow:

1. Pick a category (Ihram violations / Tawaf / Sa'i / purity / forgot something / other).
2. Answer 1-3 yes/no questions (e.g., "Did you intend Umrah when you passed the miqat?").
3. Get a clear, calm answer: nothing needed / do X now / expiation (with the Takhyir-vs-Tartib
   note) / consult a scholar for this case.
4. Always cite the source fatwa/article.

Tone: reassuring. Lead with "Most likely your Umrah is still valid" where true.

### 5.7 Offline and low-data (Bangladesh context)

- Pilgrims often have poor roaming data. Bundle all guidance content, duas, coordinates, and
  audio as static assets so the **guide works fully offline** once loaded. Routing can degrade
  gracefully to straight-line "as the crow flies" + distance when offline.
- Pre-download in the onboarding ("Download guide for offline").
- Geolocation (GPS) works offline; that powers the core experience.

---

## 6. Map Experience Design

The map is the hero. The existing TawafMap basemap is outdoor MapLibre; the ritual happens
**inside** Masjid al-Haram where outdoor tiles are of limited use. The plan: blend the real
outdoor map (approach, gates, hotel->Haram, miqat overview) with a **ritual overlay / schematic
mode** for the inside (Tawaf ring, Sa'i corridor).

### 6.1 Layered map composition

1. **Basemap** - existing Barikoi style (outdoor). Used for travel, gates, neighborhood.
2. **Ritual overlay (new)** - GeoJSON polygons/lines drawn on top:
   - Kaaba footprint + Hijr Ismail (Hatim) outline.
   - **Tawaf ring** - an elliptical path around Kaaba+Hatim, the visual track of 7 circuits.
   - **Sa'i corridor** - the Safa-Marwa line, ~450 m, with the two green-marker zones marked.
   - Mataf boundary, Maqam Ibrahim point, Black Stone corner, Yemeni corner, Multazam.
3. **Step markers** - numbered pins for the active journey (1 Prep, 2 Ihram, 3 ... 9 Tahallul),
   with the active one enlarged and a connecting dashed "journey line" through completed steps.
4. **User location** - accuracy halo + heading arrow (existing).
5. **Gate markers** - existing gates data, with the recommended gate highlighted/pulsing.
6. **Terrain/pitch** - existing toggle for the dramatic 3D approach shot (pitch 60 over the
   Haram / Jabal an-Nur), per the current `showTerrain` behavior.

### 6.2 Ritual "schematic" mode (recommended for Tawaf/Sa'i)

Because indoor satellite detail is weak, add a toggle: **"Ritual view"** that zooms into the
Haram, dims the basemap, and emphasizes the schematic rings with large numbered counters. This
is the view the pilgrim actually uses while performing Tawaf/Sa'i. Two sub-modes:

- **Tawaf counter view:** top-down on the Mataf; the ring lights up segment-by-segment as the
  user taps "next circuit" (or, v2, detects one lap via GPS/accelerometer). Shows current circuit
  (1-7), raml reminder for men in circuits 1-3, and the Yemeni-corner dua prompt.
- **Sa'i counter view:** side-on the Safa-Marwa corridor; lap 1-7, direction arrow, green-marker
  jog reminder for men.

### 6.3 Gate recommendation visualization

- Recommended gate gets a distinct pulsing marker + a "Start here" label.
- A short route line from user -> recommended gate (walking).
- Tap a gate -> existing gate info (facilities, nearest landmarks) from `lib/data/gates.ts`.

### 6.4 Miqat overview map

A zoomed-out view showing the 5 miqat points as a ring around Makkah, with the user's flight/route
path and the active miqat highlighted. Educational + practical.

### 6.5 Visual polish principles (the "beautiful" part)

- **One accent for Umrah mode** (suggest teal/cyan `teal-600`/`cyan-500` to avoid clashing with
  existing orange=Gates, emerald=Hotels, purple=Historical, blue=Terrain).
- **Numbered step chips** with a consistent shape; completed = filled accent, active = accent
  ring + gentle pulse, upcoming = muted.
- **Progress ring** for Tawaf/Sa'i counters (SVG), counting up with a subtle animation.
- **Calm, reverent palette** - keep the dark slate theme; use warm gold sparingly for sacred
  points (Kaaba, Black Stone, Maqam Ibrahim).
- **Large tap targets** for counter +/- (pilgrims may be moving, gloves, gloves-free ihram).
- **Bilingual typography** - Bengali body, Arabic RTL spans for duas/place names (project
  already does this).
- **Reduced-motion** respect; the app must not feel frantic in a sacred space.

### 6.6 Accessibility and reality checks

- Wheelchair-aware: recommend ground-floor Tawaf path, surface-level Sa'i, link to **free
  wheelchairs** at Haram entrances and paid electric chairs via Assist Haramain.
  ([Ziyarago](https://ziyarago.com/en/places/rental/equipment-rental-wheelchairs-baby-strollers/free-wheelchair-haram-makkah);
  [Assist Haramain](https://assist.haramain.com/))
- "Lost group" helper: a pinned note with agreed meeting point + group leader phone (user-entered).
- Pragmatic reminders: do not delay Farewell Tawaf to the airport; pray 2 rak'ahs; drink Zamzam.

---

## 7. Data Model (Design Sketches)

> Sketches only. They mirror existing schemas (`types/tourist-place.ts`, `lib/data/*`) so the
> implementation fits naturally. User-facing text fields are objects keyed by locale: `bn`, `en`,
> with Arabic carried separately for RTL rendering.

### 7.1 Ritual site / anchor

```ts
type RitualAnchor = {
  id: string; // "black-stone" | "maqam-ibrahim" | "rukn-yamani" | ...
  name: { bn: string; en: string };
  nameAr?: string; // Arabic, rendered dir="rtl"
  role:
    | "tawaf-start"
    | "tawaf-corner"
    | "pray-after-tawaf"
    | "sai-start"
    | "sai-end"
    | "sai-green-markers"
    | "kaaba"
    | "hateem"
    | "multazam";
  location: { coordinates: [number, number] }; // [lng, lat]
  image?: string; // reuse /public/images where possible
};
```

### 7.2 Umrah step

```ts
type GenderFilter = "all" | "male" | "female";

type DuaRef = string; // id into umrah/duas

type UmrahStep = {
  id: string; // "ihram-miqat" | "tawaf" | "tawaf-circuit" | "sai" | ...
  stage: "prep" | "ihram" | "travel" | "enter" | "tawaf" | "pray" | "sai" | "halq" | "done";
  order: number; // for the linear backbone
  title: { bn: string; en: string };
  summary: { bn: string; en: string };
  gender: GenderFilter; // hide/branch by gender
  anchors?: RitualAnchor["id"][]; // map locations
  counter?: { min: number; max: number; label: { bn: string; en: string } }; // 1..7 for tawaf/sai
  whatToDo: { bn: string; en: string }; // markdown
  rules?: { bn: string; en: string }; // do/don't
  duas?: DuaRef[];
  commonMistakes?: string[]; // ids into mistakes table (Section 4)
  isCompleteWhen: "manual" | "counter-max" | "proximity" | "manual|proximity";
  tip?: { bn: string; en: string };
  sourceRefs: string[]; // URLs from Section 12
  nextStepId?: string | ((ctx: StepContext) => string); // allow branching
};
```

### 7.3 Onboarding profile (drives branching)

```ts
type TravelPath =
  | "air-dhaka-jeddah"
  | "via-madinah"
  | "already-in-makkah"
  | "already-in-jeddah"
  | "other";

type UmrahProfile = {
  gender: "male" | "female";
  travelPath: TravelPath;
  hasMahram?: boolean; // relevant if female
  travelGroup?: "solo" | "group" | "family";
  accessibility?: { wheelchair: boolean; slowPace: boolean };
  madhhab?: "hanafi" | "maliki" | "shafii" | "hanbali" | "all";
  miqatId: string; // resolved by the miqat engine from travelPath
  groupLeaderPhone?: string;
  meetingPoint?: { label: string; coordinates: [number, number] };
};
```

### 7.4 Dua

```ts
type Dua = {
  id: string; // "talbiyah" | "yamani-corner-dua" | "safa-verse" ...
  title: { bn: string; en: string };
  arabic: string; // dir="rtl"
  transliteration?: string;
  translation: { bn: string; en: string };
  whenToRecite: { bn: string; en: string };
  audio?: { ar?: string; bn?: string }; // paths under /public/audio
  sourceRefs: string[];
};
```

### 7.5 Mistake entry (for the assistant)

```ts
type ExpiationType =
  | "none"
  | "sadaqah"
  | "dam"
  | "takhyir"
  | "tartib"
  | "qada-plus-dam"
  | "see-scholar";

type Mistake = {
  id: string;
  category: "ihram" | "tawaf" | "sai" | "purity" | "halq" | "other";
  question: { bn: string; en: string };
  branches?: { condition: string; nextId: string }[]; // simple decision tree
  outcome: {
    valid: "valid" | "invalid" | "depends";
    action: { bn: string; en: string };
    expiation?: ExpiationType;
  };
  sourceRefs: string[];
};
```

### 7.6 Gate extension (reuse existing)

Add an optional field to the existing gate type:

```ts
suitableFor?: { stepId: string; note: { bn: string; en: string } }[];
```

so the "which gate" recommender can filter gates by step suitability.

### 7.7 File layout (proposed)

```
lib/data/umrah/
  steps.ts          // UmrahStep[]
  duas.ts           // Dua[]
  mistakes.ts       // Mistake[]
  anchors.ts        // RitualAnchor[] (reusing coordinates from tourist-places.ts)
  miqat.ts          // miqat points + engine data
  content.bn.ts     // Bengali copy (or co-located per record as above)
types/
  umrah.ts          // the interfaces above
lib/store/
  umrahGuideStore.ts
```

---

## 8. State and Step Engine

A new `umrahGuideStore` (zustand) alongside the existing 8 stores:

```ts
type UmrahGuideState = {
  profile: UmrahProfile | null;
  stepIds: string[]; // resolved, personalized sequence
  currentIndex: number;
  completed: Record<string, boolean>;
  counters: Record<string, number>; // stepId -> circuit/lap number
  mode: "guide" | "mistake-assistant" | "miqat-overview";
  // actions
  setProfile;
  startGuide;
  nextStep;
  prevStep;
  goToStep;
  incrementCounter;
  decrementCounter;
  markComplete;
  openMistakeAssistant;
  reset;
};
```

- **Sequence resolution:** flatten all `UmrahStep` records by `order`, then filter by
  `profile.gender` (drop male-only/female-only), then resolve miqat anchor from
  `profile.travelPath`, then drop steps not relevant (e.g., skip "go out to Tan'eem" unless
  `already-in-makkah`).
- **Counter steps** (tawaf, sai) expand into the live counter UI but remain one "step" in the
  backbone; completing the counter auto-advances.
- **Persistence:** persist `profile`, `completed`, and `currentIndex` (zustand persist, like
  mapStore) so a pilgrim can close and resume.

---

## 9. Implementation Approach (fitting the existing codebase)

Concrete seams in the current code (line references from the Explore pass):

1. **Header toggle** - add an "Umrah Guide" button in `app/map/page.tsx` alongside the existing
   radio-style toggles (the Historical/Gates/Hotels group, ~lines 118-154). Add it to the
   mutual-exclusion handler. Accent color teal/cyan.
2. **Panel type** - add `"umrah-step"` to `PanelType` in `lib/store/panelStore.ts` (line ~3) and
   a corresponding panel component following `TouristPlaceInfoPanel.tsx` (dual mobile BottomSheet
   - desktop floating panel).
3. **Map integration** - add `showUmrah?: boolean` and `umrahStep?` props to
   `components/map/MapView.tsx`. Add effects mirroring the existing marker/fly-to/route effects
   (lines 245, 328-344, 393-482): draw step markers, draw the journey line and Tawaf/Sa'i
   overlays, fly-to the active anchor, draw user->next route.
4. **Ritual overlay layers** - add GeoJSON sources/layers to `lib/map/layers.ts` (Tawaf ring,
   Sa'i corridor, sacred points), reusing `ROUTE_LAYER_ID`-style casing+line patterns.
5. **Markers** - extend `lib/map/markers.ts` with a numbered step marker builder and a
   "recommended gate" pulsing marker.
6. **Routing** - reuse `useMapRouting` for user->next-step and user->gate; the simulation is
   fine for v1.
7. **Geolocation** - reuse `useGeolocation`, `useGateProximity` for "where am I / nearest gate."
8. **Offline** - bundle `lib/data/umrah/*` + audio as static imports/assets (works with Next.js
   standalone build); no API needed for v1. (The `app/api/` dir is empty; react-query is unused -
   keep v1 fully client-side.)
9. **Dua audio** - drop recitations under `/public/audio/`; reference from `Dua.audio`.

### Testing

- Unit tests (Vitest) for the step-resolution logic (gender branching, miqat resolution,
  counter auto-advance) - this is the riskiest pure logic.
- Snapshot the resolved sequence per profile fixture.
- Playwright e2e for the onboarding -> first-step -> Tawaf counter flow.
- A "content review" check: every step/dua/mistake must carry at least one `sourceRef`.

---

## 10. Phased Roadmap

### Phase U1 - Content foundation (no new UI) — [x] DONE

> Shipped: `lib/data/umrah/{steps,duas,mistakes,anchors,miqat}.ts` + `types/umrah.ts`,
> bilingual (bn/en) + Arabic with `sourceRefs` on every record. Verified by
> `tests/unit/umrah-content.test.ts`.

- Author `lib/data/umrah/{steps,duas,mistakes,anchors,miqat}.ts` from Sections 3-4, with
  `sourceRefs` on every record. Bengali + English + Arabic.
- Define `types/umrah.ts`.
- Get coordinates for anchors (reuse `tourist-places.ts`; verify Kaaba/Hateem/Safa-Marwa/gates).
- Deliverable: a reviewable content package a scholar can verify.

### Phase U2 - Step engine + onboarding (logic, minimal UI) — [x] DONE

> Shipped: `umrahGuideStore` (zustand + persist), `resolveSteps`/counter logic,
> `UmrahOnboarding` wizard + `UmrahStepList` panel. Verified by
> `tests/unit/umrah-sequence.test.ts`.

- `umrahGuideStore`, sequence resolution, counter logic, persistence.
- Onboarding wizard (gender, travel path, companionship, accessibility, optional madhhab).
- The personalized step list UI (read-only, no map yet).
- Unit tests for resolution.

### Phase U3 - Map integration (the visual hero) — [x] DONE

> Shipped: `showUmrah` props + ritual overlay (`lib/map/umrah-overlay.ts`), numbered step
> markers + journey line + fly-to in `MapView.tsx`, gate recommendation, dual panel.
> Verified by `tests/e2e/umrah-map.spec.ts`.

- `showUmrah` props + step markers + journey line + fly-to in `MapView.tsx`.
- Ritual overlay layers (Kaaba/Hateem, Tawaf ring, Sa'i corridor, sacred points).
- "Where am I / where next" using geolocation + `useMapRouting`.
- Gate recommendation highlight (reuse gates data + proximity).
- Dual mobile/desktop panel for the active step.

### Phase U4 - Ritual counter views + Miqat engine — [x] DONE

- [x] Tawaf counter view (1-7, raml/Yamani-dua prompts) — shipped inside the `UmrahStepList`
      step detail (progress ring + per-round tips). Dedicated top-down Mataf map mode deferred.
- [x] Sa'i counter view (1-7, green-marker jog prompt) — shipped inside the step detail.
- [x] Miqat overview map + flight countdown card for air-Dhaka-Jeddah path.
  - [x] Flight ihram "countdown" card — pre-boarding checklist + manual guidance +
        collapsible Talbiyah + Dam warning. Shipped: `components/umrah/FlightIhramCard.tsx`,
        rendered in the prep & ihram-miqat step detail for the air path.
  - [x] Miqat overview map (5-point ring around Makkah). Shipped:
        `components/umrah/MiqatOverviewPanel.tsx`, `createMiqatMarkerElement` in `markers.ts`,
        MapView `showMiqatOverview` (markers + fitBounds), `miqatRingBounds()` in `miqat.ts`,
        triggered from the guide header. Wires up the previously-unused `miqat-overview` mode.

### Phase U5 - "I made a mistake" assistant — [x] DONE

> Shipped: `MistakeAssistant.tsx` decision-tree UI over `mistakes.ts`, expiation notes
> (Takhyir vs Tartib), inline sources, reassuring Bangla copy.
> Verified by `tests/e2e/umrah-mistake.spec.ts`.

- Decision-tree UI over `mistakes.ts`; outcomes with expiation notes (Takhyir vs Tartib).
- Inline source links.
- Reassuring copy review.

### Phase U6 - Dua audio + offline + polish — [~] PARTIAL

- [ ] Record/source Bengali + Arabic dua audio; "Listen" mode. (Deferred — needs audio assets.)
- [x] Offline bundling + graceful routing degradation. All guide content is bundled as static
      TS (works with no data); `useMapRouting` degrades to straight-line; `components/umrah/OfflineBadge.tsx`
      surfaces online/offline status. (Lightweight indicator — no service worker, per scope.)
- [ ] Accessibility (wheelchair paths), "lost group" helper, Farewell Tawaf reminder. (Deferred
      this pass — wheelchair is already captured in onboarding & gate recommendation.)
- [x] Reduced-motion, theming, final visual polish. (`umrah-pulse` + reduced-motion guard in
      `app/globals.css`; teal/cyan accent system.)

### Phase U7 (later) - Optional enhancements

- GPS/accelerometer auto-detection of Tawaf circuits.
- Real Barikoi routing API for walking directions.
- Flight tracking for the miqat countdown (if a data source is permitted).
- Hajj mode (Mina/Arafat/Muzdalifah/Rami) reusing the same engine.
- "See / Listen / Act" multimodal assistant from the existing vision doc.

---

## 11. Open Decisions / Trade-offs

These are worth deciding before Phase U3. Listed so the plan is honest about choices.

1. **Indoor detail source.** Outdoor MapLibre tiles are weak inside the Haram. Options:
   (a) schematic overlay only (cheaper, fully offline, recommended for v1);
   (b) license an indoor floor plan / high-res aerial of the Mataf;
   (c) hand-drawn isometric illustration of the Haram for the ritual views.
   Recommendation: (a) now, (c) as a future "beautiful" upgrade.

2. **Circuit detection.** Manual tap (simple, reliable, offline) vs GPS/accelerometer auto-count
   (magical but unreliable indoors and in crowds). Recommendation: manual for v1, with auto-detect
   as an experimental toggle later.

3. **Madhhab handling.** "Show all views" (more text, more neutral) vs a single default school
   (simpler, less neutral). Recommendation: default "show all," allow the user to pick a school to
   tailor expiation copy - never assert a verdict.

4. **Mahram messaging for women.** Present both scholarly views + current Saudi visa policy with a
   live Nusuk link. Never block onboarding.

5. **Content authority.** Have a qualified scholar review the Bengali/English content and the
   mistakes table before public release. The app cites; a scholar confirms.

6. **Audio assets.** Source quality recitations (Bengali + Arabic). Licensing and storage size vs
   offline bundling.

7. **Real routing now or later.** `useMapRouting` is simulated. For v1 "go to next step," straight
   line + distance is acceptable; upgrade to Barikoi routing when precision matters (gate->gate
   walking).

---

## 12. Sources and References

### Ritual procedure and sequence

- IslamQA #31819 - core Umrah sequence, niyyah, Yemeni corner, dua between corners, halq/taqsir:
  https://islamqa.info/en/answers/31819
- Nusuk (official Saudi portal) Umrah Journey - step rites, gender raml/idtiba/jogging:
  https://umrah.nusuk.sa/Journey
- Islamic Relief - how to perform Umrah (ghusl, entering mosque, Zamzam, gender):
  https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/how-to-perform-umrah/
- Guide to Islam - pillars vs obligations vs sunnah of Umrah:
  https://guidetoislam.com/en/articles/the-pillars-obligations-and-supererogatory-acts-of-umrah-11002
- IslamQA #39524 - is Umrah obligatory (madhhab difference):
  https://islamqa.info/en/answers/39524

### Miqat

- Hajj Umrah Planner - miqat list and distances: https://hajjumrahplanner.com/miqat/
- Bakkah Transport - miqat points: https://bakkahtransport.com/blog/miqat-points/
- Wikipedia - Miqat: https://en.wikipedia.org/wiki/Miqat
- Saudi Ministry of Hajj & Umrah - assume ihram before crossing miqat by air:
  https://www.facebook.com/SaudiMOHUEn/posts/695696863193701/
- AboutIslam - cannot assume ihram at Jeddah airport:
  https://aboutislam.net/counseling/ask-the-scholar/umrah/can-assume-ihram-umrah-jeddah-airport/
- Jordan Iftaa #2982 - pilgrim by plane assumes ihram at the miqat:
  https://www.aliftaa.jo/research-fatwa-english/2982/
- IslamOnline Fiqh - Jeddah residents assume ihram from home:
  https://fiqh.islamonline.net/en/miqat-for-those-who-live-in-jeddah/
- IslamQA #32845 - miqat for Makkah residents (Tan'eem/Masjid Aisha):
  https://islamqa.info/en/answers/32845
- Discover Makkah - Masjid Aisha / Tan'eem:
  https://www.discovermakkah.sa/en/places-worth-visiting/landmarks/al-taneem-mosque-(lady-aisha)

### Duas

- Duas.com #371 - Talbiyah: https://duas.com/dua/371/the-talbiyah-chant-of-hajj-and-umrah
- Duas.com #373 - dua between Yemeni corner and Black Stone:
  https://duas.com/dua/373/dua-said-between-the-yemeni-corner-and-the-black-stone
- Hajj Umrah Planner - Talbiyah timing: https://hajjumrahplanner.com/talbiyah/

### Gender rules and mahram

- Saudi MOHU - women must not wear niqab/gloves in ihram:
  https://www.facebook.com/SaudiMOHUEn/posts/979986444764740/
- iLink Tours - women's ihram rules: https://ilinktours.com/umrah-rules-for-women/
- SeekersGuidance (Shafi'i) - women travelling without mahram:
  https://seekersguidance.org/answers/shafii-fiqh/can-women-travel-without-a-mahram-according-to-the-shafii-school/
- Dar al-Ifta #8127 - women performing pilgrimage without mahram:
  https://www.dar-alifta.org/en/fatwa/details/8127/
- Islamic Portal - majority require mahram:
  https://islamicportal.co.uk/is-travelling-without-mahram-permissible-according-to-imam-shafiee/
- Islamic Relief - Umrah rules (visa/mahram policy): https://www.islamic-relief.org.uk/resources/knowledge-base/umrah/umrah-rules/

### Ihram prohibitions

- Studio Arabiya - ihram rules for men and women: https://studioarabiya.com/ihram-rules-for-men-and-women/
- Makarem Hotels - prohibitions in ihram: https://makaremhotels.com/en/news/prohibitions-ihram-men-and-women
- Muslim Planner - ihram rules guide: https://muslimplanner.com/blogs/islamic-productivity/ihram-rules-guide
- Al-Kareem Travel - things that break ihram: https://alkareemtravel.co.uk/7-things-that-break-ihram-during-umrah/
- IslamQA #11356 - things to avoid in ihram: https://islamqa.info/en/answers/11356

### Geometry and locations

- Wikipedia - Kaaba (dimensions): https://en.wikipedia.org/wiki/Kaaba
- Wikipedia - Hijr Ismail / Hatim: https://en.wikipedia.org/wiki/Hijr_Ismail
- Wikipedia - Safa and Marwa (distances): https://en.wikipedia.org/wiki/Safa_and_Marwa
- Madain Project - Tawaf distance: https://madainproject.com/tawaf_distance
- The Pilgrim - Tawaf distance: https://thepilgrim.co/tawaf-distance/
- Discover Haramain - Hijr Ismail guide: https://discoverharamain.com/guides/hijr-ismail
- Ziyuf al-Rahman - main gates of Masjid al-Haram: https://ziyufalrahman.co.uk/the-main-gates-of-masjid-al-haram/
- Saif Hajj Umrah - 45 gates list: https://www.saifhajjumrahtravels.com/about-us/blog/45-gates-of-masjid-al-haram

### Mistakes, expiations, and validity

- IslamQA Topic #133 - mistakes by pilgrims (index): https://islamqa.info/en/categories/topics/133
- IslamQA #49027 - types of fidyah and the three-option system: https://islamqa.info/en/answers/49027
- IslamQA #34695 - wudu for Tawaf and Sa'i; Ibn Taymiyyah view: https://islamqa.info/en/answers/34695
- IslamQA #69934 - passing the miqat without ihram: https://islamqa.info/en/answers/69934
- IslamQA #122795 - forgot to cut hair after Umrah: https://islamqa.info/en/answers/122795
- IslamQA #95860 - she forgot to cut her hair: https://islamqa.info/en/answers/95860
- IslamQA #39814 - no Tawaf due to menses (order of rites): https://islamqa.info/en/answers/39814
- IslamQA #112271 - Tawaf on period; Ibn Taymiyyah necessity exception: https://islamqa.info/en/answers/112271
- IslamQA #119134 - expiation for intercourse during Umrah: https://islamqa.info/en/answers/119134
- IslamWeb #25166 - multiple violations, one or more expiations: https://www.islamweb.net/en/fatwa/25166
- IslamWeb #510355 - forgetting to cut hair (minority Dam view): https://www.islamweb.net/en/fatwa/510355/
- IslamWeb #116147 - assuming ihram in the plane: https://www.islamweb.net/en/fatwa/116147
- Dar al-Ifta #6531 - kaffara categories (choice vs gradation): https://www.dar-alifta.org/en/fatwa/details/6531/
- Dar al-Ifta - the Umrah: rulings and rites: https://www.dar-alifta.org/article/details/103/the-umrah-rulings-and-rites
- SeekersGuidance (Hanafi) - expiations for ihram violations: https://seekersguidance.org/answers/hanafi-fiqh/what-are-the-expiations-for-the-following-violations-in-ihram/
- SeekersGuidance (Hanafi) - flying past miqat without ihram: https://seekersguidance.org/answers/hanafi-fiqh/do-i-need-to-pay-expiation-if-we-fly-past-the-miqat-without-ihram/

### Practical / accessibility

- Saudi Ministry of Hajj & Umrah portal: https://haj.gov.sa/en/Umrah
- Assist Haramain - electric wheelchair rental: https://assist.haramain.com/
- Ziyarago - free wheelchairs at Masjid al-Haram: https://ziyarago.com/en/places/rental/equipment-rental-wheelchairs-baby-strollers/free-wheelchair-haram-makkah

---

## 13. Important Disclaimer

This plan compiles rulings from recognized Sunni fiqh sources for **informational and educational**
use within an app. Where scholars differ (e.g., wudu as a condition of Tawaf; takhyir vs tartib
in expiation; mahram for women; whether Umrah is obligatory), the app must **present the views,
not adjudicate them**. For a ruling on a specific personal situation, the user should consult a
qualified scholar. All factual claims in the app should carry the source link from Section 12.

Saudi visa and logistics policies change; the app should link to the live
[Nusuk](https://www.nusuk.sa/) portal rather than hardcoding current rules.

Gate numbers at Masjid al-Haram shift with each expansion; pin gates by **name + GPS**, treat
numbers as advisory only.
