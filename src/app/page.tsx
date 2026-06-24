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
  "В k 7/11 каждая зона за пределами квартиры — продолжение личного мира резидентов. Лобби с кофейной и барной зонами под пятиметровыми потолками становится местом неспешных встреч.",
  "Фитнес-зал с видом на сад и приватное SPA — пространствами для заботы о себе. Отдельные входы для доставки и сервисного персонала позволяют не замечать бытовых хлопот — всё устроено так, чтобы дни оставались для главного.",
];

// Residences + 2×FeatureScreen — один scroll-lock блок (Showcase).
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
      <>Современная архитектура, которая не спорит с прошлым, а продолжает его.</>
    ),
    ctaLabel: "выбрать резиденцию",
    ctaHref: "/residences",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Statement />
      <Showcase steps={showcaseSteps} />

      <HistoricCenter />
      <Slider slides={slidesSpa} />
      <Location />
      <Surroundings />
      <Presentation />
      <Scenario />

      <GalleryStrip items={galleryInteriors} />
      <Terraces />

      <ImageHeading image="/images/garden.png" imageAlt="Камерный скандинавский сад k711">
        <GardenHeading />
      </ImageHeading>

      <Slider slides={slidesViews} />

      <CreamHeading />

      <ImageHeading
        image="/images/lobby.png"
        imageAlt="Лобби k711 с пятиметровыми потолками"
        overlay={0.2}
      >
        <LobbyHeading />
      </ImageHeading>

      <TextDuo
        variant="right"
        lines={[
          { parts: [{ text: "пространство," }] },
          { parts: [{ text: "с которого" }] },
          { parts: [{ text: "начинается дом" }] },
        ]}
        paragraphs={spaceParagraphs}
      />

      <Slider slides={slidesSpa} mobileGallery />

      <TextDuo
        variant="full"
        lines={[
          { parts: [{ text: "продуманное", big: true }] },
          { parts: [{ text: "пространство", big: true }] },
        ]}
        paragraphs={spaceParagraphs}
      />

      <Slider slides={slidesInterior} />
      <Contact />
    </>
  );
}
