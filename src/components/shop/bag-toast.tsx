"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle, X } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { shop, useShop } from "@/lib/shop-store";

const EASE = [0.22, 1, 0.36, 1] as const;

/** "Added to bag" confirmation that drops in under the header, like Nike's. */
export function BagToast({ lang, t }: { lang: Locale; t: Dictionary["shop"] }) {
  const { lastAdded, bagCount } = useShop();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!lastAdded) return;
    const id = window.setTimeout(() => shop.dismissAdded(), 6000);
    return () => window.clearTimeout(id);
  }, [lastAdded]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-20 z-[55] flex justify-end sm:left-auto sm:w-96">
      <AnimatePresence>
        {lastAdded && (
          <motion.div
            key={lastAdded.at}
            role="status"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="pointer-events-auto w-full rounded-2xl bg-white p-4 shadow-[0_24px_64px_rgba(20,20,20,0.16)]"
          >
            <div className="flex items-center justify-between">
              <p className="title-4 flex items-center gap-2 text-ink">
                <CheckCircle weight="fill" className="size-5 text-[#1a7f37]" />
                {t.added}
              </p>
              <button
                type="button"
                onClick={() => shop.dismissAdded()}
                aria-label={t.close}
                className="flex size-8 items-center justify-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-ink/5"
              >
                <X weight="bold" className="size-4" />
              </button>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-mist">
                <Image src={lastAdded.image} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <p className="title-3 text-ink">{lastAdded.name}</p>
                <p className="body-6 text-ink-soft">{lastAdded.subtitle}</p>
              </div>
            </div>
            <Link
              href={`/${lang}/bag`}
              onClick={() => shop.dismissAdded()}
              className="button-sm mt-4 flex justify-center rounded-full border border-ink/15 px-4 py-3 text-ink transition-colors duration-300 hover:border-ink/40 active:scale-[0.98]"
            >
              {t.viewBag.replace("{n}", String(bagCount))}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
