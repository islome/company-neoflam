/**
 * 3D model types for product pages and the Studio (/[lang]/studio).
 *
 * Neoflam cookware and containers are mostly simple solids: a profile spun
 * around an axis (pots, pans, plates) or a rounded box (containers), plus
 * handles, lids, knobs and clips. The Studio can build a true-to-scale .glb
 * from a "recipe" (src/lib/model-builder.ts), or take an uploaded .glb.
 * Saved models live in Supabase (product_models table, models bucket),
 * together with their iPhone AR (.usdz) files.
 */
import type { ColorKey } from "./catalog";

type Knob = "wood" | "pebble" | "ball" | "metal";

export type Shape =
  /** Stockpot or saucepan. Height comes from `volumeL` when given. */
  | {
      kind: "pot";
      diameterCm: number;
      heightCm?: number;
      volumeL?: number;
      handles: "loop" | "ear" | "stick";
      knob: Knob;
    }
  /** Frying pan or wok with a long handle and flared walls. */
  | { kind: "pan"; diameterCm: number; depthCm: number; wok?: boolean }
  /** Rectangular or square container with a locking lid. */
  | {
      kind: "box";
      widthCm: number;
      depthCm: number;
      heightCm: number;
      clips: boolean;
      /** Glass (true) or tinted clear plastic (false) body. */
      glass: boolean;
      /** A small vent tab on top of the lid. */
      tab?: boolean;
    }
  /** Round stacking containers. */
  | { kind: "stack"; diameterCm: number; heightCm: number; tiers: number }
  /** Plate with a bowl standing on it. */
  | { kind: "dish"; plateCm: number; bowlCm: number };

/** Base colour of each material role. Missing roles fall back to sensible defaults. */
export type Palette = Partial<
  Record<"Body" | "Interior" | "Handle" | "Rim" | "Knob" | "Lid" | "Clip" | "Accent", string>
>;

export type ModelRecipe = {
  shape: Shape;
  palette: Palette;
  /** Colours the viewer can switch between (from the catalog). The first matches the palette. */
  colors: { key: ColorKey; hex: string }[];
  /** Materials the colour switcher repaints. */
  paint: (keyof Palette)[];
  /** Name of the glTF animation that opens the lid, if the model has a lid. */
  lidAnimation?: "LidOpen";
};

/** What the product page's 3D viewer needs, whether the model came from a recipe or an upload. */
export type ViewerModel = {
  src: string;
  colors: { key: ColorKey; hex: string }[];
  /** Material names the colour switcher repaints. */
  paint: string[];
  lidAnimation?: string;
  /**
   * Ready-made .usdz per colour key ("default" when there are no colour options) for
   * iPhone AR Quick Look. Without it, model-viewer converts the .glb in the browser
   * when AR opens (slower, and Safari only).
   */
  iosSrc?: Partial<Record<ColorKey | "default", string>>;
};

/** A product's saved model, as listed in the Studio. */
export type StoredModel = ViewerModel & {
  slug: string;
  source: "recipe" | "upload";
  recipe: ModelRecipe | null;
  updatedAt: string | null;
};
