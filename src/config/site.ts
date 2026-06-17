export const siteConfig = {
  name: "k711",
  description:
    "Резиновый лендинг на Next.js с SCSS-модулями и контентом из MODX.",
  url: "https://example.com",
  nav: [
    { label: "Главная", href: "/" },
    { label: "О проекте", href: "/about" },
    { label: "Контакты", href: "/contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
