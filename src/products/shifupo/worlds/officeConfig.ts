// Tokens of the "office" world (sp05): layout in meters, colors, lights,
// physics constants, camera shots per beat and the film look. The world
// component holds no magic numbers.

import type { ShotSpec, Vec3 } from "../../../core/three/rig";
import type { LookConfig } from "../../../core/three/Stage3D";
import { COLORS } from "../brand";

export const OFFICE = {
  room: { half: 3, height: 2.8, wall: 0.12 },
  door: { z: -1.6, width: 1.0, height: 2.1, openDeg: 78 },
  window: { x0: 0.2, x1: 1.8, y0: 1.0, y1: 2.3 },
  // Desk group: chair at local origin facing +x, desk top centered at x 0.5.
  desk: { z: 0.4, startX: 0.6, endX: 2.45, top: 0.78, edgeX: 0.1 },
  chairBackLocal: [-0.24, 0.92, 0] as Vec3,
  deskFrontLocal: [1.0, 0.95, 0] as Vec3,
  // m / frame² (slightly faster than real gravity reads better at 30 fps).
  gravity: 0.0125,
  coins: { radius: 0.035, vx: -0.06, vz: -0.05, friction: 0.025, restitution: 0.45 },
  chi: {
    door: [-2.9, 1.1, -1.6] as Vec3,
    bend: [-1.2, 1.75, -1.0] as Vec3,
    calmBend: [-0.4, 0.45, -1.3] as Vec3,
    count: 40,
    spawnEvery: 1.5,
    travel: 34,
    size: 0.03,
    hdr: 4, // core brightness above 1 so it blooms
    hitLife: 130,
  },
  walker: { frames: 52 },
  sun: { position: [2.5, 6.5, -10] as Vec3 },
  sunShaft: { from: [1.0, 1.65, -3.0] as Vec3, to: [0.37, 0, -0.46] as Vec3, width: 1.5, height: 1.2, opacity: 0.045, motes: 70 },
  light: { ambient: 0.35, hemi: 0.65, sun: 5.2, corridor: 38, lamp: 2.4, room: 10 },
  colors: {
    floor: "#b27c4c",
    floorDark: "#5a3a22",
    woodLight: "#c99560",
    woodDark: "#4a2f1d",
    walnut: "#3b2416",
    wall: "#efe3cc",
    wainscot: "#6b4a33",
    sky: "#ffcb88",
    sun: "#ffd39c",
    corridor: "#fff0d4",
    bulb: "#ffd28f",
    ambient: "#ffe6c7",
    chair: "#2c2b2e",
    pot: "#ebe3d4",
    leaf: "#3e7a4d",
    leafLight: "#62a062",
    coin: "#e3b24f",
    rugField: "#7a1c1e",
    rugBorder: "#2a1712",
    books: [COLORS.seal, COLORS.jade, COLORS.goldDeep, COLORS.inkSoft, COLORS.paperDeep, "#3a4f6b", "#8a5a34"],
  },
} as const;

// One camera per beat, keyed on beat progress (0..1). The rig travels from
// the end of one shot to the start of the next (match move).
export const OFFICE_SHOTS: Record<string, ShotSpec> = {
  // Crane down from above the diorama to behind the desk, door in frame.
  "office-hook": {
    fov: 32,
    handheld: 0.012,
    focus: [-0.6, 0.9, -0.4],
    keys: [
      { t: 0, pos: [2.2, 9.5, 9.2], look: [0.2, 0.3, -0.3] },
      { t: 0.6, pos: [3.2, 3.2, 5.0], look: [-0.6, 1.2, -0.7], fov: 40 },
      { t: 1, pos: [2.9, 2.5, 4.2], look: [-1.0, 1.35, -0.9], fov: 40 },
    ],
  },
  // POV of the sitter: screen first, then a slow look over the shoulder.
  "office-context": {
    // Over-the-shoulder POV of the sitter: the desk first (screen, lamp,
    // coins), then a slow look back over the chair to the open door.
    fov: 52,
    handheld: 0.006,
    keys: [
      { t: 0, pos: [0.42, 1.5, 0.5], look: [1.6, 0.85, 0.45] },
      { t: 0.25, pos: [0.42, 1.5, 0.5], look: [1.6, 0.86, 0.4] },
      { t: 0.72, pos: [0.4, 1.52, 0.56], look: [-3.0, 0.9, -1.5], roll: 4 },
      { t: 1, pos: [0.38, 1.53, 0.58], look: [-3.0, 0.9, -1.65], roll: 2 },
    ],
  },
  "office-cause": {
    // Small arc on the door → chair line (above the desk): the bare chair
    // back in front, the glowing door straight behind it, chi in between.
    fov: 38,
    handheld: 0.01,
    focus: [0.36, 0.9, 0.4],
    keys: [
      { t: 0, pos: [3.1, 2.3, 2.3], look: [-0.6, 0.85, -0.3] },
      { t: 0.5, pos: [2.8, 2.4, 2.6], look: [-0.65, 0.85, -0.3] },
      { t: 1, pos: [2.45, 2.5, 2.85], look: [-0.7, 0.85, -0.3] },
    ],
  },
  // Macro on the coins, then a tilt that follows them to the floor.
  "office-effect": {
    // Macro on the coins, then the camera pulls back and up WHILE following
    // them down (the chair pole and desk legs stay out of the lens), and
    // ends looking along the floor toward the door they roll to.
    fov: 34,
    handheld: 0.008,
    keys: [
      { t: 0, pos: [0.45, 1.3, 1.6], look: [0.95, 0.79, 0.7], fov: 38 },
      { t: 0.4, pos: [0.42, 1.27, 1.63], look: [0.85, 0.78, 0.7], fov: 36 },
      { t: 0.62, pos: [0.25, 1.4, 2.05], look: [0.2, 0.35, 0.3], fov: 36 },
      { t: 1, pos: [-0.1, 1.6, 2.65], look: [-1.4, 0.08, -0.6], fov: 38 },
    ],
  },
  // Top-down floor plan, rolled so the desk-to-door axis runs vertically.
  "office-fix": {
    fov: 36,
    handheld: 0.004,
    keys: [
      { t: 0, pos: [3.4, 6.2, 3.2], look: [1.4, 0, 0.0], fov: 40, roll: -18 },
      { t: 0.45, pos: [3.5, 7.0, 3.6], look: [0.9, 0, -0.2], fov: 40, roll: -22 },
      { t: 1, pos: [3.4, 8.2, 4.2], look: [0.2, 0, -0.5], fov: 40, roll: -26 },
    ],
  },
  // Pull back out of the room to the whole diorama.
  "office-payoff": {
    fov: 32,
    handheld: 0.01,
    focus: [0.5, 0.9, -0.2],
    keys: [
      { t: 0, pos: [2.4, 2.3, 4.0], look: [0.4, 0.9, -0.3] },
      { t: 1, pos: [6.2, 6.6, 12.6], look: [0.0, 0.8, -0.5] },
    ],
  },
  // Crane up: the diorama sinks to the bottom, the brand takes the frame.
  "office-cta": {
    fov: 32,
    handheld: 0.006,
    focus: [0, 0.8, -0.5],
    keys: [
      { t: 0, pos: [6.2, 6.6, 12.6], look: [0.0, 0.8, -0.5] },
      { t: 1, pos: [4.2, 12.5, 10.5], look: [0.0, 4.4, -1.5] },
    ],
  },
};

export const OFFICE_LOOK: LookConfig = {
  background: "#1b130d",
  ao: { radius: 0.6, intensity: 2.0 },
  bloom: { intensity: 0.75, threshold: 0.88, smoothing: 0.25 },
  dof: { range: 1.8, bokehScale: 1.7 },
  vignette: { offset: 0.28, darkness: 0.6 },
  panels: [
    { color: "#ffe1b8", intensity: 3.0, position: [0, 6, 7], scale: [10, 4] },
    { color: "#c4d6ff", intensity: 1.0, position: [-7, 3, -2], scale: [4, 6] },
    { color: "#ffffff", intensity: 1.6, position: [7, 2.5, 2], scale: [3, 6] },
  ],
};

export const OFFICE_EVENTS = [
  "door-open",
  "walker",
  "chi-hit",
  "papers-fly",
  "coins-fall",
  "desk-turn",
  "sightline",
  "coins-return",
  "lights-on",
] as const;
