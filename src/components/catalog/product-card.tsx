import { ProductImage } from "@/components/product-image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Product } from "@/data/catalog";
import { Swatch } from "./swatch";

type T = Dictionary["catalog"];

export function formatPrice(price: number, t: T) {
  return `${price.toLocaleString("ru-RU")} ${t.currency}`;
}

export function ProductCard({
  product,
  t,
  lang,
  preload,
}: {
  product: Product;
  t: T;
  lang: Locale;
  preload?: boolean;
}) {
  const colorLabel =
    product.colors.length === 1 ? t.colorOne : t.colorMany.replace("{n}", String(product.colors.length));
  // Nike-style hover: the first extra Studio photo replaces the main one while the card is hovered.
  const hoverImage = product.gallery?.find((src) => src && src !== product.image);

  return (
    <article className="group">
      <Link href={`/${lang}/products/${product.slug}`} prefetch className="block">
        {/* Silver product backdrop (#ebebeb, also used in the product gallery): white photo backgrounds blend into it. */}
        <div className="relative isolate aspect-square overflow-hidden bg-[#ebebeb]">
          {/* Swap with `visibility`, not opacity: opacity < 1 would cut the photo off from the
              multiply blend. Tailwind's hover only fires on devices that can hover, so phones keep the main photo. */}
          <span className={hoverImage ? "absolute inset-0 group-hover:invisible" : "absolute inset-0"}>
            <ProductImage
              src={product.image}
              alt={product.name}
              fill
              preload={preload}
              sizes="(min-width: 1024px) 30vw, 50vw"
              className="object-cover mix-blend-multiply"
            />
          </span>
          {hoverImage && (
            <span aria-hidden className="invisible absolute inset-0 group-hover:visible">
              <ProductImage
                src={hoverImage}
                alt=""
                fill
                sizes="(min-width: 1024px) 30vw, 50vw"
                className="object-cover mix-blend-multiply"
              />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 pt-3">
          <h3 className="title-3 text-ink">{product.name}</h3>
          <p className="body-6 text-ink-soft">{t.categories[product.category]}</p>
          <p className="body-6 flex items-center gap-2 text-ink-soft">
            <span className="flex -space-x-1" aria-hidden>
              {product.colors.map((c) => (
                <Swatch key={c} color={c} className="size-3 ring-2 ring-white" />
              ))}
            </span>
            {colorLabel}
          </p>
          <p className="title-3 mt-1 text-ink">
            {product.price === null ? (
              <span className="caption-1 text-ink-soft">{t.priceSoon}</span>
            ) : (
              formatPrice(product.price, t)
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}
