/** Класс на <html>: «слой прелоудера на экране». В CSS слой скрыт по умолчанию
 *  и показывается ТОЛЬКО по этому классу. */
export const PRELOADER_CLASS = "preloader-on";

/** Класс на <html>: «идёт загрузка первого экрана» — лочит прокрутку
 *  (правило html.is-loading в globals.scss). */
export const LOADING_CLASS = "is-loading";

/** Через сколько boot-скрипт сам снимает классы, если React этого не сделал.
 *  Позже CSS-страховки (11с) и позже жёсткого таймаута внутри Preloader (10с),
 *  чтобы страховка не срабатывала поверх живого штатного сценария. */
export const PRELOADER_FAILSAFE_MS = 12000;

// Инлайн-скрипт, который «включает» прелоудер.
//
// ПОЧЕМУ КЛАСС СТАВИТ СКРИПТ, А НЕ СЕРВЕР. Слой прелоудера скрыт в CSS по
// умолчанию (display: none) и появляется только при PRELOADER_CLASS на <html>.
// Инвариант: НАКРЫТЬ страницу способен лишь выполнившийся JS, а СНЯТЬ занавес
// можно и без него. Поэтому любой отказ скриптов — выключенный JS, инлайн,
// зарезанный CSP, не доехавший чанк бандла, исключение при гидрации — оставляет
// пользователя с видимым серверным HTML. Раньше было наоборот: разметка
// прелоудера приходила непрозрачным слоем с сервера и снималась только эффектом
// React, так что единственный сбой скриптов давал кремовый экран с «0%» навсегда.
//
// ПОЧЕМУ ИНЛАЙН И В <head>. Браузер выполняет такой скрипт синхронно при парсинге
// HTML — до первой отрисовки (next docs: 01-app/02-guides/preventing-flash-before-
// hydration.md). Значит класс стоит ещё до того, как отрисуется body, и прелоудер
// накрывает первый экран без вспышки контента, ровно как при серверном слое.
// Сетевого запроса у скрипта нет → «не загрузиться» он не может, в отличие от
// бандла; при этом он настолько мал, что падать в нём нечему (плюс try/catch).
//
// ВТОРАЯ СТРАХОВКА (первая — CSS-анимация в Preloader.module.scss). CSS гасит
// видимость слоя сам, но снять overflow: hidden с html/body он не может
// (overflow не анимируется), а без этого пользователь увидел бы страницу и не
// смог её прокрутить. Поэтому класс-локер по таймеру снимает сам boot-скрипт:
// этот таймер заводит тот же код, который поставил класс, он не зависит ни от
// бандла, ни от React, ни от гидрации. Флаг __preloaderFailsafe говорит
// опоздавшему бандлу, что занавес уже снят и повторно его вешать нельзя.
const PRELOADER_BOOT_SCRIPT = `(function(d,w){try{var h=d.documentElement;h.classList.add("${PRELOADER_CLASS}","${LOADING_CLASS}");w.setTimeout(function(){if(!h.classList.contains("${PRELOADER_CLASS}"))return;h.classList.remove("${PRELOADER_CLASS}","${LOADING_CLASS}");w.__preloaderFailsafe=true;try{if(w.__lenis&&w.__lenis.start)w.__lenis.start()}catch(e){}},${PRELOADER_FAILSAFE_MS})}catch(e){}})(document,window);`;

/** Рендерится в <head> из src/app/layout.tsx — см. комментарий выше. */
export function PreloaderBoot() {
  return (
    <script
      type="text/javascript"
      dangerouslySetInnerHTML={{ __html: PRELOADER_BOOT_SCRIPT }}
    />
  );
}
