// The wheel of the 12 shio (sp06): red seals on a gold ring around the sign
// of the year, which burns in the center. One continuous object for the
// whole reel (Motion Format continuity): the composition only moves its
// camera (scale, rotation, center) and tells it which seals light up and
// which relation to draw. Every position is computed here in screen space,
// so glyphs and labels stay upright while the wheel turns.

import { noise2D } from "@remotion/noise";
import { useVideoConfig } from "remotion";
import { idle, squashOnImpact } from "../core/motion/acting";
import { backOut, powOut, track } from "../core/motion/tracks";
import { COLORS, FONTS } from "../lib/brand";
import { SHIO_COLORS, SHIO_GLYPH, SHIO_LINK, SHIO_ORDER, WHEEL } from "../products/shifupo/shio";
import type { ShioSign } from "../schema";
import { GoldDefs } from "./Fx";

export type WheelCam = { cx: number; cy: number; s: number; rot: number; opacity: number };
export type LitWindow = { sign: ShioSign; label: string; from: number; to: number };
export type LinkWindow = { kind: "trine" | "ally" | "clash"; members: ShioSign[]; from: number; to: number };

const ID = "shio";

export const sealPoint = (sign: ShioSign, cam: WheelCam): { x: number; y: number } => {
  const i = SHIO_ORDER.indexOf(sign);
  const a = ((i * 30 - 90 + cam.rot) * Math.PI) / 180;
  return { x: cam.cx + Math.cos(a) * WHEEL.radius * cam.s, y: cam.cy + Math.sin(a) * WHEEL.radius * cam.s };
};

const c01 = (t: number) => Math.min(1, Math.max(0, t));
const windowAmount = (frame: number, from: number, to: number, fade = 8) =>
  c01((frame - from) / 6) * (1 - c01((frame - (to - fade)) / fade));

// Ink flame: tongues of fire that flicker on their own noise clock.
const Flame: React.FC<{ frame: number; x: number; y: number; r: number; amount: number }> = ({ frame, x, y, r, amount }) => {
  if (amount <= 0) {
    return null;
  }
  const tongues = 9;
  const layer = (scale: number, color: string, opacity: number, seed: string) => {
    const pts: string[] = [];
    for (let k = 0; k <= tongues * 2; k++) {
      const ang = Math.PI + (k / (tongues * 2)) * Math.PI;
      const tip = k % 2 === 1;
      const n = noise2D(`${seed}-${k}`, frame / 9, 0);
      const len = tip ? r * scale * (1.25 + 0.35 * n) * (k === tongues ? 1.35 : 1) : r * scale * 0.96;
      pts.push(`${(x + Math.cos(ang) * len * 0.92).toFixed(1)},${(y + Math.sin(ang) * len).toFixed(1)}`);
    }
    return <polygon points={pts.join(" ")} fill={color} opacity={opacity * amount} strokeLinejoin="round" />;
  };
  return (
    <g style={{ filter: "blur(2px)" }}>
      {layer(1.45, SHIO_COLORS.flameOuter, 0.85, "fo")}
      {layer(1.28, SHIO_COLORS.flameMid, 0.9, "fm")}
      {layer(1.12, SHIO_COLORS.flameCore, 0.95, "fc")}
    </g>
  );
};

const Seal: React.FC<{
  x: number;
  y: number;
  r: number;
  glyph: string;
  glyphSize: number;
  lit: number;
  dim: number;
  scale: number;
  squash: [number, number];
  rotate: number;
}> = ({ x, y, r, glyph, glyphSize, lit, dim, scale, squash, rotate }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale * squash[0]} ${scale * squash[1]})`} opacity={1 - (1 - WHEEL.dimOpacity) * dim}>
    {lit > 0 ? <circle r={r * 1.9} fill={`url(#${ID}-glow)`} opacity={lit} /> : null}
    <circle r={r + 6} fill={`url(#${ID}-gold)`} />
    <circle r={r} fill={`url(#${ID}-lacquer)`} />
    <circle r={r - 7} fill="none" stroke={COLORS.goldLight} strokeWidth={1.6} opacity={0.6} />
    <text
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily={FONTS.han}
      fontWeight={900}
      fontSize={glyphSize}
      fill={SHIO_COLORS.glyph}
    >
      {glyph}
    </text>
  </g>
);

export const ShioWheel: React.FC<{
  frame: number;
  cam: WheelCam;
  yearSign: ShioSign;
  heroFrom: number;
  heroFlight: { from: number; to: number; target: { x: number; y: number } } | null;
  lit: LitWindow[];
  links: LinkWindow[];
}> = ({ frame, cam, yearSign, heroFrom, heroFlight, lit, links }) => {
  const { width, height } = useVideoConfig();
  const anyLit = lit.some((w) => frame >= w.from && frame < w.to);
  const litOf = (sign: ShioSign) => {
    let amount = 0;
    let since = Infinity;
    for (const w of lit) {
      if (w.sign === sign) {
        amount = Math.max(amount, windowAmount(frame, w.from, w.to));
        if (frame >= w.from) {
          since = Math.min(since, frame - w.from);
        }
      }
    }
    return { amount, since };
  };

  // Hero: the sign of the year, centered and upright, burning.
  const heroIn = track(frame, [
    [heroFrom - 10, 0],
    [heroFrom + 4, 1.18, powOut(3)],
    [heroFrom + 14, 1, backOut(1.6)],
  ]);
  // The hero never grows past HERO_MAX_SCALE when the camera zooms in.
  let hero = { x: cam.cx, y: cam.cy, s: Math.min(cam.s, WHEEL.heroMaxScale) * heroIn, alpha: cam.opacity };
  if (heroFlight && frame >= heroFlight.from) {
    // Arc into the year pillar, shrinking, then hand over to the pillar.
    const t = c01((frame - heroFlight.from) / (heroFlight.to - heroFlight.from));
    const e = powOut(2)(t);
    hero = {
      x: cam.cx + (heroFlight.target.x - cam.cx) * e,
      y: cam.cy + (heroFlight.target.y - cam.cy) * e - Math.sin(Math.PI * t) * 160,
      s: (1 - 0.55 * e) * Math.max(cam.s, 0.45),
      alpha: 1 - c01((t - 0.85) / 0.15),
    };
  }

  const pts = Object.fromEntries(SHIO_ORDER.map((s) => [s, sealPoint(s, cam)])) as Record<ShioSign, { x: number; y: number }>;
  const r = WHEEL.radius * cam.s;

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <GoldDefs id={ID} />
      <g opacity={cam.opacity}>
        {/* Ring: thin gold track with ticks between seals. */}
        <circle cx={cam.cx} cy={cam.cy} r={r} fill="none" stroke={SHIO_COLORS.ring} strokeWidth={WHEEL.ringStroke} opacity={0.7} />
        <circle cx={cam.cx} cy={cam.cy} r={r * 0.62} fill="none" stroke={SHIO_COLORS.ring} strokeWidth={1.5} opacity={0.45} strokeDasharray="4 10" />
        {SHIO_ORDER.map((_, i) => {
          const a = ((i * 30 - 75 + cam.rot) * Math.PI) / 180;
          return (
            <line
              key={`tick-${i}`}
              x1={cam.cx + Math.cos(a) * r * 0.92}
              y1={cam.cy + Math.sin(a) * r * 0.92}
              x2={cam.cx + Math.cos(a) * r * 1.08}
              y2={cam.cy + Math.sin(a) * r * 1.08}
              stroke={SHIO_COLORS.ring}
              strokeWidth={2}
              opacity={0.6}
            />
          );
        })}

        {/* Relations, under the seals. */}
        {links.map((l, k) => {
          if (frame < l.from || frame >= l.to) {
            return null;
          }
          const p = powOut(3)(c01((frame - l.from) / SHIO_LINK.drawFrames));
          const fade = 1 - c01((frame - (l.to - 8)) / 8);
          const m = l.members.map((s) => pts[s]);
          if (l.kind === "trine") {
            const d = `M${m[0].x} ${m[0].y} L${m[1].x} ${m[1].y} L${m[2].x} ${m[2].y} Z`;
            return (
              <g key={`link-${k}`} opacity={fade}>
                <path d={d} fill={COLORS.goldLight} opacity={0.18 * p} />
                <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} fill="none" stroke={SHIO_COLORS.linkHalo} strokeWidth={SHIO_LINK.stroke * 2.4} strokeLinejoin="round" />
                <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} fill="none" stroke={`url(#${ID}-gold)`} strokeWidth={SHIO_LINK.stroke} strokeLinejoin="round" />
              </g>
            );
          }
          if (l.kind === "ally") {
            // A red ribbon tying the two seals, waving, with a bow.
            const [a, b] = m;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const ox = mx - cam.cx;
            const oy = my - cam.cy;
            const ol = Math.hypot(ox, oy) || 1;
            const out = r * 0.38;
            const wave = Math.sin(frame / 7) * 10;
            const cx = mx + (ox / ol) * (out + wave);
            const cy = my + (oy / ol) * (out + wave);
            const d = `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
            const bow = c01((frame - l.from - SHIO_LINK.drawFrames * 0.7) / 10);
            const bx = 0.25 * a.x + 0.5 * cx + 0.25 * b.x;
            const by = 0.25 * a.y + 0.5 * cy + 0.25 * b.y;
            return (
              <g key={`link-${k}`} opacity={fade}>
                <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} fill="none" stroke={SHIO_COLORS.linkHalo} strokeWidth={SHIO_LINK.ribbonWidth * 2.2} strokeLinecap="round" />
                <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} fill="none" stroke={SHIO_COLORS.ribbon} strokeWidth={SHIO_LINK.ribbonWidth} strokeLinecap="round" />
                {bow > 0 ? (
                  <g transform={`translate(${bx} ${by}) scale(${backOut(2)(bow) * cam.s})`}>
                    <ellipse cx={-26} cy={0} rx={30} ry={16} fill={SHIO_COLORS.ribbon} transform="rotate(-20 -26 0)" />
                    <ellipse cx={26} cy={0} rx={30} ry={16} fill={SHIO_COLORS.ribbon} transform="rotate(20 26 0)" />
                    <circle r={11} fill={COLORS.sealDeep} />
                  </g>
                ) : null}
              </g>
            );
          }
          // Clash: two arrows meet head-on between the opposite seals.
          return (
            <g key={`link-${k}`} opacity={fade}>
              {m.map((q, n) => {
                // Stop outside the burning hero in the center.
                const tx = cam.cx + (q.x - cam.cx) * SHIO_LINK.clashStop;
                const ty = cam.cy + (q.y - cam.cy) * SHIO_LINK.clashStop;
                const sx = q.x + (cam.cx - q.x) * 0.2;
                const sy = q.y + (cam.cy - q.y) * 0.2;
                const ex = sx + (tx - sx) * p;
                const ey = sy + (ty - sy) * p;
                const ang = Math.atan2(ty - sy, tx - sx);
                const head = 30 * cam.s;
                return (
                  <g key={`arrow-${n}`}>
                    <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={SHIO_COLORS.linkHalo} strokeWidth={SHIO_LINK.arrowStroke * 2.2} strokeLinecap="round" />
                    <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={SHIO_COLORS.clash} strokeWidth={SHIO_LINK.arrowStroke} strokeLinecap="round" />
                    {p > 0.6
                      ? [-1, 1].map((sgn) => (
                          <line
                            key={sgn}
                            x1={ex}
                            y1={ey}
                            x2={ex - Math.cos(ang + sgn * 0.55) * head}
                            y2={ey - Math.sin(ang + sgn * 0.55) * head}
                            stroke={SHIO_COLORS.clash}
                            strokeWidth={SHIO_LINK.arrowStroke}
                            strokeLinecap="round"
                          />
                        ))
                      : null}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* The twelve seals (the year sign sits in the center instead). */}
        {SHIO_ORDER.map((sign) => {
          const q = pts[sign];
          const { amount, since } = litOf(sign);
          const life = idle(`seal-${sign}`, frame, WHEEL.idleBob, WHEEL.idleSway);
          const pop = Number.isFinite(since)
            ? track(since, [
                [0, WHEEL.popFrom],
                [WHEEL.popFrames, 1, backOut(2)],
              ])
            : 1;
          const squash = squashOnImpact(since - 4, 0.8, 10);
          // A clash makes the opposite seal shudder.
          const clash = links.find((l) => l.kind === "clash" && l.members.includes(sign) && frame >= l.from + SHIO_LINK.drawFrames);
          const shake = clash
            ? Math.sin((frame - clash.from) * 2.4) * SHIO_LINK.clashShakePx * (1 - c01((frame - clash.from - SHIO_LINK.drawFrames) / SHIO_LINK.clashShakeFrames))
            : 0;
          return (
            <Seal
              key={sign}
              x={q.x + shake}
              y={q.y + life.y}
              r={WHEEL.sealRadius}
              glyph={SHIO_GLYPH[sign]}
              glyphSize={WHEEL.glyphSize}
              lit={amount}
              dim={anyLit ? 1 - amount : 0}
              scale={cam.s * (amount > 0 ? pop : 1)}
              squash={squash}
              rotate={life.rotate}
            />
          );
        })}
      </g>

      {/* Hero: the year sign, with its fire. */}
      {heroIn > 0 ? (
        <g opacity={hero.alpha}>
          <Flame frame={frame} x={hero.x} y={hero.y - WHEEL.heroRadius * hero.s * 0.1} r={WHEEL.heroRadius * hero.s} amount={c01(heroIn)} />
          <Seal
            x={hero.x}
            y={hero.y}
            r={WHEEL.heroRadius}
            glyph={SHIO_GLYPH[yearSign]}
            glyphSize={WHEEL.heroGlyphSize}
            lit={0.8}
            dim={0}
            scale={hero.s}
            squash={[1, 1]}
            rotate={0}
          />
        </g>
      ) : null}

      {/* Names under the lit seals, upright. */}
      {lit.map((w, k) => {
        const amount = windowAmount(frame, w.from, w.to);
        if (amount <= 0) {
          return null;
        }
        const q = pts[w.sign];
        const below = q.y + (WHEEL.sealRadius + WHEEL.labelGap) * cam.s + WHEEL.labelSize * 0.8;
        const rise = (1 - powOut(3)(c01((frame - w.from) / 10))) * 18;
        return (
          <g key={`label-${k}`} opacity={amount * cam.opacity} transform={`translate(${q.x} ${below + rise})`}>
            <rect x={-w.label.length * WHEEL.labelSize * 0.36 - 16} y={-WHEEL.labelSize * 0.82} width={w.label.length * WHEEL.labelSize * 0.72 + 32} height={WHEEL.labelSize * 1.3} rx={WHEEL.labelSize * 0.65} fill={SHIO_COLORS.labelBg} />
            <text textAnchor="middle" dominantBaseline="central" y={-WHEEL.labelSize * 0.17} fontFamily={FONTS.body} fontWeight={800} fontSize={WHEEL.labelSize} letterSpacing="0.08em" fill={SHIO_COLORS.label}>
              {w.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
