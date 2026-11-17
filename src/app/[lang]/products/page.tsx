import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/products";
import { Catalog, CatalogView } from "@/components/catalog/catalog";

export async function generateMetadata({ params }: PageProps<"/[lang]/products">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { catalog } = await getDictionary(lang);
  return {
    title: `${catalog.title} · Neoflam`,
    description: catalog.description,
    alternates: { canonical: `/${lang}/products` },
  };
}

export default async function ProductsPage({ params }: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [{ catalog }, products] = await Promise.all([getDictionary(lang), getProducts()]);

  return (
    <main id="main">
      {/* The unfiltered grid is prerendered; URL filters apply once the page loads. */}
      <Suspense fallback={<CatalogView products={products} t={catalog} lang={lang} />}>
        <Catalog products={products} t={catalog} lang={lang} />
      </Suspense>
    </main>
  );
}
