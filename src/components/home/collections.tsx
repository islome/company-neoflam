"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { collections } from "@/config/collections";
import { ProductImage } from "@/components/ui/product-image";
import { Reveal } from "@/components/ui/reveal";
import { CarouselArrows } from "@/components/ui/carousel-arrows";
import { useLoopCarousel } from "@/components/ui/use-loop-carousel";

/** Neoflam collections: three big cards in a row that slowly glide to the next collection on their own. */
export function Collections({ t }: { t: Dictionary["collections"] }) {
  const carousel = useLoopCarousel({ count: collections.length, loop: collections.length > 3 });

  return (
    <section id="collections" aria-labelledby="collections-title" aria-roledescription="carousel" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[560px]">
            <p className="caption-3 text-brand">{t.eyebrow}</p>
            <h2 id="collections-title" className="heading-3 md:heading-2 mt-4 text-ink">
              {t.title}
            </h2>
            <p className="body-3 mt-6 text-ink/80">{t.subtitle}</p>
          </div>
          <CarouselArrows onPrev={carousel.prev} onNext={carousel.next} prevLabel={t.prev} nextLabel={t.next} />
        </Reveal>

        <Reveal delay={0.08} className="mt-12">
          <ul
            {...carousel.trackProps}
            aria-label={t.title}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {Array.from({ length: carousel.copies }, (_, copy) =>
              collections.map((c) => {
                const clone = carousel.isClone(copy);
                return (
                  <li
                    key={`${copy}-${c.slug}`}
                    inert={clone}
                    aria-hidden={clone || undefined}
                    className="group w-[80%] shrink-0 snap-start sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-48px)/3)]"
                  >
                    <article>
                      <a
                        href={c.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={-1}
                        aria-hidden
                        className="block overflow-hidden rounded-3xl"
                      >
                        <div className="relative aspect-[4/5] bg-cream">
                          <ProductImage
                            src={c.image}
                            alt=""
                            fill
                            placeholder={typeof c.image === "string" ? "empty" : "blur"}
                            sizes="(min-width: 1024px) 368px, (min-width: 640px) 50vw, 80vw"
                            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                          />
                        </div>
                      </a>
                      <h3 className="heading-4 mt-6 text-ink">{c.name}</h3>
                      <a
                        href={c.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t.explore}: ${c.name}`}
                        className="button-sm mt-4 inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-ink transition-[background-color,border-color,color,transform] duration-300 hover:border-brand hover:bg-brand hover:text-white active:scale-[0.98]"
                      >
                        {t.explore}
                        <ArrowUpRight weight="bold" className="size-4" />
                      </a>
                    </article>
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
