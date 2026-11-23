// "ruko2d" world (sp10): the Motion Format paper-cartoon version of the
// KITA PAY JAY SEN storyboard. One long panorama set (altar → shop → door →
// market street) and a focus camera that travels over it with parallax
// layers, directional motion blur on fast moves and handheld drift. The
// world gets the shot name and its progress; every pose, prop and effect is
// a pure function of that (Remotion rule: no self-animation).

import { noise2D } from "@remotion/noise";
import { random } from "remotion";
import { PaperDefs, usePaperFilter } from "../../../core/paper/paper";
import { backOut } from "../../../core/motion/tracks";
import { shotAt, type ShotSpec } from "../../../core/three/rig";
import { CaiShen2D, Folk, Tiger2D, type FolkLook, type FolkPose } from "./PaperFolk";
import { C2, CAM2D, CAM2D_SPLIT, PAPER2, R2 } from "./ruko2dConfig";

export type Shot2D = { shot: string; t: number; frame: number; local: number; len?: number };

const W = 1080;
const H = 1920;
const c01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * c01(t));
const pop = backOut(1.8);
type Cam = { x: number; y: number; z: number };

const camOf = (spec: ShotSpec, t: number, frame: number): Cam => {
  const p = shotAt(spec, t, frame).pos;
  return { x: p[0], y: p[1], z: p[2] };
};
const view = (c: Cam, p = 1) => {
  const z = 1 + (c.z - 1) * p;
  return `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-c.x * p} ${-c.y * p})`;
};

// ------------------------------------------------------------------ cast
const LOOKS: Record<string, FolkLook> = {
  grandpa: { shirt: "#F7F0E3", pants: "#7A5236", hair: "grey", beard: true },
  father: { shirt: "#4D8FD6", pants: "#3A3346", hair: "short" },
  mother: { shirt: "#E04848", pants: "#3A3346", hair: "bun", apron: "#FFF3D6" },
  kid: { shirt: "#F2A93B", pants: "#4D6FA8", hair: "kid" },
  n1: { shirt: "#2FA37E", pants: "#5A4636", hair: "short" },
  n2: { shirt: "#9B6BC4", pants: "#3A3346", hair: "bun" },
  c1: { shirt: "#5C7FD0", pants: "#5A4636", hair: "short" },
  c2: { shirt: "#F27BA0", pants: "#4A3A44", hair: "bun" },
  c3: { shirt: "#7FB069", pants: "#5A4636", hair: "short" },
  kid2: { shirt: "#62B5E8", pants: "#C8322B", hair: "kid" },
  sweeper: { shirt: "#F2C14E", pants: "#6E5A44", hair: "cap", apron: "#2FA37E" },
};
const KIDS = new Set(["kid", "kid2"]);

type Actor = { id: string; x: number; y?: number; dir: 1 | -1; pose?: FolkPose; behind?: boolean };

const walkX = (t: number, t0: number, t1: number, a: number, b: number) => a + (b - a) * ease((t - t0) / (t1 - t0));
const walking = (t: number, t0: number, t1: number, frame: number) => (t > t0 && t < t1 ? frame * 0.32 : 0);

const castOf = (s: Shot2D): Actor[] => {
  const { shot, t, frame } = s;
  const F = R2.floor;
  const breathe = (k: number) => Math.sin(frame / 16 + k) * 0.04;
  const pray = (k: number) => 0.25 + 0.3 * Math.max(0, Math.sin(frame / 15 + k));
  const altarFamily = (bow: (k: number) => number, incense = 0.6): Actor[] => [
    { id: "father", x: 1160, dir: -1, pose: { bow: bow(1), armNear: 40, armFar: 40 } },
    { id: "mother", x: 960, dir: -1, pose: { bow: bow(2), armNear: 40, armFar: 40 } },
    { id: "grandpa", x: 760, dir: -1, pose: { bow: bow(0), armNear: 72, held: "incense", glow: incense } },
    { id: "kid", x: 870, dir: -1, pose: { bow: bow(3), armNear: 45, armFar: 45 } },
  ];
  switch (shot) {
    case "intro":
    case "face":
      return altarFamily((k) => 0.08 + breathe(k), 0.4 + 0.6 * ease(t));
    case "hands":
      return altarFamily((k) => (k === 0 ? 0.1 + 0.55 * ease(t * 1.6) : 0.12), 1);
    case "door":
      return [
        ...altarFamily(() => 0.1),
        { id: "n1", x: walkX(t, 0.3, 1, 4200, 3700), dir: -1, pose: { walk: walking(t, 0.3, 1, frame) } },
        { id: "n2", x: walkX(t, 0.2, 1, 3600, 4100), dir: 1, pose: { walk: walking(t, 0.2, 1, frame), held: "bag", armNear: 20 } },
      ];
    case "bless":
      return [
        { id: "mother", x: 2130, dir: 1, behind: true, pose: { armNear: 40 + 20 * Math.sin(frame / 8), mood: "happy" } },
        { id: "c1", x: walkX(t, 0, 0.6, 3150, 2480), dir: -1, pose: { walk: walking(t, 0, 0.6, frame) } },
        { id: "c2", x: walkX(t, 0.2, 0.85, 3250, 2660), dir: -1, pose: { walk: walking(t, 0.2, 0.85, frame), held: "bag", armNear: 25 } },
        { id: "kid", x: 1720, dir: 1, pose: { armNear: 60 + 40 * ease(t * 2), squash: Math.max(0, Math.sin(frame / 5)) * 0.08 } },
        { id: "father", x: 1450, dir: 1, pose: { held: "box", armNear: 70, armFar: 70 } },
      ];
    case "shutter":
      return [{ id: "father", x: 2990, dir: 1, pose: { armNear: 82, armFar: 78, bow: 0.1, mood: "happy" } }];
    case "shelf":
      return [{ id: "mother", x: 1240, dir: 1, pose: { armNear: 150 + 12 * Math.sin(frame / 4), armFar: 40, held: "box", look: 0.8 } }];
    case "sweep":
      return [{ id: "kid", x: 1560 + Math.sin(frame / 8) * 18, dir: 1, pose: { held: "broom", armNear: 34 + 14 * Math.sin(frame / 4), bow: 0.18 } }];
    case "ledger":
      return [{ id: "grandpa", x: 2175, dir: 1, behind: true, pose: { held: "book", armNear: 62, armFar: 55, bow: 0.12, nod: 0.25 + 0.1 * Math.sin(frame / 5) } }];
    case "market":
      return [
        { id: "n1", x: walkX(t, 0, 1, 4560, 4060), dir: -1, pose: { walk: frame * 0.3, held: "box", armNear: 75, armFar: 75 } },
        { id: "n2", x: walkX(t, 0, 1, 4700, 4200), dir: -1, pose: { walk: frame * 0.3 + 1.6, armNear: 80, armFar: 80 } },
        { id: "c2", x: 5060, dir: 1, pose: { armNear: 95, mood: "happy" } },
        { id: "c3", x: 3820, dir: -1, pose: { held: "bag", armNear: 70 } },
        { id: "father", x: 3290, dir: 1, pose: { armNear: 120 + 25 * Math.sin(frame / 5), mood: "happy" } },
      ];
    case "friendly":
    case "customer":
      return [
        { id: "mother", x: 2130, dir: 1, behind: true, pose: { armNear: shot === "customer" ? 70 : 40, held: shot === "customer" ? "bag" : "none", nod: 0.25 * Math.sin(frame / 10), mood: "happy" } },
        { id: shot === "customer" ? "c2" : "c1", x: 2470, dir: -1, pose: { nod: 0.2 * Math.sin(frame / 9), armNear: shot === "customer" ? 60 * ease(t * 2) : 20, mood: shot === "customer" ? "wow" : "happy" } },
        { id: "kid", x: 2300, dir: 1, pose: { armNear: 80 * ease(t * 2), held: "bag" } },
        ...(shot === "friendly" ? [{ id: "grandpa", x: 2600, dir: -1 as const, pose: { held: "tea" as const, armNear: 70, nod: 0.15 } }] : []),
      ];
    case "busy":
      return [
        { id: "mother", x: 2130, dir: 1, behind: true, pose: { armNear: 50 + 20 * Math.sin(frame / 6) } },
        { id: "c1", x: 2470 + Math.sin(frame / 10) * 10, dir: -1, pose: { held: "bag", armNear: 30 } },
        { id: "c2", x: walkX(t, 0, 0.5, 2900, 2620), dir: -1, pose: { walk: walking(t, 0, 0.5, frame) } },
        { id: "c3", x: walkX(t, 0.1, 0.6, 3100, 2770), dir: -1, pose: { walk: walking(t, 0.1, 0.6, frame) } },
        { id: "father", x: walkX(t, 0.2, 0.9, 2550, 1450), dir: -1, pose: { walk: walking(t, 0.2, 0.9, frame), held: "box", armNear: 75, armFar: 75 } },
        { id: "kid", x: 1780, dir: 1, pose: { held: "bag", armNear: 60 } },
      ];
    case "blessing":
      return [
        { id: "grandpa", x: 760, dir: 1, pose: { mood: "happy", armNear: 30, look: 0.6 } },
        { id: "mother", x: 1500, dir: -1, pose: { armNear: 100 * ease(t * 2), mood: "wow" } },
        { id: "kid", x: 1180, dir: 1, y: F - Math.abs(Math.sin(frame / 6)) * 30, pose: { armNear: 140, armFar: 140, squash: Math.sin(frame / 6) < 0.15 ? 0.12 : -0.04 } },
        { id: "father", x: 1900, dir: -1, pose: { armNear: 60 } },
      ];
    case "altar":
      return [
        { id: "grandpa", x: 600, dir: -1, pose: { held: "incense", glow: 1, armNear: 80 - 30 * ease((t - 0.15) / 0.3), bow: 0.15 + 0.2 * ease((t - 0.15) / 0.3) } },
        { id: "father", x: 1000, dir: -1, pose: { bow: pray(1), armNear: 40, armFar: 40 } },
        { id: "mother", x: 850, dir: -1, pose: { bow: pray(2), armNear: 40, armFar: 40 } },
      ];
    case "share":
      return [
        { id: "grandpa", x: 3000, dir: 1, pose: { armNear: 40, nod: 0.15 * Math.sin(frame / 12), mood: "happy" } },
        { id: "mother", x: 3200, dir: 1, pose: { armNear: 75 * (1 - ease((t - 0.55) / 0.2)), held: t < 0.6 ? "bowl" : "none", mood: "happy" } },
        { id: "kid2", x: 3500, dir: -1, pose: { armNear: 75 * ease((t - 0.45) / 0.2), held: t >= 0.6 ? "bowl" : "none", mood: t > 0.6 ? "wow" : "happy" } },
        { id: "sweeper", x: 3740, dir: -1, pose: { held: "broom", armNear: 30, nod: 0.25 * Math.sin(frame / 9) } },
        { id: "n1", x: 3920, dir: -1, pose: { armNear: 90 * ease((t - 0.6) / 0.2) } },
      ];
    case "river":
      return [
        { id: "father", x: 3300, dir: 1, pose: { armNear: 140, armFar: 140, mood: "wow" } },
        { id: "kid", x: 3420, dir: 1, y: F - Math.abs(Math.sin(frame / 6)) * 26, pose: { armNear: 150, armFar: 150 } },
        { id: "c2", x: 4560, dir: -1, pose: { armNear: 130, mood: "happy" } },
        { id: "c3", x: 5330, dir: -1, pose: { armNear: 120, armFar: 100 } },
        { id: "sweeper", x: 3900, dir: 1, pose: { armNear: 90, held: "broom" } },
      ];
    case "pray":
      return [
        { id: "n2", x: 1380, dir: -1, pose: { bow: pray(5), armNear: 40, armFar: 40 } },
        { id: "n1", x: 1240, dir: -1, pose: { bow: pray(4), armNear: 40, armFar: 40 } },
        ...altarFamily(pray),
      ];
    case "kids": {
      const hop = (k: number) => Math.abs(Math.sin(frame / 6 + k));
      return [
        { id: "kid", x: 3620, dir: 1, y: F - hop(0) * 70, pose: { armNear: 130, armFar: 120, squash: hop(0) < 0.18 ? 0.14 : -0.05 } },
        { id: "kid2", x: 3880, dir: -1, y: F - hop(1.5) * 70, pose: { armNear: 120, armFar: 130, squash: hop(1.5) < 0.18 ? 0.14 : -0.05 } },
      ];
    }
    case "dinner":
      return [
        { id: "grandpa", x: 1080, dir: 1, y: F + 30, behind: true, pose: { armNear: 50, mood: "happy" } },
        { id: "mother", x: 1210, dir: 1, y: F + 30, behind: true, pose: { armNear: 60, held: "bowl" } },
        { id: "kid", x: 1320, dir: -1, y: F - 20, behind: true, pose: { armNear: 70 + 20 * Math.sin(frame / 5), mood: "wow" } },
        { id: "father", x: 1440, dir: -1, y: F + 30, behind: true, pose: { armNear: 45 } },
      ];
    case "rise":
      return [{ id: "grandpa", x: 600, dir: -1, pose: { held: "incense", glow: 1, armNear: 75 - 25 * ease(t / 0.3), bow: 0.2 } }];
    case "golden":
    case "outro":
      return [
        { id: "n1", x: 2480, dir: -1, pose: { bow: 0.35, armNear: 40, armFar: 40 } },
        { id: "father", x: 2180, dir: -1, pose: { bow: 0.35, armNear: 40, armFar: 40 } },
        { id: "mother", x: 2000, dir: -1, pose: { bow: 0.35, armNear: 40, armFar: 40 } },
        { id: "grandpa", x: 1820, dir: -1, pose: { bow: 0.35, armNear: 40, armFar: 40 } },
        { id: "kid", x: 1930, dir: -1, pose: { bow: 0.35, armNear: 40, armFar: 40 } },
      ];
    default:
      return [];
  }
};

// ------------------------------------------------------------------ props
const Lantern: React.FC<{ x: number; y: number; len: number; size: number; glow: number; frame: number; seed: number }> = ({ x, y, len, size, glow, frame, seed }) => {
  const filter = usePaperFilter();
  const sw = Math.sin(frame / (32 + seed * 5) + seed) * (4 + glow * 3);
  return (
    <g transform={`translate(${x} ${y}) rotate(${sw})`}>
      <line x1={0} y1={0} x2={0} y2={len} stroke={C2.ink} strokeWidth={3} opacity={0.6} />
      <g transform={`translate(0 ${len}) scale(${size})`}>
        <circle r={95} fill={C2.lanternGlow} opacity={0.18 + 0.4 * glow} />
        <g filter={filter}>
          <rect x={-22} y={-62} width={44} height={14} rx={4} fill={C2.gold} />
          <ellipse rx={56} ry={50} fill={C2.lantern} />
          <ellipse rx={30} ry={46} fill="#F25A45" opacity={0.25 + 0.5 * glow} />
          <path d="M-56 0 h112 M-40 -34 q40 -12 80 0 M-40 34 q40 12 80 0" stroke={C2.gold} strokeWidth={3} fill="none" opacity={0.8} />
          <rect x={-22} y={48} width={44} height={14} rx={4} fill={C2.gold} />
          <path d="M0 62 l0 40" stroke={C2.gold} strokeWidth={6} />
        </g>
      </g>
    </g>
  );
};

const Building: React.FC = () => {
  const filter = usePaperFilter();
  const F = R2.floor;
  return (
    <g>
      {/* Roof with tile rows and upturned eaves. */}
      <g filter={filter}>
        <path d={`M-560 ${R2.ceiling} L-560 ${R2.roofTop + 60} Q-560 ${R2.roofTop} -480 ${R2.roofTop} L3560 ${R2.roofTop} Q3640 ${R2.roofTop} 3640 ${R2.roofTop + 60} L3640 ${R2.ceiling} Z`} fill={C2.roof} />
        {Array.from({ length: 52 }, (_, i) => (
          <circle key={i} cx={-540 + i * 80} cy={R2.ceiling - 6} r={40} fill={C2.roofEdge} />
        ))}
        <path d={`M-620 ${R2.roofTop + 40} q40 -70 140 -90 L-460 ${R2.roofTop + 10} Z`} fill={C2.roofEdge} />
        <path d={`M3700 ${R2.roofTop + 40} q-40 -70 -140 -90 L3540 ${R2.roofTop + 10} Z`} fill={C2.roofEdge} />
      </g>
      {/* Back wall, dado band, floor. */}
      <rect x={-560} y={R2.ceiling} width={R2.shopEnd + 560} height={F - R2.ceiling} fill={C2.wall} />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={-520 + i * 240} y={R2.ceiling} width={120} height={F - R2.ceiling} fill={C2.wallShade} opacity={0.35} />
      ))}
      <rect x={-560} y={F - 210} width={R2.shopEnd + 560} height={210} fill={C2.dado} />
      <rect x={-560} y={F - 214} width={R2.shopEnd + 560} height={12} fill={C2.dadoTrim} />
      <rect x={-560} y={R2.ceiling - 10} width={4100} height={44} fill={C2.beam} filter={filter} />
      <rect x={-560} y={F} width={R2.door.x1 + 560} height={1200} fill={C2.floor} />
      {[30, 90, 180, 300, 460].map((dy, i) => (
        <line key={i} x1={-560} y1={F + dy} x2={R2.door.x1} y2={F + dy} stroke={C2.floorLine} strokeWidth={4} opacity={0.6} />
      ))}
      <rect x={-560} y={F} width={R2.door.x1 + 560} height={10} fill={C2.floorFront} />
      {/* Front wall pillar, lintel with emblem board, right pillar. */}
      <g filter={filter}>
        <rect x={R2.shopEnd} y={R2.ceiling} width={R2.door.x0 - R2.shopEnd} height={F - R2.ceiling} fill={C2.red} />
        <rect x={R2.shopEnd} y={R2.ceiling} width={3460 - R2.shopEnd} height={R2.door.top - R2.ceiling} fill={C2.wallShade} />
        <rect x={2880} y={250} width={400} height={130} rx={10} fill={C2.red} />
        <rect x={2896} y={266} width={368} height={98} rx={6} fill="none" stroke={C2.gold} strokeWidth={6} />
        <circle cx={3080} cy={315} r={34} fill={C2.gold} />
        <rect x={3066} y={301} width={28} height={28} fill={C2.red} />
        <rect x={R2.door.x1} y={R2.ceiling} width={80} height={F - R2.ceiling} fill={C2.red} />
      </g>
    </g>
  );
};

const Door: React.FC<{ open: number; glow: number }> = ({ open, glow }) => {
  const filter = usePaperFilter();
  const { x0, x1, top } = R2.door;
  const F = R2.floor;
  const w = (x1 - x0) / 2;
  const leaf = (side: -1 | 1) => {
    const hinge = side < 0 ? x0 : x1;
    const sx = 1 - 0.86 * open;
    return (
      <g transform={`translate(${hinge} 0) scale(${sx} 1) translate(${-hinge} 0)`} filter={filter}>
        <g transform={side < 0 ? "" : `translate(${2 * hinge} 0) scale(-1 1)`}>
          <rect x={hinge} y={top} width={w} height={F - top} fill={C2.red} />
          {[0, 1, 2].map((r) => (
            <rect key={r} x={hinge + 36} y={top + 50 + r * 330} width={w - 72} height={280} rx={10} fill={C2.redDeep} />
          ))}
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={hinge + 70 + c * 80} cy={top + 30 + r * 330} r={10} fill={C2.gold} />),
          )}
          <circle cx={hinge + w - 40} cy={top + (F - top) / 2} r={26} fill="none" stroke={C2.gold} strokeWidth={8} />
        </g>
      </g>
    );
  };
  return (
    <g>
      {/* Bright outdoors seen through the doorway. */}
      <rect x={x0} y={top} width={x1 - x0} height={F - top} fill={C2.light} opacity={0.35 + 0.65 * open} />
      <rect x={x0} y={top} width={x1 - x0} height={F - top} fill="#FFFFFF" opacity={0.25 * glow * open} />
      {leaf(-1)}
      {leaf(1)}
    </g>
  );
};

const Altar: React.FC<{ frame: number; incense: number; glow: number }> = ({ frame, incense, glow }) => {
  const filter = usePaperFilter();
  const A = R2.altar;
  const F = R2.floor;
  const flame = (k: number) => 1 + 0.18 * noise2D(`fl${k}`, frame / 5, 0);
  return (
    <g>
      <g filter={filter}>
        <rect x={A.x0 + 20} y={A.board} width={A.x1 - A.x0 - 40} height={A.top - A.board} rx={14} fill={C2.red} />
        <rect x={A.x0 + 38} y={A.board + 18} width={A.x1 - A.x0 - 76} height={A.top - A.board - 36} rx={10} fill="none" stroke={C2.gold} strokeWidth={8} />
        <rect x={A.x0} y={A.top} width={A.x1 - A.x0} height={F - A.top} rx={10} fill={C2.red} />
        <rect x={A.x0} y={A.top} width={A.x1 - A.x0} height={22} fill={C2.gold} />
        {[0.25, 0.5, 0.75].map((k) => (
          <circle key={k} cx={A.x0 + (A.x1 - A.x0) * k} cy={A.top + 180} r={36} fill="none" stroke={C2.gold} strokeWidth={8} />
        ))}
      </g>
      {/* Candles and fruit. */}
      {[210, 640].map((x, k) => (
        <g key={x} transform={`translate(${x} ${A.top})`}>
          <rect x={-14} y={-90} width={28} height={90} rx={6} fill={C2.redDeep} filter={filter} />
          <circle cx={0} cy={-112} r={26} fill={C2.lanternGlow} opacity={0.35 * glow} />
          <ellipse cx={0} cy={-108} rx={9} ry={18 * flame(k)} fill="#FFB347" />
          <ellipse cx={0} cy={-102} rx={4} ry={8} fill="#FFF4C2" />
        </g>
      ))}
      <g transform={`translate(300 ${A.top})`} filter={filter}>
        {[
          [-30, -24],
          [0, -24],
          [30, -24],
          [-15, -60],
          [15, -60],
          [0, -94],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={22} fill="#F59B2B" />
        ))}
      </g>
      {/* Bronze burner with the incense sticks. */}
      <g transform={`translate(${R2.burner.x} ${R2.burner.y})`}>
        {Array.from({ length: incense }, (_, i) => {
          const dx = (i - (incense - 1) / 2) * 12;
          return (
            <g key={i}>
              <line x1={dx * 0.5} y1={-60} x2={dx} y2={-150} stroke={C2.red} strokeWidth={5} strokeLinecap="round" />
              <circle cx={dx} cy={-152} r={12} fill={C2.lanternGlow} opacity={0.4} />
              <circle cx={dx} cy={-152} r={5} fill="#FF7A2E" />
            </g>
          );
        })}
        <g filter={filter}>
          <path d="M-70 -80 Q-70 0 0 0 Q70 0 70 -80 Z" fill={C2.bronze} />
          <rect x={-78} y={-90} width={156} height={18} rx={9} fill="#8A5E2C" />
          <circle cx={-78} cy={-60} r={14} fill="none" stroke="#8A5E2C" strokeWidth={8} />
          <circle cx={78} cy={-60} r={14} fill="none" stroke="#8A5E2C" strokeWidth={8} />
        </g>
      </g>
    </g>
  );
};

const GOODS = (() => {
  const items: { x: number; y: number; kind: number; c: string; w: number; h: number }[] = [];
  R2.shelves.boards.forEach((by, row) => {
    for (let x = R2.shelves.x0 + 50; x < R2.shelves.x1 - 30; x += 72) {
      const r = random(`g${row}-${x}`);
      items.push({ x, y: by, kind: Math.floor(r * 3), c: C2.goods[Math.floor(random(`c${row}${x}`) * C2.goods.length)], w: 46 + r * 18, h: 50 + random(`h${row}${x}`) * 46 });
    }
  });
  return items.sort((a, b) => random(`o${a.x}${a.y}`) - random(`o${b.x}${b.y}`));
})();

const Shelves: React.FC<{ fill: number }> = ({ fill }) => {
  const filter = usePaperFilter();
  const S = R2.shelves;
  const n = GOODS.length * fill;
  return (
    <g>
      <rect x={S.x0} y={S.boards[0] - 90} width={S.x1 - S.x0} height={S.boards[3] - S.boards[0] + 110} rx={10} fill={C2.woodDark} filter={filter} />
      {GOODS.map((g, i) => {
        const k = c01(n - i);
        if (k <= 0) return null;
        const sc = pop(k);
        return (
          <g key={i} transform={`translate(${g.x} ${g.y}) scale(${sc})`}>
            {g.kind === 0 ? (
              <rect x={-g.w / 2} y={-g.h} width={g.w} height={g.h} rx={6} fill={g.c} />
            ) : g.kind === 1 ? (
              <g>
                <rect x={-g.w / 2} y={-g.h} width={g.w} height={g.h} rx={g.w / 2.6} fill={g.c} />
                <rect x={-g.w / 2 - 3} y={-g.h} width={g.w + 6} height={12} rx={4} fill={C2.red} />
              </g>
            ) : (
              <circle cx={0} cy={-g.w / 2} r={g.w / 2} fill={g.c} />
            )}
          </g>
        );
      })}
      {S.boards.map((by) => (
        <rect key={by} x={S.x0 - 12} y={by} width={S.x1 - S.x0 + 24} height={18} rx={6} fill={C2.wood} filter={filter} />
      ))}
    </g>
  );
};

const Basket: React.FC<{ x: number; fill: number }> = ({ x, fill }) => {
  const filter = usePaperFilter();
  return (
    <g transform={`translate(${x} ${R2.floor})`}>
      {Array.from({ length: 7 }, (_, i) => {
        const k = c01(fill * 7 - i);
        return k > 0 ? <circle key={i} cx={-60 + (i % 4) * 40 + (i > 3 ? 20 : 0)} cy={-110 - (i > 3 ? 38 : 0)} r={24 * pop(k)} fill={C2.goods[i % C2.goods.length]} /> : null;
      })}
      <path d="M-90 -110 L90 -110 L70 0 L-70 0 Z" fill="#C99A55" filter={filter} />
      {[-60, -20, 20, 60].map((dx) => (
        <line key={dx} x1={dx} y1={-108} x2={dx * 0.8} y2={-2} stroke="#A57A3C" strokeWidth={5} />
      ))}
    </g>
  );
};

const Counter: React.FC<{ frame: number; busy: number }> = ({ frame, busy }) => {
  const filter = usePaperFilter();
  const K = R2.counter;
  const tilt = Math.sin(frame / 9) * 9 * busy;
  return (
    <g>
      {/* Jars and scale on the counter. */}
      {[1925, 1995, 2065].map((x, i) => (
        <g key={x} transform={`translate(${x} ${K.top})`} filter={filter}>
          <rect x={-30} y={-96} width={60} height={96} rx={16} fill="#E8F4F1" opacity={0.9} />
          <rect x={-26} y={-70} width={52} height={66} rx={12} fill={C2.goods[i + 1]} opacity={0.85} />
          <rect x={-34} y={-108} width={68} height={16} rx={6} fill={C2.red} />
        </g>
      ))}
      <g transform={`translate(${R2.scale.x} ${R2.scale.y})`} filter={filter}>
        <rect x={-8} y={-150} width={16} height={150} fill={C2.goldDeep} />
        <rect x={-40} y={-10} width={80} height={14} rx={6} fill={C2.goldDeep} />
        <g transform={`translate(0 -150) rotate(${tilt})`}>
          <rect x={-90} y={-6} width={180} height={12} rx={6} fill={C2.gold} />
          {[-1, 1].map((k) => (
            <g key={k} transform={`translate(${k * 84} 0) rotate(${-tilt})`}>
              <line x1={-20} y1={0} x2={0} y2={-0} stroke={C2.goldDeep} strokeWidth={3} />
              <line x1={-24} y1={56} x2={0} y2={0} stroke={C2.goldDeep} strokeWidth={3} />
              <line x1={24} y1={56} x2={0} y2={0} stroke={C2.goldDeep} strokeWidth={3} />
              <path d="M-34 56 Q0 80 34 56 Z" fill={C2.gold} />
            </g>
          ))}
        </g>
      </g>
      {/* Front panel (in front of the shopkeeper). */}
      <g filter={filter}>
        <rect x={K.x0} y={K.top} width={K.x1 - K.x0} height={R2.floor - K.top} rx={10} fill={C2.wood} />
        <rect x={K.x0 - 16} y={K.top - 14} width={K.x1 - K.x0 + 32} height={24} rx={8} fill={C2.woodDark} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={K.x0 + 30 + i * 155} y={K.top + 50} width={130} height={220} rx={12} fill="none" stroke={C2.woodDark} strokeWidth={6} />
        ))}
      </g>
    </g>
  );
};

const Table: React.FC<{ dishes: number; frame: number }> = ({ dishes, frame }) => {
  const filter = usePaperFilter();
  const T = R2.table;
  return (
    <g>
      {Array.from({ length: 5 }, (_, i) => {
        const k = c01(dishes * 5 - i);
        if (k <= 0) return null;
        const x = T.x - 160 + i * 80;
        return (
          <g key={i} transform={`translate(${x} ${T.top - 18}) scale(${pop(k)})`}>
            <path d="M-34 0 Q0 30 34 0 Z" fill="#FFFFFF" />
            <ellipse cx={0} cy={-4} rx={28} ry={16} fill={C2.goods[(i + 2) % C2.goods.length]} />
            <path d={`M-6 -24 q${6 + Math.sin(frame / 8 + i) * 3} -14 0 -28`} stroke={C2.smoke} strokeWidth={4} fill="none" opacity={0.75} />
          </g>
        );
      })}
      <g filter={filter}>
        <ellipse cx={T.x} cy={T.top} rx={240} ry={32} fill={C2.wood} />
        <rect x={T.x - 230} y={T.top} width={460} height={52} rx={10} fill={C2.woodDark} />
        <rect x={T.x - 190} y={T.top + 40} width={26} height={R2.floor - T.top - 40} fill={C2.woodDark} />
        <rect x={T.x + 164} y={T.top + 40} width={26} height={R2.floor - T.top - 40} fill={C2.woodDark} />
      </g>
    </g>
  );
};

const Street: React.FC<{ frame: number; glow: number; coinsIn: number }> = ({ frame, glow, coinsIn }) => {
  const filter = usePaperFilter();
  const F = R2.floor;
  return (
    <g>
      <rect x={R2.door.x1} y={F} width={R2.streetEnd - R2.door.x1 + 400} height={1200} fill={C2.street} />
      {[40, 120, 240, 420].map((dy) => (
        <line key={dy} x1={R2.door.x1} y1={F + dy} x2={R2.streetEnd + 400} y2={F + dy} stroke={C2.streetLine} strokeWidth={4} />
      ))}
      {/* Lantern strings across the lane. */}
      {[0, 1].map((row) => (
        <g key={row}>
          <path d={`M3460 ${560 + row * 120} Q4200 ${700 + row * 120} 4900 ${560 + row * 120} Q5600 ${700 + row * 120} 6300 ${560 + row * 120}`} stroke={C2.ink} strokeWidth={3} fill="none" opacity={0.5} />
          {Array.from({ length: 10 }, (_, i) => {
            const x = 3600 + i * 280 + row * 140;
            const sag = Math.sin(((x - 3460) / 1440) * Math.PI) * 110;
            return <Lantern key={i} x={x} y={560 + row * 120 + sag} len={50} size={0.7} glow={glow} frame={frame} seed={i + row * 10} />;
          })}
        </g>
      ))}
      {/* Stalls with striped awnings. */}
      {R2.stalls.map((sx, i) => (
        <g key={sx} transform={`translate(${sx} 0)`}>
          <g filter={filter}>
            <rect x={-170} y={940} width={14} height={F - 940} fill={C2.woodDark} />
            <rect x={156} y={940} width={14} height={F - 940} fill={C2.woodDark} />
            {Array.from({ length: 6 }, (_, k) => (
              <rect key={k} x={-200 + k * 66.7} y={880} width={66.7} height={90} fill={k % 2 ? "#FFF3D6" : C2.awnings[i % C2.awnings.length]} />
            ))}
            {Array.from({ length: 6 }, (_, k) => (
              <circle key={k} cx={-166.6 + k * 66.7} cy={970} r={33} fill={k % 2 ? "#FFF3D6" : C2.awnings[i % C2.awnings.length]} />
            ))}
            <rect x={-180} y={1250} width={360} height={F - 1250} rx={10} fill={C2.stall} />
          </g>
          {Array.from({ length: 5 }, (_, k) => (
            <circle key={k} cx={-120 + k * 60} cy={1222} r={30} fill={C2.goods[(k + i) % C2.goods.length]} />
          ))}
          {/* Coins landing in the stall baskets (river shot). */}
          {coinsIn > 0
            ? Array.from({ length: 4 }, (_, k) => {
                const kk = c01(coinsIn * 4 - k);
                return kk > 0 ? <ellipse key={`c${k}`} cx={-60 + k * 40} cy={1180 - k * 6} rx={18 * pop(kk)} ry={10 * pop(kk)} fill={C2.gold} stroke={C2.goldDeep} strokeWidth={3} /> : null;
              })
            : null}
        </g>
      ))}
      {/* Charity box: red with a heart emblem and a coin slot. */}
      <g transform={`translate(${R2.charityBox.x} ${R2.charityBox.y})`} filter={filter}>
        <rect x={-20} y={-140} width={40} height={140} fill={C2.woodDark} />
        <rect x={-90} y={-300} width={180} height={170} rx={14} fill={C2.red} />
        <rect x={-90} y={-300} width={180} height={20} rx={8} fill={C2.gold} />
        <rect x={-36} y={-298} width={72} height={10} rx={5} fill={C2.ink} />
        <path d="M0 -170 C-50 -200 -40 -250 0 -230 C40 -250 50 -200 0 -170 Z" fill={C2.gold} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ effects
const Sparkle: React.FC<{ x: number; y: number; s: number; r?: number; op?: number; color?: string }> = ({ x, y, s, r = 0, op = 1, color = C2.goldLight }) => (
  <path d="M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z" fill={color} opacity={op} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} />
);
const Coin: React.FC<{ x: number; y: number; r: number; spin: number }> = ({ x, y, r, spin }) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.25, Math.abs(Math.cos(spin)))} 1)`}>
    <circle r={r} fill={C2.gold} stroke={C2.goldDeep} strokeWidth={r * 0.18} />
    <rect x={-r * 0.28} y={-r * 0.28} width={r * 0.56} height={r * 0.56} fill={C2.goldDeep} />
  </g>
);
const Heart: React.FC<{ x: number; y: number; s: number; op: number }> = ({ x, y, s, op }) => (
  <path d="M0 18 C-26 2 -22 -20 0 -10 C22 -20 26 2 0 18 Z" fill={C2.gold} stroke={C2.goldDeep} strokeWidth={3} opacity={op} transform={`translate(${x} ${y}) scale(${s})`} />
);

const quad = (a: [number, number], b: [number, number], c: [number, number], s: number): [number, number] => {
  const u = 1 - s;
  return [u * u * a[0] + 2 * u * s * b[0] + s * s * c[0], u * u * a[1] + 2 * u * s * b[1] + s * s * c[1]];
};

const Smoke: React.FC<{ frame: number; rise: number; amount: number; tall?: boolean }> = ({ frame, rise, amount, tall }) => {
  const tip = R2.incenseTip;
  const n = tall ? 34 : 18;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: n }, (_, i) => {
        const life = tall ? 110 : 80;
        const k = ((frame + (i * life) / n) % life) / life;
        const y = tip.y - k * rise;
        // A light draught carries the smoke to the right, past Cai Shen's face.
        const x = tip.x + k * rise * (tall ? 0.12 : 0.6) + noise2D(`sm${i}`, frame / 60 + i * 0.3, 0) * (16 + k * 50) + Math.sin(k * 6 + i) * 10 * k;
        return <circle key={i} cx={x} cy={y} r={10 + k * (tall ? 46 : 30)} fill={C2.smoke} opacity={Math.sin(Math.PI * k) * 0.45 * amount} />;
      })}
    </g>
  );
};

// Golden light ribbon: from the incense to `to`, its head advancing with p.
const Ribbon: React.FC<{ to: [number, number]; via: [number, number]; p: number; frame: number }> = ({ to, via, p, frame }) => {
  const a: [number, number] = [R2.incenseTip.x, R2.incenseTip.y - 40];
  const pts: string[] = [];
  const N = 40;
  for (let i = 0; i <= N * c01(p); i++) {
    const [x, y] = quad(a, via, to, i / N);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${(y + Math.sin(i / 3 + frame / 6) * 10).toFixed(1)}`);
  }
  const head = quad(a, via, to, c01(p));
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <path d={pts.join(" ")} stroke={C2.goldLight} strokeWidth={46} strokeLinecap="round" fill="none" opacity={0.25} />
      <path d={pts.join(" ")} stroke={C2.gold} strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.85} />
      {Array.from({ length: 10 }, (_, i) => (
        <Sparkle key={i} x={head[0] + Math.cos(i + frame / 5) * 50} y={head[1] + Math.sin(i * 2 + frame / 4) * 40} s={1.6 + (i % 3)} r={frame * 4 + i * 30} op={0.9} />
      ))}
    </g>
  );
};

// ------------------------------------------------------------------ scene
const shelfFillOf = (shot: string, t: number) => {
  const early = ["intro", "hands", "face", "door", "shutter", "shelf", "sweep", "ledger", "market"];
  if (early.includes(shot)) return shot === "shelf" ? 0.55 + 0.2 * t : 0.55;
  if (shot === "bless") return 0.55 + 0.25 * ease(t);
  if (shot === "friendly" || shot === "busy") return 0.8;
  if (shot === "blessing") return 0.8 + 0.2 * ease((t - 0.2) / 0.6);
  return 1;
};

const World: React.FC<{ s: Shot2D; cam: Cam; prev: Cam }> = ({ s, cam, prev }) => {
  const { shot, t, frame } = s;
  const lit = shot === "intro" ? 0.2 + 0.8 * ease(t * 1.1) : 1;
  const golden = shot === "golden" ? ease(t) : shot === "outro" ? 1 : 0;
  const lanternGlow = shot === "intro" ? 0 : ["altar", "pray", "golden", "outro"].includes(shot) ? 1.4 : 1;
  const doorOpen = ["intro", "hands", "face"].includes(shot) ? 0 : shot === "door" ? ease((t - 0.55) / 0.35) : shot === "shutter" ? ease(t * 1.4) : 1;
  const incense = shot === "altar" ? (t > 0.42 ? 6 : 3) : ["rise", "golden", "outro"].includes(shot) ? (shot === "rise" && t < 0.25 ? 6 : 7) : ["pray", "yuanbao", "share", "river", "kids", "customer", "dinner"].includes(shot) ? 6 : 3;
  const bless = shot === "bless" ? ease((t - 0.1) / 0.4) : shot === "dinner" || shot === "kids" ? 0.7 : 0;
  const lift = shot === "yuanbao" ? ease((t - 0.1) / 0.45) : 0;
  const nod = ["altar", "pray", "busy"].includes(shot) ? Math.sin(frame / 12) * 0.6 : shot === "face" ? Math.sin(frame / 18) * 0.3 : 0;
  const csOp = shot === "golden" ? 1 - ease((t - 0.45) / 0.5) : shot === "outro" ? 0 : 1;
  const csGlow = ["face", "bless", "yuanbao", "busy"].includes(shot) ? 1 : 0.6 + golden;
  const wink = shot === "yuanbao" ? (t > 0.55 && t < 0.8 ? 1 : 0) : 0;
  const busy = ["busy", "friendly", "customer", "ledger"].includes(shot) ? 1 : 0;
  const dishes = shot === "dinner" ? 0.3 + ease(t * 1.4) : 0;
  const coinsIn = shot === "river" ? ease((t - 0.35) / 0.5) : 0;
  const actors = castOf(s);
  const draw = (a: Actor) => (
    <Folk key={a.id} x={a.x} y={a.y ?? R2.floor} h={KIDS.has(a.id) ? R2.child : R2.adult} dir={a.dir} look={LOOKS[a.id]} pose={a.pose} blink={Math.floor(random(a.id) * 90)} />
  );
  // Motion blur along the camera move (screen px per frame).
  const speed = Math.hypot((cam.x - prev.x) * cam.z, (cam.y - prev.y) * cam.z);
  const blur = Math.min(16, Math.max(0, speed - 10) * 0.35);
  const dirAngle = (Math.atan2((cam.y - prev.y), (cam.x - prev.x)) * 180) / Math.PI;
  const horizontal = Math.abs(Math.cos((dirAngle * Math.PI) / 180)) > 0.7;

  return (
    <g>
      <defs>
        <filter id="mblur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={horizontal ? `${blur} 0` : `0 ${blur}`} />
        </filter>
        <linearGradient id="sky2d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shot === "shutter" ? C2.dawn[0] : C2.sky[0]} />
          <stop offset="0.6" stopColor={shot === "shutter" ? C2.dawn[1] : C2.sky[1]} />
          <stop offset="1" stopColor={C2.sky[2]} />
        </linearGradient>
      </defs>
      {/* Sky (screen-fixed) with a slow sun and clouds. */}
      <rect x={0} y={0} width={W} height={H} fill="url(#sky2d)" />
      <g transform={view(cam, 0.12)}>
        <circle cx={4600} cy={-200} r={260} fill={C2.sun} opacity={0.9} />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(${2600 + i * 900 + ((frame * 0.6 + i * 300) % 900)} ${-560 + (i % 2) * 260})`}>
            <ellipse rx={200} ry={70} fill={C2.cloud} opacity={0.85} />
            <circle cx={-80} cy={-30} r={80} fill={C2.cloud} opacity={0.85} />
            <circle cx={60} cy={-50} r={100} fill={C2.cloud} opacity={0.85} />
          </g>
        ))}
      </g>
      {/* Far rooftops (parallax). */}
      <g transform={view(cam, 0.45)}>
        {Array.from({ length: 12 }, (_, i) => {
          const x = 2400 + i * 420;
          const top = 420 + (i % 3) * 90;
          return (
            <g key={i}>
              <rect x={x} y={top} width={360} height={1400} fill={C2.farRoof} opacity={0.75} />
              <path d={`M${x - 50} ${top + 10} Q${x + 180} ${top - 90} ${x + 410} ${top + 10} Z`} fill={C2.roof} opacity={0.55} />
            </g>
          );
        })}
      </g>
      <g transform={view(cam)} filter={blur > 0.5 ? "url(#mblur)" : undefined}>
        <Street frame={frame} glow={lanternGlow} coinsIn={coinsIn} />
        {/* Evening sky above the roof (the rise shot ends up here): sun glow,
            drifting clouds and paper sky lanterns floating up. */}
        {shot === "rise" ? (
          <g>
            <circle cx={720} cy={-900} r={360} fill={C2.sun} opacity={0.45} />
            <circle cx={720} cy={-900} r={200} fill={C2.sun} opacity={0.8} />
            {[
              [-120, -620, 1.2],
              [980, -760, 1.0],
              [180, -1080, 0.9],
              [1040, -1180, 1.3],
              [520, -420, 0.8],
            ].map(([cx, cy, sc], i) => (
              <g key={i} transform={`translate(${cx + Math.sin(frame / 40 + i) * 30 + frame * 0.8} ${cy}) scale(${sc})`}>
                <ellipse rx={200} ry={64} fill={C2.cloud} />
                <circle cx={-80} cy={-26} r={78} fill={C2.cloud} />
                <circle cx={60} cy={-48} r={96} fill={C2.cloud} />
              </g>
            ))}
            {Array.from({ length: 7 }, (_, i) => {
              const x = 60 + i * 150 + Math.sin(frame / 30 + i) * 20;
              const y = -200 - ((frame * 2.2 + i * 210) % 1300);
              return (
                <g key={`sl${i}`} transform={`translate(${x} ${y}) scale(${0.5 + (i % 3) * 0.15})`}>
                  <circle r={70} fill={C2.lanternGlow} opacity={0.4} />
                  <path d="M-34 -50 L34 -50 L44 40 L-44 40 Z" fill={C2.lantern} />
                  <path d="M-30 30 L30 30 L26 40 L-26 40 Z" fill={C2.gold} />
                  <ellipse cx={0} cy={30} rx={18} ry={8} fill="#FFE29A" />
                </g>
              );
            })}
          </g>
        ) : null}
        <Building />
        <Altar frame={frame} incense={incense} glow={lit} />
        <CaiShen2D x={R2.caishen.x} y={R2.caishen.feet} h={R2.caishen.height} bless={bless} lift={lift} nod={nod} op={csOp} glow={csGlow} frame={frame} />
        <Tiger2D x={R2.tiger.x} y={R2.tiger.y} h={150} wink={wink} frame={frame} />
        <Shelves fill={shelfFillOf(shot, t)} />
        <Basket x={980} fill={shot === "blessing" ? 0.3 + ease((t - 0.3) / 0.6) : ["pray", "golden", "outro", "dinner", "rise", "kids", "customer", "river", "yuanbao", "share", "altar"].includes(shot) ? 1 : 0.3} />
        <Basket x={1660} fill={shot === "blessing" ? 0.2 + ease((t - 0.4) / 0.55) : ["pray", "golden", "outro", "dinner", "rise", "kids", "customer", "river", "yuanbao", "share", "altar"].includes(shot) ? 1 : 0.2} />
        <Door open={doorOpen} glow={shot === "door" || shot === "shutter" ? 1 : 0.4} />
        {/* Light pouring in through the open door. */}
        <path d={`M${R2.door.x0} ${R2.door.top} L${R2.door.x0} ${R2.floor} L${R2.door.x0 - 1500} ${R2.floor + 260} L${R2.door.x0 - 900} ${R2.door.top + 300} Z`} fill={C2.light} opacity={0.22 * doorOpen} style={{ mixBlendMode: "screen" }} />
        {actors.filter((a) => a.behind).map(draw)}
        <Table dishes={dishes} frame={frame} />
        <Counter frame={frame} busy={busy} />
        {actors.filter((a) => !a.behind).map(draw)}
        {/* Hanging lanterns inside (light one by one in the intro). */}
        {[300, 1000, 1650, 2350].map((x, i) => (
          <Lantern key={x} x={x} y={R2.ceiling + 30} len={100} size={1.05} glow={shot === "intro" ? c01(t * 2.2 - i * 0.35) : lanternGlow} frame={frame} seed={i} />
        ))}
        <Smoke frame={frame} rise={shot === "rise" ? 1500 : 300} amount={lit * (["face", "yuanbao"].includes(shot) ? 0.45 : 1)} tall={shot === "rise"} />
        {/* Effects per shot. */}
        {shot === "door" ? <Ribbon to={[R2.door.x0 + 300, 1000]} via={[1600, 700]} p={ease(t * 1.15)} frame={frame} /> : null}
        {shot === "share" ? <Ribbon to={[3480, 1250]} via={[1800, 650]} p={ease(t * 1.2)} frame={frame} /> : null}
        {shot === "blessing"
          ? Array.from({ length: 60 }, (_, i) => {
              const born = (i / 60) * 0.8;
              const k = c01((t - born) / 0.25);
              if (k <= 0 || k >= 1) return null;
              const target: [number, number] = i % 5 === 0 ? [980, 1400] : i % 5 === 1 ? [1660, 1400] : [R2.shelves.x0 + random(`bx${i}`) * (R2.shelves.x1 - R2.shelves.x0), R2.shelves.boards[Math.floor(random(`by${i}`) * 4)] - 30];
              const [x, y] = quad([R2.incenseTip.x, R2.incenseTip.y - 60], [(R2.incenseTip.x + target[0]) / 2, 400], target, ease(k));
              return <Sparkle key={i} x={x} y={y} s={2 + (i % 3)} r={frame * 6 + i * 20} op={Math.sin(Math.PI * k)} />;
            })
          : null}
        {shot === "altar" && t > 0.55 ? (
          <ellipse cx={R2.incenseTip.x} cy={R2.incenseTip.y - 120 - ease((t - 0.55) / 0.45) * 240} rx={40 + ease((t - 0.55) / 0.45) * 160} ry={14 + ease((t - 0.55) / 0.45) * 50} fill="none" stroke={C2.gold} strokeWidth={10} opacity={1 - ease((t - 0.75) / 0.25)} style={{ mixBlendMode: "screen" }} />
        ) : null}
        {shot === "friendly"
          ? [
              [2300, 860, 0.15],
              [2560, 900, 0.35],
              [2430, 820, 0.55],
            ].map(([x, y, d], i) => {
              const k = c01((t - d) / 0.3);
              return k > 0 && k < 1 ? <Heart key={i} x={x} y={y - k * 80} s={1.4 * pop(Math.min(1, k * 2))} op={1 - c01((k - 0.7) / 0.3)} /> : null;
            })
          : null}
        {shot === "river"
          ? Array.from({ length: 70 }, (_, i) => {
              const k = (frame * 0.007 + i / 70) % 1;
              const branch = i % 4;
              const start: [number, number] = [3420, 1440];
              const end: [number, number] = branch === 0 ? [R2.charityBox.x, 1190] : branch === 1 ? [R2.stalls[1], 1180] : branch === 2 ? [R2.stalls[2], 1180] : [3330, 1200];
              const via: [number, number] = [(start[0] + end[0]) / 2, 1560 + Math.sin(i) * 60];
              const [x, y] = quad(start, via, end, k);
              return <Coin key={i} x={x} y={y - Math.abs(Math.sin(k * 9 + i)) * 40} r={i % 6 === 0 ? 30 : 22} spin={frame / 4 + i} />;
            })
          : null}
        {["pray", "golden", "outro", "intro", "rise"].includes(shot)
          ? Array.from({ length: 26 }, (_, i) => (
              <Sparkle
                key={`f${i}`}
                x={cam.x + (random(`sx${i}`) - 0.5) * (W / cam.z) + noise2D(`sp${i}`, frame / 80, 0) * 40}
                y={cam.y + (random(`sy${i}`) - 0.5) * (H / cam.z) - ((frame * 1.2 + i * 70) % 400)}
                s={(1.2 + (i % 3) * 0.6) / Math.max(0.6, cam.z)}
                r={frame * 3 + i * 40}
                op={0.4 + 0.5 * Math.abs(Math.sin(frame / 20 + i))}
              />
            ))
          : null}
      </g>
      {/* Night and golden washes. */}
      <rect x={0} y={0} width={W} height={H} fill={C2.night} opacity={0.72 * (1 - lit)} />
      {shot === "intro"
        ? [300, 1000, 1650, 2350].map((x, i) => {
            const g = c01(t * 2.2 - i * 0.35);
            const sx = (x - cam.x) * cam.z + W / 2;
            const sy = (R2.ceiling + 130 - cam.y) * cam.z + H / 2;
            return <circle key={i} cx={sx} cy={sy} r={110 * cam.z} fill={C2.lanternGlow} opacity={0.5 * g * (1 - lit)} style={{ mixBlendMode: "screen" }} />;
          })
        : null}
      <rect x={0} y={0} width={W} height={H} fill={C2.goldLight} opacity={0.38 * golden} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};

// Paper wipe across montage cuts: a torn sheet slides in at the end of one
// shot and out at the start of the next.
const WIPE_FRAMES = 6;
const WIPE_OUT = new Set(["shelf", "sweep", "ledger", "customer", "dinner"]);
const WIPE_IN = new Set(["shutter", "shelf", "sweep", "kids", "customer"]);
const Wipe: React.FC<{ s: Shot2D }> = ({ s }) => {
  const len = s.len ?? 0;
  let x: number | null = null;
  if (WIPE_OUT.has(s.shot) && s.local < WIPE_FRAMES) x = -ease(s.local / WIPE_FRAMES) * (W + 300);
  if (WIPE_IN.has(s.shot) && len && len - s.local <= WIPE_FRAMES) x = (1 - ease((WIPE_FRAMES - (len - s.local)) / WIPE_FRAMES)) * (W + 300);
  if (x === null) return null;
  const edge = Array.from({ length: 24 }, (_, i) => `L${(i % 2 ? -26 : 0) + (random(`we${i}`) - 0.5) * 20} ${(i / 23) * H}`).join(" ");
  return (
    <g transform={`translate(${x} 0)`}>
      <path d={`M0 0 ${edge} L${W + 300} ${H} L${W + 300} 0 Z`} fill={C2.gold} />
      <path d={`M40 0 ${edge.replace(/L(-?[\d.]+)/g, (_, v) => `L${Number(v) + 40}`)} L${W + 300} ${H} L${W + 300} 0 Z`} fill={C2.red} />
    </g>
  );
};

export const Ruko2D: React.FC<{ s: Shot2D }> = ({ s }) => {
  const spec = CAM2D[s.shot] ?? CAM2D.intro;
  const step = s.len && s.len > 1 ? 1 / (s.len - 1) : 0;
  const cam = camOf(spec, s.t, s.frame);
  const prev = camOf(spec, Math.max(0, s.t - step), s.frame - 1);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <PaperDefs fx={PAPER2} />
      {s.shot === "bless" ? (
        // Split screen: Cai Shen blesses on the left, the shop comes alive on
        // the right; a torn paper seam with gold flowing across.
        <>
          <defs>
            <clipPath id="split-l">
              <path d={`M0 0 L560 0 L500 ${H} L0 ${H} Z`} />
            </clipPath>
            <clipPath id="split-r">
              <path d={`M560 0 L${W} 0 L${W} ${H} L500 ${H} Z`} />
            </clipPath>
          </defs>
          <g clipPath="url(#split-l)">
            <World s={s} cam={cam} prev={prev} />
          </g>
          <g clipPath="url(#split-r)">
            <World s={s} cam={camOf(CAM2D_SPLIT, s.t, s.frame)} prev={camOf(CAM2D_SPLIT, Math.max(0, s.t - step), s.frame - 1)} />
          </g>
          <path d={`M560 0 L500 ${H}`} stroke="#FFF7E6" strokeWidth={18} />
          <path d={`M560 0 L500 ${H}`} stroke={C2.gold} strokeWidth={6} />
          {Array.from({ length: 14 }, (_, i) => {
            const k = ((s.frame * 0.02 + i / 14) % 1);
            return <Sparkle key={i} x={300 + k * 560} y={500 + i * 70 + Math.sin(k * 8 + i) * 40} s={2.2} r={s.frame * 5 + i * 25} op={Math.sin(Math.PI * k)} />;
          })}
        </>
      ) : (
        <World s={s} cam={cam} prev={prev} />
      )}
      <Wipe s={s} />
    </svg>
  );
};
