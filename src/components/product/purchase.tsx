"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Storefront, WarningCircle } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { colorSwatch, type Product } from "@/data/catalog";
import { variantTypes, type Variant } from "@/data/variants";
import { shop, useShop } from "@/lib/shop-store";
import { sizeLabel } from "@/lib/catalog/variant-label";
import { Swatch } from "@/components/catalog/swatch";
import { useProductSelection } from "./product-selection";

type Props = {
  product: Product;
  variants: Variant[];
  cover: { src: string; fit: "cover" | "contain" };
  t: Dictionary["detail"];
  catalog: Dictionary["catalog"];
  shopT: Dictionary["shop"];
  lang: Locale;
};

/** Buy box: colour swatches, size grid, Add to bag with a favourite heart, and where to buy. */
export function Purchase({ product, variants, cover, t, catalog, shopT, lang }: Props) {
  const { color, setColor } = useProductSelection();
  const [selected, setSelected] = useState<number | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const { favorites } = useShop();
  const isFavorite = favorites.includes(product.slug);
  const chosen = selected === null ? null : variants[selected];
  const types = variantTypes.filter((type) => variants.some((v) => v.type === type));

  const addToBag = () => {
    if (variants.length > 0 && !chosen) {
      setSizeError(true);
      return;
    }
    const parts = [
      chosen ? `${t.variantTypes[chosen.type]} ${sizeLabel(chosen, t)}` : catalog.categories[product.category],
      product.colors.length > 1 && color ? catalog.colors[color] : null,
    ].filter(Boolean);
    shop.add(
      product.slug,
      selected,
      { name: product.name, image: cover.src, subtitle: parts.join(" · ") },
      product.colors.length > 1 && color ? color : undefined,
    );
  };

  return (
    <div id="buy" className="mt-8 flex scroll-mt-28 flex-col gap-7">
      {product.colors.length > 0 && (
        <fieldset>
          <legend className="body-6 text-ink-soft">
            {t.color}: <span className="text-ink">{color ? catalog.colors[color] : ""}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.colors.map((c) => {
              const on = c === color;
              const solid = colorSwatch[c].startsWith("#");
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={on}
                  aria-label={catalog.colors[c]}
                  title={catalog.colors[c]}
                  className={`flex size-12 items-center justify-center rounded-full transition-shadow duration-300 ${
                    on ? "ring-2 ring-ink ring-offset-2" : "hover:ring-1 hover:ring-ink/30 hover:ring-offset-2"
                  }`}
                >
                  {solid ? (
                    <span className="size-full rounded-full border border-ink/10" style={{ backgroundColor: colorSwatch[c] }} />
                  ) : (
                    <Swatch color={c} className="size-full" />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {variants.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="body-6 text-ink-soft">
            {t.size}
            {chosen?.code && <span className="caption-5 ml-2">· {t.code}: {chosen.code}</span>}
          </p>
          {types.map((type) => (
            <fieldset key={type}>
              {types.length > 1 && <legend className="caption-1 pb-2 text-ink">{t.variantTypes[type]}</legend>}
              <div className="grid grid-cols-3 gap-2">
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
                      className={`body-6 rounded-lg border px-2 py-3.5 text-center transition-colors duration-300 active:scale-[0.98] ${
                        selected === i ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/40"
                      }`}
                    >
                      {sizeLabel(v, t)}
                    </button>
                  ),
                )}
              </div>
            </fieldset>
          ))}
          {sizeError && (
            <p role="alert" className="caption-1 flex items-center gap-2 text-brand">
              <WarningCircle weight="fill" className="size-4" />
              {shopT.sizeError}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={addToBag}
          className="button-md flex h-14 flex-1 items-center justify-center rounded-full bg-ink px-6 text-white transition-[background-color,transform] duration-300 hover:bg-ink/85 active:scale-[0.98]"
        >
          {shopT.addToBag}
        </button>
        <button
          type="button"
          onClick={() => shop.toggleFavorite(product.slug)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? shopT.removeFavorite : shopT.addFavorite}
          title={isFavorite ? shopT.removeFavorite : shopT.addFavorite}
          className="flex size-14 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition-[border-color,transform] duration-300 hover:border-ink active:scale-[0.98]"
        >
          <Heart weight={isFavorite ? "fill" : "regular"} className={`size-6 ${isFavorite ? "text-brand" : ""}`} />
        </button>
      </div>

      <div className="flex gap-3 rounded-lg border border-line p-4">
        <Storefront weight="regular" className="mt-0.5 size-5 shrink-0 text-ink" />
        <div>
          <p className="body-6 text-ink">{t.storeTitle}</p>
          <p className="caption-5 mt-1 text-ink-soft">
            {t.availability}{" "}
            <Link href={`/${lang}#stores`} className="rounded-sm text-ink underline underline-offset-4">
              {t.cta}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
