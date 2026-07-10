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
// Фолбэк SEO главной, если CMS/API недоступны (или /api/home ещё не заведён).
const FALLBACK_META: Metadata = {
  title: "К7/11 — клубный семейный дом с ультрасовременной архитектурой.",
  description:
    "К7/11 — клубный дом на Тихой Пресне. Всего 46 резиденций, собственный скандинавский сад. Архитектура от бюро СПИЧ Сергея Чобана.",
};

export async function generateMetadata(): Promise<Metadata> {
  const c = await fetchPage(ALIAS);
  return {
    title: c.meta.title || FALLBACK_META.title,
    description: c.meta.description || FALLBACK_META.description,
  };
}

// «Презентация\nо проекте» → строки с <br/> (сохраняет двухстрочный заголовок).
const multiline = (s: string) =>
  s.split("\n").flatMap((line, i) => (i === 0 ? [line] : [<br key={i} />, line]));

// ВАЖНО: слайд — ландшафт ~1.62:1 (76vw × 680px), object-fit: cover.
// Портретные рендеры (1380×1440, 3277×4096 и т.п.) сюда не годятся — их режет
// и мылит. Берём только ландшафт с шириной ≥2200px.

// «Сервисы и забота». Красный салон переехал в «Жизнь внутри» (по макету),
// amenities-hero убран — это hero-кадр своей страницы.
const slidesSpa: Slide[] = [
  { src: "/images/amenities-slider-2.png", caption: "Панорамный фитнес в тёплых тонах" },
];

// «Сад и благоустройство» — второй слайдер, сразу после блока
// «Камерный скандинавский сад». Годных ландшафтов по саду всего два,
// пока один слайд.
const slidesGarden: Slide[] = [
  { src: "/images/improvement-slider-courtyard.png", caption: "Приватный двор для семейных прогулок" },
  { src: "/images/garden-courtyard.png", caption: "Прогулка с питомцем среди клёнов" },
];

// «Жизнь внутри». Все интерьерные рендеры (gallery-*, residences-stat-*,
// residences-space/hero) — портретные, в слайдер не годятся. Ландшафт один.
const slidesInterior: Slide[] = [
  { src: "/images/residences-scenario.png", caption: "Сценарий неспешного дня дома" },
  { src: "/images/amenities-slider-1.png", caption: "Красный салон с винной коллекцией" },
  { src: "/images/lounge-red.png", caption: "Красная гостиная с баром" },
];

// Лента-галерея перед Terraces (макет 373-10064): чередование широких/узких кадров.
const galleryInteriors: GalleryItem[] = [
  { src: "/images/gallery-living-1.png", caption: "Гостиная", variant: "wide" },
  { src: "/images/gallery-living-2.png", caption: "Гостиная", variant: "narrow" },
  { src: "/images/gallery-bedroom.png", caption: "Спальня", variant: "wide" },
  { src: "/images/gallery-bath.png", caption: "Ванная", variant: "narrow" },
];

// «Дом и окружение» — кадры из Figma (105:13636 / 13648 / 13635).
// arch-hero.png и slider-1.png не берём: это те же два рендера (шире кроп /
// без человека), рядом смотрелись бы дублями.
const slidesViews: Slide[] = [
  { src: "/images/facade-front.png", caption: "Историческая база и медный верх" },
  { src: "/images/facade-corner.png", caption: "Медный объём над историческим карнизом" },
  { src: "/images/terrace-lounge.png", caption: "Приватная терраса над историческим центром" },
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
  // TV slider_garden в MODX пока нет — cmsSlides сам падёт на код-фолбэк.
  const gardenSlides = cmsSlides(content, "slider_garden", slidesGarden);
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
      <Slider slides={viewsSlides} />
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

      <Slider slides={gardenSlides} />

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
