// Parade format (sp07): the 12 shio as cute paper characters on a cheerful
// paper-cut Imlek stage (Motion Format paper-cartoon style). One continuous
// stage, no cuts: characters drop in, hop to the front on their spoken name,
// squash on landing, step back when their beat ends; a verdict stamp slams
// over each group; lanterns swing, clouds drift, confetti falls.

import { Audio } from "@remotion/media";
import { noise2D } from "@remotion/noise";
import { AbsoluteFill, getRemotionEnvironment, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import { LogoPlate, WhatsAppButton } from "../components/Brand";
import { Sparkles } from "../components/Fx";
import { PILLAR, Pillars } from "../components/Pillars";
import { BUDDY_HEIGHT, ShioBuddy } from "../components/ShioBuddy";
import { Caption, HeadlineLine, HeadlineStack, Kicker } from "../components/Text";
import { FilmGrain } from "../core/fx/film";
import { Stamp } from "../core/fx/marks";
import { idle, squashOnImpact } from "../core/motion/acting";
import { bounce } from "../core/motion/physics";
import { backOut, powInOut } from "../core/motion/tracks";
import { PaperDefs, usePaperFilter } from "../core/paper/paper";
import { CINEMA, COLORS, FONTS, MARK_STYLE, SAFE_AREA, TYPE, VIDEO } from "../lib/brand";
import { MIX } from "../lib/mix";
import { SFX, SFX_MIX, WHOOSH_PEAK_SECONDS, type SfxName } from "../lib/sfx";
import { cueFrame, type Beat } from "../lib/timeline";
import {
  BUDDY,
  PARADE_CAM,
  PARADE_COLORS,
  PARADE_FOCUS,
  PARADE_GRID,
  PARADE_GROUND,
  PARADE_LANTERNS,
  PARADE_PAPER,
  PARADE_PILLARS,
  PARADE_STAMP,
} from "../products/shifupo/parade";
import { SHIO_ORDER } from "../products/shifupo/shio";
import type { ParadeReelProps, ParadeScene, ShioSign } from "../schema";

// Set by scripts/render.ts for the audio pass: no pictures needed there.
const AUDIO_ONLY = Boolean(process.env.REMOTION_AUDIO_ONLY);

type Pose = { x: number; y: number; s: number; o: number };
type Ctx = { scenes: ParadeScene[]; beats: Beat[]; yearSign: ShioSign };
const c01 = (t: number) => Math.min(1, Math.max(0, t));
const cueOf = (c: Ctx, i: number, w: string) => cueFrame(c.beats[i], c.scenes[i].vo, w);

const home = (sign: ShioSign): Pose => {
  const i = SHIO_ORDER.indexOf(sign);
  const col = i % PARADE_GRID.cols;
  const row = Math.floor(i / PARADE_GRID.cols);
  return {
    x: PARADE_GRID.cx + (col - (PARADE_GRID.cols - 1) / 2) * PARADE_GRID.colGap,
    y: PARADE_GRID.top + row * PARADE_GRID.rowGap,
    s: PARADE_GRID.scale,
    o: 1,
  };
};

const backRow = (sign: ShioSign, others: ShioSign[]): Pose => {
  const k = others.indexOf(sign);
  const n = others.length;
  const span = VIDEO.width - 2 * SAFE_AREA.x;
  return { x: SAFE_AREA.x + (n === 1 ? span / 2 : (k / (n - 1)) * span), y: PARADE_FOCUS.backY, s: PARADE_FOCUS.backScale, o: PARADE_FOCUS.backOpacity };
};

// Where every character stands during beat i, and when it starts moving.
const layout = (c: Ctx, i: number, sign: ShioSign): { pose: Pose; start: number } => {
  const scene = c.scenes[i];
  const beat = c.beats[i];
  if (scene.type === "group") {
    const members = scene.signs.map((g) => g.sign);
    const k = members.indexOf(sign);
    if (k >= 0) {
      const n = members.length;
      const s = n <= 2 ? PARADE_FOCUS.scaleFew : n === 3 ? PARADE_FOCUS.scaleThree : PARADE_FOCUS.scaleMany;
      const gap = Math.max(PARADE_FOCUS.minGap, Math.min(PARADE_FOCUS.maxGap, (VIDEO.width - 2 * SAFE_AREA.x) / n));
      return {
        pose: { x: VIDEO.width / 2 + (k - (n - 1) / 2) * gap, y: PARADE_FOCUS.y, s, o: 1 },
        start: cueOf(c, i, scene.signs[k].cueWord) - PARADE_FOCUS.travelFrames + 4,
      };
    }
    const others = SHIO_ORDER.filter((x) => !members.includes(x));
    return { pose: backRow(sign, others), start: beat.startFrame + PARADE_CAM.leaveDelay + (SHIO_ORDER.indexOf(sign) % 4) };
  }
  if (scene.type === "payoff") {
    if (sign === c.yearSign) {
      const n = scene.pillars.length;
      const span = n * PILLAR.width + (n - 1) * PILLAR.gap;
      return {
        pose: { x: PARADE_PILLARS.x - span / 2 + PILLAR.width / 2, y: PARADE_PILLARS.y - PILLAR.height - 40, s: 0.62, o: 1 },
        start: beat.startFrame + 18,
      };
    }
    const others = SHIO_ORDER.filter((x) => x !== c.yearSign);
    return { pose: backRow(sign, others), start: beat.startFrame + (SHIO_ORDER.indexOf(sign) % 4) };
  }
  if (scene.type === "cta") {
    const k = SHIO_ORDER.indexOf(sign);
    const span = VIDEO.width - 2 * 70;
    return { pose: { x: 70 + (k / 11) * span, y: PARADE_FOCUS.backY, s: 0.55, o: 1 }, start: beat.startFrame + (k % 6) * 2 };
  }
  return { pose: home(sign), start: beat.startFrame + (SHIO_ORDER.indexOf(sign) % 4) * 2 };
};

// Pose of a character at a frame: hop from the previous beat's spot to this
// beat's spot (arc + squash on landing), or drop in from the sky (hook).
const poseAt = (c: Ctx, frame: number, sign: ShioSign): { pose: Pose; since: number; air: boolean } => {
  let i = c.beats.findIndex((b) => frame < b.endFrame);
  if (i < 0) {
    i = c.beats.length - 1;
  }
  const idx = SHIO_ORDER.indexOf(sign);
  if (i === 0) {
    const h = home(sign);
    const start = idx * BUDDY.dropStagger - BUDDY.dropLead;
    const b = bounce(frame, start, { height: BUDDY.dropFrom, gravity: BUDDY.hopGravity * 2.4, restitution: BUDDY.hopRestitution, minHop: 4 });
    return { pose: { ...h, y: h.y - b.y }, since: b.sinceImpact, air: !b.resting && b.y > 1 };
  }
  const prev = layout(c, i - 1, sign).pose;
  const { pose: next, start } = layout(c, i, sign);
  const T = PARADE_FOCUS.travelFrames;
  if (frame < start) {
    return { pose: prev, since: Infinity, air: false };
  }
  const t = c01((frame - start) / T);
  const e = powInOut(2)(t);
  const moved = Math.hypot(next.x - prev.x, next.y - prev.y) > 2 || Math.abs(next.s - prev.s) > 0.01;
  const arc = moved ? Math.sin(Math.PI * t) * PARADE_FOCUS.hopHeight * (0.6 + next.s * 0.4) : 0;
  return {
    pose: {
      x: prev.x + (next.x - prev.x) * e,
      y: prev.y + (next.y - prev.y) * e - arc,
      s: prev.s + (next.s - prev.s) * e,
      o: prev.o + (next.o - prev.o) * e,
    },
    since: moved ? frame - (start + T) : Infinity,
    air: moved && t < 1,
  };
};

// ------------------------------------------------------------------ camera
// Focus-follow camera (Motion Format): slides and zooms to each character as
// its name is spoken, pulls back for the stamp, breathes in between. The
// background layers follow it with parallax; the sky never moves.
type Cam = { x: number; z: number };

const focusCamera = (c: Ctx, frame: number): Cam => {
  const W = VIDEO.width;
  const ev: { f: number; x: number; z: number }[] = [];
  c.scenes.forEach((s, i) => {
    ev.push({ f: c.beats[i].startFrame, x: W / 2, z: 1 });
    if (s.type === "group") {
      const n = s.signs.length;
      const z = n <= 2 ? PARADE_CAM.zoomFew : n === 3 ? PARADE_CAM.zoomThree : PARADE_CAM.zoomMany;
      for (const g of s.signs) {
        // Big groups only lean toward the speaker so no member leaves the frame.
        const follow = n <= 2 ? 1 : n === 3 ? PARADE_CAM.followThree : PARADE_CAM.followMany;
        ev.push({ f: cueOf(c, i, g.cueWord) - 4, x: W / 2 + (layout(c, i, g.sign).pose.x - W / 2) * follow, z });
      }
      if (s.stamp) {
        ev.push({ f: cueOf(c, i, s.stamp.cueWord) - 6, x: W / 2, z: PARADE_CAM.zoomStamp });
      }
    }
  });
  ev.sort((a, b) => a.f - b.f);
  const T = PARADE_CAM.followFrames;
  const blend = (a: Cam, b: Cam, t: number): Cam => {
    const e = powInOut(2)(c01(t));
    return { x: a.x + (b.x - a.x) * e, z: a.z + (b.z - a.z) * e };
  };
  let from: Cam = { x: W / 2, z: 1 };
  let to: Cam = from;
  let t0 = -Infinity;
  for (const e of ev) {
    if (e.f > frame) {
      break;
    }
    from = blend(from, to, (e.f - t0) / T);
    to = { x: e.x, z: e.z };
    t0 = e.f;
  }
  const cam = blend(from, to, (frame - t0) / T);
  // Handheld drift: the stage is never perfectly still.
  const drift = noise2D("parade-cam", frame / PARADE_CAM.driftPeriod, 0) * PARADE_CAM.driftPx;
  return { x: cam.x + drift, z: cam.z * (1 + PARADE_CAM.breathe * Math.sin((frame / PARADE_CAM.breathePeriod) * Math.PI * 2)) };
};

// SVG transform of a layer at parallax depth f (0 = sky, 1 = characters).
const layerTransform = (cam: Cam, f: number): string => {
  const W = VIDEO.width;
  const Y0 = PARADE_FOCUS.y;
  const z = 1 + (cam.z - 1) * f;
  const x = W / 2 + (cam.x - W / 2) * f;
  return `translate(${W / 2} ${Y0}) scale(${z}) translate(${-x} ${-Y0})`;
};

// ------------------------------------------------------------------ stage
const Stage: React.FC<{ cam: Cam }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const filter = usePaperFilter();
  const { width: W, height: H } = VIDEO;
  const M = PARADE_CAM.margin;
  const cloud = (seed: string, y: number, scale: number, speed: number) => {
    const x = ((random(seed) * W + frame * speed) % (W + 2 * M)) - M;
    return (
      <g key={seed} transform={`translate(${x} ${y}) scale(${scale})`} filter={filter}>
        <ellipse cx={0} cy={0} rx={110} ry={42} fill={PARADE_COLORS.cloud} />
        <circle cx={-46} cy={-18} r={44} fill={PARADE_COLORS.cloud} />
        <circle cx={30} cy={-30} r={56} fill={PARADE_COLORS.cloud} />
        <ellipse cx={0} cy={22} rx={104} ry={14} fill={PARADE_COLORS.cloudShade} opacity={0.6} />
      </g>
    );
  };
  // Drawn wider than the frame so the camera never shows an edge.
  const hills = (y: number, amp: number, color: string, seed: string, drift: number) => {
    const pts: string[] = [`M${-M} ${H + M}`];
    for (let x = -M; x <= W + M; x += 40) {
      pts.push(`L${x} ${y + Math.sin((x + frame * drift) / 160 + random(seed) * 6) * amp + noise2D(seed, x / 300, 0) * amp * 0.5}`);
    }
    pts.push(`L${W + M} ${H + M} Z`);
    return <path d={pts.join(" ")} fill={color} filter={filter} />;
  };
  const sunR = 120;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${PARADE_COLORS.sky[0]} 0%, ${PARADE_COLORS.sky[1]} 48%, ${PARADE_COLORS.sky[2]} 100%)` }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g transform={layerTransform(cam, 0.12)}>
          <g transform={`translate(${W * 0.78} 470)`}>
            {Array.from({ length: 12 }, (_, k) => (
              <path key={k} d={`M0 ${-sunR - 18} l14 -46 l-28 0 z`} fill={PARADE_COLORS.sunDeep} opacity={0.55} transform={`rotate(${k * 30 + frame * 0.35})`} />
            ))}
            <circle r={sunR} fill={PARADE_COLORS.sun} filter={filter} />
          </g>
        </g>
        <g transform={layerTransform(cam, 0.3)}>
          {cloud("c1", 380, 1.1, 1.1)}
          {cloud("c2", 560, 0.8, 1.6)}
          {cloud("c3", 300, 0.7, 0.8)}
          {cloud("c4", 680, 0.6, 1.3)}
        </g>
        <g transform={layerTransform(cam, 0.5)}>{hills(PARADE_GROUND.hillFar, 40, PARADE_COLORS.hillFar, "hf", 0.3)}</g>
        <g transform={layerTransform(cam, 0.72)}>{hills(PARADE_GROUND.hillNear, 28, PARADE_COLORS.hill, "hn", 0.6)}</g>
        <g transform={layerTransform(cam, 0.9)}>
          <rect x={-M} y={PARADE_GROUND.y} width={W + 2 * M} height={H - PARADE_GROUND.y + M} fill={PARADE_COLORS.ground} />
          <rect x={-M} y={PARADE_GROUND.y} width={W + 2 * M} height={14} fill={PARADE_COLORS.groundTop} />
        </g>
        {/* Lanterns swinging on their strings (near the top, slow parallax). */}
        <g transform={layerTransform(cam, 0.2)}>
          {PARADE_LANTERNS.map((l, k) => {
            const swing = Math.sin(frame / (38 + k * 7) + k) * (5 + k);
            return (
              <g key={k} transform={`translate(${l.x} 0) rotate(${swing})`}>
                <line x1={0} y1={-M} x2={0} y2={l.len} stroke={PARADE_COLORS.ink} strokeWidth={3} opacity={0.6} />
                <g transform={`translate(0 ${l.len}) scale(${l.size})`} filter={filter}>
                  <circle r={70} fill={PARADE_COLORS.lanternGlow} opacity={0.35} />
                  <rect x={-22} y={-62} width={44} height={14} rx={4} fill={PARADE_COLORS.tassel} />
                  <ellipse rx={56} ry={50} fill={PARADE_COLORS.lantern} />
                  <path d="M-56 0 h112 M-40 -34 q40 -12 80 0 M-40 34 q40 12 80 0" stroke={PARADE_COLORS.tassel} strokeWidth={3} fill="none" opacity={0.8} />
                  <rect x={-22} y={48} width={44} height={14} rx={4} fill={PARADE_COLORS.tassel} />
                  <path d="M0 62 v40" stroke={PARADE_COLORS.tassel} strokeWidth={6} strokeLinecap="round" />
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Confetti in front of everything (moves a little faster than the camera).
const Confetti: React.FC<{ cam: Cam }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = VIDEO;
  const M = PARADE_CAM.margin;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <g transform={layerTransform(cam, 1.15)}>
          {Array.from({ length: PARADE_CAM.confetti }, (_, k) => {
            const speed = 1.8 + random(`cf-s${k}`) * 2.6;
            const y = ((random(`cf-y${k}`) * H + frame * speed) % (H + 60)) - 30;
            const x = -M + random(`cf-x${k}`) * (W + 2 * M) + Math.sin(frame / 20 + k) * 18;
            const col = PARADE_COLORS.confetti[k % PARADE_COLORS.confetti.length];
            return <rect key={k} x={x} y={y} width={14} height={8} fill={col} transform={`rotate(${frame * (3 + (k % 5)) + k * 40} ${x + 7} ${y + 4})`} opacity={0.9} />;
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const NameTag: React.FC<{ x: number; y: number; text: string; amount: number }> = ({ x, y, text, amount }) => {
  const filter = usePaperFilter();
  if (amount <= 0) {
    return null;
  }
  const size = 38;
  const w = text.length * size * 0.66 + 40;
  const pop = backOut(2)(amount);
  return (
    <g transform={`translate(${x} ${y}) rotate(-3) scale(${pop})`} filter={filter}>
      <rect x={-w / 2} y={-size * 0.82} width={w} height={size * 1.4} rx={10} fill={PARADE_COLORS.highlight} />
      <text textAnchor="middle" y={size * 0.1} fontFamily={FONTS.body} fontWeight={800} fontSize={size} letterSpacing="0.06em" fill={PARADE_COLORS.ink}>
        {text}
      </text>
    </g>
  );
};

const Titles: React.FC<{ scene: ParadeScene; beat: Beat }> = ({ scene, beat }) => {
  const cue = (w: string) => cueFrame(beat, scene.vo, w);
  const first = scene.lines[0];
  return (
    <HeadlineStack align="center">
      {scene.kicker && first ? <Kicker text={scene.kicker} start={cue(first.cueWord) - 6} out={beat.endFrame} color={COLORS.seal} /> : null}
      {scene.lines.map((l, i) => (
        <HeadlineLine
          key={l.text}
          text={l.text}
          cue={cue(l.cueWord)}
          out={beat.endFrame}
          accent={l.accent}
          variant={i === 0 ? "slam" : "rise"}
          size={scene.type === "hook" ? TYPE.hook : TYPE.headline}
          color={PARADE_COLORS.title}
          accentColor={PARADE_COLORS.titleAccent}
        />
      ))}
    </HeadlineStack>
  );
};

// ------------------------------------------------------------------ reel
export const ParadeReel: React.FC<ParadeReelProps> = ({ scenes, beats, brand, debug, yearSign, names }) => {
  const frame = useCurrentFrame();
  if (!beats) {
    return <AbsoluteFill style={{ backgroundColor: PARADE_COLORS.sky[2] }} />;
  }
  const c: Ctx = { scenes, beats, yearSign };
  let cur = beats.findIndex((b) => frame < b.endFrame);
  if (cur < 0) {
    cur = beats.length - 1;
  }
  const scene = scenes[cur];
  const beat = beats[cur];
  const members = scene.type === "group" ? scene.signs.map((g) => g.sign) : [];
  const iPay = scenes.findIndex((s) => s.type === "payoff");
  const pay = iPay >= 0 ? scenes[iPay] : null;

  const cam = focusCamera(c, frame);
  // Draw order: back row first, front members last (by y).
  const placed = SHIO_ORDER.map((sign) => ({ sign, ...poseAt(c, frame, sign) })).sort((a, b) => a.pose.y * a.pose.s - b.pose.y * b.pose.s);

  return (
    <AbsoluteFill style={{ backgroundColor: PARADE_COLORS.sky[2] }}>
      {/* The audio-only pass (scripts/render.ts) skips every visual layer. */}
      {AUDIO_ONLY ? null : (
        <>
      <PaperDefs fx={PARADE_PAPER} />
      <Stage cam={cam} />
      <AbsoluteFill style={{ transform: `translateX(${VIDEO.width / 2 - cam.x}px) scale(${cam.z})`, transformOrigin: `${cam.x}px ${PARADE_FOCUS.y}px` }}>
      {pay && pay.pillars.length > 0 && frame >= beats[iPay].startFrame && frame < beats[iPay].endFrame + 14 ? (
        <AbsoluteFill style={{ opacity: 1 - c01((frame - (beats[iPay].endFrame + 2)) / 12) }}>
          <svg width={VIDEO.width} height={VIDEO.height}>
            <g transform={`translate(${PARADE_PILLARS.x} ${PARADE_PILLARS.y})`}>
              <Pillars
                pillars={pay.pillars}
                start={beats[iPay].startFrame + 2}
                cues={pay.pillars.map((_, k) => (pay.lines[0] ? cueOf(c, iPay, pay.lines[0].cueWord) : beats[iPay].startFrame + 20) + k * 5)}
                exitStart={beats[iPay].endFrame + 2}
                id="parade-pillars"
              />
            </g>
          </svg>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill>
        <svg width={VIDEO.width} height={VIDEO.height} style={{ overflow: "visible" }}>
          {placed.map(({ sign, pose, since, air }) => {
            const life = idle(`buddy-${sign}`, frame, BUDDY.idleBob, BUDDY.idleSway);
            const squash = air ? ([0.92, 1.1] as [number, number]) : squashOnImpact(since, 0.9, 12);
            const front = members.includes(sign);
            const talkHop = front && !air && Number.isFinite(since) && since > 8 ? Math.abs(Math.sin(((since - 8) / PARADE_CAM.hopEvery) * Math.PI)) * PARADE_CAM.hopPx * pose.s : 0;
            const waving = scene.type === "cta" ? Math.max(0, Math.sin(frame / 9 + SHIO_ORDER.indexOf(sign))) : front ? 0.6 + 0.4 * Math.sin(frame / 7) : 0;
            return (
              <ShioBuddy
                key={sign}
                sign={sign}
                x={pose.x}
                y={pose.y + (air ? 0 : life.y) - talkHop}
                scale={pose.s}
                squash={squash}
                tilt={life.rotate}
                mood={front ? scene.mood : "happy"}
                wave={waving}
                opacity={pose.o}
                blinkOffset={SHIO_ORDER.indexOf(sign) * 17}
              />
            );
          })}
          {/* Names of the members, on yellow paper tags. */}
          {scene.type === "group"
            ? scene.signs.map((g) => {
                const p = poseAt(c, frame, g.sign).pose;
                const at = cueOf(c, cur, g.cueWord);
                const amount = c01((frame - at) / 8) * (1 - c01((frame - (beat.endFrame - 6)) / 6));
                return <NameTag key={g.sign} x={p.x} y={p.y + PARADE_CAM.tagBelow * p.s} text={names[g.sign]} amount={amount} />;
              })
            : null}
          {scene.stamp ? (
            <Stamp
              frame={frame}
              cue={cueOf(c, cur, scene.stamp.cueWord)}
              out={beat.endFrame}
              style={MARK_STYLE}
              x={VIDEO.width / 2}
              y={PARADE_FOCUS.y - BUDDY_HEIGHT * (members.length <= 2 ? PARADE_FOCUS.scaleFew : members.length === 3 ? PARADE_FOCUS.scaleThree : PARADE_FOCUS.scaleMany) - PARADE_STAMP.gap}
              text={scene.stamp.text}
              angle={PARADE_STAMP.angle}
              maxWidth={SAFE_AREA.width * 0.92}
            />
          ) : null}
        </svg>
      </AbsoluteFill>
      </AbsoluteFill>
      <Confetti cam={cam} />
      {scene.stamp ? <Sparkles cx={VIDEO.width / 2} cy={PARADE_FOCUS.y - 160} start={cueOf(c, cur, scene.stamp.cueWord) + 6} count={12} spread={300} /> : null}
      {scenes.map((s, i) => {
        const b = beats[i];
        if (frame < b.startFrame || frame >= b.endFrame) {
          return null;
        }
        if (s.type === "cta") {
          return (
            <AbsoluteFill key={`ui-${i}`} style={{ alignItems: "center", justifyContent: "center", gap: 50, top: -260 }}>
              <LogoPlate start={b.startFrame - 4} glyph={brand.sealGlyph} name={brand.name} descriptor={brand.descriptor} />
              {s.button ? <WhatsAppButton text={s.button.text} cue={cueOf(c, i, s.button.cueWord)} /> : null}
            </AbsoluteFill>
          );
        }
        return <Titles key={`ui-${i}`} scene={s} beat={b} />;
      })}
      {scenes.map((s, i) => {
        const b = beats[i];
        return (
          <Sequence key={`cap-${i}`} from={b.startFrame} durationInFrames={b.endFrame - b.startFrame} layout="none">
            <Caption words={b.words.map((w) => ({ text: w.text, startFrame: w.startFrame - b.startFrame, endFrame: w.endFrame - b.startFrame }))} highlight={s.voHighlight} />
          </Sequence>
        );
      })}
      <FilmGrain width={VIDEO.width} height={VIDEO.height} opacity={0.02} />
        </>
      )}

      {/* Audio: VO, cue-word sound effects, a pop for every landing, bed. */}
      {beats.map((b) =>
        b.voSrc ? (
          <Sequence key={b.voSrc} from={b.voStartFrame} layout="none">
            <Audio src={staticFile(b.voSrc)} volume={MIX.vo * (b.voGain ?? 1)} />
          </Sequence>
        ) : null,
      )}
      {scenes.flatMap((s, i) =>
        s.sfx
          .filter((x) => x.sound in SFX)
          .map((x) => {
            const name = x.sound as SfxName;
            const cue = cueOf(c, i, x.cueWord);
            const at = name === "whoosh" ? cue - Math.round(WHOOSH_PEAK_SECONDS * VIDEO.fps) - CINEMA.whooshLeadFrames : cue - 2;
            return (
              <Sequence key={`sfx-${i}-${x.cueWord}-${x.sound}`} from={Math.max(0, at)} layout="none">
                <Audio src={staticFile(SFX[name])} volume={SFX_MIX[name] * (name === "whoosh" ? CINEMA.whooshUnderVo : 1)} />
              </Sequence>
            );
          }),
      )}
      {SHIO_ORDER.map((sign, k) => {
        // Hook: one soft tick per character landing.
        const land = Math.round(k * BUDDY.dropStagger - BUDDY.dropLead + Math.sqrt((2 * BUDDY.dropFrom) / (BUDDY.hopGravity * 2.4)));
        return (
          <Sequence key={`land-${sign}`} from={Math.max(0, land)} layout="none">
            <Audio src={staticFile(SFX.tick)} volume={SFX_MIX.tick * 0.8} />
          </Sequence>
        );
      })}
      {CINEMA.bed ? (
        <Audio
          src={staticFile(CINEMA.bed)}
          volume={(f) => {
            const speaking = beats.some((b) => f >= b.voStartFrame && f < b.voStartFrame + b.voDurationInFrames);
            const total = beats[beats.length - 1].endFrame;
            const fadeOut = interpolate(f, [total - 24, total], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (speaking ? CINEMA.bedUnderVo : CINEMA.bedVolume) * fadeOut;
          }}
        />
      ) : null}
      {debug && getRemotionEnvironment().isStudio ? (
        <div style={{ position: "absolute", left: SAFE_AREA.x, top: SAFE_AREA.y, width: SAFE_AREA.width, height: SAFE_AREA.height, outline: `4px dashed ${COLORS.seal}` }} />
      ) : null}
    </AbsoluteFill>
  );
};

