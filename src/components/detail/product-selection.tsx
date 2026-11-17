"use client";

import { createContext, useContext, useState } from "react";
import type { ColorKey } from "@/data/catalog";

type Selection = { color: ColorKey | null; setColor: (c: ColorKey) => void };

const Ctx = createContext<Selection>({ color: null, setColor: () => {} });

/** Shares the chosen colour between the buy box and the gallery's 3D model. */
export function ProductSelection({ initialColor, children }: { initialColor: ColorKey | null; children: React.ReactNode }) {
  const [color, setColor] = useState<ColorKey | null>(initialColor);
  return <Ctx.Provider value={{ color, setColor }}>{children}</Ctx.Provider>;
}

export const useProductSelection = () => useContext(Ctx);
