"use client";

import { useState } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./Preloader.module.scss";

type Lenis = { stop?: () => void; start?: () => void };
const getLenis = () => (window as Window & { __lenis?: Lenis }).__lenis;

// Первый экран = прелоудер: пока контент не загрузился (window.load), скролл
// залочен на hero. Когда готово — разлочиваем, индикатор «дозаполняется» и гаснет.
export function Preloader() {
  const [phase, setPhase] = useState<"loading" | "closing" | "done">("loading");

  useIsomorphicLayoutEffect(() => {
    const html = document.documentElement;
    window.scrollTo(0, 0);
    html.classList.add("is-loading"); // CSS: overflow hidden на html/body
    getLenis()?.stop?.(); // на случай, если Lenis уже создан

    // Lenis может создаться чуть позже (соседний эффект) — добиваем stop ещё раз.
    const stopRaf = requestAnimationFrame(() => getLenis()?.stop?.());

    let finished = false;
    const startedAt = performance.now();
    const MIN_VISIBLE = 800; // не мигаем, если контент уже в кэше

    const finish = () => {
      if (finished) return;
      finished = true;
      const wait = Math.max(0, MIN_VISIBLE - (performance.now() - startedAt));
      window.setTimeout(() => {
        // разлочиваем скролл и запускаем индикатор «закрытия»
        html.classList.remove("is-loading");
        getLenis()?.start?.();
        window.scrollTo(0, 0);
        setPhase("closing");
        window.setTimeout(() => setPhase("done"), 500);
      }, wait);
    };

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    // страховка: не держим экран залоченным дольше 8с, что бы ни случилось
    const fallback = window.setTimeout(finish, 8000);

    return () => {
      cancelAnimationFrame(stopRaf);
      window.removeEventListener("load", finish);
      clearTimeout(fallback);
      html.classList.remove("is-loading");
      getLenis()?.start?.();
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={cn(styles.root, phase === "closing" && styles.closing)}
      aria-hidden="true"
    >
      <span className={styles.bar}>
        <span className={styles.fill} />
      </span>
    </div>
  );
}
