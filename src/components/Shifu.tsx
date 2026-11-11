import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { hasStaticFile } from "../lib/assets";
import { COLORS, SHIFU } from "../lib/brand";
import { breathe, drift, EASE, prog, springAt, SPRING } from "../lib/motion";

// Placeholder until the real cut-out photo arrives: an ink-robed figure
// holding a folded fan. Drawn standing on (0, 0), about 1000 px tall.
const RobedFigure: React.FC<{ fan: number }> = ({ fan }) => (
  <g>
    <path
      d="M -230 0 C -220 -320, -170 -560, -120 -640 L 120 -640 C 170 -560, 220 -320, 230 0 Z"
      fill={COLORS.ink}
    />
    <path
      d="M -120 -640 C -60 -600, 60 -600, 120 -640 L 70 -520 C 30 -500, -30 -500, -70 -520 Z"
      fill={COLORS.inkSoft}
    />
    {/* Red pattern on the robe, like the photo's shirt. */}
    {[
      [-120, -420],
      [90, -360],
      [-60, -220],
      [130, -150],
      [-150, -90],
      [20, -470],
    ].map(([x, y], i) => (
      <path
        key={i}
        d="M0 0 C 18 -22, 44 -8, 30 12 C 20 26, -6 22, 0 0 Z"
        transform={`translate(${x} ${y}) rotate(${i * 50}) scale(1.8)`}
        fill={COLORS.seal}
        opacity={0.75}
      />
    ))}
    {/* Gold collar trim and frog buttons. */}
    <path
      d="M -70 -620 L 0 -540 L 70 -620"
      stroke={COLORS.gold}
      strokeWidth={10}
      fill="none"
      strokeLinecap="round"
    />
    {[0, 1, 2, 3].map((i) => (
      <rect
        key={i}
        x={-26}
        y={-500 + i * 70}
        width={52}
        height={10}
        rx={5}
        fill={COLORS.gold}
      />
    ))}
    {/* Neck and head. */}
    <rect x={-40} y={-720} width={80} height={90} rx={30} fill={COLORS.ink} />
    <ellipse cx={0} cy={-800} rx={92} ry={108} fill={COLORS.ink} />
    {/* Gold rim light on the silhouette's right edge. */}
    <path
      d="M 60 -890 C 100 -860, 104 -760, 70 -705"
      stroke={COLORS.goldLight}
      strokeWidth={8}
      fill="none"
      strokeLinecap="round"
      opacity={0.85}
    />
    <path
      d="M 125 -630 C 175 -540, 215 -320, 226 -40"
      stroke={COLORS.gold}
      strokeWidth={7}
      fill="none"
      strokeLinecap="round"
      opacity={0.7}
    />
    {/* Arms gathered in front holding the fan. */}
    <path
      d="M -200 -430 C -120 -330, -40 -300, 40 -320 L 60 -270 C -30 -230, -140 -260, -230 -350 Z"
      fill={COLORS.inkSoft}
    />
    <g transform={`translate(30 -300) rotate(${-20 + fan * 8})`}>
      <path
        d="M 0 0 L -70 -230 C -20 -260, 40 -260, 80 -230 Z"
        fill="#3A322B"
      />
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={i}
          x1={0}
          y1={0}
          x2={-70 + i * 18.75}
          y2={-232 - Math.sin((i / 8) * Math.PI) * 26}
          stroke={COLORS.ink}
          strokeWidth={3}
        />
      ))}
      <path d="M 0 0 L 6 70" stroke={COLORS.seal} strokeWidth={6} />
      <path d="M -10 70 L 22 70 L 14 120 L -2 120 Z" fill={COLORS.seal} />
    </g>
  </g>
);

// Shifu Po: the real cut-out photo when public/assets/shifu/shifu.png exists,
// otherwise the placeholder. Slides in on `enter`, then breathes.
export const Shifu: React.FC<{
  enter: number;
  exit?: number;
  x: number;
  baseY: number;
  height?: number;
}> = ({ enter, exit = Infinity, x, baseY, height = SHIFU.height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = springAt(frame, enter, fps, SPRING.soft);
  const out = prog(frame, exit, exit + 12, EASE.in);
  if (frame < enter) {
    return null;
  }
  const slide = (1 - t) * 260 + out * 260;
  const s = breathe(frame, fps, 0.008);
  const sway = drift("shifu", frame, 0.01) * 1.2;
  const photo = hasStaticFile(SHIFU.photo);
  return (
    <div
      style={{
        position: "absolute",
        left: x - height * 0.42,
        top: baseY - height,
        width: height * 0.84,
        height,
        transform: `translate(${slide}px, 0) rotate(${sway}deg) scale(${s})`,
        transformOrigin: "50% 100%",
        opacity: Math.min(1, t * 1.6) * (1 - out),
        filter: "drop-shadow(0 30px 40px rgba(18,16,14,0.28))",
      }}
    >
      {photo ? (
        <Img
          src={staticFile(SHIFU.photo)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "50% 100%",
          }}
        />
      ) : (
        <svg
          viewBox="-260 -960 520 960"
          style={{ width: "100%", height: "100%" }}
        >
          <RobedFigure fan={Math.sin(frame / 22)} />
        </svg>
      )}
    </div>
  );
};
