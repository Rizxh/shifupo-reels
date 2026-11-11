import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, STAGE, VIDEO } from "../lib/brand";
import { drift, EASE, prog, springAt, SPRING } from "../lib/motion";
import { GoldDefs, Sparkles, SpeedLines } from "./Fx";

const W = VIDEO.width;
const H = VIDEO.height;
const R = 250;
// The direction the needle finally locks onto (degrees, 0 = up, clockwise).
const TARGET = 45;
const ARROWS = 8;

// Needle angle while it searches: a fast wobbling spin.
const searchAngle = (frame: number, start: number) => {
  const t = frame - start;
  return t * 13 + Math.sin(t * 0.31) * 40 + drift("needle", frame, 0.05) * 30;
};

// Brush arrow from the ring outwards, drawn with a tapered stroke.
const Arrow: React.FC<{
  angle: number;
  t: number;
  gold: boolean;
  dim: number;
}> = ({ angle, t, gold, dim }) => {
  const inner = R + 40;
  const outer = R + 40 + 230 * t;
  const color = gold ? COLORS.goldDeep : COLORS.ink;
  const width = gold ? 22 : 13;
  return (
    <g
      transform={`translate(${STAGE.cx} ${STAGE.cy}) rotate(${angle})`}
      opacity={dim}
    >
      <path
        d={`M ${-width / 2} ${-inner} L ${-width * 0.18} ${-outer} L ${width * 0.18} ${-outer} L ${width / 2} ${-inner} Z`}
        fill={color}
      />
      {t > 0.85 ? (
        <path
          d={`M 0 ${-outer - 46} L ${-30} ${-outer + 6} L 0 ${-outer - 8} L 30 ${-outer + 6} Z`}
          fill={color}
          opacity={(t - 0.85) / 0.15}
        />
      ) : null}
    </g>
  );
};

export const CompassScene: React.FC<{
  start: number;
  lock: number;
  enterFrames?: number;
}> = ({ start, lock, enterFrames = 16 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = springAt(frame, start, fps, SPRING.heavy);

  // Search, then snap onto the target with a spring overshoot.
  const before = searchAngle(Math.min(frame, lock), start);
  const k = Math.ceil((before - TARGET) / 360);
  const target = TARGET + k * 360;
  const snap = springAt(frame, lock, fps, SPRING.snap);
  const angle = frame < lock ? before : before + (target - before) * snap;
  const locked = prog(frame, lock, lock + 10);
  const chosen = 1; // index of the arrow at TARGET

  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <GoldDefs id="compass" />
        {/* Gold halo behind the face once the direction is found. */}
        <circle
          cx={STAGE.cx}
          cy={STAGE.cy}
          r={R * 1.9}
          fill="url(#compass-glow)"
          opacity={locked * 0.8}
        />
        {Array.from({ length: ARROWS }, (_, i) => {
          const a = (i / ARROWS) * 360;
          const t = prog(
            frame,
            start + enterFrames + i * 3,
            start + enterFrames + i * 3 + 14,
            EASE.out,
          );
          const isChosen = i === chosen;
          const dim = isChosen ? 1 : 1 - locked * 0.85;
          return (
            <Arrow
              key={i}
              angle={a}
              t={t}
              gold={isChosen && locked > 0}
              dim={dim}
            />
          );
        })}
        <g
          transform={`translate(${STAGE.cx} ${STAGE.cy}) scale(${0.7 + enter * 0.3})`}
          opacity={Math.min(1, enter * 1.5)}
        >
          {/* Face: paper disc, ink ring, gold inner ring, ticks. */}
          <circle r={R + 18} fill={COLORS.ink} />
          <circle r={R} fill={COLORS.paper} />
          <circle
            r={R - 26}
            fill="none"
            stroke="url(#compass-gold)"
            strokeWidth={10}
          />
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const long = i % 9 === 0;
            const r1 = R - 40;
            const r2 = r1 - (long ? 34 : 14);
            return (
              <line
                key={i}
                x1={Math.sin(a) * r1}
                y1={-Math.cos(a) * r1}
                x2={Math.sin(a) * r2}
                y2={-Math.cos(a) * r2}
                stroke={COLORS.ink}
                strokeWidth={long ? 6 : 3}
                strokeLinecap="round"
              />
            );
          })}
          {/* Needle: red half points the way, ink half trails. */}
          <g transform={`rotate(${angle})`}>
            <path d={`M 0 ${-(R - 70)} L 30 0 L -30 0 Z`} fill={COLORS.seal} />
            <path d={`M 0 ${R - 70} L 30 0 L -30 0 Z`} fill={COLORS.ink} />
            <circle
              r={22}
              fill="url(#compass-gold)"
              stroke={COLORS.ink}
              strokeWidth={4}
            />
          </g>
        </g>
      </svg>
      <SpeedLines
        cx={STAGE.cx}
        cy={STAGE.cy}
        start={lock}
        frames={9}
        color={COLORS.goldDeep}
      />
      <Sparkles
        cx={STAGE.cx + Math.sin((TARGET * Math.PI) / 180) * (R + 200)}
        cy={STAGE.cy - Math.cos((TARGET * Math.PI) / 180) * (R + 200)}
        start={lock + 4}
        count={12}
        spread={160}
      />
    </>
  );
};
