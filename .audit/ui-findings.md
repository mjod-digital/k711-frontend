# UI/UX Audit Findings

**Date:** 2026-07-11
**Project:** k711 — fluid Next.js 16 / React 19 landing (SCSS Modules, "rubber" layout, Lenis smooth scroll, Swiper, mock apartments catalog), Russian-language
**Status:** In Review
**Method:** 5 parallel category audits (a11y, responsive, consistency, i18n/content/SEO, UX/forms), all findings verified against real file reads.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 8     |
| Medium   | 27    |
| Low      | 21    |
| **Total**| **57**|

### WCAG assessment
The codebase is unusually a11y-aware (per-line reveal + essentially every scroll animation respect `prefers-reduced-motion`; `Modal` has a full focus-trap + Esc + return-focus; MapVector `role="img"`; RangeSlider uses native `<input type=range>`; images carry `alt`; icon buttons carry `aria-label`; `lang="ru"`; favorites removal uses `role="status"`). Remaining gaps prevent a clean **AA** rating — chiefly: placeholder-only labels that fail contrast (UI-004), color-only form-error feedback (UI-005), sub-44px touch targets (UI-003), missing skip-link (UI-010), and unannounced filter status (UI-013). **Achieved: solid A, close to AA with the High/Medium a11y items fixed.**

### Positive baselines (verified — not defects)
- All 12 routes export metadata; `apartments/[id]` has per-apartment `generateMetadata`. Both self-hosted fonts fully cover Cyrillic (verified with fonttools); guillemets/em-dashes used correctly. Prices/areas locale-formatted via `toLocaleString("ru-RU")`.
- `Modal` closes via backdrop + Esc + button, locks body scroll AND stops Lenis, traps focus, returns focus. Favorites persist (zustand `persist`); favorites page has empty state + `aria-live`. Catalog has empty-results message, reset button, live range values, URL-synced filters. Active Preloader has a 10s hard fallback so it always dismisses.
- The rubber system is disciplined: `main { overflow-x: clip }` contains vw bleed; `--fvw: min(1vw, 14.4px)` freezes element sizes above 1440 nearly everywhere; no fixed-px widths (only the 768px breakpoint literal). Because everything scales off one artboard, squishing a viewport is a uniform zoom — so the 768↔1440 gap is a **legibility/touch** problem, not an overflow one.

---

## Findings

## CRITICAL

### [UI-001] Lead form reports success unconditionally; delivery can silently fail and `/api/lead` is a stub that never delivers
- **Severity:** Critical
- **Category:** UX
- **File:** `src/app/contact/ContactForm.tsx` (18-31); `src/components/sections/Contact/index.tsx` (35-46); `src/components/sections/Popups/index.tsx` (30-44); `src/lib/comagic.ts` (99, 116-120, 137); `src/app/api/lead/route.ts` (8, 39-41)
- **Line:** ContactForm.tsx:18-31; route.ts:8,39-41
- **Status:** Open
- **Description:** The site's entire conversion goal is broken. `sendLead()` is fire-and-forget (`comagic.ts:99` returns `void`) and every submit handler calls `openSuccess()` on the very next synchronous line, regardless of outcome. Both delivery channels fail silently: CoMagic is retried ~3s then abandoned with no signal and wrapped in `catch {}`; the `/api/lead` fetch swallows all errors with `.catch(() => {})`; and `/api/lead` itself only `console.log`s the lead and returns `{ ok: true }` with an explicit `// TODO: отправка письма`. So when a lead never leaves the browser (adblock blocking `cs.min.js`, network drop, CoMagic outage), the user still sees "вы записались на встречу… мы свяжемся с вами", and the lead is truly lost. Direct revenue leak with false confirmation.
- **Evidence:**
  ```js
  sendLead({ source: "contact", name, phone });
  openSuccess();          // fires no matter what sendLead did
  ```
  ```ts
  console.log("[lead]", lead);
  return NextResponse.json({ ok: true });   // TODO: отправка письма
  ```
- **Recommendation:** Make `sendLead` return `Promise<boolean>`; `await` it in each handler; only `openSuccess()` on confirmed delivery, else render an inline error ("Не удалось отправить заявку, попробуйте ещё раз или позвоните нам"). Implement real delivery in `/api/lead` (email/CRM) and treat it as the source of truth for the success/error decision. Also remove the PII `console.log` (see UI-033).

---

## HIGH

### [UI-002] Single 768px breakpoint creates an unreadable "squished-desktop" band (768–~1000px) and a hard legibility cliff
- **Severity:** High
- **Category:** Responsive
- **File:** `src/app/globals.scss` (165-201 mobile `--vw-screen:360` vs 74-163 desktop `--vw-screen:1440`); `src/styles/_breakpoints.scss` (3)
- **Line:** globals.scss:165-201
- **Status:** Open
- **Description:** At 768px (iPad portrait, which resolves to the **desktop** artboard since the query is `max-width:767.98px`) the whole 1440 layout is uniformly scaled to 768/1440 = 53%: body `--fs-p1`(20)→10.7px, `--fs-p2`(14)→7.5px, footer disclaimer `--fs-caption`(12)→6.4px, catalog rows→10.7px. Body/caption text falls below any readable floor across the entire 768–~950px band on every page. Conversely at 767px the mobile (360) artboard is stretched to 213%: `--fs-p1`(16)→34px, `--fs-h1`(44)→94px. A 1px viewport change (767→768) flips body text from 34px to 10.7px — a 3.2× discontinuity.
- **Evidence:** `@media (max-width: 767.98px){ :root{ --vw-screen:360; …} }` — nothing exists between the 360 and 1440 artboards.
- **WCAG:** 1.4.4 Resize Text (AA)
- **Recommendation:** Add an intermediate tablet regime. Minimum: raise the breakpoint to ~1024px so 768–1024 gets the mobile artboard stretched (large but readable) instead of the desktop artboard crushed. Better: a third `--vw-screen` tier for 768–1023, or clamp the minimum effective scale so `fluid()` never renders below design-size × a floor. Verify legibility at 768/800/900px in a real browser.

### [UI-003] Multiple mobile touch targets below the 44px minimum
- **Severity:** High
- **Category:** Responsive / Accessibility
- **File:** `src/components/layout/Header/Header.module.scss` (117-121, cluster gap 43); `src/components/ui/RangeSlider/RangeSlider.module.scss` (74-75, 81-82); `src/components/sections/ApartmentCatalog/ApartmentCatalog.module.scss` (289-292); `src/components/ui/Slider/Slider.module.scss` (160-165); `src/components/layout/Footer/Footer.module.scss` (62-70)
- **Line:** Header.module.scss:117-121
- **Status:** Open
- **Description:** On the 360 artboard `fluid(X)==X px`. Header burger/phone/favorite controls are `fluid(20)` icon + `fluid(8)` padding = **36px** square, separated by only `fluid(4)`=4px; on a 320px phone ~32px. Also sub-44px: RangeSlider thumbs (20px — hard to drag on touch), catalog favorite heart (20px), Slider arrows mobile (28px), footer text links. All below WCAG 2.5.5 / iOS 44px.
- **Evidence:** `.iconBtn{ @include mobile{ --icon-size:#{fluid(20)}; padding:fluid(8);} }` → 20+2×8 = 36px.
- **WCAG:** 2.5.5 Target Size (AAA) / 2.5.8 Target Size Minimum (AA, WCAG 2.2)
- **Recommendation:** Enforce `min-width/min-height:44px` (real px, not fluid) on mobile interactive controls, or grow padding to a 44px hit area (icon can stay small). Give the RangeSlider thumb a larger invisible hit area for reliable touch dragging.

### [UI-004] Form field labels exist only as low-contrast placeholders (fail 4.5:1)
- **Severity:** High
- **Category:** Accessibility
- **File:** `src/app/contact/contact.module.scss` (174-176); `src/app/contact/ContactForm.tsx` (34-67); `src/components/sections/Popups/Popups.module.scss` (78-80) with Popups form 49-71
- **Line:** contact.module.scss:174-176
- **Status:** Open
- **Description:** The contact form and booking-modal form have no visible `<label>`; the only visible label is placeholder text colored `--color-brown-light` (#b0725f) on cream `--color-badge-light` (#f4f2ea) ≈ **3.46:1**, below AA 4.5:1 for 14px. Low-vision sighted users (who can't use the `aria-label` fallback) cannot reliably read field names, and once typing begins the label disappears entirely. (The identical placeholder color on the dark home Contact panel passes — leave that one.)
- **Evidence:**
  ```scss
  .input::placeholder { color: var(--color-brown-light); } // #b0725f on #f4f2ea ≈ 3.46:1
  ```
- **WCAG:** 1.4.3 Contrast (Minimum) (AA); 3.3.2 Labels or Instructions (A)
- **Recommendation:** Darken placeholder/label to ≥4.5:1 on cream (e.g. `--color-brown-dark`/`--color-brown-medium`) and add a persistent visible `<label>` (or floating label). See UI-029 for the disappearing-label UX angle.

### [UI-005] Invalid-field feedback is color-only with the native message suppressed (no text, no `aria-invalid`, no `role="alert"`)
- **Severity:** High
- **Category:** UX / Accessibility
- **File:** `src/app/contact/ContactForm.tsx` (17); `src/app/contact/contact.module.scss` (193-195, 232-238); same pattern `src/components/sections/Contact/index.tsx` (34), `src/components/sections/Popups/index.tsx` (29)
- **Line:** ContactForm.tsx:17
- **Status:** Open
- **Description:** `onInvalidCapture={(e)=>e.preventDefault()}` suppresses the browser validation bubble; the only replacement is a `:user-invalid` border/label **color** shift to `--color-error` (#c0563c). No text message, no `aria-invalid`, no `role="alert"`/`aria-live`, no scroll-to-first-invalid. A keyboard/AT user who submits an empty form perceives nothing; a colorblind user gets no cue; everyone sees the button "do nothing" except a subtle tint — on the primary conversion form.
- **Evidence:** `&:user-invalid { border-bottom-color: var(--color-error); }` is the entire feedback; grep for `role="alert"|aria-live|aria-invalid` in the form files → 0 hits.
- **WCAG:** 3.3.1 Error Identification (A); 1.4.1 Use of Color (A)
- **Recommendation:** Either keep native validation, or render per-field Russian text errors with `aria-invalid` + `aria-describedby`, focus/scroll the first invalid field on submit, and pair color with icon/text.

### [UI-006] Google/Yandex verification files are at the repo root (not served) → site verification broken
- **Severity:** High
- **Category:** SEO
- **File:** `google47e61101149a0146.html`, `yandex_6c736b2aa4cb56d5.html` (both at repo root)
- **Line:** n/a
- **Status:** Open
- **Description:** Next.js only serves files from `public/` (plus app-router metadata files). These sit at the project root, so `/google47e61101149a0146.html` and `/yandex_…​.html` return 404 and Search Console / Yandex.Webmaster HTML-file verification fails — no access to indexing/coverage tools. `public/google*`/`public/yandex*` do not exist.
- **Recommendation:** Move both into `public/` (served at web root), or verify via Metrika/DNS and delete them.

### [UI-007] `robots.txt` at repo root (not served) and missing `Sitemap:` directive
- **Severity:** High
- **Category:** SEO
- **File:** `robots.txt` (repo root)
- **Line:** n/a
- **Status:** Open
- **Description:** Same non-served problem — `public/robots.txt` and `app/robots.ts` are both absent, so `/robots.txt` 404s. The file also only has bare `Allow: /` blocks with no `Sitemap:` line.
- **Recommendation:** Move to `public/robots.txt` or add `app/robots.ts`; include a `Sitemap:` reference (see UI-034).

### [UI-008] No OpenGraph / Twitter metadata and no OG image → broken social share previews
- **Severity:** High
- **Category:** SEO
- **File:** `src/app/layout.tsx` (29-44) and all pages
- **Line:** layout.tsx:29-44
- **Status:** Open
- **Description:** Grep across `src/` finds zero `openGraph`, `twitter`, or `metadataBase`. A premium real-estate landing shared to Telegram/WhatsApp/VK/social gets no title card, description, or preview image.
- **Recommendation:** Add `metadataBase` + `openGraph` (title/description/url/images 1200×630) and `twitter: "summary_large_image"` to root metadata; per-page OG can inherit.

### [UI-009] Dead legal/consent links (`href="#"`) — 6 occurrences, including legally required disclosures
- **Severity:** High
- **Category:** Accessibility / Content
- **File:** `src/components/layout/Footer/index.tsx` (77 Наш.Дом.РФ / проектная декларация, 81 Политика обработки ПД, 85 Согласие на обработку ПД); consent checkboxes `src/app/contact/ContactForm.tsx` (74/75), `src/components/sections/Contact/index.tsx` (71), `src/components/sections/Popups/index.tsx` (79)
- **Line:** Footer/index.tsx:77-85
- **Status:** Open
- **Description:** For a Russian real-estate site the проектная декларация and personal-data policy/consent are legal requirements; the consent checkboxes are `required` yet their "политикой конфиденциальности" link points to `#`. All six are dead anchors that jump to top and fulfill no purpose — a compliance risk plus a link-purpose failure for all users.
- **Evidence:** `<a href="#" className={styles.link}>политикой конфиденциальности</a>`
- **WCAG:** 2.4.4 Link Purpose (In Context) (A)
- **Recommendation:** Point each at the real PDF/page (or MODX-managed URL); remove the anchor rather than shipping dead `#` if a target doesn't yet exist.

---

## MEDIUM

### [UI-010] No skip-navigation link to bypass the repeated fixed header
- **Severity:** Medium
- **Category:** Accessibility
- **File:** `src/app/layout.tsx` (65-70)
- **Line:** 65-70
- **Status:** Open
- **Description:** Every page renders the fixed `Header` (burger, phone, phone-icon, logo, favorites, CTA — 6+ focusable controls) before `<main>`, with no "skip to content" link and no `id`/focus target on `<main>`. Keyboard/switch users tab through the whole header on every page load.
- **WCAG:** 2.4.1 Bypass Blocks (A)
- **Recommendation:** Add a visually-hidden-until-focused skip link as the first focusable element (`<a href="#main" class="skip-link">К содержанию</a>`) and give `<main id="main" tabIndex={-1}>`.

### [UI-011] Navigation drawer (Menu) doesn't move focus in, trap focus, or hide background
- **Severity:** Medium
- **Category:** Accessibility
- **File:** `src/components/layout/Header/Menu.tsx` (38-144; return-focus is handled at 125-129)
- **Line:** 133-144
- **Status:** Open
- **Description:** On open, focus stays on the burger; there is no focus move into the panel and no trap. Since `<Menu>` renders after `<header>`, Tab walks through the rest of the header and page content (covered by the opaque panel on mobile) before reaching menu links. Background is not `inert`/`aria-hidden`, so AT users can read the obscured page behind the drawer.
- **WCAG:** 2.4.3 Focus Order (A); 2.1.2 (drawer-as-modal)
- **Recommendation:** On open, move focus to the first menu link, trap Tab/Shift+Tab in the panel, and mark the rest of the page `inert` while `open` — mirror `Modal/index.tsx`.

### [UI-012] Mobile filters overlay is a modal without dialog semantics, scroll-lock, Lenis-stop, Esc, or focus management
- **Severity:** Medium
- **Category:** Accessibility / UX
- **File:** `src/components/sections/ApartmentCatalog/index.tsx` (339-373)
- **Line:** 352-373
- **Status:** Open
- **Description:** The full-screen "Фильтры" overlay is hand-rolled: no `role="dialog"`/`aria-modal`, no Escape, no focus move/trap, no return-focus to the trigger, no body scroll-lock, and it doesn't stop Lenis — so the page keeps scrolling behind the open panel and keyboard focus can wander to the hidden catalog. The shared `Modal` already solves all of this.
- **Evidence:** backdrop has only `onClick={()=>setFiltersOpen(false)}`; no scroll-lock `useEffect` for `filtersOpen` anywhere in the file.
- **WCAG:** 2.1.2 No Keyboard Trap / 2.4.3 Focus Order (A)
- **Recommendation:** Reuse `Modal` (or replicate its Esc + focus-trap + return-focus + `role="dialog"` + body/Lenis lock) for the mobile filters overlay.

### [UI-013] Filter result count / empty state is not announced (no `aria-live`)
- **Severity:** Medium
- **Category:** Accessibility
- **File:** `src/components/sections/ApartmentCatalog/index.tsx` (320-332)
- **Line:** 320-332
- **Status:** Open
- **Description:** Adjusting range sliders / bedroom tabs re-filters the list, but the match count and the "Нет квартир по заданным параметрам" empty state render in a plain `div`/`p` with no live region. Screen-reader users get no feedback that a filter changed results or that zero remain. (Favorites list and Location card already do this correctly.)
- **WCAG:** 4.1.3 Status Messages (AA)
- **Recommendation:** Add a visually-hidden `role="status" aria-live="polite"` region announcing e.g. `Найдено ${rows.length} квартир` (and the empty case) on filter change.

### [UI-014] Form inputs at 14px trigger iOS Safari auto-zoom on focus
- **Severity:** Medium
- **Category:** Responsive
- **File:** `src/components/sections/Popups/Popups.module.scss` (65-75); `src/app/contact/contact.module.scss` (170)
- **Line:** Popups.module.scss:65-75
- **Status:** Open
- **Description:** At 360px `fluid(14)`=14px. iOS Safari force-zooms whenever a focused `<input>` has `font-size < 16px`, producing a jarring zoom-in + horizontal shift on the booking popup, contact form, and PhoneInput; the user must pinch back out after each field.
- **Recommendation:** Set mobile input `font-size` to `16px` (fixed) or `max(16px, fluid(14))`; tune visuals with padding/letter-spacing.

### [UI-015] Location map uses `height: 100vh` (not `svh`/`dvh`) → mobile browser-chrome gap
- **Severity:** Medium
- **Category:** Responsive
- **File:** `src/components/sections/Location/Location.module.scss` (20)
- **Line:** 20
- **Status:** Open
- **Description:** The full-screen map is `100vh` = the largest viewport, so with the URL bar visible the map exceeds the visible area, pushing bottom-anchored UI (`.dropdownWrap bottom:fluid(8)`, `.card bottom:fluid(60)`) below the fold, and it jumps as the address bar shows/hides. Inconsistent with `Hero`, which uses `100svh`.
- **Evidence:** `.map { height: 100vh; overflow: hidden; }`
- **Recommendation:** Use `100svh` (or `100dvh`) to match Hero.

### [UI-016] Slider slide width `76vw` is uncapped above 1440 → aspect drift / over-crop on ultra-wide
- **Severity:** Medium
- **Category:** Responsive
- **File:** `src/components/ui/Slider/Slider.module.scss` (32, with 46)
- **Line:** 32
- **Status:** Open
- **Description:** The design freezes element sizes above 1440 via `--fvw: min(1vw,14.4px)`, but the slide opts out with raw `76vw`. On ultra-wide it keeps growing (2560px → ~1946px wide) while `.imageBox` height freezes at `fluid(680)`=680px, so effective aspect ratio drifts from ~1.6:1 (1440) to ~2.9:1 (2560), progressively over-cropping the photo — the one place the "freeze at 1440" promise breaks.
- **Evidence:** `.swiper .slide { width: 76vw; }`
- **Recommendation:** Cap to the frozen макет width, e.g. `width: min(76vw, fluid(1100))`.

### [UI-017] ApartmentCatalog renders the full desktop sidebar + 6-col table on 768px tablets (unusable filters)
- **Severity:** Medium
- **Category:** Responsive
- **File:** `src/components/sections/ApartmentCatalog/ApartmentCatalog.module.scss` (16, 176, 180)
- **Line:** 16
- **Status:** Open
- **Description:** Worst concrete instance of UI-002. The mobile catalog design (compact table + bottom "Фильтры" overlay) only activates below 768px; at exactly 768px the desktop layout renders at 53% — a ~190px dark filter sidebar with 10.7px RangeSlider labels ("Цена за 1 м² (тыс руб.)"), ~10.7px slider thumbs, and a 6-column table with 10.7px values. Filters are effectively unusable at iPad-portrait width despite a good mobile design existing one pixel away.
- **Recommendation:** Raise the mobile switch for this component (or globally per UI-002) so tablets get the touch overlay + compact table.

### [UI-018] No `error.tsx` / `global-error.tsx` boundary anywhere
- **Severity:** Medium
- **Category:** UX
- **File:** `src/app` (absence)
- **Line:** n/a
- **Status:** Open
- **Description:** Only `not-found.tsx` exists. No route-level `error.tsx` and no `global-error.tsx`, so any runtime error in a client component (Swiper, Lenis, catalog filtering, a bad CMS payload) bubbles to Next's default error screen / a blank page with no branded recovery. (Server fetches are defensively `.catch(()=>[])`, so the gap is the client render path.)
- **Recommendation:** Add a styled `src/app/error.tsx` (reset button + home link) and a `global-error.tsx`.

### [UI-019] No active-page indication in the menu or footer
- **Severity:** Medium
- **Category:** UX
- **File:** `src/components/layout/Header/Menu.tsx` (151-181); `src/components/layout/Footer/index.tsx` (29-45)
- **Line:** Menu.tsx:151-181
- **Status:** Open
- **Description:** Nav lists render plain `Link`s with no `usePathname`/`aria-current`/active class, so on any inner page the user has no indication of where they are within the 9-item menu. (Header uses `usePathname` only to lock its own visibility on `/apartments`.)
- **Recommendation:** Compare `usePathname()` to each `href`; mark the current item with `aria-current="page"` + active style.

### [UI-020] Phone input accepts incomplete numbers; RU-only, no country code
- **Severity:** Medium
- **Category:** UX
- **File:** `src/components/ui/PhoneInput/index.tsx` (8-19 mask, 32-56)
- **Line:** 32-56
- **Status:** Open
- **Description:** The field is `required` but has no `pattern`/`minLength`, and the mask returns a value for any digit count ≥1 — e.g. `"+7 (999)"` after 3 digits passes constraint validation and is sent to CRM, so typo'd/unreachable numbers become valid leads. Mask is hardcoded to `+7` (strips leading 7/8, caps at 10 digits) with no country-code option, blocking international buyers.
- **Recommendation:** Add `pattern="\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}"` (or validate 10 digits on submit) with a clear Russian message; consider an intl phone control.

### [UI-021] No loading/pending state; submit button never disabled during send
- **Severity:** Medium
- **Category:** UX
- **File:** `src/app/contact/ContactForm.tsx` (87-89); `src/components/sections/Contact/index.tsx` (83-85); `src/components/sections/Popups/index.tsx` (92-94)
- **Line:** ContactForm.tsx:87-89
- **Status:** Open
- **Description:** No `isSubmitting`/`disabled` state and no spinner (grep for `disabled|isSubmitting|isPending|aria-busy|useTransition` → 0 hits). Currently masked because `openSuccess()` immediately covers the form, but the button gives no in-flight feedback and becomes a real double-lead vector once UI-001's async fix lands.
- **Recommendation:** Introduce a pending state; disable the button and show a loading label while the awaited send is in flight.

### [UI-022] Apartment catalog: API failure is silently shown as "no results" (no error state)
- **Severity:** Medium
- **Category:** Consistency / UX
- **File:** `src/app/apartments/page.tsx` (16-18); empty message `src/components/sections/ApartmentCatalog/index.tsx` (329-331)
- **Line:** apartments/page.tsx:16-18
- **Status:** Open
- **Description:** `const apartments = await fetchApartments()...catch(() => []);` — on CRM/API failure the page renders an empty array, displayed via the empty-filter message "Нет квартир по заданным параметрам". A fetch error is indistinguishable from a legitimately empty filter result. Same silent-empty pattern for the favorites apartment source.
- **Recommendation:** Distinguish `fetch failed` from `zero results`; render a distinct error state ("Не удалось загрузить каталог, попробуйте позже") when the fetch throws.

### [UI-023] Spacing scale `--space-*` is essentially unused (1068 raw `fluid()` calls vs 1 token use)
- **Severity:** Medium
- **Category:** Consistency
- **File:** `src/app/globals.scss` (148-156 tokens) vs all `src/**/*.module.scss`
- **Line:** globals.scss:148-156
- **Status:** Open
- **Description:** `--space-2xs … --space-section` + `--space-s8` are defined with desktop+mobile values, but `var(--space-…)` appears exactly once (`Section.module.scss:2`). The other 1068 spacing occurrences are raw `fluid(NN)`, so there's no enforced rhythm and mobile overrides are re-implemented per file.
- **Recommendation:** Adopt `--space-*` for margins/paddings/gaps. Map `fluid(16)`→`--space-xs`, `fluid(24)`→`--space-s`, `fluid(40)`→`--space-m`, `fluid(64)`→`--space-l`, `fluid(96)`→`--space-xl`, `fluid(48)`→`--space-s8`. Standardize section vertical padding on `--space-section` (currently varies 60/68/80/128/145: Surroundings.module.scss:8, HistoricCenter.module.scss:11, amenities.module.scss:15, contact.module.scss:77, Residences.module.scss:133).

### [UI-024] `--radius` token unused and mis-valued; radii scattered as raw 1/2/3/4px
- **Severity:** Medium
- **Category:** Consistency
- **File:** `src/app/globals.scss` (162, `--radius:#{fluid(12)}`); usages contact.module.scss:222, Contact.module.scss:160, Popups.module.scss:124 (`1px`), ApartmentCard.module.scss:182,247 + ApartmentCatalog.module.scss:361 (`fluid(2)`), favorites.module.scss:71 (`fluid(4)`), Menu.module.scss:86 (`fluid(3)`)
- **Line:** globals.scss:162
- **Status:** Open
- **Description:** `var(--radius)` is referenced nowhere; every radius is a raw literal, and the token's 12px value matches no real usage (real radii are 1–4px), so the token is both unused and wrong.
- **Recommendation:** Replace with a small real scale (`--radius-xs:#{fluid(1)}`, `--radius-s:#{fluid(2)}`) and apply.

### [UI-025] Hardcoded colors duplicating existing tokens
- **Severity:** Medium
- **Category:** Consistency
- **File:** `src/components/sections/ApartmentCatalog/ApartmentCatalog.module.scss` (227 `#ece7de` = `--color-apt-mob`); `src/components/sections/Hero/Hero.module.scss` (53 `#1b090b`), `src/components/sections/PageHero/PageHero.module.scss` (107) = `--color-brown-dark-3`; gradient rgba/rgb duplicating tokens in ConnectBlock (47-55), Hero (67-68), Scenario (50-51), Modal (23), Location (426, 350), ApartmentCatalog (362), Menu (43, 46), Preloader-new
- **Line:** ApartmentCatalog.module.scss:227
- **Status:** Open
- **Description:** Numerous literals duplicate a token's exact value, so a palette change won't propagate; rgb syntax is also split (11 modern `rgb(a b c / x%)` vs 15 legacy `rgba(a,b,c,x)`).
- **Recommendation:** Replace with tokens; for transparency use `color-mix(in srgb, var(--color-…) X%, transparent)` or `rgb(from var(--color-…) r g b / X%)`. Standardize on one rgb syntax.

### [UI-026] Undocumented hardcoded colors (no matching token), repeated
- **Severity:** Medium
- **Category:** Consistency
- **File:** `#2b140c` ×3 (favorites.module.scss:122, not-found.module.scss:175, Popups.module.scss:205); `#d5d3cc` ×3 (favorites.module.scss:70,98, ApartmentCard.module.scss:101); `#210303` ×3 (PageHero.module.scss:121-122, PhotoCards.module.scss:78-79, ResidenceStats.module.scss:85-86); one-offs `#f1f2f2` (Footer.module.scss:8), `#A08B85` (ApartmentCard.module.scss:159), `#8b5b4c` (ApartmentCatalog.module.scss:228)
- **Line:** multiple
- **Status:** Open
- **Description:** Recurring off-token colors with no variable, so they can't be themed and drift over time.
- **Recommendation:** Introduce tokens: `--color-text-strong:#2b140c`, `--color-divider:#d5d3cc`, `--color-overlay-dark:#210303`; map `#A08B85`→`--color-muted`; tokenize the rest.

### [UI-027] Page-hero H1 words bypass `--fs-h1`, with inconsistent 110 vs 120 values
- **Severity:** Medium
- **Category:** Consistency
- **File:** `fluid(110)` in favorites.module.scss:23, apartments.module.scss:17, architecture.module.scss:25, Author.module.scss:94; `fluid(120)` in improvement.module.scss:25, amenities.module.scss:54, DesignBureau.module.scss:99, HistoricCenter.module.scss:32
- **Line:** multiple
- **Status:** Open
- **Description:** The same "giant hero word" role is rendered at 110 or 120 depending on file, with divergent mobile overrides (28/44/36), while `--fs-h1` (120/44) already encodes this. ~130 raw `font-size: fluid()` calls bypass the `--fs-*` scale overall.
- **Recommendation:** Use `var(--fs-h1)` for hero words; if 110 is intentional add a dedicated token instead of repeating the literal.

### [UI-028] CTA styling split between shared mixins and bespoke buttons; duplicated heart SVG
- **Severity:** Medium
- **Category:** Consistency
- **File:** mixins `src/styles/_breakpoints.scss` (43-118, used 13×) vs bespoke `Contact.module.scss:~199`, `contact.module.scss:252`, ApartmentCatalog `.tab/.reset/.filtersTrigger/.close`, favorites `.delete/.book`, Location `.route/.call`; duplicated `HeartIcon` path in `FavoriteButton/index.tsx:32` and `ApartmentCatalog/index.tsx:81`
- **Line:** _breakpoints.scss:43-118
- **Status:** Open
- **Description:** Primary/secondary CTAs are sometimes `@include ctaPrimary/ctaSecondary` and sometimes bespoke, so hover/focus/active states and the focus ring differ per call site; `BookButton`/`FavoriteButton` are behavior-only wrappers that carry no shared visual style. The heart SVG is duplicated verbatim.
- **Recommendation:** Route all primary/secondary CTAs through the mixins; extract the heart SVG into one shared icon component.

### [UI-029] Forms use placeholder as the only visible label (label disappears on input)
- **Severity:** Medium
- **Category:** Content / UX
- **File:** `src/app/contact/ContactForm.tsx` (34-67); `src/components/sections/Contact/index.tsx` (49-63); `src/components/sections/Popups/index.tsx` (49-71); `src/components/ui/PhoneInput/index.tsx`
- **Line:** ContactForm.tsx:34-67
- **Status:** Open
- **Description:** Name/Email/Phone/Comment have only `placeholder` for the visible label — once the user types, the field's purpose vanishes. Screen readers are covered (`aria-label` present), so this is a visual/UX issue distinct from the contrast failure in UI-004.
- **Recommendation:** Add persistent visible labels or a floating-label pattern.

### [UI-030] Residence count contradicts itself: 46 vs 49 on the same page
- **Severity:** Medium
- **Category:** Content
- **File:** `src/app/residences/page.tsx` (101, `number:"49"`) vs "46 резиденций" everywhere (page.tsx:28,96; residences/page.tsx:19; ResidenceIntro.tsx:10; Residences/index.tsx:14)
- **Line:** residences/page.tsx:101
- **Status:** Open
- **Description:** The `ResidenceStats` block shows "49 резиденций", contradicting the intro paragraph and meta on the same page (all say 46).
- **Recommendation:** Change "49" → "46" (or reconcile the true count everywhere).

### [UI-031] Phone number inconsistency (two different numbers, one an obvious placeholder)
- **Severity:** Medium
- **Category:** Content
- **File:** `src/config/site.ts` (7, `+7 (495) 678-34-12` — Header/Footer/Menu) vs `src/lib/api.ts` (141, `+7 (495) 123-45-67` — contact-page fallback, also baked into fallback meta at 151)
- **Line:** site.ts:7 / api.ts:141
- **Status:** Open
- **Description:** Header/footer/menu show one number; the contact page (on preview/mock or CMS failure) shows another placeholder-looking `123-45-67`.
- **Recommendation:** Single source of truth for the real sales phone.

### [UI-032] Brand spelling is inconsistent across titles/content
- **Severity:** Medium
- **Category:** Content / SEO
- **File:** `k711` (title suffix, `siteConfig.name`), `k 7/11` (alt/body, 15 files), Cyrillic `К7/11` (home title/meta, manifest, headings)
- **Line:** n/a
- **Status:** Open
- **Description:** Three brand spellings coexist; SEO titles end "— k711" while copy says "К7/11" / "k 7/11", weakening brand consistency in search results and share cards.
- **Recommendation:** Standardize the brand string used in `<title>`/OG.

### [UI-033] `console.log` in production API logs user PII
- **Severity:** Medium
- **Category:** Content / Privacy
- **File:** `src/app/api/lead/route.ts` (39)
- **Line:** 39
- **Status:** Open
- **Description:** `console.log("[lead]", lead)` writes name, phone, email, comment to server logs on every submission (server-side in prod) — left-in debug + privacy exposure. (See UI-001: the route also never actually delivers the lead.)
- **Recommendation:** Remove the log or gate behind `NODE_ENV !== "production"` and redact PII.

### [UI-034] No sitemap
- **Severity:** Medium
- **Category:** SEO
- **File:** absence of `public/sitemap.xml` / `app/sitemap.ts`
- **Line:** n/a
- **Status:** Open
- **Description:** 11 static routes + dynamic `apartments/[id]` are uncovered by any sitemap.
- **Recommendation:** Add `app/sitemap.ts` enumerating routes + apartment ids.

### [UI-035] Home `<title>` double-brands and ends awkwardly
- **Severity:** Medium
- **Category:** SEO
- **File:** `src/app/page.tsx` (26, 31-37); template `src/app/layout.tsx` (32)
- **Line:** page.tsx:26
- **Status:** Open
- **Description:** `generateMetadata` returns `title` as a string, so the root template `%s — k711` applies, producing `"К7/11 — клубный семейный дом… — k711"` — brand twice, a trailing period, then the suffix.
- **Recommendation:** Return `title: { absolute: c.meta.title || FALLBACK }` for the home page to bypass the template.

### [UI-036] Placeholder site config leaks into default SEO
- **Severity:** Medium
- **Category:** SEO
- **File:** `src/config/site.ts` (3-5); consumed at `src/app/layout.tsx` (34)
- **Line:** site.ts:3-5
- **Status:** Open
- **Description:** `description: "Резиновый лендинг на Next.js с SCSS-модулями и контентом из MODX."` is developer boilerplate but is the root `metadata.description` (fallback for any page without its own, e.g. the 404). `url: "https://example.com"` is a leftover placeholder and `metadataBase` is unset.
- **Recommendation:** Replace description with real marketing copy; set `url` to the production domain; add `metadataBase`.

---

## LOW

### [UI-037] No `scroll-padding-top` for the fixed header; anchor jumps don't move focus
- **Severity:** Low
- **Category:** Accessibility
- **File:** `src/app/globals.scss` (7-9 html); anchor handler `src/components/layout/SmoothScroll.tsx` (37-47)
- **Line:** globals.scss:7-9
- **Status:** Open
- **Description:** No `scroll-padding-top`, so tabbing to a top element or following an in-page anchor lands the target under the ~68px (46px mobile) fixed header. The Lenis anchor handler calls `lenis.scrollTo(dest)` without a header offset and without moving focus, so keyboard users lose their place.
- **WCAG:** 2.4.11 Focus Not Obscured (Minimum) (AA, WCAG 2.2)
- **Recommendation:** Add `html { scroll-padding-top: var(--header-h); }`, pass an equivalent `offset` to `lenis.scrollTo`, and focus the destination after scrolling.

### [UI-038] Weak focus indicator on text inputs (outline removed, replaced by subtle 1px border tint)
- **Severity:** Low
- **Category:** Accessibility
- **File:** `src/app/contact/contact.module.scss` (177-180); `src/components/sections/Contact/Contact.module.scss` (111-114); `src/components/sections/Popups/Popups.module.scss` (81-84)
- **Line:** contact.module.scss:177-180
- **Status:** Open
- **Description:** Inputs set `outline:none` on `:focus`, replaced only by a 1px bottom-border shift between similar browns — technically visible but hard to perceive, especially medium→light on the dark Contact panel. (Buttons correctly use strong `:focus-visible` rings.)
- **WCAG:** 2.4.7 Focus Visible (AA)
- **Recommendation:** Use `:focus-visible` with a clearly visible indicator (2px ring/box-shadow or a thick high-contrast underline).

### [UI-039] Swiper slider lacks A11y/Keyboard modules and position indicator; loop clones repeat alt/captions
- **Severity:** Low
- **Category:** Accessibility / UX
- **File:** `src/components/ui/Slider/index.tsx` (36-40 duplication, 118-128 only `Navigation` module)
- **Line:** 118-128
- **Status:** Open
- **Description:** Only `Navigation` is loaded — no `A11y` (slide changes unannounced, no roledescription), no `Keyboard` (arrow keys don't drive it), no `Pagination` (no position/length cue). The code also duplicates the slide array to ≥6 and then `loop` clones further, so the same captioned images repeat in the DOM and are read multiple times.
- **WCAG:** 4.1.2 Name/Role/Value; 4.1.3 Status Messages
- **Recommendation:** Add Swiper `A11y` + `Pagination` (and consider `Keyboard`); mark cloned/non-active slides `aria-hidden`.

### [UI-040] Apartments catalog is a div/span faux-table without table semantics; row label omits price columns
- **Severity:** Low
- **Category:** Accessibility
- **File:** `src/components/sections/ApartmentCatalog/index.tsx` (186-208 row, 312-319 header)
- **Line:** 186-208
- **Status:** Open
- **Description:** The catalog is CSS-grid `div`/`span` cells with no table roles, so column headers (Этаж, Спальни, площадь, Стоимость м², стоимость) aren't associated with values. Each row is one overlay `<Link>` whose `aria-label` describes floor/bedrooms/area but omits both price columns, so SR users browsing by links never hear the prices sighted users see.
- **WCAG:** 1.3.1 Info and Relationships (A)
- **Recommendation:** Use real table semantics (`role="table"/row/columnheader/cell` or `<table>`), or include price-per-m² and total in the row `aria-label`.

### [UI-041] Z-index values don't form a documented scale; active preloader is a magic `9999`
- **Severity:** Low
- **Category:** Consistency
- **File:** Header.module.scss:6 (100), Menu.module.scss:12 (90), Modal.module.scss:6 (200), Preloader-new/Preloader.module.scss:8 (**9999**), ApartmentCatalog.module.scss:323/375 (80/95)
- **Line:** Preloader-new/Preloader.module.scss:8
- **Status:** Open
- **Description:** Comments imply an intended scale, but the active preloader uses `9999` off that scale (the dead old preloader used the "correct" 200). No central z-index map.
- **Recommendation:** Define z-index tokens (`--z-header:100; --z-menu:90; --z-modal:200; --z-preloader:300;`) and replace literals; drop `9999`.

### [UI-042] Transition timing/easing has no tokens; durations vary for similar interactions
- **Severity:** Low
- **Category:** Consistency
- **File:** across modules — `0.3s` (×10), `0.45s` (×7, the CTA-mixin standard), `0.55s`, `0.35s`, `0.25s`, `0.5s`, `1s`; reveal `1300ms`/`900ms` with `220ms`/`140ms` stagger; easings mix `ease`/`linear`/`cubic-bezier(.22,1,.36,1)`
- **Line:** n/a
- **Status:** Open
- **Description:** No duration/easing tokens, so similar interactions animate at different speeds.
- **Recommendation:** Add `--dur-fast:.3s; --dur-base:.45s; --ease-out:cubic-bezier(.22,1,.36,1)` and standardize.

### [UI-043] `Section` UI component (and its sole spacing-token usage) is dead code
- **Severity:** Low
- **Category:** Consistency
- **File:** `src/components/ui/Section/index.tsx` + `Section.module.scss`
- **Line:** n/a
- **Status:** Open
- **Description:** `grep "ui/Section"` across `.tsx/.ts` returns zero imports; it's never rendered (and is the only consumer of `--space-section`).
- **Recommendation:** Adopt `<Section>` as the section wrapper across pages, or delete it.

### [UI-044] Redundant, overridden `color` declaration
- **Severity:** Low
- **Category:** Consistency
- **File:** `src/components/sections/ApartmentCard/ApartmentCard.module.scss` (117, overridden by 121)
- **Line:** 117
- **Status:** Open
- **Description:** `.specRow` sets `color: var(--color-brown-dark-2)` (117) then `color: var(--color-brown-medium)` (121); the first is dead.
- **Recommendation:** Remove the line 117 declaration.

### [UI-045] `StayHeading` duplicated verbatim in 3 directories
- **Severity:** Low
- **Category:** Consistency
- **File:** `src/app/design/StayHeading.tsx`, `src/app/technologies/StayHeading.tsx`, `src/app/residences/StayHeading.tsx` (byte-identical; SCSS differ by one line)
- **Line:** n/a
- **Status:** Open
- **Description:** Three identical copies of the same component.
- **Recommendation:** Extract one shared prop-driven `StayHeading` and delete the copies.

### [UI-046] `SilenceHeading` duplicated (page-local vs shared)
- **Severity:** Low
- **Category:** Consistency
- **File:** `src/app/improvement/SilenceHeading.{tsx,module.scss}` vs `src/components/sections/SilenceHeading/{index.tsx,SilenceHeading.module.scss}`
- **Line:** n/a
- **Status:** Open
- **Description:** Two near-identical cascade-heading implementations (also overlaps conceptually with `ui/CascadeHeading` and `sections/CenterHeading`).
- **Recommendation:** Consolidate to the shared `sections/SilenceHeading` (props-driven) and remove the page-local copy.

### [UI-047] Dead legacy `Preloader` directory still in the tree
- **Severity:** Low
- **Category:** Consistency
- **File:** `src/components/layout/Preloader/` (old) vs `src/components/layout/Preloader-new/` (active, imported at layout.tsx:7,66)
- **Line:** n/a
- **Status:** Open
- **Description:** `grep` for imports of the old `@/components/layout/Preloader` → none; it's unreferenced dead code (z-index 200), causing confusion with the active `-new`.
- **Recommendation:** Delete `src/components/layout/Preloader/`; rename `Preloader-new` → `Preloader`.

### [UI-048] Header favorites shows only a presence dot, not the count
- **Severity:** Low
- **Category:** UX
- **File:** `src/components/layout/Header/index.tsx` (119-121; count at 13)
- **Line:** 119-121
- **Status:** Open
- **Description:** `favCount` is computed but rendered only as a binary dot; the number lives solely in the `aria-label`, so sighted users can't tell 2 saved from 12.
- **Recommendation:** Render a numeric badge when `favCount > 0`.

### [UI-049] No `loading.tsx` for the async pages
- **Severity:** Low
- **Category:** UX
- **File:** `src/app/apartments/page.tsx`, `src/app/favorites/page.tsx`, `src/app/contact/page.tsx`
- **Line:** n/a
- **Status:** Open
- **Description:** These `await fetch(...)` at request time (ISR 60s); on a cold cache / background revalidation there's no skeleton. Low impact given caching.
- **Recommendation:** Optional `loading.tsx` skeletons for perceived performance.

### [UI-050] Individual favorite removal is one-click with no undo
- **Severity:** Low
- **Category:** UX
- **File:** `src/app/favorites/FavoritesList.tsx` (58)
- **Line:** 58
- **Status:** Open
- **Description:** The per-card "удалить" removes instantly with no undo/toast; re-adding requires finding the flat again. (No bulk "clear all" exists in UI, so no destructive bulk action to guard.)
- **Recommendation:** Consider an undo affordance on removal.

### [UI-051] Booking modal uses viewport-height positioning; submit can sit under the mobile keyboard
- **Severity:** Low
- **Category:** Responsive
- **File:** `src/components/ui/Modal/Modal.module.scss` (3-5, 32); submit `src/components/sections/Popups/Popups.module.scss` (149)
- **Line:** Modal.module.scss:3-5
- **Status:** Open
- **Description:** The modal centers in the layout viewport (not `dvh`); when the on-screen keyboard opens the panel doesn't shrink to the visual viewport, so the bottom "отправить" button can be occluded (recoverable by scrolling since panel is `overflow-y:auto`, but not smooth).
- **Recommendation:** Constrain the panel to `max-height:100dvh` (minus padding); optionally `scroll-margin` on the focused field.

### [UI-052] Footer mobile logo is absolutely positioned with a fixed 255px bottom offset (fragile overlap)
- **Severity:** Low
- **Category:** Responsive
- **File:** `src/components/layout/Footer/Footer.module.scss` (131-138)
- **Line:** 131-138
- **Status:** Open
- **Description:** On mobile the MR Private logo is `position:absolute; bottom:fluid(255); right:fluid(70)`, decoupled from flow. The justified disclaimer above can wrap to different heights on narrow/localized widths; a taller disclaimer would overlap the fixed-offset logo.
- **Recommendation:** Keep the logo in flow on mobile (block with margin/order), or reserve a fixed disclaimer height.

### [UI-053] `not-found.tsx` has no metadata
- **Severity:** Low
- **Category:** SEO / Content
- **File:** `src/app/not-found.tsx`
- **Line:** n/a
- **Status:** Open
- **Description:** The 404 title falls back to the bare default `k711` instead of e.g. "Страница не найдена — k711".
- **Recommendation:** Add `export const metadata`.

### [UI-054] Leftover create-next-app assets in `public/`
- **Severity:** Low
- **Category:** Content
- **File:** `public/next.svg`, `public/vercel.svg`, `public/window.svg`, `public/globe.svg`, `public/file.svg` (0 references)
- **Line:** n/a
- **Status:** Open
- **Description:** Unused scaffolding assets shipped in the public directory.
- **Recommendation:** Delete.

### [UI-055] Dead `siteConfig.nav` (`/about` route doesn't exist)
- **Severity:** Low
- **Category:** Content
- **File:** `src/config/site.ts` (14-18)
- **Line:** 14-18
- **Status:** Open
- **Description:** `siteConfig.nav` (including `/about`, which has no route) is never rendered — dead config that risks future accidental use.
- **Recommendation:** Remove or wire it to the real nav.

### [UI-056] `font-display: swap` causes a font-swap flash (FOUT)
- **Severity:** Low
- **Category:** Content
- **File:** `src/app/layout.tsx` (18, 26)
- **Line:** 18
- **Status:** Open
- **Description:** Both fonts use `display: swap`, causing a visible swap flash. Fallbacks have Cyrillic so no tofu; acceptable, but the display serif swap can be jarring.
- **Recommendation:** Consider `optional`/`fallback` for the display font if the swap is noticeable.

### [UI-057] No `hanging-punctuation`; global `hyphens`/`overflow-wrap` absent for long Cyrillic words
- **Severity:** Low
- **Category:** Content
- **File:** only `src/components/sections/SpaceSplit/SpaceSplit.module.scss` (63-64) sets `overflow-wrap`/`hyphens`
- **Line:** SpaceSplit.module.scss:63-64
- **Status:** Open
- **Description:** Long unbroken Cyrillic words in narrow columns won't hyphenate/wrap by default. Low impact given controlled `white-space:nowrap` headings, but worth a global safeguard.
- **Recommendation:** Add a global `overflow-wrap: break-word` on body copy (and consider `hanging-punctuation`).

---

## Notes for remediation
- Fix **UI-001** first — it silently loses the site's leads with a false success screen (business-critical).
- The **High** cluster splits into two themes: fluid-system edge cases (UI-002, UI-003) and form/SEO correctness (UI-004..UI-009). The SEO items (UI-006/007/008) are quick, high-leverage config moves.
- Run `/fix-audit-issue <ID>` to fix a specific finding.
