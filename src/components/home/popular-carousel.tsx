"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Product } from "@/data/catalog";
import { ProductCard } from "@/components/catalog/product-card";
import { Reveal } from "@/components/ui/reveal";
import { CarouselArrows } from "@/components/ui/carousel-arrows";
import { useLoopCarousel } from "@/components/ui/use-loop-carousel";

/** Cards visible on desktop. With this many products or fewer the row is static (no loop, no autoplay). */
const PER_ROW = 4;

/** Popular products: four catalog cards in a row that slowly glide on their own, like the collections. */
export function PopularCarousel({
  products,
  t,
  catalogT,
  lang,
}: {
  products: Product[];
  t: Dictionary["popular"];
  catalogT: Dictionary["catalog"];
  lang: Locale;
}) {
  const loop = products.length > PER_ROW;
  const carousel = useLoopCarousel({ count: products.length, loop });

  return (
    <section id="popular" aria-labelledby="popular-title" aria-roledescription="carousel" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[560px]">
            <p className="caption-3 text-brand">{t.eyebrow}</p>
            <h2 id="popular-title" className="heading-3 md:heading-2 mt-4 text-ink">
              {t.title}
            </h2>
            <p className="body-3 mt-6 text-ink/80">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/${lang}/products`}
              className="button-sm group inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-ink transition-[background-color,border-color,color,transform] duration-300 hover:border-brand hover:bg-brand hover:text-white active:scale-[0.98]"
            >
              {t.all}
              <ArrowRight weight="bold" className="size-4" />
            </Link>
            {loop && <CarouselArrows onPrev={carousel.prev} onNext={carousel.next} prevLabel={t.prev} nextLabel={t.next} />}
          </div>
        </Reveal>

        <Reveal delay={0.08} className="mt-12">
          <ul
            {...carousel.trackProps}
            aria-label={t.title}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
          >
            {Array.from({ length: carousel.copies }, (_, copy) =>
              products.map((product) => {
                const clone = carousel.isClone(copy);
                return (
                  <li
                    key={`${copy}-${product.slug}`}
                    inert={clone}
                    aria-hidden={clone || undefined}
                    className="w-[44%] shrink-0 snap-start sm:w-[calc((100%-48px)/3)] lg:w-[calc((100%-72px)/4)]"
                  >
                    <ProductCard product={product} t={catalogT} lang={lang} />
                  </li>
                );
              }),
            )}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
