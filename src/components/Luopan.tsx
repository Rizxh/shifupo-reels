import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../lib/brand";
import { EASE, prog, springAt, SPRING } from "../lib/motion";
import { GoldDefs } from "./Fx";

// The 24 mountains of the luo pan ring, clockwise from north (壬子癸 ...).
const MOUNTAINS = "壬子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥";
// Later-heaven trigrams clockwise from south (top): lines from the bottom,
// true = solid, false = broken.
const TRIGRAMS: boolean[][] = [
  [true, false, true],
  [false, false, false],
  [true, true, false],
  [true, true, true],
  [false, true, false],
  [false, false, true],
  [true, false, false],
  [false, true, true],
];

type Ring = { r1: number; r2: number; speed: number };
const RINGS: Ring[] = [
  { r1: 0, r2: 70, speed: 0 },
  { r1: 70, r2: 128, speed: 0.32 },
  { r1: 128, r2: 206, speed: -0.16 },
  { r1: 206, r2: 262, speed: 0.09 },
  { r1: 262, r2: 318, speed: -0.05 },
];

// A luo pan compass whose rings build outwards from the centre, each turning
// at its own speed and direction. Drawn around (0, 0); place it with a <g>.
export const Luopan: React.FC<{
  start: number;
  id: string;
  scale?: number;
}> = ({ start, id, scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  const ringIn = (i: number) =>
    springAt(frame, start + i * 4, fps, SPRING.heavy);
  const rot = (i: number) => local * RINGS[i].speed;
  const band = (i: number, children: React.ReactNode) => {
    const t = ringIn(i);
    return (
      <g
        key={i}
        transform={`rotate(${rot(i)}) scale(${0.82 + t * 0.18})`}
        opacity={Math.min(1, t * 1.4)}
      >
        {children}
      </g>
    );
  };
  return (
    <g transform={`scale(${scale})`}>
      <GoldDefs id={id} />
      {/* Outer gold body. */}
      {band(
        4,
        <>
          <circle r={RINGS[4].r2 + 16} fill={`url(#${id}-gold)`} />
          <circle r={RINGS[4].r2} fill={COLORS.goldDeep} />
          <circle r={RINGS[4].r1} fill={COLORS.ink} />
          {Array.from({ length: 64 }, (_, i) => {
            const a = (i / 64) * Math.PI * 2;
            const r = (RINGS[4].r1 + RINGS[4].r2) / 2;
            return (
              <circle
                key={i}
                cx={Math.sin(a) * r}
                cy={-Math.cos(a) * r}
                r={i % 8 === 0 ? 7 : 3.5}
                fill={COLORS.goldLight}
              />
            );
          })}
        </>,
      )}
      {/* Degree ticks. */}
      {band(
        3,
        <>
          <circle
            r={RINGS[3].r2}
            fill={COLORS.ink}
            stroke={COLORS.gold}
            strokeWidth={3}
          />
          {Array.from({ length: 120 }, (_, i) => {
            const a = (i / 120) * Math.PI * 2;
            const long = i % 5 === 0;
            const r1 = RINGS[3].r2 - 6;
            const r2 = r1 - (long ? 28 : 14);
            return (
              <line
                key={i}
                x1={Math.sin(a) * r1}
                y1={-Math.cos(a) * r1}
                x2={Math.sin(a) * r2}
                y2={-Math.cos(a) * r2}
                stroke={COLORS.goldLight}
                strokeWidth={long ? 3 : 1.5}
              />
            );
          })}
        </>,
      )}
      {/* 24 mountains. */}
      {band(
        2,
        <>
          <circle
            r={RINGS[2].r2}
            fill="#1E1A16"
            stroke={COLORS.gold}
            strokeWidth={3}
          />
          {[...MOUNTAINS].map((ch, i) => {
            const a = (i / 24) * 360;
            const r = (RINGS[2].r1 + RINGS[2].r2) / 2;
            return (
              <g key={i} transform={`rotate(${a}) translate(0 ${-r})`}>
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily={FONTS.han}
                  fontWeight={700}
                  fontSize={30}
                  fill={i % 2 === 0 ? COLORS.goldLight : COLORS.gold}
                >
                  {ch}
                </text>
              </g>
            );
          })}
          {Array.from({ length: 24 }, (_, i) => {
            const a = ((i + 0.5) / 24) * Math.PI * 2;
            return (
              <line
                key={`d${i}`}
                x1={Math.sin(a) * RINGS[2].r1}
                y1={-Math.cos(a) * RINGS[2].r1}
                x2={Math.sin(a) * RINGS[2].r2}
                y2={-Math.cos(a) * RINGS[2].r2}
                stroke={COLORS.gold}
                strokeWidth={1.5}
                opacity={0.6}
              />
            );
          })}
        </>,
      )}
      {/* Trigrams. */}
      {band(
        1,
        <>
          <circle
            r={RINGS[1].r2}
            fill={COLORS.ink}
            stroke={COLORS.gold}
            strokeWidth={3}
          />
          {TRIGRAMS.map((lines, i) => (
            <g
              key={i}
              transform={`rotate(${180 + i * 45}) translate(0 ${-(RINGS[1].r1 + RINGS[1].r2) / 2})`}
            >
              {lines.map((solid, l) => {
                const y = 14 - l * 12;
                return solid ? (
                  <rect
                    key={l}
                    x={-20}
                    y={y - 3.5}
                    width={40}
                    height={7}
                    fill={COLORS.goldLight}
                  />
                ) : (
                  <g key={l}>
                    <rect
                      x={-20}
                      y={y - 3.5}
                      width={16}
                      height={7}
                      fill={COLORS.goldLight}
                    />
                    <rect
                      x={4}
                      y={y - 3.5}
                      width={16}
                      height={7}
                      fill={COLORS.goldLight}
                    />
                  </g>
                );
              })}
            </g>
          ))}
        </>,
      )}
      {/* Heaven pool: red disc with a fine needle that trembles. */}
      {band(
        0,
        <>
          <circle
            r={RINGS[0].r2}
            fill={COLORS.seal}
            stroke={`url(#${id}-gold)`}
            strokeWidth={6}
          />
          <circle
            r={RINGS[0].r2 - 18}
            fill="none"
            stroke={COLORS.goldLight}
            strokeWidth={2}
            opacity={0.7}
          />
          <g transform={`rotate(${Math.sin(local / 9) * 4})`}>
            <path d="M 0 -52 L 7 0 L -7 0 Z" fill={COLORS.goldLight} />
            <path d="M 0 52 L 7 0 L -7 0 Z" fill={COLORS.ink} />
            <circle r={7} fill={COLORS.goldLight} />
          </g>
        </>,
      )}
      {/* A light sweep crossing the face. */}
      <g opacity={0.35 * prog(frame, start + 10, start + 30, EASE.out)}>
        <path
          d={`M ${-330} ${-60 + (local % 90) * 8 - 360} L 330 ${-60 + (local % 90) * 8 - 420} L 330 ${-20 + (local % 90) * 8 - 420} L -330 ${-20 + (local % 90) * 8 - 360} Z`}
          fill={COLORS.white}
          opacity={0.18}
        />
      </g>
    </g>
  );
};
