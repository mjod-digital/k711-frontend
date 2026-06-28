import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { SpaceSplit } from "@/components/sections/SpaceSplit";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { StayHeading } from "./StayHeading";
import { LobbyImage } from "./LobbyImage";
import { PhotoPair } from "./PhotoPair";
import styles from "./design.module.scss";

export const metadata: Metadata = {
  title: "Дизайн и искусство",
  description:
    "Дизайн и искусство клубного дома k 7/11: дизайнерское лобби от студии EDXXKAT, концепция благоустройства L.BURO.",
};

const slides: Slide[] = [
  { src: "/images/gallery-living-1.png", caption: "Лобби в тёплых тонах" },
  { src: "/images/gallery-living-2.png", caption: "Камерная зона отдыха" },
  { src: "/images/lobby.png", caption: "Интерьерный манифест" },
];

export default function DesignPage() {
  return (
    <>
      <PageHero
        image="/images/lobby.png"
        imageAlt="Дизайнерское лобби клубного дома k 7/11"
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
          "За их облик отвечает студия EDXXKAT, основанная Екатериной Пятицкой и Эдуардом Еремчуком — авторы, работающие на стыке архитектуры, визуального искусства и инсталляции.",
          "Их проекты — это всегда про образ, среду и пластическую культуру, в которой каждая линия и фактура имеют смысл. Пространства встречают не типовой нейтральностью, а настроением, в котором есть и энергия, и утончённость.",
        ]}
      />

      <Slider slides={slides} />

      <StayHeading />

      <LobbyImage />

      <PhotoPair
        items={[
          {
            src: "/images/lobby.png",
            alt: "Лобби клубного дома",
            position: "top",
            caption: "Лобби",
          },
          {
            src: "/images/gallery-living-1.png",
            alt: "Мягкая зона лобби",
            position: "bottom",
            caption: "Мягкая зона",
          },
        ]}
      />

      <SpaceSplit
        image="/images/garden.png"
        imageAlt="Концепция благоустройства от L.BURO"
        headingLines={["концепция", "благо­устройства", "от EDXXKAT"]}
        paragraphs={[
          "Авторы L.BURO возводят садовое искусство в философию жизни. Их авторский метод — «Скандинавские сады» — представляет собой манифест, где стойкость нордического духа гармонично сплетается с петербургской романтикой.",
          "Это диалог с северной природой, воплощённый в лаконичных формах, продуманных пространствах и созерцательном спокойствии.",
        ]}
      />

      <ConnectBlock />
    </>
  );
}
