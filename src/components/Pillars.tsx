import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS, TYPE } from "../lib/brand";
import { EASE, prog, springAt, SPRING } from "../lib/motion";
import { GoldDefs } from "./Fx";

export const PILLAR = { width: 116, height: 400, gap: 22 } as const;

// One lacquer pillar with gold caps; its glyph lights up on its cue with a
// gold ripple. Drawn with its base at (0, 0), growing upwards.
const Pillar: React.FC<{
  glyph: string;
  label: string;
  rise: number;
  light: number;
  lightStart: number;
  id: string;
}> = ({ glyph, label, rise, light, lightStart, id }) => {
  const frame = useCurrentFrame();
  const w = PILLAR.width;
  const h = PILLAR.height;
  const ripple = (frame - lightStart) / 20;
  return (
    <g
      transform={`translate(0 ${(1 - rise) * (h + 120)})`}
      opacity={Math.min(1, rise * 2)}
    >
      <rect
        x={-w / 2}
        y={-h}
        width={w}
        height={h}
        rx={10}
        fill={`url(#${id}-lacquer)`}
      />
      <rect
        x={-w / 2 + 10}
        y={-h + 34}
        width={8}
        height={h - 68}
        fill={COLORS.white}
        opacity={0.12}
      />
      {/* Caps. */}
      <rect
        x={-w / 2 - 14}
        y={-h - 24}
        width={w + 28}
        height={30}
        rx={6}
        fill={`url(#${id}-gold)`}
      />
      <rect
        x={-w / 2 - 6}
        y={-h - 40}
        width={w + 12}
        height={18}
        rx={5}
        fill={COLORS.goldDeep}
      />
      <rect
        x={-w / 2 - 14}
        y={-10}
        width={w + 28}
        height={30}
        rx={6}
        fill={`url(#${id}-gold)`}
      />
      {/* Glow behind the glyph once lit. */}
      <circle
        cx={0}
        cy={-h * 0.6}
        r={90}
        fill={`url(#${id}-glow)`}
        opacity={light}
      />
      {ripple > 0 && ripple < 1 ? (
        <circle
          cx={0}
          cy={-h * 0.6}
          r={60 + ripple * 120}
          fill="none"
          stroke={COLORS.goldLight}
          strokeWidth={6 * (1 - ripple)}
          opacity={1 - ripple}
        />
      ) : null}
      <text
        x={0}
        y={-h * 0.6}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FONTS.han}
        fontWeight={900}
        fontSize={TYPE.pillarGlyph}
        fill={light > 0.5 ? COLORS.goldLight : COLORS.gold}
        opacity={0.45 + light * 0.55}
        transform={`translate(0 ${-h * 0.6}) scale(${1 + Math.sin(Math.min(1, Math.max(0, ripple)) * Math.PI) * 0.12}) translate(0 ${h * 0.6})`}
      >
        {glyph}
      </text>
      <text
        x={0}
        y={-h * 0.2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily={FONTS.body}
        fontWeight={800}
        fontSize={TYPE.pillarLabel}
        letterSpacing="0.12em"
        fill={COLORS.paper}
        opacity={0.35 + light * 0.65}
      >
        {label}
      </text>
    </g>
  );
};

// Four pillars rising in turn from `start`; each lights on its cue frame.
export const Pillars: React.FC<{
  pillars: { glyph: string; label: string }[];
  start: number;
  cues: number[];
  exitStart: number;
  id: string;
}> = ({ pillars, start, cues, exitStart, id }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sink = prog(frame, exitStart, exitStart + 14, EASE.in);
  const span =
    pillars.length * PILLAR.width + (pillars.length - 1) * PILLAR.gap;
  return (
    <g transform={`translate(0 ${sink * 520})`}>
      <GoldDefs id={id} />
      {pillars.map((p, i) => {
        const x =
          -span / 2 + PILLAR.width / 2 + i * (PILLAR.width + PILLAR.gap);
        const rise = springAt(frame, start + i * 3, fps, SPRING.heavy);
        const light = prog(frame, cues[i] - 2, cues[i] + 8, EASE.out);
        return (
          <g key={p.glyph} transform={`translate(${x} 0)`}>
            <Pillar
              glyph={p.glyph}
              label={p.label}
              rise={rise}
              light={light}
              lightStart={cues[i]}
              id={id}
            />
          </g>
        );
      })}
    </g>
  );
};
