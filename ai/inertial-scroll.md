---
name: inertial-scroll
description: Site-wide smooth/inertial scroll via Lenis (wheel only); GalleryStrip pin eased with lerp
metadata: 
  node_type: memory
  type: project
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

Site uses **Lenis** for inertial scroll — `src/components/layout/SmoothScroll.tsx` (client island rendered in `layout.tsx`). Key choices:
- `new Lenis({ lerp: 0.1, smoothWheel: true })` — **wheel only**; `smoothTouch` stays default-off so mobile keeps native momentum and Swiper/horizontal gestures don't conflict.
- **Disabled under `prefers-reduced-motion`** (effect returns early → no Lenis, `html.lenis` absent).
- Lenis updates the real scroll position, so all scroll-driven code keeps working unchanged: GalleryStrip sticky pin ([[pinned-gallery]]), section scroll-scrub (Showcase/Terraces/Presentation), hide-on-scroll Header.
- A document `click` handler smooth-scrolls in-page anchors (`a[href^="#"]`, href length ≥ 2) via `lenis.scrollTo`; placeholder `href="#"` and `next/link` routes are ignored.

**Why:** designer asked for inertial scroll + the GalleryStrip horizontal slide felt "топорно".
**How to apply:** GalleryStrip desktop pin now eases its track with its own lerp (factor 0.12, wake/rAF-sleep) on top of Lenis. If a future scroll effect feels too floaty, the double-damping (Lenis + per-section lerp) is the cause — reduce the per-section lerp, don't fight Lenis.
