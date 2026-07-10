import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { SpaceSplit } from "@/components/sections/SpaceSplit";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { fetchPage, txt, img, cmsSlides } from "@/lib/api";
import { StayHeading } from "./StayHeading";
import { LobbyImage } from "./LobbyImage";
import { PhotoPair } from "./PhotoPair";
import styles from "./design.module.scss";

const ALIAS = "design";

const FALLBACK_META: Metadata = {
  title: "Дизайн и искусство",
  description:
    "Дизайн и искусство клубного дома k 7/11: дизайнерское лобби от студии EDXXKAT, концепция благоустройства L.BURO.",
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchPage(ALIAS);
  return {
    title: c.meta.title || FALLBACK_META.title,
    description: c.meta.description || FALLBACK_META.description,
  };
}

// design/pair-* — портреты 3277×4096, в ландшафтный слайдер не годятся.
const FALLBACK_SLIDES: Slide[] = [
  { src: "/images/design/slider-lobby.png", caption: "Утопленный лаунж, залитый солнцем" },
  { src: "/images/design/lobby.png", caption: "Красный лаунж с характером" },
];

const FALLBACK_INTRO: [string, string] = [
  "За их облик отвечает студия EDXXKAT, основанная Екатериной Пятицкой и Эдуардом Еремчуком — авторы, работающие на стыке архитектуры, визуального искусства и инсталляции.",
  "Их проекты — это всегда про образ, среду и пластическую культуру, в которой каждая линия и фактура имеют смысл. Пространства встречают не типовой нейтральностью, а настроением, в котором есть и энергия, и утончённость.",
];

const FALLBACK_SPACE: [string, string] = [
  "Авторы L.BURO возводят садовое искусство в философию жизни. Их авторский метод — «Скандинавские сады» — представляет собой манифест, где стойкость нордического духа гармонично сплетается с петербургской романтикой.",
  "Это диалог с северной природой, воплощённый в лаконичных формах, продуманных пространствах и созерцательном спокойствии.",
];

export default async function DesignPage() {
  const content = await fetchPage(ALIAS);
  const slides = cmsSlides(content, "slider", FALLBACK_SLIDES);

  return (
    <>
      <PageHero
        image={img(content, "hero_image", "/images/design/hero.png")}
        imageMobile={content.images.hero_image_mobile || undefined}
        imageAlt={txt(content, "hero_alt", "Дизайнерское лобби клубного дома k 7/11")}
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Дизайн и искусство" },
        ]}
      >
        <span
          className={`${styles.word} ${styles.mesto} reveal-line`}
          style={{ "--i": 0 } as CSSProperties}
        >
          место, где всё
        </span>
        <span
          className={`${styles.word} ${styles.produmano} reveal-line`}
          style={{ "--i": 1 } as CSSProperties}
        >
          продумано
        </span>
      </PageHero>

      <TextDuo
        variant="right"
        lines={[
          { parts: [{ text: "Дизайнерское" }] },
          { parts: [{ text: "лобби" }] },
        ]}
        paragraphs={[
          txt(content, "intro_p1", FALLBACK_INTRO[0]),
          txt(content, "intro_p2", FALLBACK_INTRO[1]),
        ]}
      />

      <Slider slides={slides} />

      <StayHeading />

      <LobbyImage />

      <PhotoPair
        items={[
          {
            src: "/images/design/pair-lobby.png",
            alt: "Лобби клубного дома",
            position: "top",
            caption: "Лобби",
          },
          {
            src: "/images/design/pair-soft-zone.png",
            alt: "Мягкая зона лобби",
            position: "bottom",
            caption: "Мягкая зона",
          },
        ]}
      />

      <SpaceSplit
        className={styles.spaceSplit}
        image={img(content, "space_image", "/images/design/garden.png")}
        imageAlt={txt(content, "space_alt", "Концепция благоустройства от L.BURO")}
        headingLines={["концепция", "благо­устройства", "от EDXXKAT"]}
        paragraphs={[
          txt(content, "space_p1", FALLBACK_SPACE[0]),
          txt(content, "space_p2", FALLBACK_SPACE[1]),
        ]}
      />

      <ConnectBlock />
    </>
  );
}
