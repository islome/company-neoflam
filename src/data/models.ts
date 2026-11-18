/**
 * Built-in 3D models for the product gallery's "3D" tab, as parametric "recipes".
 * Models saved in the 3D Studio (/[lang]/studio, stored in Supabase) override these.
 *
 * Neoflam cookware and containers are mostly simple solids: a profile spun
 * around an axis (pots, pans, plates) or a rounded box (containers), plus
 * handles, lids, knobs and clips. So instead of scanning or AI-generating
 * meshes, each product is described by its real size and colours and
 * src/lib/model-builder.ts turns that into a clean, true-to-scale .glb
 * (npm run models writes public/models/<slug>.glb; the Studio builds in the browser).
 *
 * Sizes come from the lineup data where known (a stockpot's height follows
 * from its diameter and volume). Shapes and colours were read from the
 * catalog photos, so these are close stand-ins: measure the real pieces and
 * tune the numbers, or replace a .glb with Neoflam's CAD export (keep the
 * material names and the "LidOpen" animation) when it arrives.
 *
 * This file is imported by the Node build script, so keep it free of
 * runtime imports and path aliases.
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
   * Ready-made .usdz per colour for iPhone AR Quick Look. Without it, model-viewer
   * converts the .glb in the browser when AR opens (slower, and Safari only).
   */
  iosSrc?: Partial<Record<ColorKey, string>>;
};

/** A product's saved model, as listed in the Studio. */
export type StoredModel = ViewerModel & {
  slug: string;
  source: "builtin" | "recipe" | "upload";
  recipe: ModelRecipe | null;
  updatedAt: string | null;
};

export const builtinModelSrc = (slug: string) => `/models/${slug}.glb`;

/**
 * iPhone AR files written next to the .glb by `npm run models`:
 * <slug>.usdz in the first colour, <slug>.<colour>.usdz for the others.
 */
export const builtinUsdzSrc = (slug: string, recipe: ModelRecipe) =>
  Object.fromEntries(
    recipe.colors.map((c, i) => [c.key, `/models/${i === 0 ? slug : `${slug}.${c.key}`}.usdz`]),
  ) as Partial<Record<ColorKey, string>>;

export const recipes: Record<string, ModelRecipe> = {
  retro: {
    shape: { kind: "pot", diameterCm: 22, volumeL: 2.8, handles: "ear", knob: "pebble" },
    palette: { Body: "#e8b8ae", Interior: "#f1d2cb", Handle: "#e8b8ae", Knob: "#e3aea3", Rim: "#efd6cf" },
    colors: [{ key: "pink", hex: "#e8b8ae" }],
    paint: ["Body", "Handle", "Knob"],
    lidAnimation: "LidOpen",
  },
  fika: {
    shape: { kind: "pot", diameterCm: 20, heightCm: 11, handles: "loop", knob: "wood" },
    palette: { Body: "#ece5da", Interior: "#c9a988", Handle: "#ece5da", Rim: "#d8d2c9" },
    colors: [{ key: "cream", hex: "#ece5da" }],
    paint: ["Body", "Handle"],
    lidAnimation: "LidOpen",
  },
  bebe: {
    shape: { kind: "pot", diameterCm: 16, heightCm: 9, handles: "stick", knob: "ball" },
    palette: { Body: "#f2d77e", Interior: "#f6f1e4", Handle: "#e9e4d8", Knob: "#f2d77e", Rim: "#f2d77e" },
    colors: [{ key: "yellow", hex: "#f2d77e" }],
    paint: ["Body", "Knob", "Rim"],
    lidAnimation: "LidOpen",
  },
  danish: {
    shape: { kind: "pot", diameterCm: 20, heightCm: 10, handles: "ear", knob: "ball" },
    palette: { Body: "#f3e2a2", Interior: "#f7efd3", Handle: "#e0583e", Knob: "#e0583e", Rim: "#3c7cc4" },
    colors: [{ key: "multi", hex: "#f3e2a2" }],
    paint: ["Body"],
    lidAnimation: "LidOpen",
  },
  bien: {
    shape: { kind: "pot", diameterCm: 20, heightCm: 10.5, handles: "ear", knob: "wood" },
    palette: { Body: "#f3f1ed", Interior: "#8f8a84", Handle: "#f3f1ed", Rim: "#dedad3" },
    colors: [{ key: "white", hex: "#f3f1ed" }],
    paint: ["Body", "Handle"],
    lidAnimation: "LidOpen",
  },
  "chou-chou": {
    shape: { kind: "pot", diameterCm: 20, heightCm: 10, handles: "loop", knob: "ball" },
    palette: { Body: "#efe5d3", Interior: "#d9c7ab", Handle: "#efe5d3", Knob: "#efe5d3", Rim: "#e2d8c6" },
    colors: [{ key: "cream", hex: "#efe5d3" }],
    paint: ["Body", "Handle", "Knob"],
    lidAnimation: "LidOpen",
  },
  hej: {
    shape: { kind: "pot", diameterCm: 18, heightCm: 10, handles: "stick", knob: "ball" },
    palette: { Body: "#e9b949", Interior: "#f5efe1", Handle: "#e46d8c", Knob: "#4d8fd6", Rim: "#e9b949" },
    colors: [{ key: "multi", hex: "#e9b949" }],
    paint: ["Body", "Rim"],
    lidAnimation: "LidOpen",
  },
  noblesse: {
    shape: { kind: "pot", diameterCm: 24, heightCm: 12, handles: "ear", knob: "metal" },
    palette: { Body: "#1f1e1d", Interior: "#2b2a28", Handle: "#1f1e1d", Knob: "#c9a45c", Rim: "#c9ccce" },
    colors: [{ key: "black", hex: "#1f1e1d" }],
    paint: ["Body", "Handle"],
    lidAnimation: "LidOpen",
  },
  "de-chef": {
    shape: { kind: "pan", diameterCm: 28, depthCm: 5 },
    palette: { Body: "#a5322b", Interior: "#2a2827", Handle: "#1d1c1b", Accent: "#c9ccce" },
    colors: [
      { key: "red", hex: "#a5322b" },
      { key: "black", hex: "#262524" },
    ],
    paint: ["Body"],
  },
  "perfect-seal-m": {
    shape: { kind: "box", widthCm: 18, depthCm: 13, heightCm: 7, clips: true, glass: true },
    palette: { Lid: "#eef1f3", Clip: "#2f3d63", Accent: "#2f3d63" },
    colors: [{ key: "clear", hex: "#eef1f3" }],
    paint: [],
    lidAnimation: "LidOpen",
  },
  glace: {
    shape: { kind: "box", widthCm: 20, depthCm: 15, heightCm: 6.5, clips: true, glass: true },
    palette: { Lid: "#f2f4f5", Clip: "#33406a", Accent: "#33406a" },
    colors: [{ key: "clear", hex: "#f2f4f5" }],
    paint: [],
    lidAnimation: "LidOpen",
  },
  "glace-z": {
    shape: { kind: "box", widthCm: 14, depthCm: 14, heightCm: 8, clips: true, glass: true, tab: true },
    palette: { Lid: "#f2f4f5", Clip: "#33406a", Accent: "#bfc3c7" },
    colors: [{ key: "clear", hex: "#f2f4f5" }],
    paint: [],
    lidAnimation: "LidOpen",
  },
  "fika-one": {
    shape: { kind: "stack", diameterCm: 12, heightCm: 6, tiers: 2 },
    palette: { Body: "#e9e1d4", Lid: "#c8b59b", Accent: "#b9a586" },
    colors: [{ key: "cream", hex: "#e9e1d4" }],
    paint: ["Body"],
    lidAnimation: "LidOpen",
  },
  wavelock: {
    shape: { kind: "box", widthCm: 17, depthCm: 12, heightCm: 6, clips: true, glass: false },
    palette: { Lid: "#e4eef4", Clip: "#d6e6f0", Accent: "#d6e6f0" },
    colors: [{ key: "clear", hex: "#e4eef4" }],
    paint: [],
    lidAnimation: "LidOpen",
  },
  "smart-seal": {
    shape: { kind: "box", widthCm: 10, depthCm: 10, heightCm: 24, clips: false, glass: false, tab: true },
    palette: { Lid: "#f4f2ee", Clip: "#c4302b", Accent: "#c4302b" },
    colors: [{ key: "clear", hex: "#f4f2ee" }],
    paint: [],
    lidAnimation: "LidOpen",
  },
  milan: {
    shape: { kind: "dish", plateCm: 24, bowlCm: 14 },
    palette: { Body: "#f6f4f0", Interior: "#f6f4f0", Rim: "#e4ded4" },
    colors: [{ key: "white", hex: "#f6f4f0" }],
    paint: ["Body", "Interior"],
  },
};
