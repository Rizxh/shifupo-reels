// Who stands where in every shot of the "ruko" world (sp09), as plain data:
// shared by the 3D world and the framing check (scripts/frame-check.ts).

import type { Vec3 } from "../../../core/three/rig";
import type { PersonLook, PersonPose } from "./rukoChars";
import { RUKO } from "./rukoConfig";

// len: frames in the shot (2D worlds use it for wipes and motion blur).
export type ShotState = { shot: string; t: number; frame: number; local: number; len?: number };

const c01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * c01(t));

// ------------------------------------------------------------------ cast
export const LOOKS: Record<string, PersonLook> = {
  grandpa: { shirt: "#F3EEE4", pants: "#4A3A30", style: "grey", beard: true },
  father: { shirt: "#2E6FA8", pants: "#2C2C34", style: "short" },
  mother: { shirt: "#C2272D", pants: "#2C2C34", style: "bun" },
  kid: { shirt: "#E9A23B", pants: "#3A5A8A", style: "kid" },
  n1: { shirt: "#2E8B6E", pants: "#3A3330", style: "short" },
  n2: { shirt: "#8A5AA0", pants: "#2C2C34", style: "bun" },
  c1: { shirt: "#5A7BB5", pants: "#3A3330", style: "short" },
  c2: { shirt: "#E07A5F", pants: "#2C2C34", style: "bun" },
  c3: { shirt: "#7FB069", pants: "#3A3330", style: "short" },
  kid2: { shirt: "#5DA9E9", pants: "#C2272D", style: "kid" },
  sweeper: { shirt: "#F2C14E", pants: "#4A4036", style: "short" },
};
export const HEIGHT: Record<string, number> = { kid: 0.78, kid2: 0.74 };

export type Actor = { id: string; pos: Vec3; rotY: number; pose?: PersonPose; sit?: boolean };
const BACK = Math.PI; // facing the altar
// Behind the counter the shopkeeper stands on a step (head above the jars).
const STEP = 0.24;
const F = RUKO.family;

// Where everybody is in a shot (cuts between shots, so no travel needed).
export const cast = (s: ShotState): Actor[] => {
  const { shot, t, frame } = s;
  const pray = (k: number) => 0.35 + 0.35 * Math.max(0, Math.sin(frame / 14 + k));
  const altarFamily = (bow: (k: number) => number, grandpaPose: PersonPose = {}): Actor[] => [
    { id: "grandpa", pos: F.grandpa, rotY: BACK, pose: { bow: bow(0), armR: 0.55, held: "incense", heldGlow: 1, ...grandpaPose } },
    { id: "father", pos: F.father, rotY: BACK, pose: { bow: bow(1), armL: 0.5, armR: 0.5 } },
    { id: "mother", pos: F.mother, rotY: BACK, pose: { bow: bow(2), armL: 0.5, armR: 0.5 } },
    { id: "kid", pos: F.kid, rotY: BACK, pose: { bow: bow(3), armL: 0.45, armR: 0.45 } },
  ];
  const walkIn = (id: string, from: Vec3, to: Vec3, t0: number, t1: number): Actor => {
    const k = ease((t - t0) / (t1 - t0));
    const moving = t > t0 && t < t1;
    return {
      id,
      pos: [from[0] + (to[0] - from[0]) * k, 0, from[2] + (to[2] - from[2]) * k],
      rotY: Math.atan2(to[0] - from[0], to[2] - from[2]),
      pose: { walk: moving ? frame * 0.35 : 0 },
    };
  };
  const street: Actor[] = [
    { id: "n1", pos: [-2.6, 0, 5.2], rotY: 0.6, pose: { armR: 0.3 + 0.2 * Math.sin(frame / 18) } },
    { id: "n2", pos: [2.7, 0, 6.4], rotY: -0.8, pose: { armL: 0.4 } },
  ];
  switch (shot) {
    case "intro":
    case "face":
      return altarFamily(() => 0.1);
    case "hands":
      return altarFamily((k) => (k === 0 ? 0.25 + 0.35 * ease(t * 1.4) : 0.15));
    case "door":
      return [...altarFamily(() => 0.12), ...street];
    case "bless":
      return [
        ...altarFamily(() => 0.2),
        walkIn("c1", [0.4, 0, 4.5], [0.9, 0, 0.6], 0.15, 0.75),
        walkIn("c2", [-0.6, 0, 5.0], [-0.4, 0, 0.9], 0.3, 0.95),
      ];
    case "shutter":
      return [{ id: "father", pos: [0.0, 0, 1.55], rotY: 0, pose: { armL: 0.6 + 0.25 * ease(t * 1.3), armR: 0.6 + 0.25 * ease(t * 1.3), smile: 1.3 } }, ...street];
    case "shelf":
      return [{ id: "mother", pos: [-3.0, 0, -1.0], rotY: -Math.PI / 2 + 0.7, pose: { armR: 0.55 + 0.35 * Math.sin(frame / 8), armL: 0.3, held: "box" } }];
    case "sweep":
      return [{ id: "kid", pos: [0.25, 0, -0.9], rotY: 0.5 + Math.sin(frame / 9) * 0.25, pose: { armR: 0.35, armL: 0.35, bow: 0.25, held: "broom" } }];
    case "ledger":
      return [{ id: "grandpa", pos: [RUKO.counter.x + 0.1, STEP, RUKO.counter.z - 0.55], rotY: 0, pose: { armR: 0.45 + 0.05 * Math.sin(frame / 4), held: "book", bow: 0.12, nod: 0.3 } }];
    case "market":
      return [
        walkIn("n1", [-3.2, 0, 7.5], [-1.0, 0, 3.1], 0, 1),
        { ...walkIn("n2", [-2.6, 0, 7.9], [-0.4, 0, 3.4], 0, 1), pose: { walk: frame * 0.35, held: "box", armR: 0.75, armL: 0.75 } },
        { id: "father", pos: [0.3, 0, 2.6], rotY: 0.2, pose: { armR: 0.8, armL: 0.6 } },
        { id: "c3", pos: [2.6, 0, 5.6], rotY: -0.7, pose: { armR: 0.5 + 0.3 * Math.sin(frame / 10) } },
      ];
    case "friendly":
    case "customer":
      return [
        { id: "mother", pos: [RUKO.counter.x, STEP, RUKO.counter.z - 0.55], rotY: 0, pose: { armR: 0.45, nod: 0.25 * Math.sin(frame / 10), smile: 1.3 } },
        { id: "c1", pos: [RUKO.counter.x - 0.1, 0, RUKO.counter.z + 0.75], rotY: BACK, pose: { armR: shot === "customer" ? 0.5 : 0.2, held: shot === "customer" ? "bag" : "none", nod: 0.2 } },
        { id: "kid", pos: [RUKO.counter.x - 0.6, 0, RUKO.counter.z + 0.2], rotY: 0.9, pose: { armR: 0.6 * ease(t * 2), held: "bag" } },
        // Grandpa serves tea to a neighbour (friendly only: in the customer
        // shot they would stand in front of the camera).
        ...(shot === "friendly"
          ? ([
              { id: "grandpa", pos: [0.9, 0, 1.3], rotY: 0.7, pose: { armR: 0.6, held: "tea" } },
              { id: "n1", pos: [1.5, 0, 1.75], rotY: -2.3, pose: { nod: 0.2 } },
            ] as Actor[])
          : []),
      ];
    case "busy":
      return [
        { id: "mother", pos: [RUKO.counter.x, STEP, RUKO.counter.z - 0.55], rotY: 0, pose: { armR: 0.4 + 0.2 * Math.sin(frame / 6) } },
        walkIn("c1", [-0.8, 0, 3.2], [1.6, 0, 1.1], 0, 0.6),
        { id: "c2", pos: [1.9, 0, 1.55], rotY: BACK, pose: { held: "bag", armR: 0.3 } },
        { id: "c3", pos: [1.15, 0, 1.55], rotY: BACK + 0.5, pose: { armL: 0.2 } },
        { ...walkIn("father", [-0.6, 0, -0.6], [0.9, 0, -0.4], 0.1, 0.9), pose: { held: "box", armR: 0.75, armL: 0.75, walk: frame * 0.3 } },
      ];
    case "blessing":
    case "altar":
      return altarFamily(pray, shot === "altar" ? { armR: 0.55 + 0.3 * ease(t * 2) - 0.3 * ease(t * 2 - 1) } : {});
    case "share":
      return [
        // At the doorway the family shares food with a street kid and the
        // sweeper; the bowl passes from mother to the kid mid-shot.
        { id: "mother", pos: [0.15, 0, 1.75], rotY: 0.15, pose: { armR: 0.75 * (1 - ease((t - 0.55) / 0.2)), held: t < 0.6 ? "bowl" : "none", smile: 1.3 } },
        { id: "grandpa", pos: [-0.6, 0, 1.6], rotY: 0.35, pose: { armL: 0.3, nod: 0.2 * Math.sin(frame / 12) } },
        { id: "kid", pos: [0.75, 0, 1.45], rotY: 0.5, pose: { armR: 0.5 } },
        { id: "kid2", pos: [0.3, 0, 2.75], rotY: BACK - 0.15, pose: { armR: 0.75 * ease((t - 0.45) / 0.2), held: t >= 0.6 ? "bowl" : "none", smile: 1.4 } },
        { id: "sweeper", pos: [-0.8, 0, 2.8], rotY: 2.4, pose: { held: "broom", armR: 0.35, nod: 0.25 } },
      ];
    case "yuanbao":
      return [];
    case "river":
      return [...street, { id: "c3", pos: [-1.6, 0, 4.4], rotY: 0.9, pose: { armL: 0.8 } }, { id: "kid2", pos: [1.2, 0, 3.6], rotY: -0.4, pose: { armL: 0.9, armR: 0.9 } }];
    case "pray":
      return [
        ...altarFamily(pray),
        { id: "n1", pos: [1.3, 0, -1.6], rotY: BACK - 0.2, pose: { bow: pray(4), armL: 0.5, armR: 0.5 } },
        { id: "n2", pos: [-1.6, 0, -1.6], rotY: BACK + 0.2, pose: { bow: pray(5), armL: 0.5, armR: 0.5 } },
      ];
    case "kids": {
      const hop = (k: number) => Math.abs(Math.sin(frame / 7 + k)) * 0.18;
      return [
        { id: "kid", pos: [-0.4, hop(0), 3.4], rotY: 0.6, pose: { armL: 0.9, armR: 0.9 } },
        { id: "kid2", pos: [0.45, hop(1.4), 3.25], rotY: -0.6, pose: { armL: 0.8, armR: 0.9 } },
      ];
    }
    case "dinner":
      return [
        { id: "grandpa", pos: [RUKO.table.x, -0.2, RUKO.table.z - 0.7], rotY: 0, pose: { armR: 0.5, nod: 0.2 }, sit: true },
        { id: "father", pos: [RUKO.table.x + 0.7, -0.2, RUKO.table.z], rotY: -Math.PI / 2, pose: { armR: 0.4 }, sit: true },
        { id: "mother", pos: [RUKO.table.x - 0.7, -0.2, RUKO.table.z], rotY: Math.PI / 2, pose: { armR: 0.45, held: "bowl" }, sit: true },
        { id: "kid", pos: [RUKO.table.x, -0.14, RUKO.table.z + 0.7], rotY: BACK, pose: { armL: 0.6 + 0.2 * Math.sin(frame / 6) }, sit: true },
      ];
    case "rise":
      return altarFamily(() => 0.2, { armR: 0.75, bow: 0.3 });
    case "golden":
    case "outro":
      return [
        { id: "grandpa", pos: [-0.3, 0, 2.7], rotY: 0, pose: { bow: 0.3 } },
        { id: "father", pos: [0.5, 0, 2.8], rotY: 0, pose: { bow: 0.3 } },
        { id: "mother", pos: [-1.0, 0, 2.9], rotY: 0, pose: { bow: 0.3 } },
        { id: "kid", pos: [0.0, 0, 3.2], rotY: 0, pose: { bow: 0.3 } },
        ...street,
      ];
    default:
      return altarFamily(() => 0.1);
  }
};

