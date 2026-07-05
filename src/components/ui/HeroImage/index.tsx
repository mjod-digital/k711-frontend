import Image from "next/image";

type HeroImageProps = {
  /** Десктопное фото (обязательное). */
  image: string;
  /** Мобильное фото (опц.). Если не задано — на мобиле берётся десктопное. */
  imageMobile?: string;
  imageAlt: string;
  className?: string;
};

// Фото hero-секции с арт-дирекшеном.
// Есть мобильное → <picture> с <source media> (браузер качает ОДИН вариант,
//   фолбэк на десктоп через <img>); теряем next-оптимизацию, но получаем
//   раздельный кроп моб/десктоп.
// Нет мобильного → обычный оптимизированный next/image (как было).
// data-hero обязателен: прелоудер ждёт загрузку именно hero-картинки.
export function HeroImage({ image, imageMobile, imageAlt, className }: HeroImageProps) {
  if (imageMobile) {
    return (
      <picture>
        <source media="(max-width: 767.98px)" srcSet={imageMobile} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={imageAlt}
          data-hero
          fetchPriority="high"
          decoding="async"
          className={className}
        />
      </picture>
    );
  }
  return (
    <Image
      src={image}
      alt={imageAlt}
      fill
      priority
      data-hero
      sizes="100vw"
      className={className}
    />
  );
}
