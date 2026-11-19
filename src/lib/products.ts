import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Product } from "@/data/catalog";
import type { Variant } from "@/data/variants";
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
  gallery: string[] | null;
  features: Product["features"] | null;
  variants: Variant[] | null;
  is_active: boolean;
};

const COLUMNS =
  "slug, name, category, colors, price_uzs, image_url, tagline_uz, tagline_ru, tagline_en, sort_order, added_at, gallery, features, variants, is_active";

const toProduct = (r: ProductRow): Product => ({
  slug: r.slug,
  name: r.name,
  category: r.category,
  colors: r.colors,
  price: r.price_uzs,
  image: r.image_url,
  tagline: { uz: r.tagline_uz, ru: r.tagline_ru, en: r.tagline_en },
  rank: r.sort_order,
  addedAt: r.added_at,
  gallery: r.gallery ?? [],
  features: r.features ?? [],
  variants: r.variants ?? [],
});

/** The product catalog: active products from the Supabase `products` table (added in the Studio). */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[products] Supabase query failed:", error.message);
    return [];
  }
  return (data as ProductRow[]).map(toProduct);
}

export type StudioProduct = Product & { active: boolean };

/** Every product for the Studio, hidden ones included, never cached. */
export async function getStudioProducts(): Promise<StudioProduct[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase.from("products").select(COLUMNS).order("sort_order");
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data as ProductRow[]).map((r) => ({ ...toProduct(r), active: r.is_active }));
}
