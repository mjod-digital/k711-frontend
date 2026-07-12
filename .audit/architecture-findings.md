# Architecture & Code Quality Audit — Findings

**Date:** 2026-07-11
**Project:** k711 (Next.js 16.2.9 App Router / React 19 / SCSS Modules / Zustand / headless MODX)
**Status:** In Review

> Scope: circular deps, coupling, code smells, DRY/duplication, missing abstractions, inconsistent patterns, God components, prop-drilling vs store, server/client boundaries (Next 16 App Router), MODX data-layering, error handling, dead code, TypeScript typing, config/secrets, testing.
> Per `AGENTS.md`, this Next.js has intentional breaking changes — deviations from *older* Next conventions were **not** flagged; App Router behavior was checked against `node_modules/next/dist/docs/01-app`.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 8     |
| Medium   | 13    |
| Low      | 8     |
| **Total**| **30**|

### Counts by category

| Category | Critical | High | Medium | Low |
|----------|:-:|:-:|:-:|:-:|
| Error Handling / Resilience | 1 | 3 | 2 | 1 |
| Dependencies / Dead Code | 0 | 1 | 2 | 2 |
| Duplication / DRY | 0 | 0 | 4 | 2 |
| API / Data Layer | 0 | 1 | 3 | 1 |
| Testing / Observability | 0 | 2 | 1 | 0 |
| TypeScript / Config | 0 | 0 | 1 | 1 |

### Systemic patterns
- **Silent failure everywhere.** Every external-call failure (MODX, CRM, CoMagic, `/api/lead`) is swallowed into a fallback with no logging. In production an outage is indistinguishable from "no data."
- **No runtime validation at any boundary.** All CRM/CMS/form JSON is `as`-cast to declared types; a single renamed field mismaps silently or produces `NaN`.
- **Two half-built data layers.** `src/lib/api.ts` (live) vs `src/lib/modx/*` (dead, unfinished, different env vars) — no single source of truth.
- **Reusable abstractions exist but are bypassed** — pages hand-roll local copies of `TextDuo`, `ImageHeading`, `SilenceHeading`, and `StayHeading` instead of importing them.
- **No test/observability infrastructure at all.**

### Baseline positives (no action)
- **No circular dependencies.** Import graph is a clean DAG: `app → sections → ui → lib/store`; `lib/*` never imports upward.
- **No internal CRM model leaks to the client** — server pages map `Flat` → domain `Apartment`/`ApartmentDetail` before passing to client components.
- **Server/client split is otherwise correct** — all data fetching happens in `async` server components / `generateMetadata` / `generateStaticParams`; `comagic.ts` is correctly `"use client"`.
- **Clean typing hygiene** — no `any` in real code, no `!` non-null assertions, no `@ts-ignore`; `strict: true`.
- Empty/loading states **do** exist in the catalog and favorites lists.

---

## Findings

## CRITICAL

### [ARCH-001] Lead capture has no reliable delivery and forms always report success
- **Severity:** Critical
- **Category:** Error Handling / Resilience
- **File(s):** `src/app/api/lead/route.ts` (39), `src/lib/comagic.ts` (87-138), `src/app/contact/ContactForm.tsx` (18-31), `src/components/sections/Popups/index.tsx` (30-44, 104-118)
- **Status:** Open
- **Description:** Lead capture is the entire commercial purpose of this site, yet no channel durably persists a lead server-side. `/api/lead` only `console.log`s and returns `{ ok: true }` (the delivery is an unimplemented `TODO`). The primary channel is the browser-side CoMagic widget (`window.Comagic.addOfflineRequest`), which `withComagic` gives up on silently after ~3 s if the script never loaded (adblock / GTM failure / consent tooling), and whose own throw is swallowed. Meanwhile both forms call `openSuccess()` / `onDone()` **synchronously on the next line** after the fire-and-forget `sendLead()`, so the user always sees "вы записались на встречу" even when nothing was sent or stored. Combined with the absence of any logging (see ARCH-008), a lead can be lost with zero trace and the visitor believes they will be contacted.
- **Evidence:**
  ```ts
  // route.ts:39 — the only "delivery"
  console.log("[lead]", lead);
  return NextResponse.json({ ok: true });
  // Popups/index.tsx:34-43 — success shown regardless of outcome
  sendLead({ source: "booking", apartment, name: fd.get("name") as string, ... });
  onDone(); // → openSuccess()
  ```
- **Recommendation:** Make `/api/lead` the source of truth: deliver via email/CRM/webhook (or at minimum append to a durable store), validate, and return a real success/failure. Change `sendLead` to return `Promise<{ ok: boolean }>` resolved on the `/api/lead` response; only call `openSuccess()` on success, otherwise show an error/retry state. Treat client CoMagic as analytics duplication, not the primary channel. Extract a server-side `leadService` (owns delivery + validation) so business-critical capture no longer depends on an ad-blocker-vulnerable browser global.

---

## HIGH

### [ARCH-002] Entire `src/lib/modx/*` is dead code — a second, unfinished data layer
- **Severity:** High
- **Category:** Dependencies / Dead Code / API Design
- **File(s):** `src/lib/modx/client.ts` (71), `src/lib/modx/resources.ts` (35), `src/lib/modx/types.ts` (25)
- **Status:** Open
- **Description:** The live Data Access Layer is `src/lib/api.ts`, imported by all 12 pages. The whole `src/lib/modx/` tree (131 LOC) is imported by **nothing** outside its own folder (verified by grep), still carries `TODO: пути эндпоинтов … Поправь под реальный API` (`resources.ts:6-9`, endpoint paths are admitted guesses), and reads **different env vars** (`MODX_API_URL`/`MODX_API_TOKEN`) than the live code (`API_BASE_URL`). Two competing abstractions for the same job is a maintenance trap — a reader cannot tell which is authoritative, and a future dev may edit/wire the wrong one.
- **Recommendation:** Delete `src/lib/modx/` (it is unused, unfinished). If its typed generic `modxFetch<T>` design is preferred over `api.ts`'s hand-rolled fetches, port the live functions onto it and delete `api.ts`'s duplication instead — but keep exactly **one** server-only DAL. Update `.env.example` in the same change (see ARCH-009).

### [ARCH-003] No React error boundaries anywhere (`error.tsx` / `global-error.tsx` absent)
- **Severity:** High
- **Category:** Error Handling / Resilience
- **File(s):** `src/app/` (only `not-found.tsx` exists — no `error.tsx`, `global-error.tsx`, or `loading.tsx`)
- **Status:** Open
- **Description:** Callers currently wrap the throwing fetchers with `.catch()`, so the common CRM-failure path does not crash. But **any** uncaught runtime error in a server component (malformed CMS payload, `flatToDetail` on bad data — see ARCH-004, a future un-caught `modxFetch`) renders Next's default unstyled error screen with no Header/Footer and no recovery. There is no last line of defense at any segment.
- **Recommendation:** Add a root `src/app/error.tsx` (must be `'use client'`; Next 16 passes `{ error, reset }`) that logs the error and renders a branded fallback + retry, plus a `global-error.tsx` for layout-level failures. Consider a segment-level `error.tsx` under `apartments/`.

### [ARCH-004] No runtime validation at external boundaries → `NaN`/`undefined` can poison the whole catalog
- **Severity:** High
- **Category:** API / Data Layer / TypeScript
- **File(s):** `src/lib/api.ts` (52, 69-70, 89-127, 202, 263), `src/lib/apartments.ts` (32-44), `src/app/api/lead/route.ts` (20)
- **Status:** Open
- **Description:** Every external response is trusted by cast, never validated: `fetchApartments`/`fetchApartmentById` return `res.json()` typed as `Flat[]` with zero checks; `fetchPage`/`fetchContact` use `as Partial<…>`; the lead route uses `as LeadPayload`. `flatToApartment` then does arithmetic on possibly-missing numeric fields — `Math.round(f.price / 1000)`, `f.amount / 1_000_000`, `Number(f.number)` (no `Number.isFinite` guard). A single bad numeric field yields `NaN`, and that `NaN` flows into `catalogRanges` whose `Math.min(...)/Math.max(...)` then return `NaN` for the **entire** dataset — silently breaking every RangeSlider and the whole filter UI, not just one row. TypeScript's types are a fiction against real CRM/CMS drift.
- **Recommendation:** Introduce **zod** schemas (`FlatSchema`, `FlatDetailSchema`, `PageContentSchema`, `ContactSchema`, `LeadSchema`) and `.safeParse()` at each boundary. On parse failure, fall back to the existing empty/fallback values (`EMPTY_PAGE`, `CONTACT_FALLBACK`, `[]`) **and log** (ARCH-008), and drop individual flats that fail validation so one bad record can't poison the range computation. As defense-in-depth, coerce numerics with `Number(x) || 0` at the boundary.

### [ARCH-005] No timeout / retry on any external fetch (MODX + CRM) → hung renders and builds
- **Severity:** High
- **Category:** Error Handling / Resilience
- **File(s):** `src/lib/api.ts` (48, 65, 75, 200, 260), `src/lib/modx/client.ts` (62)
- **Status:** Open
- **Description:** No `AbortController`/`signal`/timeout exists anywhere in `src/lib` or `src/app/api`. A slow or half-open upstream connection blocks the server render — and `generateStaticParams` at build time (`apartments/[id]/page.tsx:9`) — until the platform's default socket timeout, turning a slow dependency into a hung page or a hung build. There is no retry either.
- **Recommendation:** Wrap external fetches with `AbortSignal.timeout(~5000)` and a small bounded retry; on timeout, fall through to the existing fallbacks (`EMPTY_PAGE` / `[]` / `notFound()`). Centralize this in the single DAL chosen in ARCH-002.

### [ARCH-006] God component — `Location/index.tsx` mixes four unrelated concerns (488 LOC)
- **Severity:** High
- **Category:** Code Smell / Coupling
- **File(s):** `src/components/sections/Location/index.tsx` (26-109, 132-275, 465-488)
- **Status:** Open
- **Description:** One `"use client"` file bundles: (a) ~74 lines of hardcoded content data (`CATEGORIES` 26-32, `PLACES` 36-109); (b) a full pointer drag/pan engine (`drag` ref + `onPointerDown/Move/Up`, 132-275); (c) an IntersectionObserver drop animation plus a card open/close state machine with timers (146-233; 15 hooks total); (d) three inline SVG icon components (465-488). Any change to the map interaction, the place list, or the animation must be made inside a 488-line component with heavy state entanglement.
- **Recommendation:** Move `PLACES`/`CATEGORIES` to `location.data.ts` (or the CMS, per the project's MODX direction); extract the drag/pan into a `useMapPan()` hook and the drop/card logic into `useMapReveal()`; move the SVGs to `ui` icons. Target the component under ~200 LOC.

### [ARCH-007] Zero automated tests; highest-value pure logic is untested
- **Severity:** High
- **Category:** Testing
- **File(s):** whole repo (no `*.test.*`/`*.spec.*`, no `vitest`/`jest`/`playwright` config; `package.json` has no `test` script; `playwright` devDep is unused)
- **Status:** Open
- **Description:** The data-mapping and filtering logic — the parts most likely to break silently on a CRM/CMS shape change — ship with no coverage. `/coverage` in `.gitignore` is aspirational only.
- **Recommendation:** Add **vitest** (`test`/`test:watch` scripts). Cover the pure functions first (trivial, no DOM): `src/lib/api.ts` — `flatToApartment`, `flatToDetail` (discount + keyPlan-fallback branches), `fixSvgDataUri`, `normalizeImagePath`, `txt`/`img`, `cmsSlides`/`cmsGallery` (MIGX `image`→`src` remap + fallback-on-empty); `src/lib/apartments.ts` — `catalogRanges` (incl. empty `[0,0]` branch), `bedroomOptions`; `src/lib/comagic.ts` — `buildMessage`/`apartmentLine`. Extract `filtersToQuery`/`parseFiltersFromQuery`/`within` from `ApartmentCatalog` into a module and unit-test the URL⇄filter round-trip (clamp + NaN-guard branches).

### [ARCH-008] No observability — silent fallbacks, one `console.log`, no health check
- **Severity:** High
- **Category:** Observability
- **File(s):** `src/lib/api.ts` (80-82, 212-214, 277-279), `src/lib/comagic.ts` (118-120, 137), `src/app/apartments/page.tsx` (18), `src/app/favorites/page.tsx` (18), `src/app/api/lead/route.ts` (39)
- **Status:** Open
- **Description:** The only telemetry in the codebase is a single `console.log` in `/api/lead`. There is no logger, no Sentry/OTel, and no health endpoint. Every failure mode — CRM down, CMS 500, malformed JSON, CoMagic error, `/api/lead` rejection — is swallowed with no `console.error`. In production a total MODX outage renders fallback content identical to "empty data," and lost leads are invisible. There is no way to alert.
- **Recommendation:** Add `@sentry/nextjs` + a structured logger; `console.error`/report inside every `catch {}` in `api.ts` and `comagic.ts`; distinguish "fetch failed" from "empty result." Add a `/api/health` route for readiness probes.

### [ARCH-009] `.env.example` is gitignored **and** documents the wrong variables
- **Severity:** High
- **Category:** Config / Secrets
- **File(s):** `.gitignore` (40), `.env.example`, `src/lib/api.ts` (10-11, 20-21, 193), `src/lib/modx/client.ts` (3-4)
- **Status:** Open
- **Description:** Two compounding problems. (1) `.gitignore:40` `.env*` matches `.env.example` with no negation — `git check-ignore` confirms it, and no env file is tracked, so the single source of env documentation **never reaches a fresh clone**. (2) `.env.example` documents `MODX_API_URL`/`MODX_API_TOKEN`, which are read **only** by the dead `modx/client.ts`. The live code reads `API_BASE_URL`, `APARTMENTS_SOURCE`, `VERCEL`, `REVALIDATE_SECRET` — none of which the example mentions. `.env.local` correctly matches the code, not the example. A new dev copying `.env.example` configures variables that do nothing and omits the one that matters.
- **Recommendation:** Add `!.env.example` after the `.env*` rule so it is tracked. Rewrite it to document `API_BASE_URL` (with the prod-default note), `APARTMENTS_SOURCE`, and `REVALIDATE_SECRET`; drop `MODX_API_URL`/`MODX_API_TOKEN` unless the MODX layer is revived (ARCH-002). Keep it in lock-step with whichever DAL survives.

---

## MEDIUM

### [ARCH-010] Additional dead components + a naming inversion
- **Severity:** Medium
- **Category:** Dependencies / Dead Code
- **File(s):** `src/components/layout/Preloader/index.tsx` (69), `src/components/sections/FeatureScreen/index.tsx` (50), `src/components/sections/Residences/index.tsx` (40), `src/components/ui/Section/index.tsx` (17), `src/components/ui/Container/index.tsx` (12)
- **Status:** Open
- **Description:** ~190 LOC of components (plus their `.module.scss`) have zero importers (verified by grep). `layout.tsx` uses `Preloader-new/Preloader`, so the old `Preloader/index.tsx` is dead — and, confusingly, the **dead** one follows the house style (`export function` in `index.tsx`) while the **live** one breaks it (`export default` in `Preloader-new/Preloader.tsx`, single-quoted `'use client'`). `FeatureScreen` and `Residences` were absorbed into `Showcase`; `ui/Section` and `ui/Container` primitives are unused.
- **Recommendation:** Delete `FeatureScreen/`, `Residences/`, `ui/Section/`, `ui/Container/`, and the old `Preloader/`. Rename `Preloader-new/Preloader.tsx` → `Preloader/index.tsx` with a named export to match every other component.

### [ARCH-011] Triplicated `StayHeading` (byte-identical) + `improvement/SilenceHeading` duplicates an existing abstraction
- **Severity:** Medium
- **Category:** Duplication / DRY
- **File(s):** `src/app/design/StayHeading.tsx`, `src/app/residences/StayHeading.tsx`, `src/app/technologies/StayHeading.tsx` (+ `.module.scss` each); `src/app/improvement/SilenceHeading.tsx` vs `src/components/sections/SilenceHeading/index.tsx`
- **Status:** Open
- **Description:** The three `StayHeading.tsx` are **byte-for-byte identical** (`diff` empty), all rendering «дом, / который / не хочется покидать»; two of the three SCSS modules are identical, the third differs by one `@include contentMax` line — ~6 files / ~318 LOC that must change in lockstep. Separately, `src/components/sections/SilenceHeading` is already the generalized, prop-driven (`lines`, `className`) component and `/location` uses it — but `/improvement` imports a hardcoded local copy whose JSX equals the section's default.
- **Recommendation:** Promote one `src/components/sections/StayHeading/` (parameterize the `contentMax` variant via a `wide?` prop or `className`), delete the six per-page files, import from the section. In `improvement/page.tsx`, import `@/components/sections/SilenceHeading` and render `<SilenceHeading />`; delete `app/improvement/SilenceHeading.tsx` + its SCSS.

### [ARCH-012] Lead-form logic + consent checkbox block duplicated across 3 form components
- **Severity:** Medium
- **Category:** Duplication / DRY
- **File(s):** `src/app/contact/ContactForm.tsx` (14-90), `src/components/sections/Contact/index.tsx` (32-86), `src/components/sections/Popups/index.tsx` (26-95)
- **Status:** Open
- **Description:** Three components independently repeat: `onInvalidCapture={e => e.preventDefault()}`, `new FormData` extraction with `fd.get(...) as string`, `sendLead({ source, ... })`, `openSuccess()`, and a verbatim consent + marketing `<label className={styles.check}>` checkbox block. A change to the submit flow (e.g., the ARCH-001 success-on-confirmation fix) or the consent wording must be made in three places.
- **Recommendation:** Extract a `submitLead(form, source)` helper (co-located with `lib/comagic`) and a shared `<ConsentChecks/>` (or a full `<LeadForm/>`) component; the three call sites keep only their layout differences.

### [ARCH-013] Pages reimplement `TextDuo` and `ImageHeading` instead of reusing them
- **Severity:** Medium
- **Category:** Duplication / Missing Abstraction
- **File(s):** `src/app/improvement/GardenText.tsx`, `src/app/residences/ResidenceIntro.tsx` (vs `src/components/sections/TextDuo/index.tsx`); `src/app/design/LobbyImage.tsx`, `src/app/residences/ScenarioImage.tsx` (vs `src/components/sections/ImageHeading/index.tsx`)
- **Status:** Open
- **Description:** `GardenText`/`ResidenceIntro` hand-roll `TextDuo`'s right-column layout (`section > Reveal(lines)+CascadeHeading + Reveal(fade) paragraphs`) even though `TextDuo` already accepts `lines`, single-or-double `paragraphs`, and a `className` — the forks even drop `TextDuo`'s coordinated single-observer reveal timing, so they are strictly worse copies. `LobbyImage`/`ScenarioImage` similarly inline the `ImageHeading` shell (which the homepage already reuses via `GardenHeading`/`LobbyHeading`); the only shell delta is a `rootMargin="0px 0px -20% 0px"` on the `Reveal`. Animation behavior now lives in 3 places each.
- **Recommendation:** Replace the text forks with `<TextDuo variant="right" className=… lines=… paragraphs=… />`. Add an optional `rootMargin` prop to `ImageHeading` and render both image sections through it, keeping only their unique heading markup + heading-specific SCSS. Delete the four local components.

### [ARCH-014] God components — `ApartmentCatalog` (376 LOC) and `Showcase` (352 LOC)
- **Severity:** Medium
- **Category:** Code Smell / Coupling
- **File(s):** `src/components/sections/ApartmentCatalog/index.tsx` (47-75, 77-87, 252-283), `src/components/sections/Showcase/index.tsx` (59-277)
- **Status:** Open
- **Description:** `ApartmentCatalog` packs URL⇄filter serialization, a `FilterPanel` and `ApartmentRow` subcomponent, a local `HeartIcon` SVG (duplicating the existing `ui/FavoriteButton`), a window-height "zoom-to-fit" imperative DOM effect (using non-standard CSS `zoom`), and the filter/favorites orchestration into one client file. `Showcase` holds its entire ~220-line scroll-scrub engine (rAF loop, lerp, per-step stage math, plus a separate mobile parallax path) inside one `useIsomorphicLayoutEffect`, entangled with the JSX. (Both are otherwise reasonably decomposed — not emergencies, but hard to test/modify.)
- **Recommendation:** `ApartmentCatalog`: split `FilterPanel`/`ApartmentRow` into sibling files, move URL logic to a `useCatalogUrlSync()` hook (testable per ARCH-007), reuse `FavoriteButton`. `Showcase`: extract the scrub loop + mobile-parallax into a `useShowcaseScrub(ref, steps)` hook returning `active`, leaving only markup.

### [ARCH-015] Live DAL (`api.ts`) has no `server-only` guard
- **Severity:** Medium
- **Category:** API / Data Layer / Server-Client Boundary
- **File(s):** `src/lib/api.ts` (1) — vs `src/lib/modx/client.ts` (1, which *does* have it)
- **Status:** Open
- **Description:** The Next docs recommend marking the DAL with `import 'server-only'` to prevent environment poisoning. The dead layer has it; the live one does not. No active leak today (all importers are server components, and `API_BASE_URL` is not `NEXT_PUBLIC_`), but the guard is missing precisely where it matters: the pure mappers (`flatToApartment`, `txt`, `img`) *look* client-safe, so importing one into a `"use client"` component would silently drag server `fetch(..., { next })` calls into the client with no compile-time error.
- **Recommendation:** Add `import "server-only";` to the top of `src/lib/api.ts`. If pure mappers are needed client-side, keep them in a guard-free module (some already live in `src/lib/apartments.ts`).

### [ARCH-016] Inconsistent fetch/cache patterns; apartment fetchers are untagged (not webhook-revalidatable)
- **Severity:** Medium
- **Category:** API / Data Layer
- **File(s):** `src/lib/api.ts` (48-83 vs 190-215, 258-280), `src/lib/modx/client.ts` (56-59)
- **Status:** Open
- **Description:** Within `api.ts` there are two caching strategies: `fetchApartments`/`fetchApartmentById`/`fetchFloorData` hardcode `next: { revalidate: 60 }` with **no cache tag and no dev `no-store`**, while `fetchPage`/`fetchContact` route through `cacheOpts()` which adds a per-alias tag *and* dev `no-store`. (The dead `modx/client.ts` invents a third convention.) Consequence: CRM apartment data cannot be surgically refreshed via the `/api/revalidate` webhook (no tag), and in local dev the catalog is stale for 60 s while page content is live — an inconsistency a dev will trip over.
- **Recommendation:** Route the apartment fetchers through `cacheOpts("flats")` / `cacheOpts("flat:"+id)` so all reads share one caching/tagging/dev-freshness policy and become tag-revalidatable.

### [ARCH-017] `/api/lead` contract drift — consent/marketing dropped, weak validation, PII logged
- **Severity:** Medium
- **Category:** API / Data Layer / Observability
- **File(s):** `src/app/api/lead/route.ts` (10-17, 22-27, 39) vs `src/lib/comagic.ts` (124-137)
- **Status:** Open
- **Description:** The client POSTs `{ source, name, phone, email, comment, apartmentNumber, consent, marketing }`, but the route's `LeadPayload` type declares only through `apartmentNumber` — the legally-relevant PD-consent flags (`consent`/`marketing`) are never read and would be lost the moment real delivery is added (ARCH-001). Validation is presence-only (name+phone); `source` is typed as an enum but not checked, no email/phone format or length caps, `consent` is enforced only by the client `required` attribute (a direct POST bypasses it). The raw fields (`name`/`phone`/`email` PII) then go straight into `console.log`, i.e. plaintext PII in logs with a minor log-injection surface.
- **Recommendation:** Share a single zod `LeadSchema` between `comagic.ts` and `route.ts`; include `consent`/`marketing`, require `consent === true`, validate `source ∈ ["contact","booking"]` and email/phone format server-side; redact PII before any logging.

### [ARCH-018] `noUncheckedIndexedAccess` is OFF → false safety on `Record` index access
- **Severity:** Medium
- **Category:** TypeScript / Config
- **File(s):** `tsconfig.json`, `src/lib/api.ts` (219, 223, 236, 249), `src/app/page.tsx` (189)
- **Status:** Open
- **Description:** `strict: true` is set, but index access still returns a non-`undefined` type. `txt`/`img`/`cmsSlides`/`cmsGallery` read `c.texts[key]` / `c.lists[key]`, typed as present but `undefined` at runtime for missing keys. Current guards (`v && v.trim()`) work, but the compiler gives false safety: a future `c.texts[key].trim()` compiles and crashes in prod. The pattern is the same one behind ARCH-004.
- **Recommendation:** Enable `"noUncheckedIndexedAccess": true` and fix the surfaced accesses. Also consider `noUnusedLocals`/`noUnusedParameters` — they would have flagged the dead code in ARCH-002/ARCH-010.

### [ARCH-019] No env validation at boot; missing `API_BASE_URL` silently falls back to PROD
- **Severity:** Medium
- **Category:** Config / Secrets
- **File(s):** `src/lib/api.ts` (10-11, 20-21)
- **Status:** Open
- **Description:** `process.env.API_BASE_URL ?? "https://www.klimashkina711.ru/api"` with no startup schema (no zod/envsafe/`@t3-oss/env-nextjs`). A preview/staging deploy that forgets `API_BASE_URL` silently reads the **production** MODX/CRM with no error — and `APARTMENTS_SOURCE`/`VERCEL` auto-switching adds more implicit env branching.
- **Recommendation:** Add an env schema validated once at boot (`@t3-oss/env-nextjs` or a small zod module imported from the DAL); fail fast on missing required vars. Make the prod fallback explicit/logged rather than silent.

### [ARCH-020] No `loading.tsx`/Suspense; catalog fetch-failure looks like a sold-out building
- **Severity:** Medium
- **Category:** Error Handling / Resilience
- **File(s):** `src/app/*/page.tsx` (all `async`, no `loading.tsx`), `src/app/apartments/page.tsx` (16-18), `src/components/sections/ApartmentCatalog/index.tsx` (210, 329-331)
- **Status:** Open
- **Description:** No `loading.tsx` or `Suspense` exists, so with `APARTMENTS_SOURCE=api` a slow CRM/CMS makes navigation hang with no feedback until the full server render completes (compounded by ARCH-005's missing timeouts). Separately, on CRM failure `apartments/page.tsx` catches to `[]` and renders the full filter UI with dead `0–0` sliders (`catalogRanges([]) → [0,0]`) and the message «Нет квартир по заданным параметрам» — implying sold-out rather than "temporarily unavailable."
- **Recommendation:** Add `loading.tsx` for at least `apartments/`, `apartments/[id]/`, `favorites/`, `contact/` (or `Suspense` around data-dependent sections). Have the catalog page distinguish fetch-failure from genuinely-empty and render a distinct "catalog temporarily unavailable — try again" state instead of an interactive-but-broken filter panel.

### [ARCH-021] Page-scaffolding boilerplate duplicated across ~8 inner pages
- **Severity:** Medium
- **Category:** Duplication / DRY
- **File(s):** `src/app/{amenities,architecture,technologies,location,design,residences,improvement}/page.tsx`
- **Status:** Open
- **Description:** Every inner page repeats the identical ceremony: `const ALIAS`; a `FALLBACK_META`; a `generateMetadata()` that does `fetchPage(ALIAS)` → `title/description || fallback` (copy-pasted verbatim); a second `fetchPage(ALIAS)` in the component; `cmsSlides(content,"slider",FALLBACK)`; and a `PageHero` whose `breadcrumb` always starts `{ label:"…", href:"/", ariaLabel:"Главная" }`. The metadata block is genuinely duplicated logic, not just structure — 8 copies change together.
- **Recommendation:** Extract `buildPageMetadata(alias, fallback)` in `src/lib/api.ts` so each `generateMetadata` is one line; give `PageHero` a default home breadcrumb crumb so pages pass only their leaf label. (The per-page section composition genuinely differs, so stop at these two helpers rather than a full config-driven page-builder.)

### [ARCH-022] Scattered `ru`-locale formatters — no single formatting util
- **Severity:** Medium
- **Category:** Duplication / DRY
- **File(s):** `src/lib/apartments.ts` (51), `src/lib/comagic.ts` (63), `src/components/sections/ApartmentCard/index.tsx` (47-48, 117, 119), `src/components/sections/ApartmentCatalog/index.tsx` (195-196), `src/app/favorites/FavoritesList.tsx` (25, 55)
- **Status:** Open
- **Description:** The `ru-RU` grouping formatter is defined twice (`ru` in `apartments.ts`, `rub = ru(n)+" ₽"` in `comagic.ts`), and the `₽`-price / `м²`-area suffixing is re-assembled by hand at 5+ call sites. Formatting rules live in many places.
- **Recommendation:** Create `src/lib/format.ts` exporting `ru(n)`, `rub(n)`, `sqm(n)`; import `rub` into `comagic.ts` instead of redefining; use `rub`/`sqm` at the card/catalog/favorites sites.

---

## LOW

### [ARCH-023] Duplicated `Slide` / `CmsSlide` (and gallery) type shapes
- **Severity:** Low
- **Category:** Duplication / DRY
- **File(s):** `src/components/ui/Slider/index.tsx` (13-17), `src/lib/api.ts` (227-232)
- **Status:** Open
- **Description:** `Slide = { src; alt?; caption? }` and `CmsSlide = { src; caption?; alt? }` are the same shape declared twice; `cmsSlides()` returns `CmsSlide[]` handed straight to `<Slider slides={Slide[]}>` — they line up only by coincidence. `CmsGalleryItem` similarly mirrors the `GalleryStrip` item shape.
- **Recommendation:** Define one canonical `Slide`/`GalleryItem` in a shared module (or have `api.ts` `export type CmsSlide = Slide` from the Slider) so they can't silently diverge.

### [ARCH-024] UI primitive `RangeSlider` imports a domain util from `lib/apartments`
- **Severity:** Low
- **Category:** Dependencies / Coupling
- **File(s):** `src/components/ui/RangeSlider/index.tsx` (4)
- **Status:** Open
- **Description:** A generic `ui/` slider imports `ru` (locale number formatter) from `@/lib/apartments` — an upward dependency from a domain-agnostic primitive into a domain module.
- **Recommendation:** Move `ru` to `src/lib/format.ts` (ARCH-022) / `lib/utils` and import from there.

### [ARCH-025] Dead `siteConfig` fields + placeholder URL + no `metadataBase`
- **Severity:** Low
- **Category:** Config / Dead Code
- **File(s):** `src/config/site.ts` (5, 14-18), `src/app/layout.tsx` (29-44)
- **Status:** Open
- **Description:** `siteConfig.url = "https://example.com"` and `siteConfig.nav` (incl. `href: "/about"`) are referenced **nowhere** (verified — only `.name`/`.description`/`.cta`/`.phone` are used; the header renders its own list; `/about` has no route). Inert today, but `/about` 404s the moment `nav` is wired, and `layout.tsx` sets no `metadataBase`, so OG/canonical URLs resolve relative and the placeholder would leak if `url` is ever used.
- **Recommendation:** Delete the unused `url`/`nav`, or set a real `metadataBase` and add the `/about` page before referencing them.

### [ARCH-026] Heading "zoo" — several headings re-hand-roll the `CascadeHeading` wrapper
- **Severity:** Low
- **Category:** Duplication / Missing Abstraction
- **File(s):** `src/components/sections/CreamHeading/index.tsx`, `.../SilenceHeading/index.tsx`, the `StayHeading` trio (ARCH-011), vs `.../CenterHeading/index.tsx` + `.../CascadeHeading/index.tsx`
- **Status:** Open
- **Description:** `CenterHeading` cleanly wraps `CascadeHeading` in `section > Reveal(variant="lines")`, but `CreamHeading`, `SilenceHeading`, and `StayHeading` each re-implement the same `section > Reveal(lines) > h2 > span.reveal-line[style --i]` wrapper with bespoke markup instead of feeding `CascadeHeading`. The `--i` stagger convention is re-written ~5 times.
- **Recommendation:** Where the layout is expressible as cascade lines, render via `CenterHeading`/`CascadeHeading` + a page `className` for scatter offsets; retire the hand-rolled `h2 > reveal-line span` blocks. Migrate case-by-case (some scatter layouts may not fit cleanly).

### [ARCH-027] Inconsistent API response envelopes; no versioning
- **Severity:** Low
- **Category:** API / Data Layer
- **File(s):** `src/app/api/lead/route.ts` (23-41), `src/app/api/revalidate/route.ts` (13-25)
- **Status:** Open
- **Description:** Two routes use three envelope shapes: `/api/lead` returns `{ ok: true }` (success) vs `{ message }` (400); `/api/revalidate` returns `{ revalidated }` (success) vs `{ message }` (401). No shared `{ ok, data?, error? }` convention, no `/v1` namespace.
- **Recommendation:** Add a small response-envelope helper and reuse it in both routes. Low priority (only two internal routes) but cheap before more are added.

### [ARCH-028] `/api/revalidate` hardening — non-constant-time secret compare + swallowed parse errors
- **Severity:** Low
- **Category:** Error Handling / Config
- **File(s):** `src/app/api/revalidate/route.ts` (12, 16-25)
- **Status:** Open
- **Description:** `secret !== process.env.REVALIDATE_SECRET` is a non-constant-time comparison (minor timing side-channel; the `!process.env.REVALIDATE_SECRET ||` guard does fail closed — good). Separately, `.catch(() => ({}))` hides malformed webhook payloads and the route still returns 200 `{ revalidated: false }`, so a misconfigured MODX `OnDocFormSave` webhook fails silently (stale content).
- **Recommendation:** Use `crypto.timingSafeEqual`; log parse failures and return 400 when neither `path` nor `tag` is usable so the webhook side is observable.

### [ARCH-029] Minor typing casts — `FormData.get() as string` and unguarded `Record` coercion
- **Severity:** Low
- **Category:** TypeScript
- **File(s):** `src/app/contact/ContactForm.tsx` (23-26), `src/components/sections/Popups/index.tsx` (37-39), `src/components/sections/Contact/index.tsx` (40-41), `src/lib/api.ts` (184, 241, 254), `src/app/page.tsx` (190-191)
- **Status:** Open
- **Description:** `fd.get("comment") as string` casts a possibly-`null` optional field to `string` (the `required` attr only covers name/email/phone). In `api.ts`, list items are `Record<string, unknown>` coerced via `String(x.image ?? "")` with no `typeof` guard — a CMS field arriving as an object yields `"[object Object]"` pushed into `next/image`.
- **Recommendation:** Use `String(fd.get("comment") ?? "")`; guard `typeof v === "string"` (or zod-parse the list-item shape once, per ARCH-004) before coercing CMS values.

### [ARCH-030] Style/convention inconsistencies — export style, quotes, no barrels
- **Severity:** Low
- **Category:** Inconsistent Patterns
- **File(s):** `src/components/layout/Preloader-new/Preloader.tsx` (1, 119), `src/components/sections/*` / `ui/*` (deep imports), `src/app/page.tsx` (12-13, 16 import lines)
- **Status:** Open
- **Description:** `Preloader-new` uses `export default` + single-quoted `'use client'`/imports while every other component uses named `export function` + double quotes (see ARCH-010 for the rename). No `sections`/`ui` barrel exists, so route files carry long deep-import blocks (16 lines in `page.tsx`); page-specific `GardenHeading`/`LobbyHeading` live inside the reusable `ImageHeading/` folder. All minor/consistent, low impact.
- **Recommendation:** Normalize export style + quotes during the ARCH-010 rename. Optionally add `sections/index.ts`/`ui/index.ts` barrels to shorten import blocks; consider relocating the one-off home headings next to `app/page.tsx`.

---

*Run `/fix-audit-issue ARCH-00X` to address a specific finding.*
