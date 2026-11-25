import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { categories, type CategoryKey } from "@/config/products";
import { ProductImage } from "@/components/ui/product-image";
import { Reveal } from "@/components/ui/reveal";

/**
 * "Our products": the three cookware categories as a bento grid.
 * Desktop: one tall feature card on the left, two cards stacked on the right, all ending on the same line.
 * Tablet: the feature card spans the full width above the other two. Phone: one card per row.
 */
export function Products({ t, lang }: { t: Dictionary["products"]; lang: Locale }) {
  const [feature, ...rest] = categories;

  return (
    <section id="products" aria-labelledby="products-title" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="caption-3 text-brand">{t.subtitle}</p>
            <h2 id="products-title" className="heading-3 md:heading-2 mt-4 text-ink">
              {t.title}
            </h2>
          </div>
          <Link
            href={`/${lang}/products`}
            className="button-sm group inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-white transition-[background-color,transform] duration-300 hover:bg-brand-deep active:scale-[0.98]"
          >
            {t.all}
            <ArrowRight
              weight="bold"
              className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
            />
          </Link>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-6 lg:h-[640px] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-2">
          <Reveal className="md:col-span-2 lg:col-span-1 lg:row-span-2">
            <CategoryCard id={feature.key} t={t} lang={lang} feature />
          </Reveal>
          {rest.map((c, i) => (
            <Reveal key={c.key} delay={(i + 1) * 0.06} className="lg:min-h-0">
              <CategoryCard id={c.key} t={t} lang={lang} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  id,
  t,
  lang,
  feature = false,
}: {
  id: CategoryKey;
  t: Dictionary["products"];
  lang: Locale;
  feature?: boolean;
}) {
  const item = t.items[id];
  const image = categories.find((c) => c.key === id)!.image;

  return (
    <Link
      href={`/${lang}/products?category=cookware`}
      className={`group relative isolate block h-full overflow-hidden rounded-3xl bg-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${
        feature ? "aspect-square md:aspect-[16/9] lg:aspect-auto" : "aspect-square lg:aspect-auto"
      }`}
    >
      <ProductImage
        src={image}
        alt=""
        fill
        placeholder="blur"
        sizes={feature ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 460px, (min-width: 768px) 50vw, 100vw"}
        className="-z-10 object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
      />

      {/* Card radius 24px with a 16px inset, so the panel gets 24 − 16 = 8px (rounded-lg). */}
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-lg bg-white/90 p-4 backdrop-blur-md">
        <div className="min-w-0">
          <p className="caption-3 text-brand">{item.tag}</p>
          <h3 className={`mt-1 text-ink ${feature ? "heading-6 md:heading-4" : "heading-6"}`}>{item.name}</h3>
          <p className={`body-6 mt-1 text-ink-soft ${feature ? "line-clamp-1 md:line-clamp-none" : "line-clamp-1"}`}>{item.body}</p>
        </div>
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-colors duration-300 group-hover:bg-brand"
        >
          <ArrowUpRight
            weight="bold"
            className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
