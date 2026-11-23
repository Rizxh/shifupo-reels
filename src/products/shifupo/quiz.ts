// Tokens of the quiz format (sp08): a fresh daytime paper living room in mint
// and teal (a different world from the coral Imlek parade), answer cards,
// countdown ring, host placement. Components hold no magic numbers.

import { COLORS, STAGE, VIDEO } from "./brand";

export const QUIZ_COLORS = {
  wallTop: "#D6F3EA",
  wallBottom: "#A9E1CF",
  wainscot: "#7CCBB3",
  wainscotLine: "#5DB59B",
  floor: "#E9B27A",
  floorLine: "#C98C55",
  window: "#BFE6FF",
  windowFrame: "#FFFFFF",
  cloud: "#FFFFFF",
  lamp: "#FFD45C",
  lampShade: "#FF8A65",
  cord: "#2F4A44",
  frame: "#FFFFFF",
  art: "#FF8A65",
  card: "#FFFFFF",
  cardLine: "#2F4A44",
  badgeA: "#FF8A65",
  badgeB: "#5DA9E9",
  ink: "#23403A",
  title: "#23403A",
  titleAccent: COLORS.seal,
  right: "#2FBF71",
  wrong: "#E2483D",
  ring: "#23403A",
  ringFill: "#FFD45C",
  wood: "#B97A4B",
  woodDark: "#8A5634",
  mirror: "#CFEFFF",
  mirrorShine: "#FFFFFF",
  sheet: "#FFFFFF",
  pillow: "#FFD9C9",
  blanket: "#5DA9E9",
  leaf: "#3FAE6B",
  leafLight: "#6CCB8A",
  leafDry: "#B98A4B",
  pot: "#FF8A65",
  arrow: "#E2483D",
  star: "#FFD45C",
  bubble: "#FFFFFF",
  shadow: "rgba(35,64,58,0.22)",
  burst: "#EFFFF8",
} as const;

export const QUIZ_PAPER = { edgeFrequency: 0.045, edgeScale: 4, shadowX: 7, shadowY: 10, shadow: QUIZ_COLORS.shadow } as const;

export const QUIZ_LAYOUT = {
  questionTop: 330,
  questionWidth: 800,
  questionSize: 58,
  kickerSize: 30,
  cardsY: 880, // center of the answer cards
  cardW: 400,
  cardH: 470,
  cardGap: 60,
  cardRadius: 34,
  badgeR: 42,
  badgeSize: 52,
  labelSize: 38,
  artScale: 1.15,
  dropFrom: -1100,
  ringY: 880,
  ringR: 74,
  ringNumber: 84,
  ringLabelSize: 30,
  hostX: STAGE.cx,
  hostY: 1238,
  hostScale: 0.65,
  hostBigY: 1180,
  hostBigScale: 1.6,
  hostMidY: 1236,
  hostMidScale: 1.05,
  floorY: 1500,
  winX: 690,
  winY: 120,
  winW: 300,
  winH: 220,
} as const;

export const QUIZ_MOTION = {
  cardGravity: 4.4,
  cardRestitution: 0.32,
  rightScale: 1.07,
  wrongShakePx: 16,
  wrongShakeFrames: 18,
  wrongDim: 0.5,
  crossFrames: 12,
  exitFrames: 12,
  breathe: 0.045,
  breathePeriod: 76,
  driftPx: 34,
  driftPeriod: 56,
  focusZoom: 1.06,
  followFrames: 14,
  tapEvery: 10,
  tapPx: 14,
  // Cards drop face down at the question start and flip on their letter.
  backDropDelay: 6,
  backDropStagger: 5,
  flipFrames: 12,
  // Paper life while things wait on screen (px / deg).
  cardHoverPx: 9,
  cardHoverDeg: 1.6,
  hostBobPx: 8,
  hostSwayDeg: 3,
  // Stars come in while the last cards leave and stay under the logo build.
  scoreLead: 14,
  scoreTail: 18,
  // Hook drops start before frame 0 (first frames are already full).
  hookLead: 18,
  // Sunburst behind score and logo.
  burstRays: 18,
  burstRadius: 1400,
  burstY: 820,
  burstTurn: 0.45,
  burstOpacity: 0.55,
  // Rays stay on the wall (above the wainscot).
  burstClipY: 1300,
} as const;

export const QUIZ_SCORE = { starY: 760, starGap: 230, starR: 92, bubbleX: 790, bubbleY: 1000 } as const;

export const QUIZ_FRAME = { width: VIDEO.width, height: VIDEO.height } as const;
