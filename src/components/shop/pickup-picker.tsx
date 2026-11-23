"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Clock, Storefront, X } from "@phosphor-icons/react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import type { Store } from "@/config/site";
import { shop } from "@/lib/shop-store";
import { StoreLocator, storeTitle } from "@/components/stores/store-locator";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  stores: Store[];
  pickup: string | null;
  lang: Locale;
  t: Dictionary["shop"];
  storesT: Dictionary["stores"];
};

/** "Free pickup" block on the bag page, with a dialog to choose the store on a list and map. */
export function PickupPicker({ stores, pickup, lang, t, storesT }: Props) {
  const [open, setOpen] = useState(false);
  const chosen = stores.find((s) => s.id === pickup) ?? null;

  return (
    <section aria-labelledby="pickup-title" className="border-b border-line py-6">
      <h2 id="pickup-title" className="title-3 flex items-center gap-2 text-ink">
        <Storefront weight="duotone" className="size-5" />
        {t.pickupTitle}
      </h2>
      {chosen ? (
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="body-6 text-ink">{storeTitle(chosen, lang, storesT)}</p>
            <p className="body-6 text-ink-soft">{chosen.address}</p>
            <p className="body-6 mt-1 flex items-center gap-2 text-ink-soft">
              <Clock weight="duotone" className="size-4" aria-label={storesT.hours} />
              {chosen.hours}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="title-4 rounded-sm text-ink underline underline-offset-4"
          >
            {t.changeStore}
          </button>
        </div>
      ) : (
        <div className="mt-2">
          <p className="body-6 text-ink-soft">{t.pickupHint}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="title-4 mt-2 rounded-sm text-ink underline underline-offset-4"
          >
            {t.findStore}
          </button>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <PickupDialog
            stores={stores}
            initial={pickup}
            lang={lang}
            t={t}
            storesT={storesT}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function PickupDialog({
  stores,
  initial,
  lang,
  t,
  storesT,
  onClose,
}: {
  stores: Store[];
  initial: string | null;
  lang: Locale;
  t: Dictionary["shop"];
  storesT: Dictionary["stores"];
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial ?? stores[0]?.id ?? "");
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pickup-dialog-title"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }}
        transition={{ duration: 0.5, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92svh] w-full max-w-4xl flex-col rounded-t-3xl bg-white sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <h2 id="pickup-dialog-title" className="heading-5 text-ink">
            {t.pickupDialogTitle}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex size-10 items-center justify-center rounded-full bg-mist text-ink transition-colors duration-300 hover:bg-line"
          >
            <X weight="bold" className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <StoreLocator stores={stores} t={storesT} lang={lang} value={draft} onChange={setDraft} variant="picker" />
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => {
              shop.setPickup(draft);
              onClose();
            }}
            className="button-md rounded-full bg-ink px-8 py-3 text-white transition-[background-color,transform] duration-300 hover:bg-ink/85 active:scale-[0.98]"
          >
            {t.save}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
