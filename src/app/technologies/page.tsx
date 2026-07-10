import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { TextDuo } from "@/components/sections/TextDuo";
import { ResidenceStats } from "@/components/sections/ResidenceStats";
import { PhotoCards } from "@/components/sections/PhotoCards";
import { ConnectBlock } from "@/components/sections/ConnectBlock";
import { Slider, type Slide } from "@/components/ui/Slider";
import { fetchPage, txt, img, cmsSlides } from "@/lib/api";
import { StayHeading } from "./StayHeading";
import styles from "./technologies.module.scss";

const ALIAS = "technologies";

const FALLBACK_META: Metadata = {
  title: "Передовые технологии",
  description:
    "Передовые технологии клубного дома k 7/11: безопасность, комфорт и тишина — вентиляция, фильтрация воды, паркинг на 55 машиномест с зарядками для электрокаров.",
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchPage(ALIAS);
  return {
    title: c.meta.title || FALLBACK_META.title,
    description: c.meta.description || FALLBACK_META.description,
  };
}

// Кадры из Figma (105:13684 / 13686). Прежние slider-spa и photo-left —
// портреты, в ландшафтный слайдер не годятся.
const FALLBACK_SLIDES: Slide[] = [
  { src: "/images/technologies/parking-hall.png", caption: "Свет и порядок под землёй" },
  { src: "/images/technologies/parking-bays.png", caption: "Место для каждого автомобиля" },
];

const FALLBACK_INTRO: [string, string] = [
  "К7/11 устроен так, чтобы вы чувствовали не технологии, а результаты их тонкой работы: абсолютный комфорт, безопасность и тишину.",
  "Работу воздуха поддерживает централизованная приточно-вытяжная вентиляция с тонкой регулировкой. Горячая вода проходит многоступенчатую систему фильтрации и доступна круглый год.",
];

export default async function TechnologiesPage() {
  const content = await fetchPage(ALIAS);
  const slides = cmsSlides(content, "slider", FALLBACK_SLIDES);

  return (
    <>
      <PageHero
        image={img(content, "hero_image", "/images/technologies/hero.png")}
        imageMobile={content.images.hero_image_mobile || undefined}
        imageAlt={txt(content, "hero_alt", "Передовые технологии клубного дома k 7/11")}
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Передовые технологии" },
        ]}
      >
        <span
          className={`${styles.word} ${styles.bezopasnost} reveal-line`}
          style={{ "--i": 0 } as CSSProperties}
        >
          безопасность,
        </span>
        <span
          className={`${styles.word} ${styles.komfort} reveal-line`}
          style={{ "--i": 1 } as CSSProperties}
        >
          комфорт
        </span>
        <span
          className={`${styles.word} ${styles.tishina} reveal-line`}
          style={{ "--i": 2 } as CSSProperties}
        >
          и тишина
        </span>
      </PageHero>

      <TextDuo
        variant="right"
        lines={[
          { parts: [{ text: "Передовые" }] },
          { parts: [{ text: "технологии" }] },
        ]}
        paragraphs={[
          txt(content, "intro_p1", FALLBACK_INTRO[0]),
          txt(content, "intro_p2", FALLBACK_INTRO[1]),
        ]}
      />

      <Slider slides={slides} />

      <ResidenceStats
        className={styles.stats}
        items={[
          {
            src: "/images/technologies/parking.png",
            objectPosition: "0% 50%",
            alt: "Паркинг с зарядками для электрокаров",
            place: "left",
            number: "5",
            caption: (
              <>
                мест для
                <br />
                электрокаров
              </>
            ),
          },
          {
            src: "/images/technologies/parking.png",
            objectPosition: "50% 50%",
            alt: "Подземный паркинг на 55 машиномест",
            place: "right",
            number: "55",
            caption: "машиномест",
          },
          {
            src: "/images/technologies/parking.png",
            objectPosition: "100% 50%",
            alt: "Двухуровневый паркинг",
            place: "center",
            number: "2",
            caption: "уровня",
          },
        ]}
      />

      <StayHeading />

      <PhotoCards
        className={styles.photoCards}
        items={[
          { src: "/images/technologies/photo-left.png", alt: "Инженерия дома", position: "top", lines: [] },
          { src: "/images/technologies/photo-right.png", alt: "Комфорт резиденций", position: "bottom", lines: [] },
        ]}
      />

      <ConnectBlock />
    </>
  );
}
