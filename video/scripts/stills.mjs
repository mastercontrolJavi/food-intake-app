// Render a list of stills from one bundle.  node scripts/stills.mjs <Composition> <outDir> <frame> [frame...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import fs from "node:fs";
import path from "node:path";

const [comp, outDir, ...frames] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), webpackOverride: (c) => enableTailwind(c) });
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable: fs.existsSync(browserExecutable) ? browserExecutable : undefined });
for (const f of frames) {
  const out = path.join(outDir, `${comp}-f${String(f).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, frame: Number(f), output: out, browserExecutable: fs.existsSync(browserExecutable) ? browserExecutable : undefined, chromiumOptions: { gl: "swangle" } });
  console.log(out);
}
