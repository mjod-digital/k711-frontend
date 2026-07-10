import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { SilenceHeading } from "@/components/sections/SilenceHeading";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { Location } from "@/components/sections/Location";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { fetchPage, txt, img, cmsSlides } from "@/lib/api";
import styles from "./location.module.scss";

const ALIAS = "location";

const FALLBACK_META: Metadata = {
  title: "Локация",
  description:
    "Локация клубного дома k 7/11: тихий интеллигентный квартал в центре Москвы — в 10 минутах от Кремля и 5 минутах от Патриарших.",
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchPage(ALIAS);
  return {
    title: c.meta.title || FALLBACK_META.title,
    description: c.meta.description || FALLBACK_META.description,
  };
}

// location-slide-1 и -3 — всего 1016px по ширине (нужно ≥2200), мылят на retina.
const FALLBACK_SLIDES: Slide[] = [
  { src: "/images/location-slide-2.png", caption: "Музей русского импрессионизма" },
];

const FALLBACK_INTRO: [string, string] = [
  "Здесь много парков и скверов: «Красная Пресня», Патриаршие и Красногвардейские пруды, парк Декабрьского восстания.",
  "Культурное наследие рядом: собор Непорочного Зачатия, мастерская Зураба Церетели, храм Георгия Победоносца.",
];

export default async function LocationPage() {
  const content = await fetchPage(ALIAS);
  const slides = cmsSlides(content, "slider", FALLBACK_SLIDES);

  return (
    <>
      <PageHero
        image={img(content, "hero_image", "/images/location-hero.png")}
        imageMobile={content.images.hero_image_mobile || undefined}
        imageAlt={txt(content, "hero_alt", "Клубный дом k 7/11 — локация в тихом центре Москвы")}
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
        className={styles.textDuoWide}
        lines={[
          { parts: [{ text: "время в хорошей" }] },
          { parts: [{ text: "компании" }] },
        ]}
        paragraphs={[
          txt(content, "intro_p1", FALLBACK_INTRO[0]),
          txt(content, "intro_p2", FALLBACK_INTRO[1]),
        ]}
      />

      <Slider slides={slides} />

      <Location className={styles.locationBottom} />

      <PhotoCards
        className={styles.photoCards}
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
            // Мобайл: «в 10 минутах» одной строкой — как у соседней карточки.
            linesMobile: [
              { parts: [{ text: "в" }, { text: "10", big: true }, { text: "минутах" }] },
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

      <SilenceHeading
        lines={["пространство", "тишины", "в центре москвы"]}
        className={styles.silenceTop}
      />

      <ConnectBlock />
    </>
  );
}
