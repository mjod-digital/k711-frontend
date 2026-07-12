# Data Integrity Audit Findings

**Date:** 2026-07-11
**Project:** k711 (Next.js 16 / React 19 landing, headless MODX CMS, CoMagic lead forms, mock apartments catalog, Zustand state)
**Status:** In Review

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0     |
| High     | 4     |
| Medium   | 5     |
| Low      | 5     |
| **Total**| **14**|

By category:

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Validation | 0 | 2 | 2 | 0 |
| Data Exposure | 0 | 1 | 1 | 2 |
| Type Safety | 0 | 1 | 1 | 1 |
| State & Cache / Race | 0 | 0 | 1 | 2 |

> Note: this project has **no database / persistence layer** (leads are `console.log`-ed and forwarded to CoMagic; content is read-only from MODX). "Critical" per the skill is reserved for data loss/corruption of persisted data under normal usage, which does not occur here — hence 0 Critical. The High findings below are the real production blockers.

---

## Findings

### [DATA-001] Full lead PII written to server logs indefinitely
- **Severity:** High
- **Category:** Data Exposure
- **File:** `src/app/api/lead/route.ts`
- **Line:** 39
- **Status:** Open
- **Description:** Every lead submission (name, phone, email, free-text comment, apartment number) is logged verbatim with `console.log("[lead]", lead)`. On the production host (Node :3001 per project notes) and on Vercel previews, this stdout is captured into platform log storage that is broadly readable, retained for long periods, and outside the consent scope the user agreed to. Names + phones + emails are personal data under 152-ФЗ; log stores are rarely access-controlled or purge-scheduled like a CRM would be.
- **Evidence:**
  ```ts
  const lead = { source, name, phone, email, comment, apartmentNumber };
  console.log("[lead]", lead);
  return NextResponse.json({ ok: true });
  ```
- **Data Impact:** PII (name, phone, email, comment) leaked into and retained by log infrastructure; potential 152-ФЗ / privacy exposure.
- **Recommendation:** Do not log raw PII. Either drop the log entirely, log only non-PII metadata (`source`, `apartmentNumber`, a hash/last-4 of phone, timestamp), or route to a proper CRM/mail sink with access controls. If a debug log is needed, gate it behind `NODE_ENV !== "production"` and redact phone/email.

---

### [DATA-002] Public lead endpoint has no real validation, rate limiting, size limit, or abuse protection
- **Severity:** High
- **Category:** Validation
- **File:** `src/app/api/lead/route.ts`
- **Line:** 19–42
- **Status:** Open
- **Description:** `/api/lead` is an unauthenticated public POST. The only check is truthiness of `name` and `phone`. There is no format validation (email, phone), no length caps, no field-count/body-size guard, no rate limiting, no CSRF/origin check, and no honeypot/captcha. Because all real validation lives only in the browser (`required` attributes), any client — a script, a bot, or a bypassed form — can post arbitrary strings of arbitrary size, all of which are then logged (see DATA-001) and, per the file's TODO, will later be emailed/pushed to CRM. This is a spam/log-flooding vector and admits malformed data into the future CRM pipeline.
- **Evidence:**
  ```ts
  const data = (await request.json().catch(() => null)) as LeadPayload | null;
  if (!data?.name || !data?.phone) {
    return NextResponse.json({ message: "name and phone are required" }, { status: 400 });
  }
  ```
- **Data Impact:** Junk/oversized/malformed lead records; log flooding; garbage entering the future email/CRM sink.
- **Recommendation:** Add a schema validator (Zod) with typed fields, trimmed strings, max lengths (e.g. name ≤ 100, comment ≤ 1000), an email regex when present, and a phone normalized to 11 digits. Reject payloads that fail. Add basic abuse protection: per-IP rate limiting, a required same-origin check, and a hidden honeypot field. Coerce/whitelist known keys instead of trusting the whole body.

---

### [DATA-003] MODX/CRM responses are trusted without runtime schema validation; arithmetic on unvalidated fields silently yields NaN
- **Severity:** High
- **Category:** Type Safety
- **File:** `src/lib/api.ts`
- **Line:** 46–70 (`fetchApartments`/`fetchApartmentById` → `res.json()`), 89–127 (`flatToApartment`/`flatToDetail`), 198–215 (`fetchPage`), 258–280 (`fetchContact`)
- **Status:** Open
- **Description:** Every upstream response is cast to a TypeScript type (`return res.json()` as `Flat[]`, `as Partial<PageContent>`, `as Partial<ContactContent>`) with no runtime validation. TypeScript types are compile-time only — they guarantee nothing about the actual JSON MODX/CRM returns. `flatToApartment`/`flatToDetail` then do arithmetic directly on those fields: `Math.round(f.price / 1000)`, `f.amount / 1_000_000`, `Number(f.number)`, `` `${f.ceilingHeightM} м` ``. If the CRM renames a field, returns `null`, or returns a numeric string/object, the result is silently `NaN` (rendered to users as "NaN ₽", "NaN м²") or a broken image src — with no error surfaced. `generateStaticParams` and `catalogRanges(Math.min(...))` also propagate NaN. `fetchApartments` only guards `res.ok`, not response shape.
- **Evidence:**
  ```ts
  if (!res.ok) throw new Error("Failed to fetch apartments");
  return res.json(); // cast to Flat[] — never validated
  // ...
  pricePerM2: Math.round(f.price / 1000),
  cost: f.amount / 1_000_000,
  number: Number(f.number),
  ```
- **Data Impact:** Catalog and apartment cards can silently display corrupt prices/areas (NaN) or broken plans on any upstream shape drift; filters compute NaN ranges.
- **Recommendation:** Validate upstream JSON with a Zod schema per endpoint (`Flat`, `PageContent`, `ContactContent`) and `.safeParse()`. On failure, fall back (empty catalog / `EMPTY_PAGE` / `CONTACT_FALLBACK`) and log a shape-mismatch warning. At minimum, guard the numeric fields (`Number.isFinite`) in `flatToApartment`/`flatToDetail` before arithmetic and substitute safe defaults.

---

### [DATA-004] Consent flags captured on the client are dropped server-side; leads are logged/forwarded regardless of consent
- **Severity:** High
- **Category:** Validation / Data Exposure
- **File:** `src/app/api/lead/route.ts` (Line 10–17, 29–41) and `src/lib/comagic.ts` (Line 124–137)
- **Status:** Open
- **Description:** The forms collect `consent` (ПД processing — legally required) and `marketing` and the client sends them in the `/api/lead` body. But the server `LeadPayload` type omits both, and the constructed `lead` object never reads them, so the consent state is silently discarded on the server side. Worse, the endpoint neither checks nor stores consent: a payload with `consent: false` (e.g. a bypassed/scripted submit) is logged and — per the TODO — will be emailed/pushed to CRM exactly the same as a consented one. Consent is enforced only by a client-side `required` checkbox. For a lead-gen site under 152-ФЗ, the server has no record that consent was given.
- **Evidence:**
  ```ts
  // route.ts — LeadPayload has no consent/marketing; lead never captures them
  type LeadPayload = { source?; name?; phone?; email?; comment?; apartmentNumber? };
  const lead = { source, name, phone, email, comment, apartmentNumber };
  ```
  ```ts
  // comagic.ts — client DOES send them, but server ignores
  body: JSON.stringify({ ...lead, consent: lead.consent ?? null, marketing: lead.marketing ?? null }),
  ```
- **Data Impact:** No server-side proof-of-consent stored with the lead; leads can be processed without recorded consent; marketing opt-in lost server-side (wrong-basis mailing risk).
- **Recommendation:** Add `consent: boolean` and `marketing: boolean` to `LeadPayload`, require `consent === true` server-side (reject otherwise), and persist both with the lead (and the timestamp/version of the policy). Keep them in whatever CRM/mail record the TODO implements.

---

### [DATA-005] No double-submit guard on any lead form (duplicate leads on rapid clicks / slow CoMagic)
- **Severity:** Medium
- **Category:** State & Cache / Race
- **File:** `src/components/sections/Contact/index.tsx` (Line 35–46), `src/app/contact/ContactForm.tsx` (Line 18–31), `src/components/sections/Popups/index.tsx` (Line 30–44)
- **Status:** Open
- **Description:** All three forms call `sendLead(...)` (fire-and-forget: it does not await CoMagic or `/api/lead`) and immediately `openSuccess()`. The submit button is never disabled and there is no in-flight/submitted flag. A user who double-clicks, or clicks again while CoMagic is still resolving (`withComagic` retries up to ~3s), fires multiple leads and multiple `/api/lead` POSTs. Because the success popup opens instantly regardless of the actual send outcome, the UI also confirms success even if the network request later fails silently.
- **Evidence:**
  ```tsx
  onSubmit={(e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    sendLead({ source: "contact", name: fd.get("name") as string, /* ... */ });
    openSuccess(); // fires before send resolves; button stays enabled
  }}
  ```
- **Data Impact:** Duplicate lead records in CoMagic/logs; false "success" shown on silent failure.
- **Recommendation:** Track a `submitting`/`submitted` state, disable the submit button and ignore re-submits while set. Ideally make `sendLead` return a promise and open the success popup on resolution (with an error path), so the confirmation reflects the real outcome.

---

### [DATA-006] PhoneInput accepts incomplete phone numbers past `required`
- **Severity:** Medium
- **Category:** Validation
- **File:** `src/components/ui/PhoneInput/index.tsx`
- **Line:** 40–43, 45–55
- **Status:** Open
- **Description:** The masked phone field only clears itself on blur if there are **zero** user digits (`userDigits(value)`); any value with ≥1 digit is kept and satisfies the HTML `required` check. There is no `minLength`/`pattern` enforcing a full 10-digit number. A user who types "+7 (912" (3 digits) and submits passes validation, and that partial number is sent to CoMagic/CRM. Server-side there is no phone validation either (DATA-002), so nothing catches it.
- **Evidence:**
  ```ts
  const handleBlur = (e) => { if (!userDigits(value)) setValue(""); /* ... */ };
  // value like "+7 (912" (3 digits) is retained → required passes
  ```
- **Data Impact:** Unreachable/partial phone numbers enter the lead pipeline; wasted sales follow-up.
- **Recommendation:** Add `pattern` / a validity check requiring exactly 10 user digits (e.g. set `setCustomValidity` when `userDigits(value).length !== 10`), and mirror the check in the server validator (DATA-002).

---

### [DATA-007] GalleryStrip measures layout before images load; no ResizeObserver → stale pin height/travel
- **Severity:** Medium
- **Category:** State & Cache / Race
- **File:** `src/components/ui/GalleryStrip/index.tsx`
- **Line:** 135–152 (`measure`), 51–161 (effect deps `[pinned, items.length]`)
- **Status:** Open
- **Description:** `measure()` computes the sticky height, horizontal `travel` (`track.scrollWidth - window.innerWidth`) and the section's pinned height from the DOM at effect time. It runs in a layout effect on mount and only re-runs on `resize`. The images use `next/image` with `fill`, so their contribution to `track.scrollWidth` depends on layout that can change after fonts/images finish loading and reflow the track. Unlike `ApartmentCatalog` (which re-runs `applyScale` on `document.fonts.ready`), GalleryStrip has no `fonts.ready` recalc and no `ResizeObserver` on the track. If the track width settles after `measure()`, `travel` and the section height are stale, so the pinned horizontal scroll ends early or over-scrolls (empty space / cut-off last image) until the user resizes the window.
- **Evidence:**
  ```ts
  travel = Math.max(0, track.scrollWidth - window.innerWidth); // read before images settle
  section.style.height = `${stickyH + travel}px`;
  // only re-measured on window "resize"
  ```
- **Data Impact:** Incorrect pin geometry (visual data-presentation defect) until a resize event; not a persisted-data issue.
- **Recommendation:** Attach a `ResizeObserver` to `trackRef` (and `stickyRef`) that calls `measure()`, and add `void document.fonts?.ready.then(measure)` as `ApartmentCatalog` already does. Debounce with rAF to avoid thrash.

---

### [DATA-008] Unsafe `as string` / `as unknown→string` casts on FormData and CMS list values
- **Severity:** Medium
- **Category:** Type Safety
- **File:** `src/app/contact/ContactForm.tsx` (Line 23–26), `src/components/sections/Contact/index.tsx` (Line 40–41), `src/components/sections/Popups/index.tsx` (Line 37–39), `src/app/page.tsx` (Line 190–192)
- **Status:** Open
- **Description:** `fd.get("name") as string` lies to the type system: `FormData.get` returns `string | null` (null if the field is missing/renamed), so a refactor that drops a field pushes `null` into `sendLead` where the type says `string`. Similarly, in `page.tsx` the MODX list item is cast `(c.image as string)` from `Record<string, unknown>` — if MODX returns a non-string for `image`/`imageAlt`, it flows straight into `next/image` `src`/`alt` and breaks rendering. These casts suppress exactly the checks that would catch upstream/shape drift.
- **Evidence:**
  ```tsx
  name: fd.get("name") as string,   // actually string | null
  image: (c.image as string) || s.image,   // c.image is unknown
  ```
- **Data Impact:** `null`/wrong-typed values silently propagate to CoMagic (empty/`"null"` name) and to `next/image` (broken/erroring src).
- **Recommendation:** Read FormData defensively: `String(fd.get("name") ?? "").trim()`, and validate before send. For CMS values use a `typeof x.image === "string" ? x.image : ""` guard (or Zod on the list). Avoid `as` casts on untrusted boundaries.

---

### [DATA-009] Yandex Metrika Webvisor session replay runs on pages with PII forms
- **Severity:** Medium
- **Category:** Data Exposure
- **File:** `src/app/layout.tsx`
- **Line:** 93–101 (`ym(..., 'init', { webvisor:true, ... })`), 81–89 (Mindbox tracker)
- **Status:** Open
- **Description:** Yandex Metrika is initialized site-wide with `webvisor:true` (session recording) plus Mindbox and GTM. These load on the contact and booking form pages where users type name/phone/email. Webvisor records DOM interaction; unless inputs are explicitly excluded, session replays can capture form field context. The form inputs carry no replay-masking hints (e.g. no data-attributes / classes to exclude fields from Webvisor/Mindbox capture), and consent to this recording is not gated before the trackers load.
- **Evidence:**
  ```tsx
  ym(104591840, 'init', { ssr:true, webvisor:true, clickmap:true, ... });
  ```
- **Data Impact:** Potential capture of PII typed into lead forms by a third-party session-replay/analytics vendor, without explicit consent gating.
- **Recommendation:** Mark PII inputs to be excluded from Webvisor/Mindbox capture (Metrika supports masking sensitive fields), and load session-replay trackers only after consent. Confirm the DPA with the vendors covers form-field capture.

---

### [DATA-010] Revalidation secret passed as URL query parameter
- **Severity:** Low
- **Category:** Data Exposure
- **File:** `src/app/api/revalidate/route.ts`
- **Line:** 10–13
- **Status:** Open
- **Description:** `/api/revalidate` reads its secret from `request.nextUrl.searchParams.get("secret")`. Query strings routinely land in server/proxy access logs, browser history, and `Referer` headers, so the secret is more exposure-prone than a header. The comparison is also a plain `!==` (not constant-time), though timing risk here is negligible. The endpoint is correctly guarded when `REVALIDATE_SECRET` is unset (returns 401), which is good.
- **Evidence:**
  ```ts
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) { ... 401 }
  ```
- **Data Impact:** Revalidation secret may leak via logs/referrers; if leaked, an attacker can force cache purges (DoS-ish, not data loss).
- **Recommendation:** Accept the secret via an `Authorization`/`x-revalidate-secret` header instead of the query string; compare with a constant-time function. Update the MODX OnDocFormSave webhook accordingly.

---

### [DATA-011] Apartments catalog cache is time-only (no tag) and mock snapshot has no conformance guard
- **Severity:** Low
- **Category:** State & Cache
- **File:** `src/lib/api.ts` (Line 46–70 flats fetch) and `src/lib/flats.mock.ts` (whole file)
- **Status:** Open
- **Description:** Two related freshness issues. (1) The `/flats` and `/flat` fetches use `next: { revalidate: 60 }` with **no cache tag**, while the MODX `/api/revalidate` webhook invalidates by **tag** (`revalidateTag`). So a price/status change in the CRM cannot be pushed on-demand to the catalog — it only refreshes on the 60s timer, leaving up to a minute of stale prices/availability. (Page content fetches, by contrast, correctly use tags.) (2) `MOCK_FLATS` is a hand-maintained snapshot used on preview deploys; nothing asserts it still matches the `Flat` shape or that `amount ≈ price × area` (values are currently internally consistent — verified: e.g. #13 116,464,000 / 50.2 = 2,320,000 = `price` ✓ for all 6 rows — but drift is silent). The header comment also misstates the covered ranges ("площади 50–166 м²"/"цена ... до 2.5 млн" vs actual max 156.1 м² / 2.32 млн).
- **Evidence:**
  ```ts
  const res = await fetch(`${API_BASE_URL}/flats`, { next: { revalidate: REVALIDATE_TIME } }); // no tags
  ```
- **Data Impact:** Up to 60s of stale catalog prices/availability after a CRM edit; risk of silent mock drift on preview.
- **Recommendation:** Add a cache tag (e.g. `["flats"]`) to the flats/flat fetches and have the MODX webhook revalidate it. Add a tiny build-time/test assertion over `MOCK_FLATS` (each row parses as `Flat`; `Math.round(amount/area) === price`) and fix the stale range comment.

---

### [DATA-012] Dead, unvalidated MODX scaffolding; raw CMS HTML fields would be XSS if ever rendered
- **Severity:** Low
- **Category:** Type Safety / Data Exposure
- **File:** `src/lib/modx/client.ts`, `src/lib/modx/resources.ts`, `src/lib/modx/types.ts`
- **Status:** Open
- **Description:** `modxFetch`/`getResourceByAlias`/`getResources` are exported but unused anywhere in the app (the live content path is `src/lib/api.ts`). They cast responses with no validation and carry TODO placeholder endpoint names (`"resource"`/`"resources"`). `ModxResource` exposes `content`/`introtext` — raw MODX HTML — and `tv: Record<string, unknown>`. Today CMS text is rendered as plain JSX strings (safe) and the only `dangerouslySetInnerHTML` (`MapVector`) uses a static local constant (safe). But if this scaffolding is wired up and `content`/`introtext` is later rendered via `dangerouslySetInnerHTML`, it becomes stored XSS from CMS-authored HTML.
- **Evidence:**
  ```ts
  export type ModxResource = { /* ... */ content?: string; introtext?: string; tv?: Record<string, unknown>; };
  return response.json() as Promise<T>; // no validation
  ```
- **Data Impact:** None today (dead code); latent stored-XSS/shape risk if activated without validation + sanitization.
- **Recommendation:** Either delete the unused `src/lib/modx/*` scaffolding until needed, or before wiring it add response validation and sanitize any HTML field (DOMPurify / server sanitizer) before rendering. Add a lint rule flagging `dangerouslySetInnerHTML` on CMS-sourced values.

---

### [DATA-013] Favorites localStorage key is shared across environments; stale/foreign ids silently dropped
- **Severity:** Low
- **Category:** State & Cache
- **File:** `src/store/favorites.ts` (Line 19–34, key `"k711-favorites"`), `src/app/favorites/FavoritesList.tsx` (Line 81)
- **Status:** Open
- **Description:** Favorites are persisted under a fixed key `"k711-favorites"` with no version and no environment/dataset namespacing. The preview deploy uses the 6-item mock catalog (ids "4","5","13"…) while prod uses live CRM ids; a browser that visits both shares one favorites list, so ids saved in one context won't resolve in the other. `FavoritesList` filters the catalog by saved ids (`apartments.filter(a => ids.includes(a.id))`), so any id that no longer exists (sold/removed apartment, or foreign environment) silently disappears with no user feedback. Additionally, if `fetchApartments()` fails and returns `[]`, all saved favorites render as empty even though they're still stored.
- **Evidence:**
  ```ts
  persist((set) => ({ ids: [], /* ... */ }), { name: "k711-favorites" });
  // FavoritesList: const items = apartments.filter((a) => ids.includes(a.id));
  ```
- **Data Impact:** Confusing "missing" favorites across environments and after catalog changes; no reconciliation/versioning.
- **Recommendation:** Add a `version` to the persist config and prune ids not present in the current catalog on load (or show "no longer available" placeholders). Namespace the key per environment if preview and prod share a domain, and distinguish "empty favorites" from "catalog failed to load".

---
```
