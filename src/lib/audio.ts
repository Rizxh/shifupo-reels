import { z } from "zod";

// Shared between scripts/tts.ts (writes) and the composition (reads, Phase 4).
// Keep this file free of Node-only imports: it is bundled for the browser.

// Voice over files follow a fixed convention and are never listed in episode
// JSON: audio/{id}/s{n}.mp3 with n starting at 1.
export const voAudioPath = (episodeId: string, sceneIndex: number): string =>
  `audio/${episodeId}/s${sceneIndex + 1}.mp3`;

// Alignment sidecar next to each VO file (word timings + generation metadata).
export const voAlignmentPath = (
  episodeId: string,
  sceneIndex: number,
): string => `audio/${episodeId}/s${sceneIndex + 1}.json`;

// Per-character timing as returned by ElevenLabs `with-timestamps`.
export const characterAlignmentSchema = z.object({
  characters: z.array(z.string()),
  character_start_times_seconds: z.array(z.number()),
  character_end_times_seconds: z.array(z.number()),
});

export const alignedWordSchema = z.object({
  text: z.string().min(1),
  startInSeconds: z.number().nonnegative(),
  endInSeconds: z.number().nonnegative(),
});

export const VO_SIDECAR_VERSION = 1;

export const voSidecarSchema = z.object({
  version: z.literal(VO_SIDECAR_VERSION),
  source: z.literal("elevenlabs"),
  modelId: z.string(),
  outputFormat: z.string(),
  // Hash of model + voice + text: lets the TTS script skip unchanged scenes
  // and regenerate ones whose line was edited.
  textHash: z.string(),
  text: z.string(),
  // Empty when the API returned no alignment; captions then fall back to an
  // even split across the VO duration.
  words: z.array(alignedWordSchema),
  // Integrated loudness of the audio file (LUFS), measured by the TTS script
  // or `npm run vo-level`. Lets the mix bring every line to the same level.
  loudnessLufs: z.number().optional(),
});

export type CharacterAlignment = z.infer<typeof characterAlignmentSchema>;
export type AlignedWord = z.infer<typeof alignedWordSchema>;
export type VoSidecar = z.infer<typeof voSidecarSchema>;

const WHITESPACE = /\s/;

// Groups per-character timings into words, splitting on whitespace exactly like
// splitWords() in text.ts, so word N here is word N of the caption.
export const alignmentToWords = (
  alignment: CharacterAlignment,
): AlignedWord[] => {
  const {
    characters,
    character_start_times_seconds: starts,
    character_end_times_seconds: ends,
  } = alignment;
  const words: AlignedWord[] = [];
  let text = "";
  let start = 0;
  let end = 0;

  const flush = () => {
    if (text.length > 0) {
      words.push({ text, startInSeconds: start, endInSeconds: end });
    }
    text = "";
  };

  characters.forEach((char, i) => {
    if (WHITESPACE.test(char)) {
      flush();
      return;
    }
    if (text.length === 0) {
      start = starts[i] ?? end;
    }
    text += char;
    end = ends[i] ?? start;
  });
  flush();

  return words;
};
