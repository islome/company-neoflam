"use client";

import Link from "next/link";
import { GlobeSimple, User } from "@phosphor-icons/react";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { site } from "@/config/site";
import { Logo } from "./logo";

type Props = {
  lang: Locale;
  t: Dictionary["mini"];
  languageLabel: string;
  swapLocale: (l: Locale) => string;
  /** Pinned to the viewport (pages with a floating header) or part of the page flow. */
  fixed: boolean;
  /** Only shown at the very top of the page, like Nike's utility bar. */
  visible: boolean;
  profileCurrent: boolean;
};

/** Slim utility bar above the main header: global site, store finder, language and profile. Tablet and desktop only; on phones these live in the menu. */
export function MiniBar({ lang, t, languageLabel, swapLocale, fixed, visible, profileCurrent }: Props) {
  const sep = <span aria-hidden className="h-3 w-px bg-ink/20" />;

  return (
    <div
      inert={fixed && !visible}
      className={`${
        fixed ? "fixed inset-x-0 top-0" : "relative"
      } z-[51] hidden h-9 bg-mist md:block transition-[translate,opacity] duration-500 ${fixed && !visible ? "-translate-y-full opacity-0" : ""}`}
    >
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-12">
        <a
          href={site.links.global}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.global}
          className="inline-flex items-center rounded-sm text-ink transition-opacity duration-300 hover:opacity-60"
        >
          <Logo title={t.global} className="h-2.5 w-auto" />
        </a>

        <nav aria-label={t.profile} className="flex items-center gap-3">
          <Link
            href={`/${lang}#stores`}
            className="caption-6 hidden rounded-sm text-ink transition-opacity duration-300 hover:opacity-60 sm:inline"
          >
            {t.stores}
          </Link>
          <span className="hidden sm:contents">{sep}</span>

          <div role="group" aria-label={languageLabel} className="flex items-center gap-1">
            <GlobeSimple className="size-3 text-ink-soft" aria-hidden />
            {locales.map((l) => (
              <Link
                key={l}
                href={swapLocale(l)}
                hrefLang={l}
                aria-current={l === lang ? "page" : undefined}
                className="caption-6 rounded-sm px-1 text-ink-soft transition-colors duration-300 hover:text-ink aria-[current]:text-ink aria-[current]:underline aria-[current]:underline-offset-4"
              >
                {localeLabels[l]}
              </Link>
            ))}
          </div>
          {sep}

          <Link
            href={`/${lang}/account`}
            aria-current={profileCurrent ? "page" : undefined}
            className="caption-6 inline-flex items-center gap-1 rounded-sm text-ink transition-opacity duration-300 hover:opacity-60 aria-[current]:underline aria-[current]:underline-offset-4"
          >
            <User className="size-3" aria-hidden />
            {t.profile}
          </Link>
        </nav>
      </div>
    </div>
  );
}
