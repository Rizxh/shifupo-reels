// Atmosphere layers of the shared core: the air between things. A world with
// no atmosphere reads as "polos" (docs/core/AUDIT.md §3.2). Every layer moves
// on its own clock (wind, light, gravity), deterministic per frame, and takes
// its colors from the product, so the same engine serves ink-painting 2D and
// cinematic looks.

import { noise2D } from "@remotion/noise";
import { random, useCurrentFrame } from "remotion";
import { projectile } from "../motion/physics";

type Size = { width: number; height: number };

// Drifting mist bands (ink wash / low cloud): soft, layered, parallaxed.
export const MistBands: React.FC<
  Size & { color: string; bands?: number; top?: number; bottom?: number; opacity?: number; speed?: number; seed?: string }
> = ({ width, height, color, bands = 4, top = 0.35, bottom = 0.9, opacity = 0.35, speed = 0.6, seed = "mist" }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id={`${seed}-soft`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={28} />
        </filter>
      </defs>
      {Array.from({ length: bands }, (_, i) => {
        const depth = (i + 1) / bands; // 0..1, near bands faster and lower
        const y = height * (top + (bottom - top) * depth);
        const drift = ((frame * speed * (0.4 + depth)) % (width * 2)) - width * 0.5;
        const pts: string[] = [];
        for (let k = 0; k <= 12; k++) {
          const x = -width * 0.5 + (k / 12) * width * 2;
          const n = noise2D(`${seed}-${i}`, k * 0.6, frame * 0.004);
          pts.push(`${x.toFixed(1)},${(y + n * 60 * depth).toFixed(1)}`);
        }
        const thick = 70 + depth * 90;
        return (
          <g key={i} transform={`translate(${drift.toFixed(1)} 0)`} filter={`url(#${seed}-soft)`} opacity={opacity * (0.5 + depth * 0.5)}>
            <polygon points={`${pts.join(" ")} ${width * 1.5},${y + thick} ${-width * 0.5},${y + thick}`} fill={color} />
          </g>
        );
      })}
    </svg>
  );
};

// Volumetric-looking light rays from a source (sun through clouds/windows).
export const LightRays: React.FC<
  Size & { x: number; y: number; color: string; rays?: number; length?: number; spreadDeg?: number; angleDeg?: number; opacity?: number; seed?: string }
> = ({ width, height, x, y, color, rays = 7, length = 1700, spreadDeg = 40, angleDeg = 115, opacity = 0.18, seed = "rays" }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${seed}-g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color} stopOpacity={0.9} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id={`${seed}-b`}>
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      {Array.from({ length: rays }, (_, i) => {
        const base = angleDeg - spreadDeg / 2 + (spreadDeg * (i + 0.5)) / rays;
        const sway = noise2D(`${seed}-a${i}`, frame * 0.006, 0) * 4;
        const pulse = 0.55 + 0.45 * (0.5 + 0.5 * noise2D(`${seed}-p${i}`, frame * 0.012, 1));
        const w = 30 + random(`${seed}-w${i}`) * 70;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(base + sway).toFixed(2)})`} opacity={opacity * pulse} filter={`url(#${seed}-b)`}>
            <polygon points={`0,${-w * 0.15} ${length},${-w} ${length},${w} 0,${w * 0.15}`} fill={`url(#${seed}-g)`} />
          </g>
        );
      })}
    </svg>
  );
};

// Floating motes (dust in light, embers, gold specks): wind sway + gentle
// gravity, each re-spawning on its own cycle; nearer motes are larger and
// blurrier (depth of field).
export const Motes: React.FC<
  Size & { color: string; count?: number; rise?: boolean; opacity?: number; seed?: string }
> = ({ width, height, color, count = 36, rise = true, opacity = 0.7, seed = "motes" }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const depth = random(`${seed}-d${i}`);
        const life = 160 + random(`${seed}-l${i}`) * 200;
        const t = (frame + random(`${seed}-o${i}`) * life) % life;
        const p = projectile(t, {
          x0: random(`${seed}-x${i}`) * width,
          y0: rise ? height * (0.75 + random(`${seed}-y${i}`) * 0.3) : -40,
          vx: 0.15 + depth * 0.35,
          vy: rise ? -(0.6 + depth * 1.4) : 0.8 + depth,
          gravity: rise ? -0.0015 : 0.004,
          drag: 0.002,
        });
        const sway = noise2D(`${seed}-s${i}`, frame * 0.01, 0) * 30 * (0.4 + depth);
        const r = 1.4 + depth * 4.2;
        const fade = Math.sin((Math.PI * t) / life);
        const twinkle = 0.6 + 0.4 * Math.sin(frame * 0.2 + i);
        return (
          <circle
            key={i}
            cx={p.x + sway}
            cy={p.y}
            r={r}
            fill={color}
            opacity={opacity * fade * twinkle * (0.4 + depth * 0.6)}
            style={depth > 0.8 ? { filter: `blur(${((depth - 0.8) * 10).toFixed(1)}px)` } : undefined}
          />
        );
      })}
    </svg>
  );
};
