// Timing constants. Durations always come from the voice over; these are the
// pads and pacing around it.

export const FPS = 30;

export const REEL = { minSeconds: 15, maxSeconds: 30 } as const;

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
