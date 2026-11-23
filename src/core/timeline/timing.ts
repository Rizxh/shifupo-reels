// Timing constants. Durations always come from the voice over; these are the
// pads and pacing around it.

export const FPS = 30;

// 60 s cap: the user asked for longer, clearer reels (sp07, 14 Nov 2026).
export const REEL = { minSeconds: 15, maxSeconds: 60 } as const;
// A music video follows its song (sp09: 72 s lyric table), up to 90 s.
export const MV_REEL = { minSeconds: 15, maxSeconds: 90 } as const;
export const reelLimits = (format: string | undefined) => (format === "mv" ? MV_REEL : REEL);

// Start frame of every scene of a music video plus the end frame, from the
// scene lengths in seconds (cumulative rounding: no drift over 18 scenes).
export const mvStarts = (seconds: readonly number[], fps: number = FPS): number[] => {
  const starts = [0];
  let acc = 0;
  for (const s of seconds) {
    acc += s;
    starts.push(Math.round(acc * fps));
  }
  return starts;
};

export const PACING = {
  // Silence before the first line, between lines, and after the last one.
  leadInSeconds: 0.35,
  lineGapSeconds: 0.3,
  outroHoldSeconds: 1.2,
  // Speaking rate used to estimate a line before its VO file exists.
  estimateWordsPerSecond: 2.05,
  estimateMinLineSeconds: 1.6,
} as const;

// The 15-second pop-out format (docs/sp02/PLAN.md): a longer final hold so
// the last pop-out lands, and never shorter than the reel minimum.
export const POP_PACING = {
  outroHoldSeconds: 1.6,
  minSeconds: REEL.minSeconds + 0.5,
} as const;

export const secondsToFrames = (seconds: number, fps: number = FPS): number =>
  Math.round(seconds * fps);

// Cinema format (sp04): VO in ElevenLabs v3 reads slower and more dramatically,
// so the final hold is a little shorter to stay within the 30 s reel limit.
export const CINEMA_PACING = {
  outroHoldSeconds: 1.0,
} as const;
