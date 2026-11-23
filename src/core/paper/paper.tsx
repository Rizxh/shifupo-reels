// Paper-cartoon look of the shared core (Motion Format screen language,
// docs/reverse/motionformat.md in video-motion-studio): shapes look cut from
// paper (slightly ragged edge + soft offset shadow), characters have simple
// cute faces that blink. Colors come from the product.

import { useCurrentFrame } from "remotion";

export type PaperFx = { edgeFrequency: number; edgeScale: number; shadowX: number; shadowY: number; shadow: string };

const SEEDS = [3, 7, 11, 19];

// One <svg> with the filters; place it once per composition.
export const PaperDefs: React.FC<{ fx: PaperFx }> = ({ fx }) => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      {SEEDS.map((seed, i) => (
        <filter key={seed} id={`paper-${i}`} x="-15%" y="-15%" width="140%" height="150%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={fx.edgeFrequency} numOctaves={2} seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={fx.edgeScale} xChannelSelector="R" yChannelSelector="G" result="cut" />
          <feFlood floodColor={fx.shadow} result="ink" />
          <feComposite in="ink" in2="cut" operator="in" result="shade" />
          <feOffset in="shade" dx={fx.shadowX} dy={fx.shadowY} result="drop" />
          <feMerge>
            <feMergeNode in="drop" />
            <feMergeNode in="cut" />
          </feMerge>
        </filter>
      ))}
    </defs>
  </svg>
);

// Filter id for a paper cut-out; `boil` > 0 swaps the edge noise every
// `boil` frames (stop-motion jitter).
export const usePaperFilter = (boil = 0): string => {
  const frame = useCurrentFrame();
  const i = boil > 0 ? Math.floor(frame / boil) % SEEDS.length : 0;
  return `url(#paper-${i})`;
};

export type FaceColors = { eye: string; shine: string; blush: string };
export type Mood = "happy" | "wink" | "closed" | "wow";

// Cute face: dark oval eyes with a shine dot, small smile, blushing cheeks.
// Blinks every `blinkEvery` frames (offset per character).
export const Face: React.FC<{
  x: number;
  y: number;
  size?: number;
  mood?: Mood;
  blinkOffset?: number;
  blinkEvery?: number;
  look?: number;
  colors: FaceColors;
}> = ({ x, y, size = 1, mood = "happy", blinkOffset = 0, blinkEvery = 96, look = 0, colors }) => {
  const frame = useCurrentFrame();
  const s = size;
  const gap = 15 * s;
  const e = 8.5 * s;
  const ey = e * 1.3;
  const cycle = (frame + blinkOffset) % blinkEvery;
  const lid = mood === "happy" && cycle < 6 ? Math.sin((cycle / 6) * Math.PI) : 0;
  const lx = look * e * 0.35;
  const closed = (dx: number) => (
    <path key={dx} d={`M${dx - e} 0 q${e} ${e * 1.1} ${e * 2} 0`} fill="none" stroke={colors.eye} strokeWidth={4 * s} strokeLinecap="round" />
  );
  const open = (dx: number, k = 1) => (
    <g key={dx}>
      <ellipse cx={dx + lx} cy={0} rx={e * k} ry={ey * k * (1 - lid * 0.92)} fill={colors.eye} />
      {lid < 0.5 ? <circle cx={dx + lx + e * 0.35} cy={-ey * 0.45} r={e * 0.36} fill={colors.shine} /> : null}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      {mood === "closed"
        ? [-gap, gap].map(closed)
        : mood === "wink"
          ? [open(-gap), closed(gap)]
          : mood === "wow"
            ? [-gap, gap].map((dx) => open(dx, 1.18))
            : [-gap, gap].map((dx) => open(dx))}
      {mood === "wow" ? (
        <ellipse cx={0} cy={ey + 7 * s} rx={4 * s} ry={5 * s} fill={colors.eye} />
      ) : (
        <path d={`M${-6 * s} ${ey + 3 * s} q${6 * s} ${6 * s} ${12 * s} 0`} fill="none" stroke={colors.eye} strokeWidth={3.4 * s} strokeLinecap="round" />
      )}
      <circle cx={-gap - 3 * s} cy={ey + 3 * s} r={5.5 * s} fill={colors.blush} opacity={0.55} />
      <circle cx={gap + 3 * s} cy={ey + 3 * s} r={5.5 * s} fill={colors.blush} opacity={0.55} />
    </g>
  );
};
