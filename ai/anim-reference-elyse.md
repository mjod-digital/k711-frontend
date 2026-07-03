---
name: anim-reference-elyse
description: Эталон скролл-анимаций для k711 — сайт Elyse (как заказчик хочет «развороты»)
metadata: 
  node_type: memory
  type: reference
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

Заказчик дал референс анимаций: **https://elyse-residence-dev.webflow.io/**. К нему приводим скролл-анимации k711 (особенно «развороты картинок» — старые clip-«занавесы» заказчику НЕ нравятся).

Что под капотом у Elyse (проверено в браузере): **GSAP 3.15 + ScrollTrigger + SplitText**, Webflow IX, нативный скролл (без Lenis).
- **Картинки**: кадр в `overflow:hidden`-рамке; сам `<img>` плавно **scale (≈1.0→1.03) + translateY (параллакс)** по скроллу (scrubbed). Никаких clip-path «штор». Появление — мягкий fade + zoom-out.
- **Текст**: SplitText — построчные маски (строка едет вверх из-под `overflow:hidden`), снизу вверх, со стаггером. У нас это уже есть как [[reveal-component]] `variant="lines"` / `.reveal-line`.

ВАЖНО про k711 (итог итераций): заказчик ХОЧЕТ clip-«развороты» картинок (снизу вверх в Showcase, слева направо в Presentation) — fade/opacity он ОТВЕРГ. Из Elyse мы взяли только ПЛАВНОСТЬ = демпфирование прогресса (lerp `p += (target-p)*0.085`, аналог GSAP `scrub:1`), а визуал остаётся clip-развороткой. См. [[pinned-gallery]]. Slider/Hero/Scenario — параллакс (ок). Т.е. «как в Elyse» здесь = плавный scrub, НЕ замена clip на fade.
