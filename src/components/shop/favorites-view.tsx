"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Heart } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Product } from "@/data/catalog";
import { shop, useShop } from "@/lib/shop-store";
import { ProductCard } from "@/components/catalog/product-card";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  products: Product[];
  lang: Locale;
  t: Dictionary["shop"];
  catalog: Dictionary["catalog"];
};

export function FavoritesView({ products, lang, t, catalog }: Props) {
  const { ready, favorites } = useShop();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = favorites.flatMap((s) => (bySlug.get(s) ? [bySlug.get(s)!] : []));

  if (!ready) {
    return (
      <div aria-busy="true" className="mx-auto max-w-screen-2xl px-4 pt-8 pb-24 sm:px-6 lg:px-12">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-mist" />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-square animate-pulse bg-mist" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-8 pb-24 sm:px-6 lg:px-12">
      <h1 className="heading-5 text-ink">
        {t.favorites} {items.length > 0 && <span className="text-ink-soft">({items.length})</span>}
      </h1>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl bg-mist px-6 py-24 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-white text-ink-soft">
            <Heart className="size-6" />
          </span>
          <h2 className="heading-6 text-ink">{t.emptyFavorites}</h2>
          <p className="body-3 max-w-sm text-ink-soft">{t.emptyFavoritesBody}</p>
          <Link
            href={`/${lang}/products`}
            className="button-sm mt-2 rounded-full bg-ink px-4 py-2 text-white transition-transform duration-300 active:scale-[0.98]"
          >
            {t.browse}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-12 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((p) => {
              const hasSizes = (p.variants?.length ?? 0) > 0;
              return (
                <motion.li
                  key={p.slug}
                  layout
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="relative flex flex-col"
                >
                  <ProductCard product={p} t={catalog} lang={lang} />
                  <button
                    type="button"
                    onClick={() => shop.toggleFavorite(p.slug)}
                    aria-label={`${t.removeFavorite}: ${p.name}`}
                    className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white text-brand shadow-[0_2px_8px_rgba(20,20,20,0.12)] transition-transform duration-300 active:scale-[0.98]"
                  >
                    <Heart weight="fill" className="size-5" />
                  </button>
                  {hasSizes ? (
                    <Link
                      href={`/${lang}/products/${p.slug}#buy`}
                      className="button-sm mt-4 flex justify-center rounded-full border border-ink/15 px-4 py-3 text-ink transition-colors duration-300 hover:border-ink active:scale-[0.98]"
                    >
                      {t.chooseSize}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        shop.add(p.slug, null, { name: p.name, image: p.image, subtitle: catalog.categories[p.category] })
                      }
                      className="button-sm mt-4 flex justify-center rounded-full bg-ink px-4 py-3 text-white transition-[background-color,transform] duration-300 hover:bg-ink/85 active:scale-[0.98]"
                    >
                      {t.addToBag}
                    </button>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
