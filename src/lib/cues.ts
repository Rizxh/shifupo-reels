// Cue words tie a visual or sound event to the moment a word is spoken in
// the voice over. A cue must match exactly one word of its line, so the
// event can never drift to the wrong repetition.

import { normalizeWord, splitWords } from "./text";

// Indices of the words in `vo` that match the cue (case and punctuation
// insensitive).
export const cueMatches = (vo: string, cueWord: string): number[] => {
  const target = normalizeWord(cueWord);
  const matches: number[] = [];
  splitWords(vo).forEach((word, i) => {
    if (target.length > 0 && normalizeWord(word) === target) {
      matches.push(i);
    }
  });
  return matches;
};

// Index of the cue word inside `vo`, or null unless it matches exactly once.
export const cueWordIndex = (vo: string, cueWord: string): number | null => {
  const matches = cueMatches(vo, cueWord);
  return matches.length === 1 ? matches[0] : null;
};
