/**
 * Builds public/models/<slug>.glb for every built-in recipe in src/data/models.ts,
 * using the same builder as the 3D Studio (src/lib/model-builder.ts), plus the
 * iPhone AR Quick Look files: <slug>.usdz (first colour) and <slug>.<colour>.usdz.
 *
 * Run: npm run models              (all models)
 *      npm run models -- fika retro (only these)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { recipes } from "../src/data/models.ts";
import { buildGlb, buildUsdz } from "../src/lib/model-builder.ts";
import { builtinUsdzSrc } from "../src/data/models.ts";

// GLTFExporter reads Blobs through FileReader, which Node does not ship.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(buf).toString("base64")}`;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
};

const only = process.argv.slice(2);
await mkdir(new URL("../public/models/", import.meta.url), { recursive: true });

for (const [slug, recipe] of Object.entries(recipes)) {
  if (only.length && !only.includes(slug)) continue;
  const glb = await buildGlb(recipe, slug);
  await writeFile(new URL(`../public/models/${slug}.glb`, import.meta.url), Buffer.from(glb));
  const usdz = builtinUsdzSrc(slug, recipe);
  let usdzKb = 0;
  for (const c of recipe.colors) {
    const file = await buildUsdz(recipe, slug, c.hex);
    await writeFile(new URL(`../public${usdz[c.key]}`, import.meta.url), Buffer.from(file));
    usdzKb += file.byteLength / 1024;
  }
  console.log(
    `${slug.padEnd(16)} ${recipe.shape.kind.padEnd(6)} ${(glb.byteLength / 1024).toFixed(0).padStart(4)} KB glb` +
      `  ${usdzKb.toFixed(0).padStart(4)} KB usdz (${recipe.colors.length})`,
  );
}
