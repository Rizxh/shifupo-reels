// Tokens of the "ruko" world (sp09 "KITA PAY JAY SEN" music video): a
// premium toy diorama of a family shophouse with a Cai Shen altar, a carved
// red door onto a busy market street. Layout in meters, colours, lights,
// camera shots (one per storyboard shot) and the film look.

import type { ShotSpec, Vec3 } from "../../../core/three/rig";
import type { LookConfig } from "../../../core/three/Stage3D";
import { COLORS } from "../brand";

export const RUKO = {
  room: { halfX: 4, back: -4, front: 2, height: 3.2, wall: 0.14 },
  door: { width: 2.4, height: 2.5, openDeg: 100 },
  altar: { x: 0, z: -3.45, top: 0.82, width: 2.0, depth: 0.7 },
  caishen: { pos: [0, 0.97, -3.6] as Vec3, height: 0.95 },
  burner: [0, 0.82, -3.2] as Vec3,
  incenseTip: [0, 1.18, -3.2] as Vec3,
  tiger: [0.62, 0.97, -3.52] as Vec3,
  counter: { x: 2.3, z: 0.4 },
  table: { x: -2.1, z: 0.6 },
  street: { z0: 2, z1: 11, stallX: 3.6 },
  family: {
    grandpa: [-0.25, 0, -2.25] as Vec3,
    father: [0.75, 0, -2.0] as Vec3,
    mother: [-1.05, 0, -1.9] as Vec3,
    kid: [0.25, 0, -1.65] as Vec3,
  },
  sun: [6, 9, 12] as Vec3,
  colors: {
    floor: "#C98F5E",
    floorDark: "#7A4B2C",
    wall: "#F3E1C2",
    wallLow: "#B23A2E",
    beam: "#5A2E1C",
    red: COLORS.seal,
    redLacquer: "#C2272D",
    gold: COLORS.gold,
    goldLight: COLORS.goldLight,
    wood: "#8A5532",
    woodDark: "#4E2C18",
    street: "#B9A68C",
    stall: "#E8D2A8",
    awning: ["#C2272D", "#E9A23B", "#2E8B6E", "#C2272D"] as const,
    sky: ["#FFCB8A", "#FF9E6E", "#7A5AA0"] as const,
    lantern: "#E0262B",
    lanternGlow: "#FFB25C",
    smoke: "#FFF3E0",
    skin: "#F2C29B",
    skinOld: "#E7B48C",
    hair: "#2A1E1A",
    hairGrey: "#D9D4CC",
    goods: ["#E9A23B", "#2E8B6E", "#C2272D", "#F3E1C2", "#5A7BB5", "#8A5532"] as const,
    coin: "#E8B54C",
    tiger: "#1E1A1C",
    tigerStripe: "#E8B54C",
  },
  light: { ambient: 0.4, hemi: 0.55, sun: 3.6, altar: 6, lantern: 2.4, door: 18 },
} as const;


// Camera aimed at a subject: distance (m), azimuth (deg, 0 = camera on the
// door side looking toward the altar, positive = from +x) and elevation.
// `push` starts that much farther away (slow push in), `swing` drifts the
// azimuth over the shot (deg). Chibi heads are ~40% of the body in a 9:16
// frame: medium shots need 2.5-3 m (checked by scripts/frame-check.ts).
const aim = (
  target: Vec3,
  dist: number,
  azDeg: number,
  elDeg: number,
  o: { push?: number; swing?: number } = {},
): Pick<ShotSpec, "keys"> => {
  const at = (d: number, az: number): Vec3 => {
    const a = (az * Math.PI) / 180;
    const e = (elDeg * Math.PI) / 180;
    return [target[0] + d * Math.cos(e) * Math.sin(a), target[1] + d * Math.sin(e), target[2] + d * Math.cos(e) * Math.cos(a)];
  };
  const sw = o.swing ?? 0;
  return {
    keys: [
      { t: 0, pos: at(dist * (1 + (o.push ?? 0)), azDeg - sw / 2), look: target },
      { t: 1, pos: at(dist, azDeg + sw / 2), look: target },
    ],
  };
};

// Camera shots. Keys run over the shot's own progress (0..1). Every shot
// starts on a cut (music video), so each one is composed on its own.
export const RUKO_SHOTS: Record<string, ShotSpec> = {
  // Interior cameras stay inside the room (z < 1.85, |x| < 3.8).
  // 0 Intro: slow push toward the altar while the lanterns light up.
  intro: {
    fov: 36,
    handheld: 0.006,
    keys: [
      { t: 0, pos: [0.2, 2.35, 1.8], look: [0, 1.25, -3.6] },
      { t: 1, pos: [0.15, 2.2, 0.95], look: [0, 1.3, -3.6] },
    ],
  },
  // 1a Grandpa's face and hands with the incense, from the altar side.
  hands: { fov: 42, handheld: 0.004, focus: [-0.12, 0.8, -2.4], ...aim([-0.12, 0.8, -2.4], 3.0, 110, 12, { push: 0.08, swing: 6 }) },
  // 1b Cai Shen smiling, whole figure on the altar.
  face: { fov: 40, handheld: 0.004, focus: [0, 1.5, -3.6], ...aim([0, 1.5, -3.6], 2.5, 12, 24, { push: 0.1, swing: -6 }) },
  // 2 The camera follows the light from the altar to the opening door.
  door: {
    fov: 40,
    handheld: 0.008,
    keys: [
      { t: 0, pos: [0.8, 2.0, -0.9], look: [0, 1.35, -3.6] },
      { t: 0.4, pos: [0.4, 1.55, -1.1], look: [0.1, 1.3, 2.5] },
      { t: 1, pos: [0.3, 1.45, -0.4], look: [0, 1.25, 3.5] },
    ],
  },
  // 3 Wide interior from the side: Cai Shen blesses, customers come in.
  bless: {
    fov: 42,
    handheld: 0.008,
    keys: [
      { t: 0, pos: [3.1, 1.8, 1.4], look: [-0.4, 1.1, -2.0] },
      { t: 1, pos: [2.8, 1.75, 1.0], look: [-0.5, 1.1, -2.2] },
    ],
  },
  // 4a-d Montage: doors opened on time, tidy shelves, broom, honest scale.
  shutter: { fov: 40, handheld: 0.01, keys: [{ t: 0, pos: [0.6, 1.35, 6.2], look: [0, 1.25, 1.6] }, { t: 1, pos: [0.45, 1.32, 5.8], look: [0, 1.25, 1.6] }] },
  shelf: { fov: 42, handheld: 0.01, ...aim([-3.0, 0.95, -1.0], 3.4, 50, 12, { push: 0.06, swing: 5 }) },
  sweep: { fov: 42, handheld: 0.01, ...aim([0.25, 0.55, -0.9], 2.6, 55, 22, { push: 0.06, swing: -5 }) },
  ledger: { fov: 44, handheld: 0.008, ...aim([2.4, 1.05, -0.15], 3.0, -55, 15, { push: 0.05, swing: 4 }) },
  // 5 Down the market lane to the shop: neighbours help each other.
  market: {
    fov: 42,
    handheld: 0.01,
    keys: [
      { t: 0, pos: [-1.4, 2.1, 11.0], look: [-2.2, 1.0, 5.6] },
      { t: 1, pos: [0.3, 1.9, 8.8], look: [0, 1.2, 2.4] },
    ],
  },
  // 6 Over the customer's shoulder: the smiling shopkeeper.
  friendly: { fov: 44, handheld: 0.008, ...aim([2.3, 1.1, 0.1], 2.9, -52, 14, { push: 0.06, swing: 4 }) },
  // 7 Tracking across the busy shop.
  busy: {
    fov: 42,
    handheld: 0.012,
    keys: [
      { t: 0, pos: [-1.0, 1.75, 1.75], look: [1.5, 1.0, 0.5] },
      { t: 1, pos: [-0.3, 1.75, 1.75], look: [2.0, 1.0, 0.2] },
    ],
  },
  // 8 Gold from the incense falls on the shelves; zoom out.
  blessing: {
    fov: 38,
    handheld: 0.008,
    keys: [
      { t: 0, pos: [0, 1.9, -1.1], look: [0, 1.3, -3.3] },
      { t: 1, pos: [0, 2.7, 1.7], look: [0, 1.0, -1.6] },
    ],
  },
  // 9 Back at the altar: incense planted, a smoke ring rises.
  altar: { fov: 40, handheld: 0.006, focus: [-0.1, 0.95, -2.9], ...aim([-0.1, 0.95, -2.9], 3.3, -40, 34, { push: 0.06, swing: 5 }) },
  // 10 Follow the golden light from the altar out to the street.
  share: { fov: 42, handheld: 0.01, focus: [0.25, 0.9, 2.3], ...aim([0.25, 0.85, 2.2], 3.3, 35, 16, { push: 0.12, swing: 10 }) },
  // 11 Cai Shen raises the yuanbao; the little black tiger winks.
  yuanbao: { fov: 40, handheld: 0.005, focus: [0.3, 1.4, -3.55], ...aim([0.25, 1.45, -3.55], 2.3, 25, 18, { push: 0.08, swing: -5 }) },
  // 12 Low over the street, craning up: a river of gold coins.
  river: {
    fov: 42,
    handheld: 0.006,
    keys: [
      { t: 0, pos: [1.3, 0.8, 7.8], look: [0, 0.3, 4.0] },
      { t: 1, pos: [0.4, 3.4, 10.6], look: [0, 0.4, 3.0] },
    ],
  },
  // 13 Slow orbit: family and neighbours pray together.
  pray: {
    fov: 42,
    handheld: 0.006,
    keys: [
      { t: 0, pos: [3.0, 2.4, 0.9], look: [0, 1.1, -2.6] },
      { t: 0.5, pos: [0, 2.4, 1.4], look: [0, 1.1, -2.6] },
      { t: 1, pos: [-3.0, 2.4, 0.9], look: [0, 1.1, -2.6] },
    ],
  },
  // 14a-c Montage: kids play, a happy customer, a full family table.
  kids: { fov: 36, handheld: 0.01, keys: [{ t: 0, pos: [1.0, 1.25, 6.6], look: [0, 0.6, 3.3] }, { t: 1, pos: [0.8, 1.22, 6.3], look: [0, 0.6, 3.3] }] },
  customer: { fov: 44, handheld: 0.008, ...aim([2.25, 1.05, 0.5], 3.1, -75, 12, { push: 0.05, swing: -4 }) },
  dinner: { fov: 48, handheld: 0.008, keys: [{ t: 0, pos: [0.15, 2.35, 1.8], look: [-2.1, 0.6, 0.4] }, { t: 1, pos: [0.0, 2.3, 1.7], look: [-2.1, 0.6, 0.4] }] },
  // 15 Last incense: low at the burner, tilting up with the rising smoke.
  // 15 Last incense: low angle on the altar, smoke and gold rising past Cai Shen.
  rise: { fov: 44, handheld: 0.005, focus: [0, 1.5, -3.4], ...aim([0, 1.75, -3.4], 2.9, 22, -4, { push: 0.12, swing: -8 }) },
  // 16 Wide golden shot of shop and market; zoom out.
  golden: {
    fov: 40,
    handheld: 0.004,
    keys: [
      { t: 0, pos: [0, 3.6, 9.6], look: [0, 1.0, -0.5] },
      { t: 1, pos: [0, 5.2, 13.6], look: [0, 1.0, -0.5] },
    ],
  },
  // 17 Outro behind the title (soft, gold).
  outro: {
    fov: 40,
    handheld: 0.003,
    keys: [
      { t: 0, pos: [0, 5.2, 13.6], look: [0, 1.0, -0.5] },
      { t: 1, pos: [0, 5.6, 14.6], look: [0, 1.2, -0.5] },
    ],
  },
};

export const RUKO_LOOK: LookConfig = {
  background: "#2A1712",
  ao: { radius: 0.5, intensity: 1.6 },
  bloom: { intensity: 0.9, threshold: 0.82, smoothing: 0.25 },
  dof: { range: 2.4, bokehScale: 1.6 },
  vignette: { offset: 0.3, darkness: 0.55 },
  panels: [
    { color: "#FFE1B8", intensity: 2.6, position: [0, 6, 8], scale: [10, 4] },
    { color: "#FFB27A", intensity: 1.2, position: [-7, 3, 2], scale: [4, 6] },
    { color: "#FFFFFF", intensity: 1.0, position: [7, 3, 2], scale: [3, 6] },
  ],
};
