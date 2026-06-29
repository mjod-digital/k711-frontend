"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import styles from "./Modal.module.scss";

// Эффект «матовое стекло» инлайном: CSS-оптимизатор Next 16 выкидывает
// backdrop-filter из скомпилированного правила (как в Menu) — инлайн он не трогает.
const FROST = {
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
} as const;

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Класс панели (ширина/паддинги конкретного попапа). */
  className?: string;
  /** id заголовка внутри панели — для aria-labelledby диалога. */
  labelledBy?: string;
  children: ReactNode;
};

// Переиспользуемый попап: блюр-подложка (как у меню) + кремовая панель по центру.
// Портал в body, Esc/клик мимо закрывают, body не скроллится, фокус — в панель,
// возврат фокуса на триггер при закрытии.
export function Modal({ open, onClose, className, labelledBy, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const trigger = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Фокус-ловушка: Tab/Shift+Tab циклятся внутри панели (aria-modal не держит фокус).
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // Лочим фон: overflow — нативный фолбэк, но реально скролл держит Lenis (как в Preloader).
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const lenis = (window as Window & {
      __lenis?: { stop?: () => void; start?: () => void };
    }).__lenis;
    lenis?.stop?.();
    panel?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start?.();
      // Возврат фокуса только если триггер ещё в DOM (не дёргаем при уходе на /apartments).
      if (trigger?.isConnected) trigger.focus?.();
    };
  }, [open, onClose]);

  // open=true бывает только после клиентского взаимодействия (стор пуст на SSR),
  // поэтому document здесь всегда есть; guard на всякий случай.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.root}>
      <button
        type="button"
        className={styles.backdrop}
        style={FROST}
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={cn(styles.panel, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        data-menu-scroll
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Закрыть"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
