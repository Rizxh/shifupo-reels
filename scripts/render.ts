// Renders an episode: data/episodes/<id>.json -> out/<id>.mp4.
//
//   npm run render -- sp01            full quality
//   npm run render -- sp01 --draft    half size, for quick checks

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { REEL } from "../src/lib/timing";
import {
  compositionFor,
  loadEpisode,
  OUT_DIR,
  printProblems,
  probeMedia,
  reportMedia,
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
const DRAFT_SCALE = 0.5;
const AUDIO_BITRATE = "192k";
// Render quality: CRF 18 master; postprocess shrinks it to the size limit.
const CRF = "18";

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { draft: { type: "boolean", default: false } },
  });
  const id = requireEpisodeId(positionals, "npm run render -- <id> [--draft]");
  const episode = loadEpisode(id);
  const draft = values.draft;
  const propsDir = path.join(OUT_DIR, ".props");
  const propsFile = path.join(propsDir, `${id}.json`);
  const output = path.join(OUT_DIR, `${id}${draft ? "_draft" : ""}.mp4`);
  mkdirSync(propsDir, { recursive: true });
  writeFileSync(
    propsFile,
    `${JSON.stringify({ ...episode, debug: false }, null, 2)}\n`,
  );

  console.log(`Rendering ${episode.id} "${episode.title}"`);
  const { code } = await run(process.execPath, [
    REMOTION_CLI,
    "render",
    compositionFor(episode),
    output,
    `--props=${propsFile}`,
    "--codec=h264",
    `--crf=${CRF}`,
    "--audio-codec=aac",
    `--audio-bitrate=${AUDIO_BITRATE}`,
    ...(draft ? [`--scale=${DRAFT_SCALE}`] : []),
  ]);
  if (code !== 0) {
    throw new ScriptError(`Remotion render failed with exit code ${code}`);
  }
  const problems = reportMedia("Rendered", output, await probeMedia(output), {
    min: REEL.minSeconds,
    max: REEL.maxSeconds,
  });
  if (draft) {
    console.log("Draft render: size and quality checks do not apply.");
    return;
  }
  printProblems(problems);
};

runMain(main);
