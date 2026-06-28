import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { ResidenceStats } from "@/components/sections/ResidenceStats";
import { SpaceSplit } from "@/components/sections/SpaceSplit";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { ResidenceIntro } from "./ResidenceIntro";
import { ScenarioImage } from "./ScenarioImage";
import { StayHeading } from "./StayHeading";
import styles from "./residences.module.scss";

export const metadata: Metadata = {
  title: "Резиденции",
  description:
    "Резиденции клубного дома k 7/11: всего 46 резиденций, от 2 до 4 квартир на этаже, до 157 м² и пентхаусы с личными патио на крыше.",
};

const slides: Slide[] = [
  {
    src: "/images/residences-gallery-1.png",
    caption: "Гостиная",
  },
  {
    src: "/images/residences-gallery-2.png",
    caption: "Гостиная с панорамным остеклением",
  },
  {
    src: "/images/residences-gallery-3.png",
    caption: "Спальня",
  },
];

export default function ResidencesPage() {
  return (
    <>
      <PageHero
        image="/images/residences-hero.png"
        imageAlt="Резиденции клубного дома k 7/11 — редкость клубного формата"
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Резиденции" },
        ]}
      >
        <span
          className={`${styles.word} ${styles.redkost} reveal-line`}
          style={{ "--i": 0 } as CSSProperties}
        >
          редкость
        </span>
        <span
          className={`${styles.word} ${styles.klubnogo} reveal-line`}
          style={{ "--i": 1 } as CSSProperties}
        >
          клубного
        </span>
        <span
          className={`${styles.word} ${styles.formata} reveal-line`}
          style={{ "--i": 2 } as CSSProperties}
        >
          формата
        </span>
      </PageHero>

      <ResidenceIntro />

      <ScenarioImage />

      <Slider slides={slides} />

      <StayHeading />

      <ResidenceStats
        items={[
          {
            src: "/images/residences-stat-1.png",
            alt: "Кабинет резиденции",
            place: "left",
            number: "2-4",
            suffix: "квартиры",
            suffixBelow: true,
            caption: "на этаже",
          },
          {
            src: "/images/residences-stat-2.png",
            alt: "Гостиная резиденции",
            place: "right",
            number: "49",
            caption: "резиденций",
          },
          {
            src: "/images/residences-stat-3.png",
            alt: "Спальня резиденции",
            place: "center",
            prefix: "до",
            number: "157",
            suffix: (
              <>
                м<sup>2</sup>
              </>
            ),
            caption: "площадь",
          },
        ]}
      />

      <SpaceSplit
        image="/images/residences-space.png"
        imageAlt="Пентхаус с личным патио на крыше"
        headingLines={["Пространство", "по вашим", "правилам"]}
        paragraphs={[
          "Пентхаусы восьмого этажа, 233–274 м², с личными патио на крыше площадью 150 м² — пространства, где город остаётся внизу, а воздух и свет становятся частью интерьера.",
          "Панорамное остекление crystal vision, дерево-алюминиевые рамы в исторической части и внимательный фасилити-менеджмент подчёркивают уровень, где комфорт сочетается с безупречным стилем.",
        ]}
      />

      <ConnectBlock />
    </>
  );
}
