// The 12 shio as cute paper characters (sp07 parade). Chibi build: big round
// head, small body, one signature feature per animal (horns, long ears,
// comb, mane...), a blinking face, a paper cut-out edge and soft shadow.
// Drawn with the feet at (0, 0) so a hop is just a y offset.

import { Face, usePaperFilter, type Mood } from "../core/paper/paper";
import { BUDDY, BUDDY_COLORS, PARADE_COLORS } from "../products/shifupo/parade";
import type { ShioSign } from "../schema";

const H = BUDDY.head;
const B = BUDDY.body;
// Head center, relative to the feet.
const HY = -(B * 1.7 + H * 0.82);

type Parts = { back: React.ReactNode; front: React.ReactNode };

const features = (sign: ShioSign): Parts => {
  const c = BUDDY_COLORS[sign];
  switch (sign) {
    case "rat":
      return {
        back: [-1, 1].map((k) => (
          <g key={k}>
            <circle cx={k * H * 0.78} cy={-H * 0.72} r={H * 0.46} fill={c.body} />
            <circle cx={k * H * 0.78} cy={-H * 0.72} r={H * 0.28} fill={c.accent} />
          </g>
        )),
        front: (
          <g>
            <circle cx={0} cy={H * 0.36} r={H * 0.11} fill={c.accent} />
            {[-1, 1].map((k) => (
              <g key={k} stroke={c.detail} strokeWidth={2.4} strokeLinecap="round">
                <line x1={k * H * 0.2} y1={H * 0.4} x2={k * H * 0.7} y2={H * 0.3} />
                <line x1={k * H * 0.2} y1={H * 0.46} x2={k * H * 0.7} y2={H * 0.52} />
              </g>
            ))}
          </g>
        ),
      };
    case "ox":
      return {
        back: (
          <g>
            {[-1, 1].map((k) => (
              <path key={`h${k}`} d={`M${k * H * 0.55} ${-H * 0.62} q${k * H * 0.55} ${-H * 0.1} ${k * H * 0.62} ${-H * 0.62} q${-k * H * 0.12} ${H * 0.42} ${-k * H * 0.42} ${H * 0.5} z`} fill={c.accent} />
            ))}
            {[-1, 1].map((k) => (
              <ellipse key={`e${k}`} cx={k * H * 1.02} cy={-H * 0.1} rx={H * 0.3} ry={H * 0.16} fill={c.body} transform={`rotate(${k * 18} ${k * H * 1.02} ${-H * 0.1})`} />
            ))}
          </g>
        ),
        front: (
          <g>
            <ellipse cx={0} cy={H * 0.5} rx={H * 0.58} ry={H * 0.34} fill={c.belly} />
            <circle cx={-H * 0.2} cy={H * 0.5} r={H * 0.07} fill={c.detail} />
            <circle cx={H * 0.2} cy={H * 0.5} r={H * 0.07} fill={c.detail} />
          </g>
        ),
      };
    case "tiger":
      return {
        back: [-1, 1].map((k) => (
          <g key={k}>
            <circle cx={k * H * 0.7} cy={-H * 0.74} r={H * 0.32} fill={c.body} />
            <circle cx={k * H * 0.7} cy={-H * 0.74} r={H * 0.17} fill={c.belly} />
          </g>
        )),
        front: (
          <g>
            {[-0.32, 0, 0.32].map((dx, i) => (
              <path key={i} d={`M${dx * H} ${-H * 0.92} l${dx * H * 0.2} ${H * 0.3}`} stroke={c.detail} strokeWidth={H * 0.11} strokeLinecap="round" />
            ))}
            {[-1, 1].map((k) => (
              <path key={k} d={`M${k * H * 0.98} ${-H * 0.05} l${-k * H * 0.28} ${H * 0.05} M${k * H * 0.96} ${H * 0.18} l${-k * H * 0.26} ${-H * 0.02}`} stroke={c.detail} strokeWidth={H * 0.08} strokeLinecap="round" />
            ))}
            <ellipse cx={0} cy={H * 0.5} rx={H * 0.42} ry={H * 0.28} fill={c.belly} />
            <path d={`M${-H * 0.1} ${H * 0.36} h${H * 0.2} l${-H * 0.1} ${H * 0.1} z`} fill={c.detail} />
          </g>
        ),
      };
    case "rabbit":
      return {
        back: [-1, 1].map((k) => (
          <g key={k} transform={`rotate(${k * 8} ${k * H * 0.32} ${-H * 0.8})`}>
            <ellipse cx={k * H * 0.32} cy={-H * 1.38} rx={H * 0.24} ry={H * 0.66} fill={c.body} />
            <ellipse cx={k * H * 0.32} cy={-H * 1.34} rx={H * 0.12} ry={H * 0.48} fill={c.accent} />
          </g>
        )),
        front: <ellipse cx={0} cy={H * 0.36} rx={H * 0.1} ry={H * 0.07} fill={c.accent} />,
      };
    case "dragon":
      return {
        back: (
          <g>
            {[-1, 1].map((k) => (
              <path key={k} d={`M${k * H * 0.38} ${-H * 0.82} l${k * H * 0.14} ${-H * 0.5} l${k * H * 0.16} ${H * 0.16} M${k * H * 0.48} ${-H * 1.12} l${k * H * 0.22} ${-H * 0.1}`} stroke={c.accent} strokeWidth={H * 0.13} strokeLinecap="round" fill="none" />
            ))}
            {[-0.2, 0.2].map((dx, i) => (
              <path key={`s${i}`} d={`M${dx * H - H * 0.12} ${-H * 0.95} l${H * 0.12} ${-H * 0.26} l${H * 0.12} ${H * 0.26} z`} fill={c.detail} />
            ))}
          </g>
        ),
        front: (
          <g>
            <ellipse cx={0} cy={H * 0.5} rx={H * 0.5} ry={H * 0.3} fill={c.belly} />
            <circle cx={-H * 0.16} cy={H * 0.45} r={H * 0.06} fill={c.detail} />
            <circle cx={H * 0.16} cy={H * 0.45} r={H * 0.06} fill={c.detail} />
            {[-1, 1].map((k) => (
              <path key={k} d={`M${k * H * 0.45} ${H * 0.5} q${k * H * 0.45} ${-H * 0.1} ${k * H * 0.55} ${H * 0.32} q${k * H * 0.05} ${H * 0.2} ${-k * H * 0.12} ${H * 0.22}`} stroke={c.accent} strokeWidth={4} fill="none" strokeLinecap="round" />
            ))}
          </g>
        ),
      };
    case "snake":
      return {
        back: null,
        front: (
          <g>
            {[-0.35, 0, 0.35].map((dx, i) => (
              <path key={i} d={`M${dx * H} ${-H * 0.95} l${H * 0.1} ${H * 0.12} l${-H * 0.1} ${H * 0.12} l${-H * 0.1} ${-H * 0.12} z`} fill={c.detail} />
            ))}
            <path d={`M0 ${H * 0.62} v${H * 0.22} m0 0 l${-H * 0.09} ${H * 0.1} m${H * 0.09} ${-H * 0.1} l${H * 0.09} ${H * 0.1}`} stroke={c.accent} strokeWidth={4} strokeLinecap="round" fill="none" />
          </g>
        ),
      };
    case "horse":
      return {
        back: [-1, 1].map((k) => (
          <path key={k} d={`M${k * H * 0.28} ${-H * 0.82} l${k * H * 0.16} ${-H * 0.42} l${k * H * 0.22} ${H * 0.38} z`} fill={c.body} />
        )),
        front: (
          <g>
            <path d={`M${-H * 0.4} ${-H * 0.86} q${H * 0.2} ${-H * 0.32} ${H * 0.56} ${-H * 0.12} q${-H * 0.06} ${H * 0.24} ${-H * 0.3} ${H * 0.3} q${-H * 0.2} ${-H * 0.02} ${-H * 0.26} ${-H * 0.18} z`} fill={c.accent} />
            <ellipse cx={0} cy={H * 0.52} rx={H * 0.46} ry={H * 0.34} fill={c.belly} />
            <circle cx={-H * 0.16} cy={H * 0.56} r={H * 0.06} fill={c.detail} />
            <circle cx={H * 0.16} cy={H * 0.56} r={H * 0.06} fill={c.detail} />
          </g>
        ),
      };
    case "goat":
      return {
        back: (
          <g>
            {[-1, 1].map((k) => (
              <path key={k} d={`M${k * H * 0.42} ${-H * 0.8} c${k * H * 0.5} ${-H * 0.5} ${k * H * 0.95} ${-H * 0.05} ${k * H * 0.62} ${H * 0.32} c${-k * H * 0.2} ${H * 0.2} ${-k * H * 0.38} ${-H * 0.08} ${-k * H * 0.18} ${-H * 0.2}`} stroke={c.accent} strokeWidth={H * 0.16} fill="none" strokeLinecap="round" />
            ))}
            {[-1, 1].map((k) => (
              <ellipse key={`e${k}`} cx={k * H * 1.0} cy={-H * 0.05} rx={H * 0.28} ry={H * 0.13} fill={c.detail} transform={`rotate(${k * 14} ${k * H} ${-H * 0.05})`} />
            ))}
          </g>
        ),
        front: <path d={`M${-H * 0.12} ${H * 0.86} l${H * 0.12} ${H * 0.34} l${H * 0.12} ${-H * 0.34} z`} fill={c.detail} />,
      };
    case "monkey":
      return {
        back: [-1, 1].map((k) => (
          <g key={k}>
            <circle cx={k * H * 1.0} cy={-H * 0.02} r={H * 0.32} fill={c.body} />
            <circle cx={k * H * 1.0} cy={-H * 0.02} r={H * 0.18} fill={c.accent} />
          </g>
        )),
        front: (
          <g>
            <circle cx={-H * 0.3} cy={-H * 0.05} r={H * 0.38} fill={c.belly} opacity={0.95} />
            <circle cx={H * 0.3} cy={-H * 0.05} r={H * 0.38} fill={c.belly} opacity={0.95} />
            <ellipse cx={0} cy={H * 0.4} rx={H * 0.55} ry={H * 0.42} fill={c.belly} />
          </g>
        ),
      };
    case "rooster":
      return {
        back: [-0.28, 0, 0.28].map((dx, i) => <circle key={i} cx={dx * H} cy={-H * (0.98 + (i === 1 ? 0.12 : 0))} r={H * 0.22} fill={c.accent} />),
        front: (
          <g>
            <path d={`M${-H * 0.16} ${H * 0.28} l${H * 0.16} ${H * 0.24} l${H * 0.16} ${-H * 0.24} z`} fill={c.detail} />
            <ellipse cx={0} cy={H * 0.66} rx={H * 0.1} ry={H * 0.16} fill={c.accent} />
          </g>
        ),
      };
    case "dog":
      return {
        back: null,
        front: (
          <g>
            {[-1, 1].map((k) => (
              <ellipse key={k} cx={k * H * 0.88} cy={-H * 0.05} rx={H * 0.24} ry={H * 0.48} fill={c.accent} transform={`rotate(${k * 18} ${k * H * 0.88} ${-H * 0.4})`} />
            ))}
            <ellipse cx={0} cy={H * 0.48} rx={H * 0.46} ry={H * 0.3} fill={c.belly} />
            <ellipse cx={0} cy={H * 0.36} rx={H * 0.13} ry={H * 0.09} fill={c.detail} />
          </g>
        ),
      };
    case "pig":
      return {
        back: [-1, 1].map((k) => <path key={k} d={`M${k * H * 0.38} ${-H * 0.8} l${k * H * 0.4} ${-H * 0.22} l${-k * H * 0.04} ${H * 0.44} z`} fill={c.accent} />),
        front: (
          <g>
            <ellipse cx={0} cy={H * 0.42} rx={H * 0.32} ry={H * 0.22} fill={c.accent} />
            <ellipse cx={-H * 0.1} cy={H * 0.42} rx={H * 0.05} ry={H * 0.08} fill={c.detail} />
            <ellipse cx={H * 0.1} cy={H * 0.42} rx={H * 0.05} ry={H * 0.08} fill={c.detail} />
          </g>
        ),
      };
  }
};

export const ShioBuddy: React.FC<{
  sign: ShioSign;
  x: number;
  y: number;
  scale: number;
  squash?: [number, number];
  tilt?: number;
  mood?: Mood;
  wave?: number; // 0..1 raises the right arm
  opacity?: number;
  blinkOffset?: number;
}> = ({ sign, x, y, scale, squash = [1, 1], tilt = 0, mood = "happy", wave = 0, opacity = 1, blinkOffset = 0 }) => {
  const filter = usePaperFilter();
  const c = BUDDY_COLORS[sign];
  const f = features(sign);
  const arm = (k: number) => {
    const up = k > 0 ? wave : 0;
    const ang = k * (40 + up * 110);
    return (
      <ellipse
        key={`arm${k}`}
        cx={k * B * 0.9}
        cy={-B * 1.15}
        rx={B * 0.24}
        ry={B * 0.42}
        fill={c.body}
        transform={`rotate(${ang} ${k * B * 0.7} ${-B * 1.45})`}
      />
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * squash[0]} ${scale * squash[1]}) rotate(${tilt})`} opacity={opacity} filter={filter}>
      {/* Feet and body. */}
      <ellipse cx={-B * 0.42} cy={-B * 0.12} rx={B * 0.32} ry={B * 0.18} fill={c.detail} />
      <ellipse cx={B * 0.42} cy={-B * 0.12} rx={B * 0.32} ry={B * 0.18} fill={c.detail} />
      {arm(-1)}
      {arm(1)}
      <ellipse cx={0} cy={-B * 0.95} rx={B * 0.92} ry={B * 0.9} fill={c.body} />
      <ellipse cx={0} cy={-B * 0.82} rx={B * 0.56} ry={B * 0.6} fill={c.belly} />
      {/* Head with its features. */}
      <g transform={`translate(0 ${HY})`}>
        {f.back}
        <ellipse cx={0} cy={0} rx={H * (sign === "snake" ? 0.92 : 1)} ry={H * (sign === "horse" ? 1.04 : 0.94)} fill={c.body} />
        {f.front}
        <Face x={0} y={-H * 0.1} size={BUDDY.faceSize} mood={mood} blinkOffset={blinkOffset} blinkEvery={BUDDY.blinkEvery} colors={PARADE_COLORS.face} />
      </g>
    </g>
  );
};

// Height of a buddy (feet to head top) at scale 1, for placing stamps above.
export const BUDDY_HEIGHT = -HY + H;
