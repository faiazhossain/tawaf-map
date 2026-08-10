# Umrah Map — UI/UX Audit, Color System & Design Direction

> Prepared as a ground-truth analysis of the existing `project-tawaf` codebase (branch `feat/umrah-guide`).
> Every finding below is backed by a read of the actual source. No UI was changed to produce this document.
> File:line references are repo-relative.

---

## Executive Summary

`project-tawaf` (marketed as **TawafMap**) is a genuinely strong engineering product wearing a weak, inconsistent visual shell. The **architecture, data, and the Tawaf/Sa'i ritual engine are excellent** and must be preserved. The **visual and interaction layer is the problem**: it has no real design system, uses color semantically at random, and ships a few functional bugs that undermine trust.

The single most important finding: **there are two disconnected color systems in the codebase.** `app/globals.css` defines a full shadcn/ui token theme — but `--primary` is still the stock **blue** (`221.2 83.2% 53.3%`), and _no production component consumes those tokens_. Every real screen hardcodes raw Tailwind palette values (`bg-slate-950`, `bg-emerald-600`, `bg-teal-600`, `bg-purple-600`, `bg-orange-600`, `bg-blue-600`). Emerald is the _de-facto_ brand color, yet it is declared nowhere. Fixing this disconnect is the foundation everything else depends on.

The Tawaf experience — the intended hero feature — is implemented with care (a persisted state machine, synchronized map overlay, per-round draw animation, contextual landmark hints) but is undermined by **three parallel, visually inconsistent 7-round widgets** and a fragile bottom sheet that can be flung away by accident.

The recommended direction (Deep Emerald + Warm Ivory, map- and pilgrim-first) is sound and is endorsed below — **with one honest correction**: the brief's "muted map palette" cannot be fully achieved against the _current remote_ Barikoi base map, which we do not control. Achieving it is a deliberate, separate decision (host/proxy our own vector style). Until then, we tune only the overlay palette. This tradeoff is surfaced explicitly rather than glossed.

**Headline priorities:**

- **P0** — Establish the token foundation; fix shipped-broken controls (custom zoom/compass are no-ops); move the hardcoded map API key to an env var; restore OSM attribution; resolve Bengali-first regressions.
- **P1** — Unify color to a semantic emerald system; pivot chrome to the warm-ivory light theme (which also resolves the current dark-chrome-on-light-map mismatch); redesign the homepage around the map; clean up the 6-color map header.
- **P2** — Depth: typography (Bengali + Arabic), touch targets, accessibility (focus traps, dialog roles), performance, dead-code removal, content fixes.
- **P3** — Polish and remaining plan phases (T4 themed heading, T7 contextual polish, U6 dua audio).

---

## Existing Architecture

**Stack**

- Next.js 15 (App Router) + React 18 + TypeScript (`strict`).
- MapLibre GL `4.7.0` for the map (imperative API, not React-wrapped).
- Zustand `5.0.2` for state — **9 stores** (`map`, `location`, `gate`, `hotel`, `touristPlace`, `poi`, `route`, `panel`, `umrahGuide`); two are `persist`-ed (`map`, `poi`, `umrahGuide`).
- TanStack Query `5`, React Hook Form `7`, Zod `3` (largely unused so far — forms are minimal).
- Tailwind `3.4` + **shadcn/ui** (`baseColor: slate`, CSS variables on) + `tailwindcss-animate`.
- Testing: Vitest `2.1` (jsdom, RTL) + Playwright `1.49` (chromium/firefox/webkit + Mobile Chrome).

**Routing** — only two routes exist:

- `/` — `app/page.tsx` — marketing homepage (Bengali-first).
- `/map` — `app/map/page.tsx` — the entire application (map + Umrah guide + gates/hotels/tourist places).

**Layout** — `app/layout.tsx` loads only `Inter` (`subsets: ["latin"]`). Bengali rendering depends on OS fallback fonts (see Typography). `<html lang="en">` despite Bengali-first content.

**The map page is a single composer** (`app/map/page.tsx`) that wires together `MapView` + 7 Zustand stores + lazy-loaded info panels + the Umrah guide sheet/panel. State flows outward from stores; `MapView` is a pure observer of `useUmrahGuideStore` (it never advances steps itself — the guide panels do).

**Assessment:** The architecture is clean, well-typed, well-segmented by domain, and correctly testable. **Do not rewrite it.** The work is almost entirely in the presentation layer and a handful of wiring bugs.

---

## Existing UI Analysis

**Homepage (`app/page.tsx`).** A generic SaaS structure — Problem → Solution → Vision → Target Users → CTA — with a **static logo hero, no map integration**, content focused on gates/hotels/food/transport rather than the Umrah guidance journey (the actual hero feature), and a rainbow of accent colors (rose, amber, purple, emerald, cyan, violet). Footer carries "Barikoi / বারিকয় সৌদি আরবিয়া" branding. It does not communicate "Perform Umrah with confidence."

**Map page header.** A horizontal row of **6 toggle buttons, each a different color**: Umrah=teal, Hotels=emerald, Historical=purple, Terrain=blue, Gates=orange, plus a GateSelector. On mobile these collapse to icon-only. This is the clearest example of random, non-semantic color in the product.

**Map page body.** `bg-slate-950` dark chrome sitting on top of a **light** Barikoi base map (off-white `#f5f3f4`, blue water). Dark controls on a bright map is the dominant visual mismatch of the product. Info panels (Gate/Hotel/Tourist/Route) float top-right or bottom as bottom sheets.

**Umrah guide.** On mobile, a 3-snap bottom sheet (peek/normal/expanded at 12%/42%/92% of `dvh`); on desktop (`≥640px`), a fixed `w-96` floating panel. The instruction card, circuit stepper (`+/−` with progress ring), and step list are genuinely thoughtful. But the sheet has no backdrop (by design, so the map stays interactive) _and_ `dismissOnDragDown` is on — so a vigorous downward fling dismisses the entire guide with no obvious path back.

**UI primitives.** `components/ui/{button,card,badge,input,bottom-sheet}.tsx`. Only the first four use the shadcn tokens. `Card` and `Badge` are **never used** — every panel rebuilds its own `bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl` shell from scratch. The `BottomSheet` (`components/ui/bottom-sheet.tsx`, 429 lines) is a **custom hand-rolled** implementation (React context + touch handlers + `requestAnimationFrame`), not Radix/Vaul, and hardcodes `bg-slate-900`.

---

## Existing Color Analysis

### The two-system disconnect (the core problem)

**System A — shadcn tokens** (`app/globals.css:6-49`, `tailwind.config.ts`): `--background`, `--foreground`, `--primary` (**blue `221.2 83.2% 53.3%`**), `--card`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`. Light `:root` + `.dark` overrides. Consumed **only** by `button/card/badge/input`.

**System B — hardcoded Tailwind palette** (every panel, the `BottomSheet`, the pages): `bg-slate-950`, `bg-slate-900`, `bg-emerald-600`, `bg-teal-600`, `bg-purple-600`, `bg-orange-600`, `bg-blue-600`, `text-slate-400`, `border-slate-700/50`, etc. **Zero token usage, dark-only by default, no light counterpart.**

Concretely: `bottom-sheet.tsx:278-279` hardcodes `bg-slate-900`/`border-slate-700/50`; `HotelInfoPanel.tsx:66` hardcodes an `bg-emerald-600` banner; `HotelInfoPanel.tsx:176` overrides the Button's `default` variant with `bg-emerald-600 ... border-0`; the homepage scatters rose/amber/purple/emerald/cyan/violet across its cards. Switching `--primary` would change `Button` and nothing else.

### Color inconsistencies (exact)

| Concept            | Value A                                 | Value B                        | Where                                                         |
| ------------------ | --------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| "Completed" round  | `emerald-500` `#10b981`                 | `emerald-400` `#34d399`        | `RoundDots`/`markers.ts` vs `RitualRoundHud`/`ProgressRing`   |
| "Active" round     | `teal-500` `#14b8a6`                    | `teal-400` `#2dd4bf`           | `RoundDots` vs `RitualRoundHud`/`ProgressRing`/map active arc |
| Routing line       | **blue** `#3b82f6`                      | ritual line **teal** `#14b8a6` | `layers.ts:68` route vs `umrah-overlay.ts:227` tawaf ring     |
| Map header toggles | teal / emerald / purple / blue / orange | —                              | `app/map/page.tsx:244-318`                                    |

### Owned overlay palette (full inventory)

- **Routing** (`lib/map/layers.ts`): line `#3b82f6` blue, casing `#ffffff`, user-accuracy fill `#3b82f6`.
- **Markers** (`lib/map/markers.ts`): gates by type `#3b82f6`/`#22c55e`/`#f59e0b`; hotels by price `#22c55e`/`#3b82f6`/`#f59e0b`/`#8b5cf6`; tourist places = **11 different colors**; user dot `#3b82f6`.
- **Ritual overlay** (`lib/map/umrah-overlay.ts`): tawaf ring `#14b8a6`, draw tracer `#5eead4`, Kaaba `#1f2937`, Hateem `#92400e`, Sa'i corridor `#06b6d4`, Sa'i green zone `#22c55e`, sacred points `#f59e0b`, journey line `#14b8a6`; progress future `#64748b`, completed `#10b981`, active `#2dd4bf`.
- **Umrah step markers** (`markers.ts:256-260`): completed `#10b981`, active `#14b8a6`, upcoming `#475569`.

### Remote base map palette (Barikoi `osm_barikoi_pl` — **not owned**)

Extracted live from the style JSON: light OSM-style — background mint-green (z5) → off-white `#f5f3f4` (z12); water `#8AB5FF`; warm tan/yellow/white roads; white→grey buildings. **There is no dark map theme wired up** despite `MAP_STYLES.dark` existing in dead config and all UI chrome being dark.

### The dark-chrome / light-map mismatch

The product's single biggest visual problem: **dark slate panels floating on a bright, light base map.** This is visually noisy and makes the calm, map-first goal impossible. The brief's warm-ivory direction resolves this — a light chrome on a light map is internally coherent (see _New Visual Direction_).

---

## UX Problems

1. **"What do I do now?" is not answered at a glance on `/`.** The homepage sells gates/hotels/food; the Umrah guidance journey (the real product) is buried behind a single "ওমরাহ" button on `/map`. A first-time pilgrim cannot tell this app guides them through Umrah.
2. **Six same-shaped, differently-colored toggles** in the header carry no semantic meaning; the pilgrim cannot learn a color language.
3. **Two disconnected zoom/compass controls** — the custom `MapControls` (top-left) and the built-in MapLibre `NavigationControl` (top-right). The custom one is broken (see Map UX), so users discover inconsistency.
4. **The guide can be flung away by accident** (`dismissOnDragDown` + no backdrop) with no obvious recovery.
5. **The guide always reopens at the "normal" 42% snap**, ignoring where the user last left it.
6. **No completion gate** — `nextStep()` lets a pilgrim cursor past incomplete Tawaf/Sa'i, so the "progress" can lie.
7. **`LandmarkHint` never auto-hides** during Tawaf/Sa'i — it sits over the map the entire ritual until manually dismissed.
8. **Mixed language in the UI**: `HotelInfoPanel`/`RoutePanel` are Bengali; `TouristPlaceInfoPanel` is entirely English; distance/time formatters emit Latin digits + English units ("5 min", "1.2km") in a Bengali-first product.
9. **No "jump to next incomplete step"** affordance — `findNextIncompleteIndex` is implemented but never wired.
10. **`travel-to-haram` declares proximity completion** but no proximity/geofence logic exists — it's effectively manual, which is misleading.

---

## Mobile UX Problems

- **Touch targets below 44px:** `MapControls` buttons are `h-10 w-10` (40px); `GuideControls`/`GuideStepList` use `text-[11px] px-2 py-1` (~24px); Umrah-step markers are 32px default. For outdoor one-handed use these are too small. (Recenter button at 44px is the good exception.)
- **No safe-area top inset** on the `BottomSheet` (left/right/bottom are handled; content butts against the rounded top). `TawafGuidePanel` and `UmrahOnboarding` have **no safe-area handling at all**.
- **Desktop panel is fixed `w-96` (384px)** — on a 640–768px tablet it consumes most of the map width.
- **The custom `BottomSheet` is touch-only** — drag/dismiss uses `onTouchStart/Move/End` with no pointer/mouse handlers; desktop users cannot resize by drag.
- **Hard `sm:` breakpoint** swaps the entire guide component (sheet → panel) at 640px, so the ~640–768px zone inherits the desktop panel even on touch devices.
- **Horizontal overflow risk:** the 6-button header on narrow widths (320–360px) is crowded when labels appear.
- **`vh` vs `dvh`:** `TawafGuidePanel` uses `h-[calc(100vh-7rem)]` (affected by mobile URL bar); the sheet correctly uses `dvh`.
- **`viewport` allows `maximumScale: 5`** — good for accessibility (no zoom lock).

---

## Map UX Analysis

**Strengths**

- Ritual geometry is accurate and well-engineered: Kaaba footprint (11×13m), Hateem (northern semicircle, r=9m), a 64-point counter-clockwise Tawaf ellipse (20×18m), and a **real 16-point Mas'a corridor** for Sa'i (split into outbound/return lanes) — `lib/map/umrah-overlay.ts`.
- Camera choreography (`useTawafCamera`) correctly distinguishes programmatic moves from user gestures via a token-guarded system, and shows a Recenter button when the user takes control.
- Per-round **draw animation** (`useRitualDrawAnimation`) walks a gendered pilgrim marker along the revealed path with a teal tracer and fades it on completion — a genuinely delightful, purposeful animation.
- Direction chevrons along the active path reinforce the walking direction.

**Critical problems**

1. **Custom `MapControls` (zoom/compass) are no-ops.** `MapView.tsx:244-305` reads `center/zoom/bearing/pitch` once at init (with `eslint-disable react-hooks/exhaustive-deps`) and never re-applies store values. `MapControls` calls `setZoom/setBearing/setPitch` on the store, but nothing pushes those back to the map. Only the built-in `NavigationControl` actually moves the map. → **Two zoom/compass UIs, one broken.** (`MapControls.tsx`, `MapView.tsx`.)
2. **Hardcoded map API key in client source** — `MapView.tsx:84-85` embeds `?key=MjY0NDpHRUswODE3R1VV` in the Barikoi style URL. Ships in the bundle; not the env var; not even the provider the env/dead-config points to. Security/licensing risk.
3. **`attributionControl: false`** on OSM-derived tiles (`MapView.tsx:256`) — OSM attribution is legally required.
4. **Dead configuration that disagrees with reality** — `lib/map/styles.ts` (`MAP_STYLES` → `tiles.bmapsbd.com`, `CUSTOM_MAP_STYLE`) is unused by `MapView`; most of `lib/map/layers.ts` circle paints (gates/hotels/user) are unused because `MapView` renders HTML markers; the React components `GateMarker/HotelMarker/TouristPlaceMarker` are unused (MapView uses imperative `markers.ts` factories).
5. **The 7-color ritual progress arcs are defined (`createProgressLayerSet`) but never registered as layers** — circuit coloring is conveyed only by HUD dots and the draw animation, not by segmented map arcs. (Verify against intent; likely an oversight.)
6. **Light base map + dark chrome** mismatch (covered above).
7. **Routing line is blue `#3b82f6`** while the ritual line is teal — two "route" concepts, two unrelated colors.

**Map markers:** HTML `div`s via `maplibregl.Marker` (not symbol layers). Gates/hotels 36px (44 selected), tourist 40px, umrah-step 32px (40 active), pilgrim 30×76px with `pilgrim-bob`. The full marker set is **rebuilt on every selection** (`MapView.tsx:374-399` etc.) — O(N) DOM churn per tap.

---

## Tawaf UX Analysis

**State machine (`lib/store/umrahGuideStore.ts`)** — persisted to `localStorage`; `partialize` keeps `profile/onboarded/currentIndex/completed/counters/mode` and re-derives `stepIds` on rehydrate (defends against data drift). 9 steps: `prep → ihram-miqat → travel-to-haram → enter-haram → tawaf → pray-after-tawaf → sai → halq-taqsir → done`. Only Tawaf and Sa'i carry counters (`min 1, max 7`) and 7 `perRoundTips` each. Auto-completion at 7/7; decrementing below max un-completes (surprising but defensible).

**Three parallel 7-round widgets (the consistency crisis):**
| Widget | Location | "Completed" | "Active" | "Future" | Dot size |
|---|---|---|---|---|---|
| `RoundDots` | sheet (beside counter) | `emerald-500` ✓ | `teal-500` pulse | hollow `border-slate-600` | 16px |
| `ProgressRing` | `+/−` stepper | `emerald-400` | `teal-400` | `slate-700` track | 56px ring |
| `RitualRoundHud` | map overlay (top-center) | `emerald-400` | `teal-400` pulse | filled `slate-600` | **8px** |

The same concept is rendered three ways with three color scales and two icon strategies (check vs none). A pilgrim cannot map the map's tiny dots to the sheet's big dots.

**Round completion moment** — `flashRitualRing` flashes the ring `#14b8a6 → #10b981 → #14b8a6` (500ms, reduced-motion safe), `RoundDots` plays a `round-complete` scale bounce, `ProgressRing` animates `strokeDashoffset`. These are good and purposeful — they should be unified, not duplicated.

**Onboarding (`UmrahOnboarding.tsx`)** — a 5-step (women) / 4-step (men) wizard: gender → travel path → travel group (if female) → accessibility (wheelchair/slowPace) → madhhab. Resolves the Miqat live. Does **not** collect group-size number or a language toggle. Has **no `role="dialog"`/`aria-modal`/focus trap**.

**Bengali leak:** `lib/map/landmark-utils.ts:20` mixes English "takbir" into a Bengali sentence (should be তাকবীর).

---

## Animation Analysis

Defined in `app/globals.css`, all **guarded by `prefers-reduced-motion`** (good):

- `instruction-crossfade` (0.3s opacity+slide on step/counter change, via keyed remount) — purposeful.
- `round-complete` (0.5s scale bounce on the just-completed dot) — purposeful.
- `ritual-hud-dot-active` / `umrah-pulse` (2s box-shadow pulse on active markers) — purposeful.
- `pilgrim-bob` (0.6s translateY walk bob) — purposeful.

**Problems:**

- **`BottomSheet` exit animation is broken.** `close()` (`bottom-sheet.tsx:87-91`) toggles `isClosing` true→false synchronously; React batches it, so the sheet pops out instantly — the `isClosing ? "opacity-0"` backdrop branch is dead. Open animation works (rAF ease-out-cubic); close does not.
- **`BottomSheet` JS spring is not reduced-motion-guarded** (only CSS animations are).
- **`useDirectionArrows` runs an unbounded `requestAnimationFrame` loop** for the _entire duration_ a ritual step is active, calling `setPaintProperty` every frame for the "comet sweep" opacity — continuous main-thread + GPU work while sitting on Tawaf/Sa'i. The most material perf concern.
- Two parallel progress-bar implementations (`GuideControls`, `GuidePeek`) with the same gradient (`from-teal-500 to-emerald-500`) — duplicated, not shared.

---

## Accessibility Analysis

**Good**

- `InstructionCard`, `RitualRoundHud`, `LandmarkHint` use `aria-live="polite"` / `role="status"`.
- `GuideStepList` uses `role="list"/"listitem"`, `aria-current="step"`, `aria-expanded`/`aria-controls`, and `aria-hidden` on collapsed details.
- `ProgressRing` uses `role="img"` + Bengali `aria-label`.
- `BottomSheet` has `role="dialog"`/`aria-modal="true"` + Escape-to-close + body scroll lock.
- Onboarding checkboxes are native `<input>` inside `<label>`.
- All animations honor `prefers-reduced-motion`.

**Gaps**

- **No focus trap anywhere.** Nothing moves focus into a sheet/panel/dialog on open, constrains Tab, or restores focus on close. The page behind is not `inert`.
- **Desktop floating panels have no `role="dialog"`, no Escape, no focus management, no backdrop/click-outside.** Close buttons exist but the panels aren't announced as dialogs.
- **HTML map markers are mouse/touch-only** — no `role="button"`, `tabindex`, keyboard handler, or `aria-label`. Invisible to screen readers. Gate/hotel have `img alt`; tourist/umrah/miqat markers have none.
- **`MapControls` uses `title=` not `aria-label`** (not a robust accessible name); the **map canvas has no `role`/`aria-label`/label**.
- **`RoundDots` is `aria-hidden`** — the dot strip is invisible to AT (the numeric counter carries the signal, which is acceptable, but the redundancy is lost).
- **Drag handle** is a `<button>` with `aria-label="Drag to resize sheet"` that does nothing on Enter/Space.
- **`RoundDots` relies partly on color** for state (mitigated by the check icon on completed, but "future" vs "active" for non-checking dots is color-only at small sizes).
- English `aria-label` on the drag handle conflicts with the Bengali-first rule.

---

## Performance Analysis

- **`useDirectionArrows` unbounded RAF loop** (covered above) — the priority perf fix.
- **Per-selection marker rebuilds** — every gate/hotel/tourist selection removes and recreates the entire marker set (`MapView.tsx:374-486`). Fine at current scale (≤39 markers), but it's O(N) DOM churn per tap; should toggle a `selected` class instead.
- **`move` handler writes the store ~60×/s** during pan (`MapView.tsx:285-289`); `MapControls` re-renders on every zoom change via whole-store destructure.
- **Map init is intentionally non-reactive** (`eslint-disable` on deps) — store `center/zoom/bearing/pitch/style` changes after mount do not re-init/restyle the map, so the store drifts from the live map over a session (root cause of the no-op `MapControls`).
- **Oversized images:** `public/images/tourist-places/al-mukarramah.jpg` (~4.2 MB), `makkah-zamzam-well.jpg` (~4.4 MB), plus several 700–900 KB files; mixed formats (jpg/jpeg/webp/png/avif) with inconsistent optimized variants. No lazy-loading strategy observed for panel imagery.
- **Draw animation `setData` per frame** for 2.8s — acceptable one-shot, but two rituals could overlap.
- **`flashRitualRing` uses raw `setTimeout` + `setPaintProperty`** without overlap-guarding a second tap within 500ms.

---

## What Should Stay

- **Architecture:** Next.js App Router, TypeScript strict, the 9-store Zustand design, MapLibre imperative integration. Do not touch.
- **Ritual engine:** `umrah-overlay.ts` geometry, the persisted `umrahGuideStore` state machine, `useTawafCamera` token-guarded camera, `useRitualDrawAnimation`, the contextual `LandmarkHint` concept.
- **Data:** 20 gates, 10 hotels, 39 tourist places, 9 steps, 12 anchors, 6 duas, 6 miqat, 14 mistake-tree nodes — all coordinates correct, content native Bengali.
- **Animations:** `instruction-crossfade`, `round-complete`, `umrah-pulse`, `pilgrim-bob`, the draw animation, the ring flash. All purposeful and reduced-motion-safe.
- **Accessibility foundations:** the `aria-live` regions, `role="dialog"` on the sheet, `aria-current="step"`, the reduced-motion CSS guard.
- **Testing:** the umrah-content/-sequence/-tawaf-overlay suites and the Playwright Umrah flows are genuinely valuable — preserve and extend.
- **`BottomSheet` primitive mechanics** (snap points, body scroll lock, safe-area L/R/B) — keep the _behavior_, replace the _styling_ and fix the exit animation.

---

## What Should Change

- **Establish one token system** (semantic, light-primary) and migrate every hardcoded color to it. This is the prerequisite for every visual improvement.
- **Unify the three round widgets** into one `CircuitProgress` component used identically on the map and in the sheet (same colors, same icon, same size scale).
- **Pivot chrome to warm-ivory light theme** — resolves the dark-chrome/light-map mismatch and matches the calm/premium brief.
- **Redesign the homepage** around the map and the Umrah journey, not gates/hotels/food.
- **Collapse the 6-color header** into a semantic, consistent control language.
- **Unify route color** — routing line and ritual line should share one semantic "guidance" hue (emerald).
- **Make the map controls work** (fix or remove the custom set; one zoom/compass, not two).
- **Add a completion gate** to step progression and wire `findNextIncompleteIndex` as a "next incomplete" action.
- **Bengali-first pass:** wire `toBengaliNumber` into `formatDistance`/`formatWalkingTime`, add `bn` to `HOTEL_AMENITIES_LABELS`, translate `TouristPlaceInfoPanel`.
- **Accessibility depth:** focus traps, dialog roles on desktop panels, marker keyboard/aria support, `aria-label` on map + controls.
- **Typography:** load a proper Bengali webfont + an Arabic face for duas.

---

## What Should Be Removed

- **Dead config:** `lib/map/styles.ts` (`MAP_STYLES`, `CUSTOM_MAP_STYLE`) — disagrees with the real provider.
- **Dead layer paints:** the unused gate/hotel/user circle paints in `lib/map/layers.ts` (`gateMarkerPaint`, `hotelMarkerPaint`, `userLocationPaint`).
- **Dead React marker components:** `components/map/{GateMarker,HotelMarker,TouristPlaceMarker}.tsx` (MapView uses `markers.ts` factories).
- **Dead store state:** `panelStore.currentSnapPoint`, `hotelStore.nearbyHotels`, the write-mostly `umrahGuideStore.mode` (no UI branches on it).
- **Dead BottomSheet constants:** `SPRING_TENSION`/`SPRING_FRICTION` (the "spring" is a cubic ease).
- **Duplicated code:** `getDirectionFromBearing` (in `useGateProximity` and `useHotelProximity`), the two progress-bar implementations.
- **Barrel omissions:** fix `panels/index.ts` (missing `TouristPlaceInfoPanel`), `hooks/index.ts` (missing `useTouristPlaceProximity`), `utils/index.ts` (missing `bengali-number`) — or delete the unused exports.
- **Unused type/data shells** with no backing data: `types/poi.ts`, `types/navigation.ts` (or implement them — currently aspirational).

_(Do not remove working map behavior, the ritual geometry, the data, or the reduced-motion guards.)_

---

## New Visual Direction

> **Modern Map Experience × Calm Islamic Aesthetic × Premium Travel Guide**

The brief's direction is endorsed: **calm, trustworthy, modern, premium, minimal, warm, spiritual-but-not-decorative, map-and-pilgrim-first.** Three principles govern everything:

1. **The map is the hero.** Chrome recedes; the journey and the pilgrim's position dominate.
2. **One semantic color language.** Emerald = guidance/action/progress; Gold = you/the moment; Gray = upcoming/inactive; Soft-emerald = completed/selected; Blue = info; Red = error. No random hues.
3. **Light, warm, daylight-readable.** A warm-ivory chrome on the light base map is internally coherent and better for outdoor use than the current dark-on-light.

**Honest constraint (surfaced, not hidden):** the brief's "muted map palette" (`#F4F1E8` background, `#DDD9CE` buildings, etc.) requires controlling the _base_ map style. The current base map is a **remote Barikoi style we do not own**. To fully realize the brief's map palette we must **host/proxy our own vector style** (a separate, deliberate decision — see Implementation Plan, Phase 4-opt). Until then, we tune only the **overlay** palette (routes, ritual lines, markers, pilgrim), which is fully owned. This is the correct, non-destructive path.

---

## New Color System

Endorsed palette, refined for the constraints above. Tokens are CSS variables consumed by Tailwind (replacing the dead blue `--primary`). Light is primary; dark is a secondary mode (the class-based infra already exists).

### App tokens

| Token              | Light value                 | Role                                                           | (Dark, optional) |
| ------------------ | --------------------------- | -------------------------------------------------------------- | ---------------- |
| `--background`     | `#FAF8F2` Warm Ivory        | app background                                                 | `#0E1715`        |
| `--surface`        | `#FFFFFF`                   | cards/panels/sheets                                            | `#15201E`        |
| `--surface-muted`  | `#F2EFE6`                   | subtle highlights, table rows                                  | `#1B2724`        |
| `--primary`        | `#0F5C4D` Deep Emerald      | primary CTA, active nav, active step, main route               | `#2EA78C`        |
| `--primary-hover`  | `#167C68` Secondary Emerald | hover, progress, secondary action                              | `#36B89C`        |
| `--primary-soft`   | `#E8F4F0` Soft Emerald      | selected card, active-step bg, info surface                    | `#15302A`        |
| `--text`           | `#17211F` Near Black        | primary text                                                   | `#ECEFED`        |
| `--text-secondary` | `#64716C`                   | supporting text                                                | `#9AA8A3`        |
| `--border`         | `#E3DED2`                   | hairlines                                                      | `#243330`        |
| `--gold`           | `#C9A227` Muted Gold        | **pilgrim marker, milestones, completion moments** (sparingly) | `#D9B53C`        |
| `--sand`           | `#E8D8B8`                   | secondary map accents, decorative                              | `#5A4E33`        |
| `--info`           | `#3B82A0` Guidance Blue     | informational/nav-only states                                  | `#5BA3BE`        |
| `--success`        | `#0F5C4D`                   | = primary (emerald)                                            | —                |
| `--error`          | `#C94B4B`                   | errors/destructive only                                        | `#D96868`        |
| `--ring`           | `#0F5C4D`                   | focus ring                                                     | `#2EA78C`        |

**Semantic rule (must hold everywhere):** Gold is **never** a primary CTA. Blue is **information only**. Red is **error only**. The pilgrim ("you") is the only persistent gold element on the map.

### Map overlay tokens (fully owned today)

| Token                   | Value                  | Role                                     |
| ----------------------- | ---------------------- | ---------------------------------------- |
| `--map-route`           | `#0F5C4D` Deep Emerald | main/active route & ritual active line   |
| `--map-route-completed` | `#9AC7BA`              | completed route/ritual segment (recedes) |
| `--map-route-upcoming`  | `#B8BDB9`              | upcoming/inactive segment                |
| `--map-pilgrim`         | `#C9A227` Muted Gold   | current pilgrim marker                   |
| `--map-landmark`        | `#5D665F`              | neutral landmark pins                    |
| `--map-step-active`     | `#0F5C4D`              | active step marker                       |
| `--map-step-completed`  | `#9AC7BA` (+ check)    | completed step marker                    |
| `--map-step-upcoming`   | `#B8BDB9`              | upcoming step marker                     |

### Base map (target, if/when we host a style)

| Element     | Target    |
| ----------- | --------- |
| Background  | `#F4F1E8` |
| Buildings   | `#DDD9CE` |
| Roads       | `#FFFFFF` |
| Minor roads | `#E8E5DD` |
| Landmarks   | `#5D665F` |

> Note: the current blue routing line `#3b82f6` and the teal ritual lines `#14b8a6`/`#2dd4bf` both migrate to `--map-route` (`#0F5C4D`), unifying the two "route" concepts. The `umrah-pulse` keyframe's hardcoded `rgba(20,184,166,…)` migrates to `--primary`.

---

## Typography System

**Problem:** `app/layout.tsx` loads only `Inter` (`subsets: ["latin"]`). Inter has **no Bengali glyphs**, so all Bengali UI text falls back to OS fonts — inconsistent across devices and often ugly. Arabic duas have no dedicated face either. A Bengali font directory exists in-repo (`Shadhinata 2.0 Font/`) but is **not wired**.

**Recommended pairing:**

- **Latin + UI:** Inter (keep) — clean, neutral, excellent for a calm product.
- **Bengali:** `Hind Siliguri` or `Noto Sans Bengali` (Google Fonts) — paired with Inter for body; legible at small sizes on low-end Androids (critical for the pilgrim audience).
- **Arabic (duas/Quranic):** `Noto Naskh Arabic` (body) or `Amiri` (Quranic emphasis) — properly shaped, balanced against the Latin/Bengali lines.

**Type scale (tokens):** keep Tailwind's scale but enforce hierarchy — Display `text-4xl/5xl`, H1 `text-2xl/3xl`, H2 `text-xl`, Body `text-base` (≥16px on mobile), Small `text-sm`, Caption `text-xs`. Line-height ≥1.5 for instruction text (read while walking). Bengali strings render ~10% larger than Latin at the same size — pair fonts via `font-family` stacks (`"Inter", "Hind Siliguri", sans-serif`) so each script uses its best face.

**Direction:** `<html lang="bn">` (or per-route), preload the Bengali face, and ensure Arabic `dir="rtl"` on dua text.

---

## Spacing System

Currently ad-hoc (`p-4`/`p-6`/`p-8`, `gap-2/4/6`, six different radius values). Adopt Tailwind's default 4px-base scale **as the system** and define semantic wrappers:

- **Radius:** one scale — `--radius-sm 6px`, `--radius 12px` (cards/sheets), `--radius-lg 16px`, `--radius-pill 9999px`. Replace the current `md/lg/2xl/3xl/xl/full` drift.
- **Surface padding:** sheet/panel content `p-4` (mobile) / `p-5` (desktop); cards `p-4`; dense lists `py-2 px-3`.
- **Stack gaps:** tight `gap-2`, default `gap-3`, loose `gap-6`.
- **Touch insets:** min 8px from screen edges; 44px min targets; full safe-area insets on all four sides.

---

## Component Design System

Centralize in `components/ui/` + tokens. Every component consumes tokens — no raw palette in feature code.

- **Button** — fix the silent `asChild` bug (import `Slot`); variants map to semantics: `primary` (`--primary`), `secondary` (`--surface-muted`), `outline` (border), `ghost`, `danger` (`--error`). Remove the pattern of overriding `bg-emerald-600 … border-0` at call sites.
- **Card / Panel** — one shell primitive (replaces the per-panel `bg-slate-900/95…` reinvention). Variants: `elevated`, `overlay` (translucent + blur for map overlays).
- **Badge / Chip** — semantic variants (`info`, `success`, `warning`, `neutral`); replace hand-rolled amenity/category `<span>`s.
- **BottomSheet** — keep mechanics; restyle to tokens; **fix the exit animation**; add pointer/mouse drag; add focus trap + `aria-labelledby`; guard the spring under reduced-motion.
- **Dialog** — for desktop panels (and onboarding): add `role="dialog"`/`aria-modal`/Escape/focus-trap/backdrop.
- **CircuitProgress** — **one** component for the 7 rounds, used identically on map (compact) and sheet (large). States carry **color + icon + label + position** (not color alone).
- **StepIndicator / StepList** — completed = quiet (`--primary-soft` + check), current = dominant (`--primary`), upcoming = muted (`--map-route-upcoming`).
- **MapControl** — one zoom/compass/recenter cluster (44px targets, `aria-label`s), not two.
- **ProgressRing** — single implementation, token colors.

---

## Map Design System

- **One control cluster** (top-right): zoom ±, compass/reset, recenter. Remove the broken custom `MapControls` (or fix the store→map binding). Add `aria-label`s; 44px targets.
- **Overlay palette** migrates to `--map-*` tokens (above). Route and ritual share `--map-route` emerald.
- **Markers:** unify to the emerald/gray/gold semantic set — gates/hotels/tourist places use **category icons in neutral landmark pins** (`--map-landmark`), not 11 random colors; selected = emerald ring; the pilgrim is the only gold element. Add `role="button"` + `tabindex` + `aria-label` + keyboard activation.
- **Base map:** keep the remote Barikoi style for now; **enable attribution**; move the API key to `NEXT_PUBLIC_*` (if it must be public) or proxy server-side. Phase-4-opt: host/proxy a custom muted style to reach the brief's full map palette.
- **Register the progress arcs** (or deliberately remove `createProgressLayerSet`) — decide and document.
- **Map canvas:** add `role="application"` + descriptive `aria-label`.

---

## Tawaf Visualization System

- **One `CircuitProgress`** component, three scales (map HUD = tiny, sheet inline = medium, stepper ring = large), identical colors/icons/logic. Removes the `emerald-400`/`emerald-500` and `teal-400`/`teal-500` drift.
- **State semantics (color + icon + label + position), not color alone:**
  - Completed → `--map-route-completed` (`#9AC7BA`) + ✓ check.
  - Active → `--primary` (`#0F5C4D`) + pulse + "চক্কর N/৭".
  - Upcoming → `--map-route-upcoming` (`#B8BDB9`), hollow.
- **Route color states:** active line `--map-route`, completed `--map-route-completed`, upcoming `--map-route-upcoming` (register the arcs).
- **Pilgrim marker = gold** (`--map-pilgrim`), the only persistent gold on the map; tracer line `--map-route`.
- **Completion moment** (keep, unify): ring flash `--primary → --gold → --primary`; the just-completed dot `round-complete` bounce; `ProgressRing` fill advance; instruction crossfade. One choreography, not three.
- **Flow guard:** `nextStep` should not advance past an incomplete counter step without confirmation; wire `findNextIncompleteIndex` as a "পরবর্তী বাকি ধাপ" action.
- **LandmarkHint:** auto-hide when no relevant anchor is within range (currently always-on during rituals); remember dismissal per session.

---

## Mobile Design Strategy

- **Intentional mobile layouts, not shrunken desktop.** The `sm:` sheet↔panel swap is acceptable, but tune the 640–768px tablet band (narrow the desktop panel, or keep the sheet longer).
- **Touch targets ≥44px everywhere** — `MapControls`, step markers, list rows, `GuideControls` buttons.
- **Safe-area on all four insets** — add the missing top inset to the sheet; add full insets to `TawafGuidePanel` and `UmrahOnboarding`.
- **One-thumb reachability** — primary actions (next step, +/− circuit) in the bottom 60% of the screen; the peek sheet is already well-placed.
- **Sticky, persistent current-step** — the peek state should always show stage + counter + direction + next action, never empty.
- **No accidental dismissal** — gate `dismissOnDragDown` (require a deliberate action) or add a one-tap "reopen guide" affordance.
- **Outdoor readability** — light ivory chrome, high-contrast near-black text, larger instruction text, no thin hairlines that wash out in sunlight.
- **Tested breakpoints:** 320 / 360 / 375 / 390 / 414 / 768 / 1024 / 1440. Add a Playwright Mobile-Chrome flow for the guide.

---

## Animation Strategy

- **Keep (purposeful):** `instruction-crossfade`, `round-complete`, `umrah-pulse`, `pilgrim-bob`, draw animation, ring flash, camera fly-to/ease, `ProgressRing` fill.
- **Fix:** `BottomSheet` exit animation (close should animate out, not pop).
- **Guard:** the `BottomSheet` JS spring under `prefers-reduced-motion` (short-circuit to instant snap).
- **Throttle:** `useDirectionArrows` comet loop — either a CSS-driven opacity sweep (no per-frame `setPaintProperty`) or a low-frequency interval; eliminate the unbounded RAF.
- **Optimize:** switch per-selection marker rebuilds to class-toggle updates.
- **Remove/dedupe:** the duplicate progress-bar implementations; fold into one `ProgressBar` primitive.
- **Principle:** animations communicate _progress_, never decoration; all GPU-friendly (transform/opacity); all reduced-motion-safe.

---

## Implementation Plan

### Progress tracker

- [x] **Phase 1** — Design tokens + color system _(done: semantic emerald/ivory tokens, map overlay tokens, tailwind config, umrah-pulse tokenized; type-check clean, 152 tests pass, build green)_
- [x] **Phase 2** — Global layout + typography _(done: Bengali/Arabic/Inter fonts + lang=bn, ThemeProvider/toggle with no-flash script, global type base + token scrollbars, BottomSheet exit-animation fix + reduced-motion guard + token migration, map-page shell + 6 header toggles unified to primary, info panels + Umrah guide/helper/controls chrome migrated to tokens; primary-CTA contrast fixed; type-check clean, 152 tests pass, build green, light+dark verified via screenshots)_
- [x] **Phase 3** — Homepage _(done: hero + live map preview + HowItWorks + TawafRounds + LandmarkExplorer + ExperiencePreview; Bengali-first; reveal-on-scroll)_
- [x] **Phase 4** — Map UI _(done: env-var API key, attributionControl enabled, custom MapControls wired to live map via MapInstanceContext + 44px targets, overlay palette migrated to MAP_COLORS tokens — route blue→emerald, ritual teal→emerald, user-location→gold, tourist pins→neutral landmark; marker a11y (role/tabindex/aria-label/Enter-Space); dead styles.ts + GateMarker/HotelMarker/TouristPlaceMarker removed; map canvas role=application)_
- [x] **Phase 5** — Tawaf experience _(done: unified CircuitProgress (CircuitDots + CircuitRing) replacing the 3 inconsistent widgets; token-based colors (map-route-completed/primary/map-route-upcoming); nextStep completion gate; goToNextIncomplete action wired as "পরবর্তী বাকি ধাপ" button; LandmarkHint auto-hide when no anchor within range; Bengali leak "takbir"→"তাকবীর" fixed)_
- [x] **Phase 6** — Step-by-step Umrah _(done: formatDistance/formatWalkingTime Bengali-first (digits + units); TouristPlaceInfoPanel fully translated + color drift unified to tokens; GuideStepList visual hierarchy via tokens (completed quiet/primary-soft, current dominant/primary, upcoming muted))_
- [x] **Phase 7** — Mobile responsiveness _(done: UmrahStepList sm:→md: so 640–768px tablets keep the sheet; TawafGuidePanel dvh + safe-area insets; GuideControls buttons bumped to h-8/h-10 targets; jump-to-incomplete button h-10)_
- [x] **Phase 8** — Animations _(done: useDirectionArrows unbounded RAF → throttled 50ms setInterval (~4× less main-thread work); chevron teal→emerald; shared ProgressBar primitive replacing duplicated markup in GuideControls + GuidePeek)_
- [x] **Phase 9** — Accessibility _(done: useFocusTrap hook + applied to BottomSheet, UmrahOnboarding, MistakeAssistant (focus move/constrain/restore); role=dialog + aria-modal + Escape + body-scroll-lock on onboarding/mistake; role=dialog + aria-label on TawafGuidePanel desktop; BottomSheet drag handle Enter/Space cycles snap; map canvas role=application + aria-label)_
- [x] **Phase 10** — Performance optimization _(done: map `move`/`zoom` handlers rAF-coalesced (was ~60 store writes/s); tourist panel images lazy + async decode; baseline markers rebuilt only on selection change)_
- [ ] **Phase 11** — Content/data hygiene _(P2/P3 — not in the original tracker; remaining: tourist-places.ts:1497 id/name mismatch; HotelInfoPanel template-literal bug; bn labels for hotel amenities; Gate/Hotel → LocalizedString; remove dead store fields; fix barrel exports)_

Phased, non-destructive. Each phase ships independently and keeps the app working.

**Phase 1 — Design tokens + color system (P0/P1).** Replace the dead blue `--primary` with the semantic token table above in `globals.css` + `tailwind.config.ts`; add `--map-*` tokens. No component changes yet — this unlocks migration.

**Phase 2 — Global layout + typography (P1/P2).** Wire Bengali + Arabic fonts; set `<html lang>`; restyle `layout.tsx`/`BottomSheet`/panels to the ivory theme; unify radius/spacing; fix the `BottomSheet` exit animation + reduced-motion guard.

**Phase 3 — Homepage (P1).** Redesign `app/page.tsx` around the map + Umrah journey ("Perform Umrah with confidence"); integrate a live/styled map preview into the hero.

**Phase 4 — Map UI (P0/P1).** Fix the `MapControls` no-op (store→map binding) **or** remove it for the single built-in cluster; move the API key to env + enable attribution; migrate the overlay palette to `--map-*`; collapse the 6-color header to semantic controls; marker a11y + class-toggle updates. _(Phase 4-opt: host/proxy a custom muted base style.)_

**Phase 5 — Tawaf experience (P0/P1).** Unify the three round widgets into `CircuitProgress`; register/remove the progress arcs; migrate ritual colors; pilgrim → gold; flow gate on `nextStep`; wire "next incomplete"; `LandmarkHint` auto-hide.

**Phase 6 — Step-by-step Umrah (P1/P2).** Visual hierarchy (current dominant, completed quiet, upcoming muted); persistent peek current-step; Bengali-first formatter pass; `TouristPlaceInfoPanel` translation.

**Phase 7 — Mobile responsiveness (P2).** 44px targets; four-side safe-area; tablet-band tuning; mobile Playwright guide flow.

**Phase 8 — Animations (P2).** Throttle `useDirectionArrows`; dedupe progress bars; verify reduced-motion across all paths.

**Phase 9 — Accessibility (P2).** Focus traps; dialog roles + Escape on desktop panels/onboarding; marker keyboard/aria; map canvas label; drag-handle keyboard support.

**Phase 10 — Performance (P2/P3).** RAF throttle; marker update strategy; image optimization (compress the multi-MB JPEGs, dedupe reused images, lazy-load); `move`-handler batching.

**Phase 11 — Content/data hygiene (P2/P3).** Fix `tourist-places.ts:1497` id/name mismatch; fix `TouristPlaceInfoPanel:223` template-literal bug; add `bn` to hotel amenity labels; `Gate`/`Hotel` → `LocalizedString`; remove dead code/config; fix barrel exports.

---

## Priority Matrix

| Priority | Finding                                                                                                                                                                 | Why                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **P0**   | Hardcoded Barikoi API key in client source (`MapView.tsx:84-85`)                                                                                                        | Security/licensing; ships in bundle                            |
| **P0**   | Custom `MapControls` zoom/compass are no-ops (`MapControls.tsx` + `MapView.tsx:244-305`)                                                                                | Shipped-broken feature; two confusing control sets             |
| **P0**   | `attributionControl: false` on OSM-derived tiles (`MapView.tsx:256`)                                                                                                    | Legal compliance                                               |
| **P0**   | Establish semantic token system (replaces dead blue `--primary`)                                                                                                        | Foundation every visual fix depends on                         |
| **P0**   | Bengali-first regressions: `formatDistance`/`formatWalkingTime` Latin digits+English units; `HOTEL_AMENITIES_LABELS` no `bn`; `tourist-places.ts:1497` id/name mismatch | Violates core product mandate; quick wins                      |
| **P1**   | Unify the 3 inconsistent 7-round widgets into one `CircuitProgress`                                                                                                     | Hero-feature consistency crisis                                |
| **P1**   | Migrate hardcoded colors → tokens; pivot chrome to warm-ivory light theme                                                                                               | Resolves dark-chrome/light-map mismatch; delivers calm/premium |
| **P1**   | Redesign homepage around map + Umrah journey                                                                                                                            | First impression fails the "what is this" test                 |
| **P1**   | Collapse 6-color map header to semantic controls                                                                                                                        | Clearest random-color offender                                 |
| **P1**   | Unify route color (blue `#3b82f6` + teal ritual → emerald `--map-route`)                                                                                                | Two route concepts, two colors                                 |
| **P1**   | Fix `BottomSheet` exit animation (broken at `bottom-sheet.tsx:87-91`)                                                                                                   | Broken core interaction                                        |
| **P1**   | `nextStep` completion gate + wire `findNextIncompleteIndex`                                                                                                             | Progress must not lie                                          |
| **P2**   | Typography: Bengali (`Hind Siliguri`/`Noto Sans Bengali`) + Arabic (`Noto Naskh`/`Amiri`) fonts                                                                         | Bengali relies on OS fallback today                            |
| **P2**   | Accessibility: focus traps, dialog roles/Escape on desktop panels + onboarding, marker keyboard/aria, map canvas label                                                  | Multiple a11y gaps                                             |
| **P2**   | Touch targets ≥44px; four-side safe-area insets                                                                                                                         | Mobile/outdoor usability                                       |
| **P2**   | Sheet dismissal behavior (no accidental fling-away); `LandmarkHint` auto-hide                                                                                           | Fragile core UX                                                |
| **P2**   | Performance: throttle `useDirectionArrows` RAF; marker class-toggle updates                                                                                             | Continuous main-thread work on the hero screen                 |
| **P2**   | Remove dead code (`styles.ts`, layer paints, React markers, dead store fields, dup code)                                                                                | Maintainability                                                |
| **P2**   | Image optimization (compress 4 MB JPEGs, dedupe, lazy-load)                                                                                                             | Mobile bandwidth/perf                                          |
| **P3**   | `TouristPlaceInfoPanel:223` template-literal bug; `Button` `asChild`/`Slot` wiring                                                                                      | Latent bugs, low blast radius                                  |
| **P3**   | Register or remove unused ritual progress arcs (`createProgressLayerSet`)                                                                                               | Decide and document                                            |
| **P3**   | Optional dark theme (secondary mode; infra exists)                                                                                                                      | Nice-to-have                                                   |
| **P3**   | Remaining plan work: T4 (themed heading user position), T7 (contextual landmarks polish), U6 (dua audio assets)                                                         | Feature completion                                             |

---

## Design-Principle Check (target state)

```
                 UMRAH JOURNEY      →  one emerald thread end-to-end
                       ↓
                 CURRENT STEP       →  visually dominant, persistent in peek
                       ↓
                  YOUR LOCATION     →  gold pilgrim marker, the only gold on the map
                       ↓
                  WHAT TO DO        →  instruction card, crossfade, aria-live
                       ↓
                  WHAT'S NEXT       →  "পরবর্তী বাকি ধাপ", gated progression
```

The pilgrim should never have to ask "what do I do now?" The hierarchy above must be answerable at a glance, in daylight, one-handed, on a 360px screen.

**Final quality bar:** Calm · Clear · Trustworthy · Premium · Pilgrim-focused · Map-first · Mobile-first · Accessible · Fast.

---

_This document is the analysis deliverable. No source changes were made. Implementation proceeds phase-by-phase per the plan above, preserving all working functionality._
