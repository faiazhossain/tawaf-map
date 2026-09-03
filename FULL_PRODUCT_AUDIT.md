# Full Product Audit — TawafMap (project-tawaf)

**Audit date:** 2026-08-27 · **Codebase state:** `main` @ a650de3 (98 commits) · **Version:** 0.1.2
**Product:** Bengali-first Umrah/Hajj navigation web app (MapLibre + three.js + Next.js 15 App Router) for tawaf.barikoimaps.com
**Deployment reality:** manual Docker build → Docker Hub (`rilusmahmud/tawaf-map:latest`) → `docker compose pull` on a single host behind nginx.

Confidence labels used throughout: **Confirmed** (directly observed in code/config), **Likely** (strong evidence, needs runtime confirmation), **Potential** (requires runtime/production testing).

---

## Executive Summary

TawafMap is a **well-crafted product wrapped in an unfinished production envelope**. The engineering inside the app is frequently excellent: strict TypeScript with zero suppressions, a genuinely disciplined three.js↔MapLibre integration, unit tests that assert real geo-math and gesture physics instead of smoke-snapshots, Bengali-first content end-to-end with centralized numeral formatting, focus traps and live regions designed once and reused, and honest in-code annotations of known trade-offs (the team's own audit doc already flags the hardcoded key problem — it simply was never fixed).

The launch-stopping problems are concentrated at the seams between the app and the world:

1. **The production deployment pipeline is broken today** — the Dockerfile hard-fails on a `public/tiles/gates.pmtiles` artifact that was deleted from the codebase three commits of refactoring ago and can no longer be produced by the documented build step.
2. **A live Barikoi API key sits as a hardcoded fallback in the client bundle**, and it is the _same_ key the server uses for paid routing; the previously rotated-out key is also recoverable from git history.
3. **Developer QA harnesses ship ungated to pilgrims**: one tap on a green "টেস্ট লোকেশন" button (or anyone's crafted link) silently overrides a visitor's GPS _persistently across sessions_, or swaps Makkah datasets for fake ones.
4. **Every failure mode that matters is silent**: no map error handler (style outage = permanent blank canvas), no React error boundaries anywhere (crash = English default screen), no error tracking, no health endpoint that checks anything real, no CI running tests or builds.
5. **First-run integrity gap**: deny location once and the entire advertised "আমার কাছে" feature disappears without explanation.

None of these require re-architecture. Each has a fix measured in hours-to-days. That is exactly why the verdict below is not "keep building" but "stop and close these specific holes before real pilgrims arrive."

---

## Overall Score

| Area                  | Score | Basis                                                                                                                                             |
| --------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product               |    62 | Strong core loops and craft; broken first-run failure path, missing completion/settings/basics                                                    |
| UI/UX                 |    70 | Cohesive bn-first design system, real dialogs/sheets; English leaks, dead-end states, native confirm()                                            |
| Frontend              |    72 | Strict TS, exemplary lazy-loading and marker discipline; no error boundaries, render-phase store writes, persist-versioning absent                |
| Backend/API           |    68 | Single route done mostly right (validation, timeout, NoRoute semantics); zero rate limiting, info-leaky errors                                    |
| Database (data layer) |    50 | N/A architecture — no DB; scored on bundled data quality: 330 KB raw TS in bundle, 16 MB unoptimized assets, 2 broken refs, no freshness metadata |
| Security              |    38 | Live key in bundle, secrets tracked in git, no rate limit, stale vulnerable Next; good SSRF-proof validation                                      |
| Performance           |    45 | ~1 MB preload TTFs, GitHub-raw GLB megapipe, uncompressed-weight data bundles; good hysteresis/idle-awareness under it                            |
| Reliability           |    42 | Silent failure modes everywhere; strong reroute-loop protection and geolocation fallback engineering beneath                                      |
| Testing               |    65 | Unusually high unit quality; e2e network-dependent, never run by CI; high-risk modules untested                                                   |
| DevOps                |    30 | Broken Dockerfile guard, port-drifted nginx conf, mutable :latest deploys, cosmetic rollback story                                                |
| Accessibility         |    68 | Above-average infra (traps/live regions/marker factory); two confirmed contrast failures, missing lang="ar", radio-semantics gaps                 |
| SEO                   |    25 | One thin metadata block; no robots/sitemap/canonical/OG/PWA/structured data; healthy heading tree only                                            |
| Localization          |    80 | Bengali-first execution is deep and consistent; "NE দিকে", Beta pill, English aria-labels, missing lang="ar"                                      |
| Documentation         |    55 | Excellent plan docs & inline comments; runbook contains a site-killing bug; CONTRIBUTING pnpm-era drift; env examples misleading                  |
| Operations            |    25 | No observability, no health signal, no rollback procedure, version unknown ("what's in prod?" unanswerable)                                       |

---

## Launch Decision

### 🔴 NOT READY

Three independently disqualifying issues (all Confirmed):

1. **OPS-001** — The documented release pipeline cannot ship current `main`: `docker build` dies at a guard requiring an artifact (`public/tiles/gates.pmtiles`) that no longer exists anywhere and whose producing step was removed. The next deploy attempt fails while everyone believes the procedure works. _(This alone means launch readiness is undefined until the chain is proven once end-to-end.)_
2. **SEC-001** — A live credential that also powers the paid routing API ships in every JS bundle, with its predecessor recoverable from git history. Extraction scripts burn quota mid-Umrah-season → provider suspension → total outage for all users.
3. **DEV-001** — Ungated dev harnesses can silently fabricate a pilgrim's location and persist the override via localStorage, or teleport all nearby data to Dhaka. In a product whose core promise is "you are here relative to the Haram," this is a trust/integrity hazard, not a novelty bug.

Secondary blockers that become user-visible during any outage (**REL-001** blank-map failure mode, **FE-001** crash screen, **OBS-001** zero monitoring) complete the picture: today nobody would even know production was broken except via complaints.

**Path to 🟡 CONDITIONAL:** fixes OPS-001 → SEC-001 → DEV-001 → OPS-002/003 (~3–4 focused days).
**Path to 🚀 READY:** add REL-001, FE-001, SEC-002, PERF-001, UX-001/002/003, OBS-001 (~1–2 weeks).

---

## Critical Findings

| #   | Finding                                                                                                                                                                                 | Confidence          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| C1  | Release chain broken at Docker gate (guard requires deleted `gates.pmtiles`) — next deploy attempt fails outright                                                                       | Confirmed           |
| C2  | Live Barikoi API key hardcoded in client bundle (same value as server routing key); previous key recoverable from git history (`67f516e`, `b87e0b2`)                                    | Confirmed           |
| C3  | Dev/QA harnesses (`gps-sim` navigator monkey-patch persisted to localStorage; `demo-world` dataset teleportation; always-rendered DebugLocationPanel/GpsSimBadge) ungated in production | Confirmed           |
| C4  | Basemap style/tile outage renders a permanently blank canvas — no `map.on("error")`, no watchdog, no retry; everything gates on `mapLoaded` which never fires                           | Confirmed (absence) |
| C5  | Zero runtime observability: no error tracking, no analytics, no health endpoint beyond process liveness; container stays "healthy" when routing upstream/style CDN/key are all failing  | Confirmed           |
| C6  | Nothing enforces quality before prod: the only workflow is an LLM review bot; lint/type-check/tests/build run nowhere outside optional local hooks                                      | Confirmed           |

---

## P0 Issues

### OPS-001 — Production Docker build is currently broken out of the box

- **Category:** DevOps · **Severity:** P0 · **Likelihood:** certain on next deploy · **Risk:** launch blocker
- **Evidence:** `Dockerfile:40-44` runs `test -f public/tiles/gates.pmtiles || exit 1`; `public/tiles/` does not exist on disk, was never committed, and `.gitignore` excludes it. Commit `303e6bd` removed every consumer; `scripts/gates/build-gates.mjs:9` states explicitly nobody reads PMTiles anymore and produces only `lib/data/gates-osm.generated.ts`. (Confirmed personally: file absent, zero `pmtiles` imports repo-wide.)
- **Impact:** Anyone following `npm run build && docker build` per docs gets an instant failure; whoever shipped `:latest` last did so pre-refactor or hand-crafted a dummy file. Institutional knowledge trap.
- **Fix:** Delete the pmtiles half of the guard (and arguably the generated-TS half too, since it's committed). Rehearse one clean-clone → image → deploy cycle. Also remove `build:gates` from the default `build` script or make it cache-tolerant. **Effort:** S. **Priority:** Immediate.

### SEC-001 — Live API key in client bundle; both current and previous keys compromised-by-design

- **Category:** Security · **Severity:** P0 · **Likelihood:** high once public/launch traffic · **Risk:** financial loss + full outage
- **Evidence:** `components/map/MapView.tsx:152` — `const BARIKOI_API_KEY = process.env.NEXT_PUBLIC_BARIKOI_API_KEY ?? "MjY0NDpHRUswODE3R1VV";` embedded into style URL (:153). Same literal is the server-only `BARIKOI_API_KEY` in `.env.local` powering `/api/directions`. History: `67f516e` rotated key `NDE2NzpVNzkyTE5UMUoy`→current; both remain in git objects. The team's own `docs/UMRAH_UI_UX_AUDIT.md` flagged this previously.
- **Impact:** Anyone extracts both style+route keys from the shipped JS and calls Barikoi directly, bypassing the proxy and all future rate limiting; quota exhaustion or provider key revocation takes down map styles and walking routes for every real pilgrim simultaneously — worst-case timing: peak season.
- **Fix:** Remove the fallback constant (fail loudly at startup if env missing); rotate **both** keys; treat anything that ever touched a bundle/git object as burned; move style URL behind same-origin proxy like `/models/` if the origin restriction requires it. **Effort:** S–M. **Priority:** Immediate.

### DEV-001 — Developer QA harnesses ship ungated; can spoof/persist location and falsify data for end users

- **Category:** Security/Product integrity (root cause: missing NODE_ENV gating pattern applied inconsistently)
- **Severity:** P0 · **Likelihood:** medium (one shared-link tap away) · **Risk:** trust/integrity, support burden, misleading safety-relevant proximity info
- **Evidence:** `lib/dev/gps-sim.ts:662-664` activates at module import on every client; reads `?gps-sim=live|auto&gps-scale=N` (:491), persists prefs to localStorage `tawaf:gps-sim` (:548-555), replaces `navigator.geolocation` via `Object.defineProperty` (:651-657). `lib/dev/demo-world.ts:112-181` teleports HARAM_GATES/HOTELS/POIS arrays on `?demo-world=1`, persisted as `tawaf:demo-world`. Both rendered unconditionally: `app/map/page.tsx:518` (`<DebugLocationPanel />`), :521 (`GpsSimBadge`). Contrast: ModelTuner IS gated (`components/map/MapView.tsx:1660` `NODE_ENV !== "production"`).
- **Impact:** Victim opens `tawaf.barikoimaps.com/map?gps-sim=auto` from a group chat → their reported position becomes a scripted walker circling the Kaaba and survives reloads; gate-proximity hints, near/far warnings, and navigation run against fabricated fixes. Or they see fake hotels/gates listed around themselves in Dhaka.
- **Fix:** Apply the existing ModelTuner gating pattern (`process.env.NODE_ENV !== "production"`) to DebugLocationPanel + GpsSimBadge imports and both dev modules' self-activation blocks; drop localStorage persistence of sim prefs; build a _product_ manual-location picker separately (see UX-001). **Effort:** S (gate) / M (product picker). **Priority:** Immediate.

---

## P1 Issues

### REL-001 — Basemap outage = silent permanent blank canvas

- **Evidence:** `components/map/MapView.tsx:450-468` creates map with hosted Barikoi style; only `map.on("load")` registered (:486-488); zero `"error"` handlers repo-wide (grep). All overlays/models/geolocation UX gate on `mapLoaded`.
- **Impact:** On congested Haram networks or any style-CDN hiccup, users stare at a blank rectangle with floating controls — looks like a hang; nothing logged (see OBS-001).
- **Fix:** `map.on("error")` + load-timeout watchdog → inline Bengali banner with retry (reuse the pattern already built for model-load errors at `MapView.tsx:1603-1651`). Consider a raster fallback style. **Effort:** M. **Priority:** Pre-launch.

### FE-001 — No error boundaries anywhere (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx` all absent)

- **Evidence:** Filesystem search = zero matches; zero custom ErrorBoundary/`componentDidCatch`; `/map` is a 625-line client tree (markers, GeoJSON casts like `MapView.tsx:1286` `(layer as any)`).
- **Impact:** Any uncaught throw replaces the whole product with Next's English "Application error" screen — no retry, no bn copy; e2e spec literally greps for that string as the expected crash output.
- **Fix:** Add `app/error.tsx` (bn message + reset), `global-error.tsx`, `not-found.tsx`, plus Suspense/loading for the /map shell. **Effort:** S–M. **Priority:** Pre-launch.

### SEC-002 — Zero rate limiting on unauthenticated `/api/directions`

- **Evidence:** No limiter in route; no `middleware.ts`; nginx conf has no `limit_req`; `UPSTASH_REDIS_*` exist only as dead `.env.example` placeholders (zero code references, no upstash package installed).
- **Impact:** Trivial shell loop burns the paid Barikoi routing quota through your own public origin; provider suspension = outage. Browsers can't CSRF it (no CORS), but server-side abuse needs none.
- **Fix:** IP-keyed limit at nginx (`limit_req zone`) now; wire real Upstash middleware later; assert in-handler Content-Length bound for direct-container callers. **Effort:** S (nginx) / M (app-level). **Priority:** Pre-launch.

### SEC-003 — Real MapTiler key committed via tracked `.env.production`

- **Evidence:** `git ls-files` includes `.env.production`; contents `NEXT_PUBLIC_MAPTILER_KEY=ASrfqapsZfy4BRFJJdVy` (added `ac2141c`); consumed client-side `MapView.tsx:548` (terrain tiles); `.dockerignore` covers `.env.local` variants but not `.env.production`, so it rides into every build context.
- **Impact:** Key scrapable from repo+image layers; billable quota theft; normalizes committing env files.
- **Fix:** `git rm --cached .env.production`, extend `.gitignore`, rotate key, keep only examples; inject real values server-side. **Effort:** S. **Priority:** Pre-launch.

### LIC-001 — OSM attribution legally required but actively suppressed

- **Evidence:** `MapView.tsx:466` `attributionControl: false`; replacement credit is a Barikoi logo only (`components/map/BarikoiAttribution.tsx` — link to barikoi.com, no OSM line); gate data sourced from OSM Overpass exports (`data/gates/*.overpass.json`).
- **Impact:** License violation exposure for OSM-derived tiles/data (Barikoi tiles are OSM-derived too). The company's own earlier audit doc lists this as critical; unfixed.
- **Fix:** Restore attribution text ("© OpenStreetMap contributors" + Barikoi) either via MapLibre AttributionControl styled to match, or appended to the logo corner. **Effort:** S. **Priority:** Pre-launch.

### OPS-002 — Committed nginx config points at the wrong port (site kills itself if runbook followed)

- **Evidence:** `deploy/nginx/tawaf.barikoimaps.com.conf:22` → `proxy_pass http://127.0.0.1:3000/`; `docker-compose.yml` publishes `127.0.0.1:4005:4005` with `PORT=4005`; runbook §3 health-checks 4005. Prod presumably works because someone hand-edited the server copy.
- **Impact:** Reinstalling config per §4 = sitewide 502. Config drift is precisely what the repo exists to prevent.
- **Fix:** Point proxy_pass at 4005; add static-serving/gzip/client_max_body_size while editing. Then re-drill §4 on staging. **Effort:** S. **Priority:** Pre-launch.

### OPS-003 — CI does nothing: no lint/type-check/tests/build/e2e anywhere

- **Evidence:** `.github/workflows/code-review.yml` is the sole workflow (LLM review bot on push-main); playwright/vitest configs define CI behavior (`retries`, `forbidOnly`) that nothing ever triggers; webkit/firefox projects configured, never executed.
- **Impact:** Red builds reach main whenever local hooks are skipped (`--no-verify`, fresh machines); "tested" is aspirational.
- **Fix:** One workflow: `lint + type-check + vitest run + next build` on PR/push; add chromium-only Playwright with secrets as repo vars once style-key rotation lands (QA-001 dependency). **Effort:** S–M. **Priority:** Pre-launch.

### PERF-001 — ~1 MB of fonts force-preloaded on every route, uncompressed TTF

- **Evidence:** `app/layout.tsx:17-72` declares all 10 Ador Noirrit faces incl. italics/extra weights via `next/font/local` (TTF never converted); build output shows preload-marked `-s.p.ttf` files ≈ 0.87 MB + Inter/Noto WOFF2 ≈ 142 KB ⇒ ≈ 1.02 MB blocking-ish bytes identical on `/` and `/map`.
- **Impact:** ~8 s pure font bandwidth on a 1 Mbps congested cell (~27 s @300 kbps), competing with the JS that makes the map interactive; suppresses conversion long before anything technically breaks.
- **Fix:** Convert faces to WOFF2 (subset to used codepoints), drop italic + unused weights (CSS uses 400/600/700), rely on `unicode-range`. **Effort:** S. **Priority:** Pre-launch.

### PERF-002 — 63–80 MB GLB models stream from raw.githubusercontent.com with no resume; RAM spike from whole-body buffering

- **Evidence:** Measured: Haram GLB 63.2 MB, Nabawi 79.5 MB, tower 26.7 MB (proxied through Node). `model-manager.ts:181-199` accumulates chunks without Range-resume; two largest models served directly from GitHub raw (`model-config.ts:50-51,199-200`).
- **Impact:** Interruption at minute 9 restarts byte 0 (~10 min downloads on 1 Mbps); chunk-array + concatenated buffer spikes RAM 2–3× model size (OOM risk on low-RAM Android); GitHub's shared rate limiter becomes your production SLA; evening Tawaf-hour concurrency funnels through it.
- **Fix:** Host GLBs on CDN/object storage with content-hashed names (the plan already noted as remaining), stream-to-Cache progressively, honor Range resume. **Effort:** L. **Priority:** Pre-launch (can launch without 3D enabled by default).

### OBS-001 — Zero observability: failures happen silently, ops is blind

- **Evidence:** No sentry/datadog/analytics anywhere; ~5 console.warn sites total; no `/api/health` (only route is directions); compose defines no logging options (host-default json-file, likely unbounded); no uptime monitoring config.
- **Impact:** "Is production okay?" is unanswerable; key-rotation fallout, upstream outages, model-proxy failures, and client crashes all invisible; support learns from complaints.
- **Fix:** `/api/health` asserting key presence + upstream reachability + style fetch; free-tier Sentry (client+server) wired to new error boundaries; structured startup log line (version/env flag states); docker log rotation options; any uptime pinger against /api/health. **Effort:** M. **Priority:** Pre-launch.

### UX-001 — Location-denied hole: the advertised product vanishes without explanation

- **Evidence:** Chip bar unmounts entirely `app/map/page.tsx:561` (`hidden={!nearby.hasLocation || …}`); category buttons gray out wordlessly (`NearbyCategoryButton.tsx`, opacity-40 on count==0/disabled); denied state is a passive rose pill "লোকেশন বন্ধ" living inside the hamburger only (`UserLocation.tsx:45-52`); no manual-location picker exists in the product — the de-facto picker is the QA panel (DEV-001). Recovery _copy_ is excellent (`lib/utils/geolocation.ts:34-38`); recovery _paths_ don't exist.
- **Impact:** The single most confusing moment for a first-time user; feature abandonment at the exact decision point browsers make users hesitate on.
- **Fix:** One denied/unavailable modal: explain → "আবার চেষ্টা করুন" → browse-from-Makkah-center + manual pin/list pick; keep chip bar visible-but-disabled with reason tooltip. **Effort:** M. **Priority:** Pre-launch.

### UX-002 — Umrah guide finishes into a dead end; correction is destructive

- **Evidence:** `TawafGuideSheet.tsx:117` `isLast` disables primary button (:193) replaced only by collapse control; zero completion strings repo-wide (rg অভিনন্দন/মুবারক/সম্পন্ন হয়েছে = none); `umrahGuideStore.reset()` (:102-111) wipes profile + progress together; reset behind tiny icon + native `confirm()` (`GuideControls.tsx:74`); `forceNextStep()` exists (:131-134) unwired — the escape hatch mechanism exists, the button was never connected.
- **Impact:** The most emotionally significant moment of the product just stops; a mis-tapped gender at onboarding hides/shows steps with no edit path short of progress wipe.
- **Fix:** Completion step (celebration + counter summary + non-destructive restart via `startGuide()`); profile-edit sheet re-deriving `stepIds` without clearing progress; replace native confirm() with the existing dialog component. **Effort:** M. **Priority:** Pre-launch.

### UX-003 — Marketing CTA promises "উমরাহ শুরু করুন"; /map opens a bare map for new users

- **Evidence:** Home CTAs link plainly to `/map` (`app/page.tsx:68-74,167-172`); guide auto-open only fires for already-onboarded users (`page.tsx:215-225` condition on `onboarded`); wizard discoverable only via header toggle.
- **Impact:** First-timers landing with intent to start get orientation mismatch; onboarding wizard starves.
- **Fix:** Auto-open onboarding when `!onboarded` on /map entry (honoring a `?start=` param to distinguish deep links); ensure it can open without location permission. **Effort:** S. **Priority:** Pre-launch.

---

## P2 Issues

_(All evidence file:line verified by the respective audit passes; confidence labels retained where not fully runtime-confirmed.)_

**Frontend**

- **FE-002 · Render-phase store write at central wiring point.** `app/map/page.tsx:300-302` calls zustand setter during render (double-fires under StrictMode; concurrent-mode hazard). Move to `useEffect([activeRoute])`. Effort S. Likely.
- **FE-003 · 3D remount-during-download race leaks a parsed model; DRACOLoader never disposed.** `three-model-layer.ts:275` cache insert reachable from two component lifetimes sharing one deduped bytes-promise; orphan closure disposed-flag stops runtime but never frees geometries; fresh DRACOLoader per boot (:238-241). Guard insert to surviving closure; dispose draco in finally. Effort S. Likely (magnitude needs device test).
- **FE-004 · Zustand persistence has no version/migration runway.** Three persisted stores (`umrah-guide-storage`, `map-storage`, `tawaf:nearby-settings`), none declares `version`/`migrate`; corrupt JSON safely falls back to defaults (verified middleware behavior), but any future profile-shape change silently drops user progress. Stamp versions + migrate now; validate on rehydrate. Effort S.
- **FE-005 · Umrah step markers torn down wholesale per counter tap.** Marker effect deps include `umrahCounters` (`MapView.tsx:1340-1397`) — rebuild-all on every "+১ চক্কর" tap during live Tawaf. Diff-update instead. Effort M.
- **FE-006 · SSR-safe-by-coincidence viewport read.** `MapView.tsx:330-333` touches `window.innerHeight` in render whenever `guideSheetSnap !== null`; hydration ordering makes it safe today. Gate from state. Effort S.
- **FE-007 · Bottom-sheet listener churn via unstable `snapPoints` prop identity.** Inline arrays cause teardown/re-add of nine native listeners per parent render, including mid-drag on GPS ticks. Refs exist for everything else — memoize/ref this too; wrap `setPointerCapture` in try/catch (:446). Effort S.

**Security**

- **SEC-004 · `/models/:filename` rewrite unvalidated + installed Next below patch line.** `next.config.ts:21-28` filename unrestricted (probe `..%2F` behavior at runtime); lockfile has `next 15.5.14` (advisory GHSA-p9j2-gv94-2wf4, patched ≥15.5.21) and `sharp <0.35` riding in standalone image; `<Image>` in use so Image-Optimization DoS advisories apply. Restrict source regex, pin/upgrade next+sharp. Effort S–M.
- **SEC-005 · Header gaps: no CSP script-src anywhere; HSTS absent from repo nginx conf** (certbot TLS-options include ≠ HSTS header). Roll incremental CSP (default-src 'self', tile/style hosts allowlisted, report-only first); own the HSTS line. Effort M.
- **SEC-006 · Info leakage from directions route.** Upstream status/message reflected verbatim (`route.ts:128-130`); unkeyed-startup tells clients to edit `.env.local` (:79). Log details server-side; return generic bn strings. Effort S.
- **SEC-007 · npm audit: 17 vulns (2 critical, 10 high)** — mostly dev-chain; runtime-relevant items covered in SEC-004. Regenerate lockfile on upgrade cadence. Effort S.
- **SEC-008 · Outbound `Origin: maps.barikoi.com` spoof per request** (`route.ts:97`) — fragile ToS posture; align with provider officially. Effort S (conversation) .

**Performance/Assets**

- **PERF-003 · Model cache lifecycle hazards.** Silent cache-write failures on quota-limited iOS (users re-download forever believing cached); invalidation only by renaming `tawaf-3d-models-v2` (replace upstream GLB without bump → stale bytes forever, no ETag revalidation); no eviction (169.4 MB accumulable across venues). Keep strengths (dedupe, saveData gating); add write-success feedback, ETag/hash check, LRU eviction. Effort M.
- **PERF-004 · ~330 KB generated TS datasets statically imported into /map client; barrel imports drag duas+mistakes data along** via `components/umrah` index even when panels stay closed (`query.ts:3-4`, `page.tsx:13`). Split data modules per consumer or lazy-load panels. Effort M.
- **PERF-005 · 16.2 MB public/images nearly all unreferenced-at-runtime, museum-grade JPGs (largest 4.39 MB), plus 2 confirmed broken references** (`kaaba.jpg`, `mashjid-al-khayef.jpeg` in `lib/data/umrah/anchors.ts:24` etc.) awaiting whoever wires `.image` fields. Prune/recompress; fix or delete dangling refs. Effort S.
- **PERF-006 · No `images` config; nginx adds nothing (no gzip/brotli, no static offload, no TTLs).** Every redeploy discards the optimizer cache; gzip of 211 KB maplibre competes with /api/directions on the same Node event loop at peak. Configure formats/TTL, let nginx serve `_next/static` + compress. Effort M.
- **PERF-007 · Dead dependencies shipped:** react-query, date-fns, zod, react-hook-form, @maplibre/geocoder, pmtiles (zero importers each). Misleading surface area; remove or adopt deliberately. Effort S.

**Testing/QA**

- **QA-001 · e2e suite silently requires live internet + valid style key; `networkidle` on a continuously-fetching map** — flaky-by-design, unusable in fresh CI; example.spec.ts ×5-browser scaffold still executes. Route style fetches through a mockable base; delete scaffolding. Effort M.
- **QA-002 · High-risk untested modules:** three-model-layer (WebGL lifecycle), MapView orchestration, useGeolocation hook lifecycle (device quirks = top complaint genre), OfflineBadge/theme persistence (zero tests), offline events simulation nowhere. Prioritize useGeolocation + offline matrix. Effort M.

**Accessibility** (maturity estimate 68/100 — above-average infrastructure, patchable edges)

- **A11Y-001 · RoutePanel header text effectively invisible:** dark-on-emerald 2.09:1 light / 2.54:1 dark (needs `text-primary-foreground`, 7.89:1). Effort S.
- **A11Y-002 · Amber/rose/gold accent drift fails 1.4.3 at warning/error/rating surfaces** (amber-600 ≈3.19:1 body warnings incl. clickable retry link; rose-400 ≈2.51:1 permission-denied copy; gold-as-text ≈2.3:1). Map to semantic tokens (`--warning`, `--destructive`, gold fill-only). Effort M.
- **A11Y-003 · Onboarding choice cards have zero selection semantics** (no radiogroup/radio/aria-checked on gender/journey sets, `UmrahOnboarding.tsx`). Effort S.
- **A11Y-004 · LostGroupHelper inputs unlabelled** (labels rendered without htmlFor/nesting). Effort S.
- **A11Y-005 · Arabic religious text lacks `lang="ar"` everywhere; several RTL blocks skip `.font-arabic`** (Noto Naskh never loads there — wrong glyph shaping, e.g. GateSelector.tsx:206). Mechanical fix ×6 sites; consider `<ArabicText>` wrapper. Effort S.
- **A11Y-006 · Camera flights ignore prefers-reduced-motion while a comment claims it's handled** (`guide-sheet.ts:64-65` documents jumpTo conversion; `jumpTo` appears 0 times in repo; 11+ hardcoded durations incl. auto-recentering during navigation). Centralize duration helper. Effort S.
- **A11Y-007 · Focus-trap/modal gaps:** background not inert (SR-by-touch reaches page behind sheets); initial focus hits first focusable not dialog title; FOCUSABLE selector misses `[role="button"]` (used by markers!)/contenteditable; Escape closes ALL stacked sheets (no top-of-stack check); sheet-handle aria-label contradicts Enter action; desktop floating panels bypass the whole dialog system. Fix useFocusTrap once, fixes five modals. Effort M.

**UX/Product**

- **UX-004 · Zero-result categories fail silently twice** (strip returns null `NearbyCardsStrip.tsx:132`; sibling list sheet HAS a good empty state pointing at… a settings screen that doesn't exist, see UX-007). Inline "এই ব্যাসার্ধে কিছু নেই — ব্যাসার্ধ বাড়ান" card. Effort S.
- **UX-005 · Arrival anticlimax:** arrival only flips banner state; lone X exits; no completion card/next-hint. Effort M.
- **UX-006 · Hotel amenities/tags render English-only labels in bn-first UI** (`HOTEL_AMENITIES_LABELS` type is `{en, ar}` — no bn; raw tags pass through, `nearby-detail-content.tsx:160,192-203`). Effort S.
- **UX-007 · Missing basics:** no settings screen (referenced by empty-state copy!), no PWA manifest/install, no feedback/support/about, no POI freshness dates (weak footer disclaimer only). Effort M.
- **UX-008 · Hero preview pretends interactivity** (cursor-pointer + hover on zero-wired SVG map above the real CTA, `TawafMapPreview.tsx:89-107`). Link it or kill the affordance. Effort S.

**i18n**

- **I18N-001 · Compass letters leak English into Bangla sentences** ("NE দিকে"): `getDirectionFromBearing` returns N/NE… consumed by list/detail sheets; correct bn mapping already exists in MiqatOverviewPanel. Effort S.
- **I18N-002 · Visible "Beta" pill + several aria-labels English** (`aria-label="Close"` in RoutePanel etc.). Effort S.

**DevOps/Ops**

- **OPS-004 · Release discipline:** mutable `:latest` overwrites garbage-collect rollback material; zero git tags/CHANGELOG/package.json frozen at 0.1.2; premature push instantly deploys since prod just pulls latest; rollback runbook is `down` + `ls` (performs no revert). Pin digests in compose, tag releases, write a real rollback drill. Effort M.
- **DOC-001 · Docs drift:** `.env.example` documents five dead keys + omits the actually-read `NEXT_PUBLIC_BARIKOI_API_KEY`; MODEL_UPSTREAM_URL example (LAN IP) contradicts code fallback (GitHub raw); CONTRIBUTING.md prescribes pnpm-era flow + phantom spec path; README cites nonexistent artifacts; NAV_PLAN overstates U6 vs README. Effort S.

**SEO**

- **SEO-001 · Effectively invisible organically:** metadata has title/description only — no OG/Twitter/canonical/robots directive; no robots.txt, sitemap, manifest.webmanifest, favicon.ico (webp only), JSON-LD, per-page titles (/map shares home verbatim — client component can't export metadata; needs server layout wrapper); zero social share image while WhatsApp/Messenger are the dominant BN channels. Homepage heading tree is healthy. Effort S–M.

---

## P3 Issues

| ID       | Issue                                                                                                                                                                                                          | Evidence                            | Note               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------ |
| POL-001  | Repo cruft tracked: 7 screenshots in `chromium_nav_check/`, orphan root `clockHands.js` duplicating `lib/map/clock-hands.ts`                                                                                   | git ls-files                        | Delete/gitignore   |
| POL-002  | lint-staged misses `*.mjs/*.js` (pipeline scripts, configs unformatted/unlinted)                                                                                                                               | package.json lint-staged            | Extend globs       |
| POL-003  | Dead npm-script twins `"pre-commit"`/`"pre-push"` mislead contributors (real hooks live in `.husky/*`)                                                                                                         | package.json:22-23                  | Remove entries     |
| POL-004  | Husky hygiene: `.husky/pre-commit` lacks shebang/exec-bit (works only via v9 shim sourcing)                                                                                                                    | stat                                | Normalize          |
| A11Y-P3a | Sub-44px touch targets inventory (StepPagination 24px tabs, compact markers' 28px active circle, GuideControls h-8, misc closes 26-36px) — 2.5.8 passes, platform guidance missed for a crowd-walking audience | audit inventory                     | Pad hit areas      |
| A11Y-P3b | Mobile map page exposes no heading at all (lone h1 hidden behind sm:block; no sr-only utility exists in repo)                                                                                                  | page.tsx:363-365                    | sr-only h1         |
| A11Y-P3c | `role="listitem"` directly on buttons flattens them; `role="application"` wraps live regions (scoping risk)                                                                                                    | NearbyListSheet:40-45, MapView:1573 | Restructure roles  |
| A11Y-P3d | animate-ping + tailwindcss-animate entrances escape reduced-motion CSS blocks; GlobalSrollTo snap                                                                                                              | UserLocation.tsx:69                 | Extend media query |
| I18N-P3  | Latin digits/unit in GateSelector distance badge (elsewhere bn-consistent); "~" tilde prefix before bn numerals in miqat.ts; untranslated ♿ title; format.ts defaults "en-US" (dead)                          | cited files                         | Sweep              |
| SEC-P3   | Missing OPTIONS/GET exports fine (405 default); nginx default 1MB body cap adequate; log-injection minimal (no server logging at all)                                                                          | reviewed                            | Awareness only     |
| DOC-P3   | README progress tables vs plan docs disagree on U6 vocabulary; `tileserver_staging` block describes foreign repo layout                                                                                        | README:78-85                        | Trim               |

---

## Product & Business Findings

- The product thesis is coherent and validated by the craft invested: gate-based navigation, true walking proximity, bn-first guidance. Core loops (search→detail→directions; nearby→navigate; guide progression with guarded counters) function and are tested.
- **Business risk concentration:** two third parties carry production existence-level weight with no contractual/SLO story — Barikoi style+routing (key rot, spoof-Origin fragility) and GitHub raw hosting (models). Map SLAs before scaling acquisition.
- **Beta positioning is honest** (badge) but "Beta" is Latin in a bn-first UI (I18N-002).
- **No monetization/analytics instrumentation whatsoever** (scored under Operations): registration-free product can still measure activation (guide started/completed), search terms, nav completions, error rates. Zero events exist today.
- Target-user fit for offline/degraded-network reality is partially delivered (bundled guide content) but undermined at the shell level (no SW/manifest; blank-canvas failure mode).

## UI/UX Findings

(Consolidated: see UX-001..008, A11Y-001..007.) Net: high interior consistency (tokens, sheets, dialogs designed once), failure at edges — finish states, empty states, denial states, desktop divergences — plus one native-confirm() inconsistency and one native-crash-screen inconsistency bookending the experience.

## Mobile Findings

- Audience-true details done right: safe-area insets honored (attribution bottom offset), dvh-based sheet resting heights, pointer-capture dragging hardened (single-finger id tracking, pointercancel settle), ref-counted scroll lock across stacked sheets, reduced-motion physics gates.
- Gaps: sub-44px targets inventory (A11Y-P3a), mobile-no-heading (A11Y-P3b), keyboard-less escape paths rely on X buttons ≤36px, font payload tax hits mobile hardest (PERF-001), model RAM spike hits low-RAM Android (PERF-002).
- Tablet/desktop: fine (responsive mdUp switches exist), but desktop panels bypass modal semantics (A11Y-007).

## Accessibility Findings

See A11Y-001..007 + P3 items. **Maturity 68/100.** Above-average systems (shared focus trap across 5 modals, marker accessibility factory excluding dot-markers with reasoned trade-off, 5 aria-live surfaces split correctly polite/assertive, dual-theme token completeness, honest in-code constraints). Holding it back: two confirmed contrast failures (RoutePanel header unreadable; accent-color drift at stress-points), categorical missing `lang="ar"` for dua content, radio-semantics absence in the very onboarding that orients new users, uncaptured camera-flight motion, desktop divergence suggesting guarantees are mobile-first-accidental rather than invariant. A focused 1–2 week pass credibly reaches ~85.

## Frontend Findings

Strict TS, zero suppressions, deliberate eslint-disables with reasons; exemplary lazy-loading (three.js dynamic, serialized boot chain, instance cache, visibility-flip toggles); marker contracts with signature-key churn control; rAF-coalesced store writes. Debts: no error architecture (FE-001), render-phase store write (FE-002), WebGL remount race + draco leak (FE-003), persist versioning runway absent (FE-004), marker rebuild churn on counters (FE-005), listener churn from prop identity (FE-007), zod/RHF unused despite being declared (validation ergonomics forfeited).

## Backend/API Findings

Single POST route with genuinely tight validation (SSRF structurally impossible — coordinates numeric-ranged before interpolation, fixed upstream host, allowlisted profiles, 10s abort), smart NoRoute-vs-failure distinction feeding the graceful dotted-route UX. Gaps: zero rate limiting (SEC-002), info-leaky errors (SEC-006), Origin spoof posture (SEC-008), implicit reliance on nginx 1MB body cap (fine, note for direct-container callers), no CORS needed currently (preflight fails — protective; document why before someone "fixes" it to `*`).

## Database Findings

**Architecture: intentionally N/A** — no database. State lives in bundled TS data + browser localStorage/Cache Storage. Consequences audited instead:

- Data freshness unmaintained and undiscoverable (no updatedAt fields anywhere; footer approximation disclaimer only).
- Two broken asset references in anchors data (PERF-005).
- 330 KB of object literals compiled into client JS (PERF-004) — move large datasets to JSON fetch or split consumers if /map grows.
- Client-side persistence lacks schema versions (FE-004).
  When accounts/saved places inevitably arrive: this audit's successor should score schema/index/backup — nothing exists yet by design.

## Security Findings

See SEC-001..008. Context for fairness: XSS primitives clean (no eval/new Function/document.write/window.open; innerHTML interpolation sites verified numeric/static-only; single dangerouslySetInnerHTML = static theme script; target=\_blank always noopener'd; JSON.parse always wrapped). Dev-cert directory untracked. Barikoi key never entered git history. The Security score is dragged almost entirely by SEC-001/003 (credential hygiene rot, not design failure — the separation _intent_ is present and half-implemented) plus SEC-002 and stale dependencies.

## Authentication & Authorization Findings

**No authentication/authorization exists — by design.** No login, roles, admin surface, or user-owned resources; therefore no IDOR/privilege-escalation/RBAC findings are possible (nothing to escalate to). The threat surface that replaces authz is: unauthenticated relay abuse (SEC-002) and client-state manipulation (DEV-001) — both covered above. When auth arrives: session strategy, admin RBAC, and server-side authorization on any new mutation-bearing endpoint must be designed together; nothing here constrains those choices badly.

## Payment Findings

**N/A** — no payments, bookings, commissions, or financial flows exist. Section reviewed-and-empty; nothing to audit. (If subscriptions/donations land later, revisit: today there is no idempotency/webhook groundwork, which is fine for zero payment surface.)

## Business Logic Findings

- **Guide sequence engine solid:** guard refuses advancing incomplete counters; goToNextIncomplete resumes cleanly; profile-driven filtering (gender/madhhab/journey) resolves deterministically (34-test suite); kaffara decision tree shows both scholarly opinions with sources — responsible handling of contested fiqh.
- **Break:** completion gate has no wired exit (UX-002); profile immutability forces destructive correction (same issue).
- **State-transition cleanliness elsewhere:** navigation states (guiding/approach/approximate/arrived) precedence-tested both directions; reroute cooldown prevents loops; approximate-route honesty preserved in two UI layers.
- **Integrity hazard remains DEMO-001/DEV-001:** demo-world mutates shared dataset modules in place — logic-contamination risk if ever imported by tests/stores accidentally; gating solves behaviorally, consider immutability anyway.

## Performance Findings

See PERF-001..007. Below them, what's genuinely right: idle-zero-frame WebGL rendering (no perpetual rAF), DPR≤2 with conditional MSAA budgeting, saveData/2G/3G prefetch refusal, 2 m/10 m dual-tier distance hysteresis with identity-stable results (verified zero-jitter-render claim), home page deliberately WebGL-free.
**What breaks first as usage grows:** (1) evening Tawaf-hour concurrency hitting GitHub-raw through your Node stream for 63 MB payloads — throttled/failed models with silent cache misses; (2) single-process gzip + image-opt + API latency contending on the standalone container once nginx serves nothing; (3) font tax suppressing conversions continuously without ever "breaking". At 10× traffic nothing crashes structurally (static architecture); degradation concentrates in EXACTLY the peak-prayer windows the product exists for.

## Reliability Findings

Failure-mode walkthrough (user view):

- Tiles/style fail → blank canvas forever, silent (REL-001). Data preserved (n/a). Retry = reload, fails again.
- Routing upstream fails → honest bn toast-ish alert, old route remains, graceful approximate fallback for NoRoute — **good**; retries safe.
- Mid-GLB network cut → restart from byte 0 after minutes (PERF-002); cache-write quota failure silent (PERF-003).
- Page refresh mid-operation → guide/counters survive (persisted stores); in-flight nav resets (nav unpersisted — acceptable, deliberate).
- Server restart/deploy mid-session → immutable \_next/static keeps working tab alive; pub-dir revalidates; users lose nothing persistent.
- Third-party total failure (Barikoi account suspended post-SEC-001 extraction) → product dies visibly-invisibly: blank tiles + dead routing, container "healthy".
  Deploying a redeploy-discipline fix: versioned images + real rollback procedure (OPS-004) converts the remaining single-point-of-regret into a 2-minute undo.

## DevOps Findings

OPS-001 (broken build chain), OPS-002 (port drift), OPS-003 (no CI), OPS-004 (release discipline). Compose runs non-root user with normalized perms (good), loopback-only binding (good), `restart: unless-stopped` (adequate). No resource limits configured; no multi-host story needed at this scale — one well-drilled box + rehearsed rollback suffices honestly.

## Monitoring & Observability Findings

OBS-001 dominates. What failures currently happen **completely silently**: client crashes (no boundary/tracker), routing-key rotation fallout, upstream outages, style-CDN failures, model-cache silent failures, cert expiry (nginx managed externally, no reminder system), disk-full on host logs (default driver). Recommendation priority order: /api/health with dependency asserts → Sentry free tier → structured startup/version logging → log rotation → uptime pinger. Cost ≈ zero; time ≈ 1 day.

## Testing Findings

Unit suite is the project's quiet strength: real geo-math, synthetic-touch choreography with controlled clocks, regression tests citing their own past bugs, store-level assertions in bn copy. 60+ files. See QA-001/002 gaps + journey table summary: strong on routing contract, nearby math, sheet gestures, bengali numerals; partial on reroute loop end-to-end and guide cross-session persistence; zero on offline matrix, theme persistence, webkit-specific quirks, camera layer. Top 10 manual pre-launch cases enumerated in appendix section below.

## SEO Findings

SEO-001. One-line verdict: **functionally invisible beyond direct links** — acceptable while invite-only, not at launch. Highest-leverage slices: metadataBase+canonical+OG-with-image (share previews are growth channel #1 for this audience), then robots/sitemap/manifest/favicon.ico in one commit.

## Localization Findings

Bengali-first execution is the strongest localization story I've audited in a small-team app: single util drives ০-৯ through every distance/timer/counter/rating/ARIA label with dedicated tests; zero placeholder strings in guide data; every record carries bn+en+ar slots and source refs; RTL-isolated Arabic elements prevent bidi bracket corruption structurally. Remaining polish: I18N-001 compass letters, I18N-002 Beta/ARIA labels, lang="ar" tagging (also A11Y-005), tilde-prefix nit. Verdict: **a Bangla-only pilgrim is not blocked anywhere meaningful** (compass words aside), and dua comprehension improves measurably once lang/font pairing lands.

## Admin & Operations Findings

There is no admin surface and (currently) no operational need — content is code-reviewed static data; changing POIs = PR. That is actually a defensible content-ops model at this scale. Missing operations capabilities worth noting for soon-after-launch: support contact path (none — users with problems have nowhere to report except app-store-style channels that don't exist), incident runbook beyond rollback (who checks what at 2 AM — assign names/tools), key-rotation checklist doc. These fold into OBS-001/OPS-004 workstreams.

## Analytics Findings

Zero instrumentation (no consented analytics, no privacy policy implications yet — nothing collects anything user-identifying; GPS never leaves the device; localStorage holds guide progress/settings/group-phone locally only; no third-party data sharing beyond tile/model CDNs receiving requests). Privacy posture is therefore excellent-by-absence (state it in a short privacy note when marketing starts). For business intelligence at launch, minimum event set: map_open, location_granted/denied, nearby_filter_used, direction_requested{success,fail}, guide_started/onboarding_completed/step_completed/counter_complete/guide_completed, model_download_started/completed/failed, error_boundary_hit. Implement behind a flag with consent-neutral aggregate metrics (e.g., self-hosted Plausible/Umami) to preserve the current trust position.

## Privacy Findings

Data collected: none server-side. Browser-local: guide profile (incl. group leader phone — flagged sensitive if devices are shared within families; document it), sim/demo prefs (DEV-001 removal makes these moot), theme, nearby settings. Logs: nginx access logs contain IPs/URLs (standard; retention unmanaged — set policy). Account deletion/export: N/A. Third-party recipients: barikoi.xyz receives proxied coordinate pairs when routing is requested (origin+destination coordinates transit Barikoi — disclose in a short privacy line), tiles.bmapsbd.com/barikoi style CDN see IPs, GitHub raw sees IPs for models. Overall: low-risk profile; publish a one-page privacy statement naming those three flows and you're ahead of most.

## Documentation Findings

Strong overall quality with specific rot points (DOC-001): deploy runbook is genuinely useful EXCEPT it will 502 the site if followed verbatim (OPS-002); .env.example actively misleads (five dead keys, omitted live key, LAN default contradicting code); CONTRIBUTING describes a pnpm-era flow that never matches hooks; README's project-structure block describes a different repository entirely; plan docs contradict README on U6 status vocabulary. Meanwhile the in-repo expert documentation (code comments explaining Android coarse-GPS behavior, sheet capture semantics, marker signature contracts) is exceptional — keep seeding runbook/docs from those voices.

## User Journey Findings

1. **Landing→Start:** strong visual narrative, honest beta framing; hero fakes interactivity (UX-008); CTA promises more than /map delivers for newcomers (UX-003).
2. **Permission gate:** the cliff edge — hesitation on the browser prompt can cost the entire perceived product (UX-001).
3. **Search→Gate detail:** fast, local-data deterministic, accessible detail sheet; gate search opens shared sheet cleanly.
4. **Nearby discovery:** unified pills/chips system works; zero-result silence (UX-004) and radius-setting reference to nowhere (UX-007) dent it.
5. **Directions/walk:** best-engineered loop — honest approximate messaging, reroute protections, live distances with jitter immunity. Arrival anticlimax (UX-005).
6. **Umrah guide:** deepest content investment; onboarding wizard structurally sound but semantically unlabeled (A11Y-003); counters joyful; finale nonexistent (UX-002).
7. **Offline:** badge shows in one place; shell doesn't survive mid-session reloads; guide content itself survives (as claimed).
8. **Support/logout/admin:** N/A by design; feedback path absent (UX-007).

## Edge Cases

- Empty data: categories/zero-results silent (UX-004); one-item lists render fine (strip/list paths tested). Thousands of items: cap-12 nearby decluttering handles scale by design (signature-key churn contract tested).
- Very long bn/ar strings: RTL isolation protects parentheses; hotel name overflow ellipsized in sheets (spot-checked classes) — Requires runtime verification at extreme lengths.
- Bangla/Unicode/Augmented graphemes: primary content language — thoroughly exercised via content tests.
- Invalid input: API coordinates strictly validated (NaN/Infinity/out-of-range/type — 9 branch tests); in-app lat/lng inputs confined to gated dev harness (DEV-001 removal moots).
- Duplicate/concurrent input: double-tap directions guarded by route-store transitions + fetchRoute try/catch; double-submit of routing creates single inflight request per trigger — Potential race window if triggers fire across components simultaneously (Requires runtime verification).
- Multi-tab: localStorage-first-write-wins persist conflicts possible between two /map tabs (zustand persist last-write-wins) — benign for single-user device norm.
- Refresh/back-button during navigation: nav resets gracefully; map hash preserved (hash:"map") — back-button restores camera, nice.
- Slow network/offline: covered in Reliability section.
- Timezone/time boundaries: clock-tower hands Asia/Riyadh; countdown features not yet shipped (U7) — n/a today.
- iOS Safari specifics: untested anywhere (webkit project configured, never run) — Requires runtime verification before claiming iOS support implicitly.

## Technical Debt

Dead-dependency quartet shipped "for later" (react-query/zod/RHF/date-fns/pmtiles/geocoder); barrel-import coupling dragging data into bundles; example test scaffolds; cruft dirs in git; dead env-var surface; orphan duplicate implementation file (clockHands.js) inviting edits to the wrong copy; mixed hook-script documentation (package.json twins vs .husky truth); no versioning discipline (tags/changelog frozen at init). Individually small; collectively they mislead the next contributor daily.

## Missing Features

Grouped by launch-necessity: **(Blocking-adjacent)** manual location picker as a product feature (not the QA panel); settings surface for the radius changes the copy already recommends. **(Expected-soon)** PWA installability (manifest+SW), guide completion experience, profile editing, share-current-place, content freshness dates, feedback channel. **(Post-launch vision, already planned)** U7 GPS auto-count, real Barikoj routing expansion, flight tracking, Hajj mode; EN language toggle (content model already bilingual — UI chrome isn't parameterized; decide bn-first-permanent vs i18n framework before adding a third surface).

## Missing Tests

Priority-ordered additions mirroring QA-002: (1) useGeolocation lifecycle: denied→granted transition, watch cleanup on unmount, coarse-fallback composition with jsdom FakeGeolocation; (2) offline matrix: navigator.onLine toggles driving OfflineBadge (once relocated to map page) + fetchRoute failure reuse of stale route; (3) corrupted/re-shaped persisted store rehydration (locks in FE-004 fix); (4) camera-motion helper honors prefers-reduced-motion (locks in A11Y-006); (5) directions route: malformed-JSON + upstream-HTML-detail branches (the 2 uncovered); (6) reroute-loop integration: sustained off-route → single refetch → cooldown suppression; (7) theme anti-flash script execution order (jsdom-friendly unit); (8) /api/health contract once created; (9) e2e chromium in CI with mocked style/routing (locks in QA-001); (10) trio-model-layer parse-race unit using the dedupe seam (locks in FE-003).

## Recommended Architecture Improvements

1. **Asset delivery tier (highest architectural ROI):** move GLBs + heavy images to object storage/CDN behind content-hashed URLs; add Range-resume streaming into Cache Storage; keep /models proxy as CORS shim only. Converts the two biggest reliability+performance risks into one workstream.
2. **Error/remediation shell:** error.tsx family + map error/watchdog + /api/health + Sentry = a coherent "when things break" architecture rather than four point-fixes.
3. **Dev-tool gating flag:** single `NEXT_PUBLIC_ENABLE_DEV_TOOLS` build flag consulted by DebugLocationPanel/GpsSimBadge/gps-sim/demo-world, replacing scattered NODE_ENV checks (ModelTuner keeps its own).
4. **Rate-limit seam:** nginx limit_req now; abstract limiter interface (Upstash or in-memory LRU) in route handler for when scale warrants.
5. **Persist-versioning convention:** store factory helper stamping version+migrate so every future store inherits the runway.
6. **Data-delivery refactor (post-launch):** split tourist-places/steps data from module imports into lazy JSON chunks per consumer, deleting barrel side-effect imports.
7. **Defer** i18n framework and auth until product signals demand them; both architectures are unusually easy to retrofit later given current discipline.

---

## Pre-launch Checklist

Immediate (this week):

- [ ] OPS-001 Fix Dockerfile guard; prove clean-clone→build→deploy end-to-end once; document THE build procedure in CONTRIBUTING.
- [ ] SEC-001 Remove hardcoded key fallback; rotate both Barikoi keys; verify style+routing healthy post-rotation (needs the health endpoint ideally).
- [ ] DEV-001 NODE_ENV-gate DebugLocationPanel + GpsSimBadge; strip gps-sim/demo-world self-activation in prod builds; purge `tawaf:gps-sim`/`tawaf:demo-world` persistence.
- [ ] OPS-002 Correct nginx conf port (+add gzip/basic caching lines); stage-test runbook §4.
- [ ] OPS-003 Land CI workflow (lint+type-check+vitest+build).
      Pre-launch (before announcing):
- [ ] REL-001 map error handler + retry banner; FE-001 error boundaries bn;
- [ ] SEC-002 rate limit (nginx at minimum); SEC-003 untrack/rotate MapTiler; LIC-001 restore OSM attribution;
- [ ] OBS-001 /api/health + Sentry + log rotation + uptime ping;
- [ ] PERF-001 fonts WOFF2 subset; SEC-004 restrict /models regex + upgrade next/sharp + regenerate lockfile;
- [ ] UX-001 denied-location modal; UX-002 guide completion + profile edit; UX-003 onboarding auto-open; UX-004 zero-result cards; UX-007 minimal settings sheet;
- [ ] A11Y-001..005 quick wins; I18N-001/002; SEO-001 core slice (metadataBase/canonical/OG image/robots/sitemap/manifest);
- [ ] QA: execute the Top-10 manual cases below on real iOS Safari + budget Android; OPS-004 tag release v0.2.0, pin digest, rehearsal-roll-back once.

## Post-launch Checklist

- [ ] Wire analytics event floor (consent-neutral, self-hosted) + weekly funnel review ritual
- [ ] PERF-002/003 model CDN migration + resumable download
- [ ] A11Y remediation wave 2 (inert backgrounds, Escape stacking, desktop panel semantics) targeting 85
- [ ] CSS/incremental CSP rollout from report-only baseline; HSTS
- [ ] CONTENT freshness dates + update pipeline owner; feedback inbox capacity plan
- [ ] PERF-004/005/006/007 debt sprint; docs refresh sweep (CONTRIBUTING/npm truth)

## Top 10 Fixes (ranked)

| #   | Fix                                                        | Issue          | Effort | Why first                                                  |
| --- | ---------------------------------------------------------- | -------------- | ------ | ---------------------------------------------------------- |
| 1   | Delete dead pmtiles guard; prove the deploy chain once     | OPS-001        | S      | Everything else is academic if `main` cannot ship          |
| 2   | Kill hardcoded key fallback; rotate both Barikoi keys      | SEC-001        | S      | Only P0 whose blast radius is "whole product down at peak" |
| 3   | NODE_ENV-gate all dev harnesses; remove persistence        | DEV-001        | S      | Trust/integrity of core promise; trivially cheap           |
| 4   | nginx port fix + gzip/cache lines + stage re-drill         | OPS-002        | S      | Prevents guaranteed next-mistake 502                       |
| 5   | CI: lint+types+tests+build on push                         | OPS-003        | M      | Makes every other fix _stay_ fixed                         |
| 6   | map.on("error") + retry banner (reuse model-error pattern) | REL-001        | M      | Closes worst silent user-facing failure                    |
| 7   | error.tsx/global-error/not-found (bn) + Sentry hook        | FE-001+OBS-001 | M      | You can't operate what you can't see                       |
| 8   | Fonts → subset WOFF2, drop unused faces                    | PERF-001       | S      | Biggest universal UX win per hour spent                    |
| 9   | Denied-location recovery modal + keep chips visible        | UX-001         | M      | Fixes THE first-run killer                                 |
| 10  | Rate-limit /api/directions (nginx)                         | SEC-002        | S      | Cheap insurance on the paid dependency                     |

---

## Master Issue Table

| ID           | Priority | Category                | Issue                                                                                                                                                     | Impact                                                        | Evidence                                                                                                                                   | Recommendation                                                                   | Effort | Status        |
| ------------ | -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------ | ------------- |
| OPS-001      | P0       | DevOps                  | Docker build guard requires deleted `gates.pmtiles`; release chain broken                                                                                 | Next deploy attempt fails outright                            | Dockerfile:40-44; absent public/tiles; .gitignore; scripts/gates/build-gates.mjs:9; commit 303e6bd                                         | Remove guard halves; rehearse clean-clone deploy; fix build script               | S      | Open          |
| SEC-001      | P0       | Security                | Live Barikoi key hardcoded in client bundle (=server routing key); old key in git history                                                                 | Quota burn → provider revoke → total outage                   | MapView.tsx:152-153; .env.local; commits 67f516e/b87e0b2/2fa96e3; UMRAH_UI_UX_AUDIT.md prior flag                                          | Remove fallback; rotate both keys; fail loudly on missing env                    | S–M    | Open          |
| DEV-001      | P0       | Integrity               | Ungated GPS-sim/demo-world/DebugLocationPanel spoof or falsify location/data; persists via localStorage                                                   | Crafted links/harness taps poison "you are here" trust        | lib/dev/gps-sim.ts:491,548-555,651-664; lib/dev/demo-world.ts:112-181; app/map/page.tsx:518,521; contrast ModelTuner gate MapView.tsx:1660 | Apply NODE_ENV gate pattern; strip persistence; ship product manual-picker later | S      | Open          |
| REL-001      | P1       | Reliability             | Style/tile failure = permanent blank canvas; no map error handler                                                                                         | Hang-like outage exactly on bad networks                      | MapView.tsx:450-468,486-488; zero map.on("error") repo-wide                                                                                | Handler + watchdog + bn retry banner; raster fallback option                     | M      | Open          |
| FE-001       | P1       | Frontend                | No error.tsx/global-error/not-found/ErrorBoundary anywhere                                                                                                | Crash → English default screen, no recovery                   | filesystem absence; zero componentDidCatch; umrah-map.spec greps default string                                                            | Add boundaries + Suspense shells                                                 | S–M    | Open          |
| SEC-002      | P1       | Security                | Zero rate limiting on /api/directions; Upstash vars are dead placeholders                                                                                 | Paid-routing quota drainable via public origin                | route.ts (no limiter); no middleware.ts; nginx no limit_req; env.example:6-7 only mention                                                  | nginx limit_req now; app-level limiter seam later                                | S–M    | Open          |
| SEC-003      | P1       | Security                | Tracked `.env.production` carries real MapTiler key; rides into docker context                                                                            | Billable tile-quota theft; env-commit habit                   | git ls-files; ac2141c; .dockerignore gap                                                                                                   | Untrack; extend ignore; rotate; examples only                                    | S      | Open          |
| LIC-001      | P1       | Legal                   | OSM attribution suppressed (control off; logo-only credit) though data/tiles OSM-derived                                                                  | License non-compliance exposure                               | MapView.tsx:466; BarikoiAttribution.tsx; data/gates/\*.overpass.json                                                                       | Restore visible OSM + Barikoi attribution                                        | S      | Open          |
| OPS-002      | P1       | DevOps                  | Committed nginx conf proxies :3000 vs compose :4005                                                                                                       | Runbook-following = sitewide 502                              | conf:22; docker-compose.yml; runbook §3                                                                                                    | Fix port; add gzip/cache; re-drill staging                                       | S      | Open          |
| OPS-003      | P1       | DevOps                  | CI runs nothing (LLM review bot only)                                                                                                                     | Red builds reach main unchecked                               | sole workflow code-review.yml; hooks advisory/local-only                                                                                   | Standard lint/test/build workflow                                                | S–M    | Open          |
| PERF-001     | P1       | Performance             | ~1.02 MB force-preloaded TTF fonts every route                                                                                                            | Seconds added to every first paint on target networks         | layout.tsx:17-72; build media inventory                                                                                                    | Subset WOFF2; cut italics/weights                                                | S      | Open          |
| PERF-002     | P1       | Performance/Reliability | 63–80 MB GLBs from GitHub raw; no resume; whole-body buffering RAM spike; proxy pipe                                                                      | 10-min redownloads; OOM risk; GH raw as prod SLA              | model-manager.ts:181-199; model-config.ts:50-51,199-200; HEAD-measured sizes                                                               | CDN + hashed names + progressive/resumable caching                               | L      | Open          |
| OBS-001      | P1       | Ops                     | No error tracking/health/analytics/logging rotation                                                                                                       | Failures invisible; "what's in prod" unanswerable             | absence sweeps; compose logging unset                                                                                                      | /api/health + Sentry + version logs + rotation                                   | M      | Open          |
| UX-001       | P1       | Product UX              | Location-denied: chip bar unmounts; passive pill hidden in menu; no manual picker (de-facto one is QA tooling)                                            | Product vanishes at decision moment                           | page.tsx:561; NearbyCategoryButton opacity-40; UserLocation.tsx:45-52; useMapRouting.ts:36-41                                              | Denial modal + retry + browse-from-Makkah + manual pick                          | M      | Open          |
| UX-002       | P1       | Product UX              | Guide completion dead-end; destructive-only reset via native confirm; forceNextStep unwired                                                               | Emotional finale missing; corrections wipe progress           | TawafGuideSheet.tsx:117,193; umrahGuideStore.ts:102-111,131-134; GuideControls.tsx:74                                                      | Completion step + profile editor + dialog confirm                                | M      | Open          |
| UX-003       | P1       | Product UX              | CTA promises start-Umrah; /map bare for new users                                                                                                         | Orientation mismatch at highest-intent entry                  | app/page.tsx CTAs; page.tsx:215-225 condition                                                                                              | Auto-open onboarding when !onboarded                                             | S      | Open          |
| FE-002       | P2       | Frontend                | Render-phase store write at wiring point                                                                                                                  | StrictMode warnings; concurrent-mode hazard                   | app/map/page.tsx:300-302                                                                                                                   | useEffect keyed on transitions                                                   | S      | Open          |
| FE-003       | P2       | Frontend                | 3D remount/download race leaks parsed instance; DRACOLoader undisposed                                                                                    | GPU memory creep "got weird later" on devices                 | three-model-layer.ts:238-241,275,280-283                                                                                                   | Survivor-only cache insert; dispose loader                                       | S      | Open (Likely) |
| FE-004       | P2       | Frontend                | Persisted stores lack version/migrate                                                                                                                     | Future shape changes silently drop saved progress             | umrahGuideStore/mapStore/nearbyStore partialize blocks                                                                                     | Version+migrate convention now                                                   | S      | Open          |
| FE-005       | P2       | Frontend                | Step markers rebuilt wholesale per counter tap                                                                                                            | Jank during peak interaction (live Tawaf)                     | MapView.tsx:1340-1397 deps                                                                                                                 | Diff-based updates                                                               | M      | Open          |
| SEC-004      | P2       | Security                | /models rewrite unvalidated; next 15.5.14 < patched 15.5.21; sharp <0.35 in image                                                                         | Traversal probe risk; known advisory exposure                 | next.config.ts:21-28; lockfile 15.5.14; GHSA refs                                                                                          | Regex allowlist; upgrade next/sharp; pin ~                                       | S–M    | Open          |
| SEC-005      | P2       | Security                | No CSP script-src; HSTS absent from repo conf                                                                                                             | XSS defense = React escaping only; no transport pinning       | next.config headers(); conf headers                                                                                                        | Incremental CSP report-only→enforce; owned HSTS                                  | M      | Open          |
| SEC-006      | P2       | Security                | Route errors reflect upstream detail/status; setup instructions leaked publicly                                                                           | Recon surface; user-facing dev-speak                          | route.ts:79,128-130                                                                                                                        | Generic bn messages; log details server-side                                     | S      | Open          |
| SEC-007      | P2       | Security                | 17 npm vulns (2C/10H), mostly dev-chain                                                                                                                   | Supply-chain noise; upgrade debt                              | npm audit --package-lock-only                                                                                                              | Upgrade pass w/ lockfile regen                                                   | S      | Open          |
| PERF-003     | P2       | Performance             | Model cache: silent write failures; rename-only invalidation; no eviction (169 MB ceiling)                                                                | Users re-download believing cached; stale forever post-update | model-manager.ts:21,115-127                                                                                                                | Write feedback; hash/ETag validation; LRU                                        | M      | Open          |
| PERF-004     | P2       | Performance             | 330 KB data TS statically bundled; barrels drag duas/mistakes into /map                                                                                   | Extra bytes in biggest route                                  | query.ts:3-4; page.tsx:13; wc -c table                                                                                                     | Lazy per-consumer data                                                           | M      | Open          |
| PERF-005     | P2       | Assets                  | 16.2 MB unreferenced images; 2 broken anchor refs (kaaba.jpg, mashjid-al-khayef.jpeg)                                                                     | Repo/image bloat; trap for first .image consumer              | du listing; lib/data/umrah/anchors.ts:24                                                                                                   | Prune/compress; fix-or-delete refs                                               | S      | Open          |
| PERF-006     | P2       | Infra                   | No image config/TTLs; nginx zero optimization contribution                                                                                                | Re-compression CPU at cold deploys; app CPU on gzip           | next.config images absent; conf                                                                                                            | images config + nginx static/gzip                                                | M      | Open          |
| PERF-007     | P2       | Debt                    | Dead deps: react-query,date-fns,zod,RHF,geocoder,pmtiles                                                                                                  | Misleading surface; install bloat                             | zero-importer grep                                                                                                                         | Remove or adopt deliberately                                                     | S      | Open          |
| QA-001       | P2       | Testing                 | e2e needs live net+keys+networkidle; never run in CI; example specs execute                                                                               | Suite flakes/hostile; coverage illusory                       | specs' networkidle; config projects                                                                                                        | Mockable base URL; chromium-in-CI; delete examples                               | M      | Open          |
| QA-002       | P2       | Testing                 | Untested: three-model-layer, MapView orchestration, useGeolocation lifecycle, offline, theme                                                              | Field-class bugs undetectable pre-release                     | coverage diff table                                                                                                                        | Priority additions list (Missing Tests §)                                        | M      | Open          |
| A11Y-001     | P2       | A11y                    | RoutePanel header 2.09:1/2.54:1 contrast                                                                                                                  | Branding-grade unreadable header                              | RoutePanel.tsx:192-204 computed                                                                                                            | text-primary-foreground swap                                                     | S      | Open          |
| A11Y-002     | P2       | A11y                    | Amber/rose/gold-as-text contrast failures at stress surfaces                                                                                              | Warnings/ratings illegible for low-vision                     | NavigationBanner:89,91; RoutePanel:29-36,127,~215; MistakeAssistant:195                                                                    | Token mapping (--warning/--destructive; gold fill-only)                          | M      | Open          |
| A11Y-003     | P2       | A11y                    | Onboarding choice cards lack radio semantics                                                                                                              | SR users hear ungrouped unnamed buttons                       | UmrahOnboarding.tsx:43-77,242-275                                                                                                          | radiogroup/radio/aria-checked                                                    | S      | Open          |
| A11Y-004     | P2       | A11y                    | LostGroupHelper inputs unlabeled                                                                                                                          | Anonymous edit fields for AT                                  | LostGroupHelper.tsx:86-107                                                                                                                 | htmlFor/nesting                                                                  | S      | Open          |
| A11Y-005     | P2       | A11y/i18n               | No lang="ar" on Arabic; some rtl blocks miss font-arabic (glyph shaping wrong)                                                                            | Dua announced/read wrongly; shaping bugs                      | 6 sites list (incl. GateSelector:206; globals.css:145)                                                                                     | ArabicText wrapper adding lang+font                                              | S      | Open          |
| A11Y-006     | P2       | A11y                    | Camera flights ignore reduced-motion; comment claims handled (jumpTo nonexistent)                                                                         | Vestibular risk during auto-recenter                          | MapView durations; useTawafCamera:55; guide-sheet.ts:64-65                                                                                 | Central duration helper                                                          | S      | Open          |
| A11Y-007     | P2       | A11y                    | Trap gaps: no inert background, first-focusable initial focus, selector misses role=button; Esc closes stacked sheets; desktop panels bypass dialogs      | Modals leak in real AT usage                                  | useFocusTrap.ts:5-6,33-44; bottom-sheet.tsx:497-510; RoutePanel/NearbySettings desktop branches                                            | Harden trap once; top-of-stack Esc; desktop role=dialog(false)                   | M      | Open          |
| UX-004       | P2       | UX                      | Zero-result categories silent (strip null; chips opacity-unexplained; sheet empty-state cites nonexistent Settings)                                       | Taps feel dead                                                | NearbyCardsStrip.tsx:132; NearbyListSheet.tsx:93-97                                                                                        | Inline empty cards; tooltip on disabled                                          | S      | Open          |
| UX-005       | P2       | UX                      | Arrival anticlimax; no auto-end/next hint                                                                                                                 | Loop ends in shrug                                            | useNavigation.ts; NavigationBanner.tsx:169-173                                                                                             | Completion card w/ contextual hint                                               | M      | Open          |
| UX-006       | P2       | i18n/UX                 | Hotel amenities/tags English-only in bn UI                                                                                                                | Language seam in flagship surface                             | hotels.ts:242-254; nearby-detail-content.tsx:160,192-203                                                                                   | Add bn labels; curate tag vocab                                                  | S      | Open          |
| UX-007       | P2       | Product                 | No settings screen (copy references it!); no manifest/PWA; no feedback/about; no freshness dates                                                          | Expected surfaces absent                                      | absence greps; NearbyListSheet:93-97; Footer                                                                                               | Minimal settings sheet + manifest + contact path                                 | M      | Open          |
| UX-008       | P2       | UX                      | Hero preview feigns interactivity                                                                                                                         | False affordance beside real CTA                              | TawafMapPreview.tsx:89-107                                                                                                                 | Link to /map or drop cursor                                                      | S      | Open          |
| I18N-001     | P2       | i18n                    | Compass "NE দিকে" English leak                                                                                                                            | Mixed-language prose in core rows                             | distance.ts:98-118 → query.ts:168,306; list/detail sheets                                                                                  | bn direction labels                                                              | S      | Open          |
| I18N-002     | P2       | i18n                    | "Beta" pill + English aria-labels (Close etc.)                                                                                                            | Visible/AT language leaks                                     | beta-badge.tsx:14,20; RoutePanel.tsx:37,198                                                                                                | Localize                                                                         | S      | Open          |
| OPS-004      | P2       | DevOps                  | Mutable :latest deploys; no tags/changelog/version; rollback runbook inert; push=deploy coupling                                                          | Unrevertable prod; unknown provenance                         | DEPLOY doc §6-7; git tag -l empty; package.json 0.1.2                                                                                      | Digest pinning; tagged releases; written rollback drill                          | M      | Open          |
| DOC-001      | P2       | Docs                    | Env-example lies (5 dead keys, omits used key, LAN default contradicts code); CONTRIBUTING pnpm-era; README phantom artifacts; plan-status contradictions | Contributors misled at every on-ramp                          | .env.example; CONTRIBUTING:21-43,128-182; README:78-90; plan docs                                                                          | Alignment sweep after key rotation settles                                       | S      | Open          |
| SEO-001      | P2       | SEO                     | Metadata skeletal; no OG/twitter/canonical/robots/sitemap/manifest/favicon.ico/JSON-LD/per-page titles                                                    | Organic invisibility; no share previews                       | layout.tsx:83-93; filesystem absences                                                                                                      | Core slice: metadataBase+OG img+robots+sitemap+manifest+favicon                  | S–M    | Open          |
| POL-001..004 | P3       | Hygiene                 | Cruft tracked (screenshots, clockHands.js); lint-staged scope gaps; dead hook-script twins; husky exec-bit nit                                            | Friction/confusion only                                       | git ls-files; package.json:22-23; stat                                                                                                     | Cleanup commit                                                                   | S      | Open          |
| A11Y-P3\*    | P3       | A11y                    | Touch targets <44px inventory; mobile zero-headings; role misuse pairs; reduced-motion leftovers; sr-only utility missing                                 | Polish; AAA/platform gaps                                     | audit sections                                                                                                                             | Wave-2 pass                                                                      | M      | Open          |
| I18N/DOC-P3  | P3       | i18n/Docs               | GateSelector Latin digits; tilde prefixes; en-US format defaults; README/plan vocab                                                                       | Consistency polish                                            | cited files                                                                                                                                | Sweep                                                                            | S      | Open          |

---

## Final Questions, Answered From Evidence

> **CTO: approve for production?** Not today. Approve the week-plan: OPS-001→SEC-001→DEV-001 unblock shipping; then the pre-launch block is one focused fortnight.
> **First customer's confusion?** The moment after hesitating on the location prompt (UX-001).
> **Attacker's first move?** Extract the bundle constant, hit Barikoi direct at season peak (SEC-001); second: loop the public relay for sport (SEC-002).
> **QA's first break?** iPhone Safari, underground floor, airplane-mode round-trip mid-tawaf — nothing automated or manual has ever tried it (QA-002).
> **2 AM pager?** Currently silent — nothing pages. Post-OBS-001 it would be: upstream health flip + cert expiry.
> **Money lost where?** Burned Barikoi quota (both keys) and MapTiler billing; conversion suppressed by the font tax; support cost from fabricated-location tickets (DEV-001).
> **Support's top ticket (predicted)?** "আমার কাছে কিছু দেখাচ্ছে না" (denied location) and "৩ডি মডেল লোড হয় না" (GH raw at peak) — both already evidenced in code paths.
> **10× traffic?** Static core holds; GH-raw fan-out and single-process gzip/opt contention degrade peak windows first (Performance §).
> **Database down?** None exists — the equivalent question is browser-storage loss: app degrades to defaults correctly (verified middleware behavior).
> **Payment provider down?** N/A today.
> **Two simultaneous same-actions?** Routing dedupes per trigger; simulated-position races contained by store sequencing; multi-tab last-write-wins benign.
> **Direct API abuse?** Validation holds (SSRF impossible, shapes enforced); volume is the only lever — hence rate limiting as pre-launch.
> **Slow-mobile pilgrim?** Fonts fight JS for bandwidth (PERF-001), models take ten minutes and can strand (PERF-002/003) — both bounded by fixes ranked above.
> **Bangla-only user blocked?** Nowhere meaningfully — the localization layer is the app's strongest system (Localization §).

## Final Recommendation

TawafMap's internals reflect a team that sweats correctness in the places reviewers rarely look — geo-math hysteresis bands, sheet pointer semantics, scholarly-fiqh pluralism in copy. The launch blockers are correspondingly narrow and mundane: a build guard nobody updated, a key nobody rotated, a gate somebody forgot to apply twice. Close the Immediate bucket (days), then the Pre-launch block (≈two weeks), rehearse deploy+rollback once, and this earns 🚀 READY on merits rather than optimism.
