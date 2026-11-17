import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/products";
import { galleryFor } from "@/data/gallery";
import { variants as allVariants } from "@/data/variants";
import { formatPrice } from "@/components/catalog/product-card";
import { Swatch } from "@/components/catalog/swatch";
import { HeroGallery } from "@/components/detail/hero-gallery";
import { Purchase } from "@/components/detail/purchase";
import { Related } from "@/components/detail/related";
import { Reveal } from "@/components/reveal";

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
  const { detail: t, catalog, shop: shopT } = await getDictionary(lang);
  const images = galleryFor(product);
  const variants = allVariants[product.slug] ?? [];
  const story = t.story[product.category];

  // Same category first, then the rest of the catalog.
  const related = [
    ...products.filter((p) => p.slug !== product.slug && p.category === product.category),
    ...products.filter((p) => p.slug !== product.slug && p.category !== product.category),
  ].slice(0, 8);

  // Let the first (and, if needed, last) gallery image span two columns so rows of three stay full.
  const span = (i: number) => {
    const n = images.length;
    if (n % 3 === 2 && i === 0) return true;
    if (n % 3 === 1 && (i === 0 || i === n - 1)) return true;
    return false;
  };

  return (
    <main id="main" className="mx-auto max-w-screen-2xl px-4 pb-24 sm:px-6 lg:px-12">
      {/* Hero: gallery and product information */}
      <section aria-labelledby="product-title" className="grid items-center gap-8 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        <HeroGallery
          images={images.slice(0, 6)}
          name={product.name}
          labels={{ prev: t.prev, next: t.next, showImage: t.showImage }}
        />

        <div className="max-w-md lg:justify-self-center">
          <nav aria-label="Breadcrumb" className="caption-5 flex flex-wrap gap-1 text-ink-soft">
            <Link href={`/${lang}/products`} className="rounded-sm hover:text-ink">
              {t.breadcrumb}
            </Link>
            <span aria-hidden>/</span>
            <Link href={`/${lang}/products?category=${product.category}`} className="rounded-sm hover:text-ink">
              {catalog.categories[product.category]}
            </Link>
          </nav>
          <p className="title-4 mt-6 text-ink">{catalog.categories[product.category]}</p>
          <h1 id="product-title" className="heading-4 mt-1 text-ink">
            {product.name}
          </h1>
          <p className="title-3 mt-2 text-ink">
            {product.price === null ? catalog.priceSoon : formatPrice(product.price, catalog)}
          </p>
          <p className="body-6 mt-6 text-ink-soft">{product.tagline[lang]}</p>
          <dl className="caption-5 mt-6 flex flex-col gap-1 text-ink">
            <div className="flex gap-1">
              <dt>{t.collection}:</dt>
              <dd>{product.name}</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt>{t.color}:</dt>
              <dd className="flex items-center gap-2">
                {product.colors.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1">
                    <Swatch color={c} className="size-3" />
                    {catalog.colors[c]}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Gallery grid */}
      <section aria-label={t.gallery} className="pt-16 lg:pt-24">
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.src} className={span(i) ? "col-span-2" : ""}>
              <Reveal delay={(i % 3) * 0.06}>
                <div
                  className={`relative overflow-hidden rounded-lg ${img.fit === "cover" ? "bg-mist" : "bg-white"} ${
                    span(i) ? "aspect-square lg:aspect-[2/1]" : "aspect-square"
                  }`}
                >
                  <Image
                    src={img.src}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    sizes={span(i) ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 50vw"}
                    className={img.fit === "cover" ? "object-cover" : "object-contain"}
                  />
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Lineup and where to buy */}
      <div className="pt-16 lg:pt-24">
        <Purchase product={product} variants={variants} cover={images[0]} t={t} catalog={catalog} shopT={shopT} lang={lang} />
      </div>

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
