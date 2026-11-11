// One continuous timeline built from the VO lines: where each line is
// spoken, where each scene's picture begins and ends, and the frame on which
// any cue word is spoken.

import { cueWordIndex } from "./cues";
import type { WordTiming } from "./text";
import { PACING, secondsToFrames } from "./timing";

// A VO line as measured: its length and word timings relative to its start.
export type VoLine = {
  voDurationInFrames: number;
  voSrc?: string;
  voGain?: number;
  words: WordTiming[];
};

// A scene on the global timeline (all frames are composition frames).
export type Beat = {
  // The scene's picture owns [startFrame, endFrame).
  startFrame: number;
  endFrame: number;
  voStartFrame: number;
  voDurationInFrames: number;
  voSrc?: string;
  voGain?: number;
  words: WordTiming[];
};

export const layoutBeats = (
  lines: VoLine[],
  fps: number,
): { beats: Beat[]; durationInFrames: number } => {
  const leadIn = secondsToFrames(PACING.leadInSeconds, fps);
  const gap = secondsToFrames(PACING.lineGapSeconds, fps);
  const outro = secondsToFrames(PACING.outroHoldSeconds, fps);
  const starts: number[] = [];
  lines.forEach((line, i) => {
    starts.push(
      i === 0 ? leadIn : starts[i - 1] + lines[i - 1].voDurationInFrames + gap,
    );
  });
  const last = lines.length - 1;
  const durationInFrames =
    lines.length === 0
      ? outro
      : starts[last] + lines[last].voDurationInFrames + outro;
  // A scene's picture starts in the middle of the pause before its line.
  const sceneStart = (i: number) =>
    i === 0 ? 0 : starts[i] - Math.ceil(gap / 2);
  const beats = lines.map((line, i) => ({
    startFrame: sceneStart(i),
    endFrame: i === last ? durationInFrames : sceneStart(i + 1),
    voStartFrame: starts[i],
    voDurationInFrames: line.voDurationInFrames,
    voSrc: line.voSrc,
    voGain: line.voGain,
    words: line.words.map((w) => ({
      text: w.text,
      startFrame: starts[i] + w.startFrame,
      endFrame: starts[i] + w.endFrame,
    })),
  }));
  return { beats, durationInFrames };
};

// Frame on which `cue` is spoken in this beat's line. The schema guarantees
// every cue matches exactly one word; anything else is a programming error.
export const cueFrame = (beat: Beat, vo: string, cue: string): number => {
  const index = cueWordIndex(vo, cue);
  const word = index === null ? undefined : beat.words[index];
  if (!word) {
    throw new Error(`Cue "${cue}" has no timing in "${vo}"`);
  }
  return word.startFrame;
};

// Words spread evenly over a line, used until the VO file and its timings exist.
export const evenWordTimings = (
  words: string[],
  durationInFrames: number,
): WordTiming[] => {
  const step = durationInFrames / Math.max(1, words.length);
  return words.map((text, i) => ({
    text,
    startFrame: Math.round(i * step),
    endFrame: Math.round((i + 1) * step),
  }));
};
