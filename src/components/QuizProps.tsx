// Paper illustrations for the quiz answer cards (sp08): tiny floor plans and
// objects, drawn around (0, 0) in a ~300 x 260 box. Each one is readable at a
// glance: where the mirror faces, where the bed points, a live or dry plant.

import { useCurrentFrame } from "remotion";
import { QUIZ_COLORS as C } from "../products/shifupo/quiz";
import type { QUIZ_PROPS } from "../schema";

type Prop = (typeof QUIZ_PROPS)[number];

const Door: React.FC<{ x: number; y: number; w?: number; h?: number }> = ({ x, y, w = 70, h = 120 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={C.wood} />
    <rect x={-w / 2 + 8} y={-h / 2 + 8} width={w - 16} height={h - 16} rx={4} fill={C.woodDark} opacity={0.35} />
    <circle cx={w / 2 - 14} cy={4} r={5} fill={C.lamp} />
  </g>
);

const Mirror: React.FC<{ x: number; y: number; rx?: number; ry?: number; rotate?: number }> = ({ x, y, rx = 38, ry = 54, rotate = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <ellipse rx={rx + 7} ry={ry + 7} fill={C.wood} />
    <ellipse rx={rx} ry={ry} fill={C.mirror} />
    <path d={`M${-rx * 0.4} ${-ry * 0.5} l${rx * 0.5} ${ry * 0.6}`} stroke={C.mirrorShine} strokeWidth={6} strokeLinecap="round" />
  </g>
);

// Dashed arrow drawn progressively (energy path).
const Path: React.FC<{ d: string; progress: number; color: string }> = ({ d, progress, color }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={6} strokeDasharray="14 10" strokeDashoffset={-progress * 48} strokeLinecap="round" opacity={0.9} />
);

const Bed: React.FC<{ x: number; y: number; rotate?: number }> = ({ x, y, rotate = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <rect x={-52} y={-80} width={104} height={160} rx={14} fill={C.woodDark} />
    <rect x={-46} y={-74} width={92} height={148} rx={12} fill={C.sheet} />
    <rect x={-38} y={-66} width={76} height={34} rx={12} fill={C.pillow} />
    <rect x={-46} y={-14} width={92} height={88} rx={12} fill={C.blanket} />
  </g>
);

const Plant: React.FC<{ alive: boolean; frame: number }> = ({ alive, frame }) => {
  const sway = alive ? Math.sin(frame / 14) * 4 : 0;
  const leaves = alive
    ? [-55, -25, 0, 25, 55].map((a, i) => (
        <ellipse key={i} cx={0} cy={-58} rx={18} ry={58} fill={i % 2 ? C.leafLight : C.leaf} transform={`rotate(${a + sway} 0 0)`} />
      ))
    : [-70, -30, 35, 75].map((a, i) => (
        <path key={i} d={`M0 0 q${a * 0.6} -40 ${a} ${10 + i * 6}`} stroke={C.leafDry} strokeWidth={12} fill="none" strokeLinecap="round" />
      ));
  return (
    <g>
      <g transform="translate(0 20)">{leaves}</g>
      {!alive ? <ellipse cx={70} cy={92} rx={20} ry={8} fill={C.leafDry} transform="rotate(20 70 92)" /> : null}
      <path d="M-58 20 h116 l-14 80 h-88 z" fill={C.pot} />
      <rect x={-64} y={12} width={128} height={18} rx={6} fill={C.pot} />
    </g>
  );
};

export const QuizArt: React.FC<{ prop: Prop; scale?: number }> = ({ prop, scale = 1 }) => {
  const frame = useCurrentFrame();
  const flow = (frame % 48) / 48;
  let body: React.ReactNode = null;
  switch (prop) {
    case "mirror-door":
      // Mirror straight across from the door: the path bounces right back out.
      body = (
        <g>
          <Door x={-95} y={10} />
          <Mirror x={95} y={10} />
          <Path d="M-60 -10 H55" progress={flow} color={C.arrow} />
          <Path d="M55 30 H-60" progress={flow} color={C.arrow} />
        </g>
      );
      break;
    case "mirror-side":
      body = (
        <g>
          <Door x={-95} y={20} />
          <Mirror x={40} y={-70} rx={46} ry={30} />
          <Path d="M-60 20 q90 0 150 40" progress={flow} color={C.right} />
        </g>
      );
      break;
    case "bed-door":
      body = (
        <g>
          <Bed x={0} y={-30} />
          <Door x={0} y={112} w={90} h={34} />
          <Path d="M0 52 V92" progress={flow} color={C.arrow} />
        </g>
      );
      break;
    case "bed-wall":
      body = (
        <g>
          <rect x={-130} y={-118} width={260} height={12} rx={4} fill={C.cardLine} opacity={0.7} />
          <Bed x={-30} y={-24} />
          <Door x={100} y={100} w={70} h={34} />
        </g>
      );
      break;
    case "plant-alive":
      body = <Plant alive frame={frame} />;
      break;
    case "plant-dry":
      body = <Plant alive={false} frame={frame} />;
      break;
  }
  return <g transform={`scale(${scale})`}>{body}</g>;
};
