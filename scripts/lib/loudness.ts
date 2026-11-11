// Loudness of an audio or video file, read with ffmpeg's EBU R128 meter.

import { run, ScriptError } from "./common";

export type Loudness = { integratedLufs: number; truePeakDb: number };

export const measureLoudness = async (file: string): Promise<Loudness> => {
  const { code, stderr } = await run(
    "ffmpeg",
    [
      "-hide_banner",
      "-i",
      file,
      "-af",
      "ebur128=peak=true",
      "-vn",
      "-f",
      "null",
      "-",
    ],
    { capture: true },
  );
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  const integratedLufs = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
  const truePeakDb = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
  if (
    code !== 0 ||
    !Number.isFinite(integratedLufs) ||
    !Number.isFinite(truePeakDb)
  ) {
    throw new ScriptError(`Could not measure the loudness of ${file}`);
  }
  return { integratedLufs, truePeakDb };
};

export const measureLoudnessLufs = async (file: string): Promise<number> =>
  (await measureLoudness(file)).integratedLufs;
