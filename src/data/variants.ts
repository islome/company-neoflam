/** Sizes in a collection (stored on each product, edited in the Studio). */
export const variantTypes = ["saucepan", "stockpot", "lowStockpot", "pressureCooker", "fryingPan", "wok"] as const;
export type VariantType = (typeof variantTypes)[number];

export type Variant = {
  /** Model code as printed by Neoflam. null when the source is unclear. */
  code: string | null;
  type: VariantType;
  sizeCm: number;
  volumeL: number | null;
};
