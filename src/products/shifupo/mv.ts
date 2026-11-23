// Music video format (sp09, MvReel): lyric typography, overlays and the cut
// treatment. Sizes are in px of the 1080x1920 frame.

import { SAFE_AREA } from "./brand";

export const MV_LYRIC = {
  // Lyrics longer than this break into two lines at the middle space.
  breakAfterChars: 11,
  maxSize: 124,
  minSize: 64,
  // Cinzel capitals are wide: average advance per character, in em.
  charEm: 0.8,
  lineHeight: 1.04,
  letterSpacingEm: 0.04,
  // Bottom edge of the lyric block, inside the safe area.
  bottom: SAFE_AREA.y + SAFE_AREA.height - 40,
  staggerFrames: 1.4,
  inFrames: 14,
  outFrames: 8,
  riseIn: 26,
  blurIn: 12,
  gradient: "linear-gradient(180deg, #FFF6D8 0%, #F6D98E 42%, #D7A548 70%, #A8741F 100%)",
  shadow: "drop-shadow(0 4px 2px rgba(60,20,8,0.75)) drop-shadow(0 0 22px rgba(40,12,4,0.55))",
} as const;

// Smoke title: the lyric forms out of incense smoke, high in the frame.
export const MV_SMOKE = {
  centerY: SAFE_AREA.y + 230,
  size: 118,
  inFrames: 30,
  blurIn: 26,
  scaleIn: 1.18,
  color: "#FFF4DE",
  glow: "0 0 18px rgba(255,236,200,0.9), 0 0 46px rgba(255,190,110,0.55), 0 3px 3px rgba(40,14,6,0.6)",
  wisps: 16,
  wispSpread: 360,
} as const;

// Montage badges (ADA SEBABNYA): gold line icon + handwritten note.
export const MV_ICON = {
  x: SAFE_AREA.x + SAFE_AREA.width / 2,
  // Top of the frame: 2D worlds frame faces in the upper middle.
  y: SAFE_AREA.y + 120,
  size: 170,
  stroke: 9,
  color: "#F6D98E",
  shadow: "rgba(40,12,4,0.7)",
  noteSize: 86,
  popFrames: 9,
  labels: {
    "icon-clock": "Buka tepat waktu",
    "icon-goods": "Barang tertata rapi",
    "icon-broom": "Toko bersih",
    "icon-scale": "Timbangan jujur",
  },
} as const;

// HOKGI: a red fu diamond (doufang) with a gold 福 pops over the lyric.
export const MV_FU = {
  x: SAFE_AREA.x + SAFE_AREA.width / 2,
  y: SAFE_AREA.y + 300,
  size: 250,
  red: "#B3121C",
  redDeep: "#7E0A12",
  gold: "#F4D27E",
  glyph: "福",
  sparkles: 18,
} as const;

// Outro card over the golden world.
export const MV_OUTRO = {
  logoWidth: 520,
  logoY: SAFE_AREA.y + 120,
  titleY: SAFE_AREA.y + 560,
  titleSize: 112,
  taglineY: SAFE_AREA.y + 800,
  taglineSize: 54,
  taglineWidth: SAFE_AREA.width - 40,
  glow: "radial-gradient(ellipse 70% 42% at 50% 34%, rgba(255,246,222,0.92) 0%, rgba(255,236,190,0.6) 45%, rgba(255,220,150,0) 80%)",
  ink: "#4A1E0E",
  // Title over the bright golden world: lacquer red with a gold rim.
  titleGradient: "linear-gradient(180deg, #D23A2E 0%, #A8161D 55%, #6E0C10 100%)",
  titleShadow: "drop-shadow(0 0 2px #F6D98E) drop-shadow(0 0 2px #F6D98E) drop-shadow(0 6px 10px rgba(80,30,5,0.45))",
} as const;

// "smoke-word" (smoke forms a word late in the shot) and "sparkle-word"
// (small gold word in a sparkle burst, upper right).
export const MV_WORD = {
  smokeAt: 0.35,
  x: SAFE_AREA.x + SAFE_AREA.width - 230,
  y: SAFE_AREA.y + 170,
  size: 64,
  sparkles: 14,
  spread: 170,
} as const;

export const MV_CUT = {
  // Warm light leak across every cut, frames on each side.
  leakFrames: 6,
  leakColor: "rgba(255,198,120,0.9)",
  // Music fades.
  musicFadeIn: 0.4,
  musicFadeOut: 2.2,
  musicVolume: 0.9,
  sfxGain: 0.9,
  grain: 0.03,
  // Bottom scrim behind the lyrics.
  scrimBottom: 0.36,
  scrimTop: 0.18,
  scrimStrength: 0.5,
} as const;
