// Voice direction for ElevenLabs v3: each VO line can carry a tone (an audio
// tag such as [curious] or [whispers]) so delivery follows the story beat
// instead of one flat read. Tags are sent to the model but never reach
// captions, cue matching or the word timings.
//
// Tested 13 Nov 2026: eleven_v3 returns timestamps for tagged text (the tag's
// characters are included in the alignment) and rejects previous_text /
// next_text, so continuity comes from consistent tones instead.

export const VO_TONES = [
  "curious",
  "thoughtful",
  "warm",
  "calm",
  "serious",
  "excited",
  "confident",
  "surprised",
  "relieved",
  "whispers",
  "softly",
  "deadpan",
  "sighs",
  "playful",
] as const;

export type VoTone = (typeof VO_TONES)[number];

export const isV3Model = (modelId: string): boolean => modelId.startsWith("eleven_v3");

// Text sent to TTS: the tag only for v3 (older models read tags aloud).
export const directedText = (text: string, tone: VoTone | undefined, modelId: string): string =>
  tone && isV3Model(modelId) ? `[${tone}] ${text}` : text;

// Remove bracketed audio tags from a word list (a tag may span several
// whitespace-separated tokens, e.g. "[speaking softly]").
export const stripTagWords = <T extends { text: string }>(words: T[]): T[] => {
  const out: T[] = [];
  let inTag = false;
  for (const w of words) {
    const t = w.text;
    if (!inTag && t.startsWith("[")) {
      inTag = !t.includes("]");
      const rest = t.slice(t.indexOf("]") + 1);
      if (!inTag && rest.length > 0) {
        out.push({ ...w, text: rest });
      }
      continue;
    }
    if (inTag) {
      if (t.includes("]")) {
        inTag = false;
        const rest = t.slice(t.indexOf("]") + 1);
        if (rest.length > 0) {
          out.push({ ...w, text: rest });
        }
      }
      continue;
    }
    out.push(w);
  }
  return out;
};
