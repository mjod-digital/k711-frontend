"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import styles from "./Menu.module.scss";

// Эффект «матовое стекло» задаём ИНЛАЙНОМ: CSS-оптимизатор Next 16 выкидывает
// backdrop-filter из скомпилированного правила (баг), инлайн он не трогает.
const FROST: CSSProperties = {
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
};

const NAV = [
  "Главная",
  "Локация",
  "Архитектура",
  "Аменитис",
  "Благоустройство",
  "Паркинг",
  "Историческая справка",
  "Офис продаж",
];

const PICK = ["Выбор по параметрам", "Визуальный выбор"];

type MenuProps = { open: boolean; onClose: () => void };

export function Menu({ open, onClose }: MenuProps) {
  // Esc закрывает, body не скроллится пока меню открыто.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Возврат фокуса на триггер (бургер) при закрытии: иначе после Esc / клика мимо
  // фокус остаётся на уже скрытых (tabindex -1, aria-hidden) пунктах меню.
  // Ключ только [open] — чтобы не воровать фокус на каждый ре-рендер шапки.
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    return () => trigger?.focus?.();
  }, [open]);

  const tab = open ? 0 : -1;

  return (
    <div className={cn(styles.root, open && styles.open)} aria-hidden={!open}>
      {/* Клик мимо панели закрывает (на десктопе справа видна страница) */}
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Закрыть меню"
        tabIndex={tab}
        onClick={onClose}
      />

      <nav className={styles.panel} style={FROST} aria-label="Главное меню">
        {/* data-lenis-prevent: Lenis не перехватывает колесо над меню → нативный скролл панели */}
        <div className={styles.scroll} data-lenis-prevent>
          <div className={styles.group}>
            <p className={styles.label}>Меню</p>
            <ul className={styles.list}>
              {NAV.map((l) => (
                <li key={l}>
                  <a href="#" className={styles.link} tabIndex={tab} onClick={onClose}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.group}>
            <p className={styles.label}>Выбрать квартиру</p>
            <ul className={styles.list}>
              {PICK.map((l) => (
                <li key={l}>
                  <a href="#" className={styles.link} tabIndex={tab} onClick={onClose}>
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Телефон в панели — только на мобайле (на десктопе он в шапке) */}
          <div className={cn(styles.group, styles.contacts)}>
            <p className={styles.label}>Офис продаж</p>
            <a href={siteConfig.phone.href} className={styles.phone} tabIndex={tab}>
              {siteConfig.phone.display}
            </a>
          </div>

          {/* Логотип MR Private (макет 373-10156 «logo second») */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mr-private.svg"
            alt="MR Private"
            className={styles.brand}
            width={134}
            height={20}
          />
        </div>
      </nav>
    </div>
  );
}
