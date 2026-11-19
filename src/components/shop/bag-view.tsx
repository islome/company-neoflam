"use client";

import { ProductImage } from "@/components/product-image";
import Link from "next/link";
import { Handbag, Heart, Minus, Plus, Trash } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Product } from "@/data/catalog";
import { MAX_BAG_QTY, shop, useShop } from "@/lib/shop-store";
import { sizeLabel } from "@/lib/variant-label";
import { formatPrice, ProductCard } from "@/components/catalog/product-card";
import { Related } from "@/components/detail/related";
import type { Store } from "@/config/site";
import { PickupPicker } from "./pickup-picker";
import { storeTitle } from "@/components/store-locator";

type Props = {
  products: Product[];
  lang: Locale;
  t: Dictionary["shop"];
  catalog: Dictionary["catalog"];
  detail: Dictionary["detail"];
  stores: Store[];
  storesT: Dictionary["stores"];
};

export function BagView({ products, lang, t, catalog, detail, stores, storesT }: Props) {
  const { ready, bag, favorites, bagCount, pickup } = useShop();
  const pickupStore = stores.find((s) => s.id === pickup) ?? null;
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const lines = bag.flatMap((item) => {
    const product = bySlug.get(item.slug);
    return product ? [{ item, product }] : [];
  });
  const favoriteProducts = favorites.flatMap((s) => (bySlug.get(s) ? [bySlug.get(s)!] : []));

  // Up to 10 suggestions: same categories as the bag first, then the rest; never items already in the bag.
  const inBag = new Set(lines.map((l) => l.product.slug));
  const bagCategories = new Set(lines.map((l) => l.product.category));
  const others = products.filter((p) => !inBag.has(p.slug));
  const suggestions = [
    ...others.filter((p) => bagCategories.has(p.category)),
    ...others.filter((p) => !bagCategories.has(p.category)),
  ].slice(0, 10);

  const priced = lines.filter((l) => l.product.price !== null);
  const subtotal = priced.reduce((n, l) => n + l.product.price! * l.item.qty, 0);
  const allPriced = lines.length > 0 && priced.length === lines.length;

  if (!ready) return <BagSkeleton />;

  return (
    <div className="pt-8 pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="bag-title">
            <h1 id="bag-title" className="heading-5 text-ink">
              {t.bag}
              {bagCount > 0 && <span className="text-ink-soft"> · {t.items.replace("{n}", String(bagCount))}</span>}
            </h1>

            {lines.length === 0 ? (
              <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-mist p-8">
                <span className="flex size-12 items-center justify-center rounded-full bg-white text-ink-soft">
                  <Handbag className="size-6" />
                </span>
                <p className="body-3 text-ink">{t.emptyBag}</p>
                <Link
                  href={`/${lang}/products`}
                  className="button-sm rounded-full bg-ink px-4 py-2 text-white transition-transform duration-300 active:scale-[0.98]"
                >
                  {t.browse}
                </Link>
              </div>
            ) : (
              <ul className="mt-2">
                {lines.map(({ item, product }) => {
                  const variant = item.variant === null ? null : (product.variants?.[item.variant] ?? null);
                  const href = `/${lang}/products/${product.slug}`;
                  const fav = favorites.includes(product.slug);
                  return (
                    <li key={item.id} className="flex gap-4 border-b border-line py-6">
                      <Link
                        href={href}
                        className="relative size-28 shrink-0 overflow-hidden rounded-md bg-mist sm:size-36"
                      >
                        <ProductImage src={product.image} alt={product.name} fill sizes="144px" className="object-cover" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-4">
                          <div>
                            <Link href={href} className="title-3 rounded-sm text-ink hover:underline">
                              {product.name}
                            </Link>
                            <p className="body-6 text-ink-soft">{catalog.categories[product.category]}</p>
                            {variant && (
                              <p className="body-6 text-ink-soft">
                                {detail.variantTypes[variant.type]} {sizeLabel(variant, detail)}
                              </p>
                            )}
                            {item.color && item.color in catalog.colors && (
                              <p className="body-6 text-ink-soft">
                                {detail.color}: {catalog.colors[item.color as keyof typeof catalog.colors]}
                              </p>
                            )}
                          </div>
                          <p className="title-3 shrink-0 text-right text-ink">
                            {product.price === null ? (
                              <span className="caption-1 text-ink-soft">{catalog.priceSoon}</span>
                            ) : (
                              formatPrice(product.price * item.qty, catalog)
                            )}
                          </p>
                        </div>

                        <div className="mt-auto flex items-center gap-3 pt-4">
                          <div
                            role="group"
                            aria-label={t.qty}
                            className="flex items-center rounded-full border border-line"
                          >
                            <button
                              type="button"
                              onClick={() => shop.setQty(item.id, item.qty - 1)}
                              aria-label={item.qty === 1 ? t.remove : t.decrease}
                              className="flex size-9 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:bg-ink/5"
                            >
                              {item.qty === 1 ? (
                                <Trash className="size-4" />
                              ) : (
                                <Minus weight="bold" className="size-4" />
                              )}
                            </button>
                            <span className="title-4 w-6 text-center text-ink" aria-live="polite">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => shop.setQty(item.id, item.qty + 1)}
                              disabled={item.qty >= MAX_BAG_QTY}
                              aria-label={t.increase}
                              className="flex size-9 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:bg-ink/5 disabled:opacity-30"
                            >
                              <Plus weight="bold" className="size-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => shop.toggleFavorite(product.slug)}
                            aria-pressed={fav}
                            aria-label={fav ? t.removeFavorite : t.addFavorite}
                            className="flex size-9 items-center justify-center rounded-full border border-line text-ink transition-colors duration-300 hover:border-ink/40"
                          >
                            <Heart weight={fav ? "fill" : "regular"} className={`size-4 ${fav ? "text-brand" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {lines.length > 0 && (
              <PickupPicker stores={stores} pickup={pickup} lang={lang} t={t} storesT={storesT} />
            )}
          </section>

          <aside aria-labelledby="summary-title" className="self-start lg:sticky lg:top-8">
            <h2 id="summary-title" className="heading-5 text-ink">
              {t.summary}
            </h2>
            <dl className="body-6 mt-6 flex flex-col gap-3 text-ink">
              <div className="flex justify-between gap-4">
                <dt>{t.subtotal}</dt>
                <dd>{lines.length === 0 ? "—" : allPriced ? formatPrice(subtotal, catalog) : catalog.priceSoon}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>{t.delivery}</dt>
                <dd>{lines.length === 0 ? "—" : t.deliverySoon}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>{t.pickupAt}</dt>
                <dd className="text-right">
                  {lines.length === 0 ? "—" : pickupStore ? storeTitle(pickupStore, lang, storesT) : t.pickupNone}
                </dd>
              </div>
              <div className="title-3 flex justify-between gap-4 border-y border-line py-4">
                <dt>{t.total}</dt>
                <dd>{lines.length === 0 ? "—" : allPriced ? formatPrice(subtotal, catalog) : catalog.priceSoon}</dd>
              </div>
            </dl>
            <span
              aria-disabled="true"
              className="button-md mt-6 flex w-full cursor-not-allowed justify-center rounded-full bg-line px-6 py-4 text-ink/40"
            >
              {t.checkout}
            </span>
            <p className="caption-5 mt-3 text-ink-soft">{t.checkoutSoon}</p>
            <Link
              href={`/${lang}#stores`}
              className="button-md mt-4 flex w-full justify-center rounded-full border border-ink/15 px-6 py-3 text-ink transition-colors duration-300 hover:border-ink active:scale-[0.98]"
            >
              {t.findStores}
            </Link>
            <p className="caption-5 mt-4 text-ink-soft">{t.savedHere}</p>
          </aside>
        </div>

        <section aria-labelledby="bag-favorites-title" className="pt-24">
          <div className="flex items-center justify-between gap-4">
            <h2 id="bag-favorites-title" className="heading-5 text-ink">
              {t.favorites}
            </h2>
            {favoriteProducts.length > 0 && (
              <Link href={`/${lang}/favorites`} className="title-4 rounded-sm text-ink underline underline-offset-4">
                {t.viewAll}
              </Link>
            )}
          </div>
          {favoriteProducts.length === 0 ? (
            <p className="body-6 mt-1 text-ink-soft">{t.noFavoritesYet}</p>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {favoriteProducts.slice(0, 4).map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} t={catalog} lang={lang} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Wider than the bag column, like Nike's "You might also like". */}
      <div className="mx-auto max-w-screen-2xl px-4 pt-24 sm:px-6 lg:px-12">
        <Related products={suggestions} t={detail} catalog={catalog} lang={lang} title={t.youMightLike} perView={3} />
      </div>
    </div>
  );
}

function BagSkeleton() {
  const block = "animate-pulse rounded-lg bg-mist";
  return (
    <div
      aria-busy="true"
      className="mx-auto grid max-w-5xl gap-12 px-4 pt-8 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="flex flex-col gap-6">
        <div className={`${block} h-8 w-40`} />
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4">
            <div className={`${block} size-36`} />
            <div className="flex flex-1 flex-col gap-2">
              <div className={`${block} h-5 w-40`} />
              <div className={`${block} h-4 w-28`} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className={`${block} h-8 w-32`} />
        <div className={`${block} h-24 w-full`} />
        <div className={`${block} h-14 w-full rounded-full`} />
      </div>
    </div>
  );
}
