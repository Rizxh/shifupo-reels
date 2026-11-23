// Hand-drawn emphasis of the shared core (Motion Format screen language,
// docs/reverse/motionformat.md §4.2): a scribble circle drawn around the
// subject, a curved arrow with a hand-written note, a tilted stamp. Emphasis
// is always drawn by hand on the cue word, never a generic UI box. Positions
// come from the caller (for 3D worlds: anchors projected every frame, so the
// mark sticks to the object while the camera moves). Colors and fonts come
// from the product.

import { random } from "remotion";
import { backOut, powIn, powOut, track } from "../motion/tracks";
import { squashOnImpact } from "../motion/acting";

export type MarkStyle = {
  color: string; // scribble / arrow stroke
  halo: string; // soft outline under strokes so they read on any background
  noteColor: string; // hand-written note
  stampColor: string;
  stroke: number;
  noteFont: string;
  noteSize: number;
  stampFont: string;
  stampSize: number;
  drawFrames: number;
  fadeFrames: number;
};

type Common = { frame: number; cue: number; out: number; style: MarkStyle };

const drawn = (frame: number, cue: number, len: number) => powOut(3)((frame - cue) / len);
const fade = (frame: number, out: number, len: number) => 1 - Math.min(1, Math.max(0, (frame - (out - len)) / len));

// Scribble circle: ~1.2 turns of a wobbly ellipse, like a marker pen.
const scribblePath = (cx: number, cy: number, rx: number, ry: number, seed: string): string => {
  const turns = 1.18;
  const steps = 64;
  const tilt = (random(`${seed}-tilt`) - 0.5) * 0.5;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = -Math.PI * 0.7 + t * Math.PI * 2 * turns;
    const wob = 1 + (random(`${seed}-${Math.floor(i / 6)}`) - 0.5) * 0.07 + t * 0.06;
    const x = Math.cos(a) * rx * wob;
    const y = Math.sin(a) * ry * wob;
    pts.push(`${i === 0 ? "M" : "L"}${(cx + x * Math.cos(tilt) - y * Math.sin(tilt)).toFixed(1)} ${(cy + x * Math.sin(tilt) + y * Math.cos(tilt)).toFixed(1)}`);
  }
  return pts.join(" ");
};

export const ScribbleCircle: React.FC<Common & { x: number; y: number; rx: number; ry: number; seed: string }> = ({
  frame,
  cue,
  out,
  style,
  x,
  y,
  rx,
  ry,
  seed,
}) => {
  if (frame < cue || frame >= out) {
    return null;
  }
  const p = drawn(frame, cue, style.drawFrames);
  const d = scribblePath(x, y, rx, ry, seed);
  return (
    <g opacity={fade(frame, out, style.fadeFrames)} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} stroke={style.halo} strokeWidth={style.stroke * 2.6} />
      <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} stroke={style.color} strokeWidth={style.stroke} />
    </g>
  );
};

// Curved arrow from a hand-written note to a target point.
export const NoteArrow: React.FC<
  Common & { from: { x: number; y: number }; to: { x: number; y: number }; text?: string; bend?: number }
> = ({ frame, cue, out, style, from, to, text, bend = 0.28 }) => {
  if (frame < cue || frame >= out) {
    return null;
  }
  const p = drawn(frame, cue + 4, style.drawFrames);
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  // Arrow head direction = tangent at the end of the quadratic curve.
  const ang = Math.atan2(to.y - cy, to.x - cx);
  const head = style.stroke * 5;
  const headP = Math.max(0, (p - 0.85) / 0.15);
  const op = fade(frame, out, style.fadeFrames);
  const noteIn = powOut(2)((frame - cue) / 8);
  return (
    <g opacity={op}>
      <path
        d={`M${from.x} ${from.y} Q${cx} ${cy} ${to.x} ${to.y}`}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
        fill="none"
        stroke={style.halo}
        strokeWidth={style.stroke * 2.6}
        strokeLinecap="round"
      />
      <path
        d={`M${from.x} ${from.y} Q${cx} ${cy} ${to.x} ${to.y}`}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
        fill="none"
        stroke={style.color}
        strokeWidth={style.stroke}
        strokeLinecap="round"
      />
      {headP > 0
        ? [-1, 1].map((s) => (
            <line
              key={s}
              x1={to.x}
              y1={to.y}
              x2={to.x - Math.cos(ang + s * 0.5) * head * headP}
              y2={to.y - Math.sin(ang + s * 0.5) * head * headP}
              stroke={style.color}
              strokeWidth={style.stroke}
              strokeLinecap="round"
            />
          ))
        : null}
      {text ? (
        <text
          x={from.x}
          y={from.y - style.noteSize * 0.35 + (1 - noteIn) * 24}
          textAnchor="middle"
          fontFamily={style.noteFont}
          fontWeight={700}
          fontSize={style.noteSize}
          fill={style.noteColor}
          opacity={noteIn}
          transform={`rotate(-6 ${from.x} ${from.y})`}
          style={{ paintOrder: "stroke", stroke: "rgba(10,7,5,0.8)", strokeWidth: 12 }}
        >
          {text}
        </text>
      ) : null}
    </g>
  );
};

// Tilted rubber stamp that slams down (overshoot, squash on impact).
export const Stamp: React.FC<Common & { x: number; y: number; text: string; angle?: number; maxWidth?: number }> = ({
  frame,
  cue,
  out,
  style,
  x,
  y,
  text,
  angle = -12,
  maxWidth = Infinity,
}) => {
  if (frame < cue || frame >= out) {
    return null;
  }
  const land = cue + 6;
  const s = track(frame, [
    [cue, 2.4],
    [land, 1, powIn(3)],
    [land + 5, 1.06, backOut(2)],
    [land + 10, 1],
  ]);
  const [sqx, sqy] = frame >= land ? squashOnImpact(frame - land, 0.6, 10) : [1, 1];
  const op = Math.min(1, (frame - cue) / 3) * fade(frame, out, style.fadeFrames);
  const w = text.length * style.stampSize * 0.78 + style.stampSize * 1.2;
  const h = style.stampSize * 1.55;
  // Long words shrink to fit (a 13-letter stamp ran off the frame in sp07).
  const fit = Math.min(1, maxWidth / w);
  return (
    <g opacity={op} transform={`translate(${x} ${y}) rotate(${angle}) scale(${s * sqx * fit} ${s * sqy * fit})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill="none" stroke={style.stampColor} strokeWidth={style.stroke * 1.4} />
      <rect
        x={-w / 2 + 12}
        y={-h / 2 + 12}
        width={w - 24}
        height={h - 24}
        rx={6}
        fill="none"
        stroke={style.stampColor}
        strokeWidth={style.stroke * 0.6}
      />
      <text
        x={0}
        y={style.stampSize * 0.36}
        textAnchor="middle"
        fontFamily={style.stampFont}
        fontWeight={900}
        fontSize={style.stampSize}
        letterSpacing={style.stampSize * 0.08}
        fill={style.stampColor}
      >
        {text}
      </text>
    </g>
  );
};
