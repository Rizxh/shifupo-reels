// Tokens of the parade format (sp07): a cheerful paper-cut Imlek stage in
// Motion Format style, with the 12 shio as cute paper characters. Not the
// black-and-white ink world: warm coral sky, gold, red, and one colour per
// character. Components hold no magic numbers.

import type { ShioSign } from "../../schema";
import { COLORS, STAGE, VIDEO } from "./brand";

export const PARADE_COLORS = {
  sky: ["#FF8E6E", "#FFB98A", "#FFE3B0"] as const,
  sun: "#FFD45C",
  sunDeep: "#F2B33D",
  cloud: "#FFF4E2",
  cloudShade: "#FFD9BC",
  hillFar: "#F59A7A",
  hill: "#E8705A",
  ground: "#D9503F",
  groundTop: "#F07A5F",
  lantern: COLORS.seal,
  lanternGlow: "#FFC25C",
  tassel: COLORS.gold,
  confetti: ["#FFD45C", "#FF6B57", "#FFFFFF", "#7FD3B8", COLORS.gold] as const,
  ink: "#3A1E1A",
  title: "#3A1E1A",
  titleAccent: COLORS.seal,
  face: { eye: "#3A2A2E", shine: "#FFF6E6", blush: "#FF7A6B" },
  shadow: "rgba(90,30,20,0.28)",
  highlight: "#FFE066",
} as const;

export const PARADE_PAPER = { edgeFrequency: 0.045, edgeScale: 4, shadowX: 7, shadowY: 10, shadow: PARADE_COLORS.shadow } as const;

// Body / accent colours per character (accent = ears inside, horns, comb...).
export const BUDDY_COLORS: Record<ShioSign, { body: string; belly: string; accent: string; detail: string }> = {
  rat: { body: "#A7AEC2", belly: "#E7E9F2", accent: "#F7A9B8", detail: "#6D7389" },
  ox: { body: "#9A6544", belly: "#E8C9A8", accent: "#FFF1D9", detail: "#6B4128" },
  tiger: { body: "#F59B3A", belly: "#FFF0DC", accent: "#2E2320", detail: "#2E2320" },
  rabbit: { body: "#FBF1EE", belly: "#FFFFFF", accent: "#F7A9B8", detail: "#D9C3BE" },
  dragon: { body: "#45B587", belly: "#D8F2DF", accent: "#FFD45C", detail: "#2D8A63" },
  snake: { body: "#9CCB4C", belly: "#E9F6C8", accent: "#E24A4A", detail: "#6E9A2E" },
  horse: { body: "#C9824C", belly: "#F3D3B1", accent: "#5A3420", detail: "#5A3420" },
  goat: { body: "#F6EAD6", belly: "#FFFFFF", accent: "#B98A5A", detail: "#D7C3A3" },
  monkey: { body: "#A8693D", belly: "#F6C9A0", accent: "#F6C9A0", detail: "#7A4625" },
  rooster: { body: "#FFF7EE", belly: "#FFFFFF", accent: "#E8423A", detail: "#F5B532" },
  dog: { body: "#E9B06E", belly: "#FFF0DA", accent: "#9C6234", detail: "#3A2A2E" },
  pig: { body: "#F7A9B8", belly: "#FFD3DB", accent: "#E9839A", detail: "#D9667F" },
};

// Home grid: 4 columns x 3 rows in wheel order (Rat first).
export const PARADE_GRID = {
  cols: 4,
  rows: 3,
  cx: STAGE.cx,
  // Feet of the first row; rows fill the stage between titles and captions.
  top: 830,
  colGap: 215,
  rowGap: 195,
  scale: 0.85,
} as const;

// Focus layout: members come to the front, the others step back.
export const PARADE_FOCUS = {
  // Members stand here (feet), large, just above the caption band.
  y: 1170,
  maxGap: 300,
  minGap: 175,
  scaleFew: 1.55, // 1-2 members
  scaleThree: 1.3,
  scaleMany: 1.1, // 4+ members
  backScale: 0.62,
  backOpacity: 0.6,
  // The audience row under the captions (decorative, may sit under the IG UI).
  backY: 1660,
  travelFrames: 16,
  hopHeight: 70,
} as const;

export const BUDDY = {
  head: 62, // head radius at scale 1
  body: 44,
  faceSize: 1.05,
  idleBob: 8,
  idleSway: 4,
  blinkEvery: 110,
  hopGravity: 1.6,
  hopRestitution: 0.35,
  dropFrom: 520,
  dropStagger: 2,
  // The drop starts before frame 0: the first frame already has falling characters mid-frame.
  dropLead: 22,
} as const;

// Verdict stamp: this far above the tallest member's head.
export const PARADE_STAMP = { gap: 70, angle: -8 } as const;

export const PARADE_LANTERNS = [
  { x: 120, len: 210, size: 1 },
  { x: VIDEO.width - 120, len: 170, size: 0.9 },
  { x: 330, len: 120, size: 0.7 },
  { x: VIDEO.width - 330, len: 140, size: 0.75 },
] as const;

// Stage camera (Motion Format: never locked off): breathing zoom, slow pan
// and a small punch-in at every beat start.
export const PARADE_CAM = {
  breathe: 0.035,
  breathePeriod: 64,
  // Focus-follow zoom per group size, and the pull-back for the stamp.
  zoomFew: 1.2,
  zoomThree: 1.08,
  zoomMany: 1.14,
  zoomStamp: 1.0,
  followFrames: 16,
  driftPx: 22,
  driftPeriod: 45,
  followThree: 0.25,
  followMany: 0.3,
  // Layers are drawn this far beyond the frame so the camera never shows an edge.
  margin: 500,
  confetti: 72,
  // Front members keep doing little hops while they talk.
  hopEvery: 22,
  hopPx: 34,
  // Leavers step back this late so the centre is never empty.
  leaveDelay: 12,
  // Name tag sits over the feet (clear of the caption band when zoomed).
  tagBelow: 30,
} as const;

export const PARADE_PILLARS = { x: STAGE.cx, y: 1225 } as const;

// Ground line of the stage (the audience stands on it, below the captions).
export const PARADE_GROUND = { y: 1500, hillFar: 1330, hillNear: 1440 } as const;
