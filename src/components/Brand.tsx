import { useCurrentFrame, useVideoConfig } from "remotion";
import { BUTTON, COLORS, FONTS, LOGO, TYPE, VIDEO } from "../lib/brand";
import { EASE, prog, springAt, SPRING } from "../lib/motion";
import { GoldDefs } from "./Fx";

// Logo plate: a gold seal ring drawn around the 風 glyph, then the wordmark.
export const LogoPlate: React.FC<{
  start: number;
  glyph: string;
  name: string;
  descriptor: string;
}> = ({ start, glyph, name, descriptor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = LOGO.sealRadius;
  const ring = prog(frame, start, start + 18, EASE.inOut);
  const glyphIn = springAt(frame, start + 8, fps, SPRING.pop);
  const words = prog(frame, start + 14, start + 30, EASE.out);
  const circumference = 2 * Math.PI * r;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
      }}
    >
      <svg
        width={r * 2 + 40}
        height={r * 2 + 40}
        viewBox={`${-r - 20} ${-r - 20} ${r * 2 + 40} ${r * 2 + 40}`}
        style={{ overflow: "visible" }}
      >
        <GoldDefs id="logo" />
        <circle r={r + 6} fill={COLORS.paper} opacity={ring} />
        <circle
          r={r}
          fill="none"
          stroke="url(#logo-gold)"
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ring)}
          transform="rotate(-90)"
        />
        <circle
          r={r - 16}
          fill="none"
          stroke={COLORS.goldDeep}
          strokeWidth={2}
          opacity={ring * 0.7}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONTS.han}
          fontWeight={900}
          fontSize={TYPE.logoGlyph}
          fill={COLORS.ink}
          opacity={Math.min(1, glyphIn * 2)}
          transform={`scale(${0.6 + glyphIn * 0.4})`}
        >
          {glyph}
        </text>
      </svg>
      <div
        style={{
          textAlign: "center",
          opacity: words,
          transform: `translateY(${(1 - words) * 20}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: TYPE.logoName,
            letterSpacing: "0.08em",
            color: COLORS.ink,
            lineHeight: 1,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: FONTS.body,
            fontWeight: 800,
            fontSize: TYPE.logoSub,
            letterSpacing: "0.42em",
            color: COLORS.goldDeep,
            marginTop: 10,
          }}
        >
          {descriptor}
        </div>
      </div>
    </div>
  );
};

// Red lattice corners drawn into the four corners of the frame.
export const CornerFrames: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const t = prog(frame, start, start + 20, EASE.out);
  const m = 46;
  const L = 150 * t;
  const corner = (
    x: number,
    y: number,
    sx: number,
    sy: number,
    key: string,
  ) => (
    <g key={key} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <path
        d={`M 0 ${L} L 0 0 L ${L} 0`}
        stroke={COLORS.seal}
        strokeWidth={10}
        fill="none"
      />
      <path
        d={`M 22 ${L * 0.6} L 22 22 L ${L * 0.6} 22`}
        stroke={COLORS.seal}
        strokeWidth={5}
        fill="none"
      />
      <rect x={34} y={34} width={18 * t} height={18 * t} fill={COLORS.seal} />
    </g>
  );
  return (
    <svg
      width={VIDEO.width}
      height={VIDEO.height}
      style={{ position: "absolute", inset: 0 }}
    >
      {corner(m, m, 1, 1, "tl")}
      {corner(VIDEO.width - m, m, -1, 1, "tr")}
      {corner(m, VIDEO.height - m, 1, -1, "bl")}
      {corner(VIDEO.width - m, VIDEO.height - m, -1, -1, "br")}
    </svg>
  );
};

// Generic chat bubble with a phone handset (not a trademark logo).
const ChatIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path
      d="M32 4 C 16 4, 4 15, 4 29 C 4 35, 6 40, 10 44 L 6 60 L 22 54 C 25 55, 28 56, 32 56 C 48 56, 60 44, 60 30 C 60 15, 48 4, 32 4 Z"
      fill={COLORS.ink}
    />
    <path
      d="M 24 18 C 22 18, 20 21, 21 25 C 23 33, 30 41, 39 43 C 42 44, 45 42, 45 40 L 45 36 L 39 33 L 36 36 C 32 34, 29 31, 27 27 L 30 24 L 27 18 Z"
      fill={COLORS.goldLight}
    />
  </svg>
);

// Gold pill button that pops in on its cue, with a shine sweeping across.
export const WhatsAppButton: React.FC<{ text: string; cue: number }> = ({
  text,
  cue,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = cue - 3;
  if (frame < start) {
    return null;
  }
  const pop = springAt(frame, start, fps, SPRING.pop);
  const shine = ((frame - start - 10) % 60) / 60;
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 20,
        height: BUTTON.height,
        padding: `0 ${BUTTON.paddingX}px`,
        borderRadius: BUTTON.radius,
        background: `linear-gradient(135deg, ${COLORS.goldLight} 0%, ${COLORS.gold} 48%, ${COLORS.goldDeep} 100%)`,
        boxShadow:
          "0 18px 40px rgba(156,122,53,0.35), inset 0 2px 0 rgba(255,255,255,0.5)",
        transform: `scale(${0.6 + pop * 0.4})`,
        opacity: Math.min(1, pop * 2),
        overflow: "hidden",
      }}
    >
      <ChatIcon size={BUTTON.iconSize} />
      <span
        style={{
          fontFamily: FONTS.body,
          fontWeight: 800,
          fontSize: TYPE.button,
          color: COLORS.ink,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 90,
          left: `${-20 + shine * 140}%`,
          background:
            "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0) 100%)",
          transform: "skewX(-20deg)",
          opacity: frame - start > 10 ? 1 : 0,
        }}
      />
    </div>
  );
};
