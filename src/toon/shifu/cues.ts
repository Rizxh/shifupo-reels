// Shifu Po timeline from the recorded voice (data/episodes/ep13.json): scene starts and word cues in frames.
// Everything visual is timed to words; a reaction lands LEAD frames before its word (reference: 0-3 f early).
import ep from "../../../data/episodes/sh00.json";

export const FPS = 30;
export const LEAD = 2;
/** hold on the end card after the last word (s) */
export const END_HOLD = 1.2;

type Word = { w: string; t: number };
type Scene = { shot: string; seconds: number; source?: string; vo: { text: string; src?: string; words?: Word[]; seconds?: number } };
export const SCENES = ep.scenes as Scene[];

const starts: number[] = [];
let acc = 0;
for (const s of SCENES) { starts.push(acc); acc += s.seconds; }
/** scene start in seconds (0-based scene index) */
export const sceneStart = (i: number) => starts[i];
export const TOTAL = Math.round((acc + END_HOLD) * FPS);
/** first frame of scene i (0-based) */
export const sceneFrame = (i: number) => Math.round(starts[i] * FPS);

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9-]/g, "");
/** frame of the n-th occurrence (1-based) of `word` in scene `scene` (1-based, like the script table), minus LEAD */
export const cue = (scene: number, word: string, n = 1, lead = LEAD) => {
  const s = SCENES[scene - 1];
  if (!s?.vo.words) throw new Error(`sh00: scene ${scene} has no word timings`);
  let k = 0;
  for (const w of s.vo.words) if (norm(w.w) === norm(word) && ++k === n) return Math.round((starts[scene - 1] + w.t) * FPS) - lead;
  throw new Error(`sh00: word "${word}" #${n} not in scene ${scene}`);
};
/** a scene's voice files and offsets, for the audio track */
export const VOICE = SCENES.map((s, i) => ({ src: s.vo.src ?? "", from: Math.round(starts[i] * FPS) }));
/** a scene's source chip: from its `sourceAt` word (else the scene start) to the end of the scene */
export const SOURCE = SCENES.map((s, i) => (s.source ? { text: s.source, a: (s as { sourceAt?: string }).sourceAt ? cue(i + 1, (s as { sourceAt?: string }).sourceAt!) : sceneFrame(i), b: sceneFrame(i) + Math.round(s.seconds * FPS) } : null)).filter((x) => x !== null);
export const CTA = (ep as unknown as { cta?: { line: string; handle: string; signs?: string[]; at?: string } }).cta ?? { line: "", handle: "" };
/** every spoken word with its absolute start frame (subtitles) */
export const WORDS = SCENES.flatMap((s, i) => (s.vo.words ?? []).map((w) => ({ w: w.w, f: Math.round((starts[i] + w.t) * FPS), scene: i })));
/** scene end frames (subtitle chunks never run past their scene) */
export const SCENE_END = SCENES.map((s, i) => Math.round((starts[i] + s.seconds) * FPS));
/** words drawn in brand red in the subtitles (normalised: lower case, no punctuation) */
export const HIGHLIGHT = new Set(((ep as unknown as { captionHighlight?: string[] }).captionHighlight ?? []).map(norm));
export { norm };
