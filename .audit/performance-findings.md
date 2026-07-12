# Performance Audit — k711

**Project:** k711 (Next.js 16.2.9 / React 19, SCSS Modules, Zustand, Lenis, Swiper)
**Date:** 2026-07-11

> Consolidated from three parallel sub-audits: build/infrastructure, frontend runtime, and state/memory-leak. Findings are de-duplicated and renumbered PERF-001…

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2     |
| High     | 5     |
| Medium   | 8     |
| Low      | 8     |
| **Total**| **23**|


### Remediation status (2026-07-11)

Fully fixed: **11** (PERF-001, 003, 007, 008, 009, 011, 013, 014, 015, 016, 017). Partially fixed: **2** (PERF-022, 023). Flagged (needs tooling / decision / design sign-off): **10** (PERF-002, 004, 005, 006, 010, 012, 018, 019, 020, 021).

Remaining open by severity — Critical: 1 (PERF-002), High: 3 (PERF-004/005/006), Medium: 2 (PERF-010/012), Low: 4 (PERF-018/019/020/021).

**Headline:** `public/` is ~604 MB (567 MB images), all committed to git (`.git` ≈ 542 MB). Photographic heroes are stored as 10–24 MB lossless PNGs at up to 4096px, and the LCP hero is served through a raw unoptimized `<img>`, bypassing `next/image` entirely. These two facts dominate every load, deploy, and Core Web Vitals score.

---

## Critical

### PERF-001 — Hero LCP image bypasses all optimization via raw `<img>`
- **Status:** ✅ Fixed
- **Resolution:** HeroImage rewritten to `getImageProps()` + `<picture>` — both crops now go through the optimizer (AVIF/WebP, per-width resize); `<img data-hero>` preserved for the preloader. Needs visual QA of mobile/desktop crop.
- **File:** `src/components/ui/HeroImage/index.tsx:19-33` (used on homepage + every inner page, e.g. `src/app/page.tsx:201`)
- **Impact:** When `imageMobile` is set (true on the homepage and every inner page), the LCP hero renders through a `<picture>` + raw `<img src={image}>` — **no resizing, no WebP/AVIF, no responsive srcset**. Source hero assets are `improvement-hero.png` 19 MB, `location-hero.png` 11.5 MB, `arch-hero.png` 11.4 MB, `amenities-hero.png` 11.9 MB, `residences-hero.png` 10.2 MB. Whatever the CMS returns is delivered full-resolution as the LCP element. Single largest LCP risk on the site.
- **Fix:** Route both branches through `next/image` (two `<Image>` toggled by CSS `@media`, or one `<Image fill priority sizes="100vw">` with `object-position` for art-direction). If `<picture>` art-direction is mandatory, at minimum route both sources through the optimizer (`/_next/image?url=…&w=…`) with a `srcSet`. Pre-compress source heroes to <500 KB.

### PERF-002 — Photographic images stored as multi-MB PNG at up to 4096px
- **Status:** ⚠️ Flagged (tooling)
- **Resolution:** Recompress the 567 MB PNG tree to WebP/AVIF ≤2560px via an image pipeline (sharp/cwebp/sips) + reference updates — not auto-applied (would rewrite many `src` refs; needs visual QA). Partial mitigation shipped: config now emits AVIF/WebP + 31-day cache so `next/image` downsizes on demand.
- **File:** `public/images/` (88 PNGs; e.g. `public/images/design/pair-soft-zone.png` 24 MB, `public/images/improvement-hero.png` 18 MB, `public/images/garden.png` 18 MB, `public/images/lobby.png` 16 MB)
- **Impact:** Photos saved as lossless PNG at 3277×4096 / 4096×2304 — worst format/size combo. 567 MB total. Each ~24 MB PNG re-encodes to ~300–800 KB WebP/AVIF at equal quality (~95% reduction). Even where `next/image` is used, the self-hosted `next start` origin must load and re-encode each 10–24 MB source PNG with sharp on first request per size — heavy CPU/RAM, slow first paint, and the whole tree bloats every clone/CI checkout/blue-green deploy.
- **Fix:** Pre-process all source assets to WebP/AVIF at a sane max dimension (~2560px). `public/images` should drop from 567 MB to well under 50 MB. Keep the pre-compressed files as source of truth and let `next/image` resize from there.

---

## High

### PERF-003 — `loading="eager"` on 24 image sites defeats lazy-loading
- **Status:** ✅ Fixed
- **Resolution:** `loading="eager"` removed from 16 below-fold section images across 15 files; Slider (Swiper), GalleryStrip (pinned) and the hero correctly kept eager.
- **File:** 24 occurrences across `Slider`, `GalleryStrip`, `Showcase`, `Scenario`, `Terraces`, `Presentation`, `ImageHeading`, `ConnectBlock`, `Contact`, `Author`, `PhotoCards`, `ResidenceStats`, `DesignBureau`, `Residences`, `SpaceSplit`, `FeatureScreen`, `ApartmentCard` (e.g. `src/components/sections/Showcase/index.tsx:306`, `src/components/ui/GalleryStrip/index.tsx:184`, `src/components/sections/Scenario/index.tsx:44`)
- **Impact:** Every section image loads immediately instead of lazily. Combined with a 567 MB image tree and 10–19 MB PNGs, this floods the network at first paint, competing with the LCP hero for bandwidth.
- **Fix:** Remove `loading="eager"` from all below-the-fold images (let `next/image` lazy-load by default). Keep eager/`priority` only on the hero and first visible section. For Swiper clones that render blank when lazy, use Swiper's `lazy` + adjacent-slide preload instead of forcing all eager.

### PERF-004 — ~11 independent scroll listeners each read layout every frame (cross-component layout thrashing)
- **Status:** ⚠️ Flagged (risky refactor)
- **Resolution:** Consolidating ~11 scroll listeners into one batched read→write rAF loop is a large architectural change with real regression risk on the scroll animations — deferred to dedicated work with QA.
- **File:** Header `src/components/layout/Header/index.tsx:35-51`, Hero `src/components/sections/Hero/index.tsx:50-59`, Scenario `src/components/sections/Scenario/index.tsx:22-33`, Showcase `src/components/sections/Showcase/index.tsx:159-184`, Terraces `src/components/sections/Terraces/index.tsx:108-128`, Presentation `src/components/sections/Presentation/index.tsx`, GalleryStrip `src/components/ui/GalleryStrip/index.tsx:111-153`, 4× Slider parallax `src/components/ui/Slider/index.tsx:79-91`
- **Impact:** Lenis drives native scroll every animation frame, so all ~11 handlers fire continuously during smooth scroll. Each does a `getBoundingClientRect()`/`offsetHeight` read then a style write, in separate rAF callbacks — the interleaved read→write→read→write forces up to ~11 synchronous layout recalcs per scroll frame. Dominant INP/scroll-jank cost.
- **Fix:** Consolidate into one shared scroll/rAF loop (a small `ScrollProvider`) that batches all reads first, then all writes. Better, drive transforms off a single shared Lenis `scroll` callback + IntersectionObserver instead of per-component `window` scroll listeners.

### PERF-005 — No code-splitting; every heavy client component ships in the initial bundle
- **Status:** ⚠️ Flagged (needs decision)
- **Resolution:** `next/dynamic` for below-fold sections: `ssr:false` removes CMS content from SSR HTML (SEO tradeoff); `ssr:true` helps TBT but may flash non-interactive. Needs a product decision on SSR vs code-split before applying.
- **File:** `src/app/page.tsx:1-18` (and all `src/app/*/page.tsx`)
- **Impact:** `grep` for `next/dynamic` returns zero matches. The homepage statically imports ~20 `"use client"` sections including 4 Swiper `<Slider>` instances, `GalleryStrip`, `Location` (large inline SVG map + drag logic), `Showcase`. Swiper (~40 KB gz) plus all section JS is parsed on first load even though most sections are far below the fold.
- **Fix:** `next/dynamic(() => import(...), { ssr: false })` for below-the-fold interactive sections (4 Sliders, GalleryStrip, Location, Terraces, Presentation). Keep Hero/Statement static for LCP.

### PERF-006 — 37 MB PDF committed and served from `public/`
- **Status:** ⚠️ Flagged (tooling)
- **Resolution:** Compress the 37 MB PDF (`ghostscript -dPDFSETTINGS=/ebook`) and/or move it to the whitelisted `s3.mastertel.ru` CDN. Now benefits from the immutable cache header (PERF-009) in the meantime.
- **File:** `public/pdf/klimashkina711.pdf` (38.4 MB)
- **Impact:** A 37 MB file served by the Node origin (no CDN in this blue-green setup) blocks a worker per download and bloats repo/deploy.
- **Fix:** Compress (Ghostscript `-dPDFSETTINGS=/ebook`, typically 60–80% off) and/or move to the already-whitelisted `s3.mastertel.ru` CDN. Link out rather than serving from origin.

### PERF-007 — `figma-tmp` leftover directory tracked in git despite `.gitignore`
- **Status:** ✅ Fixed
- **Resolution:** `git rm -r public/images/figma-tmp` — 22 MB untracked and removed from the worktree (recoverable from history).
- **File:** `public/images/figma-tmp/` (22 MB, 9 files; two are 11 MB PNGs)
- **Impact:** `.gitignore:22` lists `/public/images/figma-tmp/`, but `git ls-files` shows all 9 files were committed before the rule, so they ship in every clone/deploy and are publicly served. Two 11 MB PNGs are byte-identical leftover exports of heroes already present under proper names.
- **Fix:** `git rm -r --cached public/images/figma-tmp && git commit`; delete the working copy.

---

## Medium

### PERF-008 — `next.config.ts` images block missing production optimizations (AVIF, cache TTL)
- **Status:** ✅ Fixed
- **Resolution:** `next.config.ts` images: `formats:['image/avif','image/webp']`, `minimumCacheTTL:2678400` (31d), `qualities:[75]`.
- **File:** `next.config.ts:10-16`
- **Impact:** `images` only sets `remotePatterns`. No `formats` → WebP only, **AVIF disabled** (~20–30% smaller for these photos). No `minimumCacheTTL` → on a self-hosted origin the optimizer cache is short-lived, forcing repeated re-encodes of the huge PNGs. No `deviceSizes`/`imageSizes`/`qualities` tuning.
- **Fix:** `formats: ['image/avif','image/webp']`, `minimumCacheTTL: 2678400` (31 days), plus device/image size and `qualities` allowlists.

### PERF-009 — No `headers()` config → no long-cache/immutable headers on `/images`, `/fonts`, `/pdf`
- **Status:** ✅ Fixed
- **Resolution:** `headers()` adds `Cache-Control: public, max-age=31536000, immutable` for `/images`, `/fonts`, `/pdf`.
- **File:** `next.config.ts` (no `headers` key)
- **Impact:** `_next/static` and optimizer output get immutable caching automatically, but raw `public/` assets (fonts, SVGs, PDF, directly-referenced images) do not. With no CDN in front, returning visitors re-download them.
- **Fix:** Add a `headers()` entry setting `Cache-Control: public, max-age=31536000, immutable` for `/fonts/:path*`, `/pdf/:path*`, `/images/:path*` (filenames are content-stable).

### PERF-010 — Body font shipped as unoptimized `.otf` (167 KB) instead of subset `.woff2`
- **Status:** ⚠️ Flagged (tooling)
- **Resolution:** Convert `CoFoGothic-Regular.otf` → subset `.woff2` (Cyrillic+Latin via fonttools/glyphhanger) and update the `localFont` src. Font tooling not run here.
- **File:** `src/app/layout.tsx:21-27` → `public/fonts/CoFoGothic-Regular.otf` (167,808 bytes)
- **Impact:** Primary body font (`--font-body`, sitewide), preloaded by `next/font`. OTF is uncompressed vs woff2 Brotli table compression, and `next/font/local` does not subset custom fonts. Inflates the critical font payload ~2–3× vs the 39 KB display woff2. With `display: swap`, the late swap causes a FOUT reflow across the fluid layout.
- **Fix:** Convert to subset `.woff2` (Cyrillic+Latin, `fonttools`/`glyphhanger`) — expect ~60–90 KB. Keep `display: swap`.

### PERF-011 — Catalog list re-renders every row on any favorite toggle
- **Status:** ✅ Fixed
- **Resolution:** `ApartmentRow` wrapped in `React.memo`; `favSet` derived via `useMemo`; rows get a primitive `fav` + stable `onFav` → only the toggled row re-renders. Typecheck clean.
- **File:** `src/components/sections/ApartmentCatalog/index.tsx:219-220,321-328`; `ApartmentRow` at `:176`
- **Impact:** Parent subscribes to the whole `favIds` array; toggling one heart mutates `ids`, re-rendering the catalog, and since `ApartmentRow` is not `React.memo`, all filtered rows (46+ apartments) re-render each toggle. `fav={hydrated && favIds.includes(a.id)}` is recomputed inline per row.
- **Fix:** Wrap `ApartmentRow` in `React.memo`; derive a `Set` from `favIds` via `useMemo`; pass a stable primitive `fav` boolean + stable `onFav`. Only the toggled row then re-renders.

### PERF-012 — `MapVector` inline SVG string is a large JS payload
- **Status:** ⚠️ Flagged (tied to PERF-005)
- **Resolution:** Move the `MapVector` inline SVG to a static `.svg` or lazy-load `Location` — best done together with the PERF-005 code-split decision.
- **File:** `src/components/ui/MapVector/mapData.ts`
- **Impact:** The entire Location map is a hardcoded SVG string (dozens of `<path>`/`<text>` nodes) shipped as a JS module in the client bundle and parsed/hydrated on every homepage load.
- **Fix:** Move to a static `.svg` referenced via `<img>`/`next/image`, or lazy-load `Location` (see PERF-005) so the string is out of the initial chunk.

### PERF-013 — `Reveal` with `threshold >= 1` falls back to a per-frame scroll listener
- **Status:** ✅ Fixed
- **Resolution:** `Reveal` `threshold>=1` fallback now uses an IntersectionObserver (threshold grid + `entry.boundingClientRect`) instead of a per-frame `getBoundingClientRect` scroll listener.
- **File:** `src/components/ui/Reveal/index.tsx:92-124` (same pattern in `PageHero`)
- **Impact:** When `threshold >= 1` (used on `PageHero`), `Reveal` abandons IntersectionObserver and attaches `scroll`+`resize` listeners calling `getBoundingClientRect()` every frame — adding to the PERF-004 thrash on every inner-page hero.
- **Fix:** Replace with an IO using a full-height sentinel or `rootMargin` math instead of a per-frame rect read.

### PERF-014 — Four Swiper instances mount on the homepage, three with `loop` slide-duplication
- **Status:** ✅ Fixed
- **Resolution:** `Slider` renders a static single image (no Swiper mount, no loop duplication) when `slides.length<=1`; SCSS coupling handled. Needs quick visual QA of the single-slide (`slider_spa`) case.
- **File:** `src/app/page.tsx:213,239,253,257` → `src/components/ui/Slider/index.tsx:36-40,118-128`
- **Impact:** `loop` duplicates slides up to ≥6 (`loopSlides`) to satisfy `slidesPerView:"auto"`, multiplying DOM nodes and `<Image>` elements (all `loading="eager"`, PERF-003). Each Slider also adds a scroll parallax listener (PERF-004). The `spaSlides` slider mounts a full Swiper for a single slide.
- **Fix:** Skip Swiper when `slides.length <= 1` (render a plain image); lazy-mount Sliders via `next/dynamic`; drop manual slide duplication in favor of Swiper's native `loopedSlides`/`rewind`.

### PERF-015 — `backdrop-filter: blur(40px)` on the full-screen menu panel
- **Status:** ✅ Fixed
- **Resolution:** Menu `backdrop-filter` reduced `blur(40px)`→`blur(20px)` in both `Menu.tsx` (inline `FROST`) and `Menu.module.scss`. Needs visual QA of the frosted panel.
- **File:** `src/components/layout/Header/Menu.tsx:13-16` (inline `FROST`) and `Menu.module.scss:44`
- **Impact:** A 40px backdrop-blur over a full-viewport panel is one of the most expensive paint ops, re-blurring the page behind it while the menu animates open and while its nested Lenis scrolls. Drops frames on mid/low-end mobile during the open transition.
- **Fix:** Reduce blur radius (12–20px), blur a static snapshot, or gate behind `@media (min-width: 768px)`/capability check.

---

## Low

### PERF-016 — CountUp requestAnimationFrame loop is never cancelled
- **Status:** ✅ Fixed
- **Resolution:** `CountUp` rAF id stored and `cancelAnimationFrame`d on unmount + `mounted` guard prevents `setValue` after unmount.
- **File:** `src/components/ui/CountUp/index.tsx:40,42`
- **Impact:** `requestAnimationFrame(tick)` is called with no stored id and no `cancelAnimationFrame` in cleanup. If the component unmounts mid-count (route change), the `tick` chain runs until `p >= 1`, calling `setValue` on an unmounted component and holding the closure. Self-terminating and guarded by a `started` ref (does not accumulate across mounts), so Low.
- **Fix:** Store the id and `cancelAnimationFrame` in the effect's cleanup; guard `setValue` with a mounted flag.

### PERF-017 — `FavoriteButton` subscribes to the entire `ids` array
- **Status:** ✅ Fixed
- **Resolution:** `FavoriteButton` subscribes to the derived boolean `useFavorites(s=>s.ids.includes(id))` instead of the whole `ids` array.
- **File:** `src/components/ui/FavoriteButton/index.tsx:17`
- **Impact:** `useFavorites((s) => s.ids)` re-renders every mounted `FavoriteButton` on any favorites change (new array reference each toggle), even buttons whose own state didn't change.
- **Fix:** Select the derived boolean: `const fav = useFavorites((s) => s.ids.includes(id))`.

### PERF-018 — Resize handlers do synchronous layout reads with no debounce/rAF
- **Status:** ⚠️ Flagged (Low)
- **Resolution:** rAF/debounce the resize handlers (Location/Menu/Catalog/GalleryStrip/Slider). Deferred — spread across many files; low payoff vs concurrent-edit churn.
- **File:** `Location/index.tsx:186`, `Header/Menu.tsx:95`, `ApartmentCatalog/index.tsx:276`, `GalleryStrip/index.tsx:154`, `Slider/index.tsx:65`
- **Impact:** Each `resize` synchronously forces reflow (`getBoundingClientRect`/`offsetHeight`/`getComputedStyle`); rapid drag-resize causes layout thrash. Slider's `update` also `setState`s on every resize, re-rendering Swiper.
- **Fix:** rAF-batch or debounce (~100–150 ms) these resize callbacks.

### PERF-019 — Off-screen sections keep computing rects (no visibility gate)
- **Status:** ⚠️ Flagged (Low)
- **Resolution:** Add an IntersectionObserver `isVisible` gate so off-screen sections skip their scroll rAF body. Deferred (Low).
- **File:** scroll handlers listed in PERF-004 (e.g. `Slider/index.tsx:79-91`, `Scenario/index.tsx:22-33`)
- **Impact:** rAF-throttling is correct, but there's no early-exit when a section is off-screen — Slider/Scenario keep computing rects far outside the viewport.
- **Fix:** Gate the rAF body with a cheap IntersectionObserver `isVisible` flag; skip work when off-screen.

### PERF-020 — `will-change` permanently declared on always-mounted elements
- **Status:** ⚠️ Flagged (Low, design risk)
- **Resolution:** Trim permanent `will-change` on always-mounted elements — needs profiling to avoid compositor-layer regressions. Deferred.
- **File:** `Header.module.scss:9`, `GalleryStrip.module.scss:41`, plus Hero/Scenario/Terraces parallax layers (25 `will-change` sites total, most correctly scoped to animating states)
- **Impact:** Permanent `will-change` forces standing compositor layers (GPU memory) which, combined with many large decoded images, pressures memory on mobile.
- **Fix:** Drop `will-change` from non-continuously-animating elements; add it via JS only for the animation's duration.

### PERF-021 — `text-wrap: balance` applied to all h1–h4 globally
- **Status:** ⚠️ Flagged (Low, design risk)
- **Resolution:** Scope `text-wrap:balance` to short headings — changes heading wrapping on Figma-pixel-matched type; needs design sign-off. Not auto-applied.
- **File:** `src/app/globals.scss:55`
- **Impact:** `balance` triggers multi-pass line-breaking for every heading; with fluid vw sizing, headings re-balance on each resize.
- **Fix:** Scope `balance` to short display headings only.

### PERF-022 — `.otf`/dead code / robots.txt housekeeping
- **Status:** ◑ Partially Fixed
- **Resolution:** robots.txt moved to `public/robots.txt`; dead `Preloader/` deleted; Slider `loopSlides` memoized. Remaining: `Location` derived-value memo (negligible, 9 items) left as-is.
- **File:** `robots.txt` at project root (not served — App Router needs `public/robots.txt` or `app/robots.ts`); `src/components/layout/Preloader/` dead source (live one is `Preloader-new/Preloader.tsx`); `Slider/index.tsx:37-40` `loopSlides` rebuilt every render; `Location/index.tsx:286-289` derived `visible`/`openIndex`/`cardPlace` not memoized (9 items, negligible)
- **Impact:** `/robots.txt` returns 404 in production; dead Preloader confuses maintenance (also has uncleared timeouts, but not shipped); minor per-render allocations.
- **Fix:** Move robots.txt into `public/` or `app/robots.ts`; delete `src/components/layout/Preloader/`; `useMemo` the `loopSlides` array.

### PERF-023 — Minor `next.config.ts` production tuning
- **Status:** ◑ Partially Fixed
- **Resolution:** `poweredByHeader:false` applied. `experimental.optimizePackageImports` for swiper/lenis intentionally left off (marginal; Slider already imports specific entry points).
- **File:** `next.config.ts`
- **Impact:** `poweredByHeader` not disabled (trivial header leak); no `experimental.optimizePackageImports` for `swiper`/`lenis` (small bundle win). `productionBrowserSourceMaps` correctly defaults false; `compress` correctly defaults true.
- **Fix (optional):** `poweredByHeader: false`; `experimental: { optimizePackageImports: ["swiper", "lenis"] }`.

---

## Checked out clean
- **Dependencies:** `lenis`, `swiper`, `zustand` all imported and used; no unused deps; `playwright` correctly a devDependency (not bundled).
- **Build artifacts:** `.next/`, `*.tsbuildinfo`, `*.map` are not tracked.
- **Cleanup hygiene:** every `addEventListener` has a matching `removeEventListener`; every `IntersectionObserver` is `disconnect()`-ed; the single `setInterval` is cleared; Lenis is `destroy()`-ed in `SmoothScroll` and `Menu`; global window/document mutations (`window.__lenis`, `is-loading` class, `body.style.overflow`, Modal overflow restore) are all reverted.
- **Zustand:** all 20 consumers use field selectors — no whole-store subscriptions. Heavy data (`PLACES`, `CATEGORIES`, `NAV`, `PICK`) is module-level const, not state. ApartmentCatalog `useMemo`s its `ranges`/`bedOptions`/filtered `rows`.
- **Rubber system:** pure-CSS `calc` (`globals.scss:66,74-82`), root font-size deliberately left at 16px, recalculated only on resize — **no JS-driven reflow / font-size CLS** (corrects the audit brief's premise).
- **No edge middleware** (`src/middleware.ts` absent). No `unoptimized` prop on any `next/image`. Genuine `fill` usages all supply `sizes`.

## Highest-impact fixes, ranked
1. **PERF-001 (Critical, LCP):** stop serving the hero through a raw `<img>`; route through `next/image`, pre-compress source PNGs.
2. **PERF-002 (Critical, weight/deploy):** recompress the 567 MB PNG tree to WebP/AVIF at ~2560px.
3. **PERF-003 (High, LCP/bandwidth):** remove `loading="eager"` from the 24 below-the-fold images.
4. **PERF-004 (High, INP):** collapse ~11 scroll listeners into one batched read-then-write rAF loop.
5. **PERF-005 (High, TBT):** `next/dynamic` the below-fold sections to defer Swiper + section JS.
6. **Quick wins:** PERF-007 (`git rm figma-tmp`), PERF-008/009 (one config edit: AVIF + cache headers), PERF-006 (compress PDF).
