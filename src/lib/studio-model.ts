/**
 * Saves a product's 3D model from the Studio (browser side): makes the iPhone AR files,
 * uploads the .glb and the AR files straight to Supabase Storage, then records them.
 */
import { createModelUploads, saveModel } from "@/app/[lang]/studio/actions";
import type { ModelRecipe } from "@/data/models";
import { arGroups, usdzFromGlb, usdzFromRecipe, type ArColor } from "@/lib/usdz";

export type ModelToSave = {
  slug: string;
  glb: ArrayBuffer;
  source: "recipe" | "upload";
  /** The recipe (already normalised) for recipe models. */
  recipe: ModelRecipe | null;
  colors: ArColor[];
  paint: string[];
  lidAnimation: string | null;
};

async function put(signedUrl: string, blob: Blob, name: string) {
  const body = new FormData();
  body.append("cacheControl", "31536000");
  body.append("", blob, name);
  const res = await fetch(signedUrl, { method: "PUT", body });
  if (!res.ok) throw new Error(`Upload of ${name} failed (${res.status}).`);
}

/** Returns how many AR files were made; `arError` says why there are none when conversion failed. */
export async function uploadModel(m: ModelToSave, step: (text: string) => void = () => {}) {
  step("Making the iPhone AR version…");
  let ar: ArrayBuffer[] = [];
  let arError: string | null = null;
  try {
    ar = m.source === "recipe" && m.recipe ? await usdzFromRecipe(m.recipe, m.slug) : await usdzFromGlb(m.glb, m.colors, m.paint);
  } catch (e) {
    // The 3D viewer still works; iPhones then convert the model on the fly instead.
    arError = e instanceof Error ? e.message : String(e);
  }

  step("Uploading the 3D model…");
  const slots = await createModelUploads(m.slug, ar.length);
  if (!slots.ok) throw new Error(slots.error);
  await put(slots.glb.signedUrl, new Blob([m.glb], { type: "model/gltf-binary" }), `${m.slug}.glb`);
  await Promise.all(
    ar.map((file, i) => put(slots.usdz[i].signedUrl, new Blob([file], { type: "model/vnd.usdz+zip" }), `${m.slug}.usdz`)),
  );

  const usdz: Record<string, string> = {};
  arGroups(m.colors, m.paint).forEach((group, i) => {
    const path = slots.usdz[i]?.path;
    if (!path) return;
    if (!group.keys.length) usdz.default = path;
    for (const key of group.keys) usdz[key] = path;
  });

  step("Saving…");
  const saved = await saveModel({
    slug: m.slug,
    path: slots.glb.path,
    source: m.source,
    recipe: m.recipe,
    colors: m.colors,
    paint: m.paint,
    lidAnimation: m.lidAnimation,
    usdz,
  });
  if (!saved.ok) throw new Error(saved.error);
  return { arFiles: ar.length, arError };
}
