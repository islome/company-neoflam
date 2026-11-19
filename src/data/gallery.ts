import type { Product } from "./catalog";

export type GalleryImage = { src: string; fit: "cover" | "contain" };

/** Detail page gallery: the main photo first, then the extra photos uploaded in the Studio. */
export function galleryFor(product: Product): GalleryImage[] {
  return [product.image, ...(product.gallery ?? [])].map((src) => ({ src, fit: "cover" }));
}
