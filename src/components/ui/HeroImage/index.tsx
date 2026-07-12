import Image, { getImageProps } from "next/image";

type HeroImageProps = {
  /** Десктопное фото (обязательное). */
  image: string;
  /** Мобильное фото (опц.). Если не задано — на мобиле берётся десктопное. */
  imageMobile?: string;
  imageAlt: string;
  className?: string;
};

// Фото hero-секции с арт-дирекшеном.
// Есть мобильное → <picture>, но ОБА источника прогоняем через next-оптимизатор
//   (getImageProps): браузер качает ОДИН оптимизированный вариант (AVIF/WebP,
//   ресайз под ширину экрана), раздельный кроп моб/десктоп сохранён (PERF-001).
// Нет мобильного → обычный оптимизированный next/image.
// data-hero обязателен: прелоудер ждёт загрузку именно hero-картинки (<img data-hero>).
export function HeroImage({ image, imageMobile, imageAlt, className }: HeroImageProps) {
  if (imageMobile) {
    const common = { alt: imageAlt, sizes: "100vw", fill: true, priority: true } as const;
    const {
      props: { srcSet: desktopSrcSet },
    } = getImageProps({ ...common, src: image });
    const {
      props: { srcSet: mobileSrcSet, ...rest },
    } = getImageProps({ ...common, src: imageMobile });

    return (
      <picture>
        <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes="100vw" />
        {/* Фолбэк-источник (<768px) = мобильный srcSet, лежит на самом <img>. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...rest} srcSet={mobileSrcSet} data-hero alt={imageAlt} className={className} />
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
