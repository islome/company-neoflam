"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image for product photos, with a friendly fallback: if the photo can't load
 * (weak connection, missing file), a 🥘 sits in the middle of the frame instead of
 * the browser's broken-image "?" icon. Use it like next/image with `fill`; the parent
 * provides the size and background.
 */
export function ProductImage({ onError, alt, ...props }: ImageProps) {
  // Remember which src failed, so a new src gets a fresh try.
  const [failed, setFailed] = useState<ImageProps["src"] | null>(null);

  if (failed === props.src) {
    return (
      <span role="img" aria-label={alt} className="absolute inset-0 [container-type:size]">
        <span aria-hidden className="grid size-full place-items-center text-[28cqmin] leading-none select-none">
          🥘
        </span>
      </span>
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      onError={(e) => {
        setFailed(props.src);
        onError?.(e);
      }}
    />
  );
}
