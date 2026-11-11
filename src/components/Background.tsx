import { noise2D } from "@remotion/noise";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, VIDEO } from "../lib/brand";
import { drift } from "../lib/motion";

const W = VIDEO.width;
const H = VIDEO.height;

// Cream paper with fibre grain and a soft warm vignette. Static, so it never
// shimmers between frames.
export const Paper: React.FC = () => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={2}
          seed={7}
        />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.27  0 0 0 0.11 0"
        />
      </filter>
      <filter id="paper-fibre" x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.18"
          numOctaves={2}
          seed={3}
        />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.55  0 0 0 0 0.47  0 0 0 0 0.35  0 0 0 0.07 0"
        />
      </filter>
      <radialGradient id="paper-vignette" cx="50%" cy="45%" r="75%">
        <stop offset="55%" stopColor={COLORS.paperDeep} stopOpacity={0} />
        <stop offset="100%" stopColor={COLORS.goldDeep} stopOpacity={0.22} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill={COLORS.paper} />
    <rect width={W} height={H} filter="url(#paper-grain)" />
    <rect width={W} height={H} filter="url(#paper-fibre)" />
    <rect width={W} height={H} fill="url(#paper-vignette)" />
  </svg>
);

// One sumi-e mountain range: ridged noise gives sharp peaks, a vertical wash
// fades the ink into mist. `scroll` moves the range sideways seamlessly.
const ridgePath = (
  seed: string,
  base: number,
  amp: number,
  freq: number,
  scroll: number,
) => {
  const step = 18;
  let d = `M -20 ${H} L -20 ${base}`;
  for (let x = -20; x <= W + 20; x += step) {
    const u = (x + scroll) * freq;
    const ridged = 1 - Math.abs(noise2D(seed, u, 0));
    const detail = noise2D(`${seed}-d`, u * 4.3, 0.5) * 0.12;
    const y = base - amp * (Math.pow(ridged, 2.4) + detail);
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return `${d} L ${W + 20} ${H} Z`;
};

type Range = {
  seed: string;
  base: number;
  amp: number;
  freq: number;
  speed: number;
  opacity: number;
  wash: number;
};

const RANGES: Range[] = [
  {
    seed: "far",
    base: 1180,
    amp: 420,
    freq: 0.0021,
    speed: 0.12,
    opacity: 0.22,
    wash: 520,
  },
  {
    seed: "mid",
    base: 1420,
    amp: 360,
    freq: 0.0029,
    speed: 0.3,
    opacity: 0.38,
    wash: 460,
  },
  {
    seed: "near",
    base: 1720,
    amp: 300,
    freq: 0.0037,
    speed: 0.62,
    opacity: 0.6,
    wash: 380,
  },
];

// Three mountain ranges with drifting mist. `parallax` adds camera travel
// (px) so scenes can move the world; each range moves by its own depth.
export const InkMountains: React.FC<{
  parallax?: number;
  lift?: number;
  opacity?: number;
}> = ({ parallax = 0, lift = 0, opacity = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      <defs>
        {RANGES.map((r) => (
          <linearGradient
            key={r.seed}
            id={`wash-${r.seed}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor={COLORS.ink} stopOpacity={r.opacity} />
            <stop
              offset={r.wash / H}
              stopColor={COLORS.ink}
              stopOpacity={r.opacity * 0.35}
            />
            <stop
              offset={(r.wash * 1.6) / H}
              stopColor={COLORS.ink}
              stopOpacity={0}
            />
          </linearGradient>
        ))}
        <radialGradient id="mist" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={COLORS.paper} stopOpacity={0.95} />
          <stop offset="1" stopColor={COLORS.paper} stopOpacity={0} />
        </radialGradient>
      </defs>
      {RANGES.map((r, i) => {
        const scroll = frame * r.speed + parallax * (0.4 + i * 0.5);
        const y = lift * (0.3 + i * 0.35);
        return (
          <g key={r.seed} transform={`translate(0 ${y.toFixed(1)})`}>
            <path
              d={ridgePath(
                r.seed,
                r.base - r.amp * 0.15,
                r.amp,
                r.freq,
                scroll,
              )}
              fill={`url(#wash-${r.seed})`}
              transform={`translate(0 ${-r.amp * 0.85})`}
            />
            {/* Mist bank in front of each range. */}
            {[0, 1, 2].map((m) => {
              const mx =
                ((m * 470 +
                  frame * (0.5 + i * 0.25) +
                  drift(`mist${i}${m}`, frame, 0.004) * 120) %
                  (W + 900)) -
                450;
              return (
                <ellipse
                  key={m}
                  cx={mx}
                  cy={r.base - r.amp * 0.55 + m * 30}
                  rx={520}
                  ry={110 + m * 20}
                  fill="url(#mist)"
                  opacity={0.75}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

// Bamboo stalks framing the left and right edges, swaying in a slow breeze.
const Stalk: React.FC<{
  x: number;
  height: number;
  seed: string;
  flip?: boolean;
  scale?: number;
}> = ({ x, height, seed, flip = false, scale = 1 }) => {
  const frame = useCurrentFrame();
  const sway = drift(seed, frame, 0.012) * 2.4 + Math.sin(frame / 38 + x) * 0.8;
  const segments = 7;
  const seg = height / segments;
  const width = 26 * scale;
  return (
    <g
      transform={`translate(${x} ${H + 40}) rotate(${(flip ? -1 : 1) * sway}) scale(${flip ? -1 : 1} 1)`}
    >
      {Array.from({ length: segments }, (_, i) => {
        const y = -(i + 1) * seg;
        const bend = Math.sin((i / segments) * 1.4) * 14;
        return (
          <g key={i} transform={`translate(${bend} 0)`}>
            <rect
              x={-width / 2}
              y={y + 4}
              width={width}
              height={seg - 8}
              rx={width / 2.4}
              fill={COLORS.inkSoft}
              opacity={0.82 - i * 0.04}
            />
            <rect
              x={-width / 2 - 3}
              y={y - 3}
              width={width + 6}
              height={7}
              rx={3}
              fill={COLORS.ink}
              opacity={0.9}
            />
          </g>
        );
      })}
      {/* Leaf sprays near the top, each with its own flutter. */}
      {[0.62, 0.78, 0.92].map((t, i) => {
        const y = -height * t;
        const flutter = drift(`${seed}-leaf${i}`, frame, 0.03) * 8;
        return (
          <g
            key={t}
            transform={`translate(${Math.sin(t * 1.4) * 14} ${y}) rotate(${-24 + i * 14 + flutter})`}
          >
            {[0, 1, 2, 3].map((k) => (
              <path
                key={k}
                d="M0 0 C 40 -10, 110 -6, 170 10 C 110 18, 40 16, 0 0 Z"
                transform={`rotate(${-30 + k * 22}) scale(${(0.9 - k * 0.1) * scale})`}
                fill={COLORS.ink}
                opacity={0.78 - k * 0.1}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
};

export const Bamboo: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity }}>
    {/* Left stalks stay short and at the edge: the text column is above them. */}
    <Stalk x={14} height={1020} seed="bl1" scale={1.05} />
    <Stalk x={70} height={820} seed="bl2" scale={0.8} />
    <Stalk x={W - 34} height={1360} seed="br1" flip scale={0.95} />
  </svg>
);

// Plum petals and gold flecks drifting down with a noise sway. Deterministic.
type Petal = {
  x: number;
  y: number;
  speed: number;
  sway: number;
  spin: number;
  size: number;
  gold: boolean;
  depth: number;
};
const PETALS: Petal[] = Array.from({ length: 30 }, (_, i) => ({
  x: random(`px${i}`) * W,
  y: random(`py${i}`) * (H + 200),
  speed: 0.9 + random(`ps${i}`) * 1.6,
  sway: 30 + random(`pw${i}`) * 60,
  spin: (random(`pr${i}`) - 0.5) * 6,
  size: 10 + random(`pz${i}`) * 16,
  gold: random(`pg${i}`) < 0.32,
  depth: 0.45 + random(`pd${i}`) * 0.55,
}));

export const Petals: React.FC<{ density?: number }> = ({ density = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = Math.round(PETALS.length * density);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {PETALS.slice(0, count).map((p, i) => {
        const y = ((p.y + frame * p.speed * p.depth) % (H + 200)) - 100;
        const x =
          p.x +
          drift(`petal${i}`, frame, 0.008) * p.sway +
          Math.sin(frame / fps + i) * 6;
        const r = frame * p.spin + i * 40;
        const flip = Math.cos(frame / (14 + (i % 7)) + i);
        return p.gold ? (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={p.size * 0.18 * p.depth}
            fill={COLORS.gold}
            opacity={0.75 * p.depth}
          />
        ) : (
          <path
            key={i}
            d="M0 -1 C 6 -10, 16 -6, 12 4 C 9 10, 2 11, 0 6 C -2 11, -9 10, -12 4 C -16 -6, -6 -10, 0 -1 Z"
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(1)}) scale(${((p.size / 14) * p.depth * flip).toFixed(3)} ${(p.size / 14) * p.depth})`}
            fill={COLORS.seal}
            opacity={0.55 * p.depth + 0.15}
          />
        );
      })}
    </svg>
  );
};
