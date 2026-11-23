// Closed-form physics for animation: every function is a pure function of the
// frame (no simulation state), so any frame renders the same on its own.
// Units: pixels and frames. Gravity in px/frame² (≈ 1.2 at 30 fps for a
// thing ~1 m tall drawn ~300 px high).

export type BounceOpts = {
  // Height above the floor at release (px, positive = above).
  height: number;
  // Downward acceleration in px/frame².
  gravity?: number;
  // Fraction of speed kept after each impact (0 dead, 1 superball).
  restitution?: number;
  // Stop bouncing below this hop height (px).
  minHop?: number;
};

export type BounceState = {
  // Height above the floor (px, >= 0).
  y: number;
  // Vertical speed (px/frame, negative = falling).
  vy: number;
  // Frames since the most recent impact (Infinity before the first).
  sinceImpact: number;
  // Speed at the most recent impact (for squash strength / sound).
  impactSpeed: number;
  resting: boolean;
};

// Drop from `height` at frame `start` and bounce with energy loss.
export const bounce = (frame: number, start: number, o: BounceOpts): BounceState => {
  const g = o.gravity ?? 1.2;
  const e = o.restitution ?? 0.45;
  const minHop = o.minHop ?? 2;
  let t = frame - start;
  if (t <= 0) {
    return { y: o.height, vy: 0, sinceImpact: Infinity, impactSpeed: 0, resting: false };
  }
  // First fall.
  const tFall = Math.sqrt((2 * o.height) / g);
  if (t < tFall) {
    return { y: o.height - 0.5 * g * t * t, vy: -g * t, sinceImpact: Infinity, impactSpeed: 0, resting: false };
  }
  t -= tFall;
  let v = g * tFall; // speed at impact
  let since = t;
  for (let i = 0; i < 40; i++) {
    const impactSpeed = v;
    v *= e;
    const hop = (v * v) / (2 * g);
    if (hop < minHop) {
      return { y: 0, vy: 0, sinceImpact: since, impactSpeed, resting: true };
    }
    const tHop = (2 * v) / g;
    if (t < tHop) {
      return { y: v * t - 0.5 * g * t * t, vy: v - g * t, sinceImpact: t, impactSpeed, resting: false };
    }
    t -= tHop;
    since = t;
  }
  return { y: 0, vy: 0, sinceImpact: since, impactSpeed: 0, resting: true };
};

// Thrown object: position after t frames with initial velocity and gravity,
// plus optional linear air drag k (per frame).
export const projectile = (
  t: number,
  o: { x0: number; y0: number; vx: number; vy: number; gravity?: number; drag?: number },
): { x: number; y: number } => {
  const g = o.gravity ?? 1.2;
  const k = o.drag ?? 0;
  if (t <= 0) {
    return { x: o.x0, y: o.y0 };
  }
  if (k <= 1e-6) {
    return { x: o.x0 + o.vx * t, y: o.y0 + o.vy * t + 0.5 * g * t * t };
  }
  const decay = (1 - Math.exp(-k * t)) / k;
  return {
    x: o.x0 + o.vx * decay,
    y: o.y0 + (o.vy + g / k) * decay - (g / k) * t,
  };
};

// Damped spring from 0 to 1 (analytic, under-damped): natural frequency w
// (rad/frame) and damping ratio z (0..1). Use for settle/overshoot that obeys
// a real spring instead of a hand-drawn curve.
export const dampedSpring = (frame: number, start: number, w = 0.35, z = 0.35): number => {
  const t = frame - start;
  if (t <= 0) {
    return 0;
  }
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
};

// Damped pendulum angle (degrees) for hanging things (lanterns, signs):
// amplitude a0 at frame `start`, period in frames, decay per frame.
export const pendulum = (frame: number, start: number, a0: number, period = 48, decay = 0.02): number => {
  const t = frame - start;
  if (t <= 0) {
    return 0;
  }
  return a0 * Math.exp(-decay * t) * Math.sin((2 * Math.PI * t) / period);
};

// Frames at which a `bounce` hits the ground, with the impact speed: lets a
// world play one sound per impact (Motion Format: sound per micro-event).
export const bounceImpacts = (start: number, o: BounceOpts): { frame: number; speed: number }[] => {
  const g = o.gravity ?? 1.2;
  const e = o.restitution ?? 0.45;
  const minHop = o.minHop ?? 2;
  const out: { frame: number; speed: number }[] = [];
  let f = start + Math.sqrt((2 * o.height) / g);
  let v = g * (f - start);
  for (let i = 0; i < 40; i++) {
    out.push({ frame: f, speed: v });
    v *= e;
    if ((v * v) / (2 * g) < minHop) {
      break;
    }
    f += (2 * v) / g;
  }
  return out;
};
