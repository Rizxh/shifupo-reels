import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CAPTION,
  COLORS,
  FONTS,
  HEADLINE,
  SAFE_AREA,
  TYPE,
} from "../lib/brand";
import { EASE, prog, springAt, SPRING } from "../lib/motion";
import {
  highlightMask,
  normalizeWord,
  paginateWords,
  splitWords,
  type WordTiming,
} from "../lib/text";

// A headline line: letters rise out of a blur one after another (anime title
// style), the accent word turns gold with a brush stroke drawn under it.
// "slam" lands the whole line from large scale for emphasis.
export const HeadlineLine: React.FC<{
  text: string;
  cue: number;
  out: number;
  size?: number;
  accent?: string;
  variant?: "rise" | "slam";
  color?: string;
}> = ({
  text,
  cue,
  out,
  size = TYPE.headline,
  accent,
  variant = "rise",
  color = COLORS.ink,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = cue - HEADLINE.leadFrames;
  if (frame < start || frame >= out) {
    return null;
  }
  const exit = prog(frame, out - HEADLINE.exitFrames, out, EASE.in);
  const slam =
    variant === "slam" ? springAt(frame, start, fps, SPRING.snap) : 1;
  const scale = variant === "slam" ? interpolate(slam, [0, 1], [1.45, 1]) : 1;
  const accentNorm = accent ? normalizeWord(accent) : null;
  let letterIndex = 0;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: "0.28em",
        fontFamily: FONTS.display,
        fontWeight: 900,
        fontSize: size,
        lineHeight: HEADLINE.lineHeight,
        letterSpacing: HEADLINE.letterSpacing,
        color,
        textShadow: HEADLINE.shadow,
        transform: `scale(${scale}) translateY(${-exit * 30}px)`,
        transformOrigin: "0% 50%",
        opacity: (variant === "slam" ? Math.min(1, slam * 3) : 1) * (1 - exit),
      }}
    >
      {splitWords(text).map((word, w) => {
        const isAccent =
          accentNorm !== null && normalizeWord(word) === accentNorm;
        const wordStart = start + letterIndex;
        return (
          <span
            key={w}
            style={{
              position: "relative",
              display: "inline-flex",
              whiteSpace: "nowrap",
            }}
          >
            {[...word].map((ch, c) => {
              const t = prog(
                frame,
                start + letterIndex,
                start + letterIndex + HEADLINE.enterFrames,
                EASE.overshoot,
              );
              letterIndex += 1;
              return (
                <span
                  key={c}
                  style={{
                    display: "inline-block",
                    color: isAccent ? COLORS.goldDeep : undefined,
                    transform:
                      variant === "rise"
                        ? `translateY(${(1 - t) * 0.5}em)`
                        : undefined,
                    opacity: variant === "rise" ? Math.min(1, t * 1.6) : 1,
                    filter:
                      variant === "rise" && t < 1
                        ? `blur(${(1 - Math.min(1, t)) * 8}px)`
                        : undefined,
                  }}
                >
                  {ch}
                </span>
              );
            })}
            {isAccent ? (
              <BrushUnderline start={wordStart + HEADLINE.enterFrames} />
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

// A tapered brush stroke drawn left to right under a word.
const BrushUnderline: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const t = prog(frame, start, start + 12, EASE.out);
  return (
    <svg
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: "-2%",
        bottom: "-0.06em",
        width: "104%",
        height: "0.16em",
        overflow: "visible",
      }}
    >
      <defs>
        <clipPath id={`brush-${start}`}>
          <rect x="0" y="-10" width={400 * t} height="60" />
        </clipPath>
      </defs>
      <path
        d="M4 26 C 60 12, 160 8, 250 12 C 320 15, 370 20, 396 14 C 380 30, 300 32, 220 30 C 140 29, 60 34, 4 26 Z"
        fill={COLORS.seal}
        clipPath={`url(#brush-${start})`}
        opacity={0.92}
      />
    </svg>
  );
};

// Stack of headline lines in the top text column of the safe area.
export const HeadlineStack: React.FC<{
  children: React.ReactNode;
  top?: number;
  align?: "left" | "center";
}> = ({ children, top = HEADLINE.top, align = "left" }) => (
  <div
    style={{
      position: "absolute",
      left: SAFE_AREA.x,
      top,
      width: SAFE_AREA.width,
      display: "flex",
      flexDirection: "column",
      alignItems: align === "center" ? "center" : "flex-start",
      textAlign: align,
      gap: HEADLINE.gap,
    }}
  >
    {children}
  </div>
);

// Small spaced caps label (kicker) that fades and slides in.
export const Kicker: React.FC<{
  text: string;
  start: number;
  out: number;
  color?: string;
}> = ({ text, start, out, color = COLORS.goldDeep }) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= out) {
    return null;
  }
  const t = prog(frame, start, start + 12);
  const exit = prog(frame, out - HEADLINE.exitFrames, out, EASE.in);
  return (
    <div
      style={{
        fontFamily: FONTS.body,
        fontWeight: 800,
        fontSize: TYPE.kicker,
        letterSpacing: "0.32em",
        color,
        opacity: t * (1 - exit),
        transform: `translateX(${(1 - t) * -24}px)`,
      }}
    >
      {text}
    </div>
  );
};

// Word-by-word caption of the voice over on solid ink boxes; keywords gold.
export const Caption: React.FC<{
  words: WordTiming[];
  highlight: string[];
}> = ({ words, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let active = -1;
  words.forEach((w, i) => {
    if (w.startFrame <= frame) {
      active = i;
    }
  });
  if (active < 0) {
    return null;
  }
  const texts = words.map((w) => w.text);
  const mask = highlightMask(texts, highlight);
  const page =
    paginateWords(texts, CAPTION.maxWordsPerPage).find((p) =>
      p.includes(active),
    ) ?? [];
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x,
        top: CAPTION.y,
        width: SAFE_AREA.width,
        height: CAPTION.height,
        display: "flex",
        flexWrap: "wrap",
        alignContent: "center",
        rowGap: CAPTION.rowGap,
        fontFamily: FONTS.body,
        fontWeight: 800,
        fontSize: TYPE.caption,
        lineHeight: 1.25,
      }}
    >
      {page.map((i) => {
        const spoken = i <= active;
        const pop = springAt(frame, words[i].startFrame, fps, SPRING.pop);
        return (
          <span
            key={`${words[i].text}-${i}`}
            style={{
              display: "inline-block",
              backgroundColor: COLORS.ink,
              color: mask[i] ? COLORS.goldLight : COLORS.paper,
              padding: CAPTION.boxPadding,
              opacity: spoken ? Math.min(1, pop * 2.5) : 0,
              transform: `translateY(${spoken ? (1 - Math.min(1, pop)) * 14 : 0}px)`,
            }}
          >
            {words[i].text}
          </span>
        );
      })}
    </div>
  );
};
