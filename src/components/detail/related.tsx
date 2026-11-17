"use client";

import { useId, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Product } from "@/data/catalog";
import { ProductCard } from "@/components/catalog/product-card";
import { ArrowButton } from "./hero-gallery";

type Props = {
  products: Product[];
  t: Dictionary["detail"];
  catalog: Dictionary["catalog"];
  lang: Locale;
  /** Heading text. Defaults to the detail page's "Related". */
  title?: string;
  /** Cards visible at once on desktop. */
  perView?: 3 | 4;
};

const widths = {
  3: "w-[70%] sm:w-[calc((100%-12px)/2)] lg:w-[calc((100%-24px)/3)]",
  4: "w-[70%] sm:w-[calc((100%-24px)/3)] lg:w-[calc((100%-36px)/4)]",
};

/** Horizontal product carousel with arrow controls that grey out at either end. */
export function Related({ products, t, catalog, lang, title, perView = 4 }: Props) {
  const track = useRef<HTMLUListElement>(null);
  const headingId = useId();
  const [edges, setEdges] = useState({ start: true, end: products.length <= perView });

  // Arrows move one card at a time (card width plus the 12px gap).
  const page = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 12), behavior: "smooth" });
  };
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (start !== edges.start || end !== edges.end) setEdges({ start, end });
  };

  if (products.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={headingId} className="heading-5 text-ink">
          {title ?? t.related}
        </h2>
        <div className="flex gap-2">
          <ArrowButton label={t.relatedPrev} onClick={() => page(-1)} disabled={edges.start}>
            <CaretLeft weight="bold" className="size-4" />
          </ArrowButton>
          <ArrowButton label={t.relatedNext} onClick={() => page(1)} disabled={edges.end}>
            <CaretRight weight="bold" className="size-4" />
          </ArrowButton>
        </div>
      </div>
      <ul
        ref={track}
        onScroll={onScroll}
        className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <li key={p.slug} className={`shrink-0 snap-start ${widths[perView]}`}>
            <ProductCard product={p} t={catalog} lang={lang} />
          </li>
        ))}
      </ul>
    </section>
  );
}
