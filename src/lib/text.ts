// Pure text helpers shared by headlines and captions.

export const splitWords = (text: string): string[] =>
  text.trim().split(/\s+/).filter(Boolean);

// Lowercase and strip punctuation, keeping letters, digits and "/" (for "s/d").
export const normalizeWord = (word: string): string =>
  word.toLowerCase().replace(/[^\p{L}\p{N}/]+/gu, "");

// Marks which words belong to any of the given phrases (case and punctuation
// insensitive). "15 MENIT!" matches the words "15" and "MENIT!".
export const highlightMask = (
  words: string[],
  phrases: string[],
): boolean[] => {
  const mask = words.map(() => false);
  const normalized = words.map(normalizeWord);

  for (const phrase of phrases) {
    const target = splitWords(phrase).map(normalizeWord).filter(Boolean);
    if (target.length === 0) {
      continue;
    }
    for (let i = 0; i + target.length <= normalized.length; i++) {
      if (target.every((t, j) => normalized[i + j] === t)) {
        for (let j = 0; j < target.length; j++) {
          mask[i + j] = true;
        }
      }
    }
  }

  return mask;
};

export type WordTiming = {
  text: string;
  startFrame: number;
  endFrame: number;
};

// Spreads the words of a line evenly across the voice over duration. Phase 4
// replaces this with real alignment timestamps when they are available.
export const evenWordTimings = (
  text: string,
  startFrame: number,
  durationInFrames: number,
): WordTiming[] => {
  const words = splitWords(text);
  const perWord = durationInFrames / Math.max(words.length, 1);
  return words.map((word, i) => ({
    text: word,
    startFrame: Math.round(startFrame + i * perWord),
    endFrame: Math.round(startFrame + (i + 1) * perWord),
  }));
};

const SENTENCE_END = /[.?!]$/;

// Groups word indices into caption pages: a page ends at sentence punctuation
// or when it reaches the word limit.
export const paginateWords = (
  words: string[],
  maxWordsPerPage: number,
): number[][] => {
  const pages: number[][] = [];
  let current: number[] = [];

  words.forEach((word, i) => {
    current.push(i);
    if (current.length >= maxWordsPerPage || SENTENCE_END.test(word)) {
      pages.push(current);
      current = [];
    }
  });
  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
};

const ID_UNITS = [
  "nol",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
] as const;

// Spells an integer from 0 to 999 999 in Indonesian ("seratus", "tiga
// ribu"), so a number shown on screen can be checked against the voice over.
export const terbilang = (value: number): string => {
  if (!Number.isInteger(value) || value < 0 || value > 999_999) {
    throw new RangeError(
      `terbilang supports integers 0 to 999999, got ${value}`,
    );
  }
  if (value >= 1000) {
    const thousands = Math.floor(value / 1000);
    const rest = value % 1000;
    const head = thousands === 1 ? "seribu" : `${terbilang(thousands)} ribu`;
    return rest === 0 ? head : `${head} ${terbilang(rest)}`;
  }
  if (value < 10) {
    return ID_UNITS[value];
  }
  if (value < 20) {
    if (value === 10) return "sepuluh";
    if (value === 11) return "sebelas";
    return `${ID_UNITS[value - 10]} belas`;
  }
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const rest = value % 10;
    const head = tens === 1 ? "sepuluh" : `${ID_UNITS[tens]} puluh`;
    return rest === 0 ? head : `${head} ${ID_UNITS[rest]}`;
  }
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const head = hundreds === 1 ? "seratus" : `${ID_UNITS[hundreds]} ratus`;
  return rest === 0 ? head : `${head} ${terbilang(rest)}`;
};
