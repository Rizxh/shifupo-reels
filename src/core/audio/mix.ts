// Audio levels. Volumes are linear gain, 1 = unchanged.

// Every VO line is brought to this loudness before the mix, so lines match
// each other and the sound effects keep their balance whichever voice is used.
// The gain is limited so a bad measurement cannot blow a line up.
export const VO_LEVEL = {
  targetLufs: -25,
  maxGainDb: 15,
} as const;

export const voGainFor = (lufs: number | undefined): number => {
  if (lufs === undefined) {
    return 1;
  }
  const db = Math.min(
    VO_LEVEL.maxGainDb,
    Math.max(-VO_LEVEL.maxGainDb, VO_LEVEL.targetLufs - lufs),
  );
  return 10 ** (db / 20);
};

// Final loudness after `npm run postprocess`.
export const LOUDNESS_TARGET = {
  integratedLufs: -14,
  truePeakDb: -1.5,
  loudnessRange: 11,
  toleranceLu: 1,
} as const;

export const MIX = { vo: 1 } as const;
