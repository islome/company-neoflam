import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { StudioGate } from "@/components/studio/studio-gate";
import { NewProduct } from "@/components/studio/new-product";

export const metadata: Metadata = { title: "New product · Studio · Neoflam", robots: { index: false, follow: false } };

/** Staff tool: add a product with its photos, sizes and 3D model (with iPhone AR) in one go. */
export default function NewProductPage({ params }: PageProps<"/[lang]/studio/new">) {
  return (
    <main id="main" className="mx-auto max-w-screen-2xl px-4 pt-28 pb-24 sm:px-6 lg:px-12">
      <Suspense fallback={<p className="body-6 text-ink-soft">Loading Studio…</p>}>
        <Gate params={params} />
      </Suspense>
    </main>
  );
}

async function Gate({ params }: { params: PageProps<"/[lang]/studio/new">["params"] }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <StudioGate>
      <Form lang={lang} />
    </StudioGate>
  );
}

async function Form({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang);
  return (
    <NewProduct
      lang={lang}
      canSave={getSupabaseAdmin() !== null}
      viewerLabels={dict.detail.model}
      colorNames={dict.catalog.colors}
      categoryNames={dict.catalog.categories}
      featureNames={dict.catalog.features}
      variantTypeNames={dict.detail.variantTypes}
    />
  );
}
