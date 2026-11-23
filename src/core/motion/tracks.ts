// Per-channel keyframe tracks with tunable easing, the way a key animator
// works: every property (x, y, scale, rotation, eye, glow...) gets its own
// track with its own timing and curve, so motion overlaps instead of moving
// as one block. Frame-based and pure: same frame, same value.

export type Ease = (t: number) => number;

const c01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

// Power curves with a tunable exponent: in (accelerate), out (decelerate),
// inOut (both). Exponent 2 = quad, 3 = cubic, 4 = quart...
export const powIn = (n = 2): Ease => (t) => c01(t) ** n;
export const powOut = (n = 2): Ease => (t) => 1 - (1 - c01(t)) ** n;
export const powInOut = (n = 2): Ease => (t) => {
  const x = c01(t);
  return x < 0.5 ? 0.5 * (2 * x) ** n : 1 - 0.5 * (2 * (1 - x)) ** n;
};
export const sineInOut: Ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * c01(t));
export const linear: Ease = (t) => c01(t);

// Overshoot past the target and settle; s = how far (1.7 = classic, 3 = big).
export const backOut = (s = 1.70158): Ease => (t) => {
  const x = c01(t) - 1;
  return x * x * ((s + 1) * x + s) + 1;
};
// Pull back before moving (anticipation).
export const backIn = (s = 1.70158): Ease => (t) => {
  const x = c01(t);
  return x * x * ((s + 1) * x - s);
};
// Springy settle: amplitude a, period p (smaller p = faster wobble).
export const elasticOut = (a = 1, p = 0.3): Ease => (t) => {
  const x = c01(t);
  if (x === 0 || x === 1) {
    return x;
  }
  const s = (p / (2 * Math.PI)) * Math.asin(1 / Math.max(1, a));
  return a * 2 ** (-10 * x) * Math.sin(((x - s) * (2 * Math.PI)) / p) + 1;
};

// A key: [frame, value] or [frame, value, ease]. The ease belongs to the
// segment that ENDS at that key (same convention as the Motion Format engine).
export type Key = readonly [number, number] | readonly [number, number, Ease];

// Value of a track at a frame. Holds the first value before the first key and
// the last value after the last key.
export const track = (frame: number, keys: readonly Key[]): number => {
  if (keys.length === 0) {
    return 0;
  }
  if (frame <= keys[0][0]) {
    return keys[0][1];
  }
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i] as unknown as [number, number, Ease | undefined];
    if (frame < f1) {
      const [f0, v0] = keys[i - 1];
      const t = (frame - f0) / (f1 - f0);
      return v0 + (v1 - v0) * (e ?? sineInOut)(t);
    }
  }
  return keys[keys.length - 1][1];
};

// Velocity of any frame function (units per frame), central difference.
export const velocity = (fn: (frame: number) => number, frame: number): number =>
  (fn(frame + 0.5) - fn(frame - 0.5));

// 0 -> 1 -> 0 pulse over `len` frames from `start` (blink, flash, glint).
export const pulse = (frame: number, start: number, len: number): number => {
  const t = (frame - start) / len;
  return t > 0 && t < 1 ? Math.sin(Math.PI * t) : 0;
};

// Staggered start for item i of a group (overlapping action).
export const stagger = (base: number, i: number, step: number): number => base + i * step;
