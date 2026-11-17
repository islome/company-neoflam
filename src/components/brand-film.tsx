"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Play, X } from "@phosphor-icons/react";
import type { Dictionary } from "@/i18n/dictionaries/uz";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  t: Dictionary["film"];
  a11y: Dictionary["a11y"];
  cover: string;
  src: string;
};

export function BrandFilm({ t, a11y, cover, src }: Props) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section aria-labelledby="film-title" className="px-4 sm:px-6">
      <div className="relative mx-auto aspect-[4/5] max-w-6xl overflow-hidden rounded-3xl sm:aspect-[16/9]">
        <Image src={cover} alt="" fill sizes="(min-width: 1152px) 1152px, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-ink/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center">
          <h2 id="film-title" className="heading-4 md:heading-2 max-w-[680px] text-white">
            {t.titleLines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={a11y.play}
            className="button-md group inline-flex items-center gap-3 rounded-full bg-white py-2 pr-6 pl-2 text-ink transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-brand text-white">
              <Play weight="fill" className="size-4" />
            </span>
            {t.play}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="film-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setOpen(false)}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={a11y.closeVideo}
              className="absolute top-4 right-4 flex size-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-300 hover:bg-white/20"
            >
              <X weight="bold" className="size-5" />
            </button>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={src}
                title={t.titleLines.join(" ")}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
