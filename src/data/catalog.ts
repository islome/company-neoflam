/**
 * Product types and the fixed option lists (categories, colours, feature tags, price ranges).
 * The products themselves are added in the Studio (/[lang]/studio/new) and live in Supabase.
 * A null price shows "price coming soon".
 */
import type { Locale } from "@/i18n/config";
import type { Variant } from "./variants";

export const categoryKeys = ["cookware", "storage", "tableware", "gadget"] as const;
export type CategoryKey = (typeof categoryKeys)[number];

export const colorKeys = ["cream", "white", "yellow", "pink", "red", "black", "clear", "multi"] as const;
export type ColorKey = (typeof colorKeys)[number];

/** Product feature tags shown under the price (labels live in the dictionaries under catalog.features). */
export const featureKeys = [
  "pfasFree",
  "ceramic",
  "induction",
  "ovenSafe",
  "dishwasher",
  "microwave",
  "woodHandle",
  "glassLid",
  "airtight",
] as const;
export type FeatureKey = (typeof featureKeys)[number];

/** Swatch fill for each colour filter. `clear` and `multi` get special swatches. */
export const colorSwatch: Record<ColorKey, string> = {
  cream: "#ede3d1",
  white: "#ffffff",
  yellow: "#f2cf5b",
  pink: "#e9b8b0",
  red: "#b3261e",
  black: "#1a1a1a",
  clear: "transparent",
  multi: "conic",
};

/** Price buckets in UZS. Shown only once products carry prices. */
export const priceRanges = [
  { key: "0-300", min: 0, max: 300_000 },
  { key: "300-600", min: 300_000, max: 600_000 },
  { key: "600-1000", min: 600_000, max: 1_000_000 },
  { key: "1000+", min: 1_000_000, max: Infinity },
] as const;
export type PriceKey = (typeof priceRanges)[number]["key"];

export type Product = {
  slug: string;
  name: string;
  category: CategoryKey;
  colors: ColorKey[];
  /** Price in UZS. null until confirmed. */
  price: number | null;
  image: string;
  tagline: Record<Locale, string>;
  /** Lower comes first in the "featured" sort. */
  rank: number;
  /** Date the collection was added to the catalog (YYYY-MM-DD). Drives the "newest" sort. */
  addedAt: string;
  /** Extra photos for the detail page gallery (uploaded in the Studio). */
  gallery?: string[];
  /** Feature tags shown under the price. */
  features?: FeatureKey[];
  /** Sizes in the collection, shown as size buttons on the product page. */
  variants?: Variant[];
};
