import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import Preloader from "@/components/layout/Preloader-new/Preloader";
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

// AdRiver JS-counter (Site 231322). Код счётчика — как прислал клиент, не менять.
// Требование AdRiver: <script> строго в <head>, <noscript> — сразу после <body>.
const ADRIVER_COUNTER = `!function(e,t){function r(e,t,r){t=t||"&",r=r||"=";var o=[];for(var n in e)e.hasOwnProperty(n)&&o.push(n+r+encodeURIComponent(e[n]));return o.join(t)}function o(e){var t={};if(e){var r=e.split("&");for(var o in r)if(r.hasOwnProperty(o)){var n=r[o].split("=");void 0!==n[0]&&void 0!==n[1]&&(t[n[0]]=decodeURIComponent(n[1]))}}return t}function n(e){return(/^\\/\\//.test(e)?"https:":"")+e}function i(e,t){var r=e.cookie.match("(^|;) ?"+t+"=([^;]*)(;|$)");return r?decodeURIComponent(r[2]):null}var d,a=document;"undefined"==typeof AdriverCounter&&(AdriverCounter=((d=function(e,t,r){var o=document.domain;if(!(this instanceof AdriverCounter))return d.items[e];d.urlParams=d.getUrlParameters(window.location.search.substring(1)),void 0!==d.urlParams.adrclid&&(t.fsid=d.urlParams.adrclid),null!==d.getCookie(document,"adrcid")&&(t.cid=d.getCookie(document,"adrcid")),r&&r.id&&null!==d.getCookie(document,r.id)&&(t.suid=o+"_"+encodeURIComponent(d.getCookie(document,r.id))),r&&r.gid1?t.gid1=r.gid1:null!==d.getCookie(document,"_ga")&&(t.gid1=encodeURIComponent(d.getCookie(document,"_ga"))),r&&r.yid1?t.yid1=r.yid1:null!==d.getCookie(document,"_ym_uid")&&(t.yid1=encodeURIComponent(d.getCookie(document,"_ym_uid"))),t.loc=encodeURIComponent(window.location.href),e=d.items.length||1,d.items[e]=this,t.ph=e,t.custom&&(t.custom=d.toQueryString(t.custom,";")),d.request(d.toQueryString(t))}).httplize=n,d.loadScript=function(e){try{var t=a.getElementsByTagName("head")[0],r=a.createElement("script");r.setAttribute("type","text/javascript"),r.setAttribute("referrerpolicy","no-referrer-when-downgrade"),r.setAttribute("charset","windows-1251"),r.setAttribute("src",e.split("![rnd]").join(Math.round(1e6*Math.random()))),r.onreadystatechange=function(){/loaded|complete/.test(this.readyState)&&(r.onload=null,t.removeChild(r))},r.onload=function(){t.removeChild(r)},t.insertBefore(r,t.firstChild)}catch(e){}},d.toQueryString=r,d.request=function(e){var t=d.toQueryString(d.defaults);d.loadScript(d.redirectHost+"/cgi-bin/erle.cgi?"+e+"&rnd=![rnd]"+(t?"&"+t:""))},d.getUrlParameters=o,d.getCookie=i,d.items=[],d.defaults={tail256:document.referrer||"unknown"},d.redirectHost="https://ad.adriver.ru",d.urlParams={},d)),new AdriverCounter(0,e,t)}
({sid:231322, bt:62},{id:"",gid1:"",yid1:""});`;

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
      <head>
        {/* AdRiver code START. Type:JS-counter Site: 231322 */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{ __html: ADRIVER_COUNTER }}
        />
        {/* AdRiver code END */}
      </head>
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

        {/* CoMagic и SmartCallBack переустанавливаются через GTM — из кода убраны. */}

        <Script id="ym-init" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){
m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=104591840', 'ym');
ym(104591840, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});`}
        </Script>

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
