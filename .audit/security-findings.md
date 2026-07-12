# Security Audit Findings

**Date:** 2026-07-11
**Project:** k711 (Next.js 16.2.9 / React 19 landing, SCSS Modules, Zustand, Lenis, Swiper; headless MODX backend; forms → CoMagic)
**Status:** In Review
**Scope reviewed:** `src/` (app, components, lib, store, config), `src/app/api/*` route handlers, MODX client, CoMagic integration, `next.config.ts`, `.env*`, `.gitignore`, layout/analytics scripts, dependency tree (`npm audit`), git history (secrets).

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 1     |
| Medium   | 4     |
| Low      | 4     |
| Info     | 2     |
| **Total**| **11**|

### Task-format counts
Critical: 0 · High: 1 · Medium: 4 · Low: 4 · (Info: 2) · Total: 11

### Remediation status (2026-07-11)
**Resolved: 10 of 11.** SEC-001/002/003/004/005/006/008/010/011 fixed; SEC-007 mitigated via the CSP added in SEC-001. **Still open: SEC-009** (Low) — the consent checkbox needs the real published privacy-policy URL (product/legal input), not auto-fixable. Verified via `tsc`, `eslint`, and a clean `next build`. Per-finding **Status** / **Fix Applied** are inline below.

### Positives (no finding, noted to avoid re-investigation)
- No secrets committed to git — `.env*` is git-ignored (`.gitignore` line for `.env*`) and never appears in `git log --all`.
- No `NEXT_PUBLIC_*` env exposure to the client; all `process.env` reads (`MODX_API_URL`, `MODX_API_TOKEN`, `REVALIDATE_SECRET`, `API_BASE_URL`) are server-only (route handlers / `import "server-only"` client). MODX bearer token never reaches the browser.
- No SSRF: `modxFetch` builds URLs from a fixed env base + code-supplied paths; `src/lib/api.ts` fetches fixed hosts only. No user-controlled fetch target.
- No SQL/NoSQL/command injection surface (no DB driver, no `exec`/`eval`/`child_process`); route param `id` is `encodeURIComponent`-escaped before the CRM query.
- `/api/revalidate` fails closed when `REVALIDATE_SECRET` is unset (returns 401).

---

## Findings

### [SEC-001] No security headers or Content-Security-Policy (clickjacking, no XSS/MIME mitigation)
- **Severity:** High
- **Category:** Config
- **File:** `next.config.ts`
- **Line:** 1–17 (no `async headers()` block present)
- **Status:** Fixed
- **Fix Applied:** Added `headers()` in `next.config.ts`: HSTS, X-Content-Type-Options nosniff, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy on all routes, plus a Content-Security-Policy-Report-Only with an analytics allowlist (report-only rollout per recommendation).
- **Description:** `next.config.ts` defines no `headers()` function, so the app ships **no** `Content-Security-Policy`, `X-Frame-Options` / CSP `frame-ancestors`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy`. Consequences: (1) the lead-capture forms can be framed on an attacker page → **clickjacking**; (2) any injected/compromised third-party script (see SEC-007) runs unrestricted — there is no CSP to contain XSS; (3) no HSTS to prevent protocol downgrade; (4) no `nosniff` to prevent MIME-type confusion. The page loads several inline + remote analytics scripts (`layout.tsx` lines 73–106), which makes the absence of a CSP especially impactful.
- **Evidence:**
  ```ts
  // next.config.ts — no headers() at all
  const nextConfig: NextConfig = {
    sassOptions: { loadPaths: [...] },
    images: { remotePatterns: [...] },
  };
  ```
- **Recommendation:** Add an `async headers()` block returning, for all routes: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` (or CSP `frame-ancestors 'self'`), `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` disabling unused features (camera, microphone, geolocation). Add a `Content-Security-Policy` with an explicit allowlist for the analytics origins actually used (`googletagmanager.com`, `mc.yandex.ru`, `api.mindbox.ru`, `content.adriver.ru`, CoMagic) plus `img-src` for `s3.mastertel.ru` and `www.klimashkina711.ru`; prefer nonce-based `script-src` for the inline GTM/Mindbox/Metrika snippets. Roll out CSP in `Content-Security-Policy-Report-Only` first to catch breakage.
- **References:** OWASP A05:2021 (Security Misconfiguration); CWE-1021 (Clickjacking); CWE-693 (Protection Mechanism Failure); CWE-16.

---

### [SEC-002] Unauthenticated `/api/lead` endpoint — no rate limiting, no origin/CSRF check, no size/length limits
- **Severity:** Medium
- **Category:** API Security
- **File:** `src/app/api/lead/route.ts`
- **Line:** 19–42
- **Status:** Fixed
- **Fix Applied:** `/api/lead` now enforces same-origin, an 8KB body cap (Content-Length + actual), per-field length caps, and a best-effort in-memory IP rate limit (10/min). NOTE: a distributed/proxy-level rate limit is still recommended for multi-instance hosting.
- **Description:** `POST /api/lead` is publicly reachable and performs no throttling, no CAPTCHA, no `Origin`/`Referer` validation, and no field-length limits. Only presence of `name` and `phone` is checked. Anyone can script unlimited requests to (a) flood server logs (SEC-003) — a low-cost log-storage/CPU DoS, and (b) generate spam leads. Because the handler consumes an arbitrary JSON body with no bound, large payloads are accepted (memory pressure). There is also no origin restriction, so the endpoint is invocable cross-site (CSRF-style automated abuse), though impact is limited since it currently only logs and forwards.
- **Evidence:**
  ```ts
  export async function POST(request: NextRequest) {
    const data = (await request.json().catch(() => null)) as LeadPayload | null;
    if (!data?.name || !data?.phone) {
      return NextResponse.json({ message: "name and phone are required" }, { status: 400 });
    }
    // no rate limit, no length caps, no origin check
  ```
- **Recommendation:** Add IP-based rate limiting (e.g. a token-bucket / Upstash-style limiter, or infra-level limits at the reverse proxy) and a request body size cap. Validate and cap each field length (name/phone/email/comment). Enforce a same-origin check (compare `request.headers.get('origin')` against the site origin) and/or a lightweight anti-bot token. Reject `Content-Length` above a small threshold.
- **References:** OWASP A04:2021 (Insecure Design) / API4:2023 (Unrestricted Resource Consumption); CWE-770 (Allocation of Resources Without Limits); CWE-352 (CSRF).

---

### [SEC-003] PII written to server logs in plaintext + log injection via unsanitized fields
- **Severity:** Medium
- **Category:** Data Exposure
- **File:** `src/app/api/lead/route.ts`
- **Line:** 39
- **Status:** Fixed
- **Fix Applied:** Removed the raw-PII `console.log`; now logs only source/hasEmail/apartmentNumber. All user fields pass through `clean()` which strips control chars (\x00-\x1F,\x7F) → no log injection.
- **Description:** `console.log("[lead]", lead)` writes personal data (name, phone, email, free-text comment) to server logs in clear text on every submission. This is PII persisted to logs without redaction, retention control, or the user's consent scope, and it increases exposure if logs are shipped to third-party aggregators. Additionally, `name`, `email`, and `comment` are attacker-controlled strings that are logged verbatim: embedded newlines/carriage returns/ANSI control sequences enable **log forging/injection** — an attacker can fabricate fake log lines or corrupt log parsing.
- **Evidence:**
  ```ts
  console.log("[lead]", lead); // name, phone, email, comment logged raw
  ```
- **Recommendation:** Do not log raw PII. Log a minimal, non-PII event (e.g. `source` + a hashed/truncated correlation id) or nothing. If lead contents must be persisted, send them to the intended CRM/mail channel over an authenticated path rather than stdout, and strip control characters (`\r`, `\n`, non-printables) from any user-supplied value before it reaches a log sink. Ensure log retention/rotation and access controls comply with 152-FZ.
- **References:** OWASP A09:2021 (Security Logging Failures); CWE-532 (Insertion of Sensitive Information into Log File); CWE-117 (Improper Output Neutralization for Logs).

---

### [SEC-004] `/api/revalidate` secret passed in query string + timing-unsafe comparison + weak defaults
- **Severity:** Medium
- **Category:** Auth
- **File:** `src/app/api/revalidate/route.ts`
- **Line:** 10–13 (and `.env.example:11`, `.env.local:6`)
- **Status:** Fixed
- **Fix Applied:** `/api/revalidate` reads the secret from the `x-revalidate-secret` header (query kept only as a temporary MODX-migration fallback), compares via `crypto.timingSafeEqual`, and refuses in production if the secret is empty or a known placeholder.
- **Description:** The webhook authenticates via `?secret=...` in the URL query string, which is routinely captured in web-server access logs, reverse-proxy logs, and `Referer` headers — leaking the shared secret. The comparison `secret !== process.env.REVALIDATE_SECRET` is a non-constant-time string compare, theoretically susceptible to timing analysis. The shipped defaults are weak: `.env.example` sets `REVALIDATE_SECRET=change-me` and `.env.local` sets `local-dev-secret`; if a placeholder is promoted to production, the endpoint is trivially forgeable. With the secret, an attacker can call `revalidatePath`/`revalidateTag` on arbitrary paths/tags repeatedly to force cache purges → origin/CRM load amplification (cache-stampede DoS).
- **Evidence:**
  ```ts
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }
  ```
- **Recommendation:** Move the secret out of the query string into a header (e.g. `Authorization: Bearer` or a custom `X-Revalidate-Token`), or verify an HMAC signature of the body (MODX signs the payload; server recomputes). Compare using a constant-time function (`crypto.timingSafeEqual` on equal-length buffers). Require a strong, randomly generated secret in production (fail startup if it equals a known placeholder). Optionally rate-limit the endpoint and validate that `path`/`tag` belong to an expected allowlist.
- **References:** OWASP A07:2021 (Identification & Authentication Failures); CWE-598 (Information Exposure Through Query Strings); CWE-208 (Observable Timing Discrepancy); CWE-798 (Use of Hard-Coded/Default Credentials).

---

### [SEC-005] Unvalidated external CRM/CMS data used directly as link `href` (potential stored XSS via `javascript:`/`data:` URIs)
- **Severity:** Medium
- **Category:** Injection / XSS
- **File:** `src/components/sections/ApartmentCard/index.tsx` (line 133), `src/lib/api.ts` (lines 105–127, `flatToDetail`), `src/components/sections/Presentation/index.tsx` (line 97)
- **Status:** Fixed
- **Fix Applied:** Added `src/lib/url.ts` `safeUrl()` (allowlists https/mailto/tel, site-relative, data:image/*). Applied in `flatToDetail` (pdf/plan/keyPlan), `ApartmentCard` href, and `Presentation` ctaHref.
- **Description:** `apt.pdf` originates from the MODX/CRM `flat.pdf` field and is rendered as an anchor `href` with no scheme validation (`<a href={apt.pdf} download target="_blank">`). If the CRM is compromised or an editor supplies a `javascript:` URI (or a hostile `data:text/html` payload), clicking the link executes script in the site origin — stored/reflected XSS sourced from backend content. Related: `flatToDetail` also passes CRM-supplied `layoutUrl` and a deliberately re-MIME'd `data:image/svg+xml,...` value (`fixSvgDataUri`, `api.ts:105`) into image `src`; `next/image` renders these as `<img>` (script-inert), so lower risk, but the CRM→`href` path is the exploitable one. `Presentation`'s `ctaHref` is CMS-editable with the same lack of validation.
- **Evidence:**
  ```tsx
  // ApartmentCard/index.tsx
  <a href={apt.pdf} download target="_blank" rel="noopener noreferrer" ...>
  ```
  ```ts
  // api.ts flatToDetail — pdf/plan/keyPlan taken verbatim from CRM
  plan: f.layoutUrl,
  keyPlan: f.floorPlan ? fixSvgDataUri(f.floorPlan) : "/images/apartment/keyplan-floor.png",
  pdf: f.pdf,
  ```
- **Recommendation:** Before rendering any backend-supplied URL as an `href`/`src`, validate the scheme against an allowlist (`https:`, and site-relative `/...`); reject `javascript:`, `data:` (except vetted `image/*` for `<img>`), `vbscript:`, and `blob:`. Add a small `safeUrl()` helper in `src/lib/` and apply it in `flatToDetail` (and to `ctaHref`). Continue routing image URLs through `next/image` with the existing `remotePatterns` allowlist.
- **References:** OWASP A03:2021 (Injection/XSS); CWE-79 (Improper Neutralization — XSS); CWE-601-adjacent (untrusted URL in link).

---

### [SEC-006] Vulnerable transitive dependency: `postcss@8.4.31` (npm audit — moderate)
- **Severity:** Low
- **Category:** Dependencies
- **File:** `package-lock.json` (postcss pulled transitively via `next@16.2.9`)
- **Line:** n/a (lockfile) — resolved version `postcss@8.4.31`
- **Status:** Fixed
- **Fix Applied:** Added `overrides: { postcss: ^8.5.10 }` in package.json → postcss resolved to 8.5.16; `npm audit` now reports 0 vulnerabilities.
- **Description:** `npm audit` reports 2 moderate advisories, both resolving to `postcss@8.4.31` ("PostCSS has XSS via Unescaped `</style>` in its CSS Stringify Output"), reached through `next`. PostCSS runs at build time over the project's own SCSS/CSS (not attacker-controlled input in this project), so real-world exploitability here is low; it remains a supply-chain hygiene item.
- **Evidence:**
  ```
  npm audit → moderate: 2 (0 critical/high)
  next  moderate  → postcss
  postcss moderate → "XSS via Unescaped </style> in its CSS Stringify Output"
  npm ls postcss → postcss@8.4.31 (via next@16.2.9)
  ```
- **Recommendation:** Run `npm audit fix` and/or bump `next` to a patch release that pulls a fixed `postcss`; if the transitive pin lags, add a `overrides` entry for `postcss` to a patched version. Re-run `npm audit` to confirm 0 moderate. Add `npm audit --audit-level=high` to CI.
- **References:** OWASP A06:2021 (Vulnerable and Outdated Components); CWE-1035 / CWE-79 (transitive).

---

### [SEC-007] Third-party analytics scripts loaded without Subresource Integrity (no SRI) and no CSP
- **Severity:** Low
- **Category:** Config / Supply chain
- **File:** `src/app/layout.tsx`
- **Line:** 73–106 (GTM, Mindbox tracker `api.mindbox.ru`, Yandex Metrika `mc.yandex.ru`, AdRiver `content.adriver.ru`)
- **Status:** Partially Fixed
- **Fix Applied:** CSP added (report-only) via SEC-001 constrains script origins — the primary control for self-mutating GTM/Metrika loaders (SRI not applicable to them). Promote CSP to enforcing after report-only validation; add SRI to any static third-party scripts.
- **Description:** Multiple remote scripts are injected with no `integrity` (SRI) attribute and, per SEC-001, no CSP to constrain them. A compromise of any of these vendors (or their CDNs) would let arbitrary JS run in the site origin, with access to the DOM and the lead-form inputs (name/phone/email). GTM in particular is a script-loading vector that can pull further code. Note: SRI cannot be applied to GTM/Metrika loaders that self-mutate, so CSP is the primary control — reinforcing SEC-001.
- **Evidence:**
  ```tsx
  <Script src="https://api.mindbox.ru/scripts/v1/tracker.js" strategy="afterInteractive" />
  <Script src="https://content.adriver.ru/AdRiverFPS.js" strategy="afterInteractive" />
  // + inline GTM + Yandex Metrika loaders
  ```
- **Recommendation:** Implement the CSP from SEC-001 with an explicit `script-src` allowlist for these origins (nonce for the inline snippets). Where a script is a static asset, add `integrity` + `crossOrigin="anonymous"`. Periodically review which trackers are still required and remove unused ones to shrink the trusted-script surface.
- **References:** OWASP A08:2021 (Software & Data Integrity Failures); CWE-829 (Inclusion of Functionality from Untrusted Control Sphere).

---

### [SEC-008] Weak placeholder/dev secret shipped in `.env.example` / `.env.local`
- **Severity:** Low
- **Category:** Config
- **File:** `.env.example` (line 11), `.env.local` (line 6)
- **Status:** Fixed
- **Fix Applied:** `.env.example` REVALIDATE_SECRET emptied with `openssl rand -hex 32` guidance; app rejects empty/placeholder secret in production (see SEC-004).
- **Description:** `.env.example` ships `REVALIDATE_SECRET=change-me` and the on-disk `.env.local` uses `local-dev-secret`. These are gitignored and not committed (verified), so this is not a disclosure, but the placeholder invites deployments where the webhook secret is a well-known string. Combined with SEC-004 (secret in query string), a guessed/placeholder secret makes the revalidation endpoint forgeable.
- **Evidence:**
  ```
  .env.example:  REVALIDATE_SECRET=change-me
  .env.local:    REVALIDATE_SECRET=local-dev-secret
  ```
- **Recommendation:** Leave `.env.example` values empty (or clearly `<generate-a-strong-random-secret>`), and have the app refuse to start in production if `REVALIDATE_SECRET` is empty or matches a known placeholder. Generate production secrets with a CSPRNG (≥32 bytes). Rotate the current dev secret if it was ever reused.
- **References:** OWASP A05:2021 (Security Misconfiguration); CWE-1188 (Insecure Default Initialization); CWE-798.

---

### [SEC-009] Consent checkbox links to a placeholder `href="#"` (PII collected without an accessible privacy policy)
- **Severity:** Low
- **Category:** Data Exposure / Privacy
- **File:** `src/app/contact/ContactForm.tsx`
- **Line:** 74–78
- **Status:** Flagged — needs input
- **Fix Applied:** Requires the published privacy-policy URL to replace `href="#"` in ContactForm; not auto-fixable without the real document link. Left for product/legal to supply.
- **Description:** The required "согласие на обработку персональных данных" checkbox links the privacy-policy text to `href="#"` (a non-existent document). The form collects name, email, phone, and free-text comment and forwards them to CoMagic and `/api/lead`. Under 152-FZ (and general privacy best practice) the consent must reference an actual, reachable policy describing processing purposes, operator, and deletion rights. This is a compliance/data-governance gap rather than a code-execution vulnerability.
- **Evidence:**
  ```tsx
  Соглашаюсь с <a href="#" className={styles.link}>политикой конфиденциальности</a> ...
  ```
- **Recommendation:** Point the link to the published privacy-policy / PD-processing consent document (open in a new tab). Ensure a data-subject deletion/opt-out path exists for leads captured in logs (ties to SEC-003).
- **References:** OWASP A04:2021 (Insecure Design); 152-FZ / GDPR Art. 13–17; CWE-359 (Exposure of Private Personal Information).

---

### [SEC-010] `dangerouslySetInnerHTML` in `MapVector` (currently static — defense-in-depth)
- **Severity:** Info
- **Category:** XSS
- **File:** `src/components/ui/MapVector/index.tsx`
- **Line:** 17 (source data `src/components/ui/MapVector/mapData.ts`)
- **Status:** Fixed
- **Fix Applied:** Added a SEC-010 guard comment on the MapVector `dangerouslySetInnerHTML` requiring sanitization/static-asset conversion if MAP_INNER ever becomes CMS/CRM-driven. Content remains a static build-time constant.
- **Description:** `MapVector` injects `MAP_INNER` via `dangerouslySetInnerHTML`. `MAP_INNER` is a static, autogenerated SVG string constant in `mapData.ts` with no user/CMS/CRM input path (confirmed: no code assigns to it or fetches it), so it is currently **not** exploitable. Flagged only so that any future change routing dynamic/CMS content into this prop is treated as an XSS gate.
- **Evidence:**
  ```tsx
  <svg ... dangerouslySetInnerHTML={{ __html: MAP_INNER }} />
  // mapData.ts: export const MAP_INNER = `<rect .../> ... ` (static literal)
  ```
- **Recommendation:** Keep `MAP_INNER` a build-time constant. Add a code comment / lint guard so that if this SVG ever becomes CMS-driven it is sanitized (e.g. DOMPurify with SVG profile) or rendered as a static asset instead of via `dangerouslySetInnerHTML`.
- **References:** CWE-79; OWASP A03:2021.

---

### [SEC-011] Internal API detail exposed in thrown error messages
- **Severity:** Info
- **Category:** Data Exposure
- **File:** `src/lib/modx/client.ts`
- **Line:** 63–68 (also `src/lib/api.ts` throwing generic messages)
- **Status:** Fixed
- **Fix Applied:** `modxFetch` now logs the internal path server-side via console.error and throws a generic `MODX API request failed (status)` message with no pathname.
- **Description:** `modxFetch` throws `MODX API ${status} ${statusText} — ${url.pathname}`, embedding the internal backend path. These errors are server-side (Server Components / route handlers); in production Next.js shows a generic error page, so leakage is minimal. In development or if an error boundary echoes `error.message` to the client, internal endpoint structure could be disclosed.
- **Evidence:**
  ```ts
  throw new Error(`MODX API ${response.status} ${response.statusText} — ${url.pathname}`);
  ```
- **Recommendation:** Keep detailed messages server-side only; never surface raw `error.message` in client-facing responses. Confirm `error.tsx`/`not-found.tsx` render generic copy. Log the detail server-side under a request id instead of embedding it in the thrown message where feasible.
- **References:** OWASP A05:2021; CWE-209 (Generation of Error Message Containing Sensitive Information).

---

## Methodology notes
- Reviewed all 5 audit dimensions (injection/XSS/SSRF, auth/authz, data exposure, dependencies/config, API/DB security) by direct reading of every route handler, data-flow library, layout, config, and env file, plus targeted grep sweeps for `dangerouslySetInnerHTML`, `eval`/`Function`/`innerHTML`, `process.env`/`NEXT_PUBLIC_`, `fetch(`, `target="_blank"`, secrets/tokens, `localStorage`/`cookie`/CORS, and `git log --all` for committed `.env` history.
- `npm audit` executed: 0 critical, 0 high, 2 moderate (postcss, transitive via next) — see SEC-006.
- No SQL/NoSQL/ORM, no auth/session system, no file-upload endpoints, no GraphQL, and no user-controlled server-side fetch targets exist in this codebase, so those OWASP categories yielded no findings.
