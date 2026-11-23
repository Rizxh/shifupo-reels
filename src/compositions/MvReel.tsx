// Music video format (sp09 "KITA PAY JAY SEN"): the song's lyric table played
// as hard-cut shots in a live 3D toy diorama. Every scene lasts its own
// seconds (no voice over), shows its lyric in gold lettering (consecutive
// scenes with the same lyric keep one line on screen), and may add a 2D
// overlay: a title formed from incense smoke, montage badges, a fu diamond
// or the outro card. A warm light leak covers every cut.

import { Audio } from "@remotion/media";
import { random } from "remotion";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { getStaticFiles } from "remotion";
import { FilmGrain, LightLeak, TextScrims } from "../core/fx/film";
import { shotAt } from "../core/three/rig";
import { Stage3D } from "../core/three/Stage3D";
import { FONTS, SAFE_AREA, VIDEO } from "../lib/brand";
import { EASE, prog, springAt, SPRING } from "../lib/motion";
import { SFX, SFX_MIX, type SfxName } from "../lib/sfx";
import { FPS, mvStarts } from "../lib/timing";
import { MV_CUT, MV_FU, MV_ICON, MV_LYRIC, MV_OUTRO, MV_SMOKE, MV_WORD } from "../products/shifupo/mv";
import { MV_WORLDS, type MvWorldDef } from "../products/shifupo/worlds/mv";
import type { MvReelProps, MvScene } from "../schema";

// ------------------------------------------------------------------ timing
type Run = { text: string; from: number; to: number; smoke: boolean };

// Consecutive scenes with the same lyric form one run (one line on screen).
const lyricRuns = (scenes: readonly MvScene[], starts: readonly number[]): Run[] => {
  const runs: Run[] = [];
  scenes.forEach((s, i) => {
    const last = runs[runs.length - 1];
    if (!s.lyric) {
      return;
    }
    if (last && last.text === s.lyric && last.to === starts[i]) {
      last.to = starts[i + 1];
      last.smoke = last.smoke || s.overlay === "smoke-title";
      return;
    }
    runs.push({ text: s.lyric, from: starts[i], to: starts[i + 1], smoke: s.overlay === "smoke-title" });
  });
  return runs;
};

const splitLyric = (text: string): string[] => {
  if (text.length <= MV_LYRIC.breakAfterChars || !text.includes(" ")) {
    return [text];
  }
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) {
      best = i;
    }
  }
  return [text.slice(0, best), text.slice(best + 1)];
};

const sizeFor = (lines: string[], max: number): number => {
  const longest = Math.max(...lines.map((l) => l.length));
  const fit = SAFE_AREA.width / (longest * (MV_LYRIC.charEm + MV_LYRIC.letterSpacingEm));
  return Math.round(Math.max(MV_LYRIC.minSize, Math.min(max, fit)));
};

// ------------------------------------------------------------------ lyric
const Lyric: React.FC<{ run: Run; frame: number }> = ({ run, frame }) => {
  const lines = splitLyric(run.text);
  const size = sizeFor(lines, MV_LYRIC.maxSize);
  const out = prog(frame, run.to - MV_LYRIC.outFrames, run.to, EASE.in);
  let n = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE_AREA.x,
        width: SAFE_AREA.width,
        bottom: VIDEO.height - MV_LYRIC.bottom,
        textAlign: "center",
        fontFamily: FONTS.display,
        fontWeight: 900,
        fontSize: size,
        lineHeight: MV_LYRIC.lineHeight,
        letterSpacing: `${MV_LYRIC.letterSpacingEm}em`,
        filter: MV_LYRIC.shadow,
        opacity: 1 - out,
        transform: `translateY(${out * 18}px)`,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ whiteSpace: "nowrap" }}>
          {[...line].map((ch, ci) => {
            const at = run.from + 2 + n++ * MV_LYRIC.staggerFrames;
            const k = prog(frame, at, at + MV_LYRIC.inFrames, EASE.out);
            const pop = springAt(frame, at, FPS, SPRING.pop);
            return (
              <span
                key={ci}
                style={{
                  display: "inline-block",
                  minWidth: ch === " " ? "0.3em" : undefined,
                  backgroundImage: MV_LYRIC.gradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  opacity: k,
                  filter: `blur(${(1 - k) * MV_LYRIC.blurIn}px)`,
                  transform: `translateY(${(1 - k) * MV_LYRIC.riseIn}px) scale(${0.85 + 0.15 * pop})`,
                }}
              >
                {ch === " " ? " " : ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// The lyric condenses out of incense smoke: blurred, oversized letters and
// drifting wisps that gather into the line.
const SmokeTitle: React.FC<{ run: Run; frame: number }> = ({ run, frame }) => {
  const lines = splitLyric(run.text);
  const size = sizeFor(lines, MV_SMOKE.size);
  const out = prog(frame, run.to - MV_LYRIC.outFrames - 4, run.to, EASE.in);
  const gather = prog(frame, run.from, run.from + MV_SMOKE.inFrames, EASE.out);
  let n = 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: MV_SMOKE.wisps }, (_, i) => {
        const a = random(`wisp-a-${i}`) * Math.PI * 2;
        const r = MV_SMOKE.wispSpread * (0.4 + random(`wisp-r-${i}`) * 0.6) * (1 - gather);
        const drift = Math.sin((frame - run.from) / 18 + i) * 14;
        const size2 = 80 + random(`wisp-s-${i}`) * 120;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: VIDEO.width / 2 + Math.cos(a) * r - size2 / 2 + drift,
              top: MV_SMOKE.centerY + Math.sin(a) * r * 0.45 - size2 / 2 - (frame - run.from) * 0.6,
              width: size2,
              height: size2,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,244,222,0.55) 0%, rgba(255,244,222,0) 70%)",
              filter: "blur(10px)",
              opacity: Math.sin(Math.PI * Math.min(1, gather * 1.2)) * 0.8 * (1 - out),
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: SAFE_AREA.x,
          width: SAFE_AREA.width,
          top: MV_SMOKE.centerY - (size * MV_LYRIC.lineHeight * lines.length) / 2,
          textAlign: "center",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: size,
          lineHeight: MV_LYRIC.lineHeight,
          letterSpacing: `${MV_LYRIC.letterSpacingEm}em`,
          color: MV_SMOKE.color,
          textShadow: MV_SMOKE.glow,
          opacity: 1 - out,
          filter: `blur(${out * 10}px)`,
        }}
      >
        {lines.map((line, li) => (
          <div key={li} style={{ whiteSpace: "nowrap" }}>
            {[...line].map((ch, ci) => {
              const at = run.from + n++ * MV_LYRIC.staggerFrames * 1.5;
              const k = prog(frame, at, at + MV_SMOKE.inFrames, EASE.out);
              const sway = Math.sin((frame - at) / 10 + ci) * (1 - k) * 18;
              return (
                <span
                  key={ci}
                  style={{
                    display: "inline-block",
                    opacity: k,
                    filter: `blur(${(1 - k) * MV_SMOKE.blurIn}px)`,
                    transform: `translate(${sway}px, ${(1 - k) * -30}px) scale(${MV_SMOKE.scaleIn - (MV_SMOKE.scaleIn - 1) * k})`,
                  }}
                >
                  {ch === " " ? " " : ch}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ overlays
const iconPaths: Record<keyof typeof MV_ICON.labels, React.ReactNode> = {
  "icon-clock": (
    <>
      <circle cx="50" cy="50" r="38" />
      <path d="M50 26 V50 L66 60" />
      <path d="M50 8 V14 M50 86 V92 M8 50 H14 M86 50 H92" />
    </>
  ),
  "icon-goods": (
    <>
      <path d="M14 40 L50 22 L86 40 L50 58 Z" />
      <path d="M14 40 V72 L50 90 L86 72 V40" />
      <path d="M50 58 V90" />
    </>
  ),
  "icon-broom": (
    <>
      <path d="M70 10 L46 56" />
      <path d="M34 50 L58 62 L50 90 Q30 88 18 78 Z" />
      <path d="M30 72 L26 84 M40 74 L36 88 M48 76 L46 90" />
    </>
  ),
  "icon-scale": (
    <>
      <path d="M50 14 V86 M30 86 H70" />
      <path d="M18 30 H82" />
      <path d="M18 30 L8 58 H28 Z M82 30 L72 58 H92 Z" />
    </>
  ),
};

const IconBadge: React.FC<{ kind: keyof typeof MV_ICON.labels; from: number; to: number; frame: number }> = ({ kind, from, to, frame }) => {
  const pop = springAt(frame, from, FPS, SPRING.pop);
  const draw = prog(frame, from, from + MV_ICON.popFrames + 6, EASE.out);
  const note = prog(frame, from + 6, from + 16, EASE.out);
  const out = prog(frame, to - 4, to, EASE.in);
  const S = MV_ICON.size;
  return (
    <div
      style={{
        position: "absolute",
        left: MV_ICON.x - 300,
        width: 600,
        top: MV_ICON.y - S / 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: 1 - out,
        transform: `scale(${(0.6 + 0.4 * pop) * (1 - out * 0.2)}) rotate(${(1 - pop) * -8}deg)`,
      }}
    >
      <svg width={S} height={S} viewBox="0 0 100 100" style={{ overflow: "visible", filter: `drop-shadow(0 4px 4px ${MV_ICON.shadow})` }}>
        <g fill="none" stroke={MV_ICON.color} strokeWidth={MV_ICON.stroke * (100 / S)} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw}>
          {iconPaths[kind]}
        </g>
      </svg>
      <div
        style={{
          marginTop: 10,
          fontFamily: FONTS.hand,
          fontWeight: 700,
          fontSize: MV_ICON.noteSize,
          color: MV_ICON.color,
          textShadow: `0 3px 6px ${MV_ICON.shadow}, 0 0 18px ${MV_ICON.shadow}`,
          opacity: note,
          transform: `translateY(${(1 - note) * 16}px) rotate(-3deg)`,
          whiteSpace: "nowrap",
        }}
      >
        {MV_ICON.labels[kind]}
      </div>
    </div>
  );
};

const FuDiamond: React.FC<{ from: number; to: number; frame: number }> = ({ from, to, frame }) => {
  const pop = springAt(frame, from + 4, FPS, SPRING.pop);
  const out = prog(frame, to - 6, to, EASE.in);
  const spin = (1 - pop) * -90 + Math.sin((frame - from) / 16) * 3;
  const S = MV_FU.size;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 1 - out }}>
      {Array.from({ length: MV_FU.sparkles }, (_, i) => {
        const a = (i / MV_FU.sparkles) * Math.PI * 2 + random(`fu-${i}`);
        const k = prog(frame, from + 6, from + 30, EASE.out);
        const r = S * (0.5 + k * (0.5 + random(`fur-${i}`) * 0.5));
        const s = 10 + random(`fus-${i}`) * 12;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: MV_FU.x + Math.cos(a) * r - s / 2,
              top: MV_FU.y + Math.sin(a) * r - s / 2,
              width: s,
              height: s,
              background: MV_FU.gold,
              transform: `rotate(45deg) scale(${Math.sin(Math.PI * k)})`,
              boxShadow: `0 0 12px ${MV_FU.gold}`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: MV_FU.x - S / 2,
          top: MV_FU.y - S / 2,
          width: S,
          height: S,
          transform: `scale(${pop}) rotate(${45 + spin}deg)`,
          background: `linear-gradient(135deg, ${MV_FU.red}, ${MV_FU.redDeep})`,
          border: `8px solid ${MV_FU.gold}`,
          borderRadius: 18,
          boxShadow: "0 18px 40px rgba(40,6,4,0.55)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: MV_FU.x - S / 2,
          top: MV_FU.y - S / 2,
          width: S,
          height: S,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTS.han,
          fontWeight: 900,
          fontSize: S * 0.62,
          color: MV_FU.gold,
          textShadow: "0 3px 0 rgba(90,40,0,0.6)",
          transform: `scale(${pop}) rotate(${spin * 0.3}deg)`,
        }}
      >
        {MV_FU.glyph}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ from: number; frame: number; title: string; tagline: string; logo?: string }> = ({ from, frame, title, tagline, logo }) => {
  const glow = prog(frame, from, from + 18, EASE.out);
  const logoIn = springAt(frame, from + 6, FPS, SPRING.pop);
  const titleK = prog(frame, from + 14, from + 34, EASE.out);
  const tagK = prog(frame, from + 30, from + 48, EASE.out);
  const breathe = 1 + Math.sin((frame - from) / 22) * 0.01;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: MV_OUTRO.glow, opacity: glow }} />
      {logo ? (
        <Img
          src={staticFile(logo)}
          style={{
            position: "absolute",
            left: VIDEO.width / 2 - MV_OUTRO.logoWidth / 2,
            top: MV_OUTRO.logoY,
            width: MV_OUTRO.logoWidth,
            opacity: Math.min(1, logoIn * 1.4),
            transform: `scale(${(0.8 + 0.2 * logoIn) * breathe})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: SAFE_AREA.x,
          width: SAFE_AREA.width,
          top: MV_OUTRO.titleY,
          textAlign: "center",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: sizeFor(splitLyric(title), MV_OUTRO.titleSize),
          lineHeight: MV_LYRIC.lineHeight,
          letterSpacing: `${MV_LYRIC.letterSpacingEm}em`,
          backgroundImage: MV_OUTRO.titleGradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: `${MV_OUTRO.titleShadow} blur(${(1 - titleK) * 10}px)`,
          opacity: titleK,
          transform: `translateY(${(1 - titleK) * 30}px) scale(${breathe})`,
        }}
      >
        {splitLyric(title).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: VIDEO.width / 2 - MV_OUTRO.taglineWidth / 2,
          width: MV_OUTRO.taglineWidth,
          top: MV_OUTRO.taglineY,
          textAlign: "center",
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: MV_OUTRO.taglineSize,
          lineHeight: 1.3,
          color: MV_OUTRO.ink,
          opacity: tagK,
          transform: `translateY(${(1 - tagK) * 20}px)`,
        }}
      >
        {tagline}
      </div>
    </AbsoluteFill>
  );
};

// A small gold word bursting out of sparkles (storyboard: "HOKGI" appears
// small in the gold effect).
const SparkleWord: React.FC<{ word: string; from: number; to: number; frame: number }> = ({ word, from, to, frame }) => {
  const k = springAt(frame, from + 3, FPS, SPRING.pop);
  const out = prog(frame, to - 5, to, EASE.in);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 1 - out }}>
      {Array.from({ length: MV_WORD.sparkles }, (_, i) => {
        const a = (i / MV_WORD.sparkles) * Math.PI * 2 + random(`sw-${i}`);
        const r = MV_WORD.spread * (0.4 + 0.6 * prog(frame, from + 2, from + 22, EASE.out));
        const s = 8 + random(`sws-${i}`) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: MV_WORD.x + Math.cos(a) * r - s / 2,
              top: MV_WORD.y + Math.sin(a) * r * 0.6 - s / 2,
              width: s,
              height: s,
              background: MV_FU.gold,
              transform: `rotate(45deg) scale(${Math.sin(Math.PI * prog(frame, from + 2, from + 26))})`,
              boxShadow: `0 0 10px ${MV_FU.gold}`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: MV_WORD.x - 300,
          width: 600,
          top: MV_WORD.y - MV_WORD.size * 0.6,
          textAlign: "center",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: MV_WORD.size,
          letterSpacing: "0.12em",
          backgroundImage: MV_LYRIC.gradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: `${MV_LYRIC.shadow} drop-shadow(0 0 3px rgba(80,30,5,0.9))`,
          transform: `scale(${k}) rotate(${(1 - k) * -10}deg)`,
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ reel
const hasFile = (p: string) => getStaticFiles().some((f) => f.name === p);

export const MvReel: React.FC<MvReelProps> = (props) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { scenes } = props;
  const world = MV_WORLDS[props.world];
  const starts = mvStarts(scenes.map((s) => s.seconds), FPS);
  let i = scenes.length - 1;
  while (i > 0 && frame < starts[i]) {
    i--;
  }
  const scene = scenes[i];
  const len = starts[i + 1] - starts[i];
  const local = frame - starts[i];
  const t = len > 1 ? local / (len - 1) : 0;
  const runs = lyricRuns(scenes, starts);
  const run = runs.find((r) => frame >= r.from && frame < r.to);
  const shot3d = world?.kind === "3d" ? (world.shots[scene.shot] ?? Object.values(world.shots)[0]) : undefined;
  const audioOnly = Boolean(process.env.REMOTION_AUDIO_ONLY);
  // Light leak across the nearest cut.
  const cut = starts.slice(1, -1).reduce((best, c) => (Math.abs(c - frame) < Math.abs(best - frame) ? c : best), -1e9);
  const leak = (frame - (cut - MV_CUT.leakFrames)) / (2 * MV_CUT.leakFrames);
  const fadeOutFrom = durationInFrames - MV_CUT.musicFadeOut * FPS;
  const W = world?.Component as MvWorldDef["Component"];

  return (
    <AbsoluteFill style={{ backgroundColor: world ? (world.kind === "3d" ? world.look.background : world.background) : "#000" }}>
      {!audioOnly && world?.kind === "3d" && shot3d ? (
        <AbsoluteFill>
          <Stage3D width={VIDEO.width} height={VIDEO.height} cam={shotAt(shot3d, t, frame)} look={world.look}>
            <W s={{ shot: scene.shot, t, frame, local, len }} />
          </Stage3D>
        </AbsoluteFill>
      ) : null}
      {!audioOnly && world?.kind === "2d" ? (
        <AbsoluteFill>
          <W s={{ shot: scene.shot, t, frame, local, len }} />
        </AbsoluteFill>
      ) : null}
      {!audioOnly ? (
        <>
          <TextScrims top={MV_CUT.scrimTop} bottom={MV_CUT.scrimBottom} strength={scene.overlay === "outro" ? 0 : MV_CUT.scrimStrength} />
          <LightLeak progress={leak} color={MV_CUT.leakColor} />
          {scenes.map((s, k) =>
            s.overlay in MV_ICON.labels ? (
              frame >= starts[k] && frame < starts[k + 1] ? (
                <IconBadge key={`icon-${k}`} kind={s.overlay as keyof typeof MV_ICON.labels} from={starts[k]} to={starts[k + 1]} frame={frame} />
              ) : null
            ) : s.overlay === "hokgi" && frame >= starts[k] && frame < starts[k + 1] ? (
              <FuDiamond key={`fu-${k}`} from={starts[k]} to={starts[k + 1]} frame={frame} />
            ) : null,
          )}
          {scene.overlay === "smoke-word" && scene.word ? (
            <SmokeTitle run={{ text: scene.word, from: starts[i] + Math.round(len * MV_WORD.smokeAt), to: starts[i + 1], smoke: true }} frame={frame} />
          ) : null}
          {scene.overlay === "sparkle-word" && scene.word ? <SparkleWord word={scene.word} from={starts[i]} to={starts[i + 1]} frame={frame} /> : null}
          {run && scene.overlay !== "outro" ? run.smoke ? <SmokeTitle run={run} frame={frame} /> : <Lyric run={run} frame={frame} /> : null}
          {scene.overlay === "outro" ? <Outro from={starts[i]} frame={frame} title={props.title} tagline={props.tagline} logo={props.brand.logo} /> : null}
          <FilmGrain width={VIDEO.width} height={VIDEO.height} opacity={MV_CUT.grain} />
        </>
      ) : null}
      {hasFile(props.music) ? (
        <Audio
          src={staticFile(props.music)}
          volume={(f) =>
            MV_CUT.musicVolume *
            interpolate(f, [0, MV_CUT.musicFadeIn * FPS, fadeOutFrom, durationInFrames], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      ) : null}
      {scenes.flatMap((s, k) =>
        s.sfx
          .filter((x): x is { sound: SfxName; at: number } => x.sound in SFX)
          .map((x, j) => (
            <Sequence key={`sfx-${k}-${j}`} from={Math.round(starts[k] + x.at * (starts[k + 1] - starts[k]))} layout="none">
              <Audio src={staticFile(SFX[x.sound])} volume={SFX_MIX[x.sound] * MV_CUT.sfxGain} />
            </Sequence>
          )),
      )}
    </AbsoluteFill>
  );
};
