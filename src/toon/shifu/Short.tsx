// Shifu Po toon short (same post chain and overlays as domo-reels EP13): flat 2D characters in a colourful 3D world (toon format, template post chain:
// world ink pass -> lens blur pre + main -> bloom -> NEUTRAL tone map -> grade, MSAA 4). One three.js world posed per
// frame from the shot list; place changes in and out of the night stage crossfade; the hook ends on a white flash.
// Overlays: the source chip while its scene plays, the end card. Voice per scene as audio (the final mux uses mix.wav).
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { cancelRender, AbsoluteFill, Sequence, continueRender, delayRender, getInputProps, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../ink";
import { LensBlur } from "../lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../grade";
import { World } from "./world";
import { LOGO_READY } from "../kit/modern";
import { TOTAL, VOICE, SOURCE, CTA, cue, WORDS, SCENE_END, HIGHLIGHT, norm, SCENES } from "./cues";
import { FLASH_AT, SHOTS, layersAt, dofAt, camAt } from "./shots";
import { SAFE_AREA } from "../../lib/brand";
import { TOON_BRAND as BR } from "../brand";
const COLORS = { red: BR.colors.primary, black: BR.colors.ink, white: BR.colors.paper, onPrimary: BR.colors.onPrimary };
const FONTS = BR.fonts;
const NAME_RE = new RegExp(`\\s*di ${BR.name}$`, "i");

export const SHIFU_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; audio: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, audio: true, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

/** ThreeCanvas advances before the async composer is ready: hold each frame for a few warm-up draws */
const LateAdvance: React.FC = () => {
  const { advance } = useThree();
  const frame = useCurrentFrame();
  const warmed = useRef(false);
  useEffect(() => {
    if (warmed.current) { advance(performance.now()); return; }
    const handle = delayRender("toon warm-up");
    let n = 0, raf = 0;
    const step = () => {
      advance(performance.now());
      if (++n < 4) raf = requestAnimationFrame(step);
      else { warmed.current = true; continueRender(handle); }
    };
    step();
    return () => { cancelAnimationFrame(raf); if (!warmed.current) continueRender(handle); };
  }, [frame, advance]);
  return null;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
let WORLD: World | null = null; // one world per page: both crossfade canvases share its geometry builders

const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  WORLD = world;
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(id, f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(id, f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.2, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
      <LateAdvance />
    </>
  );
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; alpha: number }> = ({ id, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.05, far: 1500 }}>
      <Inner id={id} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** small source chip, bottom-left inside the safe area, while its scene plays */
const SourceChip: React.FC<{ text: string; a: number; b: number }> = ({ text, a, b }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [a + 6, a + 14, b - 10, b - 2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: SAFE_AREA.x, top: SAFE_AREA.y + 10, opacity: o, transform: `translateY(${(1 - o) * 12}px)`, background: "rgba(11,11,11,0.72)",
      color: COLORS.white, fontFamily: FONTS.body, fontWeight: 600, fontSize: 30, letterSpacing: 0.2, padding: "12px 22px", borderRadius: 999 }}>
      Sumber: {text}
    </div>
  );
};

const CARD_H = 470, CARD_W = 860, CARD_TOP = 880;
// ---------------- subtitles: short chunks, the spoken word lights up, keywords in brand red ----------------
type Chunk = { words: { w: string; f: number }[]; a: number; b: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Chunk | null = null;
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    const brk = !cur || prev.scene !== w.scene || cur.words.length >= 3 || cur.words.map((x) => x.w).join(" ").length + w.w.length > 20 || /[.,?!]$/.test(prev.w);
    if (brk) { cur = { words: [], a: w.f - 2, b: 0 }; out.push(cur); }
    cur!.words.push({ w: w.w, f: w.f });
  });
  out.forEach((c, i) => {
    const sc = WORDS.find((w) => w.f === c.words[0].f)!.scene, next = out[i + 1];
    c.b = Math.min(SCENE_END[sc] - 1, next ? next.a : SCENE_END[sc] - 1);
  });
  return out;
})();
const Subtitles: React.FC<{ top: boolean }> = ({ top }) => {
  const f = useCurrentFrame();
  const c = CHUNKS.find((k) => f >= k.a && f < k.b);
  if (!c) return null;
  const k = Math.min(1, (f - c.a) / 4);
  return (
    <div style={{ position: "absolute", left: SAFE_AREA.x, width: SAFE_AREA.width, ...(top ? { top: CARD_TOP + CARD_H + 22 } : { top: SAFE_AREA.y + SAFE_AREA.height - 150 }),
      display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 26px", opacity: k,
      ...(top ? { width: "max-content", maxWidth: 1000, left: "50%", translate: "-50% 0", flexWrap: "nowrap", background: "rgba(11,11,11,0.78)", borderRadius: 22, padding: "6px 30px" } : {}), transform: `translateY(${(1 - k) * 10}px)` }}>
      {c.words.map((w, i) => {
        const on = f >= w.f - 1, hot = HIGHLIGHT.has(norm(w.w));
        const pop = on ? interpolate(f - w.f, [-1, 2, 6], [1.0, 1.05, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
        return (
          <span key={i} style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: 66, lineHeight: 1.15, letterSpacing: -0.5, display: "inline-block", transform: `scale(${pop})`, transformOrigin: "50% 80%",
            color: hot && on && !top ? BR.colors.highlight : "#ffffff", opacity: on ? 1 : 0.55,
            WebkitTextStroke: top ? "0px" : "10px #0B0B0B", ...(top ? { fontSize: 52 } : {}), paintOrder: "stroke fill", textShadow: "0 6px 18px rgba(0,0,0,0.35)" }}>{w.w}</span>
        );
      })}
    </div>
  );
};

/** end card (ad style): a question, the ask in two big lines, one big red button "klik link di bio" that pulses,
 *  the brand line under it. Centred under the logo sign. */
const EndCard: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [from, from + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (k <= 0) return null;
  const e = 1 - (1 - k) ** 3;
  const cta = CTA as { line: string; line2?: string; eyebrow?: string; button?: string; tagline?: string };
  // two lines: the ask, then "di <brand>" (or line2 when the ask does not end with the brand)
  const ends = NAME_RE.test(cta.line), ask = ends ? cta.line.replace(NAME_RE, "") : cta.line, second = ends ? `di ${BR.name}` : cta.line2 ?? "";
  const btnText = cta.button ?? BR.cta.button, btnSize = Math.min(44, Math.floor(820 / btnText.length));
  const btn = interpolate(f, [from + 10, from + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 1 + 0.035 * Math.max(0, Math.sin(((f - from - 18) / 30) * Math.PI * 2)) * (f > from + 18 ? 1 : 0);
  const nudge = 10 * Math.max(0, Math.sin(((f - from) / 15) * Math.PI));
  return (
    <div style={{ position: "absolute", left: (1080 - CARD_W) / 2, width: CARD_W, top: CARD_TOP, height: CARD_H, opacity: e,
      transform: `translateY(${(1 - e) * 60}px)`, background: COLORS.white, borderRadius: 44, boxShadow: "0 26px 80px rgba(0,0,0,0.35)",
      padding: "28px 40px 30px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
      {cta.eyebrow ? (
        <div style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: 30, letterSpacing: "0.06em", color: COLORS.white, background: COLORS.black, borderRadius: 999, padding: "8px 28px" }}>{cta.eyebrow}</div>
      ) : null}
      <div style={{ fontFamily: FONTS.headline, fontWeight: FONTS.headlineWeight, fontSize: Math.round(100 * FONTS.headlineScale), lineHeight: 0.95, color: COLORS.black, textTransform: FONTS.headlineUpper ? "uppercase" : "none", letterSpacing: "0.01em", textAlign: "center" }}>
        {ask}{second ? <><br /><span style={{ color: COLORS.red }}>{second}</span></> : null}
      </div>
      <div style={{ opacity: btn, transform: `translateY(${(1 - btn) * 16}px) scale(${pulse})`, width: 720, height: 92, borderRadius: 999, background: COLORS.red,
        boxShadow: "0 10px 26px rgba(0,0,0,0.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
        <span style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: btnSize, color: COLORS.onPrimary, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{btnText}</span>
        <span style={{ fontFamily: FONTS.body, fontWeight: 800, fontSize: 48, color: COLORS.onPrimary, transform: `translateX(${nudge}px)` }}>→</span>
      </div>
      {(cta.tagline ?? BR.cta.tagline) ? <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 26, color: BR.colors.muted }}>{cta.tagline ?? BR.cta.tagline}</div> : null}
    </div>
  );
};

export const ShifuShort: React.FC = () => {
  const f = useCurrentFrame();
  const on = useMemo(toggles, []);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const h = delayRender("logo before the world");
    LOGO_READY.then(() => { setReady(true); continueRender(h); }, (e) => cancelRender(e));
  }, []);
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [0.55, 0.35, 0.18, 0.06][f - FLASH_AT] : 0;
  const ctaAt = cue(SCENES.length, CTA.at ?? "konsultasi");
  void camAt; void WORLD;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {ready && layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} alpha={l.alpha} />)}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {SOURCE.map((s, i) => <SourceChip key={i} text={s.text} a={s.a} b={s.b} />)}
      <EndCard from={ctaAt} />
      <Subtitles top={f >= ctaAt} />
      {on.audio && VOICE.map((v, i) => (v.src ? <Sequence key={i} from={v.from}><Audio src={staticFile(v.src)} /></Sequence> : null))}
    </AbsoluteFill>
  );
};
