// Visual review: the "look at it" step of the production loop. Renders a
// draft (unless --no-render), then pulls the frames that matter out of it:
// for every scene its first frame, the middle of its ink wipe, every cue
// word (on the word and a beat after), its middle and its last frame.
//
//   npm run review -- sp02                 draft render + review sheet
//   npm run review -- sp02 --no-render     reuse out/sp02_draft.mp4
//
// Writes out/<id>_review.jpg (numbered tiles, left to right, top to bottom)
// and out/<id>_review.md: what every tile is, plus the checklist from
// docs/guides/08-QA-HASIL-BERSIH.md to fill in before the final render.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  voAlignmentPath,
  voAudioPath,
  voSidecarSchema,
} from "../src/lib/audio";
import { INK_WIPE } from "../src/lib/brand";
import { splitWords } from "../src/lib/text";
import {
  cueFrame,
  estimateLineSeconds,
  evenWordTimings,
  layoutBeats,
  type VoLine,
} from "../src/lib/timeline";
import { FPS, POP_PACING, secondsToFrames } from "../src/lib/timing";
import {
  popSceneCues,
  sceneCues,
  type AnyEpisode,
  type PopScene,
  type Scene,
} from "../src/schema";
import {
  loadEpisode,
  OUT_DIR,
  probeMedia,
  PUBLIC_DIR,
  rel,
  requireEpisodeId,
  ROOT,
  run,
  runMain,
  ScriptError,
} from "./lib/common";

const USAGE = "npm run review -- <id> [--no-render]";
const TSX_CLI = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
const COLUMNS = 6;
const TILE_WIDTH = 300;
// A beat after a cue word: the move it triggers is mid-flight here.
const AFTER_CUE_FRAMES = 8;
// Frames kept away from a scene's edges so the tile shows that scene.
const EDGE_FRAMES = 3;

type Mark = { frame: number; scene: string; what: string };

// Same measurement as src/metadata.ts, on the file system.
const measureLine = async (
  id: string,
  index: number,
  vo: string,
): Promise<VoLine> => {
  const words = splitWords(vo);
  const audio = path.join(PUBLIC_DIR, voAudioPath(id, index));
  if (!existsSync(audio)) {
    const frames = secondsToFrames(estimateLineSeconds(vo), FPS);
    return {
      voDurationInFrames: frames,
      words: evenWordTimings(words, frames),
    };
  }
  const frames = Math.max(
    1,
    secondsToFrames((await probeMedia(audio)).durationInSeconds, FPS),
  );
  const sidecar = path.join(PUBLIC_DIR, voAlignmentPath(id, index));
  if (existsSync(sidecar)) {
    const parsed = voSidecarSchema.safeParse(
      JSON.parse(readFileSync(sidecar, "utf8")),
    );
    if (
      parsed.success &&
      parsed.data.text === vo &&
      parsed.data.words.length === words.length
    ) {
      return {
        voDurationInFrames: frames,
        words: parsed.data.words.map((w) => ({
          text: w.text,
          startFrame: secondsToFrames(w.startInSeconds, FPS),
          endFrame: secondsToFrames(w.endInSeconds, FPS),
        })),
      };
    }
  }
  return { voDurationInFrames: frames, words: evenWordTimings(words, frames) };
};

const cuesOf = (episode: AnyEpisode, index: number): string[] =>
  episode.format === "popout"
    ? popSceneCues(episode.scenes[index] as PopScene)
    : sceneCues(episode.scenes[index] as Scene);

const marksFor = async (episode: AnyEpisode) => {
  const lines = await Promise.all(
    episode.scenes.map((s, i) => measureLine(episode.id, i, s.vo)),
  );
  const { beats, durationInFrames } = layoutBeats(
    lines,
    FPS,
    episode.format === "popout"
      ? {
          outroHoldSeconds: POP_PACING.outroHoldSeconds,
          minFrames: secondsToFrames(POP_PACING.minSeconds, FPS),
        }
      : {},
  );
  const marks: Mark[] = [];
  episode.scenes.forEach((scene, i) => {
    const beat = beats[i];
    const add = (frame: number, what: string) =>
      marks.push({
        frame: Math.min(durationInFrames - 1, Math.max(0, Math.round(frame))),
        scene: scene.type,
        what,
      });
    add(beat.startFrame + EDGE_FRAMES, "awal scene");
    if (i > 0) {
      add(beat.startFrame + INK_WIPE.frames / 2, "tengah transisi");
    }
    for (const cue of cuesOf(episode, i)) {
      const at = cueFrame(beat, scene.vo, cue);
      add(at, `cue "${cue}"`);
      add(at + AFTER_CUE_FRAMES, `${AFTER_CUE_FRAMES} frame setelah "${cue}"`);
    }
    add((beat.startFrame + beat.endFrame) / 2, "tengah scene");
    add(beat.endFrame - EDGE_FRAMES, "akhir scene");
  });
  const unique = new Map<number, Mark>();
  for (const m of marks.sort((a, b) => a.frame - b.frame)) {
    const seen = unique.get(m.frame);
    unique.set(
      m.frame,
      seen ? { ...seen, what: `${seen.what}, ${m.what}` } : m,
    );
  }
  return { marks: [...unique.values()], durationInFrames };
};

const CHECKLIST = [
  "Semua teks di dalam area aman (tidak menyentuh zona IG)",
  "Tidak ada huruf atau angka terpotong / terbelah",
  "Teks tidak menimpa wajah Shifu Po atau subjek utama",
  "Teks muncul paling lambat 3 frame setelah katanya",
  "Tidak ada frame yang diam total",
  "Transisi tanpa cut keras; scene lama tertutup tinta dulu",
  "Emas dan merah tajam; tepi foto bersih",
  "Hanya warna palet brand",
  "Tidak ada typo; kapitalisasi konsisten",
  "Ukuran dan posisi judul konsisten antar scene",
];

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { "no-render": { type: "boolean", default: false } },
  });
  const id = requireEpisodeId(positionals, USAGE);
  const episode = loadEpisode(id);
  const draft = path.join(OUT_DIR, `${id}_draft.mp4`);

  if (!values["no-render"]) {
    const render = await run(process.execPath, [
      TSX_CLI,
      "scripts/render.ts",
      id,
      "--draft",
    ]);
    if (render.code !== 0) {
      throw new ScriptError("draft render failed");
    }
  }
  if (!existsSync(draft)) {
    throw new ScriptError(`${rel(draft)} not found; run without --no-render`);
  }

  const { marks, durationInFrames } = await marksFor(episode);
  const rows = Math.ceil(marks.length / COLUMNS);
  const select = marks.map((m) => `eq(n\\,${m.frame})`).join("+");
  const sheet = path.join(OUT_DIR, `${id}_review.jpg`);
  const ffmpeg = await run(
    "ffmpeg",
    [
      "-v",
      "error",
      "-y",
      "-i",
      draft,
      "-vf",
      `select=${select},scale=${TILE_WIDTH}:-1,tile=${COLUMNS}x${rows}:padding=6:color=white`,
      "-fps_mode",
      "passthrough",
      "-frames:v",
      "1",
      sheet,
    ],
    { capture: true },
  );
  if (ffmpeg.code !== 0) {
    throw new ScriptError(
      `ffmpeg could not build the sheet:\n${ffmpeg.stderr}`,
    );
  }

  const lines = [
    `# Review visual: ${id} "${episode.title}"`,
    "",
    `Lembar: \`${rel(sheet)}\` (${marks.length} tile, ${COLUMNS} per baris, dibaca kiri ke kanan). Total ${durationInFrames} frame.`,
    "Untuk ukuran penuh: `npm run stills -- " + id + " <frame> --scale 1`.",
    "",
    "| Tile | Frame | Detik | Scene | Yang dicek |",
    "|---|---|---|---|---|",
    ...marks.map(
      (m, i) =>
        `| ${i + 1} | ${m.frame} | ${(m.frame / FPS).toFixed(2)} | ${m.scene} | ${m.what} |`,
    ),
    "",
    "## Checklist (isi sebelum render final)",
    "",
    ...CHECKLIST.map((c) => `- [ ] ${c}`),
    "",
    "## Temuan dan perbaikan",
    "",
    "- ",
    "",
  ];
  const report = path.join(OUT_DIR, `${id}_review.md`);
  writeFileSync(report, lines.join("\n"));
  console.log(`Review sheet: ${rel(sheet)}`);
  console.log(`Review notes: ${rel(report)}`);
};

runMain(main);
