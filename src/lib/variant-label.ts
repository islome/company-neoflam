import type { Variant } from "@/data/variants";

type Units = { cm: string; litre: string };

/** "22 sm · 2,8 l" style label for a lineup item. */
export function sizeLabel(v: Variant, u: Units) {
  return [`${v.sizeCm} ${u.cm}`, v.volumeL ? `${v.volumeL.toLocaleString("ru-RU")} ${u.litre}` : null]
    .filter(Boolean)
    .join(" · ");
}
