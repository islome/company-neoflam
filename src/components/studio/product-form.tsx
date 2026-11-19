"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ImageSquare, Plus, Star, Trash, UploadSimple } from "@phosphor-icons/react";
import { categoryKeys, colorKeys, featureKeys, type CategoryKey, type ColorKey, type FeatureKey } from "@/data/catalog";
import { variantTypes, type Variant, type VariantType } from "@/data/variants";
import type { StudioProduct } from "@/lib/products";
import { Swatch } from "@/components/catalog/swatch";
import { createImageUpload, deleteProduct, saveProduct } from "@/app/[lang]/studio/actions";

type Props = {
  /** null for a new product. */
  product: StudioProduct | null;
  canSave: boolean;
  categoryNames: Record<CategoryKey, string>;
  colorNames: Record<ColorKey, string>;
  featureNames: Record<FeatureKey, string>;
  variantTypeNames: Record<VariantType, string>;
  /** `note` is set when a follow-up step (afterSave) reports something. */
  onSaved: (slug: string, visible: boolean, note?: Note) => void;
  /** Runs once the product row is saved (e.g. upload its 3D model). Returns a message to show. */
  afterSave?: (slug: string, step: (text: string) => void) => Promise<string | void>;
  /** Called with the chosen colours, so a 3D model section can follow them. */
  onColorsChange?: (colors: ColorKey[]) => void;
  /** Extra sections shown above the "Visible in the shop" switch. */
  children?: React.ReactNode;
  /** Called after the product is deleted (existing products only). */
  onDeleted?: (slug: string) => void;
};

export type Note = { tone: "ok" | "error"; text: string };

/** A size row as typed in the form (numbers stay strings until saving). */
type SizeRow = { type: VariantType; sizeCm: string; volumeL: string; code: string };
const toRow = (v: Variant): SizeRow => ({
  type: v.type,
  sizeCm: String(v.sizeCm),
  volumeL: v.volumeL === null ? "" : String(v.volumeL),
  code: v.code ?? "",
});

const MAX_PHOTOS = 13;
const MAX_BYTES = 10 * 1024 * 1024;

/** "Chou Chou ‘Mini’" → "chou-chou-mini" */
export const slugify = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ‘’'`ʻʼ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export function ProductForm({
  product,
  canSave,
  categoryNames,
  colorNames,
  featureNames,
  variantTypeNames,
  onSaved,
  afterSave,
  onColorsChange,
  children,
  onDeleted,
}: Props) {
  const isNew = product === null;
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState<CategoryKey>(product?.category ?? "cookware");
  const [colors, setColors] = useState<ColorKey[]>(product?.colors ?? []);
  const [features, setFeatures] = useState<FeatureKey[]>(product?.features ?? []);
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : "");
  const [tagline, setTagline] = useState(product?.tagline ?? { uz: "", ru: "", en: "" });
  const [photos, setPhotos] = useState<string[]>(product ? [product.image, ...(product.gallery ?? [])] : []);
  const [sizes, setSizes] = useState<SizeRow[]>((product?.variants ?? []).map(toRow));
  const [active, setActive] = useState(product?.active ?? true);
  const [uploading, setUploading] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Note | null>(null);
  const router = useRouter();

  useEffect(() => onColorsChange?.(colors), [colors, onColorsChange]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setMessage(null);
    const list = [...files].slice(0, MAX_PHOTOS - photos.length);
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image.`);
        if (file.size > MAX_BYTES) throw new Error(`${file.name} is over 10 MB.`);
        const ext = file.name.split(".").pop() ?? "";
        const slot = await createImageUpload(ext);
        if (!slot.ok) throw new Error(slot.error);
        const body = new FormData();
        body.append("cacheControl", "31536000");
        body.append("", file);
        const res = await fetch(slot.signedUrl, { method: "PUT", body });
        if (!res.ok) throw new Error(`Upload of ${file.name} failed (${res.status}).`);
        setPhotos((p) => [...p, slot.publicUrl]);
      } catch (e) {
        setMessage({ tone: "error", text: e instanceof Error ? e.message : "Upload failed." });
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const move = (i: number, to: number) =>
    setPhotos((p) => {
      const next = [...p];
      const [item] = next.splice(i, 1);
      next.splice(to, 0, item);
      return next;
    });

  const save = async () => {
    setBusy(true);
    setMessage(null);
    const result = await saveProduct({
      isNew,
      slug,
      name,
      category,
      colors,
      features,
      price: price.trim() === "" ? null : Number(price),
      tagline,
      photos,
      variants: sizes.map((r) => ({
        type: r.type,
        sizeCm: Number(r.sizeCm),
        volumeL: r.volumeL.trim() === "" ? null : Number(r.volumeL),
        code: r.code.trim() || null,
      })),
      active,
    });
    if (!result.ok) {
      setBusy(false);
      setMessage({ tone: "error", text: result.error });
      return;
    }
    let note: Note = {
      tone: "ok",
      text: active ? "Saved. The shop shows the changes now." : "Saved. This product is hidden from the shop.",
    };
    if (afterSave) {
      try {
        const extra = await afterSave(result.slug, (text) => setMessage({ tone: "ok", text }));
        if (extra) note = { tone: "ok", text: `${note.text} ${extra}` };
      } catch (e) {
        note = {
          tone: "error",
          text: `The product was saved, but its 3D model wasn't: ${e instanceof Error ? e.message : e}. Add the model from the product's 3D tab in the Studio.`,
        };
      }
    }
    setBusy(false);
    setMessage(note);
    onSaved(result.slug, active, note);
    router.refresh();
  };

  const remove = async () => {
    if (!product) return;
    const ok = confirm(
      `Delete ${product.name}? This removes the product from the shop and the Studio, with its photos and 3D model. It can't be undone.`,
    );
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    const result = await deleteProduct(product.slug);
    setBusy(false);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error });
      return;
    }
    onDeleted?.(product.slug);
    router.refresh();
  };

  return (
    <section aria-labelledby="product-form-title" className="max-w-3xl">
      <h2 id="product-form-title" className="title-3 text-ink">
        {isNew ? "New product" : name || product.name}
      </h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Name">
          <input
            value={name}
            maxLength={80}
            onChange={(e) => {
              setName(e.target.value);
              if (isNew && !slugTouched) setSlug(slugify(e.target.value));
            }}
            className={inputClass}
          />
        </Field>
        <Field label={isNew ? "Web address" : "Web address (can't change)"}>
          <div className="flex items-center rounded-lg border border-line bg-white pl-3">
            <span className="caption-5 shrink-0 text-ink-soft">/products/</span>
            <input
              value={slug}
              readOnly={!isNew}
              maxLength={80}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className={`body-6 w-full min-w-0 rounded-lg bg-transparent py-2 pr-3 text-ink ${isNew ? "" : "text-ink-soft"}`}
            />
          </div>
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as CategoryKey)} className={inputClass}>
            {categoryKeys.map((c) => (
              <option key={c} value={c}>
                {categoryNames[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (UZS, empty = “price coming soon”)">
          <input
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset className="mt-5">
        <legend className="caption-5 text-ink-soft">Colours</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {colorKeys.map((c) => {
            const on = colors.includes(c);
            return (
              <label
                key={c}
                className={`caption-5 inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 ${
                  on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => setColors((list) => (e.target.checked ? [...list, c] : list.filter((x) => x !== c)))}
                  className="sr-only"
                />
                <Swatch color={c} className="size-3.5" />
                {colorNames[c]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="caption-5 text-ink-soft">Feature tags (shown under the price)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {featureKeys.map((f) => {
            const on = features.includes(f);
            return (
              <label
                key={f}
                className={`caption-5 inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 ${
                  on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => setFeatures((list) => (e.target.checked ? [...list, f] : list.filter((x) => x !== f)))}
                  className="sr-only"
                />
                {featureNames[f]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5 grid gap-3">
        <legend className="caption-5 mb-1 text-ink-soft">Short tagline</legend>
        {(["uz", "ru", "en"] as const).map((l) => (
          <label key={l} className="flex items-start gap-2">
            <span className="caption-1 w-8 shrink-0 pt-2 text-ink uppercase">{l}</span>
            <textarea
              value={tagline[l]}
              maxLength={300}
              rows={2}
              onChange={(e) => setTagline((t) => ({ ...t, [l]: e.target.value }))}
              className={`${inputClass} resize-y`}
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="mt-5">
        <legend className="caption-5 text-ink-soft">Photos (the first one is the main photo in the shop)</legend>
        <ul className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {photos.map((src, i) => (
            <li key={src} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-mist">
                <Image src={src} alt={`Photo ${i + 1}`} fill unoptimized className="object-cover" />
                {i === 0 && (
                  <span className="caption-5 absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-ink">
                    <Star weight="fill" className="size-3 text-brand" /> Main
                  </span>
                )}
              </div>
              <div className="mt-1 flex justify-between">
                <IconButton label="Move left" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ArrowLeft className="size-3.5" />
                </IconButton>
                <IconButton label="Make main photo" disabled={i === 0} onClick={() => move(i, 0)}>
                  <Star className="size-3.5" />
                </IconButton>
                <IconButton label="Remove photo" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}>
                  <Trash className="size-3.5" />
                </IconButton>
                <IconButton label="Move right" disabled={i === photos.length - 1} onClick={() => move(i, i + 1)}>
                  <ArrowRight className="size-3.5" />
                </IconButton>
              </div>
            </li>
          ))}
          {photos.length < MAX_PHOTOS && (
            <li>
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink/30 p-2 text-center hover:bg-mist/60">
                {uploading ? <ImageSquare className="size-5 animate-pulse text-ink" /> : <UploadSimple weight="bold" className="size-5 text-ink" />}
                <span className="caption-5 text-ink">{uploading ? `Uploading ${uploading}…` : "Add photos"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={!canSave}
                  className="sr-only"
                  onChange={(e) => {
                    upload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </li>
          )}
        </ul>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="caption-5 text-ink-soft">Sizes in this collection (shown as size buttons on the product page)</legend>
        {sizes.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {sizes.map((row, i) => {
              const set = (patch: Partial<SizeRow>) => setSizes((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
              return (
                <li key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
                  <select
                    value={row.type}
                    onChange={(e) => set({ type: e.target.value as VariantType })}
                    aria-label={`Size ${i + 1} type`}
                    className={inputClass}
                  >
                    {variantTypes.map((t) => (
                      <option key={t} value={t}>
                        {variantTypeNames[t]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    step={0.5}
                    inputMode="decimal"
                    placeholder="Size, cm"
                    aria-label={`Size ${i + 1} in cm`}
                    value={row.sizeCm}
                    onChange={(e) => set({ sizeCm: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    inputMode="decimal"
                    placeholder="Volume, L"
                    aria-label={`Size ${i + 1} volume in litres (optional)`}
                    value={row.volumeL}
                    onChange={(e) => set({ volumeL: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    placeholder="Code (optional)"
                    maxLength={40}
                    aria-label={`Size ${i + 1} model code (optional)`}
                    value={row.code}
                    onChange={(e) => set({ code: e.target.value })}
                    className={inputClass}
                  />
                  <IconButton label={`Remove size ${i + 1}`} onClick={() => setSizes((list) => list.filter((_, j) => j !== i))}>
                    <Trash className="size-4" />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        )}
        {sizes.length < 30 && (
          <button
            type="button"
            onClick={() =>
              setSizes((list) => [...list, { type: list.at(-1)?.type ?? variantTypes[0], sizeCm: "", volumeL: "", code: "" }])
            }
            className="caption-1 mt-2 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-ink hover:bg-mist"
          >
            <Plus weight="bold" className="size-3.5" /> Add size
          </button>
        )}
      </fieldset>

      {children}

      <label className="mt-5 inline-flex cursor-pointer items-center gap-3">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-[#141414]" />
        <span className="caption-1 text-ink">Visible in the shop</span>
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={!canSave || busy || uploading > 0} className={primaryButton}>
          {busy ? "Saving…" : isNew ? "Create product" : "Save changes"}
        </button>
        {!isNew && canSave && (
          <button
            type="button"
            onClick={remove}
            disabled={busy || uploading > 0}
            className="caption-1 inline-flex items-center gap-2 rounded-full border border-brand/40 px-5 py-2.5 text-brand transition-colors duration-300 hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto"
          >
            <Trash weight="bold" className="size-4" /> Delete product
          </button>
        )}
        {!canSave && <p className="caption-5 text-ink-soft">Connect Supabase to add or edit products.</p>}
      </div>
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={`caption-1 mt-3 ${message.tone === "error" ? "text-brand" : "text-[#1f6b3a]"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}

const inputClass = "body-6 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink";
const primaryButton =
  "caption-1 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-white transition-opacity duration-300 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="caption-5 text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-full p-1.5 text-ink-soft hover:bg-mist hover:text-ink disabled:opacity-25"
    >
      {children}
    </button>
  );
}
