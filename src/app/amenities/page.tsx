import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { Terraces } from "@/components/sections/Terraces";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { CenterHeading } from "@/components/sections/CenterHeading";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { fetchPage, txt, img, cmsSlides } from "@/lib/api";
import styles from "./amenities.module.scss";

const ALIAS = "amenities";

const FALLBACK_META: Metadata = {
  title: "Аменитис",
  description:
    "Аменитис клубного дома k 7/11: SPA, фитнес с видом на зелёный двор, лобби камерного клуба и сервис, продуманный до мелочей.",
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchPage(ALIAS);
  return {
    title: c.meta.title || FALLBACK_META.title,
    description: c.meta.description || FALLBACK_META.description,
  };
}

// amenities-slider-3 — портрет 1440×1804, в ландшафтный слайдер не годится.
const FALLBACK_SLIDES: Slide[] = [
  { src: "/images/amenities-slider-1.png", caption: "Красный салон с винной коллекцией" },
  { src: "/images/amenities-slider-2.png", caption: "Панорамный фитнес в тёплых тонах" },
];

const FALLBACK_INTRO: [string, string?] = [
  "В глубине дома прячется уголок для тела и души: зал с видом на зелёный двор и приватное SPA, где забота о себе превращается в ритуал.",
];

const FALLBACK_TERRACES: [string, string] = [
  "Под высокими потолками лобби с кофейной и барной зоной звучит тишина камерного клуба, где можно на мгновение остановиться, встретиться с другом или просто насладиться атмосферой.",
  "Отдельные входы для доставки и сервисного персонала продуманы так, чтобы не вмешиваться в жизнь резидентов. Хозяйственные потоки идут своими маршрутами — общественные зоны остаются местом тишины и встреч.",
];

export default async function AmenitiesPage() {
  const content = await fetchPage(ALIAS);
  const slides = cmsSlides(content, "slider", FALLBACK_SLIDES);

  const introP2 = content.texts.intro_p2?.trim();
  const introParagraphs: [string] | [string, string] = introP2
    ? [txt(content, "intro_p1", FALLBACK_INTRO[0]), introP2]
    : [txt(content, "intro_p1", FALLBACK_INTRO[0])];

  return (
    <>
      <PageHero
        image={img(content, "hero_image", "/images/amenities-hero.png")}
        imageMobile={content.images.hero_image_mobile || undefined}
        imageAlt={txt(
          content,
          "hero_alt",
          "Аменитис клубного дома k 7/11 — фитнес-зал с видом на внутренний двор",
        )}
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
        paragraphs={introParagraphs}
      />

      <Slider slides={slides} />

      <Terraces
        image={img(content, "terraces_image", "/images/amenities-lobby.png")}
        imageAlt={txt(
          content,
          "terraces_alt",
          "Лобби клубного дома k 7/11 — кофейная и барная зона",
        )}
        rowPadTop={290}
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
          txt(content, "terraces_p1", FALLBACK_TERRACES[0]),
          txt(content, "terraces_p2", FALLBACK_TERRACES[1]),
        ]}
      />

      <PhotoCards
        className={styles.photoCards}
        scrim
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
        className={styles.centerHeading}
        lines={[
          { parts: [{ text: "дом,", big: true }, { text: "который", alignSelf: "end" }], align: "center" },
          { parts: [{ text: "не хочется покидать" }], align: "center" },
        ]}
      />

      <ConnectBlock className={styles.connect} />
    </>
  );
}
