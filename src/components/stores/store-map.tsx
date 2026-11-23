"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { Store } from "@/config/site";

type Pin = Pick<Store, "id" | "lat" | "lng"> & { label: string };

/** Uzbekistan map with one pin per store. The selected pin is highlighted and centred. */
export function StoreMap({
  pins,
  selected,
  onSelect,
  label,
  focusSelected = false,
}: {
  pins: Pin[];
  selected: string;
  onSelect: (id: string) => void;
  label: string;
  /** Open zoomed on the selected pin instead of showing every pin. */
  focusSelected?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedRef.current = selected;
  }, [onSelect, selected]);

  // Leaflet needs `window`, so it is loaded only in the browser.
  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    const placedMarkers = markers.current;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !box.current || map.current) return;

      const m = L.map(box.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      // OpenStreetMap tiles, softened to grey by the container classes below.
      // For heavy production traffic, switch to a keyed tile provider (MapTiler, Stadia, Yandex).
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(m);

      const placed = pins.filter((p) => p.lat !== null && p.lng !== null);
      for (const p of placed) {
        const marker = L.marker([p.lat!, p.lng!], {
          icon: pinIcon(L, p.id === selectedRef.current),
          zIndexOffset: p.id === selectedRef.current ? 1000 : 0,
          title: p.label,
          keyboard: true,
          riseOnHover: true,
        })
          .addTo(m)
          .bindTooltip(p.label, { direction: "top", offset: [0, -36] })
          .on("click", () => onSelectRef.current(p.id));
        markers.current.set(p.id, marker);
      }
      // Rough view of Uzbekistan until the box has a real size; the observer below frames the pins.
      m.setView([41.3, 64.6], 6);
      map.current = m;

      // Re-measure when the box changes size (e.g. a dialog finishing its entrance animation).
      let fitted = false;
      resize = new ResizeObserver(() => {
        m.invalidateSize();
        if (!fitted && placed.length && box.current && box.current.clientWidth > 0) {
          fitted = true;
          const focus = placed.find((p) => p.id === selectedRef.current);
          if (focus && focusSelected) m.setView([focus.lat!, focus.lng!], 13);
          else m.fitBounds(L.latLngBounds(placed.map((p) => [p.lat!, p.lng!])), { padding: [48, 48] });
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
    // Pins come from the server and do not change while the page is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight and zoom to the selected store, but leave the first view showing every pin.
  const firstRun = useRef(true);
  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      markers.current.forEach((marker, id) => {
        marker.setIcon(pinIcon(L, id === selected));
        marker.setZIndexOffset(id === selected ? 1000 : 0);
      });
      const pin = pins.find((p) => p.id === selected);
      if (firstRun.current) {
        firstRun.current = false;
        return;
      }
      if (map.current && pin?.lat != null && pin.lng != null) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        map.current.flyTo([pin.lat, pin.lng], 13, {
          duration: reduce ? 0 : 0.8,
          easeLinearity: 0.2,
        });
      }
    })();
  }, [selected, pins]);

  return (
    <div
      ref={box}
      role="region"
      aria-label={label}
      className="relative z-0 h-full w-full overflow-hidden rounded-3xl bg-mist [&_.leaflet-control-attribution]:text-xs [&_.leaflet-tile-pane]:[filter:grayscale(1)_contrast(0.9)_brightness(1.05)]"
    />
  );
}

function pinIcon(L: typeof import("leaflet"), active: boolean) {
  const size = active ? 44 : 36;
  const fill = active ? "#c71721" : "#141414";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="filter:drop-shadow(0 4px 8px rgba(20,20,20,.25));transition:transform .3s cubic-bezier(.22,1,.36,1)"><path fill="${fill}" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.6" fill="#fff"/></svg>`,
  });
}
