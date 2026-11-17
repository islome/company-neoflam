"use client";

import { useState, type ReactNode } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";
import { categoryKeys, colorKeys, priceRanges, type ColorKey, type PriceKey } from "@/data/catalog";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Filters, facetCounts } from "@/lib/catalog-filters";
import { Swatch } from "./swatch";

type Props = {
  t: Dictionary["catalog"];
  filters: Filters;
  counts: ReturnType<typeof facetCounts>;
  hasPrices: boolean;
  onChange: (next: Filters) => void;
};

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Category list plus collapsible colour and price groups. Shared by sidebar and mobile sheet. */
export function FilterGroups({ t, filters, counts, hasPrices, onChange }: Props) {
  return (
    <div className="flex flex-col">
      <ul className="flex flex-col gap-1 pb-6">
        <CategoryItem
          label={t.all}
          count={counts.total}
          active={!filters.category}
          onClick={() => onChange({ ...filters, category: null })}
        />
        {categoryKeys.map((c) => (
          <CategoryItem
            key={c}
            label={t.categories[c]}
            count={counts.category[c]}
            active={filters.category === c}
            onClick={() => onChange({ ...filters, category: c })}
          />
        ))}
      </ul>

      <Group title={t.groups.color} selected={filters.colors.length}>
        <ul className="grid grid-cols-3 gap-x-2 gap-y-4">
          {colorKeys.map((c: ColorKey) => {
            const on = filters.colors.includes(c);
            const disabled = !on && counts.colors[c] === 0;
            return (
              <li key={c}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  disabled={disabled}
                  onClick={() => onChange({ ...filters, colors: toggle(filters.colors, c) })}
                  className="group flex w-full flex-col items-center gap-2 rounded-lg py-1 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span className="relative">
                    <Swatch
                      color={c}
                      className={`size-7 transition-transform duration-300 group-hover:scale-110 group-active:scale-[0.98] ${on ? "ring-2 ring-ink ring-offset-2" : ""}`}
                    />
                    {on && (
                      <Check
                        weight="bold"
                        className={`absolute inset-0 m-auto size-4 ${c === "black" || c === "red" ? "text-white" : "text-ink"}`}
                      />
                    )}
                  </span>
                  <span className="caption-5 text-center text-ink">{t.colors[c]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Group>

      {hasPrices && (
        <Group title={t.groups.price} selected={filters.prices.length}>
          <ul className="flex flex-col gap-3">
            {priceRanges.map(({ key }: { key: PriceKey }) => {
              const on = filters.prices.includes(key);
              return (
                <li key={key}>
                  <label className="body-6 flex cursor-pointer items-center gap-3 text-ink has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-30">
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!on && counts.prices[key] === 0}
                      onChange={() => onChange({ ...filters, prices: toggle(filters.prices, key) })}
                      className="size-5 rounded-md accent-ink"
                    />
                    {t.prices[key]}
                  </label>
                </li>
              );
            })}
          </ul>
        </Group>
      )}
    </div>
  );
}

function CategoryItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`flex w-full items-center justify-between rounded-lg py-1 text-left transition-colors duration-300 ${
          active ? "title-3 text-ink" : "body-3 text-ink-soft hover:text-ink"
        }`}
      >
        {label}
        <span className="caption-5 text-ink-soft">{count}</span>
      </button>
    </li>
  );
}

function Group({ title, selected, children }: { title: string; selected: number; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-line py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="title-3 flex w-full items-center justify-between rounded-lg py-1 text-ink"
      >
        <span>
          {title}
          {selected > 0 && <span className="text-ink-soft"> ({selected})</span>}
        </span>
        <CaretDown weight="bold" className={`size-4 transition-transform duration-500 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pt-4">{children}</div>}
    </div>
  );
}
