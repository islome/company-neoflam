"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Trophy } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = { hero: Dictionary["hero"]; videoUrl: string | null; lang: Locale };

export function Hero({ hero, videoUrl, lang }: Props) {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-sun pt-32 pb-16 md:pt-40 md:pb-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <motion.p
            {...rise(0)}
            className="caption-1 inline-flex rounded-full bg-white/60 px-3 py-1 text-ink"
          >
            {hero.eyebrow}
          </motion.p>

          <h1
            id="hero-title"
            className="heading-3 sm:heading-2 lg:heading-1 mt-6 max-w-[680px] text-ink"
          >
            {hero.titleLines.map((line, i) => (
              <motion.span key={line} {...rise(0.08 + i * 0.08)} className="block">
                {line}
              </motion.span>
            ))}
          </h1>

          <motion.p {...rise(0.3)} className="body-3 mt-6 max-w-[680px] text-ink/80 sm:title-2 sm:font-normal">
            {hero.subtitle}
          </motion.p>

          <motion.div {...rise(0.4)} className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <Link
              href={`/${lang}/products`}
              className="button-md group inline-flex shrink-0 items-center justify-center gap-2 rounded-full whitespace-nowrap bg-brand px-6 py-3 text-white shadow-[0_8px_24px_rgba(199,23,33,0.28)] transition-[background-color,transform] duration-300 hover:bg-brand-deep active:scale-[0.98]"
            >
              {hero.cta}
              <ArrowRight
                weight="bold"
                className="size-4 transition-transform duration-500 group-hover:translate-x-1"
              />
            </Link>
            <p className="caption-1 inline-flex items-center gap-2 text-ink/80">
              <Trophy weight="fill" className="size-5 shrink-0 text-brand" />
              {hero.proof}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.15 }}
          className="relative aspect-[4/5] max-h-[560px] w-full overflow-hidden rounded-3xl bg-sun-deep sm:aspect-[4/3] lg:aspect-[4/5]"
        >
          {videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <KineticStack word={hero.kinetic} />
          )}
        </motion.div>
      </div>
    </section>
  );
}

/** Endless column of the brand word, echoing the global site's hero film. */
function KineticStack({ word }: { word: string }) {
  const rows = Array.from({ length: 8 }, (_, i) => i);
  const column = (hidden: boolean) => (
    <div aria-hidden={hidden || undefined} className="flex flex-col items-center">
      {rows.map((i) => (
        <span
          key={i}
          // Sized to the frame (container query width) so the word always fits edge to edge.
          className={`text-[20cqw] leading-[1.05] font-bold tracking-tight ${
            i % 4 === 2 ? "text-brand" : "text-white"
          }`}
        >
          {word}
        </span>
      ))}
    </div>
  );

  return (
    <div aria-hidden className="@container absolute inset-0 flex justify-center">
      <div className="animate-kinetic flex flex-col will-change-transform">
        {column(false)}
        {column(true)}
      </div>
    </div>
  );
}
