"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/** In loop mode the list is rendered three times and the view is kept in the middle copy, so it loops both ways. */
const LOOP_COPIES = 3;
/** Pause autoplay this long after someone swipes or clicks an arrow. */
const IDLE_AFTER_INPUT_MS = 8000;

const easeOut = (p: number) => 1 - Math.pow(1 - p, 4); // close to the site's cubic-bezier(0.22,1,0.36,1)
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Options = {
  /** Number of real items. */
  count: number;
  /** Loop endlessly and autoplay. Turn off when every item already fits on screen. */
  loop: boolean;
  /** Time each slide rests before the next one glides in. */
  autoplayMs?: number;
  /** Length of the glide between slides. */
  slideMs?: number;
};

/**
 * Scroll snap carousel that slowly glides one item at a time, loops endlessly and autoplays.
 * Autoplay stops while the mouse is over the track or keyboard focus is inside it, when off screen or in a
 * background tab, for a few seconds after a swipe or arrow click, and for people who prefer reduced motion.
 *
 * Usage: render `copies` copies of the list inside `<ul {...trackProps}>`, mark copies where `isClone(copy)`
 * as `inert` + `aria-hidden`, and wire `prev` / `next` to the arrow buttons.
 */
export function useLoopCarousel({ count: n, loop, autoplayMs = 4500, slideMs = 1100 }: Options) {
  const copies = loop ? LOOP_COPIES : 1;
  const middle = loop ? n : 0; // index of the first real item
  const track = useRef<HTMLUListElement>(null);
  const frame = useRef(0);
  const animating = useRef(false);
  const targetIndex = useRef<number | null>(null);
  const logical = useRef(0); // first visible item, 0..n-1
  const lastMove = useRef(0);
  const hold = useRef({ hover: false, focus: false, offscreen: false });

  /** Scroll position that puts item `i` at the start of the track. */
  const pos = useCallback((i: number) => {
    const el = track.current!;
    const li = el.children[i] as HTMLElement | undefined;
    if (!li) return el.scrollLeft;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    return el.scrollLeft + li.getBoundingClientRect().left - el.getBoundingClientRect().left - pad;
  }, []);

  const nearestIndex = useCallback(() => {
    const el = track.current!;
    let best = 0;
    let dist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const d = Math.abs(pos(i) - el.scrollLeft);
      if (d < dist) [best, dist] = [i, d];
    }
    return best;
  }, [pos]);

  /** Jump without animation (snapping off for that frame so the browser does not fight it). */
  const jump = useCallback((left: number) => {
    const el = track.current!;
    el.style.scrollSnapType = "none";
    el.scrollLeft = left;
    requestAnimationFrame(() => {
      if (!animating.current) el.style.scrollSnapType = "";
    });
  }, []);

  /** After a move settles, quietly move back into the middle copy so there is always room on both sides. */
  const recenter = useCallback(() => {
    if (!track.current || !n) return;
    const i = nearestIndex();
    logical.current = i % n;
    if (loop && (i < n || i >= 2 * n)) jump(pos(n + logical.current));
  }, [jump, loop, n, nearestIndex, pos]);

  const glide = useCallback(
    (left: number) => {
      const el = track.current!;
      cancelAnimationFrame(frame.current);
      const from = el.scrollLeft;
      const duration = reducedMotion() ? 0 : slideMs;
      const start = performance.now();
      animating.current = true;
      el.style.scrollSnapType = "none";
      const step = (now: number) => {
        const p = duration ? Math.min(1, (now - start) / duration) : 1;
        el.scrollLeft = from + (left - from) * easeOut(p);
        if (p < 1) {
          frame.current = requestAnimationFrame(step);
          return;
        }
        animating.current = false;
        targetIndex.current = null;
        el.style.scrollSnapType = "";
        recenter();
      };
      frame.current = requestAnimationFrame(step);
    },
    [recenter, slideMs],
  );

  /** Move one item forward or back. Quick repeated calls add up. */
  const go = useCallback(
    (dir: 1 | -1) => {
      if (!track.current || !n) return;
      const from = targetIndex.current ?? nearestIndex();
      const next = Math.min(copies * n - 1, Math.max(0, from + dir));
      targetIndex.current = next;
      glide(pos(next));
    },
    [copies, glide, n, nearestIndex, pos],
  );

  /** Hold autoplay for a while after someone moves the carousel themselves. */
  const holdAfterInput = useCallback(() => {
    lastMove.current = performance.now() + IDLE_AFTER_INPUT_MS - autoplayMs;
  }, [autoplayMs]);

  // Start on the first real item, and keep the same item in front when the layout changes size.
  useLayoutEffect(() => {
    const el = track.current;
    if (!el || !n) return;
    jump(pos(middle + logical.current));
    const resize = new ResizeObserver(() => {
      if (!animating.current) jump(pos(middle + logical.current));
    });
    resize.observe(el);
    return () => resize.disconnect();
  }, [jump, middle, n, pos]);

  // Manual swipes and wheel scrolls: once they settle, recenter. (Scroll events also fire for the
  // carousel's own moves, so the autoplay hold is driven by real input events on the track instead.)
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (animating.current) return;
      clearTimeout(idle);
      idle = setTimeout(recenter, 150);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(idle);
    };
  }, [recenter]);

  // Autoplay: only in loop mode, while visible, in a foreground tab, and not hovered or focused.
  useEffect(() => {
    const el = track.current;
    if (!el || !loop || reducedMotion()) return;
    const seen = new IntersectionObserver(([e]) => (hold.current.offscreen = !e.isIntersecting), { threshold: 0.4 });
    seen.observe(el);
    lastMove.current = performance.now();
    const tick = setInterval(() => {
      const h = hold.current;
      if (h.hover || h.focus || h.offscreen || document.hidden || animating.current) {
        // Give a short rest after a hold ends instead of moving the moment the pointer leaves.
        lastMove.current = Math.max(lastMove.current, performance.now() - autoplayMs / 2);
        return;
      }
      if (performance.now() - lastMove.current >= autoplayMs) {
        lastMove.current = performance.now();
        go(1);
      }
    }, 250);
    return () => {
      clearInterval(tick);
      seen.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [autoplayMs, go, loop]);

  const trackProps = {
    ref: track,
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") hold.current.hover = true;
    },
    onPointerLeave: () => {
      hold.current.hover = false;
    },
    onFocus: (e: React.FocusEvent) => {
      if (e.target.matches(":focus-visible")) hold.current.focus = true;
    },
    onBlur: () => {
      hold.current.focus = false;
    },
    onPointerDown: holdAfterInput,
    onTouchStart: holdAfterInput,
    onWheel: (e: React.WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) holdAfterInput();
    },
  };

  return {
    copies,
    /** Copies other than the middle one exist only for the endless loop. */
    isClone: (copy: number) => loop && copy !== 1,
    trackProps,
    prev: () => {
      holdAfterInput();
      go(-1);
    },
    next: () => {
      holdAfterInput();
      go(1);
    },
  };
}
