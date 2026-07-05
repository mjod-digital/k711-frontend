import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { DesignBureau } from "@/components/sections/DesignBureau";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { fetchPage, txt, img, cmsSlides } from "@/lib/api";
import { SilenceHeading } from "./SilenceHeading";
import { GardenText } from "./GardenText";
import styles from "./improvement.module.scss";

const ALIAS = "improvement";

const FALLBACK_META: Metadata = {
  title: "Благоустройство",
  description:
    "Благоустройство клубного дома k 7/11: закрытый приватный сад в центре Москвы по концепции бюро L.BURO — ландшафт как природная среда.",
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchPage(ALIAS);
  return {
    title: c.meta.title || FALLBACK_META.title,
    description: c.meta.description || FALLBACK_META.description,
  };
}

const FALLBACK_SLIDES: Slide[] = [
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

export default async function ImprovementPage() {
  const content = await fetchPage(ALIAS);
  const slides = cmsSlides(content, "slider", FALLBACK_SLIDES);

  // Абзацы блоков редактируемы; если CMS пусто — компонент рендерит свой дефолт.
  const gardenP1 = content.texts.garden_p1;
  const bureauP1 = content.texts.bureau_p1;

  return (
    <>
      <PageHero
        image={img(content, "hero_image", "/images/improvement-hero.png")}
        imageAlt={txt(
          content,
          "hero_alt",
          "Закрытый сад клубного дома k 7/11 — ландшафт как природная среда",
        )}
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

      <GardenText
        paragraphs={
          gardenP1 ? [gardenP1, content.texts.garden_p2 ?? ""] : undefined
        }
      />

      <Slider slides={slides} />

      <SilenceHeading />

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
        image={img(content, "bureau_image", "/images/improvement-bureau.png")}
        imageAlt={txt(content, "bureau_alt", "Основатели дизайн-бюро L.BURO")}
        paragraph={bureauP1 || undefined}
      />

      <ConnectBlock image="/images/improvement-connect.png" />
    </>
  );
}
