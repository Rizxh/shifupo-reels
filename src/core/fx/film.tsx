// Film finish of the shared core for cinematic (3D) formats: vignette, fine
// moving grain, and soft top/bottom scrims so titles and captions stay
// readable over bright skies without boxes. Deterministic per frame.

import { AbsoluteFill, useCurrentFrame } from "remotion";

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 78% 64% at 50% 46%, rgba(0,0,0,0) 55%, rgba(8,5,4,${strength}) 100%)`,
    }}
  />
);

export const FilmGrain: React.FC<{ width: number; height: number; opacity?: number }> = ({ width, height, opacity = 0.06 }) => {
  const frame = useCurrentFrame();
  // New grain every frame: changing it every 2nd frame made frame-to-frame
  // differences alternate, which reads as jitter (qc-motion jerk).
  const seed = frame % 16;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay" }}>
      <svg width={width} height={height}>
        <filter id={`film-grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${opacity * 14} 0`} />
        </filter>
        <rect width={width} height={height} filter={`url(#film-grain-${seed})`} fill="#ffffff" />
      </svg>
    </AbsoluteFill>
  );
};

// Darkens the top and bottom bands where text sits (gradient, no box).
export const TextScrims: React.FC<{ top?: number; bottom?: number; strength?: number }> = ({
  top = 0.32,
  bottom = 0.3,
  strength = 0.55,
}) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `linear-gradient(180deg, rgba(10,7,5,${strength}) 0%, rgba(10,7,5,0) ${top * 100}%, rgba(10,7,5,0) ${(1 - bottom) * 100}%, rgba(10,7,5,${strength}) 100%)`,
    }}
  />
);

// Warm light leak that blooms across a cut (screen blend), 0..1 progress.
export const LightLeak: React.FC<{ progress: number; color: string; x?: number; y?: number }> = ({ progress, color, x = 70, y = 30 }) => {
  if (progress <= 0 || progress >= 1) {
    return null;
  }
  const k = Math.sin(Math.PI * progress);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: k * 0.85,
        background: `radial-gradient(ellipse 90% 70% at ${x}% ${y}%, ${color} 0%, rgba(0,0,0,0) 70%)`,
      }}
    />
  );
};
