import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { CenterHeading } from "@/components/sections/CenterHeading";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { Author } from "@/components/sections/Author";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import styles from "./architecture.module.scss";

export const metadata: Metadata = {
  title: "Архитектура",
  description:
    "Архитектура клубного дома k 7/11: современность с историческим сердцем, фасад по проекту Сергея Чобана.",
};

const slides: Slide[] = [
  {
    src: "/images/slider-2.png",
    caption: "Ритм панорамных окон и чёткая геометрия фасада",
  },
  {
    src: "/images/facade.png",
    caption: "Сохранённая стена «тучереза» 1905 года",
  },
  {
    src: "/images/terraces.png",
    caption: "Видовые террасы верхних этажей",
  },
  {
    src: "/images/residences.png",
    caption: "Современные линии в историческом контексте",
  },
];

export default function ArchitecturePage() {
  return (
    <>
      <PageHero
        image="/images/arch-hero.png"
        imageAlt="Клубный дом k 7/11 — современная архитектура с историческим фасадом"
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
          "Архитектура k 7/11 — это редкий пример того, как прошлое становится сердцем современности: уцелевшая стена первого московского «тучереза» 1905 года, построенного Эрнстом-Рихардом Нирнзее, бережно сохранена и интегрирована в новый облик дома.",
          "Современные линии панорамных окон и чёткая геометрия фасада не спорят с историей, а подчёркивают её, создавая контрастную гармонию.",
        ]}
      />

      <Slider slides={slides} />

      <CenterHeading
        lines={[
          { parts: [{ text: "выразительный облик" }], align: "center" },
          { parts: [{ text: "вне" }, { text: "времени", big: true }], align: "center" },
        ]}
      />

      <PhotoCards
        items={[
          {
            src: "/images/arch-choban.png",
            alt: "Здание по проекту Сергея Чобана",
            position: "top",
            lines: [
              { parts: [{ text: "Сергей" }] },
              { parts: [{ text: "Чобан", big: true }] },
            ],
          },
          {
            src: "/images/arch-facade.png",
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
        image="/images/arch-author.png"
        imageAlt="Архитектор Сергей Чобан"
      />

      <ConnectBlock />
    </>
  );
}
