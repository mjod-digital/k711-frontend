export const siteConfig = {
  name: "k711",
  description:
    "Резиновый лендинг на Next.js с SCSS-модулями и контентом из MODX.",
  // Основной домен (его индексирует Google) — база для абсолютных URL в метаданных.
  url: "https://klimashkina711.ru",
  // Картинка для поисковой выдачи и превью ссылок — кропы рендера двора (public/seo/).
  // square — подсказка Google для миниатюры в выдаче (primaryImageOfPage на главной),
  // wide — og:image для соцсетей и мессенджеров.
  searchImage: {
    square: { url: "/seo/search-image-1x1.jpg", width: 1200, height: 1200 },
    wide: { url: "/seo/search-image-1200x630.jpg", width: 1200, height: 630 },
    alt: "Клубный дом Климашкина 7/11 и приватный сад",
  },
  phone: {
    display: "+7 (495) 678-34-12",
    href: "tel:+74956783412",
  },
  cta: {
    label: "выбрать резиденцию",
    href: "/apartments",
  },
  nav: [
    { label: "Главная", href: "/" },
    { label: "О проекте", href: "/about" },
    { label: "Контакты", href: "/contact" },
  ],
} as const;

export const ROUTES_PATH = {
  apartments: '/apartments',
  genplan: '/genplan',
} as const;

export type SiteConfig = typeof siteConfig;
