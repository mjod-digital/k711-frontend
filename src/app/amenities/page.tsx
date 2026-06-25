import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { Terraces } from "@/components/sections/Terraces";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { CenterHeading } from "@/components/sections/CenterHeading";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import styles from "./amenities.module.scss";

export const metadata: Metadata = {
  title: "Аменитис",
  description:
    "Аменитис клубного дома k 7/11: SPA, фитнес с видом на зелёный двор, лобби камерного клуба и сервис, продуманный до мелочей.",
};

const slides: Slide[] = [
  {
    src: "/images/amenities-slider-1.png",
    caption: "SPA, где забота о себе превращается в ритуал",
  },
  {
    src: "/images/amenities-slider-2.png",
    caption: "Лобби",
  },
  {
    src: "/images/amenities-slider-3.png",
    caption: "SPA, где забота о себе превращается в ритуал",
  },
];

export default function AmenitiesPage() {
  return (
    <>
      <PageHero
        image="/images/amenities-hero.png"
        imageAlt="Аменитис клубного дома k 7/11 — фитнес-зал с видом на внутренний двор"
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Аменитис" },
        ]}
      >
        <span className={`${styles.word} ${styles.tam} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
          там,
        </span>
        <span className={`${styles.word} ${styles.gde} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
          где начинается
        </span>
        <span className={`${styles.word} ${styles.den} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
          день
        </span>
      </PageHero>

      <TextDuo
        variant="right"
        lines={[
          { parts: [{ text: "тренажеры" }] },
          { parts: [{ text: "с видом на зелёный" }] },
          { parts: [{ text: "внутренний двор" }] },
        ]}
        paragraphs={[
          "В глубине дома прячется уголок для тела и души: зал с видом на зелёный двор и приватное SPA, где забота о себе превращается в ритуал.",
          "Панорамные окна открывают вид на тихий внутренний двор, а интерьер выдержан в спокойных тонах камерного клуба.",
        ]}
      />

      <Slider slides={slides} mobileGallery />

      <Terraces
        image="/images/amenities-lobby.png"
        imageAlt="Лобби клубного дома k 7/11 — кофейная и барная зона"
        desktopLines={[
          { parts: [{ text: "Дом,", big: true }] },
          { parts: [{ text: "в котором город остаётся снаружи", big: true }] },
        ]}
        mobileLines={[
          { parts: [{ text: "Дом,", big: true }] },
          { parts: [{ text: "в котором", big: true }] },
          { parts: [{ text: "город", big: true }] },
          { parts: [{ text: "остаётся", big: true }] },
          { parts: [{ text: "снаружи", big: true }] },
        ]}
        paragraphs={[
          "Под высокими потолками лобби с кофейной и барной зоной звучит тишина камерного клуба, где можно на мгновение остановиться, встретиться с другом или просто насладиться атмосферой.",
          "Отдельные входы для доставки и сервисного персонала продуманы так, чтобы не вмешиваться в жизнь резидентов. Хозяйственные потоки идут своими маршрутами — общественные зоны остаются местом тишины и встреч.",
        ]}
      />

      <PhotoCards
        items={[
          {
            src: "/images/amenities-spa.png",
            alt: "SPA-кабинет клубного дома k 7/11",
            position: "top",
            lines: [
              { parts: [{ text: "SPA", big: true }] },
              { parts: [{ text: "кабинет" }] },
            ],
          },
          {
            src: "/images/amenities-fitness.png",
            alt: "Фитнес-зал для резидентов k 7/11",
            position: "bottom",
            lines: [
              { parts: [{ text: "фитнес", big: true }] },
              { parts: [{ text: "для резидентов" }] },
            ],
          },
        ]}
      />

      <CenterHeading
        lines={[
          { parts: [{ text: "дом,", big: true }, { text: "который" }], align: "center" },
          { parts: [{ text: "не хочется покидать" }], align: "center" },
        ]}
      />

      <ConnectBlock />
    </>
  );
}
