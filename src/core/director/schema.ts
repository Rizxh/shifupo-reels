// Director Engine: a short prompt ("video soal pintu sejajar") is expanded by
// the director (Claude, via /buat-video) into this production script before
// any scene is built. The validator rejects scripts that would produce a
// "plain" reel: no atmosphere, same camera twice, no physics, no handoffs,
// flat voice. Product-agnostic; products add their style in
// src/products/<name>/director.ts.

import { z } from "zod";
import { VO_TONES } from "../audio/voiceDirection";
import { splitWords } from "../text/text";

const text = z.string().trim().min(1);

export const BEATS = ["hook", "context", "cause", "effect", "fix", "payoff", "cta"] as const;
export const CAMERAS = [
  "macro",
  "crane-down",
  "crane-up",
  "dolly-in",
  "dolly-out",
  "orbit",
  "top-down",
  "tracking",
  "whip-pan",
  "push-in",
  "pull-back",
  "pov",
  "low-angle",
  "dutch",
] as const;
export const ATMOSPHERE = [
  "clouds",
  "fog",
  "haze",
  "light-rays",
  "particles",
  "bokeh",
  "dust",
  "petals",
  "rain",
  "sparks",
  "steam",
  "water-ripples",
  "stars",
] as const;
export const PHYSICS = [
  "gravity-bounce",
  "projectile",
  "spring-settle",
  "pendulum",
  "rolling",
  "sliding-friction",
  "fluid-flow",
  "wind-sway",
  "rigid-rotation",
  "none-static",
] as const;

const physicsItem = z.object({ object: text, law: z.enum(PHYSICS), note: z.string().optional() });

export const beatSchema = z.object({
  beat: z.enum(BEATS),
  // What the viewer should feel in this beat (drives tone, music, color).
  feeling: text,
  shot: z.object({
    camera: z.enum(CAMERAS),
    subject: text,
    action: text,
    // Secondary motion that keeps holds alive (sway, blink, drift, flicker...).
    secondary: z.array(text).min(1),
  }),
  environment: z.object({
    setting: text,
    // Depth layers back to front, at least background / midground / foreground.
    layers: z.array(text).min(3),
    atmosphere: z.array(z.enum(ATMOSPHERE)).min(2),
    lighting: z.object({ key: text, rim: text, mood: text }),
  }),
  physics: z.array(physicsItem).min(1),
  // Object that carries the eye into the next beat (match move / morph).
  handoff: z.object({ object: text, into: text }).optional(),
  vo: z.object({ text, tone: z.enum(VO_TONES), cueWords: z.array(text).min(1) }),
  onScreenText: z.string().optional(),
  sfx: z.array(z.object({ at: text, sound: text })).min(1),
  assets: z.array(z.object({ name: text, tier: z.enum(["hero", "support", "texture"]), isNew: z.boolean() })).min(1),
});

export const productionSchema = z.object({
  id: text,
  product: text,
  prompt: text,
  brief: z.object({ viewer: text, problem: text, promise: text, format: text }),
  // Longer reels the user asked for (default DIRECTOR_RULES min/max seconds).
  targetSeconds: z.object({ min: z.number(), max: z.number() }).optional(),
  beats: z.array(beatSchema).min(5).max(10),
});

export type Production = z.infer<typeof productionSchema>;
export type ProductionBeat = z.infer<typeof beatSchema>;

export const DIRECTOR_RULES = {
  hookMaxWords: 8,
  wordsPerSecond: 2.05,
  padSeconds: 0.35 + 1.2,
  lineGapSeconds: 0.3,
  minSeconds: 20,
  maxSeconds: 29,
  minDistinctCameras: 3,
} as const;

export const estimateSeconds = (p: Production): number => {
  const words = p.beats.reduce((n, b) => n + splitWords(b.vo.text).length, 0);
  return words / DIRECTOR_RULES.wordsPerSecond + p.beats.length * DIRECTOR_RULES.lineGapSeconds + DIRECTOR_RULES.padSeconds;
};

// Craft rules beyond the shape: returns human-readable problems (empty = OK).
export const directorProblems = (p: Production): string[] => {
  const out: string[] = [];
  const R = DIRECTOR_RULES;
  const b = p.beats;
  if (b[0]?.beat !== "hook") {
    out.push("Beat pertama harus hook.");
  }
  if (b[b.length - 1]?.beat !== "cta") {
    out.push("Beat terakhir harus cta.");
  }
  for (const need of ["hook", "cause", "fix", "cta"] as const) {
    if (!b.some((x) => x.beat === need)) {
      out.push(`Beat "${need}" wajib ada.`);
    }
  }
  const hook = b[0];
  if (hook && splitWords(hook.vo.text).length > R.hookMaxWords) {
    out.push(`Hook ${splitWords(hook.vo.text).length} kata (maks ${R.hookMaxWords}).`);
  }
  if (hook && hook.physics.every((x) => x.law === "none-static")) {
    out.push("Hook harus sudah bergerak sejak frame 0 (ada benda dengan hukum fisika selain none-static).");
  }
  b.forEach((x, i) => {
    if (i > 0 && x.shot.camera === b[i - 1].shot.camera) {
      out.push(`Beat ${i + 1} (${x.beat}) memakai kamera yang sama dengan beat sebelumnya (${x.shot.camera}).`);
    }
    if (i < b.length - 1 && !x.handoff) {
      out.push(`Beat ${i + 1} (${x.beat}) belum punya penghubung (handoff) ke beat berikutnya.`);
    }
    for (const w of x.vo.cueWords) {
      const hits = splitWords(x.vo.text).filter((t) => t.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "") === w.toLowerCase()).length;
      if (hits !== 1) {
        out.push(`Beat ${i + 1}: cue "${w}" diucapkan ${hits}× (harus tepat 1×).`);
      }
    }
  });
  const cams = new Set(b.map((x) => x.shot.camera));
  if (cams.size < R.minDistinctCameras) {
    out.push(`Hanya ${cams.size} jenis kamera (min ${R.minDistinctCameras}).`);
  }
  const tones = new Set(b.map((x) => x.vo.tone));
  if (tones.size < 3) {
    out.push(`Nada VO hanya ${tones.size} macam: intonasi akan datar (min 3).`);
  }
  const s = estimateSeconds(p);
  const lo = p.targetSeconds?.min ?? R.minSeconds;
  const hi = p.targetSeconds?.max ?? R.maxSeconds;
  if (s < lo || s > hi) {
    out.push(`Perkiraan durasi ${s.toFixed(1)} s di luar ${lo}–${hi} s.`);
  }
  return out;
};
