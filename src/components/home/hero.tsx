"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Trophy } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";

const EASE = [0.22, 1, 0.36, 1] as const;
const SLIDE_MS = 5000;

/**
 * Hero photos, shown in order. `bg` is sampled from each photo's backdrop; the
 * section fades to it so every photo blends into the page with no visible box.
 */
const SLIDES = [
  { src: "/images/hero/fika-set.webp", width: 1086, height: 1448, bg: "#efe9e2" },
  { src: "/images/hero/fika-set-7.jpg", width: 1086, height: 1448, bg: "#efe9e2" },
  { src: "/images/hero/fika-set-5.webp", width: 1086, height: 1448, bg: "#efe9e2" },
  { src: "/images/hero/pink-set.webp", width: 1180, height: 1333, bg: "#fefefe" },
] as const;

type Props = { hero: Dictionary["hero"]; videoUrl: string | null; lang: Locale };

export function Hero({ hero, videoUrl, lang }: Props) {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  const [active, setActive] = useState(0);
  useEffect(() => {
    if (videoUrl) return;
    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
    // Restart the timer whenever a slide is picked by hand.
  }, [active, videoUrl]);
  const prev = (active - 1 + SLIDES.length) % SLIDES.length;

  return (
    <section
      aria-labelledby="hero-title"
      style={videoUrl ? undefined : { backgroundColor: SLIDES[active].bg }}
      className="relative overflow-hidden bg-linen pt-32 pb-16 transition-[background-color] duration-1000 md:pt-40 md:pb-24"
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
                <Accented line={line} accent={hero.accent} />
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

        <div>
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE, delay: 0.15 }}
            className="relative mx-auto aspect-[3/4] w-full max-w-[460px]"
          >
            {videoUrl ? (
              <video
                src={videoUrl}
                autoPlay
                muted
                loop
                playsInline
                aria-hidden
                className="absolute inset-0 size-full rounded-3xl object-cover"
              />
            ) : (
              SLIDES.map((slide, i) => {
                // Right to left: the next photo waits on the right, the outgoing one leaves left.
                const offset = i === active ? 0 : i === prev ? -1 : 1;
                return (
                  <motion.div
                    key={slide.src}
                    aria-hidden={i !== active || undefined}
                    initial={false}
                    animate={{
                      x: reduce ? 0 : `${offset * 40}%`,
                      opacity: offset === 0 ? 1 : 0,
                    }}
                    transition={{ duration: 0.9, ease: EASE }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={slide.src}
                      alt={hero.imageAlts[i]}
                      width={slide.width}
                      height={slide.height}
                      // Every slide is above the fold and any of them can become the LCP,
                      // so load them all right away; the first one gets fetch priority.
                      loading="eager"
                      fetchPriority={i === 0 ? "high" : undefined}
                      sizes="(min-width: 640px) 460px, 100vw"
                      // Feather the edges so the photo melts into the matching section background.
                      className="hero-photo-fade size-full object-contain"
                    />
                  </motion.div>
                );
              })
            )}
          </motion.div>
          {!videoUrl && (
            <div className="mt-2 flex justify-center gap-2">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={hero.showSlide.replace("{n}", String(i + 1))}
                  aria-current={i === active || undefined}
                  className="grid size-6 place-items-center rounded-full"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-[width,background-color] duration-500 ${
                      i === active ? "w-5 bg-brand" : "w-1.5 bg-ink/25"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Renders a headline line with the accent word in bold brand red. */
function Accented({ line, accent }: { line: string; accent: string }) {
  const at = line.indexOf(accent);
  if (at === -1) return line;
  return (
    <>
      {line.slice(0, at)}
      <strong className="[font-weight:inherit] text-brand">{accent}</strong>
      {line.slice(at + accent.length)}
    </>
  );
}
