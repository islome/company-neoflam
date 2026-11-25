/**
 * iPhone AR (AR Quick Look) files for models saved in the Studio. Runs in the browser:
 * the Studio turns the .glb into one .usdz per colour before uploading, so product pages
 * can open the native AR camera straight away (LiDAR iPhones place it instantly).
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
import type { ColorKey } from "@/data/catalog";
import type { ModelRecipe } from "@/data/models";
import { buildUsdz } from "@/lib/studio/model-builder";

// The same decoders <model-viewer> loads for compressed models.
const DRACO_DECODERS = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";
const BASIS_TRANSCODER = "https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/";

async function loadGlb(glb: ArrayBuffer) {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader().setDecoderPath(DRACO_DECODERS);
  const renderer = new THREE.WebGLRenderer();
  const ktx2 = new KTX2Loader().setTranscoderPath(BASIS_TRANSCODER).detectSupport(renderer);
  loader.setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  try {
    return await loader.parseAsync(glb.slice(0), "");
  } finally {
    draco.dispose();
    ktx2.dispose();
    renderer.dispose();
  }
}

const exportUsdz = async (scene: THREE.Object3D) =>
  ((await new USDZExporter().parseAsync(scene, { quickLookCompatible: true })) as Uint8Array<ArrayBuffer>).buffer;

export type ArColor = { key: ColorKey; hex: string };

/**
 * One AR file per distinct look. Colours only differ when some parts are repainted,
 * so without repainted parts every colour shares one file.
 */
export function arGroups(colors: ArColor[], paint: string[]) {
  if (!paint.length || colors.length <= 1) return [{ hex: colors[0]?.hex ?? null, keys: colors.map((c) => c.key) }];
  const byHex = new Map<string, ColorKey[]>();
  for (const c of colors) byHex.set(c.hex.toLowerCase(), [...(byHex.get(c.hex.toLowerCase()) ?? []), c.key]);
  return [...byHex].map(([hex, keys]) => ({ hex, keys }));
}

/** AR files for an uploaded .glb: the repainted parts take each colour, like the 3D viewer's colour switch. */
export async function usdzFromGlb(glb: ArrayBuffer, colors: ArColor[], paint: string[]) {
  const gltf = await loadGlb(glb);
  const files: ArrayBuffer[] = [];
  for (const group of arGroups(colors, paint)) {
    if (group.hex && paint.length) {
      gltf.scene.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        for (const m of [o.material].flat() as THREE.MeshStandardMaterial[]) {
          if (paint.includes(m.name) && m.color) m.color.set(group.hex!);
        }
      });
    }
    files.push(await exportUsdz(gltf.scene));
  }
  return files;
}

/** AR files for a recipe model, built straight from the recipe (keeps its thin walls solid). */
export async function usdzFromRecipe(recipe: ModelRecipe, name: string) {
  const files: ArrayBuffer[] = [];
  for (const group of arGroups(recipe.colors, recipe.paint)) {
    files.push(await buildUsdz(recipe, name, recipe.paint.length && group.hex ? group.hex : undefined));
  }
  return files;
}
