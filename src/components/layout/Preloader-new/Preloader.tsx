"use client";

import { useState } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { LOADING_CLASS, PRELOADER_CLASS } from "./PreloaderBoot";
import styles from "./Preloader.module.scss";

type Lenis = { stop?: () => void; start?: () => void };
type PreloaderWindow = Window & {
    __lenis?: Lenis;
    __preloaderDone?: boolean;
    /** Ставит boot-скрипт, когда занавес снимала страховка, а не React. */
    __preloaderFailsafe?: boolean;
};
const getWin = () => window as PreloaderWindow;
const getLenis = () => getWin().__lenis;

// Прелоудер первого экрана. Скролл залочен на hero (is-loading + Lenis.stop).
// Число идёт ПОСЛЕДОВАТЕЛЬНО 0→100 за ~2.4с (не прыгает 0→100). Пока контент
// реально не загрузился (hero-картинка) — счётчик держится на 99 и не пускает
// прелоудер исчезнуть; как только load пришёл — добивает 100 и гаснет.
// Страховка: если hero не пришла за 10с — всё равно завершаем.
//
// Слой ВИДЕН только при классе PRELOADER_CLASS на <html> — его ставит инлайн-
// скрипт PreloaderBoot в <head> (почему именно так — там же в комментарии).
// Разметка по-прежнему приходит с сервера, поэтому занавес на месте с первого
// кадра, но без выполненного JS он не показывается вовсе: страница видна.
function Preloader() {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<"loading" | "closing" | "done">("loading");

    useIsomorphicLayoutEffect(() => {
        const html = document.documentElement;

        // Бандл приехал ПОЗЖЕ страховки (медленная сеть, долгий чанк): контент уже
        // на экране и прокручивается — вешать занавес задним числом нельзя.
        // Просто отмечаемся «готово»: шторки hero ждут этого сигнала.
        if (getWin().__preloaderFailsafe) {
            getWin().__preloaderDone = true;
            window.dispatchEvent(new Event("preloader:done"));
            setPhase("done");
            return;
        }

        window.scrollTo(0, 0);
        // Классы обычно уже стоят от boot-скрипта (add идемпотентен). Дублируем
        // на случай, если инлайн-скрипт не выполнился (CSP без 'unsafe-inline')
        // или эффект перезапустился в dev-StrictMode: тогда прелоудер отыграет
        // с момента гидрации, а не с первого кадра.
        html.classList.add(PRELOADER_CLASS, LOADING_CLASS); // CSS: показать слой + overflow hidden
        getLenis()?.stop?.();
        // Lenis может создаться чуть позже (соседний эффект) — добиваем stop.
        const stopRaf = requestAnimationFrame(() => getLenis()?.stop?.());

        // Ждём именно HERO-картинку (data-hero) — приоритетную, она в SSR-HTML и уже
        // в DOM на момент этого layout-effect. Прелоудер НЕ гаснет, пока она не
        // загрузилась → после прелоудера hero всегда на месте. (Раньше ждали
        // window.load — на медленной загрузке срабатывала 8с-страховка и гасила
        // прелоудер с ещё не загруженным hero.)
        let loaded = false;
        const markLoaded = () => {
            loaded = true;
        };
        const hero = document.querySelector<HTMLImageElement>("img[data-hero]");
        const detachHero = () => {
            hero?.removeEventListener("load", markLoaded);
            hero?.removeEventListener("error", markLoaded);
        };
        if (hero) {
            if (hero.complete && hero.naturalWidth > 0) {
                loaded = true; // уже загружена (кэш)
            } else {
                hero.addEventListener("load", markLoaded, { once: true });
                hero.addEventListener("error", markLoaded, { once: true }); // не виснем на ошибке
            }
        } else {
            // Нет hero (например, /genplan) — защищать нечего, гасим вместе со
            // счётчиком. window.load тут не ждём: его держат сторонние трекеры
            // (GTM, Метрика, CoMagic), и на генплане шторка висела ~10с до
            // страховки, хотя сцена была готова за секунду.
            loaded = true;
        }

        let done = false;
        let tick = 0;
        let closeT = 0;

        const finish = () => {
            if (done) return;
            done = true;
            window.clearInterval(tick);
            setProgress(100);
            html.classList.remove(LOADING_CLASS); // прокрутка снова свободна
            getLenis()?.start?.();
            window.scrollTo(0, 0);
            setPhase("closing");
            // Сигнал hero: прелоудер уходит — только теперь запускаем шторку
            // заголовка (иначе она отыгрывает «вслепую» под прелоудером).
            getWin().__preloaderDone = true;
            window.dispatchEvent(new Event("preloader:done"));
            closeT = window.setTimeout(() => {
                // PRELOADER_CLASS снимаем только ПОСЛЕ fade: он управляет display,
                // и убери его раньше — плавное гашение сменилось бы рывком.
                html.classList.remove(PRELOADER_CLASS);
                setPhase("done");
            }, 500); // = fade в CSS
        };

        // 0→100 за 2.4с. Шаг считаем по ЧАСАМ, а не «+1 за тик»: в фоновой вкладке
        // браузер режет setInterval до ~1 раза в секунду, и счётчик по тикам
        // растянулся бы на ~100с — дольше CSS-страховки, т.е. слой снялся бы
        // из-под ещё работающего скрипта. По времени 100% достигается за те же
        // 2.4с в любой вкладке, а на видимой вкладке шаг тот же 1%/24мс.
        const startedAt = performance.now();
        let current = 0;
        tick = window.setInterval(() => {
            const cap = loaded ? 100 : 99; // пока hero не загружена — потолок 99
            const byTime = Math.floor((performance.now() - startedAt) / 24);
            current = Math.max(current, Math.min(byTime, cap)); // только вперёд
            setProgress(current);
            if (current >= 100) finish();
        }, 24);

        // Жёсткая страховка: если hero так и не пришла за 10с — всё равно завершаем.
        const fallback = window.setTimeout(() => {
            loaded = true;
        }, 10000);

        return () => {
            window.clearInterval(tick);
            window.clearTimeout(fallback);
            window.clearTimeout(closeT);
            cancelAnimationFrame(stopRaf);
            detachHero();
            window.removeEventListener("load", markLoaded);
            html.classList.remove(PRELOADER_CLASS, LOADING_CLASS);
            getLenis()?.start?.();
        };
    }, []);

    if (phase === "done") return null;

    return (
        <div
            id="preloader"
            className={`${styles.root} ${phase === "closing" ? styles.fadeOut : ""}`}
            aria-hidden="true"
        >
            <div className={styles.txt}>
                <p className={styles.txt_perc}>{progress}%</p>
                <div className={styles.progress}>
                    <span style={{ width: `${progress}%` }}></span>
                </div>
            </div>
        </div>
    );
}

export default Preloader;
