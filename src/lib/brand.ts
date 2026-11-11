// Brand tokens for Shifu Po (from the shifupo-home-v2 website). Every color,
// font, size and safe zone used by the composition lives here.

import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadNotoSerifSC } from "@remotion/google-fonts/NotoSerifSC";

const jakarta = loadJakarta("normal", {
  weights: ["500", "700", "800"],
  subsets: ["latin"],
});
const cinzel = loadCinzel("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});
const han = loadNotoSerifSC("normal", { weights: ["700", "900"] });

export const FONTS = {
  body: jakarta.fontFamily,
  display: cinzel.fontFamily,
  han: han.fontFamily,
} as const;

export const COLORS = {
  ink: "#12100E",
  inkSoft: "#2A2520",
  paper: "#F8F4EC",
  paperDeep: "#EFE7D8",
  line: "#E2D7C3",
  muted: "#6B6257",
  gold: "#C9A45C",
  goldDeep: "#9C7A35",
  goldLight: "#F1DDA8",
  seal: "#A8161D",
  sealDeep: "#7E0F15",
  blueprint: "#3F5F8F",
  jade: "#2E7D63",
  koiOrange: "#E0662B",
  white: "#FFFFFF",
} as const;

export const GOLD_GRADIENT = [
  { offset: 0, color: COLORS.goldLight },
  { offset: 0.48, color: COLORS.gold },
  { offset: 1, color: COLORS.goldDeep },
] as const;

export const VIDEO = { width: 1080, height: 1920, fps: 30 } as const;

// Bands covered by the Instagram Reels interface. Text never enters them.
export const SAFE_ZONE = {
  top: 250,
  bottom: 420,
  right: 160,
  left: 0,
} as const;
export const GUTTER = 64;
export const SAFE_AREA = {
  x: SAFE_ZONE.left + GUTTER,
  y: SAFE_ZONE.top + GUTTER,
  width: VIDEO.width - SAFE_ZONE.left - SAFE_ZONE.right - GUTTER * 2,
  height: VIDEO.height - SAFE_ZONE.top - SAFE_ZONE.bottom - GUTTER * 2,
} as const;

// Where the subject of each scene sits: between the headline block and the
// captions, horizontally centered on the frame.
export const STAGE = {
  cx: VIDEO.width / 2,
  cy: 1010,
} as const;

export const TYPE = {
  headline: 96,
  hook: 124,
  headlineSmall: 64,
  kicker: 30,
  caption: 46,
  figure: 140,
  figureLabel: 44,
  button: 46,
  tagline: 62,
  pillarGlyph: 112,
  pillarLabel: 30,
  logoName: 84,
  logoSub: 30,
  logoGlyph: 150,
} as const;

export const HEADLINE = {
  top: SAFE_AREA.y + 10,
  gap: 14,
  // Text lands this many frames before its cue word.
  leadFrames: 3,
  enterFrames: 10,
  exitFrames: 8,
  staggerFrames: 4,
  lineHeight: 1.16,
  letterSpacing: "0.02em",
  shadow: "0 6px 24px rgba(18, 16, 14, 0.18)",
} as const;

export const CAPTION = {
  height: 190,
  maxWordsPerPage: 4,
  boxPadding: "0.06em 0.16em",
  rowGap: 8,
  y: SAFE_AREA.y + SAFE_AREA.height - 190,
} as const;

export const BUTTON = {
  height: 116,
  paddingX: 56,
  radius: 58,
  iconSize: 54,
} as const;

// Ink transition between scenes: a growing ink blot with a ragged edge.
export const INK_WIPE = {
  frames: 16,
  points: 72,
  roughness: 0.16,
} as const;

export const SHIFU = {
  photo: "assets/shifu/shifu.png",
  // Height of the figure when it stands in the frame.
  height: 1080,
} as const;

export const LOGO = {
  sealRadius: 118,
} as const;

// Pop-out format (docs/sp02/PLAN.md): a lacquer frame on the plane z = 0
// and a camera looking at it, so objects can break out toward the viewer.
export const POP = {
  frame: { x: 100, y: 600, width: 880, height: 630, border: 38 },
  // The window is recessed this far behind the frame face.
  recess: 46,
  // Camera focal length in px: a point at depth z scales by f / (f - z).
  focal: 1500,
  sway: { yawDeg: 3.2, pitchDeg: 1.8 },
  // How far the camera pulls back when something breaks out (px of depth).
  kickDolly: 70,
  kickFrames: 26,
  // Shadow of a point at height z falls at (x + z * dx, y + z * dy) on the
  // frame plane, blurred by z * blur px.
  shadow: { dx: 0.2, dy: 0.3, blur: 0.03, opacity: 0.34 },
  // Objects closer than this scale start to blur (depth of field)...
  dofFromScale: 1.9,
  dofBlurPerScale: 7,
  // ...and are gone by this depth, before they reach the camera.
  nearFade: { from: 760, to: 1060 },
  type: {
    headline: 80,
    label: 56,
    count: 200,
    brand: 92,
  },
  luopanScale: 0.8,
  koiScale: 1.7,
  shifu: { x: 770, baseY: 1350, height: 820 },
  button: { x: 540, y: 1100 },
  // Width of the official logo in the CTA headline column.
  logoWidth: 560,
} as const;
