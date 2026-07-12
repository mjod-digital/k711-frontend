# Production Readiness Audit — Summary

**Date:** 2026-07-11
**Project:** k711 (Next.js 16.2.9 / React 19 landing, SCSS Modules, Zustand, Lenis, Swiper, headless MODX, forms → CoMagic)

## Overview

| Audit        | Critical | High | Medium | Low | Total |
|--------------|----------|------|--------|-----|-------|
| Security     | 0        | 1    | 4      | 4   | 9 *   |
| Performance  | 2        | 5    | 8      | 8   | 23    |
| UI/UX        | 1        | 8    | 27     | 21  | 57    |
| Architecture | 1        | 8    | 13     | 8   | 30    |
| Data         | 0        | 4    | 5      | 5   | 14    |
| **Total**    | **4**    | **26**| **57** | **46**| **133** |

\* Security also raised 2 informational items (not counted above). Grand total across all audits: 135.

## Remediation Progress (2026-07-11)

**Security — 10 of 11 resolved.** SEC-001 (security headers + CSP report-only), SEC-002 (origin check, size/field caps, in-memory rate limit), SEC-003 (no more PII logging + control-char stripping), SEC-004 (header secret + `timingSafeEqual` + placeholder rejection), SEC-005 (`safeUrl()` at CRM/CMS→href boundaries), SEC-006 (postcss→8.5.16, `npm audit` clean), SEC-007 (mitigated via CSP), SEC-008 (`.env.example` hardened), SEC-010 (XSS guard comment), SEC-011 (generic error). **Open:** SEC-009 — needs the real published privacy-policy URL (product/legal input).

**Performance — 11 fully fixed, 2 partial, 10 flagged.** Fixed: PERF-001 (hero via `getImageProps`), 003 (lazy-load below-fold images), 007 (untrack figma-tmp), 008/009 (AVIF+webp, cache headers), 011/016/017 (re-render + rAF-leak fixes), 013/014/015. Flagged for follow-up (need asset tooling, an SSR/SEO decision, or design sign-off): PERF-002 (recompress 567 MB image tree — **still Critical**), 004 (scroll-listener refactor), 005/012 (code-splitting), 006 (PDF), 010 (font), 018–021 (Low).

**Verified:** `tsc --noEmit` clean, `eslint` clean on all touched files (2 pre-existing `set-state-in-effect` errors remain in untouched `Header`/`Location`), and `next build` succeeds (21 pages generated).

**Not addressed this round (out of Security/Performance scope):** the lead-capture showstopper — ARCH-001 / UI-001 / DATA-002 (no durable delivery + unconditional "success") — plus all other UI, Architecture, and Data findings. The lead *endpoint* is now hardened (SEC-002/003), but leads are still not durably delivered.

## Production Readiness Verdict

### 🔴 NOT READY

The site's entire business purpose is lead capture, and lead capture is broken. `/api/lead` is a `console.log` stub with no durable delivery, both forms display an **unconditional success message** after a fire-and-forget send, there is no server-side validation, and raw PII (name/phone/email/comment) is logged to host stdout. Every submitted lead is currently lost while the user is told it succeeded — flagged independently by the Architecture (ARCH-001, Critical), UI (UI-001, Critical), Data (DATA-001/002), and Security (SEC-003) audits. On top of that, the LCP hero is served through a raw unoptimized `<img>` pointing at 10–24 MB PNGs (PERF-001/002), there is no runtime validation at any external boundary (one bad CRM field → `NaN` breaks the whole catalog), and there are no error boundaries or security headers. These are launch-blockers, not polish.

The foundation is sound — no circular dependencies, clean cleanup hygiene (no memory leaks), correct Zustand selectors, correct server/client boundaries, a well-architected pure-CSS rubber layout, and WCAG Level A largely met — so the blockers are concentrated and fixable, not systemic.

## Top Priority Fixes

1. **Wire real lead delivery + stop faking success** — `ARCH-001` (Crit), `UI-001` (Crit), `DATA-002` (High). `src/app/api/lead/route.ts` is a stub; `sendLead` is fire-and-forget and both forms show success unconditionally. Implement durable delivery to CoMagic/CRM, surface real errors, add server-side validation, size cap, and rate limiting.
2. **Stop logging PII** — `SEC-003` / `DATA-001` (`src/app/api/lead/route.ts:39` `console.log("[lead]", lead)`). Remove or redact; it leaks name/phone/email into production logs on every submit and is log-injection-prone.
3. **Fix the hero LCP path** — `PERF-001` (Crit, `src/components/ui/HeroImage/index.tsx:19-33`). LCP hero renders via raw `<img>` bypassing `next/image`; sources are 10–19 MB PNGs. Route through `next/image` and pre-compress.
4. **Recompress the image tree** — `PERF-002` (Crit). `public/images` is 567 MB of lossless PNG (up to 4096px), all committed to a 542 MB `.git`. Convert to WebP/AVIF at ~2560px; also `git rm --cached public/images/figma-tmp` (`PERF-007`) and compress the 37 MB PDF (`PERF-006`).
5. **Add runtime validation at external boundaries** — `ARCH-004` / `DATA-003` (High). MODX/CRM responses are cast to types without schema validation; mappers do arithmetic on unvalidated fields → `NaN` prices/areas silently break `catalogRanges` and the filter UI.
6. **Add React error boundaries** — `ARCH-003` (High). No `error.tsx`/`global-error.tsx` anywhere; any uncaught error drops to Next's default unstyled screen.
7. **Add security headers / CSP** — `SEC-001` (High, `next.config.ts`). No CSP, HSTS, `X-Frame-Options`, or `nosniff` despite many third-party analytics scripts and public lead forms (clickjacking risk).
8. **Fix the tablet band + form labels** — `UI-002` (High): a single 768px breakpoint crushes the desktop artboard to ~53% (body ~10.7px) with a 3.2× discontinuity at 767→768px. `UI-004` (High): form fields have no visible `<label>` and placeholder-only labels fail WCAG AA contrast (~3.46:1).
9. **Enforce the consent checkbox server-side** — `DATA-004` (High). The 152-ФЗ consent captured client-side is dropped and never enforced on the server.
10. **Remove dead DAL** — `ARCH-002` (High). The entire `src/lib/modx/*` is dead code shadowing the live `lib/api.ts`; `.env.example` is itself gitignored and documents the wrong env vars (`ARCH-009`).

## Detailed Reports

- [Security Findings](security-findings.md)
- [Performance Findings](performance-findings.md)
- [UI/UX Findings](ui-findings.md)
- [Architecture Findings](architecture-findings.md)
- [Data Findings](data-findings.md)
