"use server";

import { updateTag } from "next/cache";
import { categoryKeys, colorKeys, featureKeys, type CategoryKey, type ColorKey, type FeatureKey } from "@/data/catalog";
import type { ModelRecipe } from "@/data/models";
import { variantTypes, type Variant } from "@/data/variants";
import { getStudioProducts } from "@/lib/catalog/products";
import { MODELS_BUCKET, MODELS_TAG } from "@/lib/catalog/product-models";
import { requireStudio, signIn, signOut } from "@/lib/studio/studio-auth";
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
  const products = await getStudioProducts();
  if (!products.some((p) => p.slug === slug)) throw new Error("Unknown product.");
}

const fail = (e: unknown): { ok: false; error: string } => ({
  ok: false,
  error: e instanceof Error ? e.message : "Something went wrong.",
});

type Slot = { path: string; signedUrl: string };

/**
 * Step 1 of saving: one-time URLs the browser uploads the .glb and its iPhone AR (.usdz)
 * files to directly (no size limit on our server).
 */
export async function createModelUploads(slug: string, arFiles: number): Promise<Result<{ glb: Slot; usdz: Slot[] }>> {
  try {
    await requireStudio();
    await checkSlug(slug);
    const count = Math.round(Number(arFiles));
    if (!Number.isFinite(count) || count < 0 || count > 8) throw new Error("Too many AR files.");
    const stamp = Date.now();
    const bucket = storage().storage.from(MODELS_BUCKET);
    const slot = async (path: string): Promise<Slot> => {
      const { data, error } = await bucket.createSignedUploadUrl(path);
      if (error || !data) throw new Error(error?.message ?? "Could not start the upload.");
      return { path: data.path, signedUrl: data.signedUrl };
    };
    const glb = await slot(`${slug}/${stamp}.glb`);
    const usdz = await Promise.all(Array.from({ length: count }, (_, i) => slot(`${slug}/${stamp}-${i}.usdz`)));
    return { ok: true, glb, usdz };
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
  /** iPhone AR file per colour key ("default" when the model has no colour options). */
  usdz: Record<string, string>;
};

const ownFile = (slug: string, path: unknown, ext: string) =>
  typeof path === "string" && path.startsWith(`${slug}/`) && path.endsWith(ext) && !path.includes("..");

function clean(input: SaveInput) {
  if (!ownFile(input.slug, input.path, ".glb")) throw new Error("Invalid file path.");
  const usdz = Object.fromEntries(
    Object.entries(input.usdz && typeof input.usdz === "object" ? input.usdz : {}).filter(
      ([key, path]) => (key === "default" || colorKeys.includes(key as ColorKey)) && ownFile(input.slug, path, ".usdz"),
    ),
  );
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
  return { colors, paint, lid, recipe, usdz };
}

/** Every file a saved model owns in the bucket. */
const modelFiles = (row: { storage_path: string | null; usdz: Record<string, string> | null } | null) =>
  row ? [row.storage_path, ...Object.values(row.usdz ?? {})].filter((p): p is string => !!p) : [];

/** Step 2 of saving: records the uploaded file on the product and refreshes product pages. */
export async function saveModel(input: SaveInput): Promise<Result> {
  try {
    await requireStudio();
    await checkSlug(input.slug);
    const { colors, paint, lid, recipe, usdz } = clean(input);
    const db = storage();
    const { data: previous } = await db.from("product_models").select("storage_path, usdz").eq("slug", input.slug).maybeSingle();
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
      usdz,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    const keep = new Set([input.path, ...Object.values(usdz)]);
    const stale = modelFiles(previous).filter((p) => !keep.has(p));
    if (stale.length) await db.storage.from(MODELS_BUCKET).remove(stale);
    updateTag(MODELS_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Removes a saved model and its files. */
export async function deleteModel(slug: string): Promise<Result> {
  try {
    await requireStudio();
    await checkSlug(slug);
    const db = storage();
    const { data: row } = await db.from("product_models").select("storage_path, usdz").eq("slug", slug).maybeSingle();
    const { error } = await db.from("product_models").delete().eq("slug", slug);
    if (error) throw new Error(error.message);
    const files = modelFiles(row);
    if (files.length) await db.storage.from(MODELS_BUCKET).remove(files);
    updateTag(MODELS_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ---------- products ---------- */

const PRODUCTS_TAG = "products";
const IMAGES_BUCKET = "product-images";
const IMAGE_TYPES: Record<string, string> = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp", avif: "avif" };

/** A one-time URL the browser uploads a product photo to (max 10 MB, set on the bucket). */
export async function createImageUpload(ext: string): Promise<Result<{ path: string; signedUrl: string; publicUrl: string }>> {
  try {
    await requireStudio();
    const kind = IMAGE_TYPES[ext.toLowerCase()];
    if (!kind) throw new Error("Use a JPG, PNG, WebP or AVIF photo.");
    const db = storage();
    const path = `products/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${kind}`;
    const { data, error } = await db.storage.from(IMAGES_BUCKET).createSignedUploadUrl(path);
    if (error || !data) throw new Error(error?.message ?? "Could not start the upload.");
    const publicUrl = db.storage.from(IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
    return { ok: true, path: data.path, signedUrl: data.signedUrl, publicUrl };
  } catch (e) {
    return fail(e);
  }
}

export type ProductInput = {
  isNew: boolean;
  slug: string;
  name: string;
  category: CategoryKey;
  colors: ColorKey[];
  features: FeatureKey[];
  price: number | null;
  tagline: { uz: string; ru: string; en: string };
  /** Main photo first. */
  photos: string[];
  /** Sizes in the collection. */
  variants: Variant[];
  active: boolean;
};

function cleanVariants(list: unknown): Variant[] {
  if (!Array.isArray(list)) return [];
  if (list.length > 30) throw new Error("Up to 30 sizes per product.");
  return list.map((v, i) => {
    const type = v?.type;
    const sizeCm = Number(v?.sizeCm);
    const volumeL = v?.volumeL === null || v?.volumeL === undefined || v?.volumeL === "" ? null : Number(v.volumeL);
    const code = typeof v?.code === "string" && v.code.trim() ? v.code.trim().slice(0, 40) : null;
    if (!variantTypes.includes(type)) throw new Error(`Size ${i + 1}: pick a type.`);
    if (!Number.isFinite(sizeCm) || sizeCm <= 0 || sizeCm > 200) throw new Error(`Size ${i + 1}: enter the size in cm.`);
    if (volumeL !== null && (!Number.isFinite(volumeL) || volumeL <= 0 || volumeL > 100)) throw new Error(`Size ${i + 1}: check the volume.`);
    return { code, type, sizeCm, volumeL };
  });
}

/** Photos must come from our own storage, the Neoflam global site, or the site's own /images folder. */
function allowedPhoto(url: string) {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    (!!supabase && url.startsWith(`${supabase}/storage/v1/object/public/${IMAGES_BUCKET}/`)) ||
    url.startsWith("https://neoflam.com/upload/") ||
    url.startsWith("https://neoflam.com/en/img/") ||
    /^\/images\/[\w./-]+$/.test(url)
  );
}

/** Creates or updates a product. New products go to the end of the "featured" order. */
export async function saveProduct(input: ProductInput): Promise<Result<{ slug: string }>> {
  try {
    await requireStudio();
    const slug = String(input.slug ?? "").trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
      throw new Error("The web address may only use lowercase letters, numbers and dashes.");
    }
    if (slug === "studio") throw new Error("That web address is reserved.");
    const name = String(input.name ?? "").trim();
    if (!name || name.length > 80) throw new Error("Give the product a name (up to 80 characters).");
    if (!categoryKeys.includes(input.category)) throw new Error("Pick a category.");
    const colors = [...new Set((input.colors ?? []).filter((c) => colorKeys.includes(c)))];
    if (!colors.length) throw new Error("Pick at least one colour.");
    const features = [...new Set((input.features ?? []).filter((f) => featureKeys.includes(f)))];
    const price = input.price === null || input.price === undefined ? null : Math.round(Number(input.price));
    if (price !== null && (!Number.isFinite(price) || price < 0 || price > 1_000_000_000)) throw new Error("Check the price.");
    const tagline = {
      uz: String(input.tagline?.uz ?? "").trim().slice(0, 300),
      ru: String(input.tagline?.ru ?? "").trim().slice(0, 300),
      en: String(input.tagline?.en ?? "").trim().slice(0, 300),
    };
    const photos = (input.photos ?? []).map(String).slice(0, 13);
    if (!photos.length) throw new Error("Add at least one photo.");
    if (!photos.every(allowedPhoto)) throw new Error("One of the photos has an unexpected address. Upload it again.");
    const variants = cleanVariants(input.variants);

    const db = storage();
    const row = {
      name,
      category: input.category,
      colors,
      features,
      price_uzs: price,
      image_url: photos[0],
      gallery: photos.slice(1),
      variants,
      tagline_uz: tagline.uz,
      tagline_ru: tagline.ru,
      tagline_en: tagline.en,
      is_active: !!input.active,
      updated_at: new Date().toISOString(),
    };

    if (input.isNew) {
      const { data: last } = await db.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { error } = await db.from("products").insert({ ...row, slug, sort_order: (last?.sort_order ?? 0) + 1 });
      if (error) throw new Error(error.code === "23505" ? "A product with that web address already exists." : error.message);
    } else {
      const { data, error } = await db.from("products").update(row).eq("slug", slug).select("slug");
      if (error) throw new Error(error.message);
      if (!data?.length) throw new Error("That product no longer exists.");
    }
    updateTag(PRODUCTS_TAG);
    return { ok: true, slug };
  } catch (e) {
    return fail(e);
  }
}

/** Storage path of a photo in our product-images bucket, or null for outside photos. */
function ownPhotoPath(url: string) {
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGES_BUCKET}/`;
  return process.env.NEXT_PUBLIC_SUPABASE_URL && url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
}

/** Deletes a product for good: its row, its 3D model and AR files, and the photos uploaded for it. */
export async function deleteProduct(slug: string): Promise<Result> {
  try {
    await requireStudio();
    await checkSlug(slug);
    const db = storage();
    const { data: product } = await db.from("products").select("image_url, gallery").eq("slug", slug).maybeSingle();
    const { data: model } = await db.from("product_models").select("storage_path, usdz").eq("slug", slug).maybeSingle();

    // The row first: if this fails nothing is lost; leftover files after it are harmless.
    const { error } = await db.from("products").delete().eq("slug", slug);
    if (error) throw new Error(error.message);
    if (model) await db.from("product_models").delete().eq("slug", slug);

    const files = modelFiles(model);
    if (files.length) await db.storage.from(MODELS_BUCKET).remove(files);
    const photos = [product?.image_url, ...(product?.gallery ?? [])]
      .map((u) => (typeof u === "string" ? ownPhotoPath(u) : null))
      .filter((p): p is string => !!p);
    if (photos.length) await db.storage.from(IMAGES_BUCKET).remove(photos);

    updateTag(PRODUCTS_TAG);
    updateTag(MODELS_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
