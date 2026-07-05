import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { Statement } from "@/components/sections/Statement";
import { Showcase, type ShowcaseStep } from "@/components/sections/Showcase";
import { HistoricCenter } from "@/components/sections/HistoricCenter";
import { Location } from "@/components/sections/Location";
import { Surroundings } from "@/components/sections/Surroundings";
import { Presentation } from "@/components/sections/Presentation";
import { Scenario } from "@/components/sections/Scenario";
import { Terraces } from "@/components/sections/Terraces";
import { ImageHeading } from "@/components/sections/ImageHeading";
import { GardenHeading } from "@/components/sections/ImageHeading/GardenHeading";
import { LobbyHeading } from "@/components/sections/ImageHeading/LobbyHeading";
import { CreamHeading } from "@/components/sections/CreamHeading";
import { TextDuo } from "@/components/sections/TextDuo";
import { Contact } from "@/components/sections/Contact";
import { Slider, type Slide } from "@/components/ui/Slider";
import { GalleryStrip, type GalleryItem } from "@/components/ui/GalleryStrip";
import { fetchPage, txt, cmsSlides, cmsGallery } from "@/lib/api";

const ALIAS = "home";

// SEO-метаданные главной берём из MODX (/api/home → meta), фолбэк — дефолты layout.
export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchPage(ALIAS);
  return {
    title: c.meta.title || undefined,
    description: c.meta.description || undefined,
  };
}

// «Презентация\nо проекте» → строки с <br/> (сохраняет двухстрочный заголовок).
const multiline = (s: string) =>
  s.split("\n").flatMap((line, i) => (i === 0 ? [line] : [<br key={i} />, line]));

const slidesSpa: Slide[] = [
  { src: "/images/slider-1.png", caption: "SPA, где забота о себе превращается в ритуал" },
  { src: "/images/lobby.png", caption: "Лобби с кофейной и барной зонами" },
  { src: "/images/garden.png", caption: "Камерный скандинавский сад" },
  { src: "/images/slider-2.png", caption: "Фитнес-зал с видом на сад" },
  { src: "/images/terraces.png", caption: "Приватные террасы резиденций" },
];

const slidesInterior: Slide[] = [
  { src: "/images/scenario.png", caption: "Интерьеры с вашим сценарием жизни" },
  { src: "/images/residences.png", caption: "От 2 до 4 квартир на этаже" },
  { src: "/images/contact.png", caption: "Панорамные окна в пол" },
  { src: "/images/facade.png", caption: "Фрагмент фасада 1905 года" },
  { src: "/images/architect.png", caption: "Проект Сергея Чобана" },
];

// Лента-галерея перед Terraces (макет 373-10064): чередование широких/узких кадров.
const galleryInteriors: GalleryItem[] = [
  { src: "/images/gallery-living-1.png", caption: "Гостиная", variant: "wide" },
  { src: "/images/gallery-living-2.png", caption: "Гостиная", variant: "narrow" },
  { src: "/images/gallery-bedroom.png", caption: "Спальня", variant: "wide" },
  { src: "/images/gallery-bath.png", caption: "Ванная", variant: "narrow" },
];

const slidesViews: Slide[] = [
  { src: "/images/terraces.png", caption: "Вид на исторический центр" },
  { src: "/images/garden.png", caption: "Зелёный двор-сад" },
  { src: "/images/slider-1.png", caption: "Тихая Пресня за окном" },
  { src: "/images/lobby.png", caption: "Пятиметровые потолки лобби" },
  { src: "/images/slider-2.png", caption: "Свет Серебряного века" },
];

const spaceParagraphs: [string, string] = [
  "В k 7/11 каждая зона за пределами квартиры — продолжение личного мира резидентов. Лобби с кофейной и барной зонами под пятиметровыми потолками становится местом неспешных встреч.",
  "Фитнес-зал с видом на сад и приватное SPA — пространствами для заботы о себе. Отдельные входы для доставки и сервисного персонала позволяют не замечать бытовых хлопот — всё устроено так, чтобы дни оставались для главного.",
];

// Residences + 2×FeatureScreen — один scroll-lock блок (Showcase).
// Каскадные заголовки шагов 2–3 остаются в коде (не выносятся в CMS).
const showcaseSteps: ShowcaseStep[] = [
  {
    image: "/images/residences.png",
    imageAlt: "Клубный дом k711 — 46 резиденций",
    count: 46,
    word: "резиденций",
    description: (
      <>
        Истинно клубный дом.
        <br />
        От 2 до 4 квартир на этаже.
      </>
    ),
    ctaLabel: "выбрать резиденцию",
    ctaHref: "/residences",
  },
  {
    image: "/images/facade.png",
    imageAlt: "Фрагмент фасада 1905 года",
    lines: [
      { parts: [{ text: "фрагмент" }] },
      { parts: [{ text: "фасада" }] },
      { parts: [{ text: "1905", big: true }, { text: "года" }] },
    ],
    // мобайл: «Фрагмент фасада» одной строкой, «1905 года» — второй
    linesMobile: [
      { parts: [{ text: "фрагмент фасада" }] },
      { parts: [{ text: "1905", big: true }, { text: "года" }] },
    ],
    description:
      "Фрагмент Москвы Серебряного века, ставший фундаментом современного дома.",
    ctaLabel: "выбрать резиденцию",
    ctaHref: "/residences",
  },
  {
    image: "/images/architect.png",
    imageAlt: "Архитектор Сергей Чобан",
    lines: [
      { parts: [{ text: "проект" }] },
      { parts: [{ text: "Сергея" }], align: "custom" },
      { parts: [{ text: "Чобана", big: true }] },
    ],
    // мобайл: «Проект Сергея» одной строкой, «Чобана» — второй
    linesMobile: [
      { parts: [{ text: "проект сергея" }] },
      { parts: [{ text: "Чобана", big: true }] },
    ],
    description: (
      <>Современная архитектура, которая не спорит с прошлым, а продолжает его.</>
    ),
    ctaLabel: "выбрать резиденцию",
    ctaHref: "/residences",
  },
];

export default async function HomePage() {
  const content = await fetchPage(ALIAS);

  const spaSlides = cmsSlides(content, "slider_spa", slidesSpa);
  const viewsSlides = cmsSlides(content, "slider_views", slidesViews);
  const interiorSlides = cmsSlides(content, "slider_interior", slidesInterior);
  const gallery = cmsGallery(content, "gallery", galleryInteriors);

  const statementP1 = content.texts.statement_p1;
  const terracesP1 = content.texts.terraces_p1;
  const presTitle = content.texts.presentation_title;
  const space: [string, string] = [
    txt(content, "space_p1", spaceParagraphs[0]),
    txt(content, "space_p2", spaceParagraphs[1]),
  ];

  // Заголовки Statement/TextDuo редактируемы из CMS (строка на строку).
  const statementLines = content.texts.statement_heading
    ? content.texts.statement_heading.split("\n").map((t) => t.trim()).filter(Boolean)
    : undefined;
  const toLines = (s: string | undefined, big: boolean) =>
    s
      ? s.split("\n").map((t) => ({ parts: [{ text: t.trim(), big }] }))
      : undefined;
  const space1Lines = toLines(content.texts.space1_heading, false) ?? [
    { parts: [{ text: "пространство," }] },
    { parts: [{ text: "с которого" }] },
    { parts: [{ text: "начинается дом" }] },
  ];
  const space2Lines = toLines(content.texts.space2_heading, true) ?? [
    { parts: [{ text: "продуманное", big: true }] },
    { parts: [{ text: "пространство", big: true }] },
  ];

  // Showcase: из CMS редактируем фото и описание; заголовки-каунтеры/каскады — в коде.
  const steps = showcaseSteps.map((s, i) => {
    const c = content.lists.showcase?.[i];
    return c
      ? {
          ...s,
          image: (c.image as string) || s.image,
          imageAlt: (c.imageAlt as string) || s.imageAlt,
          description: c.description ? multiline(String(c.description)) : s.description,
        }
      : s;
  });

  return (
    <>
      <Hero
        image={content.images.hero_image || undefined}
        imageMobile={content.images.hero_image_mobile || undefined}
        imageAlt={content.texts.hero_alt || undefined}
      />
      <Statement
        headingLines={statementLines}
        paragraphs={
          statementP1 ? [statementP1, content.texts.statement_p2 ?? ""] : undefined
        }
      />
      <Showcase steps={steps} />

      <HistoricCenter />
      <Slider slides={spaSlides} />
      <Location />
      <Surroundings />
      <Presentation
        title={presTitle ? multiline(presTitle) : undefined}
        description={content.texts.presentation_desc || undefined}
        image={content.images.presentation_image || undefined}
        imageAlt={content.texts.presentation_alt || undefined}
        ctaLabel={content.texts.presentation_cta_label || undefined}
        ctaHref={content.texts.presentation_pdf || undefined}
      />
      <Scenario />

      <GalleryStrip items={gallery} />
      <Terraces
        image={content.images.terraces_image || undefined}
        imageAlt={content.texts.terraces_alt || undefined}
        paragraphs={
          terracesP1 ? [terracesP1, content.texts.terraces_p2 ?? ""] : undefined
        }
      />

      <ImageHeading image="/images/garden.png" imageAlt="Камерный скандинавский сад k711">
        <GardenHeading />
      </ImageHeading>

      <Slider slides={viewsSlides} />

      <CreamHeading />

      <ImageHeading
        image="/images/lobby.png"
        imageAlt="Лобби k711 с пятиметровыми потолками"
        overlay={0.2}
      >
        <LobbyHeading />
      </ImageHeading>

      <TextDuo variant="right" lines={space1Lines} paragraphs={space} />

      <Slider slides={spaSlides} />

      <TextDuo variant="full" lines={space2Lines} paragraphs={space} />

      <Slider slides={interiorSlides} />
      <Contact />
    </>
  );
}
