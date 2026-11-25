# Neoflam Uzbekistan

Website for the Neoflam Uzbekistan branch.
Reference design: [neoflam.com/en](https://neoflam.com/en/).

**Stack:** Next.js 16 (App Router, API routes) · Tailwind CSS 4 · Motion · Supabase · Vercel.
Languages: Uzbek (default), Russian, English at `/uz`, `/ru`, `/en`.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```

Without Supabase keys the store list comes from `src/config/site.ts`.

## Where things live

Vercel only depends on the root config (`package.json`, `next.config.ts`, `tsconfig.json`), `src/app/`, `src/proxy.ts` and `public/`. Everything else is organized by feature and imported through the `@/` alias (`@/*` → `src/*`).

```
src/
├── app/                    Routes (Next.js App Router). Do not rename: URLs come from these folders
│   ├── [lang]/             /uz /ru /en pages: home, products, products/[slug], bag, favorites, account, studio
│   └── api/stores/         GET /api/stores
├── proxy.ts                Language redirect (Next.js proxy, must stay at src/ root)
├── components/
│   ├── layout/             Site header, footer, mini bar, logo
│   ├── home/               Home page sections: hero, tagline, products, popular products, brand film, collections, stores
│   ├── catalog/            Product catalog: filters, grid, product card, colour swatch
│   ├── product/            Product detail page: gallery, 3D viewer, purchase box, related
│   ├── shop/               Bag, favorites, account, pickup picker, bag toast
│   ├── stores/             Store locator and map
│   ├── studio/             Staff Studio: login, product form, 3D model tools
│   └── ui/                 Shared building blocks: reveal animation, product image, looping carousel
├── config/                 Site settings: contacts, stores fallback, media URLs, home categories
├── data/                   Built-in product data: catalog, gallery, variants, 3D model recipes
├── i18n/                   Languages and UZ / RU / EN dictionaries (all copy)
├── lib/
│   ├── catalog/            Product loading (Supabase + fallback), filters, variant labels
│   ├── studio/             Studio auth, 3D model building, USDZ export
│   ├── supabase/           Supabase server client
│   ├── shop-store.ts       Bag and favorites state (browser)
│   └── stores.ts           Store list loading
└── types/                  Extra TypeScript declarations
public/images/              Hero and product photos
supabase/migrations/        SQL for the database tables and buckets
.claude/skills/             Design skills (`landing-page-design`, `figma-designer`)
```

Key files to edit:

| File | What |
|---|---|
| `src/config/site.ts` | Store locations (fallback), branch contacts, media URLs. Replace every `{{placeholder}}` before launch |
| `src/config/products.ts` | Home page product categories and photos |
| `src/data/catalog.ts` | Product collections (fallback when Supabase is empty). Prices are `null` until confirmed |
| `src/data/gallery.ts`, `src/data/variants.ts` | Detail photos per collection, and lineup sizes/codes |
| `src/i18n/dictionaries/*.ts` | All copy in UZ / RU / EN |

## Supabase

1. Create a project, then run the SQL in `supabase/migrations/` (SQL editor or `supabase db push`). Edit store rows in the table editor; the site picks them up within an hour.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and in Vercel.

## Studio: products and 3D models

**Products** live in the Supabase `products` table (the 18 built-in ones were copied there; `src/data/catalog.ts` is now only a fallback if Supabase is unreachable). Add, edit, re-order photos for, or hide a product in the **Studio** at `/en/studio` → **New product** / **Details**. Photos upload to the `product-images` bucket. Saving updates the shop immediately.

### 3D models

Product pages have a "3D" tab (rotate, colours, lid, AR) when a product has a model.

- **Built-in models** are size-and-colour recipes in `src/data/models.ts`, built in the browser by `src/lib/studio/model-builder.ts`.
- **Studio → 3D model tab** (staff only) shows every product's 3D status. Build a model from a recipe with a live preview, or upload a `.glb` made in Tripo, Meshy or a scanning app, then **Download** it or **Save to product**. A saved model overrides the built-in one and shows on the product page straight away.
- **Setup:** set `STUDIO_PASSWORD` (without it the Studio is off), apply the SQL in `supabase/migrations/` (tables `products`, `product_models`; public buckets `models`, `product-images`), and set the Supabase keys. Without Supabase the Studio still previews and downloads, but can't save.

## Higgsfield AI hero video

The hero shows the FIKA product photo (`public/images/hero/fika-set.webp`). To use a Higgsfield AI clip instead, upload the exported mp4/webm (for example to Supabase Storage) and set `NEXT_PUBLIC_HERO_VIDEO_URL`.

## Deploy

Push to GitHub, import the repo in Vercel, add the env vars, deploy.

## Before launch

- Fill the `{{placeholders}}` in `src/config/site.ts`.
- Replace the text wordmark in `src/components/layout/logo.tsx` with the official SVG logo.
- The brand film cover is loaded from neoflam.com (`src/config/site.ts` → `media`). Move it to `/public` or Supabase Storage.
- "Popular products" on the home page follow the Studio sort order until real sales data exists.
- Collections (`src/config/collections.ts`, photos in `public/images/collections/`) are static placeholders until the Supabase `collections` table exists.
