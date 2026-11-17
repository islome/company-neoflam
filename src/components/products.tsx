import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { categories, type CategoryKey } from "@/config/products";
import { Reveal } from "./reveal";

// Staggered two column layout, like the global site.
const columns: CategoryKey[][] = [["pots", "deep"], ["pans"]];

export function Products({ t, lang }: { t: Dictionary["products"]; lang: Locale }) {
  return (
    <section id="products" aria-labelledby="products-title" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-16 md:grid-cols-2 md:gap-12">
          {columns.map((col, c) => (
            <div key={c} className={`flex flex-col gap-16 md:gap-24 ${c === 1 ? "md:pt-48" : ""}`}>
              {c === 0 && (
                <Reveal>
                  <h2 id="products-title" className="heading-3 md:heading-2 text-brand">
                    {t.title}
                  </h2>
                  <p className="title-1 mt-4 text-ink">{t.subtitle}</p>
                </Reveal>
              )}
              {col.map((key, i) => (
                <Reveal key={key} delay={i * 0.06}>
                  <ProductCard id={key} t={t} lang={lang} />
                </Reveal>
              ))}
              {c === 1 && (
                <Reveal>
                  <Link
                    href={`/${lang}/products`}
                    className="button-md group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-white transition-[background-color,transform] duration-300 hover:bg-brand-deep active:scale-[0.98]"
                  >
                    {t.all}
                    <ArrowRight weight="bold" className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
                  </Link>
                </Reveal>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductCard({
  id,
  t,
  lang,
  headingLevel = "h3",
}: {
  id: CategoryKey;
  t: Dictionary["products"];
  lang: Locale;
  headingLevel?: "h2" | "h3";
}) {
  const item = t.items[id];
  const image = categories.find((c) => c.key === id)!.image;
  const Heading = headingLevel;

  return (
    <article id={id} className="group">
      <Link href={`/${lang}/products?category=cookware`} className="block rounded-3xl" tabIndex={-1} aria-hidden>
        <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-cream">
          <Image
            src={image}
            alt=""
            fill
            placeholder="blur"
            sizes="(min-width: 768px) 560px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      </Link>
      <p className="caption-3 mt-6 text-brand">{item.tag}</p>
      <Heading className="heading-4 mt-2 text-ink">{item.name}</Heading>
      <p className="body-3 mt-2 max-w-md text-ink-soft">{item.body}</p>
      <Link
        href={`/${lang}/products?category=cookware`}
        className="button-sm mt-6 inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-ink transition-[background-color,border-color,color,transform] duration-300 hover:border-brand hover:bg-brand hover:text-white active:scale-[0.98]"
      >
        {t.cta}
        <ArrowRight weight="bold" className="size-4" />
      </Link>
    </article>
  );
}
