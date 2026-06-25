import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { CenterHeading } from "@/components/sections/CenterHeading";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { Location } from "@/components/sections/Location";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import styles from "./location.module.scss";

export const metadata: Metadata = {
  title: "Локация",
  description:
    "Локация клубного дома k 7/11: тихий интеллигентный квартал в центре Москвы — в 10 минутах от Кремля и 5 минутах от Патриарших.",
};

const slides: Slide[] = [
  {
    src: "/images/location-slide-1.png",
    caption: "SPA, где забота о себе превращается в ритуал",
  },
  {
    src: "/images/location-slide-2.png",
    caption: "Музей импрессионизма",
  },
  {
    src: "/images/location-slide-3.png",
    caption: "SPA, где забота о себе превращается в ритуал",
  },
];

export default function LocationPage() {
  return (
    <>
      <PageHero
        image="/images/location-hero.png"
        imageAlt="Клубный дом k 7/11 — локация в тихом центре Москвы"
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Локация" },
        ]}
      >
        <span className={`${styles.word} ${styles.dlya} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
          для
        </span>
        <span className={`${styles.word} ${styles.utonchennogo} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
          утонченного
        </span>
        <span className={`${styles.word} ${styles.obraza} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
          образа жизни
        </span>
      </PageHero>

      <TextDuo
        variant="right"
        lines={[
          { parts: [{ text: "время в хорошей" }] },
          { parts: [{ text: "компании" }] },
        ]}
        paragraphs={[
          "Здесь много парков и скверов: «Красная Пресня», Патриаршие и Красногвардейские пруды, парк Декабрьского восстания.",
          "Культурное наследие рядом: собор Непорочного Зачатия, мастерская Зураба Церетели, храм Георгия Победоносца.",
        ]}
      />

      <Slider slides={slides} mobileGallery />

      <Location />

      <PhotoCards
        items={[
          {
            src: "/images/location-kremlin.png",
            alt: "Вид на Кремль — в 10 минутах от k 7/11",
            position: "top",
            lines: [
              { parts: [{ text: "в" }, { text: "10", big: true }] },
              { parts: [{ text: "минутах" }] },
              { parts: [{ text: "от Кремля" }] },
            ],
          },
          {
            src: "/images/location-patriarshie.png",
            alt: "Патриаршие пруды — в 5 минутах от k 7/11",
            position: "bottom",
            lines: [
              { parts: [{ text: "в" }, { text: "5", big: true }, { text: "минутах" }] },
              { parts: [{ text: "от патриарших" }] },
            ],
          },
        ]}
      />

      <CenterHeading
        lines={[
          { parts: [{ text: "пространство" }], align: "center" },
          { parts: [{ text: "тишины", big: true }], align: "center" },
          { parts: [{ text: "в центре москвы" }], align: "center" },
        ]}
      />

      <ConnectBlock />
    </>
  );
}
