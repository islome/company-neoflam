/**
 * Prints SQL that copies the built-in catalog (src/data/catalog.ts) into the
 * Supabase `products` table. Existing slugs are left untouched, so it is safe
 * to run again. Usage: node scripts/products-seed-sql.mjs > seed.sql
 */
import { products } from "../src/data/catalog.ts";

const rows = products.map((p) => ({
  slug: p.slug,
  name: p.name,
  category: p.category,
  colors: p.colors,
  price_uzs: p.price,
  image_url: p.image,
  tagline_uz: p.tagline.uz,
  tagline_ru: p.tagline.ru,
  tagline_en: p.tagline.en,
  sort_order: p.rank,
  added_at: p.addedAt,
}));

const json = JSON.stringify(rows).replaceAll("'", "''");
console.log(`insert into public.products (slug, name, category, colors, price_uzs, image_url, tagline_uz, tagline_ru, tagline_en, sort_order, added_at)
select slug, name, category, colors, price_uzs, image_url, tagline_uz, tagline_ru, tagline_en, sort_order, added_at
from jsonb_to_recordset('${json}'::jsonb) as x(
  slug text, name text, category text, colors text[], price_uzs integer, image_url text,
  tagline_uz text, tagline_ru text, tagline_en text, sort_order int, added_at date
)
on conflict (slug) do nothing;`);
