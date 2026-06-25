import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Preloader } from "@/components/layout/Preloader";
import { siteConfig } from "@/config/site";
import "./globals.scss";

// Дисплейный шрифт (заголовки) и текстовый — локальные, self-hosted.
const ricordi = localFont({
  src: "../../public/fonts/TT_Ricordi_Allegria_Regular.woff2",
  variable: "--font-ricordi",
  weight: "400",
  style: "normal",
  display: "swap",
});

const cofo = localFont({
  src: "../../public/fonts/CoFoGothic-Regular.otf",
  variable: "--font-cofo",
  weight: "400",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${ricordi.variable} ${cofo.variable}`}>
      <body>
        <SmoothScroll />
        <Preloader />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
