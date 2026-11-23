import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/catalog/products";
import { galleryFor } from "@/data/gallery";
import { getProductModels } from "@/lib/catalog/product-models";
import { formatPrice } from "@/components/catalog/product-card";
import { Swatch } from "@/components/catalog/swatch";
import { HeroGallery } from "@/components/product/hero-gallery";
import { ProductSelection } from "@/components/product/product-selection";
import { Purchase } from "@/components/product/purchase";
import { Related } from "@/components/product/related";
import { Reveal } from "@/components/ui/reveal";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { sizeLabel } from "@/lib/catalog/variant-label";

export async function generateStaticParams() {
  const products = await getProducts();
  return locales.flatMap((lang) => products.map((p) => ({ lang, slug: p.slug })));
}

async function load(params: PageProps<"/[lang]/products/[slug]">["params"]) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  return { lang, product, products };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const { lang, product } = await load(params);
  const { catalog } = await getDictionary(lang);
  const image = galleryFor(product)[0].src;
  return {
    title: `${product.name} · ${catalog.categories[product.category]} · Neoflam`,
    description: product.tagline[lang],
    alternates: { canonical: `/${lang}/products/${product.slug}` },
    openGraph: { title: product.name, description: product.tagline[lang], images: [{ url: image }] },
  };
}

export default function ProductDetailPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  // The slug is URL data, so the product streams in behind a skeleton shaped like the page.
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

function DetailSkeleton() {
  const block = "animate-pulse rounded-lg bg-mist";
  return (
    <main id="main" aria-busy="true" className="mx-auto max-w-screen-2xl px-4 pb-24 sm:px-6 lg:px-12">
      <div className="grid items-center gap-8 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
          <div className="flex gap-2 lg:flex-col">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`${block} size-16 rounded-md`} />
            ))}
          </div>
          <div className={`${block} aspect-square flex-1`} />
        </div>
        <div className="flex w-full max-w-md flex-col gap-3 lg:justify-self-center">
          <div className={`${block} h-4 w-32`} />
          <div className={`${block} h-8 w-48`} />
          <div className={`${block} h-5 w-24`} />
          <div className={`${block} mt-4 h-16 w-full`} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-16 lg:grid-cols-3 lg:pt-24">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`${block} aspect-square`} />
        ))}
      </div>
    </main>
  );
}

async function ProductDetail({ params }: { params: PageProps<"/[lang]/products/[slug]">["params"] }) {
  const { lang, product, products } = await load(params);
  const [{ detail: t, catalog, shop: shopT }, models] = await Promise.all([getDictionary(lang), getProductModels()]);
  const images = galleryFor(product);
  const variants = product.variants ?? [];
  const story = t.story[product.category];
  const model = models[product.slug];

  // Same category first, then the rest of the catalog.
  const related = [
    ...products.filter((p) => p.slug !== product.slug && p.category === product.category),
    ...products.filter((p) => p.slug !== product.slug && p.category !== product.category),
  ].slice(0, 8);

  return (
    <main id="main" className="mx-auto max-w-screen-2xl px-4 pb-24 sm:px-6 lg:px-12">
      {/* Hero: the gallery stays pinned while the buy box and its details scroll beside it. */}
      <ProductSelection initialColor={product.colors[0] ?? null}>
        <section
          aria-labelledby="product-title"
          className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,540px)_minmax(0,460px)] lg:justify-center lg:gap-16 xl:grid-cols-[minmax(0,600px)_minmax(0,480px)] xl:gap-20"
        >
          <HeroGallery
            images={images}
            name={product.name}
            labels={{ prev: t.prev, next: t.next, showImage: t.showImage, photos: t.photos }}
            model3d={
              model && {
                model,
                labels: { ...t.model, alt: t.model.alt.replace("{name}", product.name) },
                colorNames: catalog.colors,
              }
            }
          />

          <div className="w-full max-w-lg">
            <nav aria-label="Breadcrumb" className="body-6 text-ink-soft">
              <Link href={`/${lang}/products?category=${product.category}`} className="rounded-sm hover:text-ink">
                {catalog.categories[product.category]}
              </Link>
            </nav>
            <h1 id="product-title" className="heading-4 mt-1 text-ink">
              {product.name}
            </h1>
            <p className="title-1 mt-3 text-ink">
              {product.price === null ? catalog.priceSoon : formatPrice(product.price, catalog)}
            </p>

            {!!product.features?.length && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {product.features.map((f) => (
                  <li
                    key={f}
                    className={`caption-1 rounded-full px-3.5 py-1.5 ${
                      f === "pfasFree" ? "bg-[#e6f2ea] text-[#1f6b3a]" : "border border-line text-ink"
                    }`}
                  >
                    {catalog.features[f]}
                  </li>
                ))}
              </ul>
            )}

            <Purchase product={product} variants={variants} cover={images[0]} t={t} catalog={catalog} shopT={shopT} lang={lang} />

            <div className="mt-8 border-b border-line">
              <Accordion title={t.details}>
                <p>{product.tagline[lang]}</p>
                <dl className="mt-3 flex flex-col gap-1">
                  <div className="flex gap-1">
                    <dt>{t.collection}:</dt>
                    <dd className="text-ink">{product.name}</dd>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <dt>{t.color}:</dt>
                    <dd className="flex flex-wrap items-center gap-2 text-ink">
                      {product.colors.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1">
                          <Swatch color={c} className="size-3" />
                          {catalog.colors[c]}
                        </span>
                      ))}
                    </dd>
                  </div>
                  {variants.length > 0 && (
                    <div className="flex gap-1">
                      <dt>{t.sizes}:</dt>
                      <dd className="text-ink">
                        {variants.map((v) => `${t.variantTypes[v.type]} ${sizeLabel(v, t)}`).join(", ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </Accordion>
              <Accordion title={t.careTitle}>
                <p>{t.care[product.category]}</p>
              </Accordion>
              <Accordion title={t.deliveryTitle}>
                <p>
                  {t.deliveryBody}{" "}
                  <Link href={`/${lang}#stores`} className="rounded-sm text-ink underline underline-offset-4">
                    {t.cta}
                  </Link>
                </p>
              </Accordion>
            </div>
          </div>
        </section>
      </ProductSelection>

      {/* Story */}
      <section aria-labelledby="story-title" className="mx-auto max-w-md py-24 lg:py-24">
        <Reveal>
          <p className="caption-1 text-ink">
            {product.name} · {catalog.categories[product.category]}
          </p>
          <h2 id="story-title" className="heading-5 mt-1 text-ink">
            {story.title}
          </h2>
          <p className="body-6 mt-4 text-ink-soft">{story.body}</p>
        </Reveal>
      </section>

      <Related products={related} t={t} catalog={catalog} lang={lang} />
    </main>
  );
}

/** Native disclosure row (works without JavaScript), styled like Nike's product details. */
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-line">
      <summary className="title-4 flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <CaretDown weight="bold" className="size-4 shrink-0 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="body-6 pb-6 text-ink-soft">{children}</div>
    </details>
  );
}
