// Renders an episode: data/episodes/<id>.json -> out/<id>.mp4.
//
//   npm run render -- sp01            full quality
//   npm run render -- sp01 --draft    half size, for quick checks

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { FPS, reelLimits } from "../src/lib/timing";
import {
  compositionFor,
  loadEpisode,
  printProblems,
  probeMedia,
  reportMedia,
  requireEpisodeId,
  ROOT,
  run,
  runMain,
  ScriptError,
} from "./lib/common";
import { OUT, outPaths } from "./lib/paths";

const REMOTION_CLI = path.join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");
const DRAFT_SCALE = 0.5;
const AUDIO_BITRATE = "192k";
// Render quality: CRF 18 master; postprocess shrinks it to the size limit.
const CRF = "18";
// Live 3D worlds: each tab holds a WebGL context with shadows and a post
// stack; 6 tabs exhausted this laptop's iGPU (render died at ~55%), and a
// long single run still died late (GPU memory creeps up per tab). So worlds
// render in chunks, each in a fresh browser, video only; the audio is
// rendered once on its own; ffmpeg joins them without re-encoding.
const WORLD_CONCURRENCY = 2;
// 2D reels: 6 tabs also lost their browser midway (sp06 at frame 377), so
// every format renders in chunks; 2D can afford more tabs than WebGL.
const FLAT_CONCURRENCY = 4;
const WORLD_CHUNK_FRAMES = 240;
const CHUNK_RETRIES = 2;

const cli = async (args: string[]): Promise<void> => {
  const { code } = await run(process.execPath, [REMOTION_CLI, ...args]);
  if (code !== 0) {
    throw new ScriptError(`Remotion render failed with exit code ${code}`);
  }
};

const renderInChunks = async (composition: string, output: string, common: string[], concurrency: number): Promise<void> => {
  const dir = `${output}.chunks`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  // Audio first: no WebGL involved, and its length is the composition length
  // from calculateMetadata (VO-driven), which sets the chunk ranges.
  // WAV, not AAC: AAC adds encoder padding, so its duration overstated the
  // composition by a frame (706 read as 707) and the last chunk was out of range.
  const audio = path.join(dir, "audio.wav");
  // The audio pass still steps through every frame in the browser; the flag
  // makes it skip the 3D stage (no WebGL), so it is fast and cannot crash.
  process.env.REMOTION_AUDIO_ONLY = "1";
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        await cli(["render", composition, audio, ...common, "--codec=wav", `--concurrency=${concurrency}`]);
        break;
      } catch (e) {
        if (attempt >= CHUNK_RETRIES) {
          throw e;
        }
        console.log("Audio pass failed, retrying in a fresh browser");
      }
    }
  } finally {
    delete process.env.REMOTION_AUDIO_ONLY;
  }
  const total = Math.round((await probeMedia(audio)).durationInSeconds * FPS);
  const parts: string[] = [];
  for (let from = 0; from < total; from += WORLD_CHUNK_FRAMES) {
    const to = Math.min(total - 1, from + WORLD_CHUNK_FRAMES - 1);
    const part = path.join(dir, `part_${String(parts.length).padStart(3, "0")}.mp4`);
    console.log(`Chunk ${parts.length + 1}: frames ${from}-${to} of ${total}`);
    for (let attempt = 0; ; attempt++) {
      try {
        await cli([
          "render",
          composition,
          part,
          ...common,
          "--codec=h264",
          `--crf=${CRF}`,
          "--muted",
          `--frames=${from}-${to}`,
          `--concurrency=${concurrency}`,
        ]);
        break;
      } catch (e) {
        if (attempt >= CHUNK_RETRIES) {
          throw e;
        }
        console.log(`Chunk ${parts.length + 1} failed, retrying in a fresh browser`);
      }
    }
    parts.push(part);
  }
  const list = path.join(dir, "list.txt");
  writeFileSync(list, parts.map((p) => `file '${p.split(path.sep).join("/")}'`).join("\n"));
  const ff = await run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    list,
    "-i",
    audio,
    "-map",
    "0:v",
    "-map",
    "1:a",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    AUDIO_BITRATE,
    "-movflags",
    "+faststart",
    output,
  ]);
  if (ff.code !== 0) {
    throw new ScriptError(`ffmpeg join failed with exit code ${ff.code}`);
  }
  rmSync(dir, { recursive: true, force: true });
};

const LOAD_TIMEOUT_MS = 120000;

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { draft: { type: "boolean", default: false } },
  });
  const id = requireEpisodeId(positionals, "npm run render -- <id> [--draft]");
  const episode = loadEpisode(id);
  const draft = values.draft;
  const propsFile = outPaths(id).props;
  const output = outPaths(id, draft).rendered;
  mkdirSync(OUT.props, { recursive: true });
  mkdirSync(OUT.produce, { recursive: true });
  writeFileSync(propsFile, `${JSON.stringify({ ...episode, debug: false }, null, 2)}\n`);

  console.log(`Rendering ${episode.id} "${episode.title}"`);
  // The CJK display font loads ~200 subset files from Google Fonts; on a slow
  // connection that took longer than Remotion's default 30 s.
  const common = [`--props=${propsFile}`, `--timeout=${LOAD_TIMEOUT_MS}`, ...(draft ? [`--scale=${DRAFT_SCALE}`] : [])];
  const composition = compositionFor(episode);
  const world = "world" in episode && Boolean(episode.world);
  await renderInChunks(composition, output, common, world ? WORLD_CONCURRENCY : FLAT_CONCURRENCY);
  const problems = reportMedia("Rendered", output, await probeMedia(output), {
    min: reelLimits(episode.format).minSeconds,
    max: reelLimits(episode.format).maxSeconds,
  });
  if (draft) {
    console.log("Draft render: size and quality checks do not apply.");
    return;
  }
  printProblems(problems);
};

runMain(main);
