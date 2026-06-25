import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { CenterHeading } from "@/components/sections/CenterHeading";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { DesignBureau } from "@/components/sections/DesignBureau";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import styles from "./improvement.module.scss";

export const metadata: Metadata = {
  title: "Благоустройство",
  description:
    "Благоустройство клубного дома k 7/11: закрытый приватный сад в центре Москвы по концепции бюро L.BURO — ландшафт как природная среда.",
};

const slides: Slide[] = [
  {
    src: "/images/improvement-slider-courtyard.png",
    caption: "Закрытый двор-сад с природным ландшафтом",
  },
  {
    src: "/images/improvement-slider-terrace.png",
    caption: "Видовая терраса над историческим центром",
  },
  {
    src: "/images/improvement-slider-greenery.png",
    caption: "Камерные зоны отдыха среди многолетников",
  },
];

export default function ImprovementPage() {
  return (
    <>
      <PageHero
        image="/images/improvement-hero.png"
        imageAlt="Закрытый сад клубного дома k 7/11 — ландшафт как природная среда"
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Благоустройство" },
        ]}
      >
        <span className={`${styles.word} ${styles.landshaft} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
          Ландшафт
        </span>
        <span className={`${styles.word} ${styles.kakPrirodnaya} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
          как природная
        </span>
        <span className={`${styles.word} ${styles.sreda} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
          среда
        </span>
      </PageHero>

      <TextDuo
        variant="right"
        lines={[
          { parts: [{ text: "Скандинавский" }] },
          { parts: [{ text: "сад в центре Москвы" }] },
        ]}
        paragraphs={[
          "Закрытый двор клубного дома «Климашкина 7/11» — это камерное пространство, скрытое от города и полностью подчинённое идее приватного сада. Здесь архитектура уходит на второй план, уступая место ландшафту, свету и тишине.",
          "Внутренний двор спроектирован как цельная природная композиция, где каждый элемент работает на ощущение уединённого городского оазиса.",
        ]}
      />

      <Slider slides={slides} />

      <CenterHeading
        lines={[
          { parts: [{ text: "Пространство" }], align: "center" },
          { parts: [{ text: "тишины", big: true }], align: "center" },
          { parts: [{ text: "и приватности" }], align: "center" },
        ]}
      />

      <PhotoCards
        items={[
          {
            src: "/images/improvement-card-greenery.png",
            alt: "Озеленение двора, цветущее всесезонно",
            position: "bottom",
            lines: [
              { parts: [{ text: "озеленение" }] },
              { parts: [{ text: "для всех" }] },
              { parts: [{ text: "сезонов", big: true }] },
            ],
          },
          {
            src: "/images/improvement-card-courtyard.png",
            alt: "Приватный двор для резидентов клубного дома",
            position: "top",
            lines: [
              { parts: [{ text: "двор", big: true }] },
              { parts: [{ text: "для резидентов" }] },
            ],
          },
        ]}
      />

      <DesignBureau
        image="/images/improvement-bureau.png"
        imageAlt="Основатели дизайн-бюро L.BURO"
      />

      <ConnectBlock image="/images/improvement-connect.png" />
    </>
  );
}
