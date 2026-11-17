import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { products as fallbackProducts, type Product } from "@/data/catalog";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type ProductRow = {
  slug: string;
  name: string;
  category: Product["category"];
  colors: Product["colors"];
  price_uzs: number | null;
  image_url: string;
  tagline_uz: string;
  tagline_ru: string;
  tagline_en: string;
  sort_order: number;
  added_at: string;
};

/**
 * Product catalog. Reads the Supabase `products` table when configured and
 * non empty, otherwise uses src/data/catalog.ts.
 */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const supabase = getSupabaseAdmin();
  if (!supabase) return fallbackProducts;

  const { data, error } = await supabase
    .from("products")
    .select("slug, name, category, colors, price_uzs, image_url, tagline_uz, tagline_ru, tagline_en, sort_order, added_at")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data?.length) {
    if (error) console.error("[products] Supabase query failed:", error.message);
    return fallbackProducts;
  }

  return (data as ProductRow[]).map((r) => ({
    slug: r.slug,
    name: r.name,
    category: r.category,
    colors: r.colors,
    price: r.price_uzs,
    image: r.image_url,
    tagline: { uz: r.tagline_uz, ru: r.tagline_ru, en: r.tagline_en },
    rank: r.sort_order,
    addedAt: r.added_at,
  }));
}
