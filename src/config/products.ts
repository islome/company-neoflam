import type { StaticImageData } from "next/image";
import pots from "../../public/images/products/pots-window.jpg";
import pans from "../../public/images/products/frying-pan-closeup.jpg";
import deep from "../../public/images/products/deep-pans-table.jpg";

export type CategoryKey = "pots" | "pans" | "deep";

/** Product categories in display order, each with its photo. */
export const categories: { key: CategoryKey; image: StaticImageData }[] = [
  { key: "pots", image: pots },
  { key: "pans", image: pans },
  { key: "deep", image: deep },
];
