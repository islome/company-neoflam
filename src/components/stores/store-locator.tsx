"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ArrowUpRight, Check, Clock, MapPin } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Store } from "@/config/site";

// Leaflet only runs in the browser; show a map shaped placeholder until it loads.
const StoreMap = dynamic(() => import("./store-map").then((m) => m.StoreMap), {
  ssr: false,
  loading: () => <div className="h-full min-h-80 w-full animate-pulse rounded-3xl bg-mist" />,
});

export const storeTitle = (s: Store, lang: Locale, t: Dictionary["stores"]) =>
  s.kind ? `${s.city[lang]} · ${t.kinds[s.kind]}` : s.city[lang];

type Props = {
  stores: Store[];
  t: Dictionary["stores"];
  lang: Locale;
  /** Controlled selection (used by the pickup picker). Omit to manage it internally. */
  value?: string;
  onChange?: (id: string) => void;
  /** Tighter cards and a radio style check, for the pickup dialog. */
  variant?: "section" | "picker";
};

/** Store list on the left, map with one pin per store on the right. Clicking either side selects the store. */
export function StoreLocator({ stores, t, lang, value, onChange, variant = "section" }: Props) {
  const [internal, setInternal] = useState(stores.find((s) => s.lat !== null)?.id ?? stores[0]?.id ?? "");
  const selected = value ?? internal;
  const select = (id: string) => (onChange ? onChange(id) : setInternal(id));
  const picker = variant === "picker";

  return (
    <div className={`grid gap-6 ${picker ? "md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]"}`}>
      <ul className="flex flex-col gap-3" role={picker ? "radiogroup" : undefined} aria-label={t.mapLabel}>
        {stores.map((store) => {
          const active = store.id === selected;
          return (
            <li key={store.id}>
              <article
                className={`rounded-3xl transition-[background-color,box-shadow] duration-300 ${
                  active
                    ? "bg-white shadow-[0_16px_48px_rgba(20,20,20,0.08)] ring-2 ring-ink"
                    : picker
                      ? "bg-white ring-1 ring-line hover:ring-ink/40"
                      : "bg-white/60 hover:bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => select(store.id)}
                  role={picker ? "radio" : undefined}
                  aria-checked={picker ? active : undefined}
                  aria-pressed={picker ? undefined : active}
                  aria-label={`${t.showOnMap}: ${storeTitle(store, lang, t)}`}
                  className={`flex w-full items-start gap-4 rounded-3xl text-left ${picker ? "p-4" : "p-5"}`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                      active ? "bg-brand text-white" : "bg-mist text-brand"
                    }`}
                  >
                    {picker && active ? <Check weight="bold" className="size-5" /> : <MapPin weight="fill" className="size-5" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="title-2 text-ink">{store.city[lang]}</span>
                      {store.kind && (
                        <span
                          className={`caption-3 rounded-full px-2 py-0.5 ${
                            store.kind === "main" ? "bg-brand text-white" : "bg-ink/10 text-ink"
                          }`}
                        >
                          {t.kinds[store.kind]}
                        </span>
                      )}
                    </span>
                    <span className="body-6 mt-1 text-ink-soft">{store.address}</span>
                    <span className="body-6 mt-2 flex items-center gap-2 text-ink">
                      <Clock weight="duotone" className="size-4 text-ink-soft" aria-label={t.hours} />
                      {store.hours}
                    </span>
                  </span>
                </button>
                {store.mapUrl && !picker && (
                  <div className="px-5 pb-5 pl-[76px]">
                    <a
                      href={store.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="caption-1 inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1 text-ink transition-colors duration-300 hover:border-ink"
                    >
                      {t.map}
                      <ArrowUpRight weight="bold" className="size-3" />
                    </a>
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ul>

      <div className={picker ? "h-72 md:h-auto md:min-h-[420px]" : "h-80 sm:h-[420px] lg:h-auto lg:min-h-[480px]"}>
        <StoreMap
          pins={stores.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: storeTitle(s, lang, t) }))}
          selected={selected}
          onSelect={select}
          label={t.mapLabel}
          focusSelected={picker && value !== undefined}
        />
      </div>
    </div>
  );
}
