"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Cube, HandGrabbing } from "@phosphor-icons/react";
import type { ModelViewerElement } from "@google/model-viewer";
import type { ViewerModel } from "@/data/models";
import type { ColorKey } from "@/data/catalog";

export type ModelLabels = {
  alt: string;
  hint: string;
  openLid: string;
  closeLid: string;
  ar: string;
  color: string;
  loading: string;
  arOpen?: string;
  arUnsupported?: string;
};

type Props = {
  model: ViewerModel;
  labels: ModelLabels;
  colorNames: Record<ColorKey, string>;
  /** Colour chosen outside the viewer (the product page's swatches). Hides the viewer's own swatches. */
  color?: ColorKey | null;
  /** AR mode: offer a big "open camera" button instead of the corner AR chip. */
  arPrompt?: boolean;
};

const LID_SECONDS = 1.2;

/**
 * Interactive 3D view of a product: drag to rotate, pinch to zoom, switch body colour,
 * open the lid, and place it in your kitchen with AR on supported phones.
 * The <model-viewer> library loads only when this component mounts (the gallery's 3D tab).
 */
export function ProductModelViewer({ model, labels, colorNames, color: chosen, arPrompt }: Props) {
  const controlled = chosen !== undefined;
  const ref = useRef<ModelViewerElement>(null);
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [color, setColor] = useState(model.colors[0]?.key);
  const [lidOpen, setLidOpen] = useState(false);
  const [canAR, setCanAR] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    let alive = true;
    import("@google/model-viewer").then(() => alive && setReady(true));
    return () => {
      alive = false;
      cancelAnimationFrame(frame.current);
    };
  }, []);

  // Listen for the model finishing loading, then park the lid animation at its start.
  useEffect(() => {
    const el = ref.current;
    if (!ready || !el) return;
    const onLoad = () => {
      if (model.lidAnimation) {
        el.animationName = model.lidAnimation;
        el.play();
        el.pause();
        el.currentTime = 0;
      }
      setCanAR(el.canActivateAR);
      setLoaded(true);
    };
    // A cached model can finish loading before this effect subscribes.
    if (el.loaded) onLoad();
    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
  }, [ready, model.lidAnimation]);

  const paint = (key: ColorKey) => {
    const el = ref.current;
    const hex = model.colors.find((c) => c.key === key)?.hex;
    if (!el?.model || !hex) return;
    for (const m of el.model.materials) {
      if (model.paint.includes(m.name)) m.pbrMetallicRoughness.setBaseColorFactor(hex);
    }
    setColor(key);
  };

  // Follow the colour picked on the page once the model is ready.
  useEffect(() => {
    if (loaded && chosen && chosen !== color) paint(chosen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, chosen]);

  // Scrub the lid animation toward open or closed, so it can reverse mid-way.
  const toggleLid = () => {
    const el = ref.current;
    if (!el) return;
    const open = !lidOpen;
    setLidOpen(open);
    cancelAnimationFrame(frame.current);
    const target = open ? LID_SECONDS : 0;
    if (reduce) {
      el.currentTime = target;
      return;
    }
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const t = el.currentTime + (open ? dt : -dt);
      el.currentTime = Math.min(LID_SECONDS, Math.max(0, t));
      if (el.currentTime !== target) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  const chip =
    "caption-1 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-ink shadow-[0_2px_8px_rgba(20,20,20,0.12)] transition-[opacity,transform] duration-300 hover:opacity-80 active:scale-[0.98]";

  return (
    <div className="relative size-full">
      {ready && (
        <model-viewer
          ref={ref}
          src={model.src}
          alt={labels.alt}
          camera-controls=""
          touch-action="pan-y"
          {...(reduce ? {} : { "auto-rotate": "", "auto-rotate-delay": "1500", "rotation-per-second": "18deg" })}
          camera-orbit="30deg 70deg auto"
          shadow-intensity="1"
          shadow-softness="0.8"
          exposure="1.05"
          environment-image="neutral"
          interaction-prompt="none"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        >
          {/* model-viewer shows this only on devices that support AR. */}
          <button slot="ar-button" type="button" className={`${chip} absolute top-4 right-4 ${arPrompt ? "hidden" : ""}`}>
            <Cube weight="bold" className="size-4" />
            {labels.ar}
          </button>
        </model-viewer>
      )}

      {!loaded && (
        <p role="status" className="caption-1 absolute inset-0 grid place-items-center text-ink-soft">
          {labels.loading}
        </p>
      )}

      {loaded && arPrompt && (
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2 text-center">
          {canAR ? (
            <button type="button" onClick={() => ref.current?.activateAR()} className={`${chip} px-6 py-3`}>
              <Cube weight="bold" className="size-5" />
              {labels.arOpen ?? labels.ar}
            </button>
          ) : (
            <p className="caption-1 rounded-full bg-white/90 px-4 py-2 text-ink">{labels.arUnsupported}</p>
          )}
        </div>
      )}

      {loaded && (
        <>
          <p
            className={`caption-5 pointer-events-none absolute left-4 inline-flex items-center gap-1 text-ink-soft ${
              controlled ? "bottom-6" : "top-4"
            }`}
          >
            <HandGrabbing weight="bold" className="size-4" />
            {labels.hint}
          </p>

          <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-3">
            {!controlled && model.colors.length > 1 && model.paint.length > 0 && (
              <div className="flex gap-2 rounded-full bg-white p-1.5 shadow-[0_2px_8px_rgba(20,20,20,0.12)]">
                {model.colors.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => paint(c.key)}
                    aria-label={labels.color.replace("{color}", colorNames[c.key])}
                    aria-pressed={c.key === color}
                    title={colorNames[c.key]}
                    className={`size-7 rounded-full border border-ink/15 transition-shadow duration-300 ${
                      c.key === color ? "ring-2 ring-ink ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
            {model.lidAnimation && (
              <button type="button" onClick={toggleLid} aria-pressed={lidOpen} className={chip}>
                {lidOpen ? labels.closeLid : labels.openLid}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
