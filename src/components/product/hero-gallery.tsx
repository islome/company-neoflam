"use client";

import { ProductImage } from "@/components/ui/product-image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Cube, CaretLeft, CaretRight, Scan } from "@phosphor-icons/react";
import type { GalleryImage } from "@/data/gallery";
import type { ColorKey } from "@/data/catalog";
import type { ViewerModel } from "@/data/models";
import { ProductModelViewer, type ModelLabels } from "./product-model";
import { useProductSelection } from "./product-selection";

type Labels = { prev: string; next: string; showImage: string; photos: string };
type Model3D = {
  model: ViewerModel;
  labels: ModelLabels & { tab: string; show: string };
  colorNames: Record<ColorKey, string>;
};
type Mode = "photos" | "3d" | "ar";

/** True on touch-first devices (phones, tablets), where AR can work. */
function useCoarsePointer() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0,
    () => false,
  );
}

/**
 * Product stage: swipeable photos with a counter and arrows, a row of thumbnails underneath,
 * and (when the product has a model) a Photos / 3D / AR switch on the stage.
 */
export function HeroGallery({
  images,
  name,
  labels,
  model3d,
}: {
  images: GalleryImage[];
  name: string;
  labels: Labels;
  model3d?: Model3D;
}) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("photos");
  const track = useRef<HTMLDivElement>(null);
  const { color } = useProductSelection();
  const touch = useCoarsePointer();

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

  const modes: { key: Mode; label: string; icon?: React.ReactNode }[] = model3d
    ? [
        { key: "photos", label: labels.photos },
        { key: "3d", label: model3d.labels.tab, icon: <Cube weight="bold" className="size-4" /> },
        ...(touch ? [{ key: "ar" as const, label: "AR", icon: <Scan weight="bold" className="size-4" /> }] : []),
      ]
    : [];

  return (
    // On desktop the photo stays pinned beside the info column while the page scrolls.
    <div className="min-w-0 lg:sticky lg:top-28">
      <div className="relative">
        <div
          ref={track}
          tabIndex={0}
          aria-label={name}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(index + 1);
            if (e.key === "ArrowLeft") go(index - 1);
          }}
          className="flex aspect-square snap-x snap-mandatory overflow-x-auto rounded-lg bg-[#ebebeb] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div key={img.src} data-index={i} className="relative isolate w-full shrink-0 snap-center">
              <ProductImage
                src={img.src}
                alt={`${name} ${i + 1}`}
                fill
                preload={i === 0}
                sizes="(min-width: 1280px) 600px, (min-width: 1024px) 540px, 100vw"
                // Silver backdrop: white photo backgrounds blend into the stage.
                className={`mix-blend-multiply ${img.fit === "cover" ? "object-cover" : "object-contain"}`}
              />
            </div>
          ))}
        </div>

        {model3d && mode !== "photos" && (
          <div className="absolute inset-0 overflow-hidden rounded-lg bg-[#ebebeb]">
            <ProductModelViewer
              model={model3d.model}
              labels={model3d.labels}
              colorNames={model3d.colorNames}
              color={color}
              arPrompt={mode === "ar"}
            />
          </div>
        )}

        {modes.length > 0 && (
          <div
            role="tablist"
            aria-label={model3d?.labels.show}
            className="absolute top-4 left-4 flex gap-0.5 rounded-full border border-line bg-white p-1"
          >
            {modes.map((m) => (
              <button
                key={m.key}
                role="tab"
                type="button"
                aria-selected={mode === m.key}
                onClick={() => setMode(m.key)}
                className={`caption-1 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors duration-300 ${
                  mode === m.key ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        )}

        {mode === "photos" && images.length > 1 && (
          <>
            <p className="caption-5 pointer-events-none absolute bottom-6 left-4 text-ink-soft" aria-live="polite">
              {index + 1} / {images.length}
            </p>
            <div className="absolute right-4 bottom-4 flex gap-2">
              <ArrowButton label={labels.prev} onClick={() => go(index - 1)}>
                <CaretLeft weight="bold" className="size-4" />
              </ArrowButton>
              <ArrowButton label={labels.next} onClick={() => go(index + 1)}>
                <CaretRight weight="bold" className="size-4" />
              </ArrowButton>
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => {
            const current = mode === "photos" && i === index;
            return (
              <li key={img.src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMode("photos");
                    go(i);
                  }}
                  aria-label={labels.showImage.replace("{n}", String(i + 1))}
                  aria-current={current}
                  className={`relative isolate block size-16 overflow-hidden rounded-md bg-[#ebebeb] transition-opacity duration-300 lg:size-[72px] ${
                    current ? "opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <ProductImage src={img.src} alt="" fill sizes="72px" className="object-cover mix-blend-multiply" />
                  {/* Selected marker drawn inside the thumbnail, so the scrolling row can't clip it. */}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 rounded-md border-2 transition-colors duration-300 ${
                      current ? "border-ink" : "border-transparent"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
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
