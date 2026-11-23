// Tokens of the 2D "ruko2d" world (sp10, the Motion Format paper-cartoon
// version of "KITA PAY JAY SEN"): one long panorama set in world units
// (px at zoom 1). Left to right: Cai Shen altar → shop floor (shelves,
// dining table, counter) → carved red door → market street → evening sky.
// The camera travels over it (focus x, y and zoom per shot).

import type { ShotSpec } from "../../../core/three/rig";

export const R2 = {
  floor: 1500, // interior and street ground line
  ceiling: 200,
  roofTop: -120,
  shopEnd: 2700, // inner face of the front wall
  door: { x0: 2780, x1: 3380, top: 420 },
  streetEnd: 6000,
  altar: { x0: 170, x1: 670, top: 1140, board: 520 },
  caishen: { x: 420, feet: 1140, height: 560 },
  burner: { x: 420, y: 1140 },
  incenseTip: { x: 420, y: 985 },
  tiger: { x: 572, y: 1140 },
  shelves: { x0: 880, x1: 1720, boards: [700, 880, 1060, 1240] },
  table: { x: 1250, top: 1330 },
  counter: { x0: 1880, x1: 2380, top: 1180 },
  scale: { x: 2335, y: 1180 },
  stalls: [3700, 4450, 5200],
  charityBox: { x: 4040, y: 1500 },
  // Character heights (world units).
  adult: 400,
  child: 290,
} as const;

export const C2 = {
  wall: "#F6E3C4",
  wallShade: "#E9CFA6",
  dado: "#C8322B",
  dadoTrim: "#F2C14E",
  beam: "#6B3A22",
  floor: "#D9A066",
  floorLine: "#B97E46",
  floorFront: "#BE8550",
  red: "#D7342C",
  redDeep: "#9E1C1F",
  gold: "#F2C14E",
  goldDeep: "#C8902E",
  goldLight: "#FFE6A3",
  wood: "#A8683A",
  woodDark: "#6E4024",
  bronze: "#A9783E",
  sky: ["#FFB86B", "#FF9572", "#F07A86"] as const,
  dawn: ["#FFD9B0", "#F8B9A8"] as const,
  sun: "#FFE29A",
  cloud: "#FFF2E2",
  roof: "#7A2E28",
  roofEdge: "#5A1E1A",
  farRoof: "#E59A7E",
  street: "#E2C9A0",
  streetLine: "#CBB083",
  awnings: ["#E04848", "#2FA37E", "#F2A93B", "#4D8FD6"] as const,
  stall: "#F3DDB4",
  goods: ["#F2A93B", "#2FA37E", "#E04848", "#FFF3D6", "#4D8FD6", "#A8683A", "#F27BA0"] as const,
  ink: "#3A2418",
  shine: "#FFFFFF",
  blush: "#FF8A80",
  shadow: "rgba(90,40,20,0.24)",
  smoke: "#FFF4E4",
  lantern: "#E4312B",
  lanternGlow: "#FFC56B",
  night: "#2A1430",
  light: "#FFE7A8",
  skin: "#FFD3B0",
  skinOld: "#F4C7A1",
  hair: "#3A2A24",
  hairGrey: "#EEEAE4",
} as const;

export const PAPER2 = { edgeFrequency: 0.05, edgeScale: 3.5, shadowX: 6, shadowY: 9, shadow: C2.shadow } as const;

// Camera shots: keys over the shot's progress, pos = [focus x, focus y,
// zoom] (look unused). `handheld` is world-unit drift. Subjects sit in the
// upper two thirds: the lyric owns the bottom of the frame.
const k = (t: number, x: number, y: number, z: number) => ({ t, pos: [x, y, z] as const, look: [0, 0, 0] as const });
export const CAM2D: Record<string, ShotSpec> = {
  intro: { fov: 0, handheld: 5, keys: [k(0, 470, 800, 1.1), k(1, 440, 790, 1.3)] },
  hands: { fov: 0, handheld: 3, keys: [k(0, 690, 1255, 2.5), k(1, 680, 1245, 2.75)] },
  face: { fov: 0, handheld: 3, keys: [k(0, 420, 765, 2.25), k(1, 420, 760, 2.5)] },
  door: { fov: 0, handheld: 6, keys: [k(0, 430, 1130, 2.0), k(0.45, 1700, 1200, 1.3), k(1, 3080, 1240, 1.08)] },
  // Split screen: left panel camera here, right panel in CAM2D_SPLIT.
  bless: { fov: 0, handheld: 4, keys: [k(0, 420, 1052, 1.8), k(1, 425, 1040, 1.95)] },
  shutter: { fov: 0, handheld: 6, keys: [k(0, 3050, 1325, 1.55), k(1, 3060, 1315, 1.7)] },
  shelf: { fov: 0, handheld: 6, keys: [k(0, 1280, 1310, 1.7), k(1, 1300, 1300, 1.85)] },
  sweep: { fov: 0, handheld: 6, keys: [k(0, 1560, 1380, 1.9), k(1, 1590, 1370, 2.05)] },
  ledger: { fov: 0, handheld: 6, keys: [k(0, 2170, 1300, 1.9), k(1, 2180, 1290, 2.05)] },
  market: { fov: 0, handheld: 7, keys: [k(0, 5000, 1490, 1.05), k(1, 3350, 1480, 1.0)] },
  friendly: { fov: 0, handheld: 5, keys: [k(0, 2250, 1410, 1.45), k(1, 2300, 1400, 1.6)] },
  busy: { fov: 0, handheld: 7, keys: [k(0, 2750, 1460, 1.2), k(0.6, 1950, 1460, 1.2), k(1, 1050, 1420, 0.95)] },
  blessing: { fov: 0, handheld: 5, keys: [k(0, 650, 1210, 1.6), k(1, 1300, 1520, 0.78)] },
  altar: { fov: 0, handheld: 4, keys: [k(0, 430, 1185, 2.4), k(0.45, 430, 1175, 2.4), k(0.62, 420, 880, 2.0), k(1, 420, 870, 2.1)] },
  share: { fov: 0, handheld: 6, keys: [k(0, 520, 1230, 1.3), k(1, 3330, 1460, 1.2)] },
  yuanbao: { fov: 0, handheld: 3, keys: [k(0, 490, 810, 2.2), k(1, 480, 800, 2.45)] },
  river: { fov: 0, handheld: 5, keys: [k(0, 4150, 1530, 1.55), k(1, 4300, 1300, 0.72)] },
  pray: { fov: 0, handheld: 4, keys: [k(0, 640, 1515, 0.98), k(1, 1060, 1505, 1.04)] },
  kids: { fov: 0, handheld: 7, keys: [k(0, 3720, 1440, 1.6), k(1, 3760, 1430, 1.72)] },
  customer: { fov: 0, handheld: 6, keys: [k(0, 2330, 1375, 1.8), k(1, 2350, 1365, 1.92)] },
  dinner: { fov: 0, handheld: 6, keys: [k(0, 1250, 1430, 1.5), k(1, 1260, 1420, 1.62)] },
  rise: { fov: 0, handheld: 4, keys: [k(0, 430, 1062, 2.6), k(0.3, 430, 900, 2.2), k(1, 470, -700, 1.15)] },
  golden: { fov: 0, handheld: 3, keys: [k(0, 1650, 1560, 0.55), k(1, 1600, 1660, 0.43)] },
  outro: { fov: 0, handheld: 2, keys: [k(0, 1600, 1660, 0.43), k(1, 1600, 1680, 0.41)] },
};

// Right panel of the split screen (bless): the shop coming alive.
export const CAM2D_SPLIT: ShotSpec = { fov: 0, handheld: 5, keys: [k(0, 2050, 1520, 0.95), k(1, 2150, 1500, 1.02)] };

export const RUKO2D_SHOTS = Object.keys(CAM2D);
