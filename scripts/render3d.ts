// Render a 3D shot with Blender headless into a PNG sequence that Remotion
// scenes play back (docs/core/ASSET-STANDARD.md, 3D tier).
//
//   npm run render3d -- <scene> <name> [--frames 1-120] [--scale 1] [--samples 64]
//     scene: a script in scripts/blender/<scene>.py (e.g. skyline)
//     name:  output folder public/assets/3d/<name>/frame_####.png
//
// Blender path: BLENDER_PATH, or the default Windows install location.

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { PUBLIC_DIR, rel, ROOT, run, runMain, ScriptError } from "./lib/common";

const DEFAULT_BLENDER = "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe";

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      frames: { type: "string", default: "1-120" },
      scale: { type: "string", default: "1" },
      samples: { type: "string", default: "64" },
    },
  });
  const [sceneName, name] = positionals;
  if (!sceneName || !name) {
    throw new ScriptError("Usage: npm run render3d -- <scene> <name> [--frames 1-120] [--scale 1] [--samples 64]");
  }
  const script = path.join(ROOT, "scripts", "blender", `${sceneName}.py`);
  if (!existsSync(script)) {
    throw new ScriptError(`No Blender scene script: ${rel(script)}`);
  }
  const blender = process.env.BLENDER_PATH?.trim() || DEFAULT_BLENDER;
  if (!existsSync(blender)) {
    throw new ScriptError(`Blender not found at ${blender}. Set BLENDER_PATH.`);
  }
  const out = path.join(PUBLIC_DIR, "assets", "3d", name);
  mkdirSync(out, { recursive: true });
  const started = Date.now();
  const { code } = await run(blender, [
    "-b",
    "-P",
    script,
    "--",
    "--out",
    out,
    "--frames",
    values.frames,
    "--scale",
    values.scale,
    "--samples",
    values.samples,
  ]);
  if (code !== 0) {
    throw new ScriptError("Blender render failed");
  }
  console.log(`3D frames in ${rel(out)} (${((Date.now() - started) / 1000).toFixed(0)} s)`);
};

runMain(main);
