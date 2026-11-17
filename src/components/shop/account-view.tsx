"use client";

import Link from "next/link";
import { CaretRight, GlobeSimple, Handbag, Heart, Storefront, User } from "@phosphor-icons/react";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Store } from "@/config/site";
import { useShop } from "@/lib/shop-store";
import { storeTitle } from "@/components/store-locator";

type Props = {
  lang: Locale;
  stores: Store[];
  t: Dictionary["account"];
  shop: Dictionary["shop"];
  storesT: Dictionary["stores"];
};

/** Profile hub for guests: what is saved on this device, until accounts launch. */
export function AccountView({ lang, stores, t, shop, storesT }: Props) {
  const { ready, bagCount, favorites, pickup } = useShop();
  const pickupStore = stores.find((s) => s.id === pickup) ?? null;
  const count = (n: number) => (ready ? t.count.replace("{n}", String(n)) : "");

  const rows = [
    { href: `/${lang}/bag`, icon: Handbag, label: shop.bag, value: count(bagCount) },
    { href: `/${lang}/favorites`, icon: Heart, label: shop.favorites, value: count(favorites.length) },
    {
      href: `/${lang}/bag`,
      icon: Storefront,
      label: t.pickup,
      value: ready ? (pickupStore ? storeTitle(pickupStore, lang, storesT) : t.none) : "",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-24 sm:px-6">
      <div className="flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-mist text-ink">
          <User className="size-7" />
        </span>
        <h1 className="heading-4 text-ink">{t.title}</h1>
      </div>
      <p className="body-6 mt-6 rounded-2xl bg-mist p-4 text-ink-soft">{t.soon}</p>

      <ul className="mt-8 flex flex-col">
        {rows.map(({ href, icon: Icon, label, value }) => (
          <li key={label}>
            <Link
              href={href}
              className="flex items-center gap-4 border-b border-line py-5 transition-opacity duration-300 hover:opacity-70"
            >
              <Icon className="size-6 text-ink" />
              <span className="title-3 flex-1 text-ink">{label}</span>
              <span className="body-6 min-w-8 text-right text-ink-soft">{value}</span>
              <CaretRight className="size-4 text-ink-soft" />
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-4 border-b border-line py-5">
          <GlobeSimple className="size-6 text-ink" />
          <span className="title-3 flex-1 text-ink">{t.language}</span>
          <span className="flex gap-1">
            {locales.map((l) => (
              <Link
                key={l}
                href={`/${l}/account`}
                hrefLang={l}
                aria-current={l === lang ? "page" : undefined}
                className="button-sm rounded-full border border-line px-3 py-1 text-ink-soft transition-colors duration-300 hover:border-ink/40 aria-[current]:border-ink aria-[current]:text-ink"
              >
                {localeLabels[l]}
              </Link>
            ))}
          </span>
        </li>
      </ul>
    </div>
  );
}
