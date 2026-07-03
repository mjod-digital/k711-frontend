---
name: reveal-component
description: Переиспользуемая анимация «шторка» (Reveal) и подводный камень clip-path × IntersectionObserver
metadata: 
  node_type: memory
  type: project
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

`src/components/ui/Reveal` — анимация появления «через шторку», переиспользуется во многих секциях лендинга (первое использование — секция Statement). Варианты: `clip` (clip-path wipe, по умолчанию) и `panel` (кремовая шторка съезжает). Props: `as`, `delay` (каскад), `direction`, `duration`, `variant`, `panelColor`, `once`. SSR/no-JS-safe: пока нет `data-reveal` — контент полностью виден; армится до отрисовки через [[figma-design-source]]-независимый isomorphic layout-эффект (`src/lib/useIsomorphicLayoutEffect.ts`).

**Критично (иначе reveal не срабатывает):** `clip-path` на наблюдаемом элементе ОБНУЛЯЕТ площадь пересечения IntersectionObserver (проверено: clipped ratio 0, unclipped ratio 1). Поэтому IO должен наблюдать за ВНЕШНЕЙ необрезанной обёрткой (`.reveal`), а clip-path/анимация — на ВНУТРЕННЕМ элементе. Не объединять эти два слоя в один.

**Why:** дизайн-панель и ревью-агенты это пропустили — баг проявился только в реальном браузере (Playwright стоит в devDependencies). **How to apply:** при правках Reveal или новых scroll-триггерах не вешать clip-path на тот же узел, что наблюдает IO; проверять рантайм в браузере, не только сборку.

**Следствие (всплыло в секции Location):** нельзя вешать `Reveal` напрямую на абсолютно-позиционированный элемент — внутренний клипнутый узел уходит из потока, обёртка `.reveal` схлопывается в высоту 0 → IO снова не срабатывает. Решение: позиционирование на ОТДЕЛЬНОЙ внешней обёртке (напр. `.headingWrap`), а `Reveal` с текстом — внутри неё, в нормальном потоке (`<div headingWrap><Reveal as="h2">…</Reveal></div>`).

**Направление по умолчанию = снизу вверх (вся текстовая анимация лендинга, требование заказчика).** В `Reveal.module.scss` для clip-варианта: `.up` = `inset(100% 0 0 0)` (окно у нижней кромки → растёт вверх), `.down` = `inset(0 0 100% 0)`. Семантика `clip-path: inset(T R B L)` контринтуитивна — `T 100%` прижимает «окно» к низу. Раньше значения были перепутаны (`.up` давал визуально сверху-вниз).

**Тайминг (правка дизайнера 2026-06-23): «не так быстро, запуск ближе к центру».** IO теперь `rootMargin: "0px 0px -35% 0px"` (было -10%) → reveal стартует, когда контент дошёл ~до центра экрана, а не коснулся нижней кромки. Длительности замедлены: clip/panel `--reveal-duration` 720→**1100ms**; строки `--reveal-line-duration` 900→**1300ms**, `--reveal-line-stagger` 150→**220ms**. **Caveat для будущих страниц:** при -35% reveal-элемент в самом низу страницы (в последнем экране, который нельзя проскроллить так, чтобы он поднялся выше 65% вьюпорта) НЕ сработает и останется скрытым. На главной такого нет (последний Reveal — TextDuo full, после него ещё Slider+Contact). На новых страницах проверять, нет ли Reveal в последнем экране.

**Заголовки = ПОСТРОЧНАЯ каскадная шторка (требование заказчика «каждая строка своей шторкой, по очереди»).** Механизм: `<Reveal variant="lines">` — в этом режиме контейнер НЕ клипается (клипаются строки), поэтому IO/`data-reveal` вешаются на ВНУТРЕННИЙ элемент (`host.firstElementChild`) — он имеет высоту даже при `position:absolute` (так обходится 0-height-ловушка для абсолютных заголовков ImageHeading/Scenario/Location). Каждая строка — глобальный класс `.reveal-line` + inline `style="--i"` (порядок). Анимация — в `globals.scss`: `[data-reveal] .reveal-line` (clip снизу вверх, `--reveal-line-duration` 900ms, `--reveal-line-stagger` 150ms). `CascadeHeading` уже навешивает `.reveal-line`/`--i` на каждую `.line`; span-заголовки (Surroundings/HistoricCenter/Scenario) и текстовые (Statement/Location, контейнер сделан `flex-direction:column`) — вручную.
