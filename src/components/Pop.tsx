// Building blocks of the pop-out format (docs/sp02/PLAN.md): the lacquer
// frame, the worlds inside its window, and the objects that break out of it.
// Everything is placed through the camera in src/lib/space.ts.

import { noise2D } from "@remotion/noise";
import { random } from "remotion";
import { COLORS, FONTS, POP, VIDEO } from "../lib/brand";
import { breathe, drift, EASE, prog } from "../lib/motion";
import {
  FRAME_OUTER,
  nearLook,
  placeAt,
  polygonPath,
  project,
  quadAt,
  shadowOf,
  WINDOW,
  type Camera,
  type Projected,
} from "../lib/space";
import { GoldDefs } from "./Fx";
import { KoiFish, type KoiPalette } from "./Koi";

const W = VIDEO.width;
const H = VIDEO.height;

// A Gaussian blur filter; ids must be unique per drawn object.
export const BlurFilter: React.FC<{ id: string; sd: number }> = ({
  id,
  sd,
}) => (
  <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation={sd.toFixed(2)} />
  </filter>
);

// A drawing made in screen space, pushed back to depth z behind the window
// and enlarged by `oversize` so the camera sway never shows its edges.
export const AtDepth: React.FC<{
  cam: Camera;
  z: number;
  oversize?: number;
  children: React.ReactNode;
}> = ({ cam, z, oversize = 1.3, children }) => {
  const p = project(cam, WINDOW.cx, WINDOW.cy, z);
  const s = p.k * oversize;
  return (
    <g
      transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-WINDOW.cx} ${-WINDOW.cy})`}
    >
      {children}
    </g>
  );
};

// ---------------------------------------------------------------------------
// The frame.

const DEPTH_WALL_SHADE = [0.42, 0.22, 0.05, 0.22] as const;

// Soft shadow of the frame on the paper around it.
export const FrameShadow: React.FC<{ cam: Camera }> = ({ cam }) => {
  const outer = quadAt(cam, FRAME_OUTER, 0).map((p) => ({
    x: p.x + 14,
    y: p.y + 26,
  }));
  return (
    <g>
      <defs>
        <BlurFilter id="frame-shadow-blur" sd={22} />
      </defs>
      <path
        d={polygonPath(outer)}
        fill={COLORS.ink}
        opacity={0.32}
        filter="url(#frame-shadow-blur)"
      />
    </g>
  );
};

// Window clip: the opening of the frame on the plane z = 0.
export const windowPath = (cam: Camera): string =>
  polygonPath(quadAt(cam, WINDOW, 0));

// Lattice knot at a corner of the frame face, drawn in world units.
const cornerKnot = (
  cam: Camera,
  cx: number,
  cy: number,
  sx: number,
  sy: number,
): string => {
  const pt = (dx: number, dy: number) => {
    const p = project(cam, cx + dx * sx, cy + dy * sy, 0);
    return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  };
  const b = POP.frame.border;
  return [
    `M ${pt(b * 0.25, b * 2.6)} L ${pt(b * 0.25, b * 0.25)} L ${pt(b * 2.6, b * 0.25)}`,
    `M ${pt(b * 0.55, b * 1.9)} L ${pt(b * 0.55, b * 0.55)} L ${pt(b * 1.9, b * 0.55)}`,
    `M ${pt(b * 1.25, b * 1.25)} L ${pt(b * 1.25, b * 0.85)} L ${pt(b * 0.85, b * 0.85)} L ${pt(b * 0.85, b * 1.25)} Z`,
  ].join(" ");
};

// The lacquer frame: recessed inner walls, red face with gold bevels,
// lattice corners and a seal plaque on the top rail.
export const PopFrame: React.FC<{ cam: Camera; glyph: string }> = ({
  cam,
  glyph,
}) => {
  const outer = quadAt(cam, FRAME_OUTER, 0);
  const inner = quadAt(cam, WINDOW, 0);
  const back = quadAt(cam, WINDOW, -POP.recess);
  const b = POP.frame.border;
  const mid = quadAt(
    cam,
    {
      left: FRAME_OUTER.left + b * 0.45,
      right: FRAME_OUTER.right - b * 0.45,
      top: FRAME_OUTER.top + b * 0.45,
      bottom: FRAME_OUTER.bottom - b * 0.45,
    },
    0,
  );
  const plaque = project(cam, WINDOW.cx, FRAME_OUTER.top + b * 0.5, 0);
  const corners: [number, number, number, number][] = [
    [FRAME_OUTER.left, FRAME_OUTER.top, 1, 1],
    [FRAME_OUTER.right, FRAME_OUTER.top, -1, 1],
    [FRAME_OUTER.right, FRAME_OUTER.bottom, -1, -1],
    [FRAME_OUTER.left, FRAME_OUTER.bottom, 1, -1],
  ];
  return (
    <g>
      <GoldDefs id="pop-frame" />
      {/* Inner walls of the recess: top darkest, bottom lit. */}
      {[0, 1, 2, 3].map((i) => {
        const j = (i + 1) % 4;
        return (
          <g key={i}>
            <path
              d={polygonPath([inner[i], inner[j], back[j], back[i]])}
              fill={COLORS.sealDeep}
            />
            <path
              d={polygonPath([inner[i], inner[j], back[j], back[i]])}
              fill={COLORS.ink}
              opacity={DEPTH_WALL_SHADE[i]}
            />
          </g>
        );
      })}
      <path
        d={polygonPath(back)}
        fill="none"
        stroke={COLORS.ink}
        strokeWidth={3}
        opacity={0.45}
      />
      {/* Face. */}
      <path
        d={`${polygonPath(outer)} ${polygonPath(inner)}`}
        fillRule="evenodd"
        fill="url(#pop-frame-lacquer)"
      />
      <path
        d={polygonPath(mid)}
        fill="none"
        stroke="url(#pop-frame-gold)"
        strokeWidth={3}
        opacity={0.9}
      />
      <path
        d={polygonPath(outer)}
        fill="none"
        stroke={COLORS.goldDeep}
        strokeWidth={5}
      />
      <path
        d={polygonPath(inner)}
        fill="none"
        stroke={COLORS.goldLight}
        strokeWidth={5}
      />
      {corners.map(([x, y, sx, sy], i) => (
        <path
          key={i}
          d={cornerKnot(cam, x, y, sx, sy)}
          fill="none"
          stroke="url(#pop-frame-gold)"
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ))}
      {/* Seal plaque on the top rail. */}
      <g transform={placeAt(plaque)}>
        <circle r={b * 1.05} fill="url(#pop-frame-gold)" />
        <circle r={b * 0.86} fill={COLORS.seal} />
        <text
          y={b * 0.34}
          textAnchor="middle"
          fontFamily={FONTS.han}
          fontWeight={900}
          fontSize={b * 0.95}
          fill={COLORS.goldLight}
        >
          {glyph}
        </text>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Worlds inside the window.

// Night koi pond: ink to jade water, moon glow, lotus pads at several depths.
const PADS = Array.from({ length: 8 }, (_, i) => ({
  x: WINDOW.left + random(`pad-x${i}`) * (WINDOW.right - WINDOW.left),
  y: WINDOW.cy + 40 + random(`pad-y${i}`) * 230,
  z: -820 + random(`pad-z${i}`) * 520,
  r: 46 + random(`pad-r${i}`) * 30,
  flower: i % 3 === 0,
}));

export const PondInside: React.FC<{ cam: Camera; frame: number }> = ({
  cam,
  frame,
}) => {
  const moon = project(cam, WINDOW.cx + 170, WINDOW.cy - 150, -900);
  return (
    <g>
      <defs>
        <linearGradient id="pond-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.ink} />
          <stop offset="0.5" stopColor={COLORS.inkSoft} />
          <stop offset="1" stopColor={COLORS.jade} />
        </linearGradient>
        <radialGradient id="pond-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={COLORS.goldLight} stopOpacity={0.9} />
          <stop offset="0.4" stopColor={COLORS.gold} stopOpacity={0.25} />
          <stop offset="1" stopColor={COLORS.gold} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#pond-water)" />
      <g transform={placeAt(moon)}>
        <ellipse rx={260} ry={120} fill="url(#pond-moon)" />
        <ellipse rx={70} ry={22} fill={COLORS.goldLight} opacity={0.5} />
      </g>
      {PADS.slice()
        .sort((a, b) => a.z - b.z)
        .map((pad, i) => {
          const p = project(
            cam,
            pad.x + drift(`pad-dx${i}`, frame, 0.01) * 16,
            pad.y,
            pad.z,
          );
          return (
            <g key={i} transform={placeAt(p)}>
              <path
                d={`M 0 0 L ${pad.r} ${-pad.r * 0.12} A ${pad.r} ${pad.r * 0.42} 0 1 1 ${pad.r} ${pad.r * 0.12} Z`}
                fill={COLORS.jade}
                stroke={COLORS.ink}
                strokeWidth={3}
                opacity={0.92}
              />
              {pad.flower ? (
                <g transform={`translate(${-pad.r * 0.2} ${-pad.r * 0.25})`}>
                  {[-1, 0, 1].map((k) => (
                    <path
                      key={k}
                      d="M 0 0 C -10 -14, -6 -32, 0 -40 C 6 -32, 10 -14, 0 0 Z"
                      transform={`rotate(${k * 34})`}
                      fill={k === 0 ? COLORS.paper : COLORS.seal}
                      stroke={COLORS.ink}
                      strokeWidth={2}
                    />
                  ))}
                </g>
              ) : null}
            </g>
          );
        })}
    </g>
  );
};

// Expanding ripple rings where the koi dived, on the water at depth z.
export const Ripples: React.FC<{
  cam: Camera;
  frame: number;
  at: number;
  x: number;
  y: number;
  z: number;
}> = ({ cam, frame, at, x, y, z }) => {
  const p = project(cam, x, y, z);
  return (
    <g transform={placeAt(p)}>
      {[0, 7, 14].map((delay) => {
        const t = (frame - at - delay) / 40;
        if (t < 0 || t > 1) {
          return null;
        }
        const r = 30 + EASE.out(t) * 220;
        return (
          <ellipse
            key={delay}
            rx={r}
            ry={r * 0.32}
            fill="none"
            stroke={COLORS.goldLight}
            strokeWidth={4}
            opacity={(1 - t) * 0.8}
          />
        );
      })}
    </g>
  );
};

// Sumi-e ridges in mist behind the window: three ranges at their own depth
// (parallax under the camera sway) and a red sun.
type Ridge = {
  seed: string;
  z: number;
  base: number;
  amp: number;
  freq: number;
  speed: number;
  opacity: number;
};

const RIDGES: Ridge[] = [
  {
    seed: "rf",
    z: -980,
    base: 20,
    amp: 150,
    freq: 0.0032,
    speed: 0.12,
    opacity: 0.22,
  },
  {
    seed: "rm",
    z: -720,
    base: 110,
    amp: 120,
    freq: 0.0046,
    speed: 0.25,
    opacity: 0.36,
  },
  {
    seed: "rn",
    z: -480,
    base: 200,
    amp: 95,
    freq: 0.0062,
    speed: 0.45,
    opacity: 0.55,
  },
];
const RIDGE_STEP = 8;
const RIDGE_MARGIN = 420;

const ridgePath = (r: Ridge, frame: number, lift: number): string => {
  const pts: string[] = [];
  for (
    let x = WINDOW.left - RIDGE_MARGIN;
    x <= WINDOW.right + RIDGE_MARGIN;
    x += RIDGE_STEP
  ) {
    const n = noise2D(r.seed, (x + frame * r.speed) * r.freq, 0);
    // Soft shoulders with a few sharp peaks, like a brush ridge.
    const ridged = (1 - Math.abs(n)) ** 1.6;
    const y = WINDOW.cy + r.base + lift - ridged * r.amp;
    pts.push(`${x} ${y.toFixed(1)}`);
  }
  const bottom = WINDOW.bottom + RIDGE_MARGIN;
  return `M ${WINDOW.left - RIDGE_MARGIN} ${bottom} L ${pts.join(" L ")} L ${WINDOW.right + RIDGE_MARGIN} ${bottom} Z`;
};

export const MountainsInside: React.FC<{
  cam: Camera;
  frame: number;
  lift?: number;
  opacity?: number;
}> = ({ cam, frame, lift = 0, opacity = 1 }) => {
  const sun = project(cam, WINDOW.cx + 200, WINDOW.cy - 150, -1050);
  return (
    <g opacity={opacity}>
      <defs>
        {RIDGES.map((r) => (
          <linearGradient
            key={r.seed}
            id={`ridge-${r.seed}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0"
              stopColor={COLORS.inkSoft}
              stopOpacity={r.opacity}
            />
            <stop
              offset="0.55"
              stopColor={COLORS.inkSoft}
              stopOpacity={r.opacity * 0.35}
            />
            <stop offset="1" stopColor={COLORS.paperDeep} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      <rect width={W} height={H} fill={COLORS.paper} />
      <circle
        transform={placeAt(sun)}
        r={74}
        fill={COLORS.seal}
        opacity={0.85}
      />
      {RIDGES.map((r) => (
        <AtDepth key={r.seed} cam={cam} z={r.z} oversize={1.25}>
          <path d={ridgePath(r, frame, lift)} fill={`url(#ridge-${r.seed})`} />
          <ellipse
            cx={WINDOW.cx + drift(`mist-${r.seed}`, frame, 0.006) * 160}
            cy={WINDOW.cy + r.base + lift + 30}
            rx={900}
            ry={70}
            fill={COLORS.paper}
            opacity={0.55}
          />
        </AtDepth>
      ))}
    </g>
  );
};

// Warm treasure room: ink walls lit by a turning fan of gold rays.
export const GoldRoomInside: React.FC<{ cam: Camera; frame: number }> = ({
  cam,
  frame,
}) => {
  const c = project(cam, WINDOW.cx, WINDOW.cy, -700);
  return (
    <g>
      <defs>
        <radialGradient id="room-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor={COLORS.goldLight} />
          <stop offset="0.35" stopColor={COLORS.gold} />
          <stop offset="1" stopColor={COLORS.ink} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={COLORS.ink} />
      <g transform={placeAt(c)}>
        <circle r={900} fill="url(#room-glow)" opacity={0.85} />
        <g transform={`rotate(${frame * 0.6})`}>
          {Array.from({ length: 14 }, (_, i) => (
            <path
              key={i}
              d="M 0 0 L 1100 -70 L 1100 70 Z"
              transform={`rotate(${(i * 360) / 14})`}
              fill={COLORS.goldLight}
              opacity={0.12}
            />
          ))}
        </g>
      </g>
    </g>
  );
};

// A gold ingot (yuanbao) deep in the treasure room. Coins keep hopping out
// of it and falling back while it waits; it shakes harder as the burst nears
// (anticipation), flashes, and gives way to the coin burst.
const INGOT = {
  z: -620,
  width: 420,
  shakeFrames: 40,
  flashFrames: 8,
  // A coin hops out every `hopEvery` frames, `hopFrames` long.
  hopEvery: 9,
  hopFrames: 22,
  hopHeight: 170,
  hopCoinRadius: 34,
};

export const Ingot: React.FC<{
  cam: Camera;
  frame: number;
  start: number;
  burstAt: number;
}> = ({ cam, frame, start, burstAt }) => {
  const rise = prog(frame, start, start + 18, EASE.out);
  const gone = prog(frame, burstAt, burstAt + INGOT.flashFrames, EASE.in);
  if (gone >= 1) {
    return null;
  }
  const shake =
    prog(frame, burstAt - INGOT.shakeFrames, burstAt, EASE.in) *
    drift("ingot-shake", frame, 0.9) *
    12;
  const baseY = WINDOW.cy + 70 + (1 - rise) * 220;
  const p = project(cam, WINDOW.cx + shake, baseY, INGOT.z);
  const w = INGOT.width / 2;
  const hops = Array.from(
    {
      length: Math.max(
        0,
        Math.ceil((burstAt - start - 20 - INGOT.hopFrames) / INGOT.hopEvery),
      ),
    },
    (_, k) => start + 20 + k * INGOT.hopEvery,
  );
  return (
    <g>
      {hops.map((t0, k) => {
        const t = (frame - t0) / INGOT.hopFrames;
        if (t < 0 || t > 1) {
          return null;
        }
        const side = (k % 2 === 0 ? 1 : -1) * (40 + random(`hop${k}`) * 90);
        const c = project(
          cam,
          WINDOW.cx + side * t,
          baseY - w * 0.3 - Math.sin(Math.PI * t) * INGOT.hopHeight,
          INGOT.z + 20,
        );
        return (
          <g key={k} transform={placeAt(c)} opacity={rise}>
            <CoinShape r={INGOT.hopCoinRadius} spin={t * 9 + k} />
          </g>
        );
      })}
      <g
        transform={placeAt(
          p,
          breathe(frame, VIDEO.fps, 0.02, 1.9) + gone * 0.4,
          shake * 0.4,
        )}
        opacity={rise * (1 - gone)}
      >
        <GoldDefs id="ingot" />
        <ellipse rx={w * 1.6} ry={w * 0.9} fill="url(#ingot-glow)" />
        <path
          d={`M ${-w} ${-w * 0.2} C ${-w * 0.8} ${w * 0.55}, ${w * 0.8} ${w * 0.55}, ${w} ${-w * 0.2} C ${w * 0.6} ${-w * 0.05}, ${-w * 0.6} ${-w * 0.05}, ${-w} ${-w * 0.2} Z`}
          fill="url(#ingot-gold)"
          stroke={COLORS.ink}
          strokeWidth={4}
        />
        <ellipse
          cy={-w * 0.22}
          rx={w * 0.42}
          ry={w * 0.3}
          fill="url(#ingot-gold)"
          stroke={COLORS.ink}
          strokeWidth={4}
        />
        <ellipse
          cy={-w * 0.3}
          rx={w * 0.18}
          ry={w * 0.08}
          fill={COLORS.white}
          opacity={0.7}
        />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Objects that break out.

export const GOLD_KOI = (id: string): KoiPalette => ({
  body: `url(#${id}-gold)`,
  spot: COLORS.seal,
  fin: COLORS.goldLight,
  outline: COLORS.ink,
});

const INK_KOI: KoiPalette = {
  body: COLORS.ink,
  spot: COLORS.ink,
  fin: COLORS.ink,
};

// A koi at a world point, with its shadow on the frame plane when it is in
// front of it, depth of field and near fade.
export const KoiAt: React.FC<{
  cam: Camera;
  id: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  phase: number;
}> = ({ cam, id, x, y, z, heading, phase }) => {
  const p = project(cam, x, y, z);
  const look = nearLook(p);
  if (look.opacity <= 0) {
    return null;
  }
  const shadow = shadowOf(cam, x, y, z);
  return (
    <g>
      <defs>
        <GoldDefs id={id} />
        {shadow ? <BlurFilter id={`${id}-sh`} sd={shadow.blur} /> : null}
        {look.blur > 0 ? <BlurFilter id={`${id}-dof`} sd={look.blur} /> : null}
      </defs>
      {shadow ? (
        <g
          transform={placeAt(shadow.p, POP.koiScale, heading)}
          opacity={shadow.opacity * look.opacity}
          filter={`url(#${id}-sh)`}
        >
          <KoiFish phase={phase} seed={id} palette={INK_KOI} />
        </g>
      ) : null}
      <g
        transform={placeAt(p, POP.koiScale, heading)}
        opacity={look.opacity}
        filter={look.blur > 0 ? `url(#${id}-dof)` : undefined}
      >
        <KoiFish phase={phase} seed={id} palette={GOLD_KOI(id)} />
      </g>
    </g>
  );
};

// Water drops thrown out of the window where the koi broke through.
const DROPS = Array.from({ length: 36 }, (_, i) => {
  const a = random(`drop-a${i}`) * Math.PI * 2;
  const speed = 3 + random(`drop-s${i}`) * 11;
  return {
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed - 7,
    vz: 10 + random(`drop-z${i}`) * 26,
    size: 3.5 + random(`drop-r${i}`) * 5.5,
    gold: i % 5 === 0,
  };
});
const DROP_LIFE = 34;
const DROP_GRAVITY = 0.9;
// How much a drop stretches per px/frame of speed.
const DROP_STRETCH = 0.16;

export const Splash: React.FC<{
  cam: Camera;
  frame: number;
  at: number;
  x: number;
  y: number;
}> = ({ cam, frame, at, x, y }) => {
  const t = frame - at;
  if (t < 0 || t > DROP_LIFE) {
    return null;
  }
  const fade = 1 - prog(frame, at + DROP_LIFE - 10, at + DROP_LIFE);
  return (
    <g>
      {DROPS.map((d, i) => {
        const wx = x + d.vx * t;
        const wy = y + d.vy * t + 0.5 * DROP_GRAVITY * t * t;
        const wz = d.vz * t;
        const p = project(cam, wx, wy, wz);
        const look = nearLook(p);
        const vyNow = d.vy + DROP_GRAVITY * t;
        const speed = Math.hypot(d.vx, vyNow);
        const angle = (Math.atan2(vyNow, d.vx) * 180) / Math.PI;
        return (
          <ellipse
            key={i}
            transform={placeAt(p, 1, angle)}
            rx={d.size * (1.2 + speed * DROP_STRETCH)}
            ry={d.size}
            fill={d.gold ? COLORS.goldLight : COLORS.white}
            stroke={COLORS.jade}
            strokeWidth={1.5}
            opacity={0.9 * fade * look.opacity}
          />
        );
      })}
    </g>
  );
};

// One gold coin drawn around (0, 0) at radius r, flipping with `spin`.
const CoinShape: React.FC<{ r: number; spin: number }> = ({ r, spin }) => {
  const sx = Math.max(0.1, Math.abs(Math.cos(spin)));
  const face = Math.cos(spin) > 0;
  return (
    <g transform={`scale(${sx.toFixed(3)} 1)`}>
      <circle
        r={r}
        fill={COLORS.goldDeep}
        stroke={COLORS.ink}
        strokeWidth={3}
      />
      <circle r={r * 0.84} fill={face ? COLORS.gold : COLORS.goldDeep} />
      <circle
        r={r * 0.68}
        fill="none"
        stroke={COLORS.goldLight}
        strokeWidth={3}
        opacity={0.85}
      />
      <rect
        x={-r * 0.22}
        y={-r * 0.22}
        width={r * 0.44}
        height={r * 0.44}
        fill={COLORS.ink}
        opacity={0.85}
      />
    </g>
  );
};

type CoinState = { i: number; x: number; y: number; z: number; spin: number };

const COINS = Array.from({ length: 26 }, (_, i) => ({
  delay: Math.floor(random(`coin-d${i}`) * 7),
  a: random(`coin-a${i}`) * Math.PI * 2,
  spread: 4 + random(`coin-sp${i}`) * 9,
  vz: 46 + random(`coin-vz${i}`) * 34,
  spin: 0.2 + random(`coin-spin${i}`) * 0.25,
  r: 34 + random(`coin-r${i}`) * 14,
}));
const COIN_START_Z = -900;

const coinStates = (frame: number, at: number): CoinState[] =>
  COINS.flatMap((c, i) => {
    const t = frame - at - c.delay;
    if (t < 0) {
      return [];
    }
    return [
      {
        i,
        x: WINDOW.cx + Math.cos(c.a) * c.spread * t,
        y: WINDOW.cy + Math.sin(c.a) * c.spread * t * 0.8 + 0.12 * t * t,
        z: COIN_START_Z + c.vz * t,
        spin: t * c.spin + i,
      },
    ];
  });

// Coins bursting from deep in the window toward the viewer. `side` picks the
// ones behind the frame plane (clipped by the window) or in front of it.
export const CoinBurst: React.FC<{
  cam: Camera;
  frame: number;
  at: number;
  side: "inside" | "front";
}> = ({ cam, frame, at, side }) => (
  <g>
    {coinStates(frame, at)
      .filter((c) => (side === "front" ? c.z >= 0 : c.z < 0))
      .sort((a, b) => a.z - b.z)
      .map((c) => {
        const p = project(cam, c.x, c.y, c.z);
        const look = nearLook(p);
        if (look.opacity <= 0) {
          return null;
        }
        const r = COINS[c.i].r;
        const shadow = side === "front" ? shadowOf(cam, c.x, c.y, c.z) : null;
        const id = `coin-${c.i}`;
        return (
          <g key={c.i}>
            <defs>
              {shadow ? <BlurFilter id={`${id}-sh`} sd={shadow.blur} /> : null}
              {look.blur > 0 ? (
                <BlurFilter id={`${id}-dof`} sd={look.blur} />
              ) : null}
            </defs>
            {shadow ? (
              <circle
                transform={placeAt(shadow.p)}
                r={r}
                fill={COLORS.ink}
                opacity={shadow.opacity * look.opacity}
                filter={`url(#${id}-sh)`}
              />
            ) : null}
            <g
              transform={placeAt(p)}
              opacity={look.opacity}
              filter={look.blur > 0 ? `url(#${id}-dof)` : undefined}
            >
              <CoinShape r={r} spin={c.spin} />
            </g>
          </g>
        );
      })}
  </g>
);

// Compass needle drawn around (0, 0), pointing up at angle 0.
export const Needle: React.FC<{ angle: number; length: number }> = ({
  angle,
  length,
}) => (
  <g transform={`rotate(${angle.toFixed(2)})`}>
    <path
      d={`M 0 ${-length} L ${length * 0.09} 0 L 0 ${length * 0.12} L ${-length * 0.09} 0 Z`}
      fill={COLORS.seal}
      stroke={COLORS.ink}
      strokeWidth={3}
    />
    <path
      d={`M 0 ${length} L ${length * 0.09} 0 L 0 ${-length * 0.12} L ${-length * 0.09} 0 Z`}
      fill={COLORS.goldLight}
      stroke={COLORS.ink}
      strokeWidth={3}
    />
    <circle
      r={length * 0.07}
      fill={COLORS.goldDeep}
      stroke={COLORS.ink}
      strokeWidth={3}
    />
  </g>
);

// Petals and gold motes drifting in front of the frame the whole reel: the
// constant hint that there is space between the frame and the viewer.
const FRONT_PETALS = Array.from({ length: 10 }, (_, i) => ({
  x: 40 + random(`fp-x${i}`) * (W - 80),
  y: random(`fp-y${i}`) * (H + 400) - 200,
  z: 120 + random(`fp-z${i}`) * 520,
  fall: 1.1 + random(`fp-f${i}`) * 1.4,
  spin: (random(`fp-s${i}`) - 0.5) * 5,
  size: 0.9 + random(`fp-r${i}`) * 0.7,
  gold: i % 3 === 0,
}));

export const FrontPetals: React.FC<{ cam: Camera; frame: number }> = ({
  cam,
  frame,
}) => (
  <g>
    {FRONT_PETALS.map((f, i) => {
      const span = H + 400;
      const y = ((f.y + frame * f.fall) % span) - 200;
      const x = f.x + drift(`fp-dx${i}`, frame, 0.008) * 70;
      const p: Projected = project(cam, x, y, f.z);
      const flip = Math.cos(frame / (13 + (i % 5)) + i);
      return f.gold ? (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={5 * p.k * f.size}
          fill={COLORS.gold}
          opacity={0.75}
        />
      ) : (
        <path
          key={i}
          d="M0 -1 C 6 -10, 16 -6, 12 4 C 9 10, 2 11, 0 6 C -2 11, -9 10, -12 4 C -16 -6, -6 -10, 0 -1 Z"
          transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(frame * f.spin + i * 40).toFixed(1)}) scale(${(p.k * f.size * 1.3 * flip).toFixed(3)} ${(p.k * f.size * 1.3).toFixed(3)})`}
          fill={COLORS.seal}
          opacity={0.8}
        />
      );
    })}
  </g>
);
