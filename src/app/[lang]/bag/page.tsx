import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/catalog/products";
import { getStores } from "@/lib/stores";
import { BagView } from "@/components/shop/bag-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/bag">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { shop } = await getDictionary(lang);
  return { title: `${shop.bag} · Neoflam`, robots: { index: false } };
}

export default async function BagPage({ params }: PageProps<"/[lang]/bag">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dict, products, stores] = await Promise.all([getDictionary(lang), getProducts(), getStores()]);

  return (
    <main id="main">
      <BagView
        products={products}
        lang={lang}
        t={dict.shop}
        catalog={dict.catalog}
        detail={dict.detail}
        stores={stores}
        storesT={dict.stores}
      />
    </main>
  );
}
