import { random, useCurrentFrame } from "remotion";
import { COLORS } from "../lib/brand";
import { drift } from "../lib/motion";

// A kohaku koi drawn facing +x in three linked parts (head, body, tail). The
// body and tail bend after the head (follow-through), so it swims.
export type KoiPalette = {
  body: string;
  spot: string;
  fin: string;
  // Optional ink outline for koi that sit on the light paper.
  outline?: string;
};

const KOHAKU: KoiPalette = {
  body: COLORS.white,
  spot: COLORS.koiOrange,
  fin: COLORS.white,
};

export const KoiFish: React.FC<{
  phase: number;
  scale?: number;
  seed: string;
  palette?: KoiPalette;
}> = ({ phase, scale = 1, seed, palette = KOHAKU }) => {
  const line = palette.outline
    ? {
        stroke: palette.outline,
        strokeWidth: 4,
        strokeLinejoin: "round" as const,
      }
    : {};
  const w = Math.sin(phase);
  const w2 = Math.sin(phase - 0.9);
  const fin = Math.sin(phase * 1.7);
  const spots = [0, 1, 2].map((i) => ({
    x: -10 - i * 34 + random(`${seed}x${i}`) * 14,
    y: (random(`${seed}y${i}`) - 0.5) * 18,
    r: 14 + random(`${seed}r${i}`) * 10,
  }));
  return (
    <g transform={`scale(${scale})`}>
      {/* Tail section. */}
      <g transform={`translate(-60 0) rotate(${w2 * 18})`}>
        <path
          d="M 0 -20 C -40 -18, -70 -8, -90 0 C -70 8, -40 18, 0 20 Z"
          fill={palette.body}
          {...line}
        />
        <g transform={`translate(-88 0) rotate(${w2 * 22})`}>
          <path
            d="M 0 0 C -20 -30, -60 -46, -86 -40 C -64 -16, -64 16, -86 40 C -60 46, -20 30, 0 0 Z"
            fill={palette.fin}
            opacity={0.85}
            {...line}
          />
          <path
            d="M -6 0 C -24 -22, -56 -34, -76 -32 M -6 0 C -24 22, -56 34, -76 32"
            stroke={palette.spot}
            strokeWidth={3}
            fill="none"
            opacity={0.5}
          />
        </g>
      </g>
      {/* Body. */}
      <g transform={`rotate(${w * 6})`}>
        <path
          d="M 60 -34 C 20 -40, -40 -32, -70 -18 C -78 0, -78 0, -70 18 C -40 32, 20 40, 60 34 Z"
          fill={palette.body}
          {...line}
        />
        {spots.map((s, i) => (
          <ellipse
            key={i}
            cx={s.x}
            cy={s.y}
            rx={s.r * 1.3}
            ry={s.r}
            fill={palette.spot}
          />
        ))}
        {/* Pectoral fins flap a beat behind. */}
        <path
          d={`M 20 26 C 6 ${50 + fin * 10}, -20 ${58 + fin * 12}, -26 ${44 + fin * 8} Z`}
          fill={palette.fin}
          opacity={0.8}
          {...line}
        />
        <path
          d={`M 20 -26 C 6 ${-50 - fin * 10}, -20 ${-58 - fin * 12}, -26 ${-44 - fin * 8} Z`}
          fill={palette.fin}
          opacity={0.8}
          {...line}
        />
      </g>
      {/* Head. */}
      <path
        d="M 60 -34 C 100 -30, 118 -10, 120 0 C 118 10, 100 30, 60 34 Z"
        fill={palette.body}
        {...line}
      />
      <ellipse cx={86} cy={-2} rx={22} ry={18} fill={palette.spot} />
      <circle cx={104} cy={-16} r={4} fill={COLORS.ink} />
      <circle cx={104} cy={16} r={4} fill={COLORS.ink} />
    </g>
  );
};

// Two koi circling each other like yin and yang around (cx, cy).
export const KoiPair: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  start: number;
  opacity?: number;
  // Size of each fish.
  scale?: number;
}> = ({ cx, cy, radius, start, opacity = 1, scale = 1 }) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  const base = t * 0.03;
  return (
    <g opacity={opacity}>
      {/* Ripples spreading on the pond. */}
      {[0, 1, 2].map((i) => {
        const p = ((t + i * 30) % 90) / 90;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={radius * (0.4 + p * 1.1)}
            ry={radius * (0.16 + p * 0.44)}
            fill="none"
            stroke={COLORS.jade}
            strokeWidth={4}
            opacity={(1 - p) * 0.35}
          />
        );
      })}
      {[0, 1].map((k) => {
        const a = base + k * Math.PI;
        const r = radius * (1 + drift(`koi${k}`, frame, 0.02) * 0.08);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.42;
        // Heading follows the tangent of the (squashed) circle.
        const heading =
          (Math.atan2(Math.cos(a) * 0.42, -Math.sin(a)) * 180) / Math.PI;
        const depth = 0.85 + Math.sin(a) * 0.15;
        return (
          <g key={k} transform={`translate(${x} ${y}) rotate(${heading})`}>
            <KoiFish
              phase={t * 0.35 + k * 2}
              scale={depth * scale}
              seed={`koi${k}`}
            />
          </g>
        );
      })}
    </g>
  );
};

// Chinese gold coins tumbling down and bouncing on a floor line.
export const Coins: React.FC<{
  start: number;
  floor: number;
  count?: number;
  minX: number;
  maxX: number;
}> = ({ start, floor, count = 14, minX, maxX }) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const t0 = start + i * 2 + Math.floor(random(`cd${i}`) * 3);
        const t = frame - t0;
        if (t < 0) {
          return null;
        }
        const x = minX + random(`cx${i}`) * (maxX - minX);
        const y0 = -80 - random(`cy${i}`) * 300;
        const g = 1.6;
        // Fall, then damped bounces.
        const tHit = Math.sqrt((2 * (floor - y0)) / g);
        let y: number;
        if (t < tHit) {
          y = y0 + 0.5 * g * t * t;
        } else {
          const v = g * tHit * 0.42;
          const tb = t - tHit;
          const period = (2 * v) / g;
          const n = Math.floor(tb / Math.max(1, period));
          const damp = Math.pow(0.45, n);
          const tt = tb - n * period;
          y = floor - Math.max(0, v * damp * tt - 0.5 * g * tt * tt);
        }
        const spin = Math.cos(t * (0.25 + random(`cs${i}`) * 0.2) + i);
        const settle = t > tHit + 30 ? 0.25 : 1;
        const sx = Math.max(0.12, Math.abs(spin * settle + (1 - settle)));
        const size = 30 + random(`cz${i}`) * 14;
        return (
          <g key={i} transform={`translate(${x} ${y - size}) scale(${sx} 1)`}>
            <circle r={size} fill={COLORS.goldDeep} />
            <circle
              r={size * 0.86}
              fill={sx > 0.4 ? COLORS.gold : COLORS.goldDeep}
            />
            <circle
              r={size * 0.7}
              fill="none"
              stroke={COLORS.goldLight}
              strokeWidth={3}
              opacity={0.8}
            />
            <rect
              x={-size * 0.22}
              y={-size * 0.22}
              width={size * 0.44}
              height={size * 0.44}
              fill={COLORS.paper}
              stroke={COLORS.goldDeep}
              strokeWidth={3}
            />
          </g>
        );
      })}
    </g>
  );
};
