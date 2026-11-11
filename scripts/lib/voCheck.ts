// Compares what whisper heard in a finished video with the script, word by
// word, to catch a missing, swapped or garbled line before publishing.

import { normalizeWord, splitWords, terbilang } from "../../src/lib/text";

// Whisper writes small numbers as digits; the script spells them out.
const spellNumbers = (word: string): string[] => {
  const n = normalizeWord(word);
  if (/^\d+$/.test(n) && Number(n) <= 999) {
    return splitWords(terbilang(Number(n)));
  }
  return n ? [n] : [];
};

export type VoCheck = {
  // Share of script words heard in order (0 to 1).
  ratio: number;
  // Script words that were not heard, in script order.
  missing: string[];
};

// Whisper sometimes splits a compound the script writes as one word
// ("dokter mobil" for "Doktermobil"); join such neighbours back.
const joinCompounds = (heard: string[], scriptWords: Set<string>): string[] => {
  const out: string[] = [];
  for (let i = 0; i < heard.length; i++) {
    const pair = heard[i] + (heard[i + 1] ?? "");
    if (
      !scriptWords.has(heard[i]) &&
      i + 1 < heard.length &&
      scriptWords.has(pair)
    ) {
      out.push(pair);
      i++;
    } else {
      out.push(heard[i]);
    }
  }
  return out;
};

// Longest common subsequence of the two word lists: the script words heard
// in the right order, whatever else whisper added around them.
export const checkVo = (script: string[], heard: string[]): VoCheck => {
  const a = script.flatMap(spellNumbers);
  const b = joinCompounds(heard.flatMap(spellNumbers), new Set(a));
  const lcs = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const missing: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < b.length && a[i] === b[j]) {
      i++;
      j++;
    } else if (j < b.length && lcs[i][j + 1] >= lcs[i + 1][j]) {
      j++;
    } else {
      missing.push(a[i]);
      i++;
    }
  }
  return { ratio: a.length === 0 ? 1 : lcs[0][0] / a.length, missing };
};
