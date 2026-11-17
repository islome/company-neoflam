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

| Path | What |
|---|---|
| `src/app/[lang]/page.tsx` | Home page, composed from sections in `src/components` |
| `src/app/[lang]/products/page.tsx` | Product catalog (Nike style filters, sort, URL synced) |
| `src/data/catalog.ts` | Product collections (fallback when Supabase is empty). Prices are `null` until confirmed |
| `src/app/[lang]/products/[slug]/page.tsx` | Product detail page (Nike launch style) |
| `src/data/gallery.ts`, `src/data/variants.ts` | Detail photos per collection, and lineup sizes/codes (Retro so far) |
| `src/components/catalog/` | Catalog UI: toolbar, sidebar filters, grid, mobile filter sheet |
| `src/config/products.ts` + `public/images/products/` | Product categories and photos |
| `src/i18n/dictionaries/*.ts` | All copy in UZ / RU / EN |
| `src/config/site.ts` | Store locations (fallback), branch contacts, media URLs. Replace every `{{placeholder}}` before launch |
| `src/app/api/stores/route.ts` | `GET /api/stores`: store locations as JSON |
| `supabase/migrations/` | SQL for the `stores` and `products` tables |
| `.claude/skills/` | Design skills (`landing-page-design`, `figma-designer`) |

## Supabase

1. Create a project, then run the SQL in `supabase/migrations/` (SQL editor or `supabase db push`). Edit store rows in the table editor; the site picks them up within an hour.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and in Vercel.

## Higgsfield AI hero video

The hero shows a coded kinetic "HEALTHY" animation. To use a Higgsfield AI clip instead, upload the exported mp4/webm (for example to Supabase Storage) and set `NEXT_PUBLIC_HERO_VIDEO_URL`.

## Deploy

Push to GitHub, import the repo in Vercel, add the env vars, deploy.

## Before launch

- Fill the `{{placeholders}}` in `src/config/site.ts`.
- Replace the text wordmark in `src/components/logo.tsx` with the official SVG logo.
- Brand and news images are loaded from neoflam.com. Move them to `/public` or Supabase Storage.
