import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { ResidenceStats } from "@/components/sections/ResidenceStats";
import { SpaceSplit } from "@/components/sections/SpaceSplit";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { fetchPage, txt, img, cmsSlides } from "@/lib/api";
import { ResidenceIntro } from "./ResidenceIntro";
import { ScenarioImage } from "./ScenarioImage";
import { StayHeading } from "./StayHeading";
import styles from "./residences.module.scss";

const ALIAS = "residences";

const FALLBACK_META: Metadata = {
  title: "Резиденции",
  description:
    "Резиденции клубного дома k 7/11: всего 46 резиденций, от 2 до 4 квартир на этаже, до 157 м² и пентхаусы с личными патио на крыше.",
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchPage(ALIAS);
  return {
    title: c.meta.title || FALLBACK_META.title,
    description: c.meta.description || FALLBACK_META.description,
  };
}

// ВСЕ интерьерные рендеры резиденций (gallery-1/2/3, stat-*, space, hero) —
// портретные ~0.79. Годного ландшафтного кадра под слайдер на странице нет.
// Временно ставим один ландшафт; нужны нормальные слайдер-рендеры от клиента.
const FALLBACK_SLIDES: Slide[] = [
  { src: "/images/apartments-hero.png", caption: "Дубовый холл с почтовыми ячейками" },
];

const FALLBACK_SPACE: [string, string] = [
  "Пентхаусы восьмого этажа, 233–274 м², с личными патио на крыше площадью 150 м² — пространства, где город остаётся внизу, а воздух и свет становятся частью интерьера.",
  "Панорамное остекление crystal vision, дерево-алюминиевые рамы в исторической части и внимательный фасилити-менеджмент подчёркивают уровень, где комфорт сочетается с безупречным стилем.",
];

export default async function ResidencesPage() {
  const content = await fetchPage(ALIAS);
  const slides = cmsSlides(content, "slider", FALLBACK_SLIDES);
  const introP1 = content.texts.intro_p1;

  return (
    <>
      <PageHero
        image={img(content, "hero_image", "/images/residences-hero.png")}
        imageMobile={content.images.hero_image_mobile || undefined}
        imageAlt={txt(content, "hero_alt", "Резиденции клубного дома k 7/11 — редкость клубного формата")}
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

      <ResidenceIntro paragraph={introP1 || undefined} />

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
        image={img(content, "space_image", "/images/residences-space.png")}
        imageAlt={txt(content, "space_alt", "Пентхаус с личным патио на крыше")}
        headingLines={["Пространство", "по вашим", "правилам"]}
        paragraphs={[
          txt(content, "space_p1", FALLBACK_SPACE[0]),
          txt(content, "space_p2", FALLBACK_SPACE[1]),
        ]}
      />

      <ConnectBlock />
    </>
  );
}
