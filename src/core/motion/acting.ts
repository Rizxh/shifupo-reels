// "Acting" layer: the details that make drawn things feel alive and heavy.
// Squash & stretch that keeps volume, idle secondary motion, blinks, and
// directional motion blur derived from real velocity.

import { random } from "remotion";
import { drift } from "./motion";
import { powOut } from "./tracks";

// Scale pair [sx, sy] whose product stays 1 (volume preserved).
export const volumeScale = (stretch: number): [number, number] => {
  const sy = Math.max(0.2, 1 + stretch);
  return [1 / Math.sqrt(sy), Math.sqrt(sy)];
};

// Stretch along the direction of travel while moving fast (speed in px/frame).
export const stretchFromSpeed = (speed: number, k = 0.012, max = 0.45): [number, number] =>
  volumeScale(Math.min(max, Math.abs(speed) * k));

// Squash on impact: flattens at contact, rebounds slightly taller, settles.
// `since` = frames since impact, `strength` 0..1 (e.g. impactSpeed / 30).
export const squashOnImpact = (since: number, strength: number, frames = 10): [number, number] => {
  if (!Number.isFinite(since) || since < 0 || since > frames) {
    return [1, 1];
  }
  const t = since / frames;
  // -1 (flat) at contact → +0.35 (tall) at 40% → 0 at the end.
  const curve = t < 0.4 ? -1 + (1.35 * powOut(2)(t / 0.4)) : 0.35 * (1 - powOut(2)((t - 0.4) / 0.6));
  return volumeScale(curve * 0.32 * Math.min(1, strength));
};

// Idle life for holds: gentle bob (px) and sway (deg) from smooth noise.
export const idle = (seed: string, frame: number, bobPx = 6, swayDeg = 1.2) => ({
  y: drift(`${seed}-bob`, frame, 0.02) * bobPx,
  rotate: drift(`${seed}-sway`, frame, 0.013) * swayDeg,
});

// Eyelid closure 0..1 for natural, irregular blinks (seeded intervals).
export const blink = (seed: string, frame: number, minGap = 60, maxGap = 140, len = 6): number => {
  let at = Math.floor(random(`${seed}-0`) * maxGap);
  for (let i = 1; at <= frame + len && i < 400; i++) {
    if (frame >= at && frame < at + len) {
      return Math.sin((Math.PI * (frame - at)) / len);
    }
    at += minGap + Math.floor(random(`${seed}-${i}`) * (maxGap - minGap));
  }
  return 0;
};

// Directional motion blur from velocity (px/frame): an SVG feGaussianBlur
// stdDeviation along the travel axis, rotated into place by the caller, or a
// CSS blur radius. Below `threshold` there is no blur (keeps holds crisp).
export const motionBlur = (vx: number, vy: number, k = 0.35, threshold = 6, max = 24) => {
  const speed = Math.hypot(vx, vy);
  const amount = speed < threshold ? 0 : Math.min(max, (speed - threshold) * k);
  return {
    amount,
    angleDeg: (Math.atan2(vy, vx) * 180) / Math.PI,
    // stdDeviation for an element rotated so its travel axis is x.
    stdDeviation: `${amount.toFixed(2)} 0`,
    css: amount > 0.3 ? `blur(${(amount * 0.5).toFixed(2)}px)` : undefined,
  };
};
