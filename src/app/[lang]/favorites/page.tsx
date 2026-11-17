import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/products";
import { FavoritesView } from "@/components/shop/favorites-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/favorites">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { shop } = await getDictionary(lang);
  return { title: `${shop.favorites} · Neoflam`, robots: { index: false } };
}

export default async function FavoritesPage({ params }: PageProps<"/[lang]/favorites">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dict, products] = await Promise.all([getDictionary(lang), getProducts()]);

  return (
    <main id="main">
      <FavoritesView products={products} lang={lang} t={dict.shop} catalog={dict.catalog} />
    </main>
  );
}
