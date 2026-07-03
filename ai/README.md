# AI context notes

Longer-lived project context worth keeping across sessions — architecture
decisions, gotchas, infra/deploy state, and preferences that aren't obvious
from the code or git history. One file per topic; this README is the index.

- [Project overview](project-overview.md) — k711: fluid Next.js landing, SCSS Modules, headless MODX
- [Prefers SCSS Modules](prefers-scss-modules.md) — user wants SCSS Modules, not Tailwind
- [Figma design source](figma-design-source.md) — Figma file + nodes 277-16678 (1440) & 277-16963 (360) for design tokens
- [Reveal component](reveal-component.md) — reusable «шторка» animation; clip-path × IntersectionObserver gotcha
- [Landing structure](landing-structure.md) — full page built; reusable section components + tech debt
- [Rubber system](rubber-system.md) — «резина» via root font-size calc(100vw/artboard) + rem, no clamp
- [Pinned gallery](pinned-gallery.md) — GalleryStrip sticky+translateX pin; measure-after-class + overflow-breaks-sticky gotchas
- [Anim reference: Elyse](anim-reference-elyse.md) — клиентский эталон скролл-анимаций; картинки = fade+scale+parallax, не clip-занавесы
- [Multipage plan](multipage-plan.md) — 7 inner pages (slugs+nodes), separate Figma file, branch-per-page
- [Inertial scroll](inertial-scroll.md) — Lenis site-wide (wheel only); GalleryStrip pin eased via lerp
- [Map vector](map-vector.md) — Location map is inline-SVG (MapVector) assembled from Figma, not raster
- [Prod deployment](prod-deployment.md) — k711 live on :3001 (Node 22) via blue-green; old app :3000 kept as rollback (decommission pending); MODX untouched; forms→CoMagic
