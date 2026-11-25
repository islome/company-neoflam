"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

const control =
  "flex size-12 items-center justify-center rounded-full border border-ink/15 text-ink transition-[border-color,transform] duration-300 hover:border-ink active:scale-[0.98]";

/** Previous / next buttons for `useLoopCarousel`. Hidden on phones, where people swipe. */
export function CarouselArrows({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
}: {
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
}) {
  return (
    <div className="hidden gap-2 sm:flex">
      <button type="button" onClick={onPrev} aria-label={prevLabel} className={control}>
        <ArrowLeft weight="bold" className="size-5" />
      </button>
      <button type="button" onClick={onNext} aria-label={nextLabel} className={control}>
        <ArrowRight weight="bold" className="size-5" />
      </button>
    </div>
  );
}
