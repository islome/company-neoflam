"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Cube, HandGrabbing, LinkSimple } from "@phosphor-icons/react";
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
  /** Short note under the "open camera" button. */
  arHint?: string;
  /** iPhone in-app browsers (Telegram, Instagram…) can't open AR: ask for Safari. */
  arSafari?: string;
  arCopyLink?: string;
  arCopied?: string;
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
 * How AR opens on this device. iPhone/iPad use Apple's AR Quick Look (the native AR camera,
 * which also uses LiDAR where the phone has it). In-app browsers like Telegram's or Instagram's
 * can't launch it, so those get a "open in Safari" note instead.
 */
type IosAR = "none" | "quick-look" | "in-app";
function detectIosAR(): IosAR {
  if (typeof navigator === "undefined") return "none";
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (!ios) return "none";
  // Chrome, Firefox and Edge on iOS hand rel="ar" links to Quick Look too; the Google app doesn't.
  if (/CriOS|FxiOS|EdgiOS/.test(ua)) return "quick-look";
  if (/GSA\//.test(ua)) return "in-app";
  return document.createElement("a").relList?.supports?.("ar") ? "quick-look" : "in-app";
}

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
  const [iosAR] = useState(detectIosAR);
  const [copied, setCopied] = useState(false);
  // Set when AR opens. The page keeps rendering under the AR camera, so the preview must
  // stop spinning or its WebGL redraws compete with AR (dropped frames, a hot phone).
  const [arLaunched, setArLaunched] = useState(false);
  const spin = !reduce && !arPrompt && !arLaunched;
  const quickLook = useRef<HTMLAnchorElement>(null);
  const frame = useRef(0);

  // Ready-made .usdz for the current colour (falls back to the first colour's file).
  const usdzColor = chosen && model.iosSrc?.[chosen] ? chosen : color;
  const iosSrc =
    (usdzColor && model.iosSrc?.[usdzColor]) ||
    (model.colors[0] && model.iosSrc?.[model.colors[0].key]) ||
    model.iosSrc?.default;
  // With a hosted .usdz the iPhone camera can open at once, before the 3D preview loads.
  const nativeQuickLook = iosAR === "quick-look" && !!iosSrc;
  const arReady = iosAR === "in-app" || nativeQuickLook || loaded;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

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
    // Touching the preview again (after coming back from AR) lets it spin again.
    <div className="relative size-full" onPointerDown={() => setArLaunched(false)}>
      {ready && (
        <model-viewer
          ref={ref}
          src={model.src}
          alt={labels.alt}
          camera-controls=""
          touch-action="pan-y"
          {...(spin ? { "auto-rotate": "", "auto-rotate-delay": "1500", "rotation-per-second": "18deg" } : {})}
          camera-orbit="30deg 70deg auto"
          shadow-intensity="1"
          shadow-softness="0.8"
          exposure="1.05"
          environment-image="neutral"
          interaction-prompt="none"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          {...(iosSrc ? { "ios-src": iosSrc } : {})}
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        >
          {/* model-viewer shows this only on devices that support AR. */}
          <button
            slot="ar-button"
            type="button"
            onClick={() => setArLaunched(true)}
            className={`${chip} absolute top-4 right-4 ${arPrompt ? "hidden" : ""}`}>
            <Cube weight="bold" className="size-4" />
            {labels.ar}
          </button>
        </model-viewer>
      )}

      {!loaded && !(arPrompt && arReady) && (
        <p role="status" className="caption-1 absolute inset-0 grid place-items-center text-ink-soft">
          {labels.loading}
        </p>
      )}

      {/* Apple's AR Quick Look link: rel="ar" with an <img> as its only child opens the native AR camera. */}
      {nativeQuickLook && (
        <a ref={quickLook} rel="ar" href={`${iosSrc}#allowsContentScaling=0`} className="hidden" aria-hidden tabIndex={-1}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" />
        </a>
      )}

      {arPrompt && arReady && (
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 text-center">
          {iosAR === "in-app" ? (
            <>
              <p className="caption-1 max-w-72 rounded-2xl bg-white/90 px-4 py-2 text-ink">{labels.arSafari}</p>
              <button type="button" onClick={copyLink} className={chip}>
                <LinkSimple weight="bold" className="size-4" />
                <span aria-live="polite">{copied ? labels.arCopied : labels.arCopyLink}</span>
              </button>
            </>
          ) : nativeQuickLook || canAR ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setArLaunched(true);
                  if (nativeQuickLook) quickLook.current?.click();
                  else ref.current?.activateAR();
                }}
                className={`${chip} px-6 py-3`}
              >
                <Cube weight="bold" className="size-5" />
                {labels.arOpen ?? labels.ar}
              </button>
              {labels.arHint && (
                <p className="caption-5 max-w-64 rounded-2xl bg-white/90 px-3 py-1.5 text-ink-soft">{labels.arHint}</p>
              )}
            </>
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
              <button type="button" onClick={toggleLid} aria-pressed={lidOpen} className={`${chip} ml-auto`}>
                {lidOpen ? labels.closeLid : labels.openLid}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
