// Paper cut-out characters of the 2D ruko world (sp10): a rigged chibi
// person (hips, shoulders and neck are pivots; bow, arms, walk, nod, squash),
// Cai Shen and the little black tiger. Drawn with the feet at (0, 0) in a
// 400-unit design space and scaled to their height; `dir` mirrors them
// (1 = facing right). Faces come from the shared paper core and blink.

import { Face, usePaperFilter, type Mood } from "../../../core/paper/paper";
import { C2 } from "./ruko2dConfig";

const FACE = { eye: C2.ink, shine: C2.shine, blush: C2.blush };
const D = 400; // design height

export type Held = "none" | "incense" | "box" | "broom" | "book" | "tea" | "bag" | "bowl";
export type FolkLook = {
  shirt: string;
  pants: string;
  hair: "short" | "bun" | "grey" | "kid" | "cap";
  skin?: string;
  beard?: boolean;
  apron?: string;
};
export type FolkPose = {
  bow?: number; // 0..1, upper body leans forward from the hips
  armNear?: number; // degrees, 0 = hanging, 90 = straight forward
  armFar?: number;
  walk?: number; // phase (radians), 0 = standing
  nod?: number; // -1..1
  squash?: number; // -0.3..0.3 (+ = squashed on landing)
  held?: Held;
  glow?: number; // incense tips
  mood?: Mood;
  look?: number; // eye direction -1..1
};

const HeldProp: React.FC<{ kind: Held; glow: number }> = ({ kind, glow }) => {
  switch (kind) {
    case "incense":
      return (
        <g>
          {[-9, 0, 9].map((dx, i) => (
            <g key={i} transform={`rotate(${(i - 1) * 7})`}>
              <line x1={dx * 0.4} y1={0} x2={dx} y2={-92} stroke={C2.red} strokeWidth={5} strokeLinecap="round" />
              <circle cx={dx} cy={-94} r={9 + glow * 4} fill={C2.lanternGlow} opacity={0.35 * glow} />
              <circle cx={dx} cy={-94} r={5} fill="#FF7A2E" />
            </g>
          ))}
        </g>
      );
    case "box":
      return (
        <g transform="translate(18 -30)">
          <rect x={-42} y={-34} width={84} height={64} rx={6} fill="#C98D52" />
          <rect x={-42} y={-34} width={84} height={14} fill="#B07642" />
          <rect x={-7} y={-34} width={14} height={64} fill="#E9C27E" />
        </g>
      );
    case "broom":
      return (
        <g transform="rotate(-18)">
          <rect x={-5} y={-40} width={10} height={170} rx={5} fill={C2.wood} />
          <path d="M-30 120 L30 120 L44 175 L-44 175 Z" fill="#E8C66A" />
          {[-30, -15, 0, 15, 30].map((x) => (
            <line key={x} x1={x * 0.8} y1={125} x2={x} y2={172} stroke="#C9A042" strokeWidth={3} />
          ))}
        </g>
      );
    case "book":
      return (
        <g transform="translate(14 -10) rotate(-8)">
          <path d="M-46 -26 L0 -18 L46 -26 L46 22 L0 30 L-46 22 Z" fill="#FFF7E6" stroke={C2.woodDark} strokeWidth={4} />
          <line x1={0} y1={-18} x2={0} y2={30} stroke={C2.woodDark} strokeWidth={3} />
          {[-8, 2, 12].map((y) => (
            <g key={y} stroke="#C9B48E" strokeWidth={3}>
              <line x1={-38} y1={y - 6} x2={-8} y2={y - 2} />
              <line x1={8} y1={y - 2} x2={38} y2={y - 6} />
            </g>
          ))}
        </g>
      );
    case "tea":
      return (
        <g transform="translate(14 -14)">
          <path d="M-22 -18 L22 -18 L16 14 L-16 14 Z" fill="#FFF7E6" stroke={C2.ink} strokeWidth={3} />
          <rect x={-22} y={-24} width={44} height={8} rx={3} fill={C2.red} />
          {[-8, 6].map((x, i) => (
            <path key={x} d={`M${x} -30 q8 -12 0 -24 q-8 -12 0 -24`} stroke={C2.smoke} strokeWidth={4} fill="none" opacity={0.8} transform={`translate(0 ${-i * 4})`} />
          ))}
        </g>
      );
    case "bag":
      return (
        <g transform="translate(10 20)">
          <path d="M-14 -40 q14 -26 28 0" stroke={C2.redDeep} strokeWidth={6} fill="none" />
          <rect x={-34} y={-40} width={68} height={78} rx={6} fill={C2.red} />
          <circle cx={0} cy={0} r={16} fill={C2.gold} />
        </g>
      );
    case "bowl":
      return (
        <g transform="translate(16 -18)">
          <ellipse cx={0} cy={-12} rx={34} ry={22} fill="#FFFDF6" />
          <path d="M-40 -8 Q0 50 40 -8 Z" fill="#FFFFFF" stroke={C2.ink} strokeWidth={3} />
          <path d="M-40 -8 Q0 50 40 -8" fill="none" stroke={C2.red} strokeWidth={5} opacity={0.6} />
          {[-10, 10].map((x) => (
            <path key={x} d={`M${x} -34 q8 -12 0 -24`} stroke={C2.smoke} strokeWidth={4} fill="none" opacity={0.8} />
          ))}
        </g>
      );
    default:
      return null;
  }
};

const Hair: React.FC<{ look: FolkLook; back: boolean }> = ({ look, back }) => {
  const c = look.hair === "grey" ? C2.hairGrey : C2.hair;
  if (back) {
    return look.hair === "bun" ? <circle cx={-46} cy={-372} r={34} fill={c} /> : null;
  }
  switch (look.hair) {
    case "grey":
      return (
        <g>
          <path d="M-86 -300 q0 -60 30 -66 q-6 50 -6 74 z" fill={c} />
          <path d="M86 -300 q0 -60 -30 -66 q6 50 6 74 z" fill={c} />
          <ellipse cx={-8} cy={-382} rx={30} ry={10} fill={c} opacity={0.9} />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M-90 -320 Q-90 -400 0 -402 Q90 -400 90 -320 Z" fill={look.apron ?? C2.awnings[3]} />
          <path d="M40 -322 L128 -316 L120 -304 L40 -306 Z" fill={look.apron ?? C2.awnings[3]} />
        </g>
      );
    default:
      return (
        <g>
          <path d="M-90 -300 Q-96 -398 0 -398 Q96 -398 92 -300 Q70 -350 10 -352 Q-50 -350 -90 -300 Z" fill={c} />
          {look.hair === "kid" ? <path d="M6 -396 q18 -30 40 -24 q-22 6 -26 28 z" fill={c} /> : null}
        </g>
      );
  }
};

export const Folk: React.FC<{ x: number; y: number; h: number; dir?: 1 | -1; look: FolkLook; pose?: FolkPose; blink?: number; op?: number }> = ({
  x,
  y,
  h,
  dir = 1,
  look,
  pose = {},
  blink = 0,
  op = 1,
}) => {
  const filter = usePaperFilter();
  const s = h / D;
  const skin = look.skin ?? (look.hair === "grey" ? C2.skinOld : C2.skin);
  const walk = pose.walk ?? 0;
  const swing = walk ? Math.sin(walk) * 24 : 0;
  const bob = walk ? -Math.abs(Math.cos(walk)) * 9 : 0;
  const sq = pose.squash ?? 0;
  const bow = (pose.bow ?? 0) * 30;
  const arm = (deg: number, near: boolean) => {
    const a = deg + (walk ? (near ? -swing : swing) * 0.8 : 0);
    return (
      <g transform={`translate(${near ? 14 : -14} -198) rotate(${-a})`}>
        <rect x={-15} y={-6} width={30} height={102} rx={15} fill={near ? look.shirt : shade(look.shirt)} />
        <circle cx={0} cy={100} r={18} fill={skin} />
        {near && pose.held && pose.held !== "none" ? (
          <g transform={`translate(0 100) rotate(${a})`}>
            <HeldProp kind={pose.held} glow={pose.glow ?? 0} />
          </g>
        ) : null}
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y + bob * s}) scale(${dir * s * (1 + sq * 0.5)} ${s * (1 - sq)})`} opacity={op}>
      <ellipse cx={0} cy={4} rx={70} ry={14} fill={C2.shadow} />
      <g filter={filter}>
        {/* Legs swing from the hips. */}
        {[-1, 1].map((k) => (
          <g key={k} transform={`translate(${k * 22} -96) rotate(${k * swing})`}>
            <rect x={-17} y={0} width={34} height={92} rx={14} fill={look.pants} />
            <ellipse cx={8} cy={92} rx={27} ry={13} fill="#3B2A24" />
          </g>
        ))}
      </g>
      <g transform={`rotate(${bow} 0 -96)`}>
        <g filter={filter}>
          {arm(pose.armFar ?? 8, false)}
          <rect x={-64} y={-222} width={128} height={140} rx={44} fill={look.shirt} />
          {look.apron ? <rect x={-48} y={-178} width={96} height={96} rx={20} fill={look.apron} /> : null}
          <rect x={-60} y={-112} width={120} height={22} rx={10} fill={look.pants} />
        </g>
        <g transform={`rotate(${(pose.nod ?? 0) * 14} 0 -222)`}>
          <g filter={filter}>
            <Hair look={look} back />
            <circle cx={0} cy={-306} r={90} fill={skin} />
            <Hair look={look} back={false} />
            {look.beard ? <path d="M-24 -246 Q8 -170 40 -246 Z" fill={C2.hairGrey} /> : null}
          </g>
          <Face x={16} y={-306} size={1.8} mood={pose.mood ?? "happy"} blinkOffset={blink} look={pose.look ?? 0.4} colors={FACE} />
        </g>
        <g filter={filter}>{arm(pose.armNear ?? 8, true)}</g>
      </g>
    </g>
  );
};

const shade = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * 0.82);
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

// Cai Shen on the altar (560 units tall): robe, sleeves, official's hat with
// wings, long moustache and beard, yuanbao. `bless` raises the right sleeve,
// `lift` raises the yuanbao over his head, `op` fades him into light.
export const CaiShen2D: React.FC<{ x: number; y: number; h: number; bless?: number; lift?: number; nod?: number; op?: number; glow?: number; frame: number }> = ({
  x,
  y,
  h,
  bless = 0,
  lift = 0,
  nod = 0,
  op = 1,
  glow = 0.5,
  frame,
}) => {
  const filter = usePaperFilter();
  const s = h / 560;
  const ingotY = -318 - lift * 330;
  const shimmer = 0.5 + 0.5 * Math.sin(frame / 6);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
      <circle cx={0} cy={-380} r={230} fill={C2.goldLight} opacity={0.32 * glow + 0.1} />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d="M0 -250 L14 -330 L-14 -330 Z" fill={C2.goldLight} opacity={0.22 * glow} transform={`rotate(${i * 22.5 + frame * 0.3} 0 -380) translate(0 -40)`} />
      ))}
      <g filter={filter}>
        {/* Robe. */}
        <path d="M-80 -330 L80 -330 L150 0 L-150 0 Z" fill={C2.red} />
        <path d="M-150 0 L150 0 L140 -34 L-140 -34 Z" fill={C2.gold} />
        <rect x={-22} y={-330} width={44} height={300} fill={C2.gold} />
        <circle cx={0} cy={-170} r={28} fill={C2.gold} />
        <rect x={-10} y={-180} width={20} height={20} fill={C2.red} />
        {/* Left sleeve, holding the ingot. */}
        <path d="M-70 -320 Q-150 -250 -110 -200 L-40 -260 Z" fill={C2.redDeep} />
        {/* Right sleeve: blesses (rotates up from the shoulder). */}
        <g transform={`rotate(${-bless * 115} 70 -320)`}>
          <path d="M70 -320 Q150 -250 110 -200 L40 -260 Z" fill={C2.redDeep} />
          <circle cx={112} cy={-205} r={22} fill={C2.skin} />
        </g>
        <ellipse cx={0} cy={-258} rx={92} ry={20} fill={C2.gold} />
      </g>
      {/* Yuanbao. */}
      <g transform={`translate(0 ${ingotY})`}>
        <circle r={60} fill={C2.goldLight} opacity={0.25 + 0.35 * lift * shimmer} />
        <g filter={filter}>
          <path d="M-62 -8 Q-58 26 0 26 Q58 26 62 -8 Q30 6 0 6 Q-30 6 -62 -8 Z" fill={C2.gold} />
          <ellipse cx={0} cy={-6} rx={28} ry={22} fill={C2.goldDeep} />
          <ellipse cx={-6} cy={-12} rx={10} ry={7} fill={C2.goldLight} />
        </g>
        {lift > 0.3 ? (
          <path d="M40 -40 l6 -16 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 z" fill={C2.shine} opacity={shimmer} />
        ) : null}
      </g>
      {/* Head, hat, beard. */}
      <g transform={`rotate(${nod * 10} 0 -340)`}>
        <g filter={filter}>
          <circle cx={0} cy={-420} r={80} fill={C2.skin} />
          <path d="M-74 -452 Q-70 -540 0 -544 Q70 -540 74 -452 Z" fill="#1F1A1C" />
          <rect x={-150} y={-488} width={96} height={20} rx={10} fill="#1F1A1C" transform="rotate(-6 -100 -478)" />
          <rect x={54} y={-488} width={96} height={20} rx={10} fill="#1F1A1C" transform="rotate(6 100 -478)" />
          <rect x={-20} y={-520} width={40} height={30} rx={6} fill={C2.gold} />
          {/* Long beard in three soft locks. */}
          <path d="M-30 -374 Q-24 -318 -8 -286 Q0 -300 8 -286 Q24 -318 30 -374 Q0 -362 -30 -374 Z" fill="#3A3034" />
        </g>
        {/* Smiling face: closed happy eyes, rosy cheeks, upturned moustache. */}
        <path d="M-46 -428 q14 -16 28 0 M18 -428 q14 -16 28 0" stroke={C2.ink} strokeWidth={7} fill="none" strokeLinecap="round" />
        <circle cx={-48} cy={-398} r={13} fill={C2.blush} opacity={0.55} />
        <circle cx={48} cy={-398} r={13} fill={C2.blush} opacity={0.55} />
        <path d="M-4 -404 q-26 2 -44 -16 M4 -404 q26 2 44 -16" stroke="#1F1A1C" strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d="M-12 -390 q12 12 24 0" stroke={C2.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

// Little black tiger (guardian on the altar): sits, swishes its tail, winks.
export const Tiger2D: React.FC<{ x: number; y: number; h: number; wink: number; frame: number }> = ({ x, y, h, wink, frame }) => {
  const filter = usePaperFilter();
  const s = h / 160;
  const tail = Math.sin(frame / 9) * 18;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={60} ry={10} fill={C2.shadow} />
      <g filter={filter}>
        <path d={`M40 -20 q50 -10 ${40 + tail * 0.5} -70`} stroke="#211B1E" strokeWidth={14} fill="none" strokeLinecap="round" />
        <ellipse cx={0} cy={-40} rx={52} ry={42} fill="#211B1E" />
        <circle cx={-14} cy={-108} r={44} fill="#211B1E" />
        <path d="M-50 -132 l10 -36 l22 26 z M22 -132 l-10 -36 l-22 26 z" fill="#211B1E" />
        {[-24, -6, 12].map((dx) => (
          <path key={dx} d={`M${dx} -78 q8 22 0 40`} stroke={C2.gold} strokeWidth={6} fill="none" strokeLinecap="round" />
        ))}
        <path d="M-30 -146 q16 8 30 0" stroke={C2.gold} strokeWidth={5} fill="none" />
      </g>
      <Face x={-12} y={-106} size={0.9} mood={wink > 0.5 ? "wink" : "happy"} colors={{ eye: C2.gold, shine: C2.shine, blush: C2.blush }} />
    </g>
  );
};
