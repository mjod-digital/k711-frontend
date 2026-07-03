'use client';

import { useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import styles from './Preloader.module.scss';

type Lenis = { stop?: () => void; start?: () => void };
const getLenis = () => (window as Window & { __lenis?: Lenis }).__lenis;

// Прелоудер первого экрана. Скролл залочен на hero (is-loading + Lenis.stop).
// Число идёт ПОСЛЕДОВАТЕЛЬНО 0→100 за ~2.4с (не прыгает 0→100). Пока контент
// реально не загрузился (window.load) — счётчик держится на 99 и не пускает
// прелоудер исчезнуть; как только load пришёл — добивает 100 и гаснет. Картинки
// секций loading="eager" → блокируют window.load, значит к концу они уже скачаны.
// Страховка: если load не пришёл за 8с — всё равно завершаем.
function Preloader() {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'loading' | 'closing' | 'done'>('loading');

    useIsomorphicLayoutEffect(() => {
        const html = document.documentElement;
        window.scrollTo(0, 0);
        html.classList.add('is-loading'); // CSS: overflow hidden на html/body
        getLenis()?.stop?.();
        // Lenis может создаться чуть позже (соседний эффект) — добиваем stop.
        const stopRaf = requestAnimationFrame(() => getLenis()?.stop?.());

        let loaded = document.readyState === 'complete';
        const onLoad = () => {
            loaded = true;
        };
        if (!loaded) window.addEventListener('load', onLoad, { once: true });

        let done = false;
        let tick = 0;
        let closeT = 0;

        const finish = () => {
            if (done) return;
            done = true;
            window.clearInterval(tick);
            setProgress(100);
            html.classList.remove('is-loading');
            getLenis()?.start?.();
            window.scrollTo(0, 0);
            setPhase('closing');
            closeT = window.setTimeout(() => setPhase('done'), 500); // = fade в CSS
        };

        // 100 шагов × 24мс ≈ 2.4с. Пока не loaded — потолок 99 (держим до load).
        let current = 0;
        tick = window.setInterval(() => {
            const cap = loaded ? 100 : 99;
            current = Math.min(current + 1, cap);
            setProgress(current);
            if (current >= 100) finish();
        }, 24);

        const fallback = window.setTimeout(() => {
            loaded = true; // разблокирует добивание до 100 в ближайший tick
        }, 8000);

        return () => {
            window.clearInterval(tick);
            window.clearTimeout(fallback);
            window.clearTimeout(closeT);
            cancelAnimationFrame(stopRaf);
            window.removeEventListener('load', onLoad);
            html.classList.remove('is-loading');
            getLenis()?.start?.();
        };
    }, []);

    if (phase === 'done') return null;

    return (
        <div
            id="preloader"
            className={`${styles.root} ${phase === 'closing' ? styles.fadeOut : ''}`}
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
