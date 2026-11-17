import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getProducts } from "@/lib/products";
import { getProductModels } from "@/lib/product-models";
import { isStudioAuthed, studioEnabled } from "@/lib/studio-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { StudioApp } from "@/components/studio/studio-app";
import { StudioLogin } from "@/components/studio/studio-login";

export const metadata: Metadata = { title: "3D Studio · Neoflam", robots: { index: false, follow: false } };

/** Staff tool: build or upload a 3D model for any product, preview it, download it and publish it. */
export default function StudioPage({ params }: PageProps<"/[lang]/studio">) {
  return (
    <main id="main" className="mx-auto max-w-screen-2xl px-4 pt-28 pb-24 sm:px-6 lg:px-12">
      <Suspense fallback={<p className="body-6 text-ink-soft">Loading 3D Studio…</p>}>
        <Studio params={params} />
      </Suspense>
    </main>
  );
}

async function Studio({ params }: { params: PageProps<"/[lang]/studio">["params"] }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  if (!studioEnabled()) {
    return (
      <div className="max-w-lg">
        <h1 className="heading-4 text-ink">3D Studio is off</h1>
        <p className="body-6 mt-3 text-ink-soft">
          Set a <code>STUDIO_PASSWORD</code> environment variable (in <code>.env.local</code> and in Vercel) to switch it on.
        </p>
      </div>
    );
  }
  if (!(await isStudioAuthed())) return <StudioLogin />;

  const [products, models, dict] = await Promise.all([getProducts(), getProductModels(), getDictionary(lang)]);
  return (
    <StudioApp
      products={products.map((p) => ({ slug: p.slug, name: p.name, category: p.category, colors: p.colors, image: p.image }))}
      models={models}
      canSave={getSupabaseAdmin() !== null}
      viewerLabels={dict.detail.model}
      colorNames={dict.catalog.colors}
    />
  );
}
