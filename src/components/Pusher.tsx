import { random, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, STAGE, VIDEO } from "../lib/brand";
import { drift, EASE, prog } from "../lib/motion";

const W = VIDEO.width;
const H = VIDEO.height;

// The hook picture: a small ink figure pushes a boulder up a hill that turns
// under him like a treadmill, so he never gets anywhere.
const HILL = { cx: STAGE.cx, cy: STAGE.cy + 760, r: 720 } as const;
const BOULDER_R = 118;
// Ground speed along the hill surface, px per frame.
const GROUND_SPEED = 4.2;
// Walk cycle: radians per frame (two steps per cycle).
const STRIDE = 0.2;
const deg = (a: number) => (a * 180) / Math.PI;
const onHill = (angle: number, lift = 0) => ({
  x: HILL.cx + Math.cos(angle) * (HILL.r + lift),
  y: HILL.cy + Math.sin(angle) * (HILL.r + lift),
});
// Positions on the hill, as angles from its centre (-90 deg is the top).
const FIGURE_ANGLE = (-112 * Math.PI) / 180;
const BOULDER_ANGLE = (-97 * Math.PI) / 180;

const Figure: React.FC<{ phase: number; strain: number }> = ({
  phase,
  strain,
}) => {
  const legA = Math.sin(phase) * 30;
  const legB = Math.sin(phase + Math.PI) * 30;
  const kneeA = Math.max(0, Math.sin(phase + Math.PI / 2)) * 42;
  const kneeB = Math.max(0, Math.sin(phase + Math.PI * 1.5)) * 42;
  const bob = Math.abs(Math.cos(phase)) * 6;
  const leg = (hip: number, knee: number, key: string, shade: string) => (
    <g key={key} transform={`rotate(${hip})`}>
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={62}
        stroke={shade}
        strokeWidth={22}
        strokeLinecap="round"
      />
      <g transform={`translate(0 62) rotate(${knee})`}>
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={60}
          stroke={shade}
          strokeWidth={19}
          strokeLinecap="round"
        />
        <ellipse cx={8} cy={62} rx={18} ry={8} fill={shade} />
      </g>
    </g>
  );
  return (
    <g transform={`translate(0 ${-bob}) rotate(${38 + strain * 4})`}>
      {/* Back leg first, in a lighter ink for depth. */}
      <g transform="translate(0 -122)">
        {leg(legB, kneeB, "b", COLORS.inkSoft)}
        {leg(legA, kneeA, "a", COLORS.ink)}
      </g>
      {/* Torso, head, arms reaching forward to the boulder. */}
      <rect
        x={-22}
        y={-236}
        width={44}
        height={122}
        rx={22}
        fill={COLORS.ink}
      />
      <circle cx={6} cy={-268} r={30} fill={COLORS.ink} />
      <path d="M -8 -290 C 10 -312, 40 -300, 34 -276 Z" fill={COLORS.ink} />
      <g transform="translate(6 -214)">
        <line
          x1={0}
          y1={0}
          x2={88}
          y2={-26 + Math.sin(phase * 2) * 3}
          stroke={COLORS.ink}
          strokeWidth={18}
          strokeLinecap="round"
        />
        <line
          x1={0}
          y1={14}
          x2={84}
          y2={-6 + Math.sin(phase * 2 + 1) * 3}
          stroke={COLORS.inkSoft}
          strokeWidth={16}
          strokeLinecap="round"
        />
      </g>
    </g>
  );
};

export const PusherScene: React.FC<{
  start: number;
  exitStart: number;
  exitEnd: number;
}> = ({ start, exitStart, exitEnd }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - start;
  const travel = local * GROUND_SPEED;
  const hillTurn = -deg(travel / HILL.r);
  const phase = local * STRIDE;
  const strain = drift("strain", frame, 0.05);
  const enter = prog(frame, start, start + 18);

  // At the end the boulder breaks away and rolls to the centre of the frame,
  // where the next scene's compass takes its place.
  const exit = prog(frame, exitStart, exitEnd, EASE.inOut);
  const rest = onHill(BOULDER_ANGLE, BOULDER_R - 6);
  const bx = rest.x + (STAGE.cx - rest.x) * exit;
  const by =
    rest.y + (STAGE.cy - rest.y) * exit - Math.sin(exit * Math.PI) * 40;
  const boulderSpin = -deg(travel / BOULDER_R) - exit * 220;
  const boulderScale = 1 + exit * 0.9;

  const figurePos = onHill(FIGURE_ANGLE, -4);
  // Dust kicked up at each foot plant (every half cycle).
  const steps = Math.floor(phase / Math.PI);
  const dust = Array.from({ length: 4 }, (_, j) => {
    const k = steps - j;
    const age = (phase - k * Math.PI) / STRIDE;
    return { k, age };
  }).filter((d) => d.k >= 0 && d.age < 20);

  return (
    <svg
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, opacity: enter }}
    >
      <defs>
        <radialGradient id="boulder-shade" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#4A433B" />
          <stop offset="0.6" stopColor={COLORS.inkSoft} />
          <stop offset="1" stopColor={COLORS.ink} />
        </radialGradient>
        <linearGradient id="hill-wash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.ink} stopOpacity={0.85} />
          <stop offset="0.18" stopColor={COLORS.ink} stopOpacity={0.35} />
          <stop offset="0.45" stopColor={COLORS.ink} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* The hill turns under the figure: ticks and stones ride its surface. */}
      <circle cx={HILL.cx} cy={HILL.cy} r={HILL.r} fill="url(#hill-wash)" />
      <g transform={`rotate(${hillTurn} ${HILL.cx} ${HILL.cy})`}>
        {Array.from({ length: 90 }, (_, i) => {
          const a = (i / 90) * Math.PI * 2;
          const p = onHill(a, 2);
          const len = 10 + random(`grass${i}`) * 22;
          return (
            <line
              key={i}
              x1={p.x}
              y1={p.y}
              x2={p.x + Math.cos(a) * len}
              y2={p.y + Math.sin(a) * len}
              stroke={COLORS.ink}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2 + 0.07;
          const p = onHill(a, -16);
          return (
            <ellipse
              key={`s${i}`}
              cx={p.x}
              cy={p.y}
              rx={9 + (i % 3) * 4}
              ry={5}
              fill={COLORS.inkSoft}
              opacity={0.5}
            />
          );
        })}
      </g>
      {/* Foot dust. */}
      {dust.map((d) => {
        const t = d.age / 20;
        const p = onHill(FIGURE_ANGLE - 0.07, 6);
        return (
          <g key={d.k} opacity={(1 - t) * 0.5}>
            {[0, 1, 2].map((m) => (
              <circle
                key={m}
                cx={p.x - 20 - t * 60 - m * 18}
                cy={p.y - 8 - t * 26 + m * 6}
                r={8 + t * 22 - m * 3}
                fill={COLORS.inkSoft}
              />
            ))}
          </g>
        );
      })}
      {/* The figure stands on the slope, leaning into the boulder. */}
      <g
        transform={`translate(${figurePos.x} ${figurePos.y}) rotate(${deg(FIGURE_ANGLE) + 90})`}
        opacity={1 - exit}
      >
        <Figure phase={phase} strain={strain} />
        {/* Sweat drop every second and a half. */}
        {(() => {
          const period = Math.round(fps * 1.5);
          const t = (local % period) / 22;
          if (t > 1 || local < 10) {
            return null;
          }
          return (
            <path
              d="M0 -10 C 6 0, 8 6, 0 10 C -8 6, -6 0, 0 -10 Z"
              transform={`translate(${-40 - t * 40} ${-300 + t * t * 120}) scale(1.6)`}
              fill={COLORS.blueprint}
              opacity={1 - t}
            />
          );
        })()}
      </g>
      {/* Boulder. */}
      <g
        transform={`translate(${bx} ${by}) scale(${boulderScale}) rotate(${boulderSpin})`}
        opacity={1 - prog(frame, exitEnd - 4, exitEnd)}
      >
        <circle r={BOULDER_R} fill="url(#boulder-shade)" />
        <path
          d="M -60 -30 C -20 -10, 10 -40, 50 -20"
          stroke={COLORS.paperDeep}
          strokeWidth={5}
          fill="none"
          opacity={0.35}
          strokeLinecap="round"
        />
        <path
          d="M -40 40 C -10 20, 30 50, 60 30"
          stroke={COLORS.paperDeep}
          strokeWidth={4}
          fill="none"
          opacity={0.25}
          strokeLinecap="round"
        />
        <circle
          cx={-38}
          cy={-46}
          r={16}
          fill={COLORS.paperDeep}
          opacity={0.12}
        />
      </g>
    </svg>
  );
};
