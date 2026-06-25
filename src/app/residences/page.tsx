import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { ImageHeading } from "@/components/sections/ImageHeading";
import { CenterHeading } from "@/components/sections/CenterHeading";
import { ResidenceStats } from "@/components/sections/ResidenceStats";
import { SpaceSplit } from "@/components/sections/SpaceSplit";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
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

      <TextDuo
        variant="right"
        lines={[
          { parts: [{ text: "резиденции" }] },
          { parts: [{ text: "с вашим" }] },
          { parts: [{ text: "сценарием", big: true }] },
          { parts: [{ text: "жизни" }] },
        ]}
        paragraphs={[
          "Всего 46 резиденций — ни одной лишней, ни одной случайной. На этаже — от двух до четырёх квартир, что создаёт исключительную приватность, редкую даже для элитного сегмента.",
          "Каждая резиденция спроектирована под собственный сценарий жизни: от камерных квартир до видовых пентхаусов с личными патио на крыше.",
        ]}
      />

      <ImageHeading
        image="/images/residences-scenario.png"
        imageAlt="Интерьер резиденции — квартиры с вашим сценарием жизни"
        overlay={0.2}
      >
        <span className={styles.scenarioHeading}>
          <span
            className={`${styles.sKvartiry} reveal-line`}
            style={{ "--i": 0 } as CSSProperties}
          >
            квартиры
          </span>
          <span
            className={`${styles.sSvashim} reveal-line`}
            style={{ "--i": 1 } as CSSProperties}
          >
            с вашим
          </span>
          <span
            className={`${styles.sScenariem} reveal-line`}
            style={{ "--i": 2 } as CSSProperties}
          >
            сценарием
          </span>
          <span
            className={`${styles.sZhizni} reveal-line`}
            style={{ "--i": 3 } as CSSProperties}
          >
            жизни
          </span>
        </span>
      </ImageHeading>

      <Slider slides={slides} mobileGallery />

      <CenterHeading
        lines={[
          { parts: [{ text: "дом, который" }], align: "center" },
          { parts: [{ text: "не хочется покидать" }], align: "center" },
        ]}
      />

      <ResidenceStats
        items={[
          {
            src: "/images/residences-stat-1.png",
            alt: "Кабинет резиденции",
            place: "left",
            value: "2-4",
            caption: (
              <>
                квартиры
                <br />
                на этаже
              </>
            ),
          },
          {
            src: "/images/residences-stat-2.png",
            alt: "Гостиная резиденции",
            place: "right",
            value: "49",
            caption: "резиденций",
          },
          {
            src: "/images/residences-stat-3.png",
            alt: "Спальня резиденции",
            place: "center",
            value: (
              <>
                до 157 м<sup>2</sup>
              </>
            ),
            caption: "резиденции",
          },
        ]}
      />

      <SpaceSplit
        image="/images/residences-space.png"
        imageAlt="Пентхаус с личным патио на крыше"
        headingLines={["Пространство", "по вашим правилам"]}
        paragraphs={[
          "Пентхаусы восьмого этажа, 233–274 м², с личными патио на крыше площадью 150 м² — пространства, где город остаётся внизу, а воздух и свет становятся частью интерьера.",
          "Панорамное остекление crystal vision, дерево-алюминиевые рамы в исторической части и внимательный фасилити-менеджмент подчёркивают уровень, где комфорт сочетается с безупречным стилем.",
        ]}
      />

      <CenterHeading
        lines={[
          { parts: [{ text: "дом, который" }], align: "center" },
          { parts: [{ text: "не хочется покидать" }], align: "center" },
        ]}
      />

      <ConnectBlock />
    </>
  );
}
