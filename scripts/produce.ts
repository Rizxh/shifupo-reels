// One command from an approved episode file to a publish-ready reel:
// voice over, levels, sound effects, render, loudness, then a QA report
// (file specs, loudness, whisper transcript vs script, frame sheet).
//
//   npm run produce -- sp01                full run -> out/sp01_final.mp4
//   npm run produce -- sp01 --draft        half-size check, no final
//   npm run produce -- sp01 --from render  resume at a step
//
// Without a .env (no ElevenLabs key yet) the reel is produced without voice
// over on estimated timing, and the report says so.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { voAudioPath } from "../src/lib/audio";
import { LOUDNESS_TARGET } from "../src/lib/mix";
import { SFX } from "../src/lib/sfx";
import { splitWords } from "../src/lib/text";
import { REEL } from "../src/lib/timing";
import {
  formatMb,
  loadEpisode,
  missingElevenLabsVars,
  OUT_DIR,
  probeMedia,
  PUBLIC_DIR,
  rel,
  reportMedia,
  requireEpisodeId,
  ROOT,
  run,
  runMain,
  ScriptError,
} from "./lib/common";
import { measureLoudness } from "./lib/loudness";
import { checkVo } from "./lib/voCheck";

const STEPS = [
  "tts",
  "vo-level",
  "sfx",
  "render",
  "postprocess",
  "verify",
] as const;
type Step = (typeof STEPS)[number];

// The render now and then loses its browser tab midway and passes on a
// second try.
const RENDER_RETRIES = 1;
const TSX_CLI = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
const MIN_VO_MATCH = 0.9;
const SHEET_COLUMNS = 7;
const SHEET_FRAME_WIDTH = 270;

const transcriptSchema = z.object({
  words: z.array(z.object({ text: z.string() })),
});

// Runs a step; `retries` re-runs it after a failure before giving up.
const script = async (file: string, args: string[], retries = 0) => {
  for (let attempt = 0; ; attempt++) {
    console.log(`\n> ${file} ${args.join(" ")}`);
    const { code } = await run(process.execPath, [TSX_CLI, file, ...args]);
    if (code === 0) {
      return;
    }
    if (attempt >= retries) {
      throw new ScriptError(
        `${file} failed (exit ${code}). Fix it, then resume with --from.`,
      );
    }
    console.log(`  ${file} failed (exit ${code}); retrying`);
  }
};

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      draft: { type: "boolean", default: false },
      from: { type: "string" },
    },
  });
  const id = requireEpisodeId(
    positionals,
    "npm run produce -- <id> [--draft] [--from <step>]",
  );
  const episode = loadEpisode(id);
  const from = (values.from ?? "tts") as Step;
  if (!STEPS.includes(from)) {
    throw new ScriptError(`--from must be one of: ${STEPS.join(", ")}`);
  }
  const draft = values.draft;
  const wanted = (step: Step) => STEPS.indexOf(step) >= STEPS.indexOf(from);
  // Only whether the ElevenLabs variables are filled in; values never print.
  const hasKey = missingElevenLabsVars().length === 0;

  if (hasKey && wanted("tts")) await script("scripts/tts.ts", [id]);
  const voiced = episode.scenes.every((_, i) =>
    existsSync(path.join(PUBLIC_DIR, voAudioPath(id, i))),
  );
  if (voiced && wanted("vo-level")) await script("scripts/vo-level.ts", [id]);
  if (
    wanted("sfx") &&
    Object.values(SFX).some((f) => !existsSync(path.join(PUBLIC_DIR, f)))
  ) {
    await script("scripts/sfx.ts", []);
  }
  if (wanted("render")) {
    await script(
      "scripts/render.ts",
      [id, ...(draft ? ["--draft"] : [])],
      RENDER_RETRIES,
    );
  }
  if (!draft && wanted("postprocess"))
    await script("scripts/postprocess.ts", [id]);

  const rendered = path.join(OUT_DIR, `${id}${draft ? "_draft" : ""}.mp4`);
  const final = draft ? rendered : path.join(OUT_DIR, `${id}_final.mp4`);
  console.log(`\n> QA ${rel(final)}`);
  if (!existsSync(final)) {
    throw new ScriptError(`${rel(final)} not found`);
  }
  const problems: string[] = [];
  const info = await probeMedia(final);
  if (!draft) {
    problems.push(
      ...reportMedia("Final", final, info, {
        min: REEL.minSeconds,
        max: REEL.maxSeconds,
      }),
    );
  }
  const loudness = await measureLoudness(final);
  if (!draft) {
    if (
      Math.abs(loudness.integratedLufs - LOUDNESS_TARGET.integratedLufs) >
      LOUDNESS_TARGET.toleranceLu
    ) {
      problems.push(
        `loudness ${loudness.integratedLufs.toFixed(1)} LUFS is off target`,
      );
    }
    if (loudness.truePeakDb > LOUDNESS_TARGET.truePeakDb) {
      problems.push(
        `true peak ${loudness.truePeakDb.toFixed(1)} dB is above ${LOUDNESS_TARGET.truePeakDb} dB`,
      );
    }
  }
  let vo: { ratio: number; missing: string[] } | null = null;
  if (voiced && !draft && wanted("verify")) {
    const transcript = path.join(OUT_DIR, `${id}.transcript.json`);
    await script("scripts/transcribe.ts", [
      final,
      "--out",
      transcript,
      "--language",
      "id",
    ]);
    const heard = transcriptSchema
      .parse(JSON.parse(readFileSync(transcript, "utf8")))
      .words.map((w) => w.text);
    vo = checkVo(
      episode.scenes.flatMap((s) => splitWords(s.vo)),
      heard,
    );
    if (vo.ratio < MIN_VO_MATCH) {
      problems.push(
        `whisper heard only ${(vo.ratio * 100).toFixed(0)}% of the script (missing: ${vo.missing.join(", ")})`,
      );
    }
  }

  const sheet = path.join(OUT_DIR, `${id}${draft ? "_draft" : ""}_sheet.jpg`);
  const rows = Math.ceil(info.durationInSeconds / SHEET_COLUMNS);
  const { code } = await run(
    "ffmpeg",
    [
      "-hide_banner",
      "-v",
      "error",
      "-y",
      "-i",
      final,
      "-vf",
      `fps=1,scale=${SHEET_FRAME_WIDTH}:-1,tile=${SHEET_COLUMNS}x${rows}`,
      "-frames:v",
      "1",
      sheet,
    ],
    { capture: true },
  );
  if (code !== 0) {
    problems.push("could not write the frame sheet");
  }

  const report = path.join(OUT_DIR, `${id}${draft ? "_draft" : ""}_report.md`);
  const lines = [
    `# Laporan QA: ${path.basename(final)}`,
    "",
    `- Durasi: ${info.durationInSeconds.toFixed(2)} detik`,
    `- Resolusi: ${info.width}x${info.height}, ${info.videoCodec} + ${info.audioCodec}`,
    `- Ukuran: ${formatMb(info.sizeInBytes)}`,
    `- Loudness: ${loudness.integratedLufs.toFixed(1)} LUFS, true peak ${loudness.truePeakDb.toFixed(1)} dB`,
    voiced
      ? vo
        ? `- Naskah vs suara (whisper): ${(vo.ratio * 100).toFixed(0)}% kata terdengar berurutan${vo.missing.length ? `; tidak terdengar: ${vo.missing.join(", ")}` : ""}`
        : "- Naskah vs suara: tidak dicek (draft)"
      : "- VO: belum ada (isi .env dengan kunci dan voice ElevenLabs, lalu jalankan ulang). Timing memakai perkiraan.",
    `- Lembar frame: ${rel(sheet)}`,
    "",
    problems.length === 0
      ? "Semua cek lolos."
      : ["Masalah:", ...problems.map((p) => `- ${p}`)].join("\n"),
    "",
  ];
  writeFileSync(report, lines.join("\n"));
  console.log(lines.join("\n"));
  if (problems.length > 0) {
    process.exitCode = 1;
  }
};

runMain(main);
