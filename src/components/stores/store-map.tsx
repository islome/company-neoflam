"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import type { Store } from "@/config/site";

type Pin = Pick<Store, "id" | "lat" | "lng"> & { label: string };

/** Hints shown when a one finger drag or a plain scroll would move the page, not the map. */
export type GestureHints = { windows: string; mac: string; mobile: string };

// Free vector tiles, no API key. Light grey style to match the site.
// Docs: https://openfreemap.org — swap the URL for MapTiler or Stadia if you ever need an SLA.
const STYLE_URL = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

/**
 * Uzbekistan map with one pin per store. The selected pin is highlighted and centred.
 * Pinch (phone), trackpad pinch or Ctrl/⌘ + scroll (desktop) zooms; a single finger keeps scrolling the page.
 */
export function StoreMap({
  pins,
  selected,
  onSelect,
  label,
  gestures,
  dark = false,
  focusSelected = false,
}: {
  pins: Pin[];
  selected: string;
  onSelect: (id: string) => void;
  label: string;
  gestures: GestureHints;
  /** Dark basemap with white pins, for black sections. */
  dark?: boolean;
  /** Open zoomed on the selected pin instead of showing every pin. */
  focusSelected?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedRef.current = selected;
  }, [onSelect, selected]);

  // MapLibre needs `window` and WebGL, so it is loaded only in the browser.
  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    const placedMarkers = markers.current;
    (async () => {
      const { default: maplibregl } = await import("maplibre-gl");
      if (cancelled || !box.current || map.current) return;

      const m = new maplibregl.Map({
        container: box.current,
        style: STYLE_URL[dark ? "dark" : "light"],
        center: [64.6, 41.3],
        zoom: 5,
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: { compact: true },
        locale: {
          "CooperativeGesturesHandler.WindowsHelpText": gestures.windows,
          "CooperativeGesturesHandler.MacHelpText": gestures.mac,
          "CooperativeGesturesHandler.MobileHelpText": gestures.mobile,
        },
      });
      // The OpenFreeMap styles reference a few sprite icons (e.g. "circle-11", "wood-pattern") that
      // their sprite sheet doesn't ship. Fill each with a transparent pixel so MapLibre stops warning.
      m.on("styleimagemissing", (e) => {
        if (!m.hasImage(e.id)) m.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
      });
      m.touchZoomRotate.disableRotation();
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.current = m;

      const placed = pins.filter((p) => p.lat !== null && p.lng !== null);
      for (const p of placed) {
        const el = document.createElement("button");
        el.type = "button";
        el.title = p.label;
        el.setAttribute("aria-label", p.label);
        el.className = "cursor-pointer border-0 bg-transparent p-0";
        paintPin(el, p.id === selectedRef.current, dark);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current(p.id);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([p.lng!, p.lat!]).addTo(m);
        placedMarkers.set(p.id, marker);
      }

      // Frame the pins once the box has a real size (e.g. after a dialog finishes its entrance animation).
      let fitted = false;
      resize = new ResizeObserver(() => {
        m.resize();
        if (fitted || !placed.length || !box.current || box.current.clientWidth === 0) return;
        fitted = true;
        const focus = placed.find((p) => p.id === selectedRef.current);
        if (focus && focusSelected) {
          m.jumpTo({ center: [focus.lng!, focus.lat!], zoom: 14 });
        } else if (placed.length === 1) {
          m.jumpTo({ center: [placed[0].lng!, placed[0].lat!], zoom: 13 });
        } else {
          const bounds = new maplibregl.LngLatBounds();
          placed.forEach((p) => bounds.extend([p.lng!, p.lat!]));
          m.fitBounds(bounds, { padding: 56, maxZoom: 13, animate: false });
        }
      });
      resize.observe(box.current);
    })();
    return () => {
      cancelled = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      placedMarkers.clear();
    };
    // Pins and copy come from the server and do not change while the page is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight and fly to the selected store, but leave the first view showing every pin.
  const firstRun = useRef(true);
  useEffect(() => {
    markers.current.forEach((marker, id) => paintPin(marker.getElement(), id === selected, dark));
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const pin = pins.find((p) => p.id === selected);
    if (map.current && pin?.lat != null && pin.lng != null) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      map.current.flyTo({ center: [pin.lng, pin.lat], zoom: 14, duration: reduce ? 0 : 900, essential: false });
    }
  }, [selected, pins, dark]);

  return (
    <div
      ref={box}
      role="region"
      aria-label={label}
      className={`relative z-0 h-full w-full overflow-hidden rounded-3xl ${dark ? `bg-carbon ${DARK_CONTROLS}` : "bg-mist"} [&_.maplibregl-ctrl-attrib]:text-xs [&_.maplibregl-cooperative-gesture-screen]:font-sans`}
    />
  );
}

// MapLibre's controls are white by default; recolour them for the dark map.
const DARK_CONTROLS = [
  "[&_.maplibregl-ctrl-group]:bg-graphite!",
  "[&_.maplibregl-ctrl-group]:shadow-none!",
  "[&_.maplibregl-ctrl-group_button+button]:border-white/10!",
  "[&_.maplibregl-ctrl-icon]:invert",
  "[&_.maplibregl-ctrl-attrib]:bg-carbon/80!",
  "[&_.maplibregl-ctrl-attrib]:text-white/60!",
  "[&_.maplibregl-ctrl-attrib_a]:text-white/70!",
  "[&_.maplibregl-ctrl-attrib-button]:invert",
].join(" ");

function paintPin(el: HTMLElement, active: boolean, dark: boolean) {
  const size = active ? 44 : 36;
  // Inactive pins are black on the light map and white on the dark one; the selected pin is always brand red.
  const fill = active ? "#c71721" : dark ? "#ffffff" : "#141414";
  const dot = !active && dark ? "#141414" : "#fff";
  el.style.zIndex = active ? "2" : "1";
  el.setAttribute("aria-pressed", String(active));
  el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="display:block;filter:drop-shadow(0 4px 8px rgba(20,20,20,.25))"><path fill="${fill}" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.6" fill="${dot}"/></svg>`;
}
