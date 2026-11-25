"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, MapPin } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Store } from "@/config/site";

// Leaflet only runs in the browser; show a map shaped placeholder until it loads.
const StoreMap = dynamic(() => import("./store-map").then((m) => m.StoreMap), {
  ssr: false,
  loading: () => <div className="h-full min-h-80 w-full animate-pulse rounded-3xl bg-ink-soft/20" />,
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
  /** "dark" for black backgrounds: dark cards and a dark map; the selected card flips to white. */
  tone?: "light" | "dark";
};

/** Text put on the clipboard: address, city and a map link people can paste into a taxi or maps app. */
function locationText(s: Store, lang: Locale, t: Dictionary["stores"]) {
  const line = [s.address || t.noAddress, s.city[lang]].join(", ");
  const link = s.mapUrl ?? (s.lat !== null && s.lng !== null ? `https://yandex.uz/maps/?pt=${s.lng},${s.lat}&z=17&l=map` : null);
  return link ? `${line}\n${link}` : line;
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-HTTPS previews: fall back to a hidden textarea.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/**
 * Store list on the left, map with one pin per store on the right. Clicking either side selects the store.
 * In the home section the list is as tall as the map and scrolls on its own when there are more stores.
 */
export function StoreLocator({ stores, t, lang, value, onChange, variant = "section", tone = "light" }: Props) {
  const [internal, setInternal] = useState(stores.find((s) => s.lat !== null)?.id ?? stores[0]?.id ?? "");
  const selected = value ?? internal;
  const select = (id: string) => (onChange ? onChange(id) : setInternal(id));
  const picker = variant === "picker";
  const dark = tone === "dark";

  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const copy = async (store: Store) => {
    if (!(await writeClipboard(locationText(store, lang, t)))) return;
    setCopied(store.id);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 2000);
  };

  // When a pin is picked on the map, bring its card into view inside the scrolling list (never scrolls the page).
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const ul = list.current;
    const li = ul?.querySelector<HTMLElement>(`[data-store="${CSS.escape(selected)}"]`);
    if (!ul || !li || ul.scrollHeight <= ul.clientHeight) return;
    const top = li.offsetTop - 4;
    const bottom = li.offsetTop + li.offsetHeight + 4;
    if (top >= ul.scrollTop && bottom <= ul.scrollTop + ul.clientHeight) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ul.scrollTo({ top: top < ul.scrollTop ? top : bottom - ul.clientHeight, behavior: reduce ? "auto" : "smooth" });
  }, [selected]);

  return (
    <div className={`grid gap-6 ${picker ? "md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]"}`}>
      {/* Section: the list is capped at the map's height and scrolls inside. The -m-1/p-1 pair keeps the active ring from being clipped. */}
      <div className={picker ? "contents" : "relative -m-1"}>
        <ul
          ref={list}
          className={
            picker
              ? "flex flex-col gap-2"
              : "relative flex max-h-80 flex-col gap-2 overflow-y-auto overscroll-contain p-1 [scrollbar-width:thin] sm:max-h-[420px] lg:absolute lg:inset-0 lg:max-h-none"
          }
          role={picker ? "radiogroup" : undefined}
          aria-label={t.mapLabel}
        >
        {stores.map((store) => {
          const active = store.id === selected;
          const onDark = dark && !active;
          return (
            <li key={store.id} data-store={store.id}>
              <article
                className={`flex items-center rounded-2xl transition-[background-color,box-shadow] duration-300 ${
                  active
                    ? "bg-white shadow-[0_8px_24px_rgba(20,20,20,0.06)] ring-2 ring-ink"
                    : picker
                      ? "bg-white ring-1 ring-line hover:ring-ink/40"
                      : dark
                        ? "bg-carbon ring-1 ring-white/10 hover:bg-graphite"
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
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-3 text-left"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                      active ? "bg-brand text-white" : onDark ? "bg-graphite text-brand" : "bg-mist text-brand"
                    }`}
                  >
                    {picker && active ? <Check weight="bold" className="size-4" /> : <MapPin weight="fill" className="size-4" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2">
                      <span className={`title-3 line-clamp-1 ${onDark ? "text-white" : "text-ink"}`}>{store.city[lang]}</span>
                      {store.kind && (
                        <span
                          className={`caption-3 shrink-0 rounded-full px-2 py-0.5 ${
                            store.kind === "main" ? "bg-brand text-white" : onDark ? "bg-white/10 text-white" : "bg-ink/10 text-ink"
                          }`}
                        >
                          {t.kinds[store.kind]}
                        </span>
                      )}
                    </span>
                    <span className={`body-6 mt-0.5 line-clamp-1 ${onDark ? "text-white/60" : "text-ink-soft"}`} title={store.address || undefined}>
                      {store.address || t.noAddress}
                    </span>
                  </span>
                </button>
                {!picker && (active || store.mapUrl) && (
                  <div className="flex shrink-0 items-center gap-1 pr-3">
                    {active && (
                      <button
                        type="button"
                        onClick={() => copy(store)}
                        title={copied === store.id ? t.copied : t.copy}
                        aria-label={t.copy}
                        className="flex size-9 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors duration-300 hover:border-ink"
                      >
                        {copied === store.id ? (
                          <Check weight="bold" className="size-4 text-brand" />
                        ) : (
                          <Copy weight="bold" className="size-4" />
                        )}
                        <span className="sr-only" aria-live="polite">
                          {copied === store.id ? t.copied : ""}
                        </span>
                      </button>
                    )}
                    {store.mapUrl && (
                      <a
                        href={store.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t.map}
                        aria-label={t.map}
                        className={`flex size-9 items-center justify-center rounded-full border transition-colors duration-300 ${
                          onDark ? "border-white/20 text-white hover:border-white" : "border-ink/15 text-ink hover:border-ink"
                        }`}
                      >
                        <ArrowUpRight weight="bold" className="size-4" />
                      </a>
                    )}
                  </div>
                )}
              </article>
            </li>
          );
        })}
        </ul>
      </div>

      <div className={picker ? "h-72 md:h-auto md:min-h-[420px]" : "h-80 sm:h-[420px] lg:h-[520px]"}>
        <StoreMap
          pins={stores.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: storeTitle(s, lang, t) }))}
          selected={selected}
          onSelect={select}
          label={t.mapLabel}
          gestures={t.gestures}
          dark={dark}
          focusSelected={picker && value !== undefined}
        />
      </div>
    </div>
  );
}
