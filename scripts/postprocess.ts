// Loudness-normalizes a rendered episode for Instagram: out/<id>.mp4 ->
// out/<id>_final.mp4 at about -14 LUFS, true peak -1.5 dB, AAC 192 kbps.
//
//   npm run postprocess -- sp01        out/sp01.mp4 -> out/sp01_final.mp4
//
// Uses two-pass ffmpeg loudnorm (measure, then apply linearly) and copies the
// video stream untouched. Replaces the plan's postprocess.sh so it also runs
// from npm on Windows.

import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { LOUDNESS_TARGET } from "../src/lib/mix";
import { REEL } from "../src/lib/timing";
import {
  OUT_DIR,
  printProblems,
  probeMedia,
  rel,
  reportMedia,
  requireEpisodeId,
  run,
  runMain,
  formatMb,
  QA,
  ScriptError,
} from "./lib/common";

// loudnorm upsamples internally, so the output rate must be set explicitly.
const OUTPUT_SAMPLE_RATE = "48000";
const AUDIO_BITRATE = "192k";
// Renders over the publish size limit get their video re-encoded with x264
// (the render itself is CRF 18); smaller ones are copied. The first quality
// that fits the limit wins, so the picture loses as little as possible.
const SHRINK_CRFS = [22, 24, 26, 28];
const SHRINK_PRESET = "slow";

const {
  integratedLufs: I,
  truePeakDb: TP,
  loudnessRange: LRA,
} = LOUDNESS_TARGET;
const LOUDNORM_TARGET = `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}`;
// Transients (camera-mic plosives, combustion hits) overshoot after the
// loudness gain, and AAC adds up to about 1 dB more. A limiter about 3 dB
// under full scale, with a 10 ms attack so hits are rounded rather than
// clipped, keeps the true peak inside the target for every format.
const PEAK_GUARD = ",alimiter=limit=0.7:attack=10:release=80:level=false";

const measurementSchema = z.object({
  input_i: z.string(),
  input_tp: z.string(),
  input_lra: z.string(),
  input_thresh: z.string(),
  target_offset: z.string(),
});

const ffmpeg = async (args: string[], capture = false) => {
  const result = await run("ffmpeg", ["-hide_banner", ...args], { capture });
  if (result.code !== 0) {
    const tail = result.stderr.trim().split("\n").slice(-5).join("\n");
    throw new ScriptError(`ffmpeg failed (exit ${result.code})\n${tail}`);
  }
  return result.stderr;
};

// Pass 1: measure the input loudness. loudnorm prints a JSON block at the end.
const measure = async (input: string, prefilter: string) => {
  const stderr = await ffmpeg(
    [
      "-i",
      input,
      "-af",
      `${prefilter}${LOUDNORM_TARGET}:print_format=json`,
      "-vn",
      "-f",
      "null",
      "-",
    ],
    true,
  );
  const json = stderr.slice(
    stderr.lastIndexOf("{"),
    stderr.lastIndexOf("}") + 1,
  );
  return measurementSchema.parse(JSON.parse(json));
};

// Reads integrated loudness and true peak of a finished file via ebur128.
const verify = async (file: string) => {
  const stderr = await ffmpeg(
    ["-i", file, "-af", "ebur128=peak=true", "-vn", "-f", "null", "-"],
    true,
  );
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const integrated = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
  const truePeak = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
  return { integrated, truePeak };
};

const main = async () => {
  const { positionals } = parseArgs({ allowPositionals: true });
  const episodeId = requireEpisodeId(
    positionals,
    "npm run postprocess -- <id>",
  );
  const base = episodeId;
  const prefilter = "";
  const postfilter = PEAK_GUARD;
  const input = path.join(OUT_DIR, `${base}.mp4`);
  const output = path.join(OUT_DIR, `${base}_final.mp4`);
  if (!existsSync(input)) {
    throw new ScriptError(
      `${rel(input)} not found. Run: npm run render -- ${episodeId}`,
    );
  }
  const inputInfo = await probeMedia(input);
  if (inputInfo.audioCodec === undefined) {
    throw new ScriptError(
      `${rel(input)} has no audio track. Run npm run tts -- ${episodeId}, then render again.`,
    );
  }

  console.log(`Measuring loudness of ${rel(input)}`);
  const m = await measure(input, prefilter);
  console.log(
    `  input: ${m.input_i} LUFS, true peak ${m.input_tp} dB, LRA ${m.input_lra}`,
  );

  const shrink = inputInfo.sizeInBytes > QA.maxFileBytes;
  const videoArgs = (crf: number | null) =>
    crf === null
      ? ["-c:v", "copy"]
      : [
          "-c:v",
          "libx264",
          "-preset",
          SHRINK_PRESET,
          "-crf",
          String(crf),
          "-pix_fmt",
          "yuv420p",
        ];
  console.log(`Normalizing to ${I} LUFS / ${TP} dBTP`);
  const encode = (crf: number | null) =>
    ffmpeg(
      [
        "-y",
        "-i",
        input,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0",
        ...videoArgs(crf),
        "-af",
        `${prefilter}${LOUDNORM_TARGET}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true${postfilter}`,
        "-ar",
        OUTPUT_SAMPLE_RATE,
        "-c:a",
        "aac",
        "-b:a",
        AUDIO_BITRATE,
        "-movflags",
        "+faststart",
        output,
      ],
      true,
    );
  if (!shrink) {
    await encode(null);
  } else {
    for (const crf of SHRINK_CRFS) {
      console.log(
        `Input is ${formatMb(inputInfo.sizeInBytes)}; re-encoding video at CRF ${crf} to fit the size limit`,
      );
      await encode(crf);
      const { sizeInBytes } = await probeMedia(output);
      if (sizeInBytes <= QA.maxFileBytes) {
        break;
      }
      console.log(`  ${formatMb(sizeInBytes)} is still over the limit`);
    }
  }

  const loudness = await verify(output);
  const problems = reportMedia("Final", output, await probeMedia(output), {
    min: REEL.minSeconds,
    max: REEL.maxSeconds,
  });
  console.log(
    `  loudness: ${loudness.integrated.toFixed(1)} LUFS, true peak ${loudness.truePeak.toFixed(1)} dBFS`,
  );
  if (Math.abs(loudness.integrated - I) > LOUDNESS_TARGET.toleranceLu) {
    problems.push(
      `integrated loudness is not within ${LOUDNESS_TARGET.toleranceLu} LU of ${I} LUFS`,
    );
  }
  if (loudness.truePeak > TP) {
    problems.push(`true peak exceeds ${TP} dB`);
  }
  printProblems(problems);
};

runMain(main);
