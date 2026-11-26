import type { Metadata } from "next";
import { Changa_One, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, htmlLang, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/config/site";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BagToast } from "@/components/shop/bag-toast";
import { HomeScroll } from "@/components/layout/home-scroll";
import { HOME_SCROLL_SCRIPT } from "@/components/layout/home-scroll-script";
import "../globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

// Display face for titles (heading-1 … heading-6). Regular only, Latin only: see globals.css.
const changaOne = Changa_One({
  variable: "--font-changa-one",
  subsets: ["latin"],
  weight: "400",
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);

  return {
    metadataBase: new URL(site.url),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries(locales.map((l) => [htmlLang[l], `/${l}`])),
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      siteName: site.name,
      locale: htmlLang[lang],
      type: "website",
      images: [{ url: site.media.brandFilmCover, width: 1240, height: 698 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html
      lang={htmlLang[lang]}
      className={`${manrope.variable} ${changaOne.variable} antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* The home page always opens at the hero (see components/layout/home-scroll.tsx). A plain inline
            script on purpose: it must run while the HTML is parsed, before the browser or Next.js reads
            the #hash, which next/script's beforeInteractive does not guarantee. */}
        <script dangerouslySetInnerHTML={{ __html: HOME_SCROLL_SCRIPT }} />
      </head>
      <body className="min-h-svh">
        <HomeScroll />
        <a
          href="#main"
          className="button-sm sr-only z-[70] rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          {dict.a11y.skip}
        </a>
        <span id="top" aria-hidden className="block h-px" />
        <SiteHeader lang={lang} nav={dict.nav} a11y={dict.a11y} shop={dict.shop} mini={dict.mini} />
        <BagToast lang={lang} t={dict.shop} />
        {children}
        <SiteFooter t={dict.footer} />
      </body>
    </html>
  );
}
