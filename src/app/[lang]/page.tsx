import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/config/site";
import { Hero } from "@/components/home/hero";
import { Products } from "@/components/home/products";
import { TaglineReveal } from "@/components/home/tagline-reveal";
import { PopularProducts } from "@/components/home/popular-products";
import { BrandFilm } from "@/components/home/brand-film";
import { Collections } from "@/components/home/collections";
import { Stores } from "@/components/home/stores";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <main id="main">
      <Hero hero={dict.hero} videoUrl={site.media.heroVideo} lang={lang} />
      <Products t={dict.products} lang={lang} />
      <TaglineReveal lines={dict.tagline.lines} />
      <PopularProducts t={dict.popular} catalogT={dict.catalog} lang={lang} />
      <BrandFilm
        t={dict.film}
        a11y={dict.a11y}
        cover={site.media.brandFilmCover}
        src={site.media.brandFilm}
      />
      <Collections t={dict.collections} />
      <Stores t={dict.stores} lang={lang} />
    </main>
  );
}
