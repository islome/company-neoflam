"use server";

import { updateTag } from "next/cache";
import { colorKeys, type ColorKey } from "@/data/catalog";
import type { ModelRecipe } from "@/data/models";
import { getProducts } from "@/lib/products";
import { MODELS_BUCKET, MODELS_TAG } from "@/lib/product-models";
import { requireStudio, signIn, signOut } from "@/lib/studio-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ok = await signIn(String(form.get("password") ?? ""));
  return { error: ok ? null : "Wrong password." };
}

export async function logout() {
  await signOut();
}

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function storage() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured, so models can't be saved yet. Download the .glb instead.");
  return supabase;
}

async function checkSlug(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) throw new Error("Invalid product.");
  const products = await getProducts();
  if (!products.some((p) => p.slug === slug)) throw new Error("Unknown product.");
}

const fail = (e: unknown): { ok: false; error: string } => ({
  ok: false,
  error: e instanceof Error ? e.message : "Something went wrong.",
});

/** Step 1 of saving: a one-time URL the browser uploads the .glb to directly (no size limit on our server). */
export async function createUpload(slug: string): Promise<Result<{ path: string; signedUrl: string }>> {
  try {
    await requireStudio();
    await checkSlug(slug);
    const path = `${slug}/${Date.now()}.glb`;
    const { data, error } = await storage().storage.from(MODELS_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message ?? "Could not start the upload.");
    return { ok: true, path: data.path, signedUrl: data.signedUrl };
  } catch (e) {
    return fail(e);
  }
}

export type SaveInput = {
  slug: string;
  path: string;
  source: "recipe" | "upload";
  recipe: ModelRecipe | null;
  colors: { key: ColorKey; hex: string }[];
  paint: string[];
  lidAnimation: string | null;
};

function clean(input: SaveInput) {
  if (!input.path.startsWith(`${input.slug}/`) || !input.path.endsWith(".glb") || input.path.includes("..")) {
    throw new Error("Invalid file path.");
  }
  if (input.source !== "recipe" && input.source !== "upload") throw new Error("Invalid source.");
  const colors = (Array.isArray(input.colors) ? input.colors : []).slice(0, 8).filter(
    (c) => colorKeys.includes(c?.key) && /^#[0-9a-f]{6}$/i.test(c?.hex ?? ""),
  );
  const paint = (Array.isArray(input.paint) ? input.paint : [])
    .filter((p) => typeof p === "string" && p.length > 0 && p.length <= 60)
    .slice(0, 20);
  const lid = typeof input.lidAnimation === "string" && input.lidAnimation.length <= 60 ? input.lidAnimation : null;
  const recipe = input.source === "recipe" ? input.recipe : null;
  if (recipe && JSON.stringify(recipe).length > 10_000) throw new Error("Recipe is too large.");
  return { colors, paint, lid, recipe };
}

/** Step 2 of saving: records the uploaded file on the product and refreshes product pages. */
export async function saveModel(input: SaveInput): Promise<Result> {
  try {
    await requireStudio();
    await checkSlug(input.slug);
    const { colors, paint, lid, recipe } = clean(input);
    const db = storage();
    const { data: previous } = await db.from("product_models").select("storage_path").eq("slug", input.slug).maybeSingle();
    const url = db.storage.from(MODELS_BUCKET).getPublicUrl(input.path).data.publicUrl;
    const { error } = await db.from("product_models").upsert({
      slug: input.slug,
      source: input.source,
      url,
      storage_path: input.path,
      recipe,
      colors,
      paint,
      lid_animation: lid,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    if (previous?.storage_path && previous.storage_path !== input.path) {
      await db.storage.from(MODELS_BUCKET).remove([previous.storage_path]);
    }
    updateTag(MODELS_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Removes a saved model; the product falls back to its built-in recipe model (if any). */
export async function deleteModel(slug: string): Promise<Result> {
  try {
    await requireStudio();
    await checkSlug(slug);
    const db = storage();
    const { data: row } = await db.from("product_models").select("storage_path").eq("slug", slug).maybeSingle();
    const { error } = await db.from("product_models").delete().eq("slug", slug);
    if (error) throw new Error(error.message);
    if (row?.storage_path) await db.storage.from(MODELS_BUCKET).remove([row.storage_path]);
    updateTag(MODELS_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
