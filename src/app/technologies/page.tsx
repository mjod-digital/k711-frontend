import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { ResidenceStats } from "@/components/sections/ResidenceStats";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { StayHeading } from "./StayHeading";
import styles from "./technologies.module.scss";

export const metadata: Metadata = {
  title: "Передовые технологии",
  description:
    "Передовые технологии клубного дома k 7/11: безопасность, комфорт и тишина — вентиляция, фильтрация воды, паркинг на 55 машиномест с зарядками для электрокаров.",
};

const slides: Slide[] = [
  { src: "/images/gallery-living-2.png", caption: "Инженерные системы скрыты в архитектуре" },
  { src: "/images/lobby.png", caption: "Климат-контроль и тишина" },
  { src: "/images/gallery-bedroom.png", caption: "Комфорт в каждой детали" },
];

export default function TechnologiesPage() {
  return (
    <>
      <PageHero
        image="/images/lobby.png"
        imageAlt="Передовые технологии клубного дома k 7/11"
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Передовые технологии" },
        ]}
      >
        <span
          className={`${styles.word} ${styles.bezopasnost} reveal-line`}
          style={{ "--i": 0 } as CSSProperties}
        >
          безопасность,
        </span>
        <span
          className={`${styles.word} ${styles.komfort} reveal-line`}
          style={{ "--i": 1 } as CSSProperties}
        >
          комфорт
        </span>
        <span
          className={`${styles.word} ${styles.tishina} reveal-line`}
          style={{ "--i": 2 } as CSSProperties}
        >
          и тишина
        </span>
      </PageHero>

      <TextDuo
        variant="right"
        lines={[
          { parts: [{ text: "Передовые" }] },
          { parts: [{ text: "технологии" }] },
        ]}
        paragraphs={[
          "К7/11 устроен так, чтобы вы чувствовали не технологии, а результаты их тонкой работы: абсолютный комфорт, безопасность и тишину.",
          "Работу воздуха поддерживает централизованная приточно-вытяжная вентиляция с тонкой регулировкой. Горячая вода проходит многоступенчатую систему фильтрации и доступна круглый год.",
        ]}
      />

      <Slider slides={slides} />

      <ResidenceStats
        items={[
          {
            src: "/images/gallery-living-1.png",
            alt: "Паркинг с зарядками для электрокаров",
            place: "left",
            number: "5",
            caption: (
              <>
                мест для
                <br />
                электрокаров
              </>
            ),
          },
          {
            src: "/images/gallery-living-2.png",
            alt: "Подземный паркинг на 55 машиномест",
            place: "right",
            number: "55",
            caption: "машиномест",
          },
          {
            src: "/images/gallery-bedroom.png",
            alt: "Двухуровневый паркинг",
            place: "center",
            number: "2",
            caption: "уровня",
          },
        ]}
      />

      <StayHeading />

      <PhotoCards
        items={[
          { src: "/images/lobby.png", alt: "Инженерия дома", position: "top", lines: [] },
          { src: "/images/gallery-living-1.png", alt: "Комфорт резиденций", position: "bottom", lines: [] },
        ]}
      />

      <ConnectBlock />
    </>
  );
}
