// Sound effects, all synthesized by scripts/sfx.ts (`npm run sfx`): no
// third-party audio to license. Browser-safe (bundled).

export const SFX = {
  gong: "audio/sfx/gong.wav",
  chime1: "audio/sfx/chime1.wav",
  chime2: "audio/sfx/chime2.wav",
  chime3: "audio/sfx/chime3.wav",
  chime4: "audio/sfx/chime4.wav",
  whoosh: "audio/sfx/whoosh.wav",
  tick: "audio/sfx/tick.wav",
  lock: "audio/sfx/lock.wav",
  thump: "audio/sfx/thump.wav",
  stamp: "audio/sfx/stamp.wav",
  coin: "audio/sfx/coin.wav",
  pop: "audio/sfx/pop.wav",
  shimmer: "audio/sfx/shimmer.wav",
} as const;

export type SfxName = keyof typeof SFX;

// Linear gains under the voice over (VO is 1).
export const SFX_MIX: Record<SfxName, number> = {
  gong: 0.32,
  chime1: 0.28,
  chime2: 0.28,
  chime3: 0.28,
  chime4: 0.28,
  whoosh: 0.3,
  tick: 0.12,
  lock: 0.4,
  thump: 0.45,
  stamp: 0.5,
  coin: 0.16,
  pop: 0.2,
  shimmer: 0.22,
};

// Seconds from the start of whoosh.wav to its loudest point.
export const WHOOSH_PEAK_SECONDS = 0.35;
// Compass ticks while the needle searches, every this many frames.
export const TICK_EVERY_FRAMES = 4;
