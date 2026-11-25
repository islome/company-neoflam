import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ModelRecipe, StoredModel } from "@/data/models";
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
  usdz: Record<string, string> | null;
  updated_at: string;
};

/** Every product's 3D model, by slug, as saved in the Studio (Supabase). */
export async function getProductModels(): Promise<Record<string, StoredModel>> {
  "use cache";
  cacheLife("hours");
  cacheTag(MODELS_TAG);

  const all: Record<string, StoredModel> = {};
  const supabase = getSupabaseAdmin();
  if (!supabase) return all;
  const { data, error } = await supabase
    .from("product_models")
    .select("slug, source, url, recipe, colors, paint, lid_animation, usdz, updated_at");
  if (error) {
    console.error("[product-models] Supabase query failed:", error.message);
    return all;
  }
  const bucket = supabase.storage.from(MODELS_BUCKET);
  for (const r of data as ModelRow[]) {
    const iosSrc = Object.fromEntries(
      Object.entries(r.usdz ?? {}).map(([key, path]) => [key, bucket.getPublicUrl(path).data.publicUrl]),
    );
    all[r.slug] = {
      slug: r.slug,
      source: r.source,
      src: r.url,
      iosSrc,
      recipe: r.recipe,
      colors: r.colors,
      paint: r.paint,
      lidAnimation: r.lid_animation ?? undefined,
      updatedAt: r.updated_at,
    };
  }
  return all;
}
