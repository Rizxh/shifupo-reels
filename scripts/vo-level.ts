// Measures the loudness of every VO line of an episode and stores it in the
// line's sidecar, so the composition can bring all lines to one level.
// `npm run tts` already does this for lines it generates; run this for lines
// generated before that, or recorded by hand next to a sidecar.
//
//   npm run vo-level -- ep02

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  voAlignmentPath,
  voAudioPath,
  voSidecarSchema,
} from "../src/lib/audio";
import { VO_LEVEL } from "../src/lib/mix";
import {
  loadVoScript,
  PUBLIC_DIR,
  rel,
  requireEpisodeId,
  runMain,
} from "./lib/common";
import { measureLoudnessLufs } from "./lib/loudness";

const main = async () => {
  const { positionals } = parseArgs({ allowPositionals: true });
  const episodeId = requireEpisodeId(positionals, "npm run vo-level -- <id>");
  const { scenes } = loadVoScript(episodeId);

  for (const [index] of scenes.entries()) {
    const audio = path.join(PUBLIC_DIR, voAudioPath(episodeId, index));
    const sidecarFile = path.join(
      PUBLIC_DIR,
      voAlignmentPath(episodeId, index),
    );
    if (!existsSync(audio) || !existsSync(sidecarFile)) {
      console.log(`s${index + 1}: no audio or sidecar, skipped`);
      continue;
    }
    const sidecar = voSidecarSchema.parse(
      JSON.parse(readFileSync(sidecarFile, "utf8")),
    );
    const lufs = await measureLoudnessLufs(audio);
    writeFileSync(
      sidecarFile,
      `${JSON.stringify({ ...sidecar, loudnessLufs: lufs }, null, 2)}\n`,
    );
    const gain = VO_LEVEL.targetLufs - lufs;
    console.log(
      `s${index + 1}: ${lufs.toFixed(1)} LUFS, mix gain ${gain >= 0 ? "+" : ""}${gain.toFixed(1)} dB (${rel(sidecarFile)})`,
    );
  }
};

runMain(main);
