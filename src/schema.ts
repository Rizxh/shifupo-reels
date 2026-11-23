import { z } from "zod";
import { VO_TONES } from "./core/audio/voiceDirection";
import { cueMatches } from "./lib/cues";
import { normalizeWord, splitWords, terbilang } from "./lib/text";

// Episode content: every word on screen and in the voice over lives in
// data/episodes/<id>.json and is validated here (CLAUDE.md, hard rule 4).

const text = z.string().trim().min(1);
const cueWord = text;
const cued = z.object({ text, cueWord });
const vo = text;
const voHighlight = z.array(text).default([]);
// Delivery of the line for ElevenLabs v3 (src/core/audio/voiceDirection.ts).
const tone = z.enum(VO_TONES).optional();

const hook = z.object({
  type: z.literal("hook"),
  vo,
  voHighlight,
  tone,
  lines: z.array(cued).length(2),
});

const insight = z.object({
  type: z.literal("insight"),
  vo,
  voHighlight,
  tone,
  lines: z.array(cued.extend({ accent: text.optional() })).length(2),
  // The compass needle locks onto one direction on this word.
  lockCueWord: cueWord,
});

const bazi = z.object({
  type: z.literal("bazi"),
  vo,
  voHighlight,
  tone,
  title: cued,
  subtitle: text,
  shifuCueWord: cueWord,
  pillars: z.array(z.object({ glyph: text, label: text, cueWord })).length(4),
});

const fengshui = z.object({
  type: z.literal("fengshui"),
  vo,
  voHighlight,
  tone,
  title: cued,
  stamp: cued,
});

const proof = z.object({
  type: z.literal("proof"),
  vo,
  voHighlight,
  tone,
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
  tone,
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

// Shared checks for any episode format: scene order, every cue spoken
// exactly once, highlights spoken, and an on-screen count equal to the number
// the VO says.
type CheckedScene = {
  type: string;
  vo: string;
  voHighlight: string[];
  count?: { value: number; cueWord: string };
};

const checkScenes =
  <S extends CheckedScene>(
    // A fixed order, or a rule returning what is wrong with the order.
    order: readonly string[] | ((types: string[]) => string | null),
    cuesOf: (scene: S) => string[],
  ) =>
  (episode: { scenes: S[] }, ctx: z.RefinementCtx) => {
    const types = episode.scenes.map((s) => s.type);
    const problem =
      typeof order === "function"
        ? order(types)
        : types.join(",") === order.join(",")
          ? null
          : `scenes must be in this order: ${order.join(", ")}`;
    if (problem) {
      ctx.addIssue({ code: "custom", message: problem });
    }
    episode.scenes.forEach((scene, i) => {
      for (const cue of cuesOf(scene)) {
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
        scene.count &&
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

const checkEpisode = checkScenes<Scene>(SCENE_ORDER, sceneCues);

// Path under public/ of a real file (checked by tests/assets.test.ts).
const assetPath = z.string().regex(/^assets\/[\w./-]+\.(png|jpe?g|webp)$/);

const brandSchema = z.object({
  name: text,
  descriptor: text,
  sealGlyph: text,
  handle: z.string().nullable(),
  // Official logo image; when set, the pop-out CTA shows it instead of the
  // name set in type.
  logo: assetPath.optional(),
});
const claimsSchema = z.array(z.object({ text, reviewed: z.boolean() }));
const episodeId = z.string().regex(/^sp\d{2,}$/);

// The original story format (sp01): six scenes, no "format" field.
export const episodeBase = z.object({
  id: episodeId,
  format: z.literal("story").optional(),
  title: text,
  brand: brandSchema,
  claims: claimsSchema,
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

// ---------------------------------------------------------------------------
// Pop-out format (sp02): a lacquer frame in the middle of the screen and
// objects that break out of it toward the viewer (docs/sp02/PLAN.md).

// A real photo shown inside the frame's window instead of the drawn world.
const photo = assetPath.optional();

// A sales chart falls inside the window and its arrow plunges out of the
// frame on the plunge cue.
const chart = z.object({
  type: z.literal("chart"),
  vo,
  voHighlight,
  tone,
  photo,
  lines: z.array(cued).length(2),
  plungeCueWord: cueWord,
});

const leap = z.object({
  type: z.literal("leap"),
  vo,
  voHighlight,
  tone,
  photo,
  lines: z.array(cued).length(2),
  // The koi breaks out of the frame on this word.
  leapCueWord: cueWord,
});

const turn = z.object({
  type: z.literal("turn"),
  vo,
  voHighlight,
  tone,
  photo,
  lines: z.array(cued.extend({ accent: text.optional() })).length(2),
  lockCueWord: cueWord,
});

const count = z.object({
  type: z.literal("count"),
  vo,
  voHighlight,
  tone,
  photo,
  kickerCueWord: cueWord,
  count: z.object({
    value: z.number().int().positive(),
    suffix: z.string(),
    label: text,
    cueWord,
  }),
});

const popCta = z.object({
  type: z.literal("cta"),
  vo,
  voHighlight,
  tone,
  photo,
  shifuCueWord: cueWord,
  // "lean": Shifu Po leans out of the window; "none": the photo inside the
  // window already shows him.
  figure: z.enum(["lean", "none"]).default("lean"),
  button: cued,
});

export const popSceneSchema = z.discriminatedUnion("type", [
  chart,
  leap,
  turn,
  count,
  popCta,
]);
export type PopScene = z.infer<typeof popSceneSchema>;
export type PopSceneOf<T extends PopScene["type"]> = Extract<
  PopScene,
  { type: T }
>;

// A pop-out reel opens on any break-out scene and always ends on the CTA.
export const POP_OPENERS = ["chart", "leap"] as const;
export const POP_SCENES = { min: 3, max: 5 } as const;

export const popSceneCues = (scene: PopScene): string[] => {
  switch (scene.type) {
    case "chart":
      return [...scene.lines.map((l) => l.cueWord), scene.plungeCueWord];
    case "leap":
      return [...scene.lines.map((l) => l.cueWord), scene.leapCueWord];
    case "turn":
      return [...scene.lines.map((l) => l.cueWord), scene.lockCueWord];
    case "count":
      return [scene.kickerCueWord, scene.count.cueWord];
    case "cta":
      return [scene.shifuCueWord, scene.button.cueWord];
  }
};

// Scene order rule for pop-out reels: an opener first, the CTA last and
// only there, each scene type at most once (their ids and clips are keyed
// by type), between POP_SCENES.min and .max scenes.
const popOrderProblem = (types: string[]): string | null => {
  if (types.length < POP_SCENES.min || types.length > POP_SCENES.max) {
    return `a pop-out reel has ${POP_SCENES.min} to ${POP_SCENES.max} scenes`;
  }
  if (!(POP_OPENERS as readonly string[]).includes(types[0])) {
    return `a pop-out reel opens with one of: ${POP_OPENERS.join(", ")}`;
  }
  if (types.indexOf("cta") !== types.length - 1) {
    return "a pop-out reel ends with its only cta scene";
  }
  if (new Set(types).size !== types.length) {
    return "each pop-out scene type appears at most once";
  }
  return null;
};

const checkPopEpisode = checkScenes<PopScene>(popOrderProblem, popSceneCues);

export const popEpisodeBase = z.object({
  id: episodeId,
  format: z.literal("popout"),
  title: text,
  brand: brandSchema,
  claims: claimsSchema,
  scenes: z.array(popSceneSchema),
});

export const popEpisodeSchema = popEpisodeBase.superRefine(checkPopEpisode);
export type PopEpisode = z.infer<typeof popEpisodeSchema>;

export const popReelPropsSchema = popEpisodeBase
  .extend({
    debug: z.boolean(),
    beats: z.array(beatSchema).optional(),
  })
  .superRefine(checkPopEpisode);
export type PopReelProps = z.infer<typeof popReelPropsSchema>;

// ---------------------------------------------------------------------------
// Cinema format (sp04): cinematic 3D shots rendered in Blender
// (npm run render3d), brand titles and captions composited on top. Beats
// follow the Director Engine (src/core/director/schema.ts): hook first, cta
// last, one VO line with a v3 tone per beat.

export const CINEMA_BEATS = ["hook", "context", "cause", "effect", "fix", "payoff", "cta"] as const;
export const MARK_KINDS = ["circle", "arrow", "stamp"] as const;
const shotName = z.string().regex(/^[a-z0-9-]+$/);

const cinemaSceneSchema = z.object({
  type: z.enum(CINEMA_BEATS),
  vo,
  voHighlight,
  tone,
  // Folder under public/assets/3d/ holding frame_####.png for this beat.
  shot: shotName,
  // Optional small label above the title (e.g. "RONDE 1").
  kicker: text.optional(),
  lines: z.array(cued.extend({ accent: text.optional() })).max(2).default([]),
  // Sound effects tied to spoken words (names from src/products/shifupo/sfx.ts).
  sfx: z.array(z.object({ sound: text, cueWord })).default([]),
  button: cued.optional(),
  // Live 3D world only (episode `world`): story actions of the world fired on
  // a spoken word (names from the world's EVENTS list).
  events: z.array(z.object({ name: shotName, cueWord })).default([]),
  // Hand-drawn emphasis pinned to a 3D anchor of the world (Motion Format
  // style): scribble circle, curved arrow, tilted stamp or highlight.
  marks: z
    .array(z.object({ kind: z.enum(MARK_KINDS), anchor: shotName, cueWord, text: text.optional() }))
    .default([]),
});
export type CinemaScene = z.infer<typeof cinemaSceneSchema>;

const cinemaOrderProblem = (types: string[]): string | null => {
  if (types.length < 5 || types.length > 8) {
    return "a cinema reel has 5 to 8 scenes";
  }
  if (types[0] !== "hook" || types[types.length - 1] !== "cta") {
    return "a cinema reel opens with hook and ends with cta";
  }
  return null;
};

export const cinemaCues = (s: CinemaScene): string[] => [
  ...s.lines.map((l) => l.cueWord),
  ...s.sfx.map((x) => x.cueWord),
  ...(s.button ? [s.button.cueWord] : []),
  ...s.events.map((e) => e.cueWord),
  ...s.marks.map((m) => m.cueWord),
];

const checkCinemaEpisode = checkScenes<CinemaScene>(cinemaOrderProblem, (s) => [...new Set(cinemaCues(s))]);

export const cinemaEpisodeBase = z.object({
  id: episodeId,
  format: z.literal("cinema"),
  title: text,
  // Live 3D world (React Three Fiber) instead of pre-rendered frames; scene
  // `shot` then names one of the world's cameras.
  world: shotName.optional(),
  brand: brandSchema,
  claims: claimsSchema,
  scenes: z.array(cinemaSceneSchema),
});

export const cinemaEpisodeSchema = cinemaEpisodeBase.superRefine(checkCinemaEpisode);
export type CinemaEpisode = z.infer<typeof cinemaEpisodeSchema>;

export const cinemaReelPropsSchema = cinemaEpisodeBase
  .extend({ debug: z.boolean(), beats: z.array(beatSchema).optional() })
  .superRefine(checkCinemaEpisode);
export type CinemaReelProps = z.infer<typeof cinemaReelPropsSchema>;

// ---------------------------------------------------------------------------
// Shio format (sp06): 2D motion around one continuous wheel of the 12 shio
// (ShioReel). Each beat lights seals on spoken words and draws one relation
// (San He triangle, Liu He ally, Chong clash) between them and the year sign.

export const SHIO_SIGNS = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  "snake",
  "horse",
  "goat",
  "monkey",
  "rooster",
  "dog",
  "pig",
] as const;
export type ShioSign = (typeof SHIO_SIGNS)[number];
export const SHIO_BEATS = ["hook", "year", "trine", "ally", "clash", "pillar", "cta"] as const;

const shioSceneSchema = z.object({
  type: z.enum(SHIO_BEATS),
  vo,
  voHighlight,
  tone,
  kicker: text.optional(),
  lines: z.array(cued.extend({ accent: text.optional() })).max(2).default([]),
  sfx: z.array(z.object({ sound: text, cueWord })).default([]),
  // Seals that light up on a spoken word, with the name shown under them.
  signs: z.array(z.object({ sign: z.enum(SHIO_SIGNS), label: text, cueWord })).default([]),
  // Hand-drawn relation between the lit seals and the year sign.
  link: z.object({ kind: z.enum(["trine", "ally", "clash"]), cueWord }).optional(),
  // Card that drops and slams (the date of the new year).
  card: z.object({ text, sub: text.optional(), cueWord }).optional(),
  // The four BaZi pillars (year first: it receives the year sign).
  pillars: z.array(z.object({ glyph: text, label: text })).max(4).default([]),
  button: cued.optional(),
});
export type ShioScene = z.infer<typeof shioSceneSchema>;

export const shioCues = (s: ShioScene): string[] => [
  ...s.lines.map((l) => l.cueWord),
  ...s.sfx.map((x) => x.cueWord),
  ...s.signs.map((x) => x.cueWord),
  ...(s.link ? [s.link.cueWord] : []),
  ...(s.card ? [s.card.cueWord] : []),
  ...(s.button ? [s.button.cueWord] : []),
];

const checkShioEpisode = checkScenes<ShioScene>(SHIO_BEATS, (s) => [...new Set(shioCues(s))]);

export const shioEpisodeBase = z.object({
  id: episodeId,
  format: z.literal("shio"),
  title: text,
  brand: brandSchema,
  claims: claimsSchema,
  // Sign ruling the year (center of the wheel) and its on-screen name.
  yearSign: z.enum(SHIO_SIGNS),
  yearLabel: text,
  scenes: z.array(shioSceneSchema),
});

export const shioEpisodeSchema = shioEpisodeBase.superRefine(checkShioEpisode);
export type ShioEpisode = z.infer<typeof shioEpisodeSchema>;

export const shioReelPropsSchema = shioEpisodeBase
  .extend({ debug: z.boolean(), beats: z.array(beatSchema).optional() })
  .superRefine(checkShioEpisode);
export type ShioReelProps = z.infer<typeof shioReelPropsSchema>;

// ---------------------------------------------------------------------------
// Parade format (sp07): the 12 shio as cute paper characters on a cheerful
// stage (ParadeReel, Motion Format paper-cartoon style). Each group beat
// brings its members to the front on their spoken names and stamps a verdict.

export const PARADE_TYPES = ["hook", "intro", "group", "payoff", "cta"] as const;
const MOODS = ["happy", "wink", "closed", "wow"] as const;

const paradeSceneSchema = z.object({
  type: z.enum(PARADE_TYPES),
  vo,
  voHighlight,
  tone,
  kicker: text.optional(),
  lines: z.array(cued.extend({ accent: text.optional() })).max(2).default([]),
  sfx: z.array(z.object({ sound: text, cueWord })).default([]),
  // Characters that come to the front, each on its spoken name.
  signs: z.array(z.object({ sign: z.enum(SHIO_SIGNS), cueWord })).default([]),
  mood: z.enum(MOODS).default("happy"),
  // Hand-drawn verdict stamp over the group.
  stamp: z.object({ text, cueWord }).optional(),
  pillars: z.array(z.object({ glyph: text, label: text })).max(4).default([]),
  button: cued.optional(),
});
export type ParadeScene = z.infer<typeof paradeSceneSchema>;

const paradeOrderProblem = (types: string[]): string | null => {
  if (types.length < 5 || types.length > 10) {
    return "a parade reel has 5 to 10 scenes";
  }
  if (types[0] !== "hook" || types[types.length - 1] !== "cta") {
    return "a parade reel opens with hook and ends with cta";
  }
  return null;
};

export const paradeCues = (s: ParadeScene): string[] => [
  ...s.lines.map((l) => l.cueWord),
  ...s.sfx.map((x) => x.cueWord),
  ...s.signs.map((x) => x.cueWord),
  ...(s.stamp ? [s.stamp.cueWord] : []),
  ...(s.button ? [s.button.cueWord] : []),
];

const checkParadeEpisode = checkScenes<ParadeScene>(paradeOrderProblem, (s) => [...new Set(paradeCues(s))]);

export const paradeEpisodeBase = z.object({
  id: episodeId,
  format: z.literal("parade"),
  title: text,
  brand: brandSchema,
  claims: claimsSchema,
  yearSign: z.enum(SHIO_SIGNS),
  // On-screen name of every character (copy lives here, not in components).
  names: z.object(Object.fromEntries(SHIO_SIGNS.map((s) => [s, text])) as Record<ShioSign, typeof text>),
  scenes: z.array(paradeSceneSchema),
});

export const paradeEpisodeSchema = paradeEpisodeBase.superRefine(checkParadeEpisode);
export type ParadeEpisode = z.infer<typeof paradeEpisodeSchema>;

export const paradeReelPropsSchema = paradeEpisodeBase
  .extend({ debug: z.boolean(), beats: z.array(beatSchema).optional() })
  .superRefine(checkParadeEpisode);
export type ParadeReelProps = z.infer<typeof paradeReelPropsSchema>;

// ---------------------------------------------------------------------------
// Quiz format (sp08): an interactive-feeling A/B quiz in paper-cartoon style
// (QuizReel). Each "ask" drops two answer cards on their spoken letters and
// holds a countdown (holdSeconds, silent) before its "reveal" stamps the
// right card and scribbles out the wrong one.

export const QUIZ_TYPES = ["hook", "ask", "reveal", "score", "cta"] as const;
export const QUIZ_PROPS = ["mirror-door", "mirror-side", "bed-door", "bed-wall", "plant-alive", "plant-dry"] as const;
const ANSWER = z.enum(["A", "B"]);

const quizSceneSchema = z.object({
  type: z.enum(QUIZ_TYPES),
  vo,
  voHighlight,
  tone,
  kicker: text.optional(),
  lines: z.array(cued.extend({ accent: text.optional() })).max(2).default([]),
  sfx: z.array(z.object({ sound: text, cueWord })).default([]),
  // Ask: the question card and the two answer cards.
  question: text.optional(),
  options: z.array(z.object({ key: ANSWER, text, prop: z.enum(QUIZ_PROPS), cueWord })).default([]),
  // Silent countdown after the line, in seconds (ask only).
  holdSeconds: z.number().min(0).max(5).optional(),
  // Reveal: which card is right, and the stamp on it.
  answer: ANSWER.optional(),
  stamp: z.object({ text, cueWord }).optional(),
  mood: z.enum(MOODS).default("happy"),
  button: cued.optional(),
});
export type QuizScene = z.infer<typeof quizSceneSchema>;

const quizOrderProblem = (types: string[]): string | null => {
  if (types.length < 5 || types.length > 10) {
    return "a quiz reel has 5 to 10 scenes";
  }
  if (types[0] !== "hook" || types[types.length - 1] !== "cta") {
    return "a quiz reel opens with hook and ends with cta";
  }
  for (let i = 0; i < types.length; i++) {
    if (types[i] === "ask" && types[i + 1] !== "reveal") {
      return "every ask is followed by its reveal";
    }
  }
  return null;
};

export const quizCues = (s: QuizScene): string[] => [
  ...s.lines.map((l) => l.cueWord),
  ...s.sfx.map((x) => x.cueWord),
  ...s.options.map((o) => o.cueWord),
  ...(s.stamp ? [s.stamp.cueWord] : []),
  ...(s.button ? [s.button.cueWord] : []),
];

const checkQuizEpisode = checkScenes<QuizScene>(quizOrderProblem, (s) => [...new Set(quizCues(s))]);

export const quizEpisodeBase = z.object({
  id: episodeId,
  format: z.literal("quiz"),
  title: text,
  brand: brandSchema,
  claims: claimsSchema,
  // The host character (one of the 12 paper shio).
  host: z.enum(SHIO_SIGNS),
  // Label over the countdown ring, e.g. "JAWAB!".
  countdownLabel: text,
  scenes: z.array(quizSceneSchema),
});

export const quizEpisodeSchema = quizEpisodeBase.superRefine(checkQuizEpisode);
export type QuizEpisode = z.infer<typeof quizEpisodeSchema>;

export const quizReelPropsSchema = quizEpisodeBase
  .extend({ debug: z.boolean(), beats: z.array(beatSchema).optional() })
  .superRefine(checkQuizEpisode);
export type QuizReelProps = z.infer<typeof quizReelPropsSchema>;

// ---------------------------------------------------------------------------
// Music video format (sp09): a song storyboard played as hard-cut shots in a
// live 3D world (MvReel). No voice over: every scene lasts its own seconds
// (the lyric table), shows its lyric line (consecutive scenes with the same
// lyric keep one line on screen) and may add a 2D overlay or sound effects.

export const MV_OVERLAYS = ["none", "smoke-title", "smoke-word", "sparkle-word", "icon-clock", "icon-goods", "icon-broom", "icon-scale", "hokgi", "outro"] as const;
export const MV_SECONDS = { min: 15, max: 90 } as const;

const mvSceneSchema = z.object({
  shot: text,
  seconds: z.number().min(0.5).max(8),
  lyric: text.optional(),
  overlay: z.enum(MV_OVERLAYS).default("none"),
  // Word for "smoke-word" (smoke forms it) and "sparkle-word" (small gold
  // word in a sparkle burst).
  word: text.optional(),
  // Sound effects at a fraction (0..1) of the scene; names from SFX.
  sfx: z.array(z.object({ sound: text, at: z.number().min(0).max(1) })).default([]),
});
export type MvScene = z.infer<typeof mvSceneSchema>;

const checkMvEpisode = (e: { scenes: MvScene[] }, ctx: z.RefinementCtx) => {
  const total = e.scenes.reduce((a, s) => a + s.seconds, 0);
  if (total < MV_SECONDS.min || total > MV_SECONDS.max) {
    ctx.addIssue({ code: "custom", message: `a music video lasts ${MV_SECONDS.min}-${MV_SECONDS.max} s (this one ${total.toFixed(1)} s)` });
  }
  e.scenes.forEach((s, i) => {
    if ((s.overlay === "smoke-word" || s.overlay === "sparkle-word") && !s.word) {
      ctx.addIssue({ code: "custom", message: `scene ${i + 1}: overlay ${s.overlay} needs a word` });
    }
  });
  if (e.scenes.filter((s) => s.overlay === "outro").length !== 1 || e.scenes[e.scenes.length - 1].overlay !== "outro") {
    ctx.addIssue({ code: "custom", message: "a music video ends with its only outro scene" });
  }
};

export const mvEpisodeBase = z.object({
  id: episodeId,
  format: z.literal("mv"),
  title: text,
  brand: brandSchema,
  claims: claimsSchema,
  // Live 3D world (src/products/shifupo/worlds/mv.ts).
  world: text,
  // Music under public/; a missing file renders silent (draft).
  music: z.string().regex(/^audio\/[\w./-]+\.(wav|mp3)$/),
  tagline: text,
  scenes: z.array(mvSceneSchema).min(3).max(40),
});

export const mvEpisodeSchema = mvEpisodeBase.superRefine(checkMvEpisode);
export type MvEpisode = z.infer<typeof mvEpisodeSchema>;

export const mvReelPropsSchema = mvEpisodeBase.extend({ debug: z.boolean() }).superRefine(checkMvEpisode);
export type MvReelProps = z.infer<typeof mvReelPropsSchema>;

// ---------------------------------------------------------------------------
// Any format: what the scripts load.

export type AnyEpisode = Episode | PopEpisode | CinemaEpisode | ShioEpisode | ParadeEpisode | QuizEpisode | MvEpisode;
// Episodes with a voice over (every format except the music video).
export type VoicedEpisode = Exclude<AnyEpisode, MvEpisode>;
export const isVoiced = (e: AnyEpisode): e is VoicedEpisode => e.format !== "mv";

export const FORMATS = {
  story: { composition: "Reel", schema: episodeSchema },
  popout: { composition: "PopReel", schema: popEpisodeSchema },
  cinema: { composition: "CinemaReel", schema: cinemaEpisodeSchema },
  shio: { composition: "ShioReel", schema: shioEpisodeSchema },
  parade: { composition: "ParadeReel", schema: paradeEpisodeSchema },
  quiz: { composition: "QuizReel", schema: quizEpisodeSchema },
  mv: { composition: "MvReel", schema: mvEpisodeSchema },
} as const;
export type Format = keyof typeof FORMATS;

export const formatOf = (raw: unknown): Format => {
  const f = typeof raw === "object" && raw !== null ? (raw as { format?: unknown }).format : undefined;
  return f === "popout" || f === "cinema" || f === "shio" || f === "parade" || f === "quiz" || f === "mv" ? f : "story";
};
