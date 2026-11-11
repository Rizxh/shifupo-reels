// Motion vocabulary for the "anime smooth" look (docs/PLAN-SP01.md, part 6).
// Every visible move goes through these helpers: eased or sprung, never
// linear, with anticipation and overshoot where a thing has weight.

import { noise2D } from "@remotion/noise";
import { Easing, interpolate, spring, type SpringConfig } from "remotion";

export const EASE = {
  // Fast start, long soft landing: the default for things arriving.
  out: Easing.bezier(0.16, 1, 0.3, 1),
  // Slow-fast-slow for camera moves and transforms.
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  // Gentle acceleration for things leaving.
  in: Easing.bezier(0.55, 0, 1, 0.45),
  // Pulls back first, then shoots forward (anticipation).
  anticipate: Easing.bezier(0.36, -0.42, 0.42, 1.0),
  // Lands past the target and settles (overshoot).
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

export const SPRING: Record<string, Partial<SpringConfig>> = {
  // Heavy objects: pillars, plates.
  heavy: { damping: 14, stiffness: 90, mass: 1.1 },
  // Default UI pop with a small overshoot.
  pop: { damping: 11, stiffness: 160, mass: 0.7 },
  // Snappy lock (compass needle).
  snap: { damping: 9, stiffness: 220, mass: 0.6 },
  // Soft, no overshoot.
  soft: { damping: 200, stiffness: 120, mass: 1 },
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0 -> 1 between frames a and b with an easing curve. An infinite range
// means the move never happens (an element that stays to the end).
export const prog = (
  frame: number,
  a: number,
  b: number,
  easing: (t: number) => number = EASE.out,
): number => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return frame >= a ? 1 : 0;
  }
  return interpolate(frame, [a, b], [0, 1], { ...CLAMP, easing });
};

// Spring that starts at `start`; 0 before it.
export const springAt = (
  frame: number,
  start: number,
  fps: number,
  config: Partial<SpringConfig> = SPRING.pop,
): number =>
  frame < start ? 0 : spring({ frame: frame - start, fps, config });

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

// Smooth organic drift in [-1, 1]: same seed and frame give the same value.
export const drift = (
  seed: string,
  frame: number,
  speed = 0.01,
  y = 0,
): number => noise2D(seed, frame * speed, y);

// Breathing scale for "alive" holds.
export const breathe = (
  frame: number,
  fps: number,
  amount = 0.012,
  period = 3.2,
): number => 1 + Math.sin((frame / fps / period) * Math.PI * 2) * amount;
