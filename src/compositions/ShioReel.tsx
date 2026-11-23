// Shio format (sp06): one continuous wheel of the 12 shio in the ink-painting
// world. Beats never cut: the wheel camera eases to a new framing on each
// beat start (Motion Format continuity), seals light on their spoken words,
// relations draw themselves by hand, a date card drops with real bounce, and
// the year sign finally flies into the year pillar of a BaZi chart.

import { Audio } from "@remotion/media";
import { AbsoluteFill, getRemotionEnvironment, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Bamboo, InkMountains, Paper, Petals } from "../components/Background";
import { LogoPlate, WhatsAppButton } from "../components/Brand";
import { Sparkles } from "../components/Fx";
import { Pillars } from "../components/Pillars";
import { ShioWheel, type LinkWindow, type LitWindow, type WheelCam } from "../components/ShioWheel";
import { Caption, HeadlineLine, HeadlineStack, Kicker } from "../components/Text";
import { LightRays, MistBands, Motes } from "../core/fx/atmosphere";
import { ScribbleCircle } from "../core/fx/marks";
import { squashOnImpact } from "../core/motion/acting";
import { bounce } from "../core/motion/physics";
import { backOut, powOut, track, type Key } from "../core/motion/tracks";
import { ATMOSPHERE, CINEMA, COLORS, FONTS, MARK_STYLE, SAFE_AREA, TYPE, VIDEO } from "../lib/brand";
import { MIX } from "../lib/mix";
import { SFX, SFX_MIX, WHOOSH_PEAK_SECONDS, type SfxName } from "../lib/sfx";
import { cueFrame, type Beat } from "../lib/timeline";
import { SHIO_CAM, SHIO_CARD, SHIO_ORDER, SHIO_PILLARS, WHEEL } from "../products/shifupo/shio";
import { PILLAR } from "../components/Pillars";
import type { ShioReelProps, ShioScene } from "../schema";

type Ctx = { scenes: ShioScene[]; beats: Beat[] };
const cueOf = (c: Ctx, i: number, word: string) => cueFrame(c.beats[i], c.scenes[i].vo, word);
const idx = (c: Ctx, type: ShioScene["type"]) => c.scenes.findIndex((s) => s.type === type);

// ------------------------------------------------------------------ camera
const wheelCam = (frame: number, c: Ctx, yearSign: ShioReelProps["yearSign"]): WheelCam => {
  const F = (t: ShioScene["type"]) => c.beats[idx(c, t)].startFrame;
  const T = SHIO_CAM.travelFrames;
  const yi = SHIO_ORDER.indexOf(yearSign);
  const rot0 = -(yi * 30);
  const ally = c.scenes[idx(c, "ally")].signs[0]?.sign ?? yearSign;
  const ai = SHIO_ORDER.indexOf(ally);
  const rotAlly = -(((ai + yi) / 2) * 30);
  const allyCy = SHIO_CAM.allyPairY + WHEEL.radius * SHIO_CAM.allyScale * Math.cos(Math.PI / 12);
  const hookLand = F("hook") + 26;
  const s: Key[] = [
    [0, SHIO_CAM.hookFromScale],
    [hookLand, 1, backOut(1.4)],
    [F("year"), 1],
    [F("year") + T, SHIO_CAM.yearScale],
    [F("trine"), SHIO_CAM.yearScale],
    [F("trine") + T, 1],
    [F("ally"), 1],
    [F("ally") + T, SHIO_CAM.allyScale],
    [F("clash"), SHIO_CAM.allyScale],
    [F("clash") + SHIO_CAM.clashTravel, SHIO_CAM.clashScale],
    [F("pillar") + 6, SHIO_CAM.clashScale],
    [F("pillar") + T + 10, SHIO_CAM.pillarScale],
  ];
  const cy: Key[] = [
    [0, WHEEL.cy],
    [F("ally"), WHEEL.cy],
    [F("ally") + T, allyCy],
    [F("clash"), allyCy],
    [F("clash") + SHIO_CAM.clashTravel, SHIO_CAM.clashY],
    [F("pillar") + 6, SHIO_CAM.clashY],
    [F("pillar") + T + 10, SHIO_CAM.pillarY],
  ];
  const rot: Key[] = [
    [0, rot0 + SHIO_CAM.hookSpin],
    [hookLand, rot0, powOut(3)],
    [F("trine"), rot0 - SHIO_CAM.drift],
    [F("trine") + T, rot0],
    [F("ally"), rot0 + SHIO_CAM.drift / 2],
    [F("ally") + T, rotAlly],
    [F("clash"), rotAlly - SHIO_CAM.drift],
    [F("clash") + SHIO_CAM.clashTravel, rot0 + SHIO_CAM.clashSpin, powOut(2)],
    [F("pillar"), rot0 + SHIO_CAM.clashSpin - SHIO_CAM.drift],
  ];
  const op: Key[] = [
    [0, 1],
    [F("year"), 1],
    [F("year") + T, SHIO_CAM.yearOpacity],
    [F("trine"), SHIO_CAM.yearOpacity],
    [F("trine") + T, 1],
    [F("pillar") + 10, 1],
    [F("pillar") + T + 16, 0],
  ];
  const breathe = 1 + SHIO_CAM.breathe * Math.sin((frame / SHIO_CAM.breathePeriod) * Math.PI * 2);
  return { cx: WHEEL.cx, cy: track(frame, cy), s: track(frame, s) * breathe, rot: track(frame, rot) + frame * SHIO_CAM.idleTurn, opacity: track(frame, op) };
};

// ------------------------------------------------------------------ pieces
const World: React.FC<{ c: Ctx }> = ({ c }) => {
  const frame = useCurrentFrame();
  const keys = c.beats.map((b) => b.startFrame);
  const lift = interpolate(frame, keys, [0, -30, 40, 90, 20, 60, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Paper />
      <LightRays width={VIDEO.width} height={VIDEO.height} seed="shio-rays" {...ATMOSPHERE.rays} />
      <MistBands width={VIDEO.width} height={VIDEO.height} seed="shio-mist-far" {...ATMOSPHERE.mistFar} />
      <InkMountains parallax={frame * SHIO_CAM.mountainParallax} lift={lift} opacity={0.85} />
      <MistBands width={VIDEO.width} height={VIDEO.height} seed="shio-mist-near" {...ATMOSPHERE.mistNear} />
      <Bamboo opacity={0.8} />
      <Petals />
      <Motes width={VIDEO.width} height={VIDEO.height} seed="shio-motes" {...ATMOSPHERE.motes} />
    </>
  );
};

const Titles: React.FC<{ scene: ShioScene; beat: Beat }> = ({ scene, beat }) => {
  const cue = (w: string) => cueFrame(beat, scene.vo, w);
  const first = scene.lines[0];
  return (
    <HeadlineStack align="center">
      {scene.kicker && first ? <Kicker text={scene.kicker} start={cue(first.cueWord) - 6} out={beat.endFrame} /> : null}
      {scene.lines.map((l, i) => (
        <HeadlineLine
          key={l.text}
          text={l.text}
          cue={cue(l.cueWord)}
          out={beat.endFrame}
          accent={l.accent}
          variant={i === 0 && scene.type !== "pillar" ? "slam" : "rise"}
          size={scene.type === "hook" ? TYPE.hook : TYPE.headline}
        />
      ))}
    </HeadlineStack>
  );
};

// Date card: dropped on its cue, bounces with real gravity, squashes on the
// first impact, sparks fly.
const DateCard: React.FC<{ text: string; sub?: string; cue: number; out: number }> = ({ text, sub, cue, out }) => {
  const frame = useCurrentFrame();
  // Released so the first impact lands exactly on the cue word.
  const fall = Math.sqrt((2 * -SHIO_CARD.dropFrom) / SHIO_CARD.gravity);
  const drop = cue - Math.round(fall);
  if (frame < drop || frame >= out) {
    return null;
  }
  const b = bounce(frame, drop, { height: -SHIO_CARD.dropFrom, gravity: SHIO_CARD.gravity, restitution: 0.32, minHop: 6 });
  const [sx, sy] = squashOnImpact(b.sinceImpact, Math.min(1, b.impactSpeed / 60), 12);
  const leave = Math.min(1, Math.max(0, (frame - (out - 8)) / 8));
  const W = SHIO_CARD.width;
  const H = SHIO_CARD.height;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: VIDEO.width / 2 - W / 2,
          top: SHIO_CARD.y - H / 2 - b.y,
          width: W,
          height: H,
          transform: `rotate(${-3 + (b.resting ? Math.sin(((frame - cue) / SHIO_CARD.swayPeriod) * Math.PI * 2) * SHIO_CARD.swayDeg * Math.exp(-(frame - cue) / 90) : 0)}deg) scale(${sx * (1 - leave * 0.2)}, ${sy * (1 - leave * 0.2)})`,
          transformOrigin: "50% 100%",
          opacity: 1 - leave,
          borderRadius: 22,
          background: `linear-gradient(135deg, ${COLORS.sealDeep}, ${COLORS.seal} 55%, #C42A2F)`,
          border: `6px solid ${COLORS.gold}`,
          boxShadow: "0 28px 50px rgba(18,16,14,0.35)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: SHIO_CARD.textSize, color: COLORS.paper, letterSpacing: "0.04em", lineHeight: 1 }}>{text}</div>
        {sub ? <div style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: SHIO_CARD.subSize, color: COLORS.goldLight, letterSpacing: "0.3em" }}>{sub}</div> : null}
      </div>
      <Sparkles cx={VIDEO.width / 2} cy={SHIO_CARD.y + H / 2 - 20} start={cue} count={14} spread={320} />
    </AbsoluteFill>
  );
};

const Cta: React.FC<{ scene: ShioScene; beat: Beat; brand: ShioReelProps["brand"] }> = ({ scene, beat, brand }) => {
  const cue = (w: string) => cueFrame(beat, scene.vo, w);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60, top: -80 }}>
      <LogoPlate start={beat.startFrame - 4} glyph={brand.sealGlyph} name={brand.name} descriptor={brand.descriptor} />
      {scene.button ? <WhatsAppButton text={scene.button.text} cue={cue(scene.button.cueWord)} /> : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ reel
export const ShioReel: React.FC<ShioReelProps> = ({ scenes, beats, brand, debug, yearSign, yearLabel }) => {
  const frame = useCurrentFrame();
  if (!beats) {
    return <AbsoluteFill style={{ backgroundColor: COLORS.paper }} />;
  }
  const c: Ctx = { scenes, beats };
  const cam = wheelCam(frame, c, yearSign);
  const iHook = idx(c, "hook");
  const iYear = idx(c, "year");
  const iPillar = idx(c, "pillar");
  const iCta = idx(c, "cta");
  const hookScene = scenes[iHook];
  const heroFrom = hookScene.lines[0] ? cueOf(c, iHook, hookScene.lines[0].cueWord) : beats[iHook].startFrame + 20;

  const lit: LitWindow[] = [];
  const links: LinkWindow[] = [];
  scenes.forEach((s, i) => {
    for (const g of s.signs) {
      lit.push({ sign: g.sign, label: g.label, from: cueOf(c, i, g.cueWord) - 2, to: beats[i].endFrame });
    }
    if (s.link) {
      const from = cueOf(c, i, s.link.cueWord) - 2;
      links.push({ kind: s.link.kind, members: [...s.signs.map((g) => g.sign), yearSign], from, to: beats[i].endFrame });
      lit.push({ sign: yearSign, label: yearLabel, from, to: beats[i].endFrame });
    }
  });

  // Pillars: the year sign lands in the first one, the others follow.
  const pillarScene = scenes[iPillar];
  const pStart = beats[iPillar].startFrame;
  const span = pillarScene.pillars.length * PILLAR.width + (pillarScene.pillars.length - 1) * PILLAR.gap;
  const yearPillarTarget = { x: SHIO_PILLARS.x - span / 2 + PILLAR.width / 2, y: SHIO_PILLARS.y - PILLAR.height * 0.6 };
  const flight = { from: pStart + 4, to: pStart + 30, target: yearPillarTarget };
  const emptyCue = pillarScene.lines[0] ? cueOf(c, iPillar, pillarScene.lines[0].cueWord) : pStart + 30;
  const pillarCues = pillarScene.pillars.map((_, k) => (k === 0 ? flight.to : emptyCue + 2 + k * 5));

  const yearScene = scenes[iYear];
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <World c={c} />
      {frame < beats[iCta].startFrame ? (
        <ShioWheel frame={frame} cam={cam} yearSign={yearSign} heroFrom={heroFrom} heroFlight={flight} lit={lit} links={links} />
      ) : (
        <ShioWheel
          frame={frame}
          cam={{
            cx: WHEEL.cx,
            cy: WHEEL.cy,
            s: SHIO_CAM.ctaWheelScale,
            rot: (frame - beats[iCta].startFrame) * SHIO_CAM.ctaWheelTurn,
            opacity: SHIO_CAM.ctaWheelOpacity * Math.min(1, (frame - beats[iCta].startFrame) / 16),
          }}
          yearSign={yearSign}
          heroFrom={heroFrom}
          heroFlight={flight}
          lit={[]}
          links={[]}
        />
      )}
      {pillarScene.pillars.length > 0 && frame >= pStart && frame < beats[iPillar].endFrame + 16 ? (
        <AbsoluteFill style={{ opacity: 1 - Math.min(1, Math.max(0, (frame - (beats[iPillar].endFrame + 4)) / 12)) }}>
          <svg width={VIDEO.width} height={VIDEO.height}>
            <g transform={`translate(${SHIO_PILLARS.x} ${SHIO_PILLARS.y})`}>
              <Pillars pillars={pillarScene.pillars} start={pStart + 8} cues={pillarCues} exitStart={beats[iPillar].endFrame + 2} id="shio-pillars" />
            </g>
          </svg>
        </AbsoluteFill>
      ) : null}
      {yearScene.card ? (
        <DateCard text={yearScene.card.text} sub={yearScene.card.sub} cue={cueOf(c, iYear, yearScene.card.cueWord)} out={beats[iYear].endFrame + SHIO_CARD.overlapFrames} />
      ) : null}
      {/* Hand-drawn circle around the burning year sign on its word. */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <svg width={VIDEO.width} height={VIDEO.height}>
          <ScribbleCircle
            frame={frame}
            cue={heroFrom + 8}
            out={beats[iHook].endFrame}
            style={MARK_STYLE}
            x={cam.cx}
            y={cam.cy}
            rx={WHEEL.heroRadius * Math.min(cam.s, WHEEL.heroMaxScale) * 1.55}
            ry={WHEEL.heroRadius * Math.min(cam.s, WHEEL.heroMaxScale) * 1.4}
            seed="shio-hero"
          />
        </svg>
      </AbsoluteFill>
      {scenes.map((scene, i) => {
        const beat = beats[i];
        if (frame < beat.startFrame || frame >= beat.endFrame) {
          return null;
        }
        return scene.type === "cta" ? <Cta key={`ui-${i}`} scene={scene} beat={beat} brand={brand} /> : <Titles key={`ui-${i}`} scene={scene} beat={beat} />;
      })}
      {scenes.map((scene, i) => {
        const beat = beats[i];
        return (
          <Sequence key={`cap-${i}`} from={beat.startFrame} durationInFrames={beat.endFrame - beat.startFrame} layout="none">
            <Caption
              words={beat.words.map((w) => ({ text: w.text, startFrame: w.startFrame - beat.startFrame, endFrame: w.endFrame - beat.startFrame }))}
              highlight={scene.voHighlight}
            />
          </Sequence>
        );
      })}

      {/* Audio: VO, cue-word sound effects, camera whooshes, bed. */}
      {beats.map((beat) =>
        beat.voSrc ? (
          <Sequence key={beat.voSrc} from={beat.voStartFrame} layout="none">
            <Audio src={staticFile(beat.voSrc)} volume={MIX.vo * (beat.voGain ?? 1)} />
          </Sequence>
        ) : null,
      )}
      {scenes.flatMap((scene, i) =>
        scene.sfx
          .filter((s) => s.sound in SFX)
          .map((s) => {
            const name = s.sound as SfxName;
            const cue = cueOf(c, i, s.cueWord);
            // A whoosh peaks before its word so it never masks the word.
            const at = name === "whoosh" ? cue - Math.round(WHOOSH_PEAK_SECONDS * VIDEO.fps) - CINEMA.whooshLeadFrames : cue - 2;
            const gain = name === "whoosh" ? CINEMA.whooshUnderVo : 1;
            return (
              <Sequence key={`sfx-${i}-${s.cueWord}-${s.sound}`} from={Math.max(0, at)} layout="none">
                <Audio src={staticFile(SFX[name])} volume={SFX_MIX[name] * gain} />
              </Sequence>
            );
          }),
      )}
      {[idx(c, "ally"), idx(c, "clash"), iPillar].map((i) => (
        // Peaks before the beat's voice starts: peaking on the first word masked
        // it ("Tapi shio" lost "shio" in the whisper check).
        <Sequence key={`travel-${i}`} from={Math.max(0, beats[i].voStartFrame - Math.round(WHOOSH_PEAK_SECONDS * VIDEO.fps) - CINEMA.whooshLeadFrames)} layout="none">
          <Audio src={staticFile(SFX.whoosh)} volume={SFX_MIX.whoosh * 0.6} />
        </Sequence>
      ))}
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
