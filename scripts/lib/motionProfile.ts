// Frame-by-frame motion profile of a rendered video, for automated QC.
// Reads small grayscale frames through ffmpeg and measures:
//   - dead frames: practically no change from the previous frame
//   - quiet seconds: whole seconds with almost no motion ("polos")
//   - energy: how much moves (p90 of the per-frame difference)
//   - jerk: how evenly motion changes frame to frame (lower = smoother)
//   - gaps: runs of frames whose detail drops far below the video's median
//     (an ink wipe opening on a scene whose subject has not entered yet)
// Thresholds come from the Motion Format study in docs/core/AUDIT.md §3.1.

import { spawn } from "node:child_process";

export const MOTION_TARGETS = {
  deadPctMax: 3,
  quietSecondsMax: 2,
  energyP90Min: 5,
  jerkMax: 0.15,
  gapRunMax: 3,
} as const;

const W = 96;
const DEAD = 0.15;
const QUIET = 0.4;
const GAP_RATIO = 0.6;

export type MotionProfile = {
  frames: number;
  fps: number;
  deadPct: number;
  longestDead: number;
  quietSeconds: number[];
  energyP90: number;
  medianMotion: number;
  jerk: number;
  cuts: number[];
  gaps: { from: number; to: number }[];
};

const readFrames = (file: string, w: number, h: number): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-v", "error", "-i", file, "-vf", `scale=${w}:${h},format=gray`, "-f", "rawvideo", "-"]);
    const chunks: Buffer[] = [];
    ff.stdout.on("data", (c: Buffer) => chunks.push(c));
    ff.on("error", reject);
    ff.on("close", (code) => (code === 0 ? resolve(new Uint8Array(Buffer.concat(chunks))) : reject(new Error(`ffmpeg exited ${code}`))));
  });

const percentile = (xs: number[], p: number): number => {
  if (xs.length === 0) {
    return 0;
  }
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

export const profileVideo = async (file: string, size: { width: number; height: number }, fps: number): Promise<MotionProfile> => {
  const h = Math.round((size.height * W) / size.width / 2) * 2;
  const px = W * h;
  const raw = await readFrames(file, W, h);
  const n = Math.floor(raw.length / px);
  const diff: number[] = [];
  const detail: number[] = [];
  for (let f = 0; f < n; f++) {
    const o = f * px;
    // Detail = mean horizontal + vertical gradient (edges), a cheap "how much is drawn".
    let g = 0;
    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < W - 1; x++) {
        const i = o + y * W + x;
        g += Math.abs(raw[i + 1] - raw[i]) + Math.abs(raw[i + W] - raw[i]);
      }
    }
    detail.push(g / ((W - 1) * (h - 1)));
    if (f > 0) {
      let d = 0;
      for (let i = 0; i < px; i++) {
        d += Math.abs(raw[o + i] - raw[o - px + i]);
      }
      diff.push(d / px);
    }
  }
  const med = percentile(diff, 50);
  const cutAt = Math.max(12, med * 8);
  const cuts = diff.flatMap((d, i) => (d > cutAt ? [(i + 1) / fps] : []));
  const deadFlags = diff.map((d) => d < DEAD);
  let longestDead = 0;
  let run = 0;
  for (const dflag of deadFlags) {
    run = dflag ? run + 1 : 0;
    longestDead = Math.max(longestDead, run);
  }
  const moving = diff.filter((d) => d >= DEAD && d <= cutAt);
  const jerks: number[] = [];
  for (let i = 1; i < moving.length; i++) {
    jerks.push(Math.abs(moving[i] - moving[i - 1]) / (moving[i - 1] + 1e-3));
  }
  const quietSeconds: number[] = [];
  for (let s = 0; s * fps < diff.length; s++) {
    const slice = diff.slice(s * fps, (s + 1) * fps);
    if (slice.length > fps / 2 && slice.reduce((a, b) => a + b, 0) / slice.length < QUIET) {
      quietSeconds.push(s);
    }
  }
  const medDetail = percentile(detail, 50);
  const gaps: { from: number; to: number }[] = [];
  let start = -1;
  detail.forEach((v, f) => {
    const low = v < medDetail * GAP_RATIO;
    if (low && start < 0) {
      start = f;
    }
    if ((!low || f === detail.length - 1) && start >= 0) {
      const end = low ? f : f - 1;
      if (end - start + 1 > MOTION_TARGETS.gapRunMax) {
        gaps.push({ from: start / fps, to: end / fps });
      }
      start = -1;
    }
  });
  return {
    frames: n,
    fps,
    deadPct: (deadFlags.filter(Boolean).length / Math.max(1, diff.length)) * 100,
    longestDead,
    quietSeconds,
    energyP90: percentile(moving, 90),
    medianMotion: percentile(moving, 50),
    jerk: percentile(jerks, 50),
    cuts,
    gaps,
  };
};

// Human-readable findings against MOTION_TARGETS; empty when everything passes.
export const motionProblems = (p: MotionProfile): string[] => {
  const t = MOTION_TARGETS;
  const out: string[] = [];
  if (p.deadPct > t.deadPctMax) {
    out.push(`Frame mati ${p.deadPct.toFixed(1)}% (maks ${t.deadPctMax}%)`);
  }
  if (p.quietSeconds.length > t.quietSecondsMax) {
    out.push(`Detik nyaris diam: ${p.quietSeconds.join(", ")} (maks ${t.quietSecondsMax})`);
  }
  if (p.energyP90 < t.energyP90Min) {
    out.push(`Energi gerak p90 ${p.energyP90.toFixed(2)} (min ${t.energyP90Min}): terlalu polos`);
  }
  if (p.jerk > t.jerkMax) {
    out.push(`Jerk ${p.jerk.toFixed(3)} (maks ${t.jerkMax}): gerak tidak rata`);
  }
  for (const g of p.gaps) {
    out.push(`Frame kosong ${g.from.toFixed(2)}–${g.to.toFixed(2)} s`);
  }
  return out;
};
