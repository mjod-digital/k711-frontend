"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { MapVector } from "@/components/ui/MapVector";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./Location.module.scss";

type Category = "развлечения" | "спорт" | "рестораны" | "парки";

type Place = {
  id: string;
  category: Category;
  x: number; // % по горизонтали (центр пина) — относительно карты (.pan)
  y: number; // % по вертикали (остриё пина)
  title: string;
  text: string;
};

const CATEGORIES: { label: "все" | Category; count: number }[] = [
  { label: "все", count: 9 },
  { label: "развлечения", count: 4 },
  { label: "спорт", count: 1 },
  { label: "рестораны", count: 2 },
  { label: "парки", count: 2 },
];

// Реальные точки окружения. Координаты (x/y в % от .pan) — черновые: одинаковы
// для десктопа и мобайла (общий массив), точное расположение уточняется отдельно.
const PLACES: Place[] = [
  {
    id: "museum-tsereteli",
    category: "развлечения",
    x: 55,
    y: 20,
    title: "Музей-мастерская Зураба Церетели",
    text: "Пространство искусства для тех, кто ценит камерные выставки и вдохновляющие открытия. Идеальное место, чтобы провести вечер в атмосфере творчества.",
  },
  {
    id: "planetarium",
    category: "развлечения",
    x: 30,
    y: 25,
    title: "Московский планетарий",
    text: "Место, где привычный городской ритм сменяется ощущением бескрайнего космоса. Для семейных выходных, свиданий и новых впечатлений.",
  },
  {
    id: "zotov-center",
    category: "развлечения",
    x: 62,
    y: 33,
    title: "Центр Зотов",
    text: "Точка притяжения современной Москвы с выставками, лекциями и кинопоказами. Здесь культурная жизнь становится частью повседневности.",
  },
  {
    id: "catholic-cathedral",
    category: "развлечения",
    x: 24,
    y: 46,
    title: "Католический Собор",
    text: "Знаковая архитектура, органные концерты и особая атмосфера тишины — место, где можно ненадолго отвлечься от ритма большого города.",
  },
  {
    id: "world-class",
    category: "спорт",
    x: 68,
    y: 52,
    title: "World Class",
    text: "Премиальный фитнес-клуб с бассейном, современными тренировочными пространствами и сервисом, который делает спорт частью комфортного образа жизни.",
  },
  {
    id: "eva",
    category: "рестораны",
    x: 48,
    y: 58,
    title: "EVA",
    text: "Один из самых востребованных ресторанов города с современной греческой кухней. Место для долгих завтраков, встреч и красивых вечеров.",
  },
  {
    id: "coffeemania",
    category: "рестораны",
    x: 58,
    y: 70,
    title: "Кофемания",
    text: "Легендарное городское кафе, где одинаково комфортно начать утро, провести деловую встречу или сделать паузу среди насыщенного дня.",
  },
  {
    id: "moscow-zoo",
    category: "парки",
    x: 34,
    y: 62,
    title: "Московский зоопарк",
    text: "Зелёный оазис в центре Москвы для прогулок всей семьёй. Пространство, где природа и городской ритм гармонично дополняют друг друга.",
  },
  {
    id: "patriarch-ponds",
    category: "парки",
    x: 46,
    y: 30,
    title: "Патриаршие пруды",
    text: "Один из самых престижных и атмосферных районов Москвы — место для неспешных прогулок, встреч и вечеров в лучших ресторанах города.",
  },
];

const inCategory = (p: Place, active: "все" | Category) =>
  active === "все" || p.category === active;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export function Location({ className }: { className?: string }) {
  const [active, setActive] = useState<"все" | Category>("все");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dropped, setDropped] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // перетаскивание карты внутри контейнера (карта может быть шире контейнера)
  const drag = useRef({
    active: false,
    moved: false,
    sx: 0,
    sy: 0,
    bx: 0,
    by: 0,
    x: 0,
    y: 0,
    maxX: 0,
    maxY: 0,
  });

  // Пины падают, карта проступает — при попадании секции в зону видимости.
  useIsomorphicLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDropped(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          setDropped(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Считаем перерасход карты над контейнером и центрируем (mount + resize).
  useIsomorphicLayoutEffect(() => {
    const setup = () => {
      const pan = panRef.current;
      const map = mapRef.current;
      if (!pan || !map) return;
      const d = drag.current;
      d.maxX = Math.max(0, pan.offsetWidth - map.clientWidth);
      d.maxY = Math.max(0, pan.offsetHeight - map.clientHeight);
      d.x = clamp(-d.maxX / 2, -d.maxX, 0); // старт по центру карты
      d.y = clamp(-d.maxY / 2, -d.maxY, 0);
      pan.style.setProperty("--px", `${d.x}px`);
      pan.style.setProperty("--py", `${d.y}px`);
      map.dataset.pannable = d.maxX > 1 || d.maxY > 1 ? "1" : "";
    };
    setup();
    window.addEventListener("resize", setup);
    return () => window.removeEventListener("resize", setup);
  }, []);

  // Сменили категорию — если открытый пин отфильтровался, закрываем карточку.
  useEffect(() => {
    setOpenId((cur) => {
      if (!cur) return cur;
      const p = PLACES.find((pl) => pl.id === cur);
      return p && inCategory(p, active) ? cur : null;
    });
  }, [active]);

  // Дропдаун категорий (мобайл): закрытие по клику мимо и по Esc.
  useEffect(() => {
    if (!filterOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  const applyPan = () => {
    const pan = panRef.current;
    if (!pan) return;
    pan.style.setProperty("--px", `${drag.current.x}px`);
    pan.style.setProperty("--py", `${drag.current.y}px`);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (d.maxX <= 1 && d.maxY <= 1) return; // нечего таскать
    d.active = true;
    d.moved = false;
    d.sx = e.clientX;
    d.sy = e.clientY;
    d.bx = d.x;
    d.by = d.y;
    panRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
    d.x = clamp(d.bx + dx, -d.maxX, 0);
    d.y = clamp(d.by + dy, -d.maxY, 0);
    applyPan();
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    const d = drag.current;
    d.active = false;
    panRef.current?.releasePointerCapture?.(e.pointerId);
  };

  const visible = PLACES.filter((p) => inCategory(p, active));
  const openIndex = visible.findIndex((p) => p.id === openId);
  const openPlace = openIndex >= 0 ? visible[openIndex] : null;

  const step = (dir: number) => {
    if (!visible.length) return;
    const base = openIndex >= 0 ? openIndex : 0;
    const next = (base + dir + visible.length) % visible.length;
    setOpenId(visible[next].id);
  };

  return (
    <section className={cn(styles.location, className)}>
      <div className={cn(styles.map, dropped && styles.dropped)} ref={mapRef}>
        {/* Перетаскиваемый слой карты: фото + пины. Может быть шире контейнера. */}
        <div
          className={styles.pan}
          ref={panRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <MapVector className={styles.mapImg} />

          {/* Пин дома */}
          <div className={styles.pin}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/building-pin.svg" alt="" className={styles.pinBuilding} draggable={false} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="k711" className={styles.pinLogo} draggable={false} />
          </div>

          {/* Пины заведений */}
          {PLACES.map((p, i) => {
            const shown = inCategory(p, active);
            return (
              <button
                key={p.id}
                type="button"
                className={cn(
                  styles.mapPin,
                  p.id === openId && styles.mapPinActive,
                  !shown && styles.mapPinHidden,
                )}
                style={
                  { left: `${p.x}%`, top: `${p.y}%`, "--pd": `${i * 55}ms` } as CSSProperties
                }
                aria-label={p.title}
                aria-pressed={p.id === openId}
                tabIndex={shown ? 0 : -1}
                onClick={() => {
                  if (drag.current.moved) return; // это было перетаскивание
                  setOpenId(p.id);
                }}
              >
                <span className={styles.mapPinInner}>
                  <MapPin />
                </span>
              </button>
            );
          })}
        </div>

        {/* Заголовок — построчное появление снизу вверх «через шторку» */}
        <div className={styles.headingWrap}>
          <Reveal as="h2" variant="lines" className={styles.heading}>
            <span className="reveal-line" style={{ "--i": 0 } as CSSProperties}>
              Тихий
            </span>
            <span className="reveal-line" style={{ "--i": 1 } as CSSProperties}>
              интеллигентный
            </span>
            <span className="reveal-line" style={{ "--i": 2 } as CSSProperties}>
              квартал
            </span>
          </Reveal>
        </div>

        {/* Категории — десктоп: табы (фильтруют пины) */}
        <div className={styles.tabs}>
          {CATEGORIES.map((t) => (
            <button
              key={t.label}
              type="button"
              className={cn(styles.tab, active === t.label && styles.tabActive)}
              onClick={() => setActive(t.label)}
            >
              <span className={styles.tabName}>{t.label}</span>
              <span className={styles.tabCount}>({t.count})</span>
            </button>
          ))}
        </div>

        {/* Категории — мобайл: дропдаун (открывает список категорий) */}
        <div className={styles.dropdownWrap} ref={dropdownRef}>
          {filterOpen && (
            <ul className={styles.dropdownMenu} role="listbox">
              {CATEGORIES.map((t) => (
                <li key={t.label}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active === t.label}
                    className={cn(
                      styles.dropdownItem,
                      active === t.label && styles.dropdownItemActive,
                    )}
                    onClick={() => {
                      setActive(t.label);
                      setFilterOpen(false);
                    }}
                  >
                    <span className={styles.dropdownItemName}>{t.label}</span>
                    <span className={styles.dropdownItemCount}>({t.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={styles.dropdown}
            aria-haspopup="listbox"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((o) => !o)}
          >
            <span className={styles.dropdownLabel}>
              {active === "все" ? "Все" : active[0].toUpperCase() + active.slice(1)}{" "}
              <span className={styles.dropdownCount}>
                ({CATEGORIES.find((c) => c.label === active)?.count})
              </span>
            </span>
            <ChevronDown />
          </button>
        </div>

        {/* Карточка-слайдер места — появляется при клике на пин */}
        {openPlace && (
          <article className={styles.card}>
            <div className={styles.cardLive} aria-live="polite" aria-atomic="true">
              <div key={openPlace.id} className={styles.cardBody}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.wipe}>{openPlace.title}</span>
                </h3>
                <p className={styles.cardText}>
                  <span className={styles.wipe}>{openPlace.text}</span>
                </p>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.cardArrows}>
                <button
                  type="button"
                  className={styles.cardArrow}
                  aria-label="Предыдущее место"
                  onClick={() => step(-1)}
                >
                  <ChevronLeft />
                </button>
                <button
                  type="button"
                  className={`${styles.cardArrow} ${styles.cardArrowNext}`}
                  aria-label="Следующее место"
                  onClick={() => step(1)}
                >
                  <ChevronLeft />
                </button>
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

function MapPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="8.75" r="8.75" fill="currentColor" />
      <path d="M10.0003 20L5 15L15 15L10.0003 20Z" fill="currentColor" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
