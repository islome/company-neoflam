"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Product } from "@/data/catalog";
import { variantTypes, type Variant } from "@/data/variants";
import { formatPrice } from "@/components/catalog/product-card";
import { Heart, WarningCircle } from "@phosphor-icons/react";
import { shop, useShop } from "@/lib/shop-store";
import { sizeLabel } from "@/lib/variant-label";

type Props = {
  product: Product;
  variants: Variant[];
  cover: { src: string; fit: "cover" | "contain" };
  t: Dictionary["detail"];
  catalog: Dictionary["catalog"];
  shopT: Dictionary["shop"];
  lang: Locale;
};

/** Lineup picker with a store call to action, in the spirit of Nike's size grid and Buy button. */
export function Purchase({ product, variants, cover, t, catalog, shopT, lang }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const chosen = selected === null ? null : variants[selected];
  const needsChoice = variants.length > 0 && !chosen;
  const [sizeError, setSizeError] = useState(false);
  const { favorites } = useShop();
  const isFavorite = favorites.includes(product.slug);

  const label = (v: Variant) => sizeLabel(v, t);

  const addToBag = () => {
    if (needsChoice) {
      setSizeError(true);
      return;
    }
    const subtitle = chosen
      ? `${t.variantTypes[chosen.type]} ${label(chosen)}`
      : catalog.categories[product.category];
    shop.add(product.slug, selected, { name: product.name, image: cover.src, subtitle });
  };

  return (
    <section id="buy" aria-labelledby="buy-title" className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-mist">
        <Image
          src={cover.src}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className={cover.fit === "cover" ? "object-cover" : "object-contain bg-white"}
        />
      </div>

      <div className="max-w-md">
        <p className="title-4 text-ink">{catalog.categories[product.category]}</p>
        <h2 id="buy-title" className="heading-5 mt-1 text-ink">
          {product.name}
        </h2>
        <p className="title-3 mt-2 text-ink">
          {product.price === null ? catalog.priceSoon : formatPrice(product.price, catalog)}
        </p>

        {variants.length > 0 ? (
          <div className="mt-8 flex flex-col gap-6">
            <p className="title-4 text-ink">{t.lineupTitle}</p>
            {variantTypes
              .filter((type) => variants.some((v) => v.type === type))
              .map((type) => (
                <fieldset key={type}>
                  <legend className="caption-1 pb-2 text-ink-soft">{t.variantTypes[type]}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {variants.map((v, i) =>
                      v.type !== type ? null : (
                        <button
                          key={i}
                          type="button"
                          aria-pressed={selected === i}
                          onClick={() => {
                            setSelected(selected === i ? null : i);
                            setSizeError(false);
                          }}
                          className={`body-6 rounded-md border px-3 py-3 text-center transition-colors duration-300 active:scale-[0.98] ${
                            selected === i
                              ? "border-ink bg-ink text-white"
                              : "border-line bg-white text-ink hover:border-ink/40"
                          }`}
                        >
                          {label(v)}
                        </button>
                      ),
                    )}
                  </div>
                </fieldset>
              ))}
            <p className="caption-5 min-h-4 text-ink-soft" aria-live="polite">
              {chosen ? `${t.variantTypes[chosen.type]} ${label(chosen)}${chosen.code ? ` · ${t.code}: ${chosen.code}` : ""}` : ""}
            </p>
          </div>
        ) : (
          <p className="body-6 mt-8 text-ink-soft">{t.noLineup}</p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {sizeError && (
            <p role="alert" className="caption-1 flex items-center gap-2 text-brand">
              <WarningCircle weight="fill" className="size-4" />
              {shopT.sizeError}
            </p>
          )}
          <button
            type="button"
            onClick={addToBag}
            className="button-md flex w-full justify-center rounded-full bg-ink px-6 py-4 text-white transition-[background-color,transform] duration-300 hover:bg-ink/85 active:scale-[0.98]"
          >
            {shopT.addToBag}
          </button>
          <button
            type="button"
            onClick={() => shop.toggleFavorite(product.slug)}
            aria-pressed={isFavorite}
            className="button-md flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-4 text-ink transition-[border-color,transform] duration-300 hover:border-ink active:scale-[0.98]"
          >
            {isFavorite ? shopT.favorited : shopT.favorite}
            <Heart weight={isFavorite ? "fill" : "regular"} className={`size-5 ${isFavorite ? "text-brand" : ""}`} />
          </button>
          <p className="caption-5 mt-1 text-ink-soft">
            {t.availability}{" "}
            <Link href={`/${lang}#stores`} className="rounded-sm text-ink underline underline-offset-4">
              {t.cta}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
