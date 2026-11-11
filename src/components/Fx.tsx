import { noise2D } from "@remotion/noise";
import { random, useCurrentFrame } from "remotion";
import { COLORS, GOLD_GRADIENT, INK_WIPE, VIDEO } from "../lib/brand";
import { EASE, prog } from "../lib/motion";

const W = VIDEO.width;
const H = VIDEO.height;

// Gold gradient definitions; ids are prefixed so several SVGs can coexist.
export const GoldDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
      {GOLD_GRADIENT.map((s) => (
        <stop key={s.offset} offset={s.offset} stopColor={s.color} />
      ))}
    </linearGradient>
    <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
      <stop offset="0" stopColor={COLORS.goldLight} stopOpacity={0.9} />
      <stop offset="0.45" stopColor={COLORS.gold} stopOpacity={0.35} />
      <stop offset="1" stopColor={COLORS.gold} stopOpacity={0} />
    </radialGradient>
    <linearGradient id={`${id}-lacquer`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={COLORS.sealDeep} />
      <stop offset="0.45" stopColor={COLORS.seal} />
      <stop offset="0.7" stopColor="#C42A2F" />
      <stop offset="1" stopColor={COLORS.sealDeep} />
    </linearGradient>
  </defs>
);

// Anime speed lines bursting from a point, for a few frames of emphasis.
export const SpeedLines: React.FC<{
  cx: number;
  cy: number;
  start: number;
  frames?: number;
  color?: string;
}> = ({ cx, cy, start, frames = 10, color = COLORS.ink }) => {
  const frame = useCurrentFrame();
  const t = (frame - start) / frames;
  if (t < 0 || t > 1) {
    return null;
  }
  const lines = 46;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: lines }, (_, i) => {
        const a = (i / lines) * Math.PI * 2 + random(`sl${i}`) * 0.08;
        const inner = 230 + random(`si${i}`) * 140 + t * 260;
        const len = 140 + random(`sn${i}`) * 260;
        const w = 2 + random(`sw${i}`) * 7;
        const x1 = cx + Math.cos(a) * inner;
        const y1 = cy + Math.sin(a) * inner;
        const x2 = cx + Math.cos(a) * (inner + len);
        const y2 = cy + Math.sin(a) * (inner + len);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={w}
            strokeLinecap="round"
            opacity={(1 - t) * 0.55}
          />
        );
      })}
    </svg>
  );
};

// Four-point gold glints that twinkle around a point.
export const Sparkles: React.FC<{
  cx: number;
  cy: number;
  start: number;
  count?: number;
  spread?: number;
  frames?: number;
}> = ({ cx, cy, start, count = 10, spread = 220, frames = 26 }) => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {Array.from({ length: count }, (_, i) => {
        const delay = Math.floor(random(`kd${i}`) * 8);
        const t = (frame - start - delay) / frames;
        if (t < 0 || t > 1) {
          return null;
        }
        const a = random(`ka${i}`) * Math.PI * 2;
        const d = spread * (0.35 + random(`kr${i}`) * 0.65) * EASE.out(t);
        const s = Math.sin(t * Math.PI) * (10 + random(`ks${i}`) * 16);
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d;
        return (
          <path
            key={i}
            d={`M ${x} ${y - s} Q ${x} ${y} ${x + s} ${y} Q ${x} ${y} ${x} ${y + s} Q ${x} ${y} ${x - s} ${y} Q ${x} ${y} ${x} ${y - s} Z`}
            fill={i % 3 === 0 ? COLORS.white : COLORS.goldLight}
            opacity={0.95}
          />
        );
      })}
    </svg>
  );
};

// CSS clip-path for an ink blot growing from (cx, cy): a ragged circle whose
// edge wobbles with noise, so the reveal looks like ink soaking into paper.
export const inkBlotPath = (
  frame: number,
  start: number,
  cx: number,
  cy: number,
  seed: string,
  maxRadius?: number,
): string | undefined => {
  const t = prog(frame, start, start + INK_WIPE.frames, EASE.inOut);
  if (t >= 1) {
    return undefined;
  }
  const maxR =
    maxRadius ?? Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.15;
  const r = maxR * t;
  const pts: string[] = [];
  for (let i = 0; i < INK_WIPE.points; i++) {
    const a = (i / INK_WIPE.points) * Math.PI * 2;
    const n = noise2D(seed, Math.cos(a) * 1.6, Math.sin(a) * 1.6 + t * 2);
    const rr = r * (1 + n * INK_WIPE.roughness);
    pts.push(
      `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`,
    );
  }
  return `M ${pts.join(" L ")} Z`;
};

export const inkBlotClip = (
  frame: number,
  start: number,
  cx: number,
  cy: number,
  seed: string,
): string | undefined => {
  const d = inkBlotPath(frame, start, cx, cy, seed);
  return d === undefined ? undefined : `path('${d}')`;
};

// Soft ink splash ring that rides the edge of an ink wipe.
export const InkSplash: React.FC<{
  cx: number;
  cy: number;
  start: number;
  seed: string;
}> = ({ cx, cy, start, seed }) => {
  const frame = useCurrentFrame();
  const t = prog(frame, start, start + INK_WIPE.frames, EASE.inOut);
  if (t <= 0 || t >= 1) {
    return null;
  }
  const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.15;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 14 }, (_, i) => {
        const a = random(`${seed}a${i}`) * Math.PI * 2;
        const d = maxR * t * (0.92 + random(`${seed}d${i}`) * 0.16);
        const s = (18 + random(`${seed}s${i}`) * 40) * Math.sin(t * Math.PI);
        return (
          <circle
            key={i}
            cx={cx + Math.cos(a) * d}
            cy={cy + Math.sin(a) * d}
            r={s}
            fill={COLORS.ink}
            opacity={0.5 * (1 - t)}
          />
        );
      })}
    </svg>
  );
};
