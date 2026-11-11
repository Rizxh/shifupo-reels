// Renders single frames of an episode for visual checks, and tiles them into
// one contact sheet.
//
//   npm run stills -- sp01 30 120 300          frames 30, 120, 300
//   npm run stills -- sp01 --every 15          every 15th frame
//   npm run stills -- sp01 --every 15 --scale 0.5

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  compositionFor,
  loadEpisode,
  OUT_DIR,
  rel,
  requireEpisodeId,
  ROOT,
  run,
  runMain,
  ScriptError,
} from "./lib/common";

const REMOTION_CLI = path.join(
  ROOT,
  "node_modules",
  "@remotion",
  "cli",
  "remotion-cli.js",
);
const SHEET_COLUMNS = 6;
const SHEET_TILE_WIDTH = 240;

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      every: { type: "string" },
      scale: { type: "string", default: "0.5" },
      duration: { type: "string" },
    },
  });
  const id = requireEpisodeId(
    positionals,
    "npm run stills -- <id> [frames...] [--every n] [--scale s]",
  );
  const episode = loadEpisode(id);
  const dir = path.join(OUT_DIR, "stills", id);
  mkdirSync(dir, { recursive: true });
  const propsFile = path.join(OUT_DIR, ".props", `${id}-stills.json`);
  mkdirSync(path.dirname(propsFile), { recursive: true });
  writeFileSync(propsFile, JSON.stringify({ ...episode, debug: false }));

  let frames = positionals.slice(1).map(Number);
  if (values.every) {
    // A sequence render is far faster than one process per frame.
    const every = Number(values.every);
    const { code } = await run(process.execPath, [
      REMOTION_CLI,
      "render",
      compositionFor(episode),
      path.join(dir, "seq"),
      `--props=${propsFile}`,
      "--sequence",
      // Frames only: skip audio mixing.
      "--muted",
      "--image-format=jpeg",
      `--scale=${values.scale}`,
      `--every-nth-frame=${every}`,
    ]);
    if (code !== 0) {
      throw new ScriptError("Remotion sequence render failed");
    }
    const sheet = path.join(OUT_DIR, `${id}_frames.jpg`);
    const tile = await run(
      "ffmpeg",
      [
        "-hide_banner",
        "-v",
        "error",
        "-y",
        "-pattern_type",
        "glob",
        "-i",
        path.join(dir, "seq", "*.jpeg").replace(/\\/g, "/"),
        "-vf",
        `scale=${SHEET_TILE_WIDTH}:-1,tile=${SHEET_COLUMNS}x8`,
        sheet,
      ],
      { capture: true },
    );
    if (tile.code !== 0) {
      console.warn(
        "Could not tile the sheet (ffmpeg glob support); frames are in",
        rel(path.join(dir, "seq")),
      );
    } else {
      console.log(`Sheet: ${rel(sheet)}`);
    }
    frames = [];
  }
  for (const f of frames) {
    if (!Number.isInteger(f)) {
      throw new ScriptError(`Bad frame number: ${f}`);
    }
    const out = path.join(dir, `f${f}.jpg`);
    const { code } = await run(process.execPath, [
      REMOTION_CLI,
      "still",
      compositionFor(episode),
      out,
      `--frame=${f}`,
      `--props=${propsFile}`,
      `--scale=${values.scale}`,
      "--image-format=jpeg",
      "--log=error",
    ]);
    if (code !== 0) {
      throw new ScriptError(`Still render failed at frame ${f}`);
    }
    console.log(`  ${rel(out)}`);
  }
};

runMain(main);
