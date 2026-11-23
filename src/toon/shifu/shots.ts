// Shifu Po starter shot list (sh00 brand preview): a client in his quiet office, Shifu Po in the feng shui studio reading
// the luo pan, then the studio front with the official logo sign and the CTA.
import { cue, sceneFrame, TOTAL } from "./cues";
import type { ModernState } from "../kit/modern";
import { roomSpots } from "../kit/rooms";
import { V3, Key, Shot, dolly, pushK, run, Cam } from "../kit/rig";
import type { Light } from "../lights";

export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number };
const B = (n: number) => sceneFrame(n - 1);
const S = { office: 0, studio: B(2), front: B(3) };
const order: [keyof typeof S, Light, number?, number?][] = [["office", "day", 130, 40], ["studio", "golden", 130, 26], ["front", "day", 140, 42]];
export const SHOTS: ShotDef[] = order.map(([k, light, sunAz, sunEl], i) => ({
  id: i + 1, a: S[k], b: i + 1 < order.length ? S[order[i + 1][0]] : TOTAL, light, sunAz, sunEl,
}));
export const ID = Object.fromEntries(order.map(([k], i) => [k, i + 1])) as Record<keyof typeof S, number>;
export const FLASH_AT = -100;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

export const MX = 0, SHOP_X = MX + 8;
/** interior sets, far from the street (each is an open-front box) */
export const ROOMS = { office: [600, 0, 0] as V3, studio: [700, 0, 0] as V3 };
export const OFFICE = roomSpots("office", ROOMS.office), STUDIO = roomSpots("fengshui", ROOMS.studio);
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature shared with the other stories
export const carAt = (_id: number, _f: number): ModernState | null => null;

const at = (pos: V3, look: V3, rest: Partial<Cam> = {}, f0 = 0, rate = 0.0022) => (f: number): Shot => dolly(pos, look, pushK(f, f0, rate), rest);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const CAMS: Record<number, Key[]> = {};
const mid = (a: V3, b: V3): V3 => [(a[0] + b[0]) / 2, 1.25, (a[2] + b[2]) / 2];
CAMS[ID.office] = [{ f: 0, s: at(add(OFFICE.stand, [0.7, 1.45, 5.2]), add(OFFICE.stand, [0.4, 1.2, -0.6]), { fov: 42 }, 0, 0.0025) }];
CAMS[ID.studio] = [{ f: S.studio, s: at(add(mid(STUDIO.stand, STUDIO.stand2), [0, 0.35, 4.8]), mid(STUDIO.stand, STUDIO.stand2), { fov: 44 }, S.studio, 0.0022) }];
CAMS[ID.front] = [
  { f: S.front, s: at([SHOP_X + 0.3, 1.6, 2.2], [SHOP_X + 0.1, 1.35, -5.0], { fov: 44 }, S.front, 0.0018) },
  { f: cue(3, "konsultasi") - 6, cut: true, s: at([SHOP_X, 3.2, 4.0], [SHOP_X, 4.05, -8.0], { fov: 44 }, cue(3, "konsultasi") - 6, 0.0012) },
];
export const camAt = (id: number, f: number): Cam => run(CAMS[id], f);

export type Dof = { cInf: number; focus?: (f: number) => V3 };
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature shared with the other stories
export const dofAt = (id: number, _f: number): Dof => (id === ID.front ? { cInf: 4 } : { cInf: 5, focus: () => (id === ID.office ? OFFICE.look : STUDIO.look) });
export { S };
