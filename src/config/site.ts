export const siteConfig = {
  name: "k711",
  description:
    "Резиновый лендинг на Next.js с SCSS-модулями и контентом из MODX.",
  url: "https://example.com",
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

export type SiteConfig = typeof siteConfig;
