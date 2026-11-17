"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { GalleryImage } from "@/data/gallery";

type Labels = { prev: string; next: string; showImage: string };

/** Thumbnail column plus a swipeable main image with arrow controls, like Nike's launch pages. */
export function HeroGallery({ images, name, labels }: { images: GalleryImage[]; name: string; labels: Labels }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  // Keep the active index in sync with swipes on the track.
  useEffect(() => {
    const root = track.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setIndex(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-index]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (i: number) => {
    const root = track.current;
    if (!root) return;
    const next = (i + images.length) % images.length;
    root.scrollTo({ left: next * root.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      <ul className="flex shrink-0 gap-2 overflow-x-auto lg:max-h-[640px] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
        {images.map((img, i) => (
          <li key={img.src} className="shrink-0">
            <button
              type="button"
              onClick={() => go(i)}
              aria-label={labels.showImage.replace("{n}", String(i + 1))}
              aria-current={i === index}
              className={`relative block size-16 overflow-hidden rounded-md bg-white transition-opacity duration-300 ${
                i === index ? "opacity-100 ring-2 ring-ink ring-offset-1" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative min-w-0 flex-1">
        <div
          ref={track}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(index + 1);
            if (e.key === "ArrowLeft") go(index - 1);
          }}
          className="flex aspect-square snap-x snap-mandatory overflow-x-auto rounded-lg bg-mist [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div key={img.src} data-index={i} className="relative w-full shrink-0 snap-center">
              <Image
                src={img.src}
                alt={`${name} ${i + 1}`}
                fill
                preload={i === 0}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className={img.fit === "cover" ? "object-cover" : "object-contain bg-white"}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <div className="absolute right-4 bottom-4 flex gap-2">
            <ArrowButton label={labels.prev} onClick={() => go(index - 1)}>
              <CaretLeft weight="bold" className="size-4" />
            </ArrowButton>
            <ArrowButton label={labels.next} onClick={() => go(index + 1)}>
              <CaretRight weight="bold" className="size-4" />
            </ArrowButton>
          </div>
        )}
      </div>
    </div>
  );
}

export function ArrowButton({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="flex size-9 items-center justify-center rounded-full bg-white text-ink shadow-[0_2px_8px_rgba(20,20,20,0.12)] transition-[opacity,transform] duration-300 hover:opacity-80 active:scale-[0.98] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
