// Camera rig of the shared core for live 3D worlds (React Three Fiber).
//
// Motion Format logic, applied to a 3D camera:
// - every shot is a set of per-channel keyframe tracks with its own easing
//   (`track`), never a linear move;
// - the world is ONE continuous set: between two beats the camera travels
//   from the end of one shot to the start of the next (match move), so there
//   is never an empty or cross-faded frame;
// - a small handheld idle keeps a held camera alive (no dead-still frames).
// Everything is a pure function of the frame, so the projection used for 2D
// annotations matches the 3D render exactly.

import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { noise2D } from "@remotion/noise";
import { powInOut, sineInOut } from "../motion/tracks";

export type Vec3 = readonly [number, number, number];

// One key of a shot, at progress t (0..1 of the beat).
export type CamKey = {
  t: number;
  pos: Vec3;
  look: Vec3;
  fov?: number;
  roll?: number; // degrees
};

export type ShotSpec = {
  keys: readonly CamKey[];
  fov: number;
  // Handheld idle amplitude (world units); 0 = locked-off.
  handheld?: number;
  // World point the depth of field focuses on; defaults to the look point.
  focus?: Vec3;
};

export type CamState = { pos: Vec3; look: Vec3; fov: number; roll: number; focus: Vec3 };

// Monotone cubic (Fritsch–Carlson) through the keys: velocity stays
// continuous across keys and never overshoots. Per-segment easing made the
// camera stop at every key (measured qc-motion jerk 0.31 in the orbit shot).
const monotone = (xs: readonly number[], ys: readonly number[], x: number): number => {
  const n = xs.length;
  if (n === 1 || x <= xs[0]) {
    return ys[0];
  }
  if (x >= xs[n - 1]) {
    return ys[n - 1];
  }
  const d = xs.slice(1).map((xi, i) => (ys[i + 1] - ys[i]) / (xi - xs[i]));
  const m = xs.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const r = a * a + b * b;
    if (r > 9) {
      const k = 3 / Math.sqrt(r);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  let i = 0;
  while (x > xs[i + 1]) {
    i++;
  }
  const h = xs[i + 1] - xs[i];
  const t = (x - xs[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
};

// Beat progress warp: mostly linear drift (Motion Format cameras use "none"
// easing for drift) with a soft start and end, never a full stop.
const DRIFT = 0.6;
const warp = (t: number): number => DRIFT * t + (1 - DRIFT) * sineInOut(t);

export const shotAt = (spec: ShotSpec, t: number, frame: number): CamState => {
  const k = spec.keys;
  const xs = k.map((x) => x.t);
  const p = warp(Math.min(1, Math.max(0, t)));
  const v = (pick: (k: CamKey) => number) => monotone(xs, k.map(pick), p);
  const h = spec.handheld ?? 0;
  const wob = (seed: string) => noise2D(seed, frame / 70, 0) * h;
  const pos: Vec3 = [v((x) => x.pos[0]) + wob("hx"), v((x) => x.pos[1]) + wob("hy") * 0.6, v((x) => x.pos[2])];
  const look: Vec3 = [v((x) => x.look[0]), v((x) => x.look[1]), v((x) => x.look[2])];
  return {
    pos,
    look,
    fov: v((x) => x.fov ?? spec.fov),
    roll: v((x) => x.roll ?? 0) + noise2D("hr", frame / 90, 0) * h * 0.6,
    focus: spec.focus ?? look,
  };
};

const lerp3 = (a: Vec3, b: Vec3, w: number): Vec3 => [
  MathUtils.lerp(a[0], b[0], w),
  MathUtils.lerp(a[1], b[1], w),
  MathUtils.lerp(a[2], b[2], w),
];

export type BeatSpan = { startFrame: number; endFrame: number };

// Camera travel into the next beat (ends exactly on the cut). Its length
// grows with the distance to the next shot: a fixed 22 frames made the long
// moves (hook → POV, cause → macro, macro → high angle) jump 28-32 gray
// levels per frame, which qc-motion counted as hard cuts.
export const RIG = {
  travelMin: 18,
  travelPerMeter: 5,
  travelMax: 42,
  // Never more than this share of the beat.
  travelMaxShare: 0.45,
  travelEase: powInOut(2),
  // The camera arcs up mid-travel (meters of lift per meter travelled, capped)
  // so it flies over furniture instead of through it: a straight line from
  // the orbit to the desk macro passed through the chair back.
  arcPerMeter: 0.22,
  arcMax: 1.1,
} as const;

const dist3 = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export const travelFramesFor = (from: ShotSpec, to: ShotSpec, beatFrames: number): number => {
  const a = from.keys[from.keys.length - 1];
  const b = to.keys[0];
  const meters = dist3(a.pos, b.pos) + 0.5 * dist3(a.look, b.look);
  const f = RIG.travelMin + meters * RIG.travelPerMeter;
  return Math.round(Math.min(RIG.travelMax, beatFrames * RIG.travelMaxShare, Math.max(RIG.travelMin, f)));
};

// First frame of the camera travel out of beat i (= its end when it is the last).
export const travelStart = (i: number, beats: readonly BeatSpan[], shots: readonly ShotSpec[]): number => {
  const b = beats[i];
  const next = shots[i + 1];
  return next ? b.endFrame - travelFramesFor(shots[i], next, b.endFrame - b.startFrame) : b.endFrame;
};

// Camera of the whole reel at a frame: the beat's shot, travelling into the
// next shot during the last travel frames of the beat.
export const reelCamera = (frame: number, beats: readonly BeatSpan[], shots: readonly ShotSpec[]): CamState => {
  let i = beats.findIndex((b) => frame < b.endFrame);
  if (i < 0) {
    i = beats.length - 1;
  }
  const b = beats[i];
  const t = (frame - b.startFrame) / Math.max(1, b.endFrame - b.startFrame);
  const here = shotAt(shots[i], t, frame);
  const next = shots[i + 1];
  const travel = next ? travelFramesFor(shots[i], next, b.endFrame - b.startFrame) : 0;
  const into = b.endFrame - travel;
  if (!next || frame < into) {
    return here;
  }
  const w = RIG.travelEase((frame - into) / travel);
  const there = shotAt(next, 0, frame);
  const lift = Math.min(RIG.arcMax, dist3(here.pos, there.pos) * RIG.arcPerMeter) * Math.sin(Math.PI * w);
  const pos = lerp3(here.pos, there.pos, w);
  return {
    pos: [pos[0], pos[1] + lift, pos[2]],
    look: lerp3(here.look, there.look, w),
    fov: MathUtils.lerp(here.fov, there.fov, w),
    roll: MathUtils.lerp(here.roll, there.roll, w),
    // While travelling, focus where the camera looks: interpolating between
    // two shot focus points blurred the whole swoop (qc-motion empty frames).
    focus: lerp3(here.look, there.look, w),
  };
};

// Speed of the camera (world units per frame): drives 2D motion blur.
export const cameraSpeed = (frame: number, at: (f: number) => CamState): number => {
  const a = at(frame - 0.5).pos;
  const b = at(frame + 0.5).pos;
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
};

export const NEAR_FAR = { near: 0.05, far: 200 } as const;

// Applies a camera state to a three.js camera (also used by projectToScreen).
export const applyCamera = (cam: PerspectiveCamera, s: CamState, aspect: number): void => {
  cam.fov = s.fov;
  cam.aspect = aspect;
  cam.near = NEAR_FAR.near;
  cam.far = NEAR_FAR.far;
  cam.position.set(s.pos[0], s.pos[1], s.pos[2]);
  cam.up.set(0, 1, 0);
  cam.lookAt(s.look[0], s.look[1], s.look[2]);
  cam.rotateZ(MathUtils.degToRad(s.roll));
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
};

const scratch = new PerspectiveCamera();

// Screen position (px) of a world point for 2D annotations; null when behind
// the camera.
export const projectToScreen = (
  s: CamState,
  point: Vec3,
  width: number,
  height: number,
): { x: number; y: number } | null => {
  applyCamera(scratch, s, width / height);
  const v = new Vector3(point[0], point[1], point[2]).project(scratch);
  if (v.z > 1) {
    return null;
  }
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
};
