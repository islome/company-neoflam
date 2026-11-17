"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretDown, Check, FunnelSimple, MagnifyingGlass, SlidersHorizontal, X } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Product } from "@/data/catalog";
import {
  activeCount,
  applyFilters,
  emptyFilters,
  facetCounts,
  parseFilters,
  serializeFilters,
  sortKeys,
  type Filters,
  type SortKey,
} from "@/lib/catalog-filters";
import { FilterGroups } from "./filter-groups";
import { ProductCard } from "./product-card";
import promoImage from "../../../public/images/products/pans-flatlay-square.jpg";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = { products: Product[]; t: Dictionary["catalog"]; lang: Locale };

/** Reads filters from the URL and keeps the URL in sync, so filtered views can be shared. */
export function Catalog(props: Props) {
  const params = useSearchParams();
  const pathname = usePathname();
  const filters = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const onChange = (next: Filters) => {
    window.history.pushState(null, "", pathname + serializeFilters(next));
  };
  return <CatalogView {...props} filters={filters} onChange={onChange} />;
}

export function CatalogView({
  products,
  t,
  lang,
  filters = emptyFilters,
  onChange,
}: Props & { filters?: Filters; onChange?: (f: Filters) => void }) {
  const [showFilters, setShowFilters] = useState(true);
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // The bar is "stuck" once the marker just above it scrolls out of view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const reduce = useReducedMotion();
  const change = (f: Filters) => onChange?.(f);

  const hasPrices = products.some((p) => p.price !== null);
  const sorts = sortKeys;
  const visible = useMemo(() => applyFilters([...products], filters), [products, filters]);
  const counts = useMemo(() => facetCounts(products, filters), [products, filters]);
  const nActive = activeCount(filters);
  const showPromo = nActive === 0 && filters.sort === "featured";
  const heading = filters.category ? t.categories[filters.category] : t.all;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-12">
      {/* Toolbar */}
      <div ref={sentinel} aria-hidden className="h-px" />
      <div
        className={`sticky top-0 z-30 -mx-4 flex items-center justify-between gap-4 bg-white/90 px-4 backdrop-blur-xl transition-[padding,box-shadow] duration-500 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12 ${
          stuck ? "py-2 shadow-[0_1px_0_var(--color-line)]" : "py-4"
        }`}
      >
        <h1
          className={`heading-5 origin-left text-ink transition-transform duration-500 ${stuck ? "scale-[0.85]" : ""}`}
        >
          {heading} <span className="text-ink-soft">({visible.length})</span>
        </h1>

        <div className="hidden items-center gap-6 lg:flex">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="catalog-filters"
            className="title-3 inline-flex items-center gap-2 rounded-full py-2 text-ink transition-opacity duration-300 hover:opacity-70"
          >
            {showFilters ? t.hideFilters : t.showFilters}
            <SlidersHorizontal weight="bold" className="size-5" />
          </button>
          <SortMenu t={t} value={filters.sort} options={sorts} onSelect={(sort) => change({ ...filters, sort })} />
        </div>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="button-sm inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-ink transition-colors duration-300 hover:border-ink/40 active:scale-[0.98] lg:hidden"
        >
          <FunnelSimple weight="bold" className="size-4" />
          {t.filter}
          {nActive > 0 && (
            <span className="caption-3 flex size-5 items-center justify-center rounded-full bg-brand text-white">
              {nActive}
            </span>
          )}
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {t.results.replace("{n}", String(visible.length))}
      </p>

      <div className="flex pt-4 pb-24">
        {/* Sidebar: always mounted so its width can ease open and closed, letting the grid grow smoothly. */}
        <div
          inert={!showFilters}
          className={`hidden shrink-0 overflow-clip transition-[width,margin,opacity] duration-500 lg:block ${
            showFilters ? "mr-12 w-60 opacity-100" : "mr-0 w-0 opacity-0"
          }`}
        >
          <aside
            id="catalog-filters"
            aria-label={t.filter}
            className="sticky top-20 max-h-[calc(100svh-6rem)] w-60 overflow-y-auto pr-2"
          >
            <FilterGroups t={t} filters={filters} counts={counts} hasPrices={hasPrices} onChange={change} />
          </aside>
        </div>

        <div className="min-w-0 flex-1">
          {nActive > 0 && <ActiveChips t={t} filters={filters} onChange={change} />}

          {visible.length === 0 ? (
            <EmptyState t={t} onClear={() => change({ ...emptyFilters, sort: filters.sort })} />
          ) : (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-12 lg:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.flatMap((p, i) => {
                  const card = (
                    <motion.li
                      key={p.slug}
                      layout={!reduce}
                      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                    >
                      <ProductCard product={p} t={t} lang={lang} preload={i < 3} />
                    </motion.li>
                  );
                  return showPromo && i === 6 ? [<Promo key="promo" t={t} lang={lang} />, card] : [card];
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        t={t}
        filters={filters}
        products={products}
        hasPrices={hasPrices}
        sorts={sorts}
        onApply={(f) => {
          change(f);
          setSheetOpen(false);
        }}
      />
    </div>
  );
}

function SortMenu({
  t,
  value,
  options,
  onSelect,
}: {
  t: Dictionary["catalog"];
  value: SortKey;
  options: readonly SortKey[];
  onSelect: (s: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="title-3 inline-flex items-center gap-2 rounded-full py-2 text-ink transition-opacity duration-300 hover:opacity-70"
      >
        <span>
          {t.sortBy}
          {value !== "featured" && <span className="text-ink-soft">: {t.sort[value]}</span>}
        </span>
        <CaretDown weight="bold" className={`size-4 transition-transform duration-500 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="absolute top-full right-0 mt-2 w-56 rounded-2xl border border-line bg-white p-2 shadow-[0_16px_48px_rgba(20,20,20,0.12)]"
          >
            {options.map((s) => (
              <li key={s} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={value === s}
                  onClick={() => {
                    onSelect(s);
                    setOpen(false);
                  }}
                  className="body-6 flex w-full items-center justify-between rounded-xl px-3 py-2 text-right text-ink transition-colors duration-300 hover:bg-cream"
                >
                  {t.sort[s]}
                  {value === s && <Check weight="bold" className="size-4" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveChips({
  t,
  filters,
  onChange,
}: {
  t: Dictionary["catalog"];
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const chips = [
    ...(filters.category
      ? [{ key: `cat`, label: t.categories[filters.category], remove: () => onChange({ ...filters, category: null }) }]
      : []),
    ...filters.colors.map((c) => ({
      key: `c-${c}`,
      label: t.colors[c],
      remove: () => onChange({ ...filters, colors: filters.colors.filter((x) => x !== c) }),
    })),
    ...filters.prices.map((p) => ({
      key: `p-${p}`,
      label: t.prices[p],
      remove: () => onChange({ ...filters, prices: filters.prices.filter((x) => x !== p) }),
    })),
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.remove}
          aria-label={`${t.removeFilter}: ${c.label}`}
          className="caption-1 inline-flex items-center gap-2 rounded-full bg-cream py-2 pr-3 pl-4 text-ink transition-colors duration-300 hover:bg-line active:scale-[0.98]"
        >
          {c.label}
          <X weight="bold" className="size-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...emptyFilters, sort: filters.sort })}
        className="caption-1 rounded-full px-3 py-2 text-ink underline underline-offset-4 transition-opacity duration-300 hover:opacity-70"
      >
        {t.clearAll}
      </button>
    </div>
  );
}

function Promo({ t, lang }: { t: Dictionary["catalog"]; lang: Locale }) {
  return (
    <motion.li
      layout
      key="promo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="col-span-2"
    >
      <Link
        href={`/${lang}/products/retro`}
        className="group relative flex aspect-square overflow-hidden bg-mist sm:aspect-[2/1]"
      >
        <Image
          src={promoImage}
          alt={t.promo.alt}
          fill
          placeholder="blur"
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/30" />
        <div className="relative mt-auto flex flex-col items-start gap-2 p-6 text-white sm:p-8">
          <p className="caption-3 text-white/80">{t.promo.eyebrow}</p>
          <p className="heading-3 sm:heading-2">{t.promo.title}</p>
          <p className="body-3 max-w-sm text-white/90">{t.promo.body}</p>
          <span className="button-sm mt-2 inline-flex rounded-full bg-white px-4 py-2 text-ink transition-transform duration-300 group-hover:scale-[1.03]">
            {t.promo.cta}
          </span>
        </div>
      </Link>
    </motion.li>
  );
}

function EmptyState({ t, onClear }: { t: Dictionary["catalog"]; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-cream px-6 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-white text-ink-soft">
        <MagnifyingGlass weight="bold" className="size-5" />
      </span>
      <h2 className="heading-6 text-ink">{t.empty.title}</h2>
      <p className="body-3 max-w-sm text-ink-soft">{t.empty.body}</p>
      <button
        type="button"
        onClick={onClear}
        className="button-sm mt-2 rounded-full bg-ink px-4 py-2 text-white transition-transform duration-300 active:scale-[0.98]"
      >
        {t.empty.cta}
      </button>
    </div>
  );
}

function MobileSheet(props: {
  open: boolean;
  onClose: () => void;
  t: Dictionary["catalog"];
  filters: Filters;
  products: Product[];
  hasPrices: boolean;
  sorts: readonly SortKey[];
  onApply: (f: Filters) => void;
}) {
  // Mounting the body only while open lets each opening start from the applied filters.
  return <AnimatePresence>{props.open && <SheetBody {...props} />}</AnimatePresence>;
}

function SheetBody({ onClose, t, filters, products, hasPrices, sorts, onApply }: Parameters<typeof MobileSheet>[0]) {
  const [draft, setDraft] = useState(filters);
  const reduce = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const counts = facetCounts(products, draft);
  const resultCount = applyFilters([...products], draft).length;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={t.filter}
      initial={reduce ? { opacity: 0 } : { y: "100%" }}
      animate={reduce ? { opacity: 1 } : { y: 0 }}
      exit={reduce ? { opacity: 0 } : { y: "100%" }}
      transition={{ duration: 0.5, ease: EASE }}
      className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-4">
        <p className="heading-6 text-ink">{t.filter}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="flex size-10 items-center justify-center rounded-full bg-cream text-ink active:scale-[0.98]"
        >
          <X weight="bold" className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <fieldset className="pb-6">
          <legend className="title-3 pb-4 text-ink">{t.sortBy}</legend>
          <div className="flex flex-col gap-3">
            {sorts.map((s) => (
              <label key={s} className="body-3 flex cursor-pointer items-center gap-3 text-ink">
                <input
                  type="radio"
                  name="sort"
                  checked={draft.sort === s}
                  onChange={() => setDraft({ ...draft, sort: s })}
                  className="size-5 accent-ink"
                />
                {t.sort[s]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="border-t border-line pt-6">
          <FilterGroups t={t} filters={draft} counts={counts} hasPrices={hasPrices} onChange={setDraft} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
        <button
          type="button"
          onClick={() => setDraft({ ...emptyFilters, sort: draft.sort })}
          className="button-md rounded-full border border-ink/15 px-4 py-3 text-ink active:scale-[0.98]"
        >
          {t.clear}
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="button-md rounded-full bg-ink px-4 py-3 text-white active:scale-[0.98]"
        >
          {t.apply.replace("{n}", String(resultCount))}
        </button>
      </div>
    </motion.div>
  );
}
