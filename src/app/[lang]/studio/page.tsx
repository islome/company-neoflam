import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStudioProducts } from "@/lib/catalog/products";
import { getProductModels } from "@/lib/catalog/product-models";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { StudioApp } from "@/components/studio/studio-app";
import { StudioGate } from "@/components/studio/studio-gate";

export const metadata: Metadata = { title: "Studio · Neoflam", robots: { index: false, follow: false } };

/** Staff tool: add and edit products, and build or upload their 3D models. */
export default function StudioPage({ params }: PageProps<"/[lang]/studio">) {
  return (
    <main id="main" className="mx-auto max-w-screen-2xl px-4 pt-28 pb-24 sm:px-6 lg:px-12">
      <Suspense fallback={<p className="body-6 text-ink-soft">Loading Studio…</p>}>
        <Studio params={params} />
      </Suspense>
    </main>
  );
}

async function Studio({ params }: { params: PageProps<"/[lang]/studio">["params"] }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <StudioGate>
      <StudioHome lang={lang} />
    </StudioGate>
  );
}

async function StudioHome({ lang }: { lang: Locale }) {
  const [products, models, dict] = await Promise.all([getStudioProducts(), getProductModels(), getDictionary(lang)]);
  return (
    <StudioApp
      products={products}
      models={models}
      canSave={getSupabaseAdmin() !== null}
      viewerLabels={dict.detail.model}
      colorNames={dict.catalog.colors}
      categoryNames={dict.catalog.categories}
      featureNames={dict.catalog.features}
      variantTypeNames={dict.detail.variantTypes}
    />
  );
}
