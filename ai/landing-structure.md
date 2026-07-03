---
name: landing-structure
description: k711 landing — full page is built; reusable section components and remaining tech debt
metadata: 
  node_type: memory
  type: project
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

Главная страница k711 **полностью свёрстана** (desktop+mobile, проверено в браузере). Порядок секций — в `src/app/page.tsx` (соответствует Figma node 277-16678).

Переиспользуемые компоненты (на них собрано большинство блоков):
- `ui/CascadeHeading` — каскадный многострочный заголовок (части big=H1 44→120 / lg=28→68, tone brown|white). Ядро почти всех заголовков.
- `ui/Reveal` — анимация «шторка» (clip-path, IO на необрезанной обёртке — см. [[reveal-component]]).
- `ui/Slider` — Swiper-карусель (centeredSlides), 5 инстансов на странице с разным контентом.
- `sections/FeatureScreen` — фото+заголовок+описание+кнопка (screen 2/3: фасад 1905, Чобан).
- `sections/ImageHeading` — фото на всю ширину + белый каскад (сад, лобби).
- `sections/CreamHeading` — каскад на креме (перейти в режим тихой пресни).
- `sections/TextDuo` — заголовок + 2 текст-колонки (variant right|full).
- `sections/Contact` — форма «записаться на встречу» (статика, без сабмита).
- `layout/Footer` — настоящий футер (тёмный, лого `logo-light.svg`, навигация, дисклеймер, MR PRIVATE).

**Техдолг / на потом:**
1. Существующие ранние блоки (Statement, Residences, HistoricCenter, Surroundings, Scenario) НЕ переведены на `CascadeHeading`/`FeatureScreen` — дублируют паттерны. Можно отрефакторить.
2. Кастомная шкала заголовка `clamp(1.75rem, 0.9167rem + 3.7037vw, 4.25rem)` (28→68) повторяется в коде — просится в токен.
3. Общий `ui/Button` так и не вынесен (контурная/залитая кнопка в Header/Hero/Residences/Presentation/FeatureScreen/Contact).
4. Интерактив карты (`Location`) и формы (`Contact`) — пока статика; данные POI/слайдеров — плейсхолдеры (ждут MODX).
5. Мобильная карта (`Location`) использует десктопный `map.png` (портретный кроп); тяжёлые PNG слайдера (11.5/7.7MB) не сжаты.
