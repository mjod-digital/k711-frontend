import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Preloader } from "@/components/layout/Preloader";
import { Popups } from "@/components/sections/Popups";
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
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${ricordi.variable} ${cofo.variable}`}>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            title="Google Tag Manager"
            src="https://www.googletagmanager.com/ns.html?id=GTM-MSCC98BB"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <SmoothScroll />
        <Preloader />
        <Header />
        <main>{children}</main>
        <Footer />
        <Popups />

        {/* ── Аналитика и трекеры (как на прошлом сайте) ── */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MSCC98BB');`}
        </Script>

        <Script id="mindbox-init" strategy="afterInteractive">
          {`window.mindbox = window.mindbox || function() { mindbox.queue.push(arguments); };
mindbox.queue = mindbox.queue || [];
mindbox('create', { endpointId: 'Mr-group.klimashkina711' });`}
        </Script>
        <Script
          src="https://api.mindbox.ru/scripts/v1/tracker.js"
          strategy="afterInteractive"
        />

        <Script
          src="https://app.comagic.ru/static/cs.min.js?k=73BuuR7GIfkuSo9mcbRkDiEMEQ5olI7P"
          strategy="afterInteractive"
        />

        <Script
          src="//smartcallback.ru/api/SmartCallBack.js?t=kUp43RtwmYtq46zaqKrtyh"
          strategy="afterInteractive"
          charSet="utf-8"
        />

        <Script id="ym-init" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){
m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=104591840', 'ym');
ym(104591840, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});`}
        </Script>

        <Script
          src="https://content.adriver.ru/AdRiverFPS.js"
          strategy="afterInteractive"
        />

        {/* Yandex.Metrika (noscript) */}
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://mc.yandex.ru/watch/104591840"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
