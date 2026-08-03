import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { CenterHeading } from "@/components/sections/CenterHeading";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { Author } from "@/components/sections/Author";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { fetchPage, txt, img, cmsSlides } from "@/lib/api";
import styles from "./architecture.module.scss";

const ALIAS = "architecture";

const FALLBACK_META: Metadata = {
  title: "Архитектура",
  description:
    "Архитектура клубного дома k 7/11: современность с историческим сердцем, фасад по проекту Сергея Чобана.",
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchPage(ALIAS);
  return {
    title: c.meta.title || FALLBACK_META.title,
    description: c.meta.description || FALLBACK_META.description,
  };
}

// Слайдер ландшафтный (~1.62:1, ≥2200px). Все «свои» кадры архитектуры
// (facade, residences, arch-facade, arch-choban) — портретные, не годятся.
const FALLBACK_SLIDES: Slide[] = [
  { src: "/images/slider-2.webp", caption: "Медный фасад в свете заката" },
];

// Дефолтные абзацы intro (fallback-first: если CMS пусто — этот текст).
const FALLBACK_INTRO: [string, string] = [
  "Архитектура k 7/11 — это редкий пример того, как прошлое становится сердцем современности: уцелевшая стена первого московского «тучереза» 1905 года, построенного Эрнстом-Рихардом Нирнзее, бережно сохранена и интегрирована в новый облик дома.",
  "Современные линии панорамных окон и чёткая геометрия фасада не спорят с историей, а подчёркивают её, создавая контрастную гармонию.",
];

export default async function ArchitecturePage() {
  const content = await fetchPage(ALIAS);
  const slides = cmsSlides(content, "slider", FALLBACK_SLIDES);
  const authorP1 = content.texts.author_p1;

  return (
    <>
      <PageHero
        image={img(content, "hero_image", "/images/arch-hero.webp")}
        imageMobile={content.images.hero_image_mobile || undefined}
        imageAlt={txt(
          content,
          "hero_alt",
          "Клубный дом k 7/11 — современная архитектура с историческим фасадом",
        )}
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Архитектура" },
        ]}
      >
        <span className={`${styles.word} ${styles.garmonia} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
          гармония
        </span>
        <span className={`${styles.word} ${styles.proshlogo} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
          прошлого
        </span>
        <span className={`${styles.word} ${styles.i} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
          и
        </span>
        <span className={`${styles.word} ${styles.nastoyashchego} reveal-line`} style={{ "--i": 3 } as CSSProperties}>
          настоящего
        </span>
      </PageHero>

      <TextDuo
        variant="right"
        lines={[
          { parts: [{ text: "Современность" }] },
          {
            // На мобиле строка переносится (историчес- / ким сердцем) → раскрываем
            // сверху вниз, чтобы визуальные строки шли по порядку (1→2→3, не 1→3→2).
            revealDown: true,
            parts: [
              {
                // На мобиле «историческим» переносится с дефисом: историчес- / ким
                text: (
                  <>
                    с историчес
                    <span className={styles.mobBreak} aria-hidden="true">
                      -<br />
                    </span>
                    ким сердцем
                  </>
                ),
              },
            ],
          },
        ]}
        paragraphs={[
          txt(content, "intro_p1", FALLBACK_INTRO[0]),
          txt(content, "intro_p2", FALLBACK_INTRO[1]),
        ]}
      />

      <Slider slides={slides} />

      <CenterHeading
        className={styles.centerHeading}
        lines={[
          { parts: [{ text: "выразительный облик" }], align: "center" },
          { parts: [{ text: "вне" }, { text: "времени", big: true }], align: "center" },
        ]}
      />

      <PhotoCards
        items={[
          {
            src: "/images/arch-choban.webp",
            alt: "Здание по проекту Сергея Чобана",
            position: "top",
            lines: [
              { parts: [{ text: "Сергей" }] },
              { parts: [{ text: "Чобан", big: true }] },
            ],
          },
          {
            src: "/images/arch-facade.webp",
            alt: "Исторический фасад 1905 года",
            position: "bottom",
            lines: [
              { parts: [{ text: "исторический" }] },
              { parts: [{ text: "фасад", big: true }] },
            ],
          },
        ]}
      />

      <Author
        image={img(content, "author_image", "/images/arch-author.webp")}
        imageAlt={txt(content, "author_alt", "Архитектор Сергей Чобан")}
        paragraphs={
          authorP1
            ? [authorP1, content.texts.author_p2 ?? ""]
            : undefined
        }
      />

      <ConnectBlock />
    </>
  );
}
