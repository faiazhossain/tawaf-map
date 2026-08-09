# Tawaf Navigation Experience — Implementation Plan

A phase-by-phase plan to turn the existing "step-list panel on a map" into a
**synchronized, mobile-first Tawaf navigation experience**.

This document builds on top of the completed Umrah work (Phases U1-U6 in
`UMRAH_GUIDE_PLAN.md`). The content, the step engine, and the schematic map
overlay already work. This plan is only about the **guided navigation feel**:
map + UI + animation moving together as one journey.

> Read the section **"What you will SEE on the map"** first. It is written in
> plain words so the end result is clear before any code is written.

---

## 0. The one rule that decides every choice

Everything must move together. When the pilgrim finishes one circuit (round),
this whole chain should feel like one tap:

```
tap "+1 circuit"
   |
   +--> progress ring fills one step
   +--> that arc of the Kaaba ring turns green (completed)
   +--> the next arc lights up teal (active)
   +--> direction arrows move to the new active arc
   +--> instruction text crossfades to the new circuit tip
   +--> a small checkmark + soft pulse confirms the round
```

If any link in that chain is missing or out of sync, the experience is broken.
Every phase below exists to make this chain feel natural.

---

## 1. What already exists (do NOT rebuild)

These are working and should be reused or only lightly extended:

| Area                                                         | File(s)                                                     | Status                                                              |
| ------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| Step engine (resolve, complete, counter)                     | `lib/data/umrah/sequence.ts`, `lib/data/umrah/steps.ts`     | Done, pure, tested                                                  |
| Guide state (currentIndex, counters, completed, mode)        | `lib/store/umrahGuideStore.ts`                              | Done, persisted                                                     |
| Ritual anchors + coordinates                                 | `lib/data/umrah/anchors.ts`                                 | Done (12 anchors)                                                   |
| Schematic ritual overlay geometry                            | `lib/map/umrah-overlay.ts`                                  | Done (Kaaba, Hateem, tawaf ring ellipse, Sa'i corridor, green zone) |
| Step markers (completed/active/upcoming + pulse)             | `lib/map/markers.ts` (`createUmrahStepMarkerElement`)       | Done                                                                |
| Reusable bottom sheet (drag, snap, safe-area, RAF spring)    | `components/ui/bottom-sheet.tsx`                            | Done, good                                                          |
| Geolocation (heading, speed, accuracy, permission)           | `lib/hooks/useGeolocation.ts`, `lib/store/locationStore.ts` | Done                                                                |
| Camera state + flyTo/fitBounds                               | `lib/store/mapStore.ts`                                     | Partial (no "user took control" logic)                              |
| Bengali-first content + teal/cyan/emerald on slate-900 theme | `app/globals.css`, `tailwind.config.ts`                     | Done, keep it                                                       |

### Do-not-break list

- Existing routes: `/` and `/map`.
- Gate / hotel / tourist-place markers and panels.
- Miqat overview map.
- Mistake assistant, dua audio, lost-group helper, wheelchair tips.
- Persisted Umrah progress (zustand `persist`).
- Bengali-first strings. **All new visible text must be native Bangla first**,
  English second, Arabic `dir="rtl"` where relevant. Match `steps.ts` quality.

---

## 2. What you will SEE on the map (plain words)

This is the full picture after all phases are done. Imagine holding the phone
and starting the Umrah guide.

### The base

- The normal Barikoi street map is there.
- When the Umrah guide is open, a calm **schematic drawing** appears on top of
  the Kaaba area (because satellite photos inside the Haram are blurry, the app
  draws the holy sites itself).

### The Kaaba and its surroundings (during Tawaf)

- A small dark/gold rectangle = the **Kaaba**, dead center.
- A thin crescent on its north side = **Hijr Ismail (Hateem)**, shown faintly so
  the pilgrim knows to walk _around_ it, not through it.
- A ring/oval around the Kaaba = the **Tawaf path**. This ring is no longer one
  plain line. It is split into **7 arcs** (one per circuit).

### The 7 arcs change color as you progress

- Arcs you have **already finished** = calm green, thin.
- The arc you are on **right now** = bright teal, a little thicker, with small
  **arrow chevrons** that gently flow counter-clockwise to show the walking
  direction.
- Arcs still **to come** = faint grey dashed, low opacity.

So at a glance the pilgrim sees: "I have done 3 rounds (green), I am on round 4
(teal, glowing, arrows), 3 rounds left (faint)."

### Landmarks appear only when useful

- **Black Stone (start point)** glows when a circuit starts there.
- **Yemeni Corner** lights up as the active arc passes it.
- When the step changes to "2 rak'ahs", **Maqam Ibrahim** and **Zamzam** appear.
- When the step changes to **Sa'i**, the camera slides east to the
  **Safa-Marwa corridor**: a cyan path with 7 lap segments (same green/teal/grey
  coloring), the **green-marker zone** highlighted, and arrows pointing
  Safa-to-Marwa.
- Secondary spots (Multazam, Mizab) stay hidden until tapped in "more landmarks".

### The user position dot

- A teal dot with a soft pulse and a small **heading triangle** if the phone
  gives heading data.
- If GPS is off or unreliable inside the Haram, the dot is **not** shown. The
  app never fakes a position. Progress comes from the circuit counter instead.

### The camera behaves politely

- When Tawaf starts, the map smoothly flies to the Kaaba and frames the ring.
- When a circuit is completed, the camera **stays put** (the ring updates in
  place; we do not spin or jump every round).
- The camera only moves on a real **step change** (Tawaf -> Pray -> Sa'i).
- If the pilgrim manually pans or zooms, the app **stops fighting them**. A
  small **"Recenter"** button (a target icon) appears. Tapping it returns to the
  current step's view.

### The bottom sheet (mobile)

Three states, drag between them:

- **Peek**: one line. "Round 4 of 7 - Walk counter-clockwise." plus a tiny
  progress bar. Most of the map stays visible.
- **Normal**: round + step, the current short instruction, the +1 circuit
  control, a Continue button.
- **Expanded**: full what-to-do, rules, duas, gate suggestion, landmark info.

### Desktop

Map stays large on the left; a slim guided panel sits on the right. Not a giant
dashboard.

---

## 3. Before -> After problem table

| #   | Current problem                                                | Why it hurts                              | Fix                                                     | Main files                                            |
| --- | -------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Panel shows the full step list + long detail at once           | Pilgrim cannot see "what now" in 1 second | Hero "one instruction" UI, list moved to expanded state | `UmrahStepList.tsx` (split into new guide components) |
| 2   | Tawaf ring is one static line                                  | No sense of 7-circuit progress            | Split ellipse into 7 arcs; color by counter             | `umrah-overlay.ts`, `MapView.tsx`                     |
| 3   | No direction indication                                        | Pilgrim unsure which way to walk          | Counter-clockwise chevrons on active arc                | `umrah-overlay.ts` (symbol layer)                     |
| 4   | User dot is a flat blue blob, no heading                       | Not premium, off-theme                    | Teal dot + pulse + heading triangle; honest fallback    | `markers.ts`, `MapView.tsx`                           |
| 5   | Camera flyTo fires on every counter change and fights the user | Nauseating, ignores manual pan/zoom       | Camera intelligence + Recenter button                   | new `useTawafCamera` hook, `mapStore.ts`              |
| 6   | Completing a circuit only changes a number                     | Map does not react                        | Round-completion micro-animation + arc transition       | `umrah-overlay.ts`, new animation utils               |
| 7   | Landmarks all shown or all hidden                              | Either cluttered or unhelpful             | Contextual emphasis by current arc/step                 | `MapView.tsx`, new landmark logic                     |
| 8   | Instruction text swaps abruptly                                | Feels cheap                               | Subtle crossfade on change                              | guide UI components                                   |

---

## 4. Design and animation language (set once, use everywhere)

### Motion timing (respect `prefers-reduced-motion`)

- Micro (buttons, marker state): 150-250 ms.
- UI (cards, step change, bottom sheet, instruction crossfade): 250-450 ms.
- Map (camera, route recolor): 500-1000 ms.

### Colors (already in the theme, keep them)

- Active / brand: teal-500 `#14b8a6`, teal-400 `#2dd4bf`.
- Completed: emerald-500 `#10b981`, emerald-400 `#34d399`.
- Future / muted: slate-500/600 `#64748b` / `#475569`, dashed.
- Surface: slate-900 `#0f172a`, slate-800 borders.
- Never use color alone: always pair with an icon or text (check mark, number,
  label).

### Status is never color-only

Completed arc = green **+** a faint check at its start node. Active arc = teal
**+** arrows **+** pulse. Future arc = grey **+** dashed. This keeps it usable
for color-blind users.

### Reduced motion

Extend the existing block in `app/globals.css` so that when
`prefers-reduced-motion: reduce` is on: no pulse, no arrow flow, instant camera,
instant sheet snap. Map recolor still happens (it is information, not decoration)
but without animated transitions.

### Reuse, do not add a new animation library

Use CSS transitions/keyframes (in `globals.css` / `tailwind.config.ts`) and
MapLibre native `easeTo`/`flyTo`. The project already has `umrah-pulse` and
`tailwindcss-animate`. No new dependency.

---

## 5. Phases

Each phase is independently shippable. Commit with conventional commits
(`feat: ...`, `fix: ...`). Keep commits atomic.

Legend:

- **Reuse**: existing code to lean on.
- **Change/Edit**: files to touch.
- **Acceptance**: how to know the phase is done.

---

### Phase T1 - Synchronized navigation state + camera intelligence — DONE

**Goal**: one source of truth for "are we navigating, did the user take manual
control, where should the camera be" so phases T2-T5 can react to it.

**Reuse**: `umrahGuideStore` (counters, currentIndex), `mapStore`, `locationStore`.

**Change**:

- `lib/store/mapStore.ts`: add `userTookControl: boolean` and a
  `markUserControl()` action; reset on programmatic camera moves.
- New `lib/hooks/useTawafCamera.ts`: a controller that decides, given the current
  step + counter, whether to move the camera. Rules:
  - On **step change** (tawaf -> pray -> sai): fly to the new area (unless
    `userTookControl` is true and less than N seconds old, then show Recenter).
  - On **counter change** within the same step: do NOT move the camera.
  - Expose `recenter()` to clear `userTookControl` and re-frame.
- `components/map/MapView.tsx`: wire map `dragstart`/`zoomstart` (when caused by
  the user) to `markUserControl()`. Replace the current "flyTo on every
  currentIndex change" effect with calls through `useTawafCamera`.
- New small component `components/map/RecenterButton.tsx`: a target-icon button,
  shown only when `userTookControl === true` and a guide step is active.
  44x44 px touch target.

**Acceptance**:

- Panning/zooming the map does not get yanked back.
- Recenter button appears after manual control and returns to the active step.
- Changing circuit (counter) never moves the camera.

---

### Phase T2 - Active / completed / future route (the 7 arcs) — DONE, then revised

> Original T2 split the ring into 7 arcs as a progress meter. **Revised after
> feedback**: a tawaf circuit is a FULL round, not 1/7. So the 7-arc meter was
> removed; the map now shows a single ritual ring (tawaf) + corridor (sa'i) as
> the path, and on each circuit completed (+1) a built-in SVG pilgrim walks the
> ENTIRE circle counter-clockwise (tawaf) / the ENTIRE corridor with alternating
> direction (sa'i) while a bright stroke draws it in. Round progress stays in the
> panel counter (X/7). Calm between taps; respects `prefers-reduced-motion`.
> Files: `useRitualDrawAnimation.ts`, `createPilgrimMarkerElement`, `globals.css`
> (`pilgrim-bob`), `umrah-overlay.ts` (`getTawafCircleCoords`/`getSaiCorridorCoords`).

**Goal**: the Tawaf ring and the Sa'i corridor show progress in three states.

**Reuse**: `ellipseRingCoordinates`, `circleCoordinates` in `umrah-overlay.ts`;
the counter from `umrahGuideStore`.

**Change**:

- `lib/map/umrah-overlay.ts`:
  - New pure helper `splitEllipseArcs(center, rx, ry, segments=7)` returning an
    array of 7 LineString arcs. Pure function -> easy to unit test.
  - New function `buildTawafProgressGeoJSON(current: number, max: 7)` that tags
    each arc with `state: "completed" | "active" | "future"` based on the
    counter. Counter-clockwise ordering (Kaaba on the left).
  - Parallel `buildSaiProgressGeoJSON(current, max=7)` for the Safa-Marwa path
    (7 laps along the corridor).
  - Keep the existing static overlay (Kaaba footprint, Hateem) as-is.
- New layer configs for the three states (or one layer using data-driven
  `case` paint expressions keyed on the `state` property):
  - completed: emerald, thin, solid.
  - active: teal, thicker.
  - future: slate, dashed, low opacity.
- `components/map/MapView.tsx`: when `showUmrah` and the active step is tawaf or
  sai, swap the single ring layer for the progress layers; update their GeoJSON
  source whenever `counters[stepId]` changes.
- Add unit tests in `tests/unit/` for `splitEllipseArcs` and
  `buildTawafProgressGeoJSON` (state tagging + ordering).

**Acceptance**:

- Tapping +1 makes one arc go green and the next go teal.
- Refreshing the page restores the correct green/teal/grey split from persisted
  counters.
- Sa'i corridor shows the same 3-state behavior.

---

### Phase T3 - Direction arrows on the active path — DONE

> Implemented as a `symbol` chevron layer on the single active ritual path
> (post-T2-revision). A teal double-chevron glyph is rotated per-point to the
> walking bearing (`icon-rotation-alignment: map`), and a calm "comet" opacity
> wave sweeps along the path in the walking direction (CCW for Tawaf; Safa→Marwa
> or Marwa→Safa by Sa'i lap parity). `prefers-reduced-motion` shows static
> chevrons (no wave) - direction still reads from the rotated glyphs.
> Files: `lib/map/umrah-overlay.ts` (`bearing`, `buildDirectionArrowsGeoJSON`,
> `directionArrowsLayer`, ids), `lib/hooks/useDirectionArrows.ts`,
> `components/map/MapView.tsx`, `tests/unit/umrah-tawaf-overlay.test.ts`.

**Goal**: small chevrons along the active arc that gently flow in the walking
direction (counter-clockwise for Tawaf, Safa->Marwa for Sa'i).

**Change**:

- `lib/map/umrah-overlay.ts`: build a GeoJSON of point features (chevron
  placements) along the active arc only, each tagged with an offset for a
  staggered fade animation.
- Add a MapLibre `symbol` layer using an inline SVG chevron icon
  (`line-offset`/`icon-rotate` to align with path direction). Animate by cycling
  `icon-opacity` per offset group using a CSS-free, data-driven step expression,
  OR a slow `line-dasharray` shift on a thin overlay line (cheaper).
- Gate the animation on `prefers-reduced-motion` (static chevrons if reduced).
- Arrows appear ONLY on the active arc, not the whole ring.

**Acceptance**:

- Direction is obvious without the map moving.
- Arrows stop when reduced motion is on.
- No continuous animation on completed/future arcs.

---

### Phase T4 - Themed user position with heading + honest fallback

**Goal**: a premium, on-theme "you are here" dot that never lies about position.

**Reuse**: `locationStore` (latitude, longitude, heading, accuracy, permission).

**Change**:

- `lib/map/markers.ts` -> `createUserLocationElement`:
  - Teal dot (not blue) with a soft pulse ring.
  - A small heading triangle when `heading != null`.
  - Subtler than the step markers so it never competes with the Kaaba.
- `components/map/MapView.tsx`:
  - Only render the dot when `permission === "granted"` AND accuracy is good
    enough. If inside-Haram GPS is unreliable (large accuracy), show a faint
    dot or omit it; rely on the circuit counter.
  - Animate position changes with marker `setLngLat` + a short CSS transition.
- Keep the existing accuracy circle layer but make it teal and low-opacity.

**Acceptance**:

- Dot is clearly "me", does not look like a step marker.
- No fabricated position when GPS is off.
- Heading triangle points the right way when walking outdoors.

---

### Phase T5 - Guided instruction UI + bottom sheet states — DONE

> Implemented by lightly extending `BottomSheet` to expose snap state
> (`snapIndex`/`snapToIndex` via `useBottomSheet`), then splitting the old monolithic
> `UmrahStepList` into focused `components/umrah/guide/*` pieces. Mobile sheet
> (`TawafGuideSheet`): three snaps [0.12, 0.42, 0.92] = peek / normal / expanded,
> no backdrop (map stays bright); peek = `GuidePeek` one-liner, normal =
> `InstructionCard` hero + `CircuitControl` + Continue/Expand, expanded =
> `GuideControls` + `RoundDots` + `GuideStepList` + `GuideExpanded` (full detail).
> Desktop (`TawafGuidePanel`): slim right-hand scroll panel with hero + counter +
> dots + step list + full detail. `InstructionCard` picks `perRoundTips[current-1]`
> for counter steps else `summary`, with a `tailwindcss-animate` fade+slide crossfade
> keyed on step/counter. `UmrahStepList` is now a thin composer (mobile sheet +
> desktop panel + `MistakeAssistant`); `app/map/page.tsx` unchanged. Bengali-first
> (toBengaliNumber everywhere), teal theme, all helper components preserved
> (FlightIhram, Wheelchair, Pragmatic, LostGroup, DuaAudio, GateRec, Offline).
> Files: `components/ui/bottom-sheet.tsx`, `components/umrah/guide/*` (stage-label,
> ProgressRing, RoundDots, CircuitControl, InstructionCard, GuidePeek,
> GuideStepList, GuideControls, GuideExpanded, TawafGuideSheet, TawafGuidePanel),
> `components/umrah/UmrahStepList.tsx`, `tests/unit/umrah-guide-instruction.test.tsx`.

**Goal**: answer "what do I do right now?" in under 2 seconds. This is the
biggest UI change and the one most visible to users.

**Reuse**: `BottomSheet` component (drag, snap, safe-area), `ProgressRing`,
`umrahGuideStore` selectors.

**Change** (split `UmrahStepList.tsx` into focused pieces; do not put everything
in one giant file):

- New `components/umrah/guide/TawafGuideSheet.tsx` (mobile) and
  `TawafGuidePanel.tsx` (desktop) orchestrators.
- New `components/umrah/guide/InstructionCard.tsx`: the hero "one instruction".
  Shows: stage label, short Bangla instruction (from `perRoundTips[current]` for
  counter steps, else `summary`), and the round/step chips. Crossfades on change.
- New `components/umrah/guide/RoundDots.tsx`: the 7-dot round indicator
  (done = filled green + check, active = teal + pulse, future = hollow grey).
  Reused for both Tawaf (7 circuits) and Sa'i (7 laps).
- New `components/umrah/guide/GuidePeek.tsx`: the collapsed one-liner
  ("Round 4 of 7 - Walk counter-clockwise" + mini progress bar).
- New `components/umrah/guide/CircuitControl.tsx`: the +/- counter with the
  progress ring, lifted from the current `StepDetail`.
- Bottom sheet snap points: peek `[0.12, 0.42, 0.92]`; default 1 (normal).
  - Peek: `GuidePeek`.
  - Normal: `InstructionCard` + `CircuitControl` + Continue.
  - Expanded: the existing detail (what-to-do, rules, duas, gate, mistakes) +
    `RoundDots`.
- Keep the existing helper components untouched: `MistakeAssistant`,
  `DuaAudioPlayer`, `LostGroupHelper`, `WheelchairTips`, `PragmaticReminders`,
  `FlightIhramCard`, `OfflineBadge`, `GateRecommendationCard`.
- `app/map/page.tsx`: swap `UmrahStepList` usage for the new orchestrators.
  Keep `UmrahStepList` available (or refactor it to compose the new pieces) so
  nothing else breaks.

**Acceptance**:

- At 360px width: no horizontal scroll, no clipped buttons, peek leaves most of
  the map visible.
- The current instruction is readable in <2 seconds.
- Expanded state still shows all the existing content.

---

### Phase T6 - Synchronized completion animations

**Goal**: finishing a circuit and finishing a step both feel like one event.

**Change**:

- `app/globals.css` / `tailwind.config.ts`: add keyframes
  - `round-complete`: a brief scale-up + check draw + settle (~500 ms).
  - `instruction-crossfade`: opacity + slight Y slide (~300 ms).
- `components/umrah/guide/RoundDots.tsx` + `InstructionCard.tsx`: trigger
  `round-complete` when a counter increments, `instruction-crossfade` when the
  instruction text changes (key the element on the counter/step id so React
  remounts and replays the animation).
- `components/map/MapView.tsx` / `umrah-overlay.ts`: when a counter changes,
  briefly flash the newly completed arc (teal -> emerald transition) so the map
  visibly reacts in sync with the UI.
- Step change (not circuit): a calmer transition - camera move + instruction
  crossfade + active step marker swap.
- All animations respect `prefers-reduced-motion`.

**Acceptance**:

- Tapping +1 circuit produces a visible, connected reaction across UI and map.
- Step transitions feel calm (no confetti, no spinning).

---

### Phase T7 - Contextual landmarks, recenter, off-route, polish, tests

**Goal**: landmarks appear when relevant; graceful edge cases; full a11y and
test coverage.

**Change**:

- Landmark contextual visibility (`components/map/MapView.tsx` +
  `lib/map/markers.ts`):
  - Determine "approaching" by current arc index (e.g. arc 6/7 approaching the
    Yemeni Corner or Black Stone). Emphasize that anchor (scale + pulse).
  - Show a compact contextual card (new `components/umrah/guide/LandmarkHint.tsx`)
    that the user can dismiss.
- Off-route (only if GPS is reliable): a gentle non-alarming notice +
  "Recenter". No red panic UI.
- Loading: lightweight map loading indicator / skeleton (avoid blank screen).
- Orientation: ensure portrait and landscape both work; preserve state on
  rotate (it already is, just verify layout).
- Accessibility:
  - `aria-live="polite"` region announcing the current instruction + round for
    screen readers.
  - Keyboard operability for the desktop panel.
  - All status conveyed with icon + text, never color alone.
- Tests:
  - Unit: arc splitting, progress tagging, camera-control rules.
  - E2E (`tests/e2e/`): start guide -> reach Tawaf -> +1 circuit -> assert arc
    recolor + instruction change -> complete 7 -> assert step advances.

**Acceptance**: matches the full acceptance checklist in section 6.

---

## 6. Acceptance checklist

UX

- [ ] First-time user understands what to do immediately.
- [ ] Current round (of 7) is obvious.
- [ ] Current step is obvious.
- [ ] Next action is obvious.
- [ ] Map context is obvious.

Map

- [ ] Active route is obvious; completed is distinct; future is subdued.
- [ ] Direction is clear from arrows.
- [ ] Landmarks are contextual, not cluttered.
- [ ] Camera transitions are smooth and never fight the user.
- [ ] Recenter button works.

Animation

- [ ] Completing a circuit visibly updates the map.
- [ ] Progress animation matches the step transition.
- [ ] Animations are subtle and respect reduced motion.

Mobile

- [ ] Excellent at 320 / 360 / 375 / 390 / 412 / 430 px.
- [ ] No horizontal overflow, no clipped controls.
- [ ] Bottom sheet peek / normal / expanded all work; safe areas respected.
- [ ] Landscape works.

Performance

- [ ] No continuous animation except the small active-arc arrow flow.
- [ ] Map stays responsive; no large React re-renders.
- [ ] Memoize selector results; keep stable references (the codebase already
      follows this pattern - keep it).

Accessibility

- [ ] Reduced motion supported.
- [ ] Keyboard usable on desktop.
- [ ] Screen-reader announcements present.
- [ ] Color is never the only status signal.

---

## 7. Out of scope / open decisions

- Do NOT replace MapLibre or the Barikoi basemap.
- Do NOT change the step content or the religious rulings.
- Real-time indoor positioning is not assumed. Progress is driven by the manual
  circuit counter (the existing, honest model). GPS only adds a "you are here"
  dot when it is reliable.
- Coordinates of anchors remain approximate (already documented in `anchors.ts`).
  The schematic overlay is the source of visual truth, not the satellite photo.
- Decision to make early: should the 7 arcs be equal slices, or weighted by
  real walking distance between landmarks? Equal slices are simpler and clearer
  for a glanceable UI; recommended for v1, weighted later if desired.

---

## 8. Suggested order to implement

T1 (state + camera) -> T2 (7 arcs) -> T3 (arrows) -> T5 (guide UI, the big one)
-> T6 (synced animations) -> T4 (user dot) -> T7 (landmarks, polish, tests).

T1 and T2 unblock everything else. T5 is the largest single piece of work;
doing it after the map (T2/T3) means the UI can react to real map state.
