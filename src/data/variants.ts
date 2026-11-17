/**
 * Items in each collection, from the lineup slides on the global catalog.
 * Only Retro is filled so far; collections without entries show a
 * "lineup coming soon" note on the detail page.
 */
export const variantTypes = ["saucepan", "stockpot", "lowStockpot", "pressureCooker", "fryingPan", "wok"] as const;
export type VariantType = (typeof variantTypes)[number];

export type Variant = {
  /** Model code as printed by Neoflam. null when the source is unclear. */
  code: string | null;
  type: VariantType;
  sizeCm: number;
  volumeL: number | null;
};

export const variants: Record<string, Variant[]> = {
  retro: [
    { code: "EK-RD-S18", type: "saucepan", sizeCm: 18, volumeL: 1.8 },
    { code: "EK-RD-C18", type: "stockpot", sizeCm: 18, volumeL: 1.6 },
    { code: "EK-RD-C22", type: "stockpot", sizeCm: 22, volumeL: 2.8 },
    { code: "EK-RD-C24", type: "stockpot", sizeCm: 24, volumeL: null },
    { code: "EK-RD-C26", type: "stockpot", sizeCm: 26, volumeL: 5.0 },
    // The source slide prints the 28 cm stockpot with the 22 cm code, so it is left blank.
    { code: null, type: "stockpot", sizeCm: 28, volumeL: null },
    { code: "EK-RD-L22", type: "lowStockpot", sizeCm: 22, volumeL: 2.0 },
    { code: "EK-RD-L26", type: "lowStockpot", sizeCm: 26, volumeL: 3.3 },
    { code: "EK-RP-L26", type: "pressureCooker", sizeCm: 26, volumeL: 6.2 },
    { code: "EK-RT-F24", type: "fryingPan", sizeCm: 24, volumeL: null },
    { code: "EK-RT-F28", type: "fryingPan", sizeCm: 28, volumeL: null },
    { code: "EK-RT-W26", type: "wok", sizeCm: 26, volumeL: null },
  ],
};
