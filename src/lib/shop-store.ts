"use client";

import { useSyncExternalStore } from "react";

/**
 * Guest bag and favourites, saved in this browser (localStorage).
 * Swap the persistence for Supabase once accounts exist; the hook API stays the same.
 */

export type BagItem = {
  /** slug plus variant index (and colour), so two sizes or colours of one collection are separate lines. */
  id: string;
  slug: string;
  variant: number | null;
  /** Colour chosen on the product page, when the product comes in several. */
  color?: string;
  qty: number;
};

/** Display details for the "added to bag" popup, captured at the moment of adding. */
export type AddedInfo = {
  name: string;
  image: string;
  subtitle: string;
  at: number;
};

type State = { bag: BagItem[]; favorites: string[]; pickup: string | null; lastAdded: AddedInfo | null };

const KEY = "neoflam-shop-v1";
const MAX_QTY = 10;
const empty: State = { bag: [], favorites: [], pickup: null, lastAdded: null };

let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      state = {
        bag: Array.isArray(parsed.bag) ? parsed.bag : [],
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        pickup: typeof parsed.pickup === "string" ? parsed.pickup : null,
        lastAdded: null,
      };
    }
  } catch {
    // Private mode or blocked storage: start empty, keep working in memory.
  }
}

function commit(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ bag: next.bag, favorites: next.favorites, pickup: next.pickup }));
  } catch {
    // Ignore write failures; state still lives in memory for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  // Keep other tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => {
  load();
  return state;
};
/** null on the server and during hydration, so pages can show a skeleton instead of a false "empty". */
const getServerSnapshot = () => null;

export const itemId = (slug: string, variant: number | null, color?: string) =>
  `${slug}:${variant ?? "-"}${color ? `:${color}` : ""}`;

export const shop = {
  add(slug: string, variant: number | null, info: Omit<AddedInfo, "at">, color?: string) {
    const id = itemId(slug, variant, color);
    const existing = state.bag.find((i) => i.id === id);
    const bag = existing
      ? state.bag.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, i.qty + 1) } : i))
      : [...state.bag, { id, slug, variant, ...(color ? { color } : {}), qty: 1 }];
    commit({ ...state, bag, lastAdded: { ...info, at: Date.now() } });
  },
  setQty(id: string, qty: number) {
    const bag =
      qty <= 0
        ? state.bag.filter((i) => i.id !== id)
        : state.bag.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, qty) } : i));
    commit({ ...state, bag });
  },
  remove(id: string) {
    commit({ ...state, bag: state.bag.filter((i) => i.id !== id) });
  },
  toggleFavorite(slug: string) {
    const favorites = state.favorites.includes(slug)
      ? state.favorites.filter((s) => s !== slug)
      : [...state.favorites, slug];
    commit({ ...state, favorites });
  },
  /** Store chosen for free pickup at checkout. */
  setPickup(storeId: string | null) {
    commit({ ...state, pickup: storeId });
  },
  dismissAdded() {
    commit({ ...state, lastAdded: null });
  },
};

export function useShop() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ready: s !== null,
    bag: s?.bag ?? [],
    favorites: s?.favorites ?? [],
    lastAdded: s?.lastAdded ?? null,
    pickup: s?.pickup ?? null,
    bagCount: (s?.bag ?? []).reduce((n, i) => n + i.qty, 0),
  };
}

export const MAX_BAG_QTY = MAX_QTY;
