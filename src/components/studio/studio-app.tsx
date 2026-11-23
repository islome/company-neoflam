"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DownloadSimple, EyeSlash, MagnifyingGlass, Plus, SignOut, Trash, UploadSimple } from "@phosphor-icons/react";
import { colorKeys, colorSwatch, type CategoryKey, type ColorKey, type FeatureKey } from "@/data/catalog";
import type { ModelRecipe, Palette, Shape, StoredModel, ViewerModel } from "@/data/models";
import type { VariantType } from "@/data/variants";
import { ProductModelViewer, type ModelLabels } from "@/components/product/product-model";
import { deleteModel, logout } from "@/app/[lang]/studio/actions";
import { uploadModel } from "@/lib/studio/studio-model";
import { buildGlb, hasLid, potHeightCm } from "@/lib/studio/model-builder";
import type { StudioProduct } from "@/lib/catalog/products";
import { ProductForm } from "./product-form";

type Props = {
  products: StudioProduct[];
  models: Record<string, StoredModel>;
  canSave: boolean;
  viewerLabels: ModelLabels & { tab: string; show: string };
  colorNames: Record<ColorKey, string>;
  categoryNames: Record<CategoryKey, string>;
  featureNames: Record<FeatureKey, string>;
  variantTypeNames: Record<VariantType, string>;
};

const STATUS: Record<StoredModel["source"] | "none", { label: string; className: string }> = {
  recipe: { label: "Saved recipe", className: "bg-[#e6f2ea] text-[#1f6b3a]" },
  upload: { label: "Uploaded file", className: "bg-[#e7eefa] text-[#24508f]" },
  none: { label: "No 3D model", className: "bg-[#fbeaea] text-brand" },
};

export function StudioApp({
  products,
  models,
  canSave,
  viewerLabels,
  colorNames,
  categoryNames,
  featureNames,
  variantTypeNames,
}: Props) {
  const { lang } = useParams<{ lang: string }>();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(products[0]?.slug ?? null);
  const [tab, setTab] = useState<"details" | "3d">("details");
  const [notice, setNotice] = useState<string | null>(null);
  const open = (slug: string, next: "details" | "3d" = tab) => {
    setSelected(slug);
    setTab(next);
    setNotice(null);
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.slug.includes(q));
  }, [products, query]);
  const missing = products.filter((p) => !models[p.slug]).length;
  // After a delete the selected slug is gone: fall back to the first product.
  const product = products.find((p) => p.slug === selected) ?? products[0];

  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-4 text-ink">Studio</h1>
          <p className="body-6 mt-1 text-ink-soft">
            {products.length} products · {products.filter((p) => !p.active).length} hidden · {products.length - missing} with 3D ·{" "}
            {missing} without 3D
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="caption-1 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-ink hover:bg-mist"
          >
            <SignOut weight="bold" className="size-4" /> Sign out
          </button>
        </form>
      </header>

      {!canSave && (
        <p role="status" className="caption-1 mt-4 rounded-lg bg-[#fff6e0] px-4 py-3 text-ink">
          Supabase isn&apos;t configured here, so products can&apos;t be added or edited, and 3D models can be previewed and
          downloaded but not saved.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside>
          <Link
            href={`/${lang}/studio/new`}
            className="caption-1 mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-white transition-opacity duration-300 hover:opacity-80"
          >
            <Plus weight="bold" className="size-4" /> New product
          </Link>
          <label className="relative block">
            <span className="sr-only">Find a product</span>
            <MagnifyingGlass className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a product"
              className="body-6 w-full rounded-lg border border-line bg-white py-2 pr-3 pl-9 text-ink"
            />
          </label>
          <ul className="mt-3 flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
            {list.map((p) => {
              const status = STATUS[models[p.slug]?.source ?? "none"];
              return (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => open(p.slug)}
                    aria-current={p.slug === product?.slug}
                    className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-200 ${
                      p.slug === product?.slug ? "bg-mist" : "hover:bg-mist/60"
                    }`}
                  >
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-mist">
                      <Image src={p.image} alt="" fill unoptimized className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="caption-1 block truncate text-ink">{p.name}</span>
                      <span className="mt-0.5 flex flex-wrap gap-1">
                        {!p.active && (
                          <span className="caption-5 inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-white">
                            <EyeSlash className="size-3" /> Hidden
                          </span>
                        )}
                        <span className={`caption-5 inline-block rounded-full px-2 py-0.5 ${status.className}`}>{status.label}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="min-w-0">
          {notice && (
            <p role="status" className="caption-1 mb-4 rounded-lg bg-[#e6f2ea] px-4 py-3 text-[#1f6b3a]">
              {notice}
            </p>
          )}
          {!product ? (
            <p className="body-6 rounded-lg bg-mist px-5 py-8 text-center text-ink-soft">
              No products yet.{" "}
              <Link href={`/${lang}/studio/new`} className="text-ink underline underline-offset-4">
                Add the first one
              </Link>
              .
            </p>
          ) : (
            product && (
              <>
                <div role="tablist" aria-label={product.name} className="mb-5 inline-flex rounded-full bg-mist p-1">
                  {(
                    [
                      ["details", "Details"],
                      ["3d", "3D model"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      role="tab"
                      type="button"
                      aria-selected={tab === key}
                      onClick={() => setTab(key)}
                      className={`caption-1 rounded-full px-4 py-2 transition-colors duration-200 ${tab === key ? "bg-white text-ink shadow-sm" : "text-ink-soft"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {tab === "details" ? (
                  <ProductForm
                    key={product.slug}
                    product={product}
                    canSave={canSave}
                    categoryNames={categoryNames}
                    colorNames={colorNames}
                    featureNames={featureNames}
                    variantTypeNames={variantTypeNames}
                    onSaved={() => setNotice(null)}
                    onDeleted={(slug) => {
                      const deleted = products.find((p) => p.slug === slug)?.name ?? slug;
                      setSelected(products.find((p) => p.slug !== slug)?.slug ?? null);
                      setTab("details");
                      setNotice(`${deleted} was deleted.`);
                    }}
                  />
                ) : (
                  <Editor
                    key={`${product.slug}:${models[product.slug]?.updatedAt ?? ""}`}
                    product={product}
                    stored={models[product.slug] ?? null}
                    canSave={canSave}
                    viewerLabels={viewerLabels}
                    colorNames={colorNames}
                  />
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- editor ---------- */

type EditorProps = {
  product: StudioProduct;
  stored: StoredModel | null;
  canSave: boolean;
  viewerLabels: ModelLabels & { tab: string; show: string };
  colorNames: Record<ColorKey, string>;
};

type Upload = { file: File; url: string; materials: string[]; animations: string[] };

function Editor({ product, stored, canSave, viewerLabels, colorNames }: EditorProps) {
  const [mode, setMode] = useState<"recipe" | "upload">(stored?.source === "upload" ? "upload" : "recipe");
  const [recipe, setRecipe] = useState<ModelRecipe>(() => stored?.recipe ?? defaultRecipe(product));
  const [preview, setPreview] = useState<{ url: string; glb: ArrayBuffer } | null>(null);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [uploadColors, setUploadColors] = useState(stored?.source === "upload" ? stored.colors : defaultColors(product));
  const [uploadPaint, setUploadPaint] = useState<string[]>(stored?.source === "upload" ? stored.paint : []);
  const [uploadLid, setUploadLid] = useState<string | null>(stored?.source === "upload" ? (stored.lidAnimation ?? null) : null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  // Rebuild the recipe preview shortly after each change.
  useEffect(() => {
    if (mode !== "recipe") return;
    let url = "";
    let alive = true;
    const id = setTimeout(async () => {
      try {
        const glb = await buildGlb(normalise(recipe), product.slug);
        if (!alive) return;
        url = URL.createObjectURL(new Blob([glb], { type: "model/gltf-binary" }));
        setPreview({ url, glb });
      } catch (e) {
        setMessage({ tone: "error", text: `Could not build this recipe: ${e instanceof Error ? e.message : e}` });
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(id);
      if (url) URL.revokeObjectURL(url);
    };
  }, [mode, recipe, product.slug]);

  useEffect(
    () => () => {
      if (upload) URL.revokeObjectURL(upload.url);
    },
    [upload],
  );

  const viewer: ViewerModel | null =
    mode === "recipe"
      ? preview && { src: preview.url, ...viewerMeta(normalise(recipe)) }
      : upload
        ? { src: upload.url, colors: uploadColors, paint: uploadPaint, lidAnimation: uploadLid ?? undefined }
        : stored?.source === "upload"
          ? stored
          : null;

  const currentFile = async (): Promise<Blob | null> => {
    if (mode === "recipe") return preview ? new Blob([preview.glb], { type: "model/gltf-binary" }) : null;
    if (upload) return new Blob([upload.file], { type: "model/gltf-binary" });
    return null;
  };

  const download = async () => {
    const blob = await currentFile();
    if (!blob) {
      if (stored) window.open(stored.src, "_blank", "noopener");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `${product.slug}.glb` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const save = async () => {
    const blob = await currentFile();
    if (!blob) return;
    setBusy(true);
    setMessage(null);
    try {
      const r = normalise(recipe);
      const glb = await blob.arrayBuffer();
      const result = await uploadModel(
        mode === "recipe"
          ? { slug: product.slug, glb, source: "recipe", recipe: r, ...saveMeta(viewerMeta(r)) }
          : { slug: product.slug, glb, source: "upload", recipe: null, colors: uploadColors, paint: uploadPaint, lidAnimation: uploadLid },
        (text) => setMessage({ tone: "ok", text }),
      );
      setMessage({ tone: "ok", text: savedText(result) });
      router.refresh();
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Save failed." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Remove the saved 3D model for ${product.name}? This deletes the file and can't be undone.`)) return;
    setBusy(true);
    const r = await deleteModel(product.slug);
    setBusy(false);
    setMessage(r.ok ? { tone: "ok", text: "Removed." } : { tone: "error", text: r.error });
    if (r.ok) router.refresh();
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    try {
      if (file.size > 50 * 1024 * 1024) throw new Error("File is over 50 MB. Compress it first (e.g. gltf.report).");
      const info = inspectGlb(await file.arrayBuffer());
      setUpload({ file, url: URL.createObjectURL(file), ...info });
      setUploadPaint(info.materials.filter((m) => /body|base|main/i.test(m)));
      setUploadLid(info.animations.find((a) => /lid|open/i.test(a)) ?? null);
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : "Not a .glb file." });
    }
  };

  const canSaveNow = canSave && !busy && (mode === "recipe" ? !!preview : !!upload);

  return (
    <section aria-labelledby="editor-title" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="editor-title" className="title-3 text-ink">
            {product.name}
          </h2>
          {stored?.updatedAt && (
            <p className="caption-5 text-ink-soft">Saved {new Date(stored.updatedAt).toLocaleString()}</p>
          )}
        </div>
        <div className="relative mt-3 aspect-square overflow-hidden rounded-lg bg-mist">
          {viewer ? (
            <ProductModelViewer
              key={viewer.src}
              model={viewer}
              labels={{ ...viewerLabels, alt: viewerLabels.alt.replace("{name}", product.name) }}
              colorNames={colorNames}
            />
          ) : (
            <p className="body-6 absolute inset-0 grid place-items-center p-6 text-center text-ink-soft">
              {mode === "upload" ? "Choose a .glb file to preview it." : "Building preview…"}
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={download} className={secondaryButton}>
            <DownloadSimple weight="bold" className="size-4" /> Download .glb
          </button>
          <button type="button" onClick={save} disabled={!canSaveNow} className={primaryButton}>
            <UploadSimple weight="bold" className="size-4" /> {busy ? "Saving…" : "Save to product"}
          </button>
          {stored && canSave && (
            <button type="button" onClick={remove} disabled={busy} className={secondaryButton}>
              <Trash weight="bold" className="size-4" /> Remove saved model
            </button>
          )}
        </div>
        {message && (
          <p role={message.tone === "error" ? "alert" : "status"} className={`caption-1 mt-3 ${message.tone === "error" ? "text-brand" : "text-[#1f6b3a]"}`}>
            {message.text}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div role="tablist" aria-label="How to make the model" className="grid grid-cols-2 rounded-full bg-mist p-1">
          {(["recipe", "upload"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`caption-1 rounded-full px-3 py-2 transition-colors duration-200 ${mode === m ? "bg-white text-ink shadow-sm" : "text-ink-soft"}`}
            >
              {m === "recipe" ? "Build from recipe" : "Upload .glb"}
            </button>
          ))}
        </div>

        {mode === "recipe" ? (
          <RecipeForm recipe={recipe} onChange={setRecipe} colorNames={colorNames} />
        ) : (
          <div className="flex flex-col gap-5">
            <p className="caption-5 text-ink-soft">
              For shapes the recipes can&apos;t make. Create the model in Tripo, Meshy or a scanning app, export .glb, and
              drop it here.
            </p>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-ink/30 px-4 py-6 text-center hover:bg-mist/60">
              <UploadSimple weight="bold" className="size-5 text-ink" />
              <span className="caption-1 text-ink">{upload ? upload.file.name : "Choose .glb file"}</span>
              <span className="caption-5 text-ink-soft">Up to 50 MB</span>
              <input type="file" accept=".glb,model/gltf-binary" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            {upload && (
              <>
                <ColorsEditor colors={uploadColors} onChange={setUploadColors} colorNames={colorNames} />
                <fieldset>
                  <legend className="caption-1 text-ink">Parts the colour switcher repaints</legend>
                  {upload.materials.length === 0 && <p className="caption-5 mt-1 text-ink-soft">No named materials found.</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {upload.materials.map((name) => (
                      <Check
                        key={name}
                        label={name}
                        checked={uploadPaint.includes(name)}
                        onChange={(on) => setUploadPaint((p) => (on ? [...p, name] : p.filter((x) => x !== name)))}
                      />
                    ))}
                  </div>
                </fieldset>
                <Field label="Lid animation">
                  <select value={uploadLid ?? ""} onChange={(e) => setUploadLid(e.target.value || null)} className={inputClass}>
                    <option value="">None</option>
                    {upload.animations.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- recipe form ---------- */

const KINDS: { kind: Shape["kind"]; label: string }[] = [
  { kind: "pot", label: "Pot or saucepan" },
  { kind: "pan", label: "Frying pan or wok" },
  { kind: "box", label: "Container (box)" },
  { kind: "stack", label: "Stacking containers" },
  { kind: "dish", label: "Plate and bowl" },
];

const ROLES: Record<Shape["kind"], (keyof Palette)[]> = {
  pot: ["Body", "Interior", "Handle", "Rim", "Knob"],
  pan: ["Body", "Interior", "Handle"],
  box: ["Lid", "Clip", "Accent"],
  stack: ["Body", "Lid", "Accent"],
  dish: ["Body", "Interior"],
};

const ROLE_LABEL: Record<keyof Palette, string> = {
  Body: "Body",
  Interior: "Inside / coating",
  Handle: "Handles",
  Rim: "Lid rim",
  Knob: "Knob",
  Lid: "Lid",
  Clip: "Clips",
  Accent: "Seal / details",
};

function shapeFor(kind: Shape["kind"]): Shape {
  switch (kind) {
    case "pot":
      return { kind, diameterCm: 20, heightCm: 10, handles: "loop", knob: "wood" };
    case "pan":
      return { kind, diameterCm: 26, depthCm: 5 };
    case "box":
      return { kind, widthCm: 18, depthCm: 13, heightCm: 7, clips: true, glass: true };
    case "stack":
      return { kind, diameterCm: 12, heightCm: 6, tiers: 2 };
    case "dish":
      return { kind, plateCm: 24, bowlCm: 14 };
  }
}

function RecipeForm({
  recipe,
  onChange,
  colorNames,
}: {
  recipe: ModelRecipe;
  onChange: (r: ModelRecipe) => void;
  colorNames: Record<ColorKey, string>;
}) {
  const s = recipe.shape;
  const setShape = (patch: Partial<Shape>) => onChange({ ...recipe, shape: { ...s, ...patch } as Shape });
  const num = (key: string, label: string, opts: { min: number; max: number; step?: number; optional?: boolean }) => {
    const value = (s as Record<string, unknown>)[key] as number | undefined;
    return (
      <Field label={label}>
        <input
          type="number"
          min={opts.min}
          max={opts.max}
          step={opts.step ?? 0.5}
          value={value ?? ""}
          placeholder={opts.optional ? "auto" : undefined}
          onChange={(e) => {
            const n = e.target.value === "" ? undefined : Math.min(opts.max, Math.max(opts.min, Number(e.target.value)));
            if (n === undefined && !opts.optional) return;
            setShape({ [key]: n } as Partial<Shape>);
          }}
          className={inputClass}
        />
      </Field>
    );
  };
  const bool = (key: string, label: string) => (
    <Check label={label} checked={!!(s as Record<string, unknown>)[key]} onChange={(on) => setShape({ [key]: on } as Partial<Shape>)} />
  );

  return (
    <div className="flex flex-col gap-5">
      <Field label="Shape">
        <select
          value={s.kind}
          onChange={(e) => onChange({ ...recipe, shape: shapeFor(e.target.value as Shape["kind"]) })}
          className={inputClass}
        >
          {KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="caption-1 mb-2 text-ink">Size (cm)</legend>
        {s.kind === "pot" && (
          <>
            {num("diameterCm", "Diameter", { min: 8, max: 40 })}
            {num("volumeL", "Volume (L)", { min: 0.3, max: 15, step: 0.1, optional: true })}
            {num("heightCm", "Height", { min: 3, max: 35, optional: true })}
            <p className="caption-5 col-span-2 text-ink-soft">
              Leave height empty to work it out from the volume (now {potHeightCm(s).toFixed(1)} cm).
            </p>
            <Field label="Handles">
              <select value={s.handles} onChange={(e) => setShape({ handles: e.target.value as "loop" })} className={inputClass}>
                <option value="loop">Flat loops</option>
                <option value="ear">Round ears</option>
                <option value="stick">Long handle</option>
              </select>
            </Field>
            <Field label="Knob">
              <select value={s.knob} onChange={(e) => setShape({ knob: e.target.value as "wood" })} className={inputClass}>
                <option value="wood">Wood</option>
                <option value="pebble">Pebble</option>
                <option value="ball">Ball</option>
                <option value="metal">Metal</option>
              </select>
            </Field>
          </>
        )}
        {s.kind === "pan" && (
          <>
            {num("diameterCm", "Diameter", { min: 12, max: 40 })}
            {num("depthCm", "Depth", { min: 2, max: 12 })}
            <div className="col-span-2">{bool("wok", "Wok (rounder bottom)")}</div>
          </>
        )}
        {s.kind === "box" && (
          <>
            {num("widthCm", "Width", { min: 5, max: 45 })}
            {num("depthCm", "Depth", { min: 5, max: 45 })}
            {num("heightCm", "Height", { min: 3, max: 40 })}
            <div className="col-span-2 flex flex-wrap gap-2">
              {bool("glass", "Glass body")}
              {bool("clips", "Locking clips")}
              {bool("tab", "Vent tab")}
            </div>
          </>
        )}
        {s.kind === "stack" && (
          <>
            {num("diameterCm", "Diameter", { min: 6, max: 30 })}
            {num("heightCm", "Tier height", { min: 2, max: 20 })}
            {num("tiers", "Tiers", { min: 1, max: 5, step: 1 })}
          </>
        )}
        {s.kind === "dish" && (
          <>
            {num("plateCm", "Plate", { min: 10, max: 36 })}
            {num("bowlCm", "Bowl", { min: 6, max: 24 })}
          </>
        )}
      </fieldset>

      <fieldset>
        <legend className="caption-1 mb-2 text-ink">Colours of each part</legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLES[s.kind].map((role) => (
            <label key={role} className="flex items-center gap-2">
              <input
                type="color"
                value={recipe.palette[role] ?? "#eeeeee"}
                onChange={(e) => onChange({ ...recipe, palette: { ...recipe.palette, [role]: e.target.value } })}
                className="size-8 shrink-0 cursor-pointer rounded border border-line bg-white"
              />
              <span className="caption-5 text-ink">{ROLE_LABEL[role]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <ColorsEditor colors={recipe.colors} onChange={(colors) => onChange({ ...recipe, colors })} colorNames={colorNames} />

      <fieldset>
        <legend className="caption-1 text-ink">Parts the colour switcher repaints</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROLES[s.kind].map((role) => (
            <Check
              key={role}
              label={ROLE_LABEL[role]}
              checked={recipe.paint.includes(role)}
              onChange={(on) => onChange({ ...recipe, paint: on ? [...recipe.paint, role] : recipe.paint.filter((p) => p !== role) })}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/** Colour switcher options shown to customers. The first is the colour the model is built in. */
export function ColorsEditor({
  colors,
  onChange,
  colorNames,
}: {
  colors: { key: ColorKey; hex: string }[];
  onChange: (c: { key: ColorKey; hex: string }[]) => void;
  colorNames: Record<ColorKey, string>;
}) {
  const update = (i: number, patch: Partial<{ key: ColorKey; hex: string }>) =>
    onChange(colors.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <fieldset>
      <legend className="caption-1 text-ink">Colour options for customers</legend>
      <p className="caption-5 mt-1 text-ink-soft">The first one is the default. Two or more show colour dots on the product page.</p>
      <ul className="mt-2 flex flex-col gap-2">
        {colors.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={c.hex}
              onChange={(e) => update(i, { hex: e.target.value })}
              aria-label={`Colour ${i + 1}`}
              className="size-8 shrink-0 cursor-pointer rounded border border-line bg-white"
            />
            <select value={c.key} onChange={(e) => update(i, { key: e.target.value as ColorKey })} className={`${inputClass} flex-1`}>
              {colorKeys.map((k) => (
                <option key={k} value={k}>
                  {colorNames[k]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onChange(colors.filter((_, j) => j !== i))}
              disabled={colors.length <= 1}
              aria-label={`Remove colour ${i + 1}`}
              className="rounded-full p-2 text-ink-soft hover:bg-mist disabled:opacity-30"
            >
              <Trash className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {colors.length < 8 && (
        <button
          type="button"
          onClick={() => onChange([...colors, { key: "white", hex: "#ffffff" }])}
          className="caption-1 mt-2 rounded-full border border-line px-3 py-1.5 text-ink hover:bg-mist"
        >
          Add colour
        </button>
      )}
    </fieldset>
  );
}

/* ---------- small pieces ---------- */

export const inputClass = "body-6 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink";
export const primaryButton =
  "caption-1 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-white transition-opacity duration-300 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";
export const secondaryButton =
  "caption-1 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-ink transition-colors duration-300 hover:bg-mist disabled:opacity-40";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="caption-5 text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label
      className={`caption-5 inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 ${
        checked ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      {label}
    </label>
  );
}

/* ---------- helpers ---------- */

/** Message after a model is saved, saying whether iPhone AR is ready. */
export function savedText({ arFiles, arError }: { arFiles: number; arError: string | null }) {
  return arFiles
    ? "Saved. The product page shows this model, and iPhone AR opens it at real size."
    : `Saved. The product page shows this model. The iPhone AR file couldn't be made (${arError ?? "unknown error"}), so iPhones will convert it when AR opens.`;
}

function defaultColors(product: StudioProduct) {
  const keys = product.colors.filter((c) => colorSwatch[c].startsWith("#"));
  return (keys.length ? keys : (["white"] as ColorKey[])).map((key) => ({ key, hex: colorSwatch[key] }));
}

function defaultRecipe(product: StudioProduct): ModelRecipe {
  const colors = defaultColors(product);
  const kind: Shape["kind"] = product.category === "storage" ? "box" : product.category === "tableware" ? "dish" : "pot";
  const body = colors[0].hex;
  const palette: Palette =
    kind === "box"
      ? { Lid: "#eef1f3", Clip: "#2f3d63", Accent: "#2f3d63" }
      : { Body: body, Interior: "#d9cbb6", Handle: body, Rim: "#d8d2c9", Knob: body };
  return { shape: shapeFor(kind), palette, colors, paint: kind === "box" ? [] : ["Body", "Handle"] };
}

/** Keeps the recipe consistent: repainted parts start in the default colour, and lids get their animation. */
function normalise(r: ModelRecipe): ModelRecipe {
  const first = r.colors[0]?.hex;
  const palette = { ...r.palette };
  if (first) for (const role of r.paint) palette[role] = first;
  return { ...r, palette, lidAnimation: hasLid(r.shape.kind) ? "LidOpen" : undefined };
}

const viewerMeta = (r: ModelRecipe) => ({ colors: r.colors, paint: r.paint as string[], lidAnimation: r.lidAnimation });
const saveMeta = (m: ReturnType<typeof viewerMeta>) => ({ colors: m.colors, paint: m.paint, lidAnimation: m.lidAnimation ?? null });

/** Reads material and animation names from a .glb so the uploader can pick what to repaint and animate. */
export function inspectGlb(buf: ArrayBuffer) {
  const view = new DataView(buf);
  if (buf.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67) throw new Error("That file isn't a .glb (binary glTF).");
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLength))) as {
    materials?: { name?: string }[];
    animations?: { name?: string }[];
  };
  const names = (list?: { name?: string }[]) => [...new Set((list ?? []).map((x) => x.name).filter((n): n is string => !!n))];
  return { materials: names(json.materials), animations: names(json.animations) };
}
