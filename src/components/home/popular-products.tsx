import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { getProducts } from "@/lib/catalog/products";
import { PopularCarousel } from "./popular-carousel";

/** How many products the home page carousel shows. */
const LIMIT = 8;

/**
 * "Popular products" on the home page. Until real sales data exists, popularity is the order set in the
 * Studio (Supabase `products.sort_order`): move a product up there to show it earlier here.
 */
export async function PopularProducts({
  t,
  catalogT,
  lang,
}: {
  t: Dictionary["popular"];
  catalogT: Dictionary["catalog"];
  lang: Locale;
}) {
  const products = (await getProducts()).slice(0, LIMIT);
  if (!products.length) return null;
  return <PopularCarousel products={products} t={t} catalogT={catalogT} lang={lang} />;
}
