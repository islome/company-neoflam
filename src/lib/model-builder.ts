/**
 * Turns a model recipe (see src/data/models.ts) into a 3D scene and a .glb file.
 * Shared by the 3D Studio (in the browser) and scripts/build-models.mjs (in Node),
 * so keep it free of path aliases and browser-only or Node-only APIs.
 * Units are metres so AR shows each piece at its real size.
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
import type { ModelRecipe, Palette, Shape } from "../data/models";

const SEG = 96;
const cm = (n: number) => n / 100;
const v = (r: number, y: number) => new THREE.Vector2(r, y);

type Mats = ReturnType<typeof materials>;
type Built = { group: THREE.Group; clips: THREE.AnimationClip[] };

/* ---------- materials ---------- */

function materials(palette: Palette) {
  const std = (name: string, color: string, opts: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ name, color, roughness: 0.55, side: THREE.DoubleSide, ...opts });
  const clear = (name: string, color: string, opacity: number) =>
    std(name, color, { roughness: 0.05, metalness: 0.1, transparent: true, opacity, depthWrite: false });
  return {
    Body: std("Body", palette.Body ?? "#eeeeee"),
    Interior: std("Interior", palette.Interior ?? "#d8d2c9", { roughness: 0.65 }),
    Handle: std("Handle", palette.Handle ?? palette.Body ?? "#eeeeee"),
    Rim: std("Rim", palette.Rim ?? "#d8d2c9", { roughness: 0.4 }),
    Knob: std("Knob", palette.Knob ?? palette.Body ?? "#eeeeee"),
    Lid: std("Lid", palette.Lid ?? "#f2f2f2", { roughness: 0.45 }),
    Clip: std("Clip", palette.Clip ?? "#333333", { roughness: 0.45 }),
    Accent: std("Accent", palette.Accent ?? "#c9ccce", { roughness: 0.35 }),
    Wood: std("Wood", "#c99a66", { roughness: 0.75 }),
    Metal: std("Metal", palette.Knob ?? "#c9a45c", { roughness: 0.25, metalness: 0.9 }),
    Steel: std("Steel", "#c9ccce", { roughness: 0.25, metalness: 0.9 }),
    Glass: clear("Glass", "#e4ecee", 0.28),
    Clear: clear("Clear", "#e3eef5", 0.38),
  };
}

/* ---------- geometry helpers ---------- */

const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, name: string) =>
  Object.assign(new THREE.Mesh(geo, mat), { name });
const lathe = (points: THREE.Vector2[], mat: THREE.Material, name: string) =>
  mesh(new THREE.LatheGeometry(points, SEG), mat, name);

function roundedRect<T extends THREE.Path>(shape: T, w: number, h: number, r: number): T {
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/** Rounded rectangle slab: width along X, depth along Z, standing on y = 0. */
function slab(w: number, d: number, h: number, r: number, bevel = 0.0015) {
  const geo = new THREE.ExtrudeGeometry(roundedRect(new THREE.Shape(), w, d, r), {
    depth: h,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  return geo;
}

/** Samples a quadratic curve from a to b with control c (profiles of pans and bowls). */
const curve = (a: THREE.Vector2, c: THREE.Vector2, b: THREE.Vector2, steps = 10) =>
  new THREE.QuadraticBezierCurve(a, c, b).getPoints(steps);

/** Lid animation: lift, slide back and tip so the inside shows. */
function lidOpen(lift: number, back: number, tilt = -0.35) {
  const open = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0));
  return new THREE.AnimationClip("LidOpen", 1.2, [
    new THREE.VectorKeyframeTrack("Lid.position", [0, 1.2], [0, 0, 0, 0, lift, -back]),
    new THREE.QuaternionKeyframeTrack("Lid.quaternion", [0, 1.2], [0, 0, 0, 1, ...open.toArray()]),
  ]);
}

/* ---------- parts ---------- */

function knob(type: string, m: Mats, y: number) {
  const g = new THREE.Group();
  if (type === "wood" || type === "metal") {
    g.add(
      lathe(
        [v(0, 0), v(0.011, 0), v(0.0105, 0.0085), v(0.014, 0.0205), v(0.0185, 0.0265), v(0.018, 0.0295), v(0, 0.0305)],
        type === "wood" ? m.Wood : m.Metal,
        "Knob",
      ),
    );
  } else if (type === "pebble") {
    const pebble = mesh(new THREE.SphereGeometry(0.02, 32, 16), m.Knob, "Knob");
    pebble.scale.set(1, 0.5, 0.75);
    pebble.position.y = 0.009;
    g.add(pebble);
  } else {
    g.add(mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.01, 24), m.Knob, "KnobNeck"));
    const ball = mesh(new THREE.SphereGeometry(0.0135, 32, 16), m.Knob, "Knob");
    ball.position.y = 0.019;
    g.add(ball);
  }
  g.position.y = y;
  return g;
}

/** Glass dome lid with a rim, steam vent and knob, on a vessel of radius r and height h. */
function glassLid(r: number, h: number, m: Mats, knobType: string) {
  const lid = new THREE.Group();
  lid.name = "Lid";
  const dome = 0.012 * (r / 0.1);
  lid.add(
    lathe(
      [v(r, h + 0.001), v(r * 0.9, h + dome * 0.3), v(r * 0.6, h + dome * 0.75), v(r * 0.3, h + dome * 0.95), v(0, h + dome)],
      m.Glass,
      "LidGlass",
    ),
  );
  const rim = mesh(new THREE.TorusGeometry(r - 0.0015, 0.0035, 12, SEG), m.Rim, "LidRim");
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h + 0.0015;
  lid.add(rim);
  const vent = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.002, 24), m.Steel, "SteamVent");
  vent.position.set(r * 0.55, h + dome * 0.7, 0);
  lid.add(vent);
  lid.add(knob(knobType, m, h + dome - 0.0005));
  return lid;
}

/** Long handle along +X from the rim, tilted up. */
function stickHandle(m: Mats, length: number, radius: number) {
  const g = new THREE.Group();
  const grip = mesh(new THREE.CapsuleGeometry(radius, length, 8, 24), m.Handle, "Handle");
  grip.rotation.z = -Math.PI / 2;
  grip.position.x = length / 2 + 0.03;
  grip.scale.set(1, 1, 0.8);
  g.add(grip);
  const bracket = mesh(new THREE.CylinderGeometry(radius * 0.55, radius * 0.7, 0.035, 20), m.Steel, "Bracket");
  bracket.rotation.z = -Math.PI / 2;
  bracket.position.x = 0.016;
  g.add(bracket);
  g.rotation.z = 0.18;
  return g;
}

/* ---------- shapes ---------- */

/** Height of a pot: given directly, or from its volume and inner radius. */
export function potHeightCm(s: Extract<Shape, { kind: "pot" }>) {
  if (s.heightCm) return s.heightCm;
  const r = cm(s.diameterCm) / 2 - 0.004;
  return ((s.volumeL ?? 2) / 1000 / (Math.PI * r * r) + 0.005) * 100;
}

function pot(s: Extract<Shape, { kind: "pot" }>, m: Mats): Built {
  const r = cm(s.diameterCm) / 2;
  const wall = 0.004;
  const base = 0.005;
  const h = cm(potHeightCm(s));
  const group = new THREE.Group();

  group.add(
    lathe([v(0, 0), v(r - 0.012, 0), v(r - 0.005, 0.002), v(r - 0.001, 0.007), v(r, 0.018), v(r, h), v(r - wall, h)], m.Body, "Shell"),
  );
  group.add(
    lathe(
      [v(r - wall, h - 0.0002), v(r - wall, 0.018), v(r - wall - 0.003, 0.009), v(r - wall - 0.01, base), v(0, base)],
      m.Interior,
      "Interior",
    ),
  );

  if (s.handles === "loop") {
    const shape = roundedRect(new THREE.Shape(), 0.04, 0.078, 0.01);
    shape.holes.push(roundedRect(new THREE.Path(), 0.02, 0.054, 0.005));
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.008,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      bevelSegments: 3,
      curveSegments: 12,
    });
    geo.center();
    geo.rotateX(-Math.PI / 2);
    for (const side of [-1, 1]) {
      const handle = mesh(geo, m.Handle, "Handle");
      handle.position.set(side * (r + 0.012), h - 0.013, 0);
      group.add(handle);
    }
  } else if (s.handles === "ear") {
    const geo = new THREE.TorusGeometry(0.024, 0.0065, 16, 32, Math.PI);
    geo.rotateX(-Math.PI / 2);
    for (const side of [-1, 1]) {
      const ear = mesh(geo, m.Handle, "Handle");
      ear.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      ear.position.set(side * (r - 0.002), h - 0.016, 0);
      group.add(ear);
    }
  } else {
    const handle = stickHandle(m, 0.15, 0.011);
    handle.position.set(r - 0.004, h - 0.02, 0);
    group.add(handle);
  }

  group.add(glassLid(r, h, m, s.knob));
  const scale = r / 0.1;
  return { group, clips: [lidOpen(0.075 * scale, 0.045 * scale)] };
}

function pan(s: Extract<Shape, { kind: "pan" }>, m: Mats): Built {
  const r = cm(s.diameterCm) / 2;
  const depth = cm(s.depthCm);
  const rb = r * (s.wok ? 0.4 : 0.74);
  const wall = 0.004;
  const group = new THREE.Group();
  const outer = curve(v(rb, 0), v(r * 0.97, 0.001), v(r, depth));
  group.add(lathe([v(0, 0), ...outer, v(r - wall, depth)], m.Body, "Shell"));
  const inner = curve(v(r - wall, depth - 0.0002), v(r * 0.97 - wall, wall + 0.001), v(rb - wall, wall)).concat([v(0, wall)]);
  group.add(lathe(inner, m.Interior, "Interior"));
  const handle = stickHandle(m, 0.17, 0.012);
  handle.position.set(r - 0.006, depth - 0.012, 0);
  group.add(handle);
  return { group, clips: [] };
}

function box(s: Extract<Shape, { kind: "box" }>, m: Mats): Built {
  const w = cm(s.widthCm);
  const d = cm(s.depthCm);
  const h = cm(s.heightCm);
  const corner = Math.min(w, d) * 0.12;
  const group = new THREE.Group();
  let bodyMat: THREE.MeshStandardMaterial = m.Clear;
  if (s.glass) {
    bodyMat = m.Glass.clone();
    bodyMat.name = "Glass";
    bodyMat.opacity = 0.35;
  }
  group.add(mesh(slab(w, d, h - 0.01, corner), bodyMat, "Container"));

  const lid = new THREE.Group();
  lid.name = "Lid";
  const panel = mesh(slab(w + 0.006, d + 0.006, 0.011, corner + 0.003), m.Lid, "LidPanel");
  panel.position.y = h - 0.01;
  lid.add(panel);
  // A silicone seal line under the lid.
  const seal = mesh(slab(w + 0.001, d + 0.001, 0.002, corner, 0), m.Accent, "Seal");
  seal.position.y = h - 0.0115;
  lid.add(seal);

  if (s.clips) {
    // Locking flaps folded down over the outside of each wall.
    const clip = (len: number, x: number, z: number, rotY: number) => {
      const c = mesh(slab(len, 0.005, 0.026, 0.002, 0.001), m.Clip, "Clip");
      c.rotation.y = rotY;
      c.position.set(x, h - 0.024, z);
      lid.add(c);
    };
    clip(w * 0.35, 0, d / 2 + 0.006, 0);
    clip(w * 0.35, 0, -d / 2 - 0.006, Math.PI);
    clip(d * 0.35, w / 2 + 0.006, 0, Math.PI / 2);
    clip(d * 0.35, -w / 2 - 0.006, 0, -Math.PI / 2);
  }
  if (s.tab) {
    const tab = mesh(slab(Math.min(w, 0.05) * 0.7, 0.022, 0.008, 0.006), m.Accent, "Tab");
    tab.position.y = h + 0.002;
    lid.add(tab);
  }
  group.add(lid);
  return { group, clips: [lidOpen(0.06, 0.04, -0.3)] };
}

function stack(s: Extract<Shape, { kind: "stack" }>, m: Mats): Built {
  const r = cm(s.diameterCm) / 2;
  const th = cm(s.heightCm);
  const group = new THREE.Group();
  for (let i = 0; i < s.tiers; i++) {
    const y = i * (th + 0.002);
    group.add(
      lathe(
        [v(0, y), v(r - 0.006, y), v(r, y + 0.006), v(r, y + th), v(r - 0.004, y + th), v(r - 0.004, y + 0.008), v(0, y + 0.008)],
        m.Body,
        `Tier${i + 1}`,
      ),
    );
  }
  const top = s.tiers * (th + 0.002) - 0.002;
  const lid = new THREE.Group();
  lid.name = "Lid";
  lid.add(
    lathe([v(0, top), v(r + 0.002, top), v(r + 0.002, top + 0.012), v(r - 0.004, top + 0.015), v(0, top + 0.015)], m.Lid, "LidPanel"),
  );
  const ring = mesh(new THREE.TorusGeometry(0.018, 0.003, 12, 48), m.Accent, "LidRing");
  ring.rotation.x = Math.PI / 2;
  ring.position.y = top + 0.016;
  lid.add(ring);
  group.add(lid);
  return { group, clips: [lidOpen(0.05, 0.03)] };
}

function dish(s: Extract<Shape, { kind: "dish" }>, m: Mats): Built {
  const r = cm(s.plateCm) / 2;
  const b = cm(s.bowlCm) / 2;
  const group = new THREE.Group();
  group.add(
    lathe(
      [v(0, 0), v(r * 0.55, 0), v(r * 0.6, 0.004), v(r * 0.92, 0.013), v(r, 0.02), v(r - 0.004, 0.021), v(r * 0.9, 0.0145), v(r * 0.58, 0.0075), v(0, 0.0075)],
      m.Body,
      "Plate",
    ),
  );
  const y = 0.0075;
  group.add(
    lathe(
      [
        v(0, y),
        v(b * 0.4, y),
        v(b * 0.45, y + 0.004),
        ...curve(v(b * 0.5, y + 0.006), v(b * 0.95, y + 0.012), v(b, y + 0.065)),
        v(b - 0.004, y + 0.065),
        ...curve(v(b - 0.005, y + 0.064), v(b * 0.9, y + 0.014), v(b * 0.42, y + 0.009)),
        v(0, y + 0.009),
      ],
      m.Interior,
      "Bowl",
    ),
  );
  return { group, clips: [] };
}

/** Whether a shape kind comes with an opening lid. */
export const hasLid = (kind: Shape["kind"]) => kind === "pot" || kind === "box" || kind === "stack";

/** Builds the scene and animations for a recipe. */
export function buildScene(recipe: ModelRecipe, name = "model") {
  const m = materials(recipe.palette);
  const s = recipe.shape;
  const built =
    s.kind === "pot" ? pot(s, m) : s.kind === "pan" ? pan(s, m) : s.kind === "box" ? box(s, m) : s.kind === "stack" ? stack(s, m) : dish(s, m);
  built.group.name = name;
  const scene = new THREE.Scene();
  scene.add(built.group);
  return { scene, clips: built.clips };
}

/** Builds a recipe into a binary glTF (.glb). */
export async function buildGlb(recipe: ModelRecipe, name?: string): Promise<ArrayBuffer> {
  const { scene, clips } = buildScene(recipe, name);
  const glb = await new GLTFExporter().parseAsync(scene, { binary: true, animations: clips });
  return glb as ArrayBuffer;
}

/**
 * USDZ only has one-sided surfaces, but the thin walls here (pot shells, glass lids, pans)
 * are single lathed sheets drawn double-sided. Give each such mesh a mirrored back face so iPhone AR
 * shows the inside of a pot instead of seeing through it.
 */
function addBackFaces(root: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    // Only lathed profiles are open sheets; spheres, tori, capsules and extrusions are closed.
    if (o instanceof THREE.Mesh && o.geometry.type === "LatheGeometry") meshes.push(o);
  });
  for (const front of meshes) {
    const geo = (front.geometry as THREE.BufferGeometry).clone();
    const index = geo.index;
    if (index) {
      const a = index.array;
      for (let i = 0; i < a.length; i += 3) [a[i + 1], a[i + 2]] = [a[i + 2], a[i + 1]];
    } else {
      // Swap the 2nd and 3rd vertex of every triangle in each attribute.
      for (const attr of Object.values(geo.attributes) as THREE.BufferAttribute[]) {
        const a = attr.array;
        const n = attr.itemSize;
        for (let t = 0; t < attr.count; t += 3) {
          for (let k = 0; k < n; k++) {
            const i1 = (t + 1) * n + k;
            const i2 = (t + 2) * n + k;
            [a[i1], a[i2]] = [a[i2], a[i1]];
          }
        }
      }
    }
    const normal = geo.getAttribute("normal") as THREE.BufferAttribute | undefined;
    if (normal) for (let i = 0; i < normal.array.length; i++) normal.array[i] = -normal.array[i];
    const back = new THREE.Mesh(geo, front.material);
    back.name = `${front.name}Back`;
    back.position.copy(front.position);
    back.quaternion.copy(front.quaternion);
    back.scale.copy(front.scale);
    front.parent?.add(back);
  }
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) (o.material as THREE.Material).side = THREE.FrontSide;
  });
}

/**
 * Builds a recipe into a .usdz for iPhone AR Quick Look (true size, sits on a table or floor;
 * LiDAR iPhones place it instantly). `colorHex` repaints the recipe's colour-switch materials.
 * The lid stays closed: Quick Look files carry no glTF animations.
 */
export async function buildUsdz(recipe: ModelRecipe, name?: string, colorHex?: string): Promise<ArrayBuffer> {
  const palette: Palette = { ...recipe.palette };
  if (colorHex) for (const key of recipe.paint) palette[key] = colorHex;
  const { scene } = buildScene({ ...recipe, palette }, name);
  addBackFaces(scene);
  scene.updateMatrixWorld(true);
  const usdz = await new USDZExporter().parseAsync(scene, { quickLookCompatible: true });
  return (usdz as Uint8Array<ArrayBuffer>).buffer as ArrayBuffer;
}
