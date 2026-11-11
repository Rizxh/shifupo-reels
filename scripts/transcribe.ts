// Transcribes a talking-head clip locally with whisper.cpp (nothing is
// uploaded) and writes word-level timestamps in source seconds:
//
//   npm run transcribe -- "<clip.mp4>" --out data/talking-head/<slug>.transcript.json
//   npm run transcribe -- "<clip.mp4>" --range 18.89-31.8 --range 32.4-35.5 --out ...
//
// Each --range is transcribed on its own: short clean clips give much tighter
// word timing than one long take, and dead air before the take is skipped.
// whisper.cpp and the model are installed once into .whisper/ (gitignored).

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  downloadWhisperModel,
  installWhisperCpp,
} from "@remotion/install-whisper-cpp";
import { z } from "zod";
import { OUT_DIR, ROOT, run, runMain, ScriptError } from "./lib/common";

// Self-contained: the first run downloads whisper.cpp and the ~1.6 GB model
// into this project's .whisper/.
const WHISPER_DIR = path.join(ROOT, ".whisper");
const WHISPER_VERSION = "1.7.6";
const WHISPER_MODEL = "large-v3-turbo";
const SAMPLE_RATE = 16000;
const USAGE =
  'npm run transcribe -- "<clip.mp4>" [--range from-to ...] [--out file.json] [--language id]';

const round = (s: number) => Math.round(s * 1000) / 1000;

// The part of whisper-cli's -oj output we use.
const whisperJsonSchema = z.object({
  transcription: z.array(
    z.object({
      text: z.string(),
      offsets: z.object({ from: z.number(), to: z.number() }),
    }),
  ),
});

type Range = { from: number; to?: number };
type Word = { text: string; start: number; end: number };

const parseRange = (value: string): Range => {
  const [from, to] = value.split("-").map(Number);
  if (!Number.isFinite(from) || !Number.isFinite(to) || !(to > from)) {
    throw new ScriptError(`Bad --range "${value}", expected e.g. 18.9-31.8`);
  }
  return { from, to };
};

const ensureWhisper = async (): Promise<string> => {
  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
  await downloadWhisperModel({ folder: WHISPER_DIR, model: WHISPER_MODEL });
  // On Windows the installer unpacks to Release/ while the package looks in
  // build/bin/ afterwards, so mirror it once.
  const releaseDir = path.join(WHISPER_DIR, "Release");
  const binDir = path.join(WHISPER_DIR, "build", "bin");
  if (existsSync(releaseDir) && !existsSync(binDir)) {
    cpSync(releaseDir, binDir, { recursive: true });
  }
  return path.join(
    binDir,
    process.platform === "win32" ? "whisper-cli.exe" : "whisper-cli",
  );
};

const transcribeRange = async (
  cli: string,
  input: string,
  range: Range,
  language: string,
): Promise<Word[]> => {
  // installWhisperCpp refuses a pre-existing folder, so work files go to out/.
  mkdirSync(OUT_DIR, { recursive: true });
  const base = path.join(OUT_DIR, "transcribe-16k");
  const ffmpeg = await run("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-ss",
    String(range.from),
    ...(range.to === undefined ? [] : ["-to", String(range.to)]),
    "-i",
    input,
    "-ar",
    String(SAMPLE_RATE),
    "-ac",
    "1",
    `${base}.wav`,
  ]);
  if (ffmpeg.code !== 0) {
    throw new ScriptError("ffmpeg audio extraction failed");
  }

  // One segment per word (-ml 1, split on word). The DTW path of
  // @remotion/install-whisper-cpp's transcribe() asserts on trimmed clips.
  const whisper = await run(cli, [
    "-m",
    path.join(WHISPER_DIR, `ggml-${WHISPER_MODEL}.bin`),
    "-l",
    language,
    "-ml",
    "1",
    "-sow",
    "-oj",
    "-of",
    base,
    "-np",
    "-f",
    `${base}.wav`,
  ]);
  if (whisper.code !== 0) {
    throw new ScriptError(`whisper-cli failed with exit code ${whisper.code}`);
  }
  const parsed = whisperJsonSchema.parse(
    JSON.parse(readFileSync(`${base}.json`, "utf8")),
  );
  const end = range.to ?? Number.POSITIVE_INFINITY;
  return parsed.transcription
    .map((seg) => ({
      text: seg.text.trim(),
      start: round(range.from + seg.offsets.from / 1000),
      end: round(Math.min(range.from + seg.offsets.to / 1000, end)),
    }))
    .filter((w) => w.text.length > 0 && w.start < end);
};

const main = async () => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      language: { type: "string", default: "id" },
      out: { type: "string" },
      range: { type: "string", multiple: true },
    },
  });
  const input = positionals[0];
  if (!input || !existsSync(input)) {
    throw new ScriptError(`Usage: ${USAGE}`);
  }
  const ranges: Range[] = values.range?.map(parseRange) ?? [{ from: 0 }];

  const cli = await ensureWhisper();
  const words: Word[] = [];
  for (const range of ranges) {
    words.push(...(await transcribeRange(cli, input, range, values.language)));
  }

  const out = values.out ?? input.replace(/\.[^.]+$/, ".transcript.json");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(
    out,
    `${JSON.stringify(
      { source: path.basename(input), model: WHISPER_MODEL, ranges, words },
      null,
      2,
    )}\n`,
  );
  console.log(`Wrote ${out} (${words.length} words)`);
};

runMain(main);
