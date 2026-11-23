// Motion QC for a rendered video (see scripts/lib/motionProfile.ts).
//
//   npm run qc-motion -- sp01                 checks out/sp01_final.mp4 (or the draft)
//   npm run qc-motion -- path/to/video.mp4    any video
//
// Exit code 1 when a target fails, so produce/review can gate on it.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { motionProblems, MOTION_TARGETS, profileVideo } from "./lib/motionProfile";
import { loadEpisode, rel, runMain, ScriptError } from "./lib/common";
import { finalVideoPath, outPaths } from "./lib/paths";

const resolveVideo = (arg: string): string => {
  if (arg.endsWith(".mp4")) {
    return path.resolve(arg);
  }
  for (const f of [finalVideoPath(arg, loadEpisode(arg).title), outPaths(arg).rendered, outPaths(arg, true).rendered]) {
    if (existsSync(f)) {
      return f;
    }
  }
  throw new ScriptError(`No rendered video for ${arg} in out/. Render it first.`);
};

const main = async () => {
  const arg = process.argv[2];
  if (!arg) {
    throw new ScriptError("Usage: npm run qc-motion -- <id | video.mp4>");
  }
  const file = resolveVideo(arg);
  const [w, h, rate] = execFileSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  )
    .trim()
    .split(",");
  const [num, den] = rate.split("/").map(Number);
  const p = await profileVideo(file, { width: Number(w), height: Number(h) }, Math.round(num / (den || 1)));
  const t = MOTION_TARGETS;
  console.log(`Motion QC: ${rel(file)} (${p.frames} frame)`);
  console.log(`  frame mati      ${p.deadPct.toFixed(1)}%   (target < ${t.deadPctMax}%), terpanjang ${p.longestDead} frame`);
  console.log(`  detik diam      ${p.quietSeconds.length}      (target <= ${t.quietSecondsMax}) ${p.quietSeconds.length ? `[${p.quietSeconds.join(", ")}]` : ""}`);
  console.log(`  energi p90      ${p.energyP90.toFixed(2)}   (target >= ${t.energyP90Min})`);
  console.log(`  jerk            ${p.jerk.toFixed(3)}  (target < ${t.jerkMax})`);
  console.log(`  potongan keras  ${p.cuts.length}`);
  console.log(`  frame kosong    ${p.gaps.length ? p.gaps.map((g) => `${g.from.toFixed(2)}–${g.to.toFixed(2)}s`).join(", ") : "tidak ada"}`);
  const problems = motionProblems(p);
  if (problems.length > 0) {
    console.log(`\nGAGAL:\n- ${problems.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log("\nLolos semua target gerak.");
  }
};

runMain(main);
