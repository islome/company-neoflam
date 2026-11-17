"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Handbag, Heart, User } from "@phosphor-icons/react";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { useShop } from "@/lib/shop-store";
import { Logo } from "./logo";
import { MiniBar } from "./mini-bar";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  lang: Locale;
  nav: Dictionary["nav"];
  a11y: Dictionary["a11y"];
  shop: Dictionary["shop"];
  mini: Dictionary["mini"];
};

export function SiteHeader({ lang, nav, a11y, shop, mini }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { favorites, bagCount } = useShop();
  const [atTop, setAtTop] = useState(true);

  // The mini bar shows only while the very top of the page is in view (no scroll listener needed).
  useEffect(() => {
    const marker = document.getElementById("top");
    if (!marker) return;
    const io = new IntersectionObserver(([e]) => setAtTop(e.isIntersecting));
    io.observe(marker);
    return () => io.disconnect();
  }, [pathname]);

  const links = [
    { id: "products", label: nav.products },
    { id: "brands", label: nav.brands },
    { id: "news", label: nav.news },
    { id: "stores", label: nav.stores },
  ];

  // Highlight the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const { id } of links) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onProductsPage = pathname.endsWith("/products");
  // Product pages keep only their filter bar pinned, so the header scrolls away with the page.
  const inFlow = /^\/(uz|ru|en)\/(products|bag|favorites|account)(\/|$)/.test(pathname);
  const isCurrent = (id: string) => (onProductsPage ? id === "products" : active === id);
  const swapLocale = (l: Locale) => pathname.replace(/^\/(uz|ru|en)/, `/${l}`);

  // On floating header pages the main header drops below the mini bar while it is visible.
  // Not while the mobile menu is open: a transform would trap its full screen panel inside the header.
  const miniVisible = atTop && !open;
  const shifted = !inFlow && miniVisible;

  return (
    <>
      <MiniBar
        lang={lang}
        t={mini}
        languageLabel={a11y.language}
        swapLocale={swapLocale}
        fixed={!inFlow}
        visible={miniVisible}
        profileCurrent={pathname.endsWith("/account")}
      />
      <header
        className={`${inFlow ? "relative" : "fixed inset-x-0 top-0"} z-50 flex justify-center px-4 pt-4 transition-[translate] duration-500 ${
          shifted ? "md:translate-y-9" : ""
        }`}
      >
        <nav
          aria-label="Main"
          className="flex w-full max-w-5xl items-center gap-4 rounded-full border border-white/40 bg-white/70 py-2 pr-2 pl-4 shadow-[0_8px_32px_rgba(20,20,20,0.08)] backdrop-blur-xl"
        >
          <Link href={`/${lang}`} aria-label="Neoflam" className="shrink-0 rounded-full">
            <Logo className="h-4 w-auto text-brand" />
          </Link>

          <ul className="mx-auto hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/${lang}#${l.id}`}
                  aria-current={isCurrent(l.id) ? "true" : undefined}
                  className="title-4 rounded-full px-3 py-2 text-ink-soft transition-colors duration-300 hover:bg-ink/5 hover:text-ink aria-[current]:bg-ink/5 aria-[current]:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <IconLink
              href={`/${lang}/favorites`}
              label={shop.favorites}
              count={favorites.length}
              current={pathname.endsWith("/favorites")}
            >
              <Heart weight={pathname.endsWith("/favorites") ? "fill" : "regular"} className="size-6" />
            </IconLink>
            <IconLink href={`/${lang}/bag`} label={shop.bag} count={bagCount} current={pathname.endsWith("/bag")}>
              <Handbag weight={pathname.endsWith("/bag") ? "fill" : "regular"} className="size-6" />
            </IconLink>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? a11y.closeMenu : a11y.openMenu}
              className="relative flex size-10 items-center justify-center rounded-full transition-colors duration-300 hover:bg-ink/5 active:scale-[0.98] md:hidden"
            >
              <span
                className={`absolute h-0.5 w-5 rounded-full bg-ink transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-1"}`}
              />
              <span
                className={`absolute h-0.5 w-5 rounded-full bg-ink transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-1"}`}
              />
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed inset-0 -z-10 flex flex-col bg-white/95 px-6 pt-28 pb-10 backdrop-blur-2xl md:hidden"
            >
              <ul className="flex flex-col gap-2">
                {links.map((l, i) => (
                  <motion.li
                    key={l.id}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: Math.min(i * 0.06, 0.4) }}
                  >
                    <Link
                      href={`/${lang}#${l.id}`}
                      onClick={() => setOpen(false)}
                      className="heading-4 block py-2 text-ink"
                    >
                      {l.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <div role="group" aria-label={a11y.language} className="flex gap-2">
                    {locales.map((l) => (
                      <Link
                        key={l}
                        href={swapLocale(l)}
                        hrefLang={l}
                        aria-current={l === lang ? "page" : undefined}
                        className="button-sm rounded-full border border-line px-4 py-2 text-ink-soft aria-[current]:border-ink aria-[current]:text-ink"
                      >
                        {localeLabels[l]}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/${lang}/account`}
                    onClick={() => setOpen(false)}
                    aria-current={pathname.endsWith("/account") ? "page" : undefined}
                    className="button-sm inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-ink aria-[current]:border-ink"
                  >
                    <User weight="bold" className="size-4" />
                    {mini.profile}
                  </Link>
                </div>
                <Link
                  href={`/${lang}/products`}
                  onClick={() => setOpen(false)}
                  className="button-md rounded-full bg-brand px-4 py-3 text-center text-white active:scale-[0.98]"
                >
                  {nav.cta}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

function IconLink({
  href,
  label,
  count,
  current,
  children,
}: {
  href: string;
  label: string;
  count: number;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label} (${count})` : label}
      aria-current={current ? "page" : undefined}
      className="relative flex size-10 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:bg-ink/5 active:scale-[0.98]"
    >
      {children}
      {count > 0 && (
        <span className="caption-3 absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
