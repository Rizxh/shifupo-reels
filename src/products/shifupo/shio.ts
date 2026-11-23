// Tokens of the shio format (sp06): wheel layout, seal look, glyphs, camera
// per beat and relation strokes. ShioReel and ShioWheel hold no magic numbers.

import type { ShioSign } from "../../schema";
import { COLORS, STAGE } from "./brand";

// Traditional glyphs, in wheel order starting with Rat (Zi) at the top.
export const SHIO_GLYPH: Record<ShioSign, string> = {
  rat: "鼠",
  ox: "牛",
  tiger: "虎",
  rabbit: "兔",
  dragon: "龍",
  snake: "蛇",
  horse: "馬",
  goat: "羊",
  monkey: "猴",
  rooster: "雞",
  dog: "狗",
  pig: "豬",
};

export const SHIO_ORDER: readonly ShioSign[] = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  "snake",
  "horse",
  "goat",
  "monkey",
  "rooster",
  "dog",
  "pig",
];

export const WHEEL = {
  cx: STAGE.cx,
  // Above the stage center so the bottom seal and its name clear the captions.
  cy: STAGE.cy - 50,
  radius: 300,
  sealRadius: 54,
  heroRadius: 118,
  ringStroke: 3,
  glyphSize: 58,
  heroGlyphSize: 150,
  labelSize: 34,
  labelGap: 22,
  dimOpacity: 0.32,
  // Idle life of every seal (px / deg).
  idleBob: 5,
  idleSway: 3,
  // Seals pop from this scale on their cue, then settle.
  popFrom: 1.45,
  popFrames: 14,
  heroMaxScale: 1.1,
} as const;

export const SHIO_COLORS = {
  seal: COLORS.seal,
  sealDeep: COLORS.sealDeep,
  glyph: COLORS.paper,
  ring: COLORS.goldDeep,
  link: COLORS.gold,
  linkHalo: "rgba(248,244,236,0.7)",
  ribbon: COLORS.seal,
  clash: COLORS.sealDeep,
  flameCore: COLORS.goldLight,
  flameMid: COLORS.koiOrange,
  flameOuter: COLORS.seal,
  label: COLORS.ink,
  labelBg: "rgba(248,244,236,0.92)",
} as const;

export const SHIO_LINK = {
  stroke: 9,
  drawFrames: 22,
  ribbonWidth: 14,
  arrowStroke: 12,
  clashShakePx: 10,
  clashShakeFrames: 16,
  // Arrow tips stop at this fraction of the radius (outside the hero).
  clashStop: 0.48,
} as const;

// Date card that drops on its cue (year beat).
export const SHIO_CARD = {
  width: 660,
  height: 300,
  dropFrom: -900,
  y: STAGE.cy - 40,
  textSize: 86,
  subSize: 46,
  gravity: 4.2,
  // Gentle pendulum sway once it has landed (deg, frames per swing).
  swayDeg: 2.2,
  swayPeriod: 46,
  // Stays this many frames into the next beat while the triangle starts.
  overlapFrames: 10,
} as const;

// Four BaZi pillars of the payoff beat: base position (glyph sits 240 px up).
export const SHIO_PILLARS = { x: STAGE.cx, y: 1290 } as const;

// Wheel camera per beat (scale, extra rotation from the year-up pose,
// center, opacity); the composition eases between them on cue frames.
export const SHIO_CAM = {
  hookSpin: -330,
  hookFromScale: 0.3,
  yearScale: 0.9,
  yearOpacity: 0.45,
  drift: 6,
  allyScale: 1.55,
  allyPairY: 880,
  clashSpin: -360,
  // Bottom seal + its name stay above the caption band (CAPTION.y 1246).
  clashScale: 0.9,
  clashY: 850,
  pillarScale: 0.32,
  pillarY: 640,
  travelFrames: 16,
  // Continuous slow turn of the wheel (deg per frame), small enough that the
  // year sign stays near the top through the reel.
  idleTurn: 0.03,
  // The clash spin gets more frames than an ordinary travel (deliberate
  // whip, not a glitch: 16 frames read as a hard cut in qc-motion).
  clashTravel: 26,
  // Faint wheel turning behind the CTA logo keeps the ending alive.
  ctaWheelScale: 1.35,
  ctaWheelOpacity: 0.1,
  ctaWheelTurn: 0.22,
  // Slow breathing zoom of the wheel (fraction, frames per cycle) and the
  // mountain parallax speed: the camera is never locked off.
  breathe: 0.035,
  breathePeriod: 72,
  mountainParallax: 2,
} as const;
