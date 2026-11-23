// Quiz format (sp08): an interactive-feeling A/B quiz in a fresh paper living
// room. Ask: the question card drops, two answer cards fall and bounce on
// their spoken letters, then a silent countdown ring (3-2-1) gives the viewer
// time to answer. Reveal: the right card jumps with a stamp, the wrong one
// shudders and gets crossed out. The host reacts throughout; the camera
// breathes and leans toward the right answer.

import { Audio } from "@remotion/media";
import { noise2D } from "@remotion/noise";
import { AbsoluteFill, getRemotionEnvironment, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { LogoPlate, WhatsAppButton } from "../components/Brand";
import { Sparkles } from "../components/Fx";
import { QuizArt } from "../components/QuizProps";
import { ShioBuddy } from "../components/ShioBuddy";
import { Caption, HeadlineLine, HeadlineStack, Kicker } from "../components/Text";
import { Stamp } from "../core/fx/marks";
import { idle, squashOnImpact } from "../core/motion/acting";
import { bounce } from "../core/motion/physics";
import { backOut, powInOut } from "../core/motion/tracks";
import { PaperDefs, usePaperFilter } from "../core/paper/paper";
import { CINEMA, COLORS, FONTS, MARK_STYLE, SAFE_AREA, TYPE, VIDEO } from "../lib/brand";
import { MIX } from "../lib/mix";
import { SFX, SFX_MIX, WHOOSH_PEAK_SECONDS, type SfxName } from "../lib/sfx";
import { cueFrame, type Beat } from "../lib/timeline";
import { QUIZ_COLORS as C, QUIZ_LAYOUT as L, QUIZ_MOTION as M, QUIZ_PAPER, QUIZ_SCORE } from "../products/shifupo/quiz";
import type { QuizReelProps, QuizScene } from "../schema";

// Set by scripts/render.ts for the audio pass: no pictures needed there.
const AUDIO_ONLY = Boolean(process.env.REMOTION_AUDIO_ONLY);

type Ctx = { scenes: QuizScene[]; beats: Beat[] };
const c01 = (t: number) => Math.min(1, Math.max(0, t));
const cueOf = (c: Ctx, i: number, w: string) => cueFrame(c.beats[i], c.scenes[i].vo, w);
const cardX = (key: "A" | "B") => VIDEO.width / 2 + (key === "A" ? -1 : 1) * (L.cardW / 2 + L.cardGap / 2);
const fallFrames = Math.round(Math.sqrt((2 * -L.dropFrom) / M.cardGravity));
// Countdown window of an ask beat: from the end of its line to the beat end.
const countdownOf = (b: Beat) => ({ from: b.voStartFrame + b.voDurationInFrames, to: b.endFrame });

// ------------------------------------------------------------------ room
const Room: React.FC<{ camX: number; camZ: number }> = ({ camX, camZ }) => {
  const frame = useCurrentFrame();
  const filter = usePaperFilter();
  const { width: W, height: H } = VIDEO;
  const par = (f: number) => `translate(${W / 2} ${L.cardsY}) scale(${1 + (camZ - 1) * f}) translate(${-(W / 2 + (camX - W / 2) * f)} ${-L.cardsY})`;
  const swing = Math.sin(frame / 34) * 6;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.wallTop} 0%, ${C.wallBottom} 100%)` }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <g transform={par(0.35)}>
          {/* Window with drifting clouds. */}
          <g filter={filter}>
            <rect x={L.winX - 14} y={L.winY - 14} width={L.winW + 28} height={L.winH + 28} rx={16} fill={C.windowFrame} />
            <rect x={L.winX} y={L.winY} width={L.winW} height={L.winH} rx={10} fill={C.window} />
          </g>
          <clipPath id="quiz-win">
            <rect x={L.winX} y={L.winY} width={L.winW} height={L.winH} rx={10} />
          </clipPath>
          <g clipPath="url(#quiz-win)">
            {[0, 1].map((k) => {
              const x = L.winX - 120 + ((frame * (0.9 + k * 0.5) + k * 200) % (L.winW + 240));
              return (
                <g key={k} transform={`translate(${x} ${L.winY + 70 + k * 80})`}>
                  <ellipse rx={60} ry={22} fill={C.cloud} />
                  <circle cx={-22} cy={-12} r={24} fill={C.cloud} />
                  <circle cx={16} cy={-18} r={30} fill={C.cloud} />
                </g>
              );
            })}
          </g>
          <line x1={L.winX + L.winW / 2} y1={L.winY} x2={L.winX + L.winW / 2} y2={L.winY + L.winH} stroke={C.windowFrame} strokeWidth={10} />
          <line x1={L.winX} y1={L.winY + L.winH / 2} x2={L.winX + L.winW} y2={L.winY + L.winH / 2} stroke={C.windowFrame} strokeWidth={10} />
          {/* Hanging lamp on the left, swinging. */}
          <g transform={`translate(170 -40) rotate(${swing})`}>
            <line x1={0} y1={0} x2={0} y2={200} stroke={C.cord} strokeWidth={4} />
            <g transform="translate(0 200)" filter={filter}>
              <circle cy={34} r={60} fill={C.lamp} opacity={0.28} />
              <path d="M-60 30 q60 -80 120 0 z" fill={C.lampShade} />
              <circle cy={34} r={16} fill={C.lamp} />
            </g>
          </g>
        </g>
        <g transform={par(0.7)}>
          {/* Wainscot and floor. */}
          <rect x={-400} y={1300} width={W + 800} height={L.floorY - 1300} fill={C.wainscot} />
          {Array.from({ length: 20 }, (_, k) => (
            <line key={k} x1={-400 + k * 100} y1={1300} x2={-400 + k * 100} y2={L.floorY} stroke={C.wainscotLine} strokeWidth={4} />
          ))}
          <rect x={-400} y={L.floorY} width={W + 800} height={H - L.floorY + 400} fill={C.floor} />
          {Array.from({ length: 6 }, (_, k) => (
            <line key={`f${k}`} x1={-400} y1={L.floorY + 40 + k * 70} x2={W + 400} y2={L.floorY + 40 + k * 70} stroke={C.floorLine} strokeWidth={3} opacity={0.6} />
          ))}
          <g transform={`translate(110 ${L.floorY + 10}) scale(1.1)`} filter={filter}>
            <QuizArt prop="plant-alive" />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ cards
const AnswerCard: React.FC<{
  frame: number;
  x: number;
  keyLetter: "A" | "B";
  text: string;
  prop: QuizScene["options"][number]["prop"];
  drop: number; // release frame (face down)
  flipAt: number; // turns face up on its spoken letter
  state: { right: number; wrong: number; cross: number; out: number; since: number };
}> = ({ frame, x, keyLetter, text, prop, drop, flipAt, state }) => {
  const filter = usePaperFilter();
  if (frame < drop) {
    return null;
  }
  const b = bounce(frame, drop, { height: -L.dropFrom, gravity: M.cardGravity, restitution: M.cardRestitution, minHop: 5 });
  const [sx, sy] = squashOnImpact(b.sinceImpact, Math.min(1, b.impactSpeed / 70), 12);
  const shake = state.wrong > 0 ? Math.sin(state.since * 2.2) * M.wrongShakePx * (1 - c01(state.since / M.wrongShakeFrames)) : 0;
  const scale = 1 + (M.rightScale - 1) * backOut(2)(state.right);
  const hover = b.resting ? idle(`card-${keyLetter}`, frame, M.cardHoverPx, M.cardHoverDeg) : { y: 0, rotate: 0 };
  const y = L.cardsY - b.y + state.out * 900 + hover.y;
  const op = (1 - state.wrong * (1 - M.wrongDim)) * (1 - state.out);
  const w = L.cardW;
  const h = L.cardH;
  const badge = keyLetter === "A" ? C.badgeA : C.badgeB;
  // Flip: scaleX 1 -> 0 (back) then 0 -> 1 (face) around the letter cue.
  const f = (frame - (flipAt - M.flipFrames / 2)) / M.flipFrames;
  const faceUp = f >= 0.5;
  const flipX = f <= 0 ? 1 : f >= 1 ? 1 : Math.abs(Math.cos(Math.PI * f));
  if (!faceUp) {
    return (
      <g transform={`translate(${x} ${y}) rotate(${hover.rotate}) scale(${sx * flipX} ${sy})`}>
        <g filter={filter}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={L.cardRadius} fill={badge} />
        </g>
        <rect x={-w / 2 + 22} y={-h / 2 + 22} width={w - 44} height={h - 44} rx={L.cardRadius - 10} fill="none" stroke={C.card} strokeWidth={6} strokeDasharray="18 12" opacity={0.8} />
        <text textAnchor="middle" dominantBaseline="central" y={-30} fontFamily={FONTS.body} fontWeight={800} fontSize={190} fill={C.card}>
          ?
        </text>
        <text textAnchor="middle" dominantBaseline="central" y={h / 2 - 80} fontFamily={FONTS.body} fontWeight={800} fontSize={L.badgeSize + 10} fill={C.card}>
          {keyLetter}
        </text>
      </g>
    );
  }
  return (
    <g transform={`translate(${x + shake} ${y}) rotate(${hover.rotate}) scale(${scale * sx * flipX} ${scale * sy})`} opacity={op}>
      <g filter={filter}>
        {state.right > 0 ? <rect x={-w / 2 - 14} y={-h / 2 - 14} width={w + 28} height={h + 28} rx={L.cardRadius + 10} fill={C.right} opacity={state.right} /> : null}
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={L.cardRadius} fill={C.card} />
      </g>
      <g transform={`translate(0 ${-h * 0.08})`}>
        <QuizArt prop={prop} scale={L.artScale} />
      </g>
      <g transform={`translate(${-w / 2 + 52} ${-h / 2 + 52})`}>
        <circle r={L.badgeR} fill={badge} />
        <text textAnchor="middle" dominantBaseline="central" fontFamily={FONTS.body} fontWeight={800} fontSize={L.badgeSize} fill={C.card}>
          {keyLetter}
        </text>
      </g>
      <foreignObject x={-w / 2 + 20} y={h / 2 - 118} width={w - 40} height={104}>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontFamily: FONTS.body,
            fontWeight: 800,
            fontSize: L.labelSize,
            lineHeight: 1.1,
            color: C.ink,
          }}
        >
          {text}
        </div>
      </foreignObject>
      {state.cross > 0 ? (
        <g stroke={C.wrong} strokeWidth={16} strokeLinecap="round" fill="none">
          <path d={`M${-w * 0.32} ${-h * 0.3} L${w * 0.32} ${h * 0.3}`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - c01(state.cross * 2)} />
          <path d={`M${w * 0.32} ${-h * 0.3} L${-w * 0.32} ${h * 0.3}`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - c01(state.cross * 2 - 1)} />
        </g>
      ) : null}
    </g>
  );
};

const QuestionCard: React.FC<{ frame: number; kicker?: string; text: string; from: number; to: number }> = ({ frame, kicker, text, from, to }) => {
  if (frame < from || frame >= to) {
    return null;
  }
  const inT = backOut(1.6)(c01((frame - from) / 12));
  const outT = powInOut(2)(c01((frame - (to - 8)) / 8));
  return (
    <div
      style={{
        position: "absolute",
        left: VIDEO.width / 2 - L.questionWidth / 2,
        top: L.questionTop,
        width: L.questionWidth,
        transform: `translateY(${(1 - inT) * -260 - outT * 120 + Math.sin(frame / 22) * M.cardHoverPx}px) rotate(${-1.5 + outT * 4 + Math.sin(frame / 31) * 1.2}deg)`,
        opacity: 1 - outT,
        background: C.card,
        borderRadius: 28,
        padding: "26px 34px 30px",
        boxShadow: `9px 12px 0 ${C.shadow}`,
        textAlign: "center",
      }}
    >
      {kicker ? (
        <div style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: L.kickerSize, letterSpacing: "0.18em", color: COLORS.seal, marginBottom: 8 }}>{kicker}</div>
      ) : null}
      <div style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: L.questionSize, lineHeight: 1.12, color: C.ink }}>{text}</div>
    </div>
  );
};

const Countdown: React.FC<{ frame: number; from: number; to: number; label: string }> = ({ frame, from, to, label }) => {
  if (frame < from - 4 || frame >= to) {
    return null;
  }
  const span = Math.max(1, to - from);
  const t = c01((frame - from) / span);
  const n = Math.max(1, 3 - Math.floor(t * 3));
  const sinceNum = (frame - from) % Math.ceil(span / 3);
  const pop = backOut(2.2)(c01(sinceNum / 8));
  const appear = backOut(2)(c01((frame - (from - 4)) / 8));
  const r = L.ringR;
  const circ = 2 * Math.PI * r;
  return (
    <g transform={`translate(${VIDEO.width / 2} ${L.ringY}) scale(${appear})`}>
      <circle r={r + 14} fill={C.card} />
      <circle r={r} fill={C.ringFill} />
      <circle r={r} fill="none" stroke={C.ring} strokeWidth={12} strokeDasharray={circ} strokeDashoffset={circ * t} transform="rotate(-90)" strokeLinecap="round" />
      <text textAnchor="middle" dominantBaseline="central" fontFamily={FONTS.body} fontWeight={800} fontSize={L.ringNumber * pop} fill={C.ink}>
        {n}
      </text>
      <g transform={`translate(0 ${-r - 46}) rotate(-4)`}>
        <rect x={-label.length * 13 - 22} y={-26} width={label.length * 26 + 44} height={52} rx={12} fill={C.wrong} />
        <text textAnchor="middle" dominantBaseline="central" fontFamily={FONTS.body} fontWeight={800} fontSize={L.ringLabelSize} letterSpacing="0.1em" fill={C.card}>
          {label}
        </text>
      </g>
    </g>
  );
};

const Stars: React.FC<{ frame: number; from: number; to: number }> = ({ frame, from, to }) => {
  const filter = usePaperFilter();
  if (frame < from || frame >= to) {
    return null;
  }
  const leave = c01((frame - (to - 10)) / 10);
  const star = (r: number) => {
    const pts: string[] = [];
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? r * 0.46 : r;
      pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return (
    <g opacity={1 - leave}>
      {[-1, 0, 1].map((k, i) => {
        const p = backOut(2.4)(c01((frame - from - i * 4) / 10));
        const spin = (1 - p) * 120 + Math.sin(frame / 12 + i) * 8;
        const twinkle = 1 + Math.sin(frame / 7 + i * 2) * 0.06;
        return (
          <g key={k} transform={`translate(${VIDEO.width / 2 + k * QUIZ_SCORE.starGap} ${QUIZ_SCORE.starY + (k === 0 ? -30 : 0) + Math.sin(frame / 15 + i) * 10}) rotate(${spin}) scale(${p * twinkle})`} filter={filter}>
            <polygon points={star(QUIZ_SCORE.starR)} fill={C.star} />
          </g>
        );
      })}
      {(() => {
        const p = backOut(2)(c01((frame - from - 12) / 12));
        const dots = [0, 1, 2].map((d) => 0.4 + 0.6 * Math.abs(Math.sin((frame - from) / 6 - d * 0.8)));
        return (
          <g transform={`translate(${QUIZ_SCORE.bubbleX} ${QUIZ_SCORE.bubbleY}) scale(${p})`} filter={filter}>
            <rect x={-150} y={-62} width={300} height={124} rx={46} fill={C.bubble} />
            <path d="M-60 58 l-30 46 l60 -40 z" fill={C.bubble} />
            {dots.map((o, d) => (
              <circle key={d} cx={-60 + d * 60} cy={0} r={16} fill={C.ink} opacity={o} />
            ))}
          </g>
        );
      })()}
    </g>
  );
};

// Turning sunburst behind the score and the logo: big-area motion for the
// ending, which otherwise held still (qc-motion quiet seconds).
const Sunburst: React.FC<{ frame: number; from: number }> = ({ frame, from }) => {
  if (frame < from) {
    return null;
  }
  const appear = powInOut(2)(c01((frame - from) / 16));
  const n = M.burstRays;
  const r = M.burstRadius;
  return (
    <g clipPath="url(#quiz-wall)">
      <clipPath id="quiz-wall">
        <rect x={-VIDEO.width} y={-VIDEO.height} width={VIDEO.width * 3} height={VIDEO.height + M.burstClipY} />
      </clipPath>
    <g transform={`translate(${VIDEO.width / 2} ${M.burstY}) rotate(${frame * M.burstTurn}) scale(${0.6 + 0.4 * appear})`} opacity={appear * M.burstOpacity}>
      {Array.from({ length: n }, (_, k) => {
        const a0 = (k / n) * Math.PI * 2;
        const a1 = ((k + 0.5) / n) * Math.PI * 2;
        return <path key={k} d={`M0 0 L${Math.cos(a0) * r} ${Math.sin(a0) * r} L${Math.cos(a1) * r} ${Math.sin(a1) * r} Z`} fill={C.burst} />;
      })}
    </g>
    </g>
  );
};

// ------------------------------------------------------------------ reel
export const QuizReel: React.FC<QuizReelProps> = ({ scenes, beats, brand, debug, host, countdownLabel }) => {
  const frame = useCurrentFrame();
  if (!beats) {
    return <AbsoluteFill style={{ backgroundColor: C.wallBottom }} />;
  }
  const c: Ctx = { scenes, beats };
  let cur = beats.findIndex((b) => frame < b.endFrame);
  if (cur < 0) {
    cur = beats.length - 1;
  }
  const scene = scenes[cur];

  // Camera: breathing, a little handheld drift, a lean toward the right
  // answer while it is stamped.
  let lean = 0;
  let zoom = 1;
  scenes.forEach((s, i) => {
    if (s.type === "reveal" && s.answer && s.stamp) {
      const at = cueOf(c, i, s.stamp.cueWord);
      const k = c01((frame - at) / M.followFrames) * (1 - c01((frame - (beats[i].endFrame - M.followFrames)) / M.followFrames));
      const e = powInOut(2)(k);
      lean += (cardX(s.answer) - VIDEO.width / 2) * 0.5 * e;
      zoom += (M.focusZoom - 1) * e;
    }
  });
  const camX = VIDEO.width / 2 + lean + noise2D("quiz-cam", frame / M.driftPeriod, 0) * M.driftPx;
  const camZ = zoom * (1 + M.breathe * Math.sin((frame / M.breathePeriod) * Math.PI * 2));

  // Host: big in the hook, small under the countdown ring, medium for the
  // score and the call to action; hops between sizes at each beat start.
  const hookEnd = beats[0].endFrame;
  const hostPose = (t: QuizScene["type"]) =>
    t === "hook" ? { y: L.hostBigY, s: L.hostBigScale } : t === "score" || t === "cta" ? { y: L.hostMidY, s: L.hostMidScale } : { y: L.hostY, s: L.hostScale };
  const prevPose = hostPose(scenes[Math.max(0, cur - 1)].type);
  const nextPose = hostPose(scene.type);
  const hp = cur === 0 ? 1 : powInOut(2)(c01((frame - beats[cur].startFrame) / 16));
  const hostDrop = bounce(frame, -M.hookLead, { height: 700, gravity: 3.2, restitution: 0.35, minHop: 5 });
  const hopArc = cur === 0 ? 0 : Math.sin(Math.PI * hp) * 60 * (prevPose.s !== nextPose.s ? 1 : 0);
  const hostY = prevPose.y + (nextPose.y - prevPose.y) * hp - hopArc - (frame < hookEnd ? hostDrop.y : 0);
  const hostS = prevPose.s + (nextPose.s - prevPose.s) * hp;
  const shrink = c01((frame - (hookEnd - 6)) / 16);
  const hostLife = idle("quiz-host", frame, M.hostBobPx, M.hostSwayDeg);
  const ask = scene.type === "ask" ? countdownOf(beats[cur]) : null;
  const tapping = ask && frame >= ask.from ? Math.abs(Math.sin(((frame - ask.from) / M.tapEvery) * Math.PI)) * M.tapPx : 0;
  const cheer = scene.type === "reveal" && scene.stamp ? (() => {
    const at = cueOf(c, cur, scene.stamp.cueWord);
    const t = frame - at;
    return t >= 0 && t < 30 ? Math.sin((t / 30) * Math.PI) * 60 : 0;
  })() : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: C.wallBottom }}>
      {/* The audio-only pass (scripts/render.ts) skips every visual layer. */}
      {AUDIO_ONLY ? null : (
        <>
          <PaperDefs fx={QUIZ_PAPER} />
          <Room camX={camX} camZ={camZ} />
          <AbsoluteFill style={{ transform: `translateX(${VIDEO.width / 2 - camX}px) scale(${camZ})`, transformOrigin: `${camX}px ${L.cardsY}px` }}>
            <svg width={VIDEO.width} height={VIDEO.height} style={{ overflow: "visible" }}>
              {scenes.map((s, i) => (s.type === "score" ? <Sunburst key={`burst-${i}`} frame={frame} from={beats[i].startFrame - M.scoreLead} /> : null))}
              {/* Answer cards of every ask (they stay through its reveal). */}
              {scenes.flatMap((s, i) => {
                if (s.type !== "ask") {
                  return [];
                }
                const rev = scenes[i + 1];
                const rb = beats[i + 1];
                const stampAt = rev?.stamp ? cueOf(c, i + 1, rev.stamp.cueWord) : rb.startFrame + 10;
                const exitAt = rb.endFrame - M.exitFrames;
                if (frame >= rb.endFrame + 2) {
                  return [];
                }
                return s.options.map((o) => {
                  const isRight = rev?.answer === o.key;
                  const since = frame - stampAt;
                  const state = {
                    right: isRight ? c01(since / 10) : 0,
                    wrong: !isRight && since >= 0 ? 1 : 0,
                    cross: !isRight ? c01((since - 4) / M.crossFrames) : 0,
                    out: powInOut(2)(c01((frame - exitAt) / M.exitFrames)),
                    since,
                  };
                  return (
                    <AnswerCard
                      key={`card-${i}-${o.key}`}
                      frame={frame}
                      x={cardX(o.key)}
                      keyLetter={o.key}
                      text={o.text}
                      prop={o.prop}
                      drop={beats[i].startFrame + M.backDropDelay + (o.key === "A" ? 0 : M.backDropStagger) - fallFrames}
                      flipAt={cueOf(c, i, o.cueWord)}
                      state={state}
                    />
                  );
                });
              })}
              {scene.type === "reveal" && scene.stamp && scene.answer ? (
                <Stamp
                  frame={frame}
                  cue={cueOf(c, cur, scene.stamp.cueWord)}
                  out={beats[cur].endFrame - M.exitFrames}
                  style={{ ...MARK_STYLE, stampColor: C.right }}
                  x={cardX(scene.answer)}
                  y={L.cardsY - L.cardH * 0.12}
                  text={scene.stamp.text}
                  angle={-10}
                />
              ) : null}
              {ask ? <Countdown frame={frame} from={ask.from} to={ask.to} label={countdownLabel} /> : null}
              {/* Hook: three "?" cards pop on "tiga". */}
              {scene.type === "hook"
                ? [-1, 0, 1].map((k, i) => {
                    const wig = scene.sfx[0] ? cueOf(c, cur, scene.sfx[0].cueWord) + i * 4 : Infinity;
                    const drop = bounce(frame, -M.hookLead + i * 3, { height: 900, gravity: 4, restitution: 0.35, minHop: 5 });
                    const w = frame >= wig && frame < wig + 16 ? Math.sin(((frame - wig) / 16) * Math.PI * 2) * 12 : 0;
                    const p = 1 - shrink;
                    return p > 0 ? (
                      <g key={k} transform={`translate(${VIDEO.width / 2 + k * 230} ${760 - drop.y}) rotate(${k * 8 + w}) scale(${p})`}>
                        <rect x={-90} y={-115} width={180} height={230} rx={24} fill={C.card} />
                        <text textAnchor="middle" dominantBaseline="central" fontFamily={FONTS.body} fontWeight={800} fontSize={130} fill={k === 0 ? C.badgeB : C.badgeA}>
                          ?
                        </text>
                      </g>
                    ) : null;
                  })
                : null}
              {scenes.map((s, i) =>
                s.type === "score" ? <Stars key={`stars-${i}`} frame={frame} from={beats[i].startFrame - M.scoreLead} to={beats[i].endFrame + M.scoreTail} /> : null,
              )}
              <ShioBuddy
                sign={host}
                x={L.hostX}
                y={hostY - tapping - cheer + hostLife.y}
                tilt={hostLife.rotate}
                scale={hostS}
                squash={frame < hookEnd ? squashOnImpact(hostDrop.sinceImpact, 0.9, 12) : [1, 1]}
                mood={scene.mood}
                wave={scene.type === "cta" || scene.type === "hook" ? Math.max(0, Math.sin(frame / 8)) : 0}
                blinkOffset={7}
              />
            </svg>
          </AbsoluteFill>
          {scenes.map((s, i) => (s.type === "score" ? <Sparkles key={`score-burst-${i}`} cx={VIDEO.width / 2} cy={QUIZ_SCORE.starY} start={beats[i].startFrame} count={22} spread={520} frames={34} /> : null))}
          {scene.type === "reveal" && scene.stamp && scene.answer ? (
            <Sparkles cx={cardX(scene.answer)} cy={L.cardsY} start={cueOf(c, cur, scene.stamp.cueWord) + 4} count={16} spread={320} />
          ) : null}
          {/* Question cards (ask until the reveal's explanation line). */}
          {scenes.map((s, i) => {
            if (s.type !== "ask" || !s.question) {
              return null;
            }
            const rev = scenes[i + 1];
            const to = rev?.lines[0] ? cueOf(c, i + 1, rev.lines[0].cueWord) - 4 : beats[i + 1].endFrame;
            return <QuestionCard key={`q-${i}`} frame={frame} kicker={s.kicker} text={s.question} from={beats[i].startFrame} to={to} />;
          })}
          {scenes.map((s, i) => {
            const b = beats[i];
            if (frame < b.startFrame || frame >= b.endFrame || s.type === "ask") {
              return null;
            }
            if (s.type === "cta") {
              return (
                <AbsoluteFill key={`ui-${i}`} style={{ alignItems: "center", justifyContent: "center", gap: 50, top: -220 }}>
                  <LogoPlate start={b.startFrame - 4} glyph={brand.sealGlyph} name={brand.name} descriptor={brand.descriptor} />
                  {s.button ? <WhatsAppButton text={s.button.text} cue={cueOf(c, i, s.button.cueWord)} /> : null}
                </AbsoluteFill>
              );
            }
            const first = s.lines[0];
            return (
              <HeadlineStack key={`ui-${i}`} align="center">
                {s.kicker && first ? <Kicker text={s.kicker} start={cueOf(c, i, first.cueWord) - 6} out={b.endFrame} color={COLORS.seal} /> : null}
                {s.lines.map((l, k) => (
                  <HeadlineLine
                    key={l.text}
                    text={l.text}
                    cue={cueOf(c, i, l.cueWord)}
                    out={b.endFrame}
                    accent={l.accent}
                    variant={k === 0 ? "slam" : "rise"}
                    size={s.type === "hook" ? TYPE.hook : TYPE.headline}
                    color={C.title}
                    accentColor={C.titleAccent}
                  />
                ))}
              </HeadlineStack>
            );
          })}
          {scenes.map((s, i) => {
            const b = beats[i];
            return (
              <Sequence key={`cap-${i}`} from={b.startFrame} durationInFrames={b.endFrame - b.startFrame} layout="none">
                <Caption words={b.words.map((w) => ({ text: w.text, startFrame: w.startFrame - b.startFrame, endFrame: w.endFrame - b.startFrame }))} highlight={s.voHighlight} />
              </Sequence>
            );
          })}
        </>
      )}

      {/* Audio: VO, cue-word sound effects, countdown ticks, bed. */}
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
      {scenes.flatMap((s, i) => {
        if (s.type !== "ask") {
          return [];
        }
        const w = countdownOf(beats[i]);
        const step = Math.ceil((w.to - w.from) / 3);
        return [0, 1, 2].map((k) => (
          <Sequence key={`tick-${i}-${k}`} from={w.from + k * step} layout="none">
            <Audio src={staticFile(SFX.tick)} volume={SFX_MIX.tick * 2.2} />
          </Sequence>
        ));
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

