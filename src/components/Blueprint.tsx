import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib/brand";
import { EASE, prog, springAt, SPRING } from "../lib/motion";
import { GoldDefs } from "./Fx";

// Floor plan in local coordinates, centred on (0, 0). Walls are drawn in
// order, then furniture, then the qi ribbon flows through the door.
type Seg = [number, number, number, number];
const WALLS: Seg[] = [
  [-340, -270, 340, -270],
  [340, -270, 340, 270],
  [340, 270, 40, 270],
  [-60, 270, -340, 270],
  [-340, 270, -340, -270],
  [-340, 60, 100, 60],
  [190, 60, 340, 60],
  [-60, -270, -60, -150],
  [-60, -60, -60, 60],
  [150, -270, 150, -110],
  [150, -40, 150, 60],
  [-340, -80, -170, -80],
  [-110, -80, -60, -80],
];
const FURNITURE = [
  "M -300 -240 h 150 v 120 h -150 Z",
  "M 190 -240 h 120 v 150 h -120 Z",
  "M -260 120 h 220 v 70 h -220 Z",
  "M 120 150 a 50 50 0 1 0 100 0 a 50 50 0 1 0 -100 0",
  "M -20 -240 h 140 v 40 h -140 Z",
];
// Rooms that glow as the qi passes, with the share of the ribbon that
// reaches them.
const ROOMS: { d: string; at: number }[] = [
  { d: "M -340 60 H 340 V 270 H -340 Z", at: 0.12 },
  { d: "M 150 -270 H 340 V 60 H 150 Z", at: 0.36 },
  { d: "M -60 -270 H 150 V 60 H -60 Z", at: 0.55 },
  { d: "M -340 -270 H -60 V -80 H -340 Z", at: 0.72 },
  { d: "M -340 -80 H -60 V 60 H -340 Z", at: 0.84 },
];
const QI_PATH =
  "M -10 360 C -10 230, 250 240, 250 130 C 250 30, 230 -60, 240 -150 C 250 -240, 60 -260, 40 -150 C 20 -40, -120 40, -200 -10 C -280 -60, -250 -200, -150 -230 C -60 -260, -30 -330, -40 -400";
const QI_LENGTH = getLength(QI_PATH);

export const Blueprint: React.FC<{
  start: number;
  flow: number;
  stamp: number;
  id: string;
}> = ({ start, flow, stamp, id }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const qi = prog(frame, flow - 4, flow + 50, EASE.inOut);
  const head = getPointAtLength(QI_PATH, Math.max(1, qi * QI_LENGTH)) ?? {
    x: 0,
    y: 0,
  };
  const tail = evolvePath(qi, QI_PATH);
  // Hammer swings at a wall just before the stamp stops it.
  const hammerIn = prog(frame, stamp - 16, stamp - 8, EASE.out);
  const swing =
    frame < stamp - 4
      ? -38 * prog(frame, stamp - 16, stamp - 6, EASE.anticipate)
      : -38 + 50 * prog(frame, stamp - 4, stamp, EASE.in);
  const stamped = springAt(frame, stamp, fps, SPRING.snap);
  return (
    <g>
      <GoldDefs id={id} />
      {/* Blueprint sheet. */}
      <rect
        x={-380}
        y={-310}
        width={760}
        height={620}
        rx={8}
        fill={COLORS.paper}
        stroke={COLORS.blueprint}
        strokeOpacity={0.25}
        strokeWidth={3}
        opacity={prog(frame, start, start + 10)}
      />
      {Array.from({ length: 13 }, (_, i) => (
        <line
          key={`g${i}`}
          x1={-380 + i * 63}
          y1={-310}
          x2={-380 + i * 63}
          y2={310}
          stroke={COLORS.blueprint}
          strokeOpacity={0.08 * prog(frame, start, start + 14)}
          strokeWidth={2}
        />
      ))}
      {ROOMS.map((room, i) => (
        <path
          key={`r${i}`}
          d={room.d}
          fill={COLORS.gold}
          opacity={0.22 * prog(qi, room.at, room.at + 0.1, EASE.out)}
        />
      ))}
      {WALLS.map(([x1, y1, x2, y2], i) => {
        const t = prog(frame, start + 4 + i * 2, start + 16 + i * 2, EASE.out);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x1 + (x2 - x1) * t}
            y2={y1 + (y2 - y1) * t}
            stroke={COLORS.blueprint}
            strokeWidth={9}
            strokeLinecap="square"
          />
        );
      })}
      {FURNITURE.map((d, i) => {
        const t = prog(frame, start + 30 + i * 3, start + 46 + i * 3, EASE.out);
        const e = evolvePath(t, d);
        return (
          <path
            key={`f${i}`}
            d={d}
            fill="none"
            stroke={COLORS.blueprint}
            strokeWidth={4}
            strokeOpacity={0.55}
            strokeDasharray={e.strokeDasharray}
            strokeDashoffset={e.strokeDashoffset}
          />
        );
      })}
      {/* Qi ribbon: wide soft glow under a bright core, with a glowing head. */}
      {qi > 0 ? (
        <>
          <path
            d={QI_PATH}
            fill="none"
            stroke={COLORS.goldLight}
            strokeWidth={34}
            strokeLinecap="round"
            opacity={0.35}
            strokeDasharray={tail.strokeDasharray}
            strokeDashoffset={tail.strokeDashoffset}
          />
          <path
            d={QI_PATH}
            fill="none"
            stroke={`url(#${id}-gold)`}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={tail.strokeDasharray}
            strokeDashoffset={tail.strokeDashoffset}
          />
          <circle
            cx={head.x}
            cy={head.y}
            r={46}
            fill={`url(#${id}-glow)`}
            opacity={qi < 1 ? 1 : 0.5}
          />
          <circle
            cx={head.x}
            cy={head.y}
            r={10}
            fill={COLORS.white}
            opacity={qi < 1 ? 1 : 0}
          />
        </>
      ) : null}
      {/* Hammer that is stopped by the stamp. */}
      {hammerIn > 0 ? (
        <g
          transform={`translate(300 -40) rotate(${swing})`}
          opacity={hammerIn * (1 - prog(frame, stamp + 6, stamp + 16))}
        >
          <rect x={-8} y={-10} width={16} height={150} rx={6} fill="#7A5C3E" />
          <rect
            x={-44}
            y={-40}
            width={88}
            height={40}
            rx={8}
            fill={COLORS.inkSoft}
          />
        </g>
      ) : null}
      {stamped > 0 ? (
        <g
          transform={`translate(300 0) scale(${1.6 - stamped * 0.6}) rotate(-8)`}
          opacity={Math.min(1, stamped * 2)}
        >
          <circle r={92} fill="none" stroke={COLORS.seal} strokeWidth={14} />
          <line
            x1={-56}
            y1={-56}
            x2={56}
            y2={56}
            stroke={COLORS.seal}
            strokeWidth={16}
            strokeLinecap="round"
          />
          <line
            x1={56}
            y1={-56}
            x2={-56}
            y2={56}
            stroke={COLORS.seal}
            strokeWidth={16}
            strokeLinecap="round"
          />
        </g>
      ) : null}
    </g>
  );
};
