import {
  categoryKeys,
  colorKeys,
  priceRanges,
  type CategoryKey,
  type ColorKey,
  type PriceKey,
  type Product,
} from "@/data/catalog";

export const sortKeys = ["featured", "newest", "price-desc", "price-asc"] as const;
export type SortKey = (typeof sortKeys)[number];

export type Filters = {
  category: CategoryKey | null;
  colors: ColorKey[];
  prices: PriceKey[];
  sort: SortKey;
};

export const emptyFilters: Filters = { category: null, colors: [], prices: [], sort: "featured" };

const list = <T extends string>(raw: string | null, allowed: readonly T[]) =>
  (raw ?? "").split(",").filter((v): v is T => (allowed as readonly string[]).includes(v));

/** Reads filters from the URL. Unknown values are ignored. */
export function parseFilters(params: URLSearchParams): Filters {
  const category = params.get("category");
  const sort = params.get("sort");
  return {
    category: category && (categoryKeys as readonly string[]).includes(category) ? (category as CategoryKey) : null,
    colors: list(params.get("color"), colorKeys),
    prices: list(params.get("price"), priceRanges.map((p) => p.key)),
    sort: sort && (sortKeys as readonly string[]).includes(sort) ? (sort as SortKey) : "featured",
  };
}

export function serializeFilters(f: Filters): string {
  const p = new URLSearchParams();
  if (f.category) p.set("category", f.category);
  if (f.colors.length) p.set("color", f.colors.join(","));
  if (f.prices.length) p.set("price", f.prices.join(","));
  if (f.sort !== "featured") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const activeCount = (f: Filters) =>
  (f.category ? 1 : 0) + f.colors.length + f.prices.length;

const inPrice = (price: number | null, keys: PriceKey[]) =>
  price !== null &&
  keys.some((k) => {
    const r = priceRanges.find((x) => x.key === k)!;
    return price >= r.min && price < r.max;
  });

/** Filters ignoring one group, used to count options inside that group. */
function matches(p: Product, f: Filters, skip?: "category" | "colors" | "prices") {
  if (skip !== "category" && f.category && p.category !== f.category) return false;
  if (skip !== "colors" && f.colors.length && !p.colors.some((c) => f.colors.includes(c))) return false;
  if (skip !== "prices" && f.prices.length && !inPrice(p.price, f.prices)) return false;
  return true;
}

export function applyFilters(products: Product[], f: Filters): Product[] {
  const out = products.filter((p) => matches(p, f));
  const byPrice = (dir: 1 | -1) => (a: Product, b: Product) => {
    // Products without a confirmed price always go last.
    if (a.price === null || b.price === null) {
      if (a.price === b.price) return a.rank - b.rank;
      return a.price === null ? 1 : -1;
    }
    return (a.price - b.price) * dir || a.rank - b.rank;
  };
  switch (f.sort) {
    case "newest":
      return out.sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.rank - b.rank);
    case "price-asc":
      return out.sort(byPrice(1));
    case "price-desc":
      return out.sort(byPrice(-1));
    default:
      return out.sort((a, b) => a.rank - b.rank);
  }
}

/** How many products each option would show, given the other active filters. */
export function facetCounts(products: Product[], f: Filters) {
  const count = <K extends string>(keys: readonly K[], group: "category" | "colors" | "prices", has: (p: Product, k: K) => boolean) =>
    Object.fromEntries(
      keys.map((k) => [k, products.filter((p) => matches(p, f, group) && has(p, k)).length]),
    ) as Record<K, number>;

  return {
    category: count(categoryKeys, "category", (p, k) => p.category === k),
    colors: count(colorKeys, "colors", (p, k) => p.colors.includes(k)),
    prices: count(priceRanges.map((r) => r.key), "prices", (p, k) => inPrice(p.price, [k])),
    total: products.filter((p) => matches(p, f, "category")).length,
  };
}
