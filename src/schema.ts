import { z } from "zod";
import { cueMatches } from "./lib/cues";
import { normalizeWord, splitWords, terbilang } from "./lib/text";

// Episode content: every word on screen and in the voice over lives in
// data/episodes/<id>.json and is validated here (CLAUDE.md, hard rule 4).

const text = z.string().trim().min(1);
const cueWord = text;
const cued = z.object({ text, cueWord });
const vo = text;
const voHighlight = z.array(text).default([]);

const hook = z.object({
  type: z.literal("hook"),
  vo,
  voHighlight,
  lines: z.array(cued).length(2),
});

const insight = z.object({
  type: z.literal("insight"),
  vo,
  voHighlight,
  lines: z.array(cued.extend({ accent: text.optional() })).length(2),
  // The compass needle locks onto one direction on this word.
  lockCueWord: cueWord,
});

const bazi = z.object({
  type: z.literal("bazi"),
  vo,
  voHighlight,
  title: cued,
  subtitle: text,
  shifuCueWord: cueWord,
  pillars: z.array(z.object({ glyph: text, label: text, cueWord })).length(4),
});

const fengshui = z.object({
  type: z.literal("fengshui"),
  vo,
  voHighlight,
  title: cued,
  stamp: cued,
});

const proof = z.object({
  type: z.literal("proof"),
  vo,
  voHighlight,
  count: z.object({
    value: z.number().int().positive(),
    suffix: z.string(),
    label: text,
    cueWord,
  }),
});

const cta = z.object({
  type: z.literal("cta"),
  vo,
  voHighlight,
  button: cued,
  tagline: cued.extend({ accent: text }),
});

export const sceneSchema = z.discriminatedUnion("type", [
  hook,
  insight,
  bazi,
  fengshui,
  proof,
  cta,
]);
export type Scene = z.infer<typeof sceneSchema>;
export type SceneOf<T extends Scene["type"]> = Extract<Scene, { type: T }>;

export const SCENE_ORDER = [
  "hook",
  "insight",
  "bazi",
  "fengshui",
  "proof",
  "cta",
] as const;

// Every cue word of a scene, in the order they are spoken.
export const sceneCues = (scene: Scene): string[] => {
  switch (scene.type) {
    case "hook":
      return scene.lines.map((l) => l.cueWord);
    case "insight":
      return [...scene.lines.map((l) => l.cueWord), scene.lockCueWord];
    case "bazi":
      return [
        scene.title.cueWord,
        scene.shifuCueWord,
        ...scene.pillars.map((p) => p.cueWord),
      ];
    case "fengshui":
      return [scene.title.cueWord, scene.stamp.cueWord];
    case "proof":
      return [scene.count.cueWord];
    case "cta":
      return [scene.button.cueWord, scene.tagline.cueWord];
  }
};

// Words of `vo` starting at the cue spell `value` ("tiga ribu" = 3000).
const spokenNumberMatches = (sceneVo: string, cue: string, value: number) => {
  const words = splitWords(sceneVo).map(normalizeWord);
  const start = words.indexOf(normalizeWord(cue));
  const spoken = splitWords(terbilang(value));
  return spoken.every((w, i) => words[start + i] === w);
};

const checkEpisode = (episode: { scenes: Scene[] }, ctx: z.RefinementCtx) => {
  const order = episode.scenes.map((s) => s.type).join(",");
  if (order !== SCENE_ORDER.join(",")) {
    ctx.addIssue({
      code: "custom",
      message: `scenes must be in this order: ${SCENE_ORDER.join(", ")}`,
    });
  }
  episode.scenes.forEach((scene, i) => {
    for (const cue of sceneCues(scene)) {
      const n = cueMatches(scene.vo, cue).length;
      if (n !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i],
          message: `cue "${cue}" must appear exactly once in "${scene.vo}" (found ${n})`,
        });
      }
    }
    const voNorm = splitWords(scene.vo).map(normalizeWord).join(" ");
    for (const phrase of scene.voHighlight) {
      const p = splitWords(phrase).map(normalizeWord).join(" ");
      if (!voNorm.includes(p)) {
        ctx.addIssue({
          code: "custom",
          path: ["scenes", i, "voHighlight"],
          message: `highlight "${phrase}" is not spoken in "${scene.vo}"`,
        });
      }
    }
    if (
      scene.type === "proof" &&
      !spokenNumberMatches(scene.vo, scene.count.cueWord, scene.count.value)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["scenes", i, "count"],
        message: `the VO must say "${terbilang(scene.count.value)}" starting at "${scene.count.cueWord}"`,
      });
    }
  });
};

export const episodeBase = z.object({
  id: z.string().regex(/^sp\d{2,}$/),
  title: text,
  brand: z.object({
    name: text,
    descriptor: text,
    sealGlyph: text,
    handle: z.string().nullable(),
  }),
  claims: z.array(z.object({ text, reviewed: z.boolean() })),
  scenes: z.array(sceneSchema),
});

export const episodeSchema = episodeBase.superRefine(checkEpisode);
export type Episode = z.infer<typeof episodeSchema>;

const wordTiming = z.object({
  text: z.string(),
  startFrame: z.number().int(),
  endFrame: z.number().int(),
});

export const beatSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
  voStartFrame: z.number().int().nonnegative(),
  voDurationInFrames: z.number().int().positive(),
  voSrc: z.string().optional(),
  voGain: z.number().positive().optional(),
  words: z.array(wordTiming),
});

export const reelPropsSchema = episodeBase
  .extend({
    // Shows the safe area overlay in the Studio.
    debug: z.boolean(),
    // Filled in by calculateMetadata; never written by hand.
    beats: z.array(beatSchema).optional(),
  })
  .superRefine(checkEpisode);
export type ReelProps = z.infer<typeof reelPropsSchema>;
