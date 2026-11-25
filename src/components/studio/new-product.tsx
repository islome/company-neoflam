"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Cube, Trash, UploadSimple, WarningCircle } from "@phosphor-icons/react";
import { colorSwatch, type CategoryKey, type ColorKey, type FeatureKey } from "@/data/catalog";
import type { ViewerModel } from "@/data/models";
import type { VariantType } from "@/data/variants";
import { ProductModelViewer, type ModelLabels } from "@/components/product/product-model";
import { uploadModel } from "@/lib/studio/studio-model";
import { ProductForm, type Note } from "./product-form";
import { Check, Field, inspectGlb, inputClass, primaryButton, savedText, secondaryButton } from "./studio-app";

type Props = {
  lang: string;
  canSave: boolean;
  viewerLabels: ModelLabels & { tab: string; show: string };
  colorNames: Record<ColorKey, string>;
  categoryNames: Record<CategoryKey, string>;
  featureNames: Record<FeatureKey, string>;
  variantTypeNames: Record<VariantType, string>;
};

type Upload = { file: File; url: string; materials: string[]; animations: string[] };

const MAX_GLB = 50 * 1024 * 1024;
/** Starting paint colour for a product colour (clear and multi have no single colour). */
const defaultHex = (key: ColorKey) => (colorSwatch[key].startsWith("#") ? colorSwatch[key] : "#ffffff");

/**
 * Add a product in one go: details, photos, sizes and (optionally) its .glb 3D model.
 * On "Create product" the product is saved first, then the model is uploaded together
 * with the iPhone AR files made from it.
 */
export function NewProduct({ lang, canSave, viewerLabels, colorNames, categoryNames, featureNames, variantTypeNames }: Props) {
  const [round, setRound] = useState(0);
  const [created, setCreated] = useState<{ slug: string; visible: boolean; note?: Note } | null>(null);
  const [productColors, setProductColors] = useState<ColorKey[]>([]);
  const [model, setModel] = useState<Upload | null>(null);
  const [paint, setPaint] = useState<string[]>([]);
  const [lid, setLid] = useState<string | null>(null);
  const [hexes, setHexes] = useState<Partial<Record<ColorKey, string>>>({});
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (model) URL.revokeObjectURL(model.url);
    },
    [model],
  );

  const colors = productColors.map((key) => ({ key, hex: hexes[key] ?? defaultHex(key) }));
  const viewer: ViewerModel | null = model && { src: model.url, colors, paint, lidAnimation: lid ?? undefined };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setModelError(null);
    try {
      if (file.size > MAX_GLB) throw new Error("The file is over 50 MB. Compress it first (for example at gltf.report).");
      const info = inspectGlb(await file.arrayBuffer());
      setModel({ file, url: URL.createObjectURL(file), ...info });
      setPaint(info.materials.filter((m) => /body|base|main/i.test(m)));
      setLid(info.animations.find((a) => /lid|open/i.test(a)) ?? null);
    } catch (e) {
      setModelError(e instanceof Error ? e.message : "That file isn't a .glb.");
    }
  };

  const reset = () => {
    setCreated(null);
    setModel(null);
    setPaint([]);
    setLid(null);
    setHexes({});
    setModelError(null);
    setRound((n) => n + 1);
    window.scrollTo({ top: 0 });
  };

  if (created) {
    const failed = created.note?.tone === "error";
    return (
      <section aria-labelledby="created-title" className="max-w-xl">
        <BackLink lang={lang} />
        <div className="mt-6 rounded-lg bg-mist p-6">
          {failed ? (
            <WarningCircle weight="fill" className="size-8 text-brand" />
          ) : (
            <CheckCircle weight="fill" className="size-8 text-[#1f6b3a]" />
          )}
          <h1 id="created-title" className="title-3 mt-3 text-ink">
            Product created
          </h1>
          {created.note && (
            <p role={failed ? "alert" : "status"} className={`body-6 mt-2 ${failed ? "text-brand" : "text-ink-soft"}`}>
              {created.note.text}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {created.visible && (
              <Link href={`/${lang}/products/${created.slug}`} className={primaryButton}>
                View in the shop
              </Link>
            )}
            <button type="button" onClick={reset} className={created.visible ? secondaryButton : primaryButton}>
              Add another product
            </button>
            <Link href={`/${lang}/studio`} className={secondaryButton}>
              Back to Studio
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <BackLink lang={lang} />
      <h1 className="heading-4 mt-4 text-ink">New product</h1>
      <p className="body-6 mt-1 max-w-2xl text-ink-soft">
        Fill in the details, add photos and sizes, and upload the 3D model if you have one. Everything is saved together
        when you press Create product.
      </p>
      {!canSave && (
        <p role="status" className="caption-1 mt-4 rounded-lg bg-[#fff6e0] px-4 py-3 text-ink">
          Supabase isn&apos;t configured here, so products can&apos;t be saved.
        </p>
      )}

      <div className="mt-6">
        <ProductForm
          key={round}
          product={null}
          canSave={canSave}
          categoryNames={categoryNames}
          colorNames={colorNames}
          featureNames={featureNames}
          variantTypeNames={variantTypeNames}
          onColorsChange={setProductColors}
          afterSave={
            model
              ? async (slug, step) => {
                  const glb = await model.file.arrayBuffer();
                  const result = await uploadModel(
                    { slug, glb, source: "upload", recipe: null, colors, paint, lidAnimation: lid },
                    step,
                  );
                  return savedText(result).replace(/^Saved\. /, "");
                }
              : undefined
          }
          onSaved={(slug, visible, note) => setCreated({ slug, visible, note })}
        >
          <fieldset className="mt-5">
            <legend className="caption-5 text-ink-soft">3D model and AR (optional)</legend>
            <p className="caption-5 mt-1 max-w-2xl text-ink-soft">
              Upload a .glb from Tripo, Meshy, a scanning app or CAD, in real size (metres). The product page shows it in
              3D, Android opens it in AR, and an iPhone AR file is made from it automatically, so customers can place the
              product in their kitchen at real size (iPhones with LiDAR place it instantly).
            </p>

            {!model ? (
              <label className="mt-3 flex max-w-md cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-ink/30 px-4 py-8 text-center hover:bg-mist/60">
                <UploadSimple weight="bold" className="size-5 text-ink" />
                <span className="caption-1 text-ink">Choose .glb file</span>
                <span className="caption-5 text-ink-soft">Up to 50 MB</span>
                <input
                  type="file"
                  accept=".glb,model/gltf-binary"
                  disabled={!canSave}
                  className="sr-only"
                  onChange={(e) => {
                    pick(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            ) : (
              <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-mist">
                  {viewer && (
                    <ProductModelViewer
                      key={viewer.src}
                      model={viewer}
                      labels={{ ...viewerLabels, alt: "3D model preview" }}
                      colorNames={colorNames}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Cube weight="bold" className="size-4 text-ink" />
                    <span className="caption-1 min-w-0 truncate text-ink">{model.file.name}</span>
                    <span className="caption-5 text-ink-soft">{(model.file.size / 1024 / 1024).toFixed(1)} MB</span>
                    <label className="caption-1 ml-auto cursor-pointer rounded-full border border-line px-3 py-1.5 text-ink hover:bg-mist">
                      Replace
                      <input
                        type="file"
                        accept=".glb,model/gltf-binary"
                        className="sr-only"
                        onChange={(e) => {
                          pick(e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setModel(null)}
                      aria-label="Remove the 3D model"
                      className="rounded-full p-2 text-ink-soft hover:bg-mist"
                    >
                      <Trash className="size-4" />
                    </button>
                  </div>

                  <fieldset>
                    <legend className="caption-1 text-ink">Parts the colour switch repaints</legend>
                    <p className="caption-5 mt-1 text-ink-soft">
                      Leave all off to keep the model&apos;s own colours for every product colour.
                    </p>
                    {model.materials.length === 0 ? (
                      <p className="caption-5 mt-2 text-ink-soft">No named parts in this file.</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {model.materials.map((name) => (
                          <Check
                            key={name}
                            label={name}
                            checked={paint.includes(name)}
                            onChange={(on) => setPaint((p) => (on ? [...p, name] : p.filter((x) => x !== name)))}
                          />
                        ))}
                      </div>
                    )}
                  </fieldset>

                  {paint.length > 0 && (
                    <fieldset>
                      <legend className="caption-1 text-ink">Paint colour for each product colour</legend>
                      {colors.length === 0 ? (
                        <p className="caption-5 mt-1 text-ink-soft">Pick the product&apos;s colours above first.</p>
                      ) : (
                        <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {colors.map((c) => (
                            <li key={c.key}>
                              <label className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={c.hex}
                                  onChange={(e) => setHexes((h) => ({ ...h, [c.key]: e.target.value }))}
                                  className="size-8 shrink-0 cursor-pointer rounded border border-line bg-white"
                                />
                                <span className="caption-5 text-ink">{colorNames[c.key]}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </fieldset>
                  )}

                  <Field label="Lid animation (plays on the product page's Open lid button)">
                    <select value={lid ?? ""} onChange={(e) => setLid(e.target.value || null)} className={inputClass}>
                      <option value="">None</option>
                      {model.animations.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            )}
            {modelError && (
              <p role="alert" className="caption-1 mt-2 text-brand">
                {modelError}
              </p>
            )}
          </fieldset>
        </ProductForm>
      </div>
    </div>
  );
}

function BackLink({ lang }: { lang: string }) {
  return (
    <Link href={`/${lang}/studio`} className="caption-1 inline-flex items-center gap-1.5 text-ink-soft hover:text-ink">
      <ArrowLeft weight="bold" className="size-4" /> Studio
    </Link>
  );
}
