import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { builtinModelSrc, builtinUsdzSrc, recipes, type ModelRecipe, type StoredModel } from "@/data/models";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const MODELS_TAG = "product-models";
export const MODELS_BUCKET = "models";

type ModelRow = {
  slug: string;
  source: "recipe" | "upload";
  url: string;
  recipe: ModelRecipe | null;
  colors: StoredModel["colors"];
  paint: string[];
  lid_animation: string | null;
  updated_at: string;
};

const builtin = (slug: string, r: ModelRecipe): StoredModel => ({
  slug,
  source: "builtin",
  src: builtinModelSrc(slug),
  iosSrc: builtinUsdzSrc(slug, r),
  recipe: r,
  colors: r.colors,
  paint: r.paint,
  lidAnimation: r.lidAnimation,
  updatedAt: null,
});

/**
 * Every product's 3D model, by slug: the built-in recipe models from
 * src/data/models.ts, overridden by models saved in the 3D Studio (Supabase).
 */
export async function getProductModels(): Promise<Record<string, StoredModel>> {
  "use cache";
  cacheLife("hours");
  cacheTag(MODELS_TAG);

  const all: Record<string, StoredModel> = Object.fromEntries(
    Object.entries(recipes).map(([slug, r]) => [slug, builtin(slug, r)]),
  );

  const supabase = getSupabaseAdmin();
  if (!supabase) return all;
  const { data, error } = await supabase
    .from("product_models")
    .select("slug, source, url, recipe, colors, paint, lid_animation, updated_at");
  if (error) {
    console.error("[product-models] Supabase query failed:", error.message);
    return all;
  }
  for (const r of data as ModelRow[]) {
    all[r.slug] = {
      slug: r.slug,
      source: r.source,
      src: r.url,
      recipe: r.recipe,
      colors: r.colors,
      paint: r.paint,
      lidAnimation: r.lid_animation ?? undefined,
      updatedAt: r.updated_at,
    };
  }
  return all;
}
