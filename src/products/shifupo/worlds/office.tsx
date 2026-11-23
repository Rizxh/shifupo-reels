// "office" world (sp05): a premium miniature office diorama, three walls and
// an open front, on a walnut plinth. A door in the left wall, a window in the
// back wall with afternoon sun, a desk group that starts with its back to the
// door and turns into the command position on the cue.
//
// Every motion is a pure function of the frame and of the cue frames of the
// world events (`ev`). Physics: spring-settled door and desk turn, coins that
// slide, drop, bounce and slide with friction, papers with air drag and
// flutter, chi particles that flow and scatter on impact.

import { RoundedBox } from "@react-three/drei";
import { noise2D } from "@remotion/noise";
import { useMemo } from "react";
import { random } from "remotion";
import { AdditiveBlending, BoxGeometry, Color, DoubleSide, ExtrudeGeometry, MeshBasicMaterial, Path, Shape, SphereGeometry } from "three";
import { bounce, bounceImpacts, dampedSpring } from "../../../core/motion/physics";
import { powInOut, powOut, track } from "../../../core/motion/tracks";
import { inkPaintingTexture, plasterTexture, rugTexture, screenTexture, woodTexture } from "../../../core/three/textures";
import type { Vec3 } from "../../../core/three/rig";
import { COLORS } from "../brand";
import { OFFICE } from "./officeConfig";

export type Ev = Record<string, number>;
const at = (ev: Ev, name: string) => ev[name] ?? Infinity;
const c01 = (t: number) => Math.min(1, Math.max(0, t));

// ------------------------------------------------------------------ layout
const R = OFFICE.room;
const DOOR = OFFICE.door;
const WIN = OFFICE.window;
const DESK = OFFICE.desk;

// Desk group transform over time: rotation (rad) and x position.
export const deskPose = (frame: number, ev: Ev): { rot: number; x: number; lift: number } => {
  const t0 = at(ev, "desk-turn");
  if (frame < t0) {
    return { rot: 0, x: DESK.startX, lift: 0 };
  }
  const f = frame - t0;
  // Anticipation (small counter turn), then the turn with spring overshoot.
  const antic = track(f, [
    [0, 0],
    [5, -0.14, powOut(2)],
    [9, 0],
  ]);
  const turn = dampedSpring(f, 6, 0.3, 0.32); // 0 → 1 with a small overshoot
  const rot = antic + Math.PI * turn;
  const x = track(f, [
    [4, DESK.startX],
    [22, DESK.endX, powInOut(3)],
  ]);
  const lift = track(f, [
    [4, 0],
    [12, 0.07, powOut(2)],
    [22, 0, powInOut(2)],
  ]);
  return { rot, x, lift };
};

// Local desk-group point → world point for a pose.
const toWorld = (p: Vec3, pose: { rot: number; x: number; lift: number }): Vec3 => {
  const c = Math.cos(pose.rot);
  const s = Math.sin(pose.rot);
  return [pose.x + p[0] * c + p[2] * s, p[1] + pose.lift, DESK.z - p[0] * s + p[2] * c];
};

// ------------------------------------------------------------------ coins
const COIN_SLOTS: Vec3[] = [0, 1, 2, 3, 4].map((i) => [0.22 + 0.07 * i, DESK.top + 0.012, 0.36 + 0.05 * (i % 2)]);
const G = OFFICE.gravity;

type CoinState = { pos: Vec3; rot: Vec3 };

const coinFloorRest = (i: number): Vec3 => {
  const edge = toWorld([DESK.edgeX, DESK.top, COIN_SLOTS[i][2]], { rot: 0, x: DESK.startX, lift: 0 });
  const vx = OFFICE.coins.vx * (1 + 0.12 * i);
  const vz = OFFICE.coins.vz * (1 - 0.15 * i);
  const k = OFFICE.coins.friction;
  return [edge[0] + vx / k, 0.006, edge[2] + vz / k];
};

export const coinState = (i: number, frame: number, ev: Ev): CoinState => {
  const fall = at(ev, "coins-fall") + i * 3;
  const back = at(ev, "coins-return") + i * 2;
  const slot = COIN_SLOTS[i];
  if (frame >= back) {
    // Arc from the floor back onto the turned desk, small landing bounce.
    const from = coinFloorRest(i);
    const to = toWorld(slot, deskPose(frame, ev));
    const f = frame - back;
    const T = 18;
    const w = powInOut(2)(c01(f / T));
    const arc = 4 * w * (1 - w) * 1.1;
    const land = bounce(frame, back + T, { height: 0.05, gravity: G, restitution: 0.35, minHop: 0.004 });
    const y = f < T ? from[1] + (to[1] - from[1]) * w + arc : to[1] + land.y;
    return {
      pos: [from[0] + (to[0] - from[0]) * w, y, from[2] + (to[2] - from[2]) * w],
      rot: [f < T ? w * Math.PI * 4 : 0, i, 0],
    };
  }
  if (frame < fall) {
    return { pos: toWorld(slot, deskPose(frame, ev)), rot: [0, i * 0.7, 0] };
  }
  // Slide to the desk edge, then drop with bounces and slide with friction.
  const f = frame - fall;
  const slide = 6 + i;
  const startW = toWorld(slot, { rot: 0, x: DESK.startX, lift: 0 });
  const edge = toWorld([DESK.edgeX, DESK.top, slot[2]], { rot: 0, x: DESK.startX, lift: 0 });
  if (f < slide) {
    const w = powOut(2)(f / slide);
    return {
      pos: [startW[0] + (edge[0] - startW[0]) * w, startW[1], startW[2] + (edge[2] - startW[2]) * w],
      rot: [0, i * 0.7 + w, 0],
    };
  }
  const t = f - slide;
  const vx = OFFICE.coins.vx * (1 + 0.12 * i);
  const vz = OFFICE.coins.vz * (1 - 0.15 * i);
  const k = OFFICE.coins.friction;
  const decay = (1 - Math.exp(-k * t)) / k;
  const b = bounce(t, 0, { height: DESK.top, gravity: G, restitution: OFFICE.coins.restitution, minHop: 0.004 });
  const spin = Math.exp(-0.05 * t);
  return {
    pos: [edge[0] + vx * decay, 0.006 + b.y, edge[2] + vz * decay],
    rot: [b.resting ? 0 : Math.sin(t * 0.45) * 0.9 * spin, i * 0.7 + t * 0.3 * spin, b.resting ? 0 : t * 0.2 * spin],
  };
};

export const coinImpacts = (i: number, ev: Ev): number[] => {
  const fall = at(ev, "coins-fall") + i * 3;
  const out: number[] = [];
  if (Number.isFinite(fall)) {
    const start = fall + 6 + i;
    for (const imp of bounceImpacts(start, { height: DESK.top, gravity: G, restitution: OFFICE.coins.restitution, minHop: 0.004 })) {
      out.push(imp.frame);
    }
  }
  const back = at(ev, "coins-return") + i * 2;
  if (Number.isFinite(back)) {
    out.push(back + 18);
  }
  return out;
};

// ------------------------------------------------------------------ papers
const PAPERS = [0, 1, 2].map((k) => ({
  local: [0.36 + 0.02 * k, DESK.top + 0.004 + 0.003 * k, -0.34 + 0.03 * k] as Vec3,
  vx: -0.05 - 0.012 * k,
  vy: 0.035 + 0.01 * k,
  vz: 0.012 - 0.02 * k,
  turn: 0.3 + 0.1 * k,
}));

const paperPos = (k: number, t: number, x0: Vec3): Vec3 => {
  const p = PAPERS[k];
  const kd = 0.06;
  const vt = 0.006;
  const decay = (1 - Math.exp(-kd * t)) / kd;
  const y = x0[1] + (p.vy + vt) * decay - vt * t;
  return [x0[0] + p.vx * decay, y, x0[2] + p.vz * decay];
};

const paperLanding = (k: number, x0: Vec3): number => {
  for (let t = 1; t < 400; t++) {
    if (paperPos(k, t, x0)[1] <= 0.004 + 0.002 * k) {
      return t;
    }
  }
  return 400;
};

const paperState = (k: number, frame: number, ev: Ev): { pos: Vec3; rot: Vec3; visible: boolean } => {
  const fly = at(ev, "papers-fly") + k * 2;
  const p = PAPERS[k];
  if (frame < fly) {
    return { pos: toWorld(p.local, deskPose(frame, ev)), rot: [0, 0.1 * k, 0], visible: true };
  }
  const x0 = toWorld(p.local, { rot: 0, x: DESK.startX, lift: 0 });
  const land = paperLanding(k, x0);
  const t = Math.min(frame - fly, land);
  const pos = paperPos(k, t, x0);
  const air = t < land ? 1 : 0;
  return {
    pos: [pos[0], Math.max(pos[1], 0.004 + 0.002 * k), pos[2]],
    rot: [Math.sin(t * 0.22 + k) * 0.7 * air, 0.1 * k + t * p.turn * 0.08, Math.cos(t * 0.18 + k) * 0.5 * air],
    visible: true,
  };
};

// ------------------------------------------------------------------ chi flow
const quad = (a: Vec3, c: Vec3, b: Vec3, s: number): Vec3 => {
  const u = 1 - s;
  return [u * u * a[0] + 2 * u * s * c[0] + s * s * b[0], u * u * a[1] + 2 * u * s * c[1] + s * s * b[1], u * u * a[2] + 2 * u * s * c[2] + s * s * b[2]];
};

type Particle = { pos: Vec3; size: number; glow: number };

const chiParticles = (frame: number, ev: Ev): Particle[] => {
  const out: Particle[] = [];
  const C = OFFICE.chi;
  // Cause: stream from the door that slams into the bare chair back.
  const hit = at(ev, "chi-hit");
  if (frame >= hit && frame < hit + C.hitLife) {
    const target = toWorld(OFFICE.chairBackLocal, { rot: 0, x: DESK.startX, lift: 0 });
    for (let i = 0; i < C.count; i++) {
      const born = hit + i * C.spawnEvery;
      const f = frame - born;
      if (f < 0) {
        continue;
      }
      const s = f / C.travel;
      const fade = c01((hit + C.hitLife - frame) / 12);
      if (s < 1) {
        const p = quad(C.door, C.bend, target, powInOut(2)(s));
        const j = (n: string) => noise2D(`${n}${i}`, f / 20, 0) * 0.08;
        out.push({ pos: [p[0] + j("x"), p[1] + j("y"), p[2] + j("z")], size: C.size, glow: fade });
      } else {
        // Scatter off the chair back (projectile with gravity), then fade.
        const t = (s - 1) * C.travel;
        const ang = random(`chi-a${i}`) * Math.PI * 2;
        const v = 0.02 + random(`chi-v${i}`) * 0.025;
        const life = c01(1 - t / 22) * fade;
        if (life > 0) {
          out.push({
            pos: [target[0] - Math.abs(Math.cos(ang)) * v * t, target[1] + Math.sin(ang) * v * t - 0.5 * G * 0.3 * t * t, target[2] + Math.sin(ang * 1.7) * v * t],
            size: C.size * (0.5 + 0.5 * life),
            glow: life,
          });
        }
      }
    }
  }
  // Payoff: a calm stream that arrives in front of the turned desk.
  const calm = at(ev, "lights-on");
  if (frame >= calm) {
    const target = toWorld(OFFICE.deskFrontLocal, deskPose(frame, ev));
    for (let i = 0; i < C.count; i++) {
      const period = C.travel * 2.2;
      const f = (frame - calm - i * C.spawnEvery * 1.6 + period * 10) % period;
      const s = f / period;
      if (frame - calm < i * C.spawnEvery * 1.6) {
        continue;
      }
      const p = quad(C.door, C.calmBend, target, sinInOut(s));
      const j = (n: string) => noise2D(`${n}c${i}`, (frame - calm) / 30, 0) * 0.06;
      out.push({ pos: [p[0] + j("x"), p[1] + j("y") + Math.sin(s * Math.PI) * 0.15, p[2] + j("z")], size: C.size * 0.8, glow: Math.sin(s * Math.PI) });
    }
  }
  return out;
};
const sinInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * c01(t));

// ------------------------------------------------------------------ anchors
// World points the 2D marks pin to (with a world radius for circles).
export const officeAnchor = (name: string, frame: number, ev: Ev): { pos: Vec3; radius: number } | null => {
  switch (name) {
    case "door":
      return { pos: [-R.half + 0.02, DOOR.height / 2, DOOR.z], radius: 0.85 };
    case "doorway":
      return { pos: [-R.half + 0.3, 0.9, DOOR.z], radius: 0.4 };
    case "chair-back":
      return { pos: toWorld(OFFICE.chairBackLocal, deskPose(frame, ev)), radius: 0.42 };
    case "coin-exit": {
      const p = coinFloorRest(2);
      return { pos: [p[0], 0.05, p[2]], radius: 0.3 };
    }
    case "desk":
      return { pos: toWorld([0.5, DESK.top + 0.1, 0], deskPose(frame, ev)), radius: 0.5 };
    default:
      return null;
  }
};

// Sounds the world makes by itself (one per physical impact).
export const officeSounds = (ev: Ev): { frame: number; sound: "coin" | "thump" | "tick"; gain: number }[] => {
  const out: { frame: number; sound: "coin" | "thump" | "tick"; gain: number }[] = [];
  for (let i = 0; i < COIN_SLOTS.length; i++) {
    coinImpacts(i, ev).forEach((f, n) => out.push({ frame: Math.round(f), sound: "coin", gain: Math.max(0.35, 1 - n * 0.25) }));
  }
  const turn = at(ev, "desk-turn");
  if (Number.isFinite(turn)) {
    out.push({ frame: turn + 21, sound: "thump", gain: 0.8 });
  }
  const door = at(ev, "door-open");
  if (Number.isFinite(door)) {
    out.push({ frame: door + 14, sound: "tick", gain: 1 });
  }
  return out;
};

// ------------------------------------------------------------------ meshes
const useCoinGeometry = () =>
  useMemo(() => {
    const r = OFFICE.coins.radius;
    const shape = new Shape();
    shape.absarc(0, 0, r, 0, Math.PI * 2, false);
    const h = r * 0.32;
    const hole = new Path();
    hole.moveTo(-h, -h);
    hole.lineTo(h, -h);
    hole.lineTo(h, h);
    hole.lineTo(-h, h);
    hole.lineTo(-h, -h);
    shape.holes.push(hole);
    const g = new ExtrudeGeometry(shape, { depth: r * 0.12, bevelEnabled: true, bevelThickness: r * 0.04, bevelSize: r * 0.04, bevelSegments: 2, curveSegments: 32 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

// One texture per tone for the whole tab (was one 1024² copy per mesh).
const woodCache = new Map<string, ReturnType<typeof woodTexture>>();
const woodFor = (tone: "light" | "dark") => {
  let t = woodCache.get(tone);
  if (!t) {
    t = tone === "light" ? woodTexture("deskwood", OFFICE.colors.woodLight, OFFICE.colors.woodDark, 6) : woodTexture("walnut", OFFICE.colors.walnut, "#1c120b", 5);
    woodCache.set(tone, t);
  }
  return t;
};

const Wood: React.FC<{ tone?: "light" | "dark" }> = ({ tone = "light" }) => {
  const map = woodFor(tone);
  return <meshStandardMaterial map={map} roughness={0.5} metalness={0} />;
};

const Plant: React.FC<{ frame: number; pos: Vec3; scale?: number }> = ({ frame, pos, scale = 1 }) => {
  const leaves = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * Math.PI * 2 + random(`lf${i}`), tilt: 0.35 + random(`lt${i}`) * 0.6, len: 0.28 + random(`ll${i}`) * 0.22 })), []);
  return (
    <group position={pos as unknown as [number, number, number]} scale={scale}>
      <mesh castShadow receiveShadow position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.17, 0.13, 0.32, 32]} />
        <meshStandardMaterial color={OFFICE.colors.pot} roughness={0.35} />
      </mesh>
      {leaves.map((l, i) => {
        const sway = noise2D(`sway${i}`, frame / 45, 0) * 0.08 + Math.sin(frame / 22 + i) * 0.025;
        return (
          <group key={i} position={[0, 0.3, 0]} rotation={[0, l.a, l.tilt + sway]}>
            <mesh castShadow position={[0, l.len / 2, 0]} scale={[0.09, l.len, 0.025]}>
              <sphereGeometry args={[0.5, 16, 12]} />
              <meshStandardMaterial color={i % 3 ? OFFICE.colors.leaf : OFFICE.colors.leafLight} roughness={0.55} side={DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const Chair: React.FC = () => (
  <group>
    <RoundedBox args={[0.5, 0.08, 0.5]} radius={0.03} smoothness={4} position={[0, 0.48, 0]} castShadow receiveShadow>
      <meshStandardMaterial color={OFFICE.colors.chair} roughness={0.6} />
    </RoundedBox>
    <RoundedBox args={[0.08, 0.62, 0.48]} radius={0.035} smoothness={4} position={[-0.24, 0.86, 0]} rotation={[0, 0, -0.1]} castShadow>
      <meshStandardMaterial color={OFFICE.colors.chair} roughness={0.6} />
    </RoundedBox>
    <mesh position={[0, 0.25, 0]} castShadow>
      <cylinderGeometry args={[0.03, 0.03, 0.42, 16]} />
      <meshStandardMaterial color="#8d8d8d" metalness={1} roughness={0.25} />
    </mesh>
    {[0, 1, 2, 3, 4].map((k) => (
      <mesh key={k} position={[Math.cos((k / 5) * Math.PI * 2) * 0.17, 0.04, Math.sin((k / 5) * Math.PI * 2) * 0.17]} rotation={[0, -(k / 5) * Math.PI * 2, 0]} castShadow>
        <boxGeometry args={[0.34, 0.03, 0.04]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.35} />
      </mesh>
    ))}
  </group>
);

const DeskGroup: React.FC<{ frame: number; ev: Ev; lampGlow: number }> = ({ frame, ev, lampGlow }) => {
  const pose = deskPose(frame, ev);
  const screen = useMemo(() => screenTexture("#0f1a24", "#9cc7e6", COLORS.gold), []);
  const legs: [number, number][] = [
    [0.12, -0.74],
    [0.88, -0.74],
    [0.12, 0.74],
    [0.88, 0.74],
  ];
  return (
    <group position={[pose.x, pose.lift, DESK.z]} rotation={[0, pose.rot, 0]}>
      <RoundedBox args={[0.82, 0.06, 1.6]} radius={0.02} smoothness={4} position={[0.5, DESK.top - 0.03, 0]} castShadow receiveShadow>
        <Wood />
      </RoundedBox>
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, (DESK.top - 0.06) / 2, z]} castShadow>
          <boxGeometry args={[0.05, DESK.top - 0.06, 0.05]} />
          <meshStandardMaterial color={OFFICE.colors.woodDark} roughness={0.5} />
        </mesh>
      ))}
      {/* Monitor faces the sitter (local -x). */}
      <group position={[0.78, DESK.top, 0]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.05, 0.24, 0.05]} />
          <meshStandardMaterial color="#222" metalness={0.5} roughness={0.4} />
        </mesh>
        <RoundedBox args={[0.04, 0.36, 0.6]} radius={0.012} smoothness={3} position={[0, 0.38, 0]} castShadow>
          <meshStandardMaterial color="#141414" roughness={0.3} />
        </RoundedBox>
        <mesh position={[-0.021, 0.38, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.56, 0.32]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
      </group>
      {/* Desk lamp. */}
      <group position={[0.72, DESK.top, 0.62]}>
        <mesh position={[0, 0.01, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.02, 24]} />
          <meshStandardMaterial color={COLORS.goldDeep} metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.32, 8]} />
          <meshStandardMaterial color={COLORS.goldDeep} metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[-0.05, 0.33, 0]} rotation={[0, 0, 0.6]} castShadow>
          <coneGeometry args={[0.08, 0.12, 24, 1, true]} />
          <meshStandardMaterial color={COLORS.gold} metalness={1} roughness={0.25} side={DoubleSide} />
        </mesh>
        <mesh position={[-0.07, 0.31, 0]}>
          <sphereGeometry args={[0.03, 16, 12]} />
          <meshBasicMaterial color={OFFICE.colors.bulb} toneMapped={false} />
        </mesh>
        <pointLight position={[-0.1, 0.25, 0]} intensity={OFFICE.light.lamp * lampGlow} distance={2.2} decay={2} color={OFFICE.colors.bulb} />
      </group>
      {/* Chair (sitter faces local +x). */}
      <group position={[0, 0, 0]}>
        <Chair />
      </group>
      {/* Mug + notebook for detail. */}
      <mesh position={[0.3, DESK.top + 0.05, 0.62]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 24]} />
        <meshStandardMaterial color={COLORS.paper} roughness={0.25} />
      </mesh>
      <RoundedBox args={[0.22, 0.02, 0.3]} radius={0.006} smoothness={2} position={[0.42, DESK.top + 0.01, 0.18]} castShadow>
        <meshStandardMaterial color={COLORS.seal} roughness={0.5} />
      </RoundedBox>
    </group>
  );
};

const Bookshelf: React.FC = () => {
  const books = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; c: string }[] = [];
    const palette = OFFICE.colors.books;
    for (let shelf = 0; shelf < 4; shelf++) {
      let x = -0.5;
      while (x < 0.46) {
        const w = 0.04 + random(`bw${shelf}-${x}`) * 0.05;
        const h = 0.22 + random(`bh${shelf}-${x}`) * 0.14;
        out.push({ x: x + w / 2, y: 0.12 + shelf * 0.46 + h / 2, w, h, c: palette[Math.floor(random(`bc${shelf}-${x}`) * palette.length)] });
        x += w + 0.006;
      }
    }
    return out;
  }, []);
  return (
    <group position={[-1.75, 0, -R.half + 0.2]}>
      <mesh position={[0, 0.98, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.12, 1.96, 0.04]} />
        <Wood tone="dark" />
      </mesh>
      {[-0.56, 0.56].map((x) => (
        <mesh key={x} position={[x, 0.98, 0.06]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 1.96, 0.36]} />
          <Wood tone="dark" />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4].map((s) => (
        <mesh key={s} position={[0, 0.1 + s * 0.46, 0.06]} castShadow receiveShadow>
          <boxGeometry args={[1.12, 0.03, 0.36]} />
          <Wood tone="dark" />
        </mesh>
      ))}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0.08]} castShadow>
          <boxGeometry args={[b.w, b.h, 0.24]} />
          <meshStandardMaterial color={b.c} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

const Room: React.FC<{ frame: number; ev: Ev }> = ({ frame, ev }) => {
  const floor = useMemo(() => woodTexture("floor", OFFICE.colors.floor, OFFICE.colors.floorDark, 10, [1.5, 1.5]), []);
  const plaster = useMemo(() => plasterTexture("wall", OFFICE.colors.wall, [2, 1]), []);
  const rug = useMemo(() => rugTexture(OFFICE.colors.rugField, OFFICE.colors.rugBorder, COLORS.gold), []);
  const painting = useMemo(() => inkPaintingTexture(COLORS.paper, COLORS.ink, COLORS.seal), []);
  const H = R.height;
  const T = R.wall;
  const wallMat = <meshStandardMaterial map={plaster} roughness={0.9} />;
  // Door swings into the room on its cue with a spring settle.
  const doorT0 = at(ev, "door-open");
  const doorAngle = frame < doorT0 ? 0 : DOOR.openDeg * (Math.PI / 180) * dampedSpring(frame, doorT0, 0.22, 0.28);
  const winL = WIN.x0;
  const winR = WIN.x1;
  return (
    <group>
      {/* Plinth with a gold trim line. */}
      {/* Top sits 1.5 cm below the floor: a top face at y = 0 z-fought with
          the floor plane and flickered between walnut and floor wood. */}
      <mesh position={[0, -0.195, 0]} receiveShadow castShadow>
        <boxGeometry args={[R.half * 2 + 0.5, 0.36, R.half * 2 + 0.5]} />
        <Wood tone="dark" />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[R.half * 2 + 0.52, 0.025, R.half * 2 + 0.52]} />
        <meshStandardMaterial color={COLORS.gold} metalness={1} roughness={0.3} />
      </mesh>
      {/* Floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[R.half * 2, R.half * 2]} />
        <meshStandardMaterial map={floor} roughness={0.42} metalness={0} />
      </mesh>
      {/* Rug under the desk zone. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.0, 0.004, 0.4]} receiveShadow>
        <planeGeometry args={[2.6, 2.2]} />
        <meshStandardMaterial map={rug} roughness={0.95} />
      </mesh>
      {/* Back wall with a window opening. */}
      <mesh position={[(-R.half + winL) / 2, H / 2, -R.half - T / 2]} receiveShadow castShadow>
        <boxGeometry args={[winL + R.half, H, T]} />
        {wallMat}
      </mesh>
      <mesh position={[(R.half + winR) / 2, H / 2, -R.half - T / 2]} receiveShadow castShadow>
        <boxGeometry args={[R.half - winR, H, T]} />
        {wallMat}
      </mesh>
      <mesh position={[(winL + winR) / 2, WIN.y0 / 2, -R.half - T / 2]} receiveShadow castShadow>
        <boxGeometry args={[winR - winL, WIN.y0, T]} />
        {wallMat}
      </mesh>
      <mesh position={[(winL + winR) / 2, (H + WIN.y1) / 2, -R.half - T / 2]} receiveShadow castShadow>
        <boxGeometry args={[winR - winL, H - WIN.y1, T]} />
        {wallMat}
      </mesh>
      {/* Window frame + mullions. */}
      {[
        [(winL + winR) / 2, WIN.y0, winR - winL + 0.08, 0.06],
        [(winL + winR) / 2, WIN.y1, winR - winL + 0.08, 0.06],
        [(winL + winR) / 2, (WIN.y0 + WIN.y1) / 2, winR - winL, 0.035],
      ].map(([x, y, w, h], i) => (
        <mesh key={`wh${i}`} position={[x, y, -R.half - T / 2]} castShadow>
          <boxGeometry args={[w, h, T + 0.04]} />
          <meshStandardMaterial color={OFFICE.colors.woodDark} roughness={0.5} />
        </mesh>
      ))}
      {[winL, (winL + winR) / 2, winR].map((x, i) => (
        <mesh key={`wv${i}`} position={[x, (WIN.y0 + WIN.y1) / 2, -R.half - T / 2]} castShadow>
          <boxGeometry args={[i === 1 ? 0.035 : 0.06, WIN.y1 - WIN.y0, T + 0.04]} />
          <meshStandardMaterial color={OFFICE.colors.woodDark} roughness={0.5} />
        </mesh>
      ))}
      {/* Warm sky beyond the window. */}
      <mesh position={[(winL + winR) / 2, (WIN.y0 + WIN.y1) / 2, -R.half - 1.2]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial color={OFFICE.colors.sky} toneMapped={false} />
      </mesh>
      {/* Left wall with the door opening. */}
      <mesh position={[-R.half - T / 2, H / 2, (DOOR.z + DOOR.width / 2 + R.half) / 2]} receiveShadow castShadow>
        <boxGeometry args={[T, H, R.half - (DOOR.z + DOOR.width / 2)]} />
        {wallMat}
      </mesh>
      <mesh position={[-R.half - T / 2, H / 2, (DOOR.z - DOOR.width / 2 - R.half) / 2]} receiveShadow castShadow>
        <boxGeometry args={[T, H, DOOR.z - DOOR.width / 2 + R.half]} />
        {wallMat}
      </mesh>
      <mesh position={[-R.half - T / 2, (H + DOOR.height) / 2, DOOR.z]} receiveShadow castShadow>
        <boxGeometry args={[T, H - DOOR.height, DOOR.width]} />
        {wallMat}
      </mesh>
      {/* Door leaf: hinge on the back edge, swings in toward the back wall so
          cameras on the open front see straight through the doorway. */}
      <group position={[-R.half + 0.02, 0, DOOR.z - DOOR.width / 2]} rotation={[0, doorAngle, 0]}>
        <RoundedBox args={[0.05, DOOR.height - 0.02, DOOR.width - 0.02]} radius={0.012} smoothness={3} position={[0, DOOR.height / 2, DOOR.width / 2]} castShadow receiveShadow>
          <Wood tone="dark" />
        </RoundedBox>
        <mesh position={[0.05, 1.0, DOOR.width - 0.1]} castShadow>
          <sphereGeometry args={[0.03, 16, 12]} />
          <meshStandardMaterial color={COLORS.gold} metalness={1} roughness={0.2} />
        </mesh>
      </group>
      {/* Corridor: bright wall beyond the door. */}
      <mesh position={[-R.half - 1.6, 1.4, DOOR.z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4, 2.8]} />
        <meshBasicMaterial color={OFFICE.colors.corridor} toneMapped={false} />
      </mesh>
      <mesh position={[-R.half - 0.8, 0, DOOR.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.6, 3]} />
        <meshStandardMaterial color={OFFICE.colors.floorDark} roughness={0.6} />
      </mesh>
      {/* Right wall (solid: the command position puts the back here). */}
      <mesh position={[R.half + T / 2, H / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[T, H, R.half * 2]} />
        {wallMat}
      </mesh>
      {/* Wainscot band + baseboards on the three walls. */}
      {[
        { p: [0, 0.45, -R.half + 0.012] as Vec3, s: [R.half * 2, 0.9, 0.025] as Vec3, skip: true },
        { p: [R.half - 0.012, 0.45, 0] as Vec3, s: [0.025, 0.9, R.half * 2] as Vec3, skip: false },
      ].map((b, i) => (
        <mesh key={`ws${i}`} position={b.p as unknown as [number, number, number]} receiveShadow>
          <boxGeometry args={b.s as unknown as [number, number, number]} />
          <meshStandardMaterial color={OFFICE.colors.wainscot} roughness={0.6} />
        </mesh>
      ))}
      {/* Framed ink painting above where the chair ends up. */}
      <group position={[R.half - 0.03, 1.75, DESK.z]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.66, 0.92, 0.04]} />
          <meshStandardMaterial color={OFFICE.colors.woodDark} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.56, 0.82]} />
          <meshStandardMaterial map={painting} roughness={0.8} />
        </mesh>
      </group>
      <Bookshelf />
      <Plant frame={frame} pos={[2.45, 0, 2.35]} scale={1.5} />
      <Plant frame={frame + 40} pos={[-2.5, 0, -2.45]} scale={1.1} />
    </group>
  );
};

// Fake volumetric sun shaft through the window plus floating dust motes.
const SunShaft: React.FC<{ frame: number }> = ({ frame }) => {
  const S = OFFICE.sunShaft;
  const motes = useMemo(() => Array.from({ length: S.motes }, (_, i) => ({ s: random(`m-s${i}`), u: random(`m-u${i}`) - 0.5, v: random(`m-v${i}`) - 0.5 })), [S.motes]);
  const from = S.from;
  const to = S.to;
  const dir: Vec3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const len = Math.hypot(...dir);
  const mid: Vec3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  const yaw = Math.atan2(dir[0], dir[2]);
  const pitch = Math.asin(dir[1] / len);
  return (
    <group>
      <group position={mid as unknown as [number, number, number]} rotation={[-pitch, yaw, 0, "YXZ"]}>
        {[1, 0.7, 0.45].map((k, i) => (
          <mesh key={i}>
            <boxGeometry args={[S.width * k, S.height * k, len]} />
            <meshBasicMaterial color={OFFICE.colors.sun} transparent opacity={S.opacity} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {motes.map((m, i) => {
        const s = (m.s + frame * 0.0009) % 1;
        const p: Vec3 = [
          from[0] + dir[0] * s + m.u * S.width + noise2D(`mx${i}`, frame / 80, 0) * 0.1,
          from[1] + dir[1] * s + m.v * S.height + noise2D(`my${i}`, frame / 80, 0) * 0.1,
          from[2] + dir[2] * s,
        ];
        return (
          <mesh key={i} position={p as unknown as [number, number, number]}>
            <sphereGeometry args={[0.006 + (i % 3) * 0.003, 6, 6]} />
            <meshBasicMaterial color={OFFICE.colors.sun} toneMapped={false} transparent opacity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

// A person walking past in the corridor: only their shadow enters the room.
const Walker: React.FC<{ frame: number; ev: Ev }> = ({ frame, ev }) => {
  const t0 = at(ev, "walker");
  const f = frame - t0;
  // Always mounted (visibility only): mounting/unmounting meshes per frame
  // churned GPU resources and crashed long renders on this iGPU.
  const active = f >= 0 && f <= OFFICE.walker.frames;
  const z = track(f, [
    [0, DOOR.z - 2.2],
    [OFFICE.walker.frames, DOOR.z + 2.2, powInOut(1.4)],
  ]);
  const bob = Math.abs(Math.sin(f * 0.35)) * 0.04;
  return (
    <group position={[-R.half - 0.75, active ? bob : 0, z]} visible={active}>
      {/* Capsule: 1.1 m body + 0.2 m caps, centered 0.75 m: feet on the floor. */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.2, 1.1, 8, 16]} />
        <meshStandardMaterial color="#20180f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.63, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshStandardMaterial color="#20180f" roughness={0.9} />
      </mesh>
    </group>
  );
};

// Dashed gold sight line from the chair to the door (command position).
const SightLine: React.FC<{ frame: number; ev: Ev; pool: Pool }> = ({ frame, ev, pool }) => {
  const t0 = at(ev, "sightline");
  const from = toWorld([0.05, 0.012, 0], deskPose(frame, ev));
  const to: Vec3 = [-R.half + 0.15, 0.012, DOOR.z];
  const n = 18;
  const shown = frame < t0 ? 0 : Math.floor(n * powOut(2)(c01((frame - t0) / 16)));
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const yaw = Math.atan2(dx, dz);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const s = (i + 0.5) / n;
        return (
          <mesh key={i} visible={i < shown} geometry={pool.dash} material={pool.dashMat} position={[from[0] + dx * s, 0.014, from[2] + dz * s]} rotation={[0, yaw, 0]} />
        );
      })}
    </group>
  );
};

// Red "danger" glow on the floor behind the bare chair back (cause → fix).
const DangerGlow: React.FC<{ frame: number; ev: Ev }> = ({ frame, ev }) => {
  const on = at(ev, "chi-hit") + 18;
  const off = at(ev, "desk-turn");
  const k = c01((frame - on) / 20) * (1 - c01((frame - off) / 12));
  const p = toWorld([-0.7, 0.01, 0], { rot: 0, x: DESK.startX, lift: 0 });
  return (
    <mesh position={[p[0], 0.012, p[2]]} rotation={[-Math.PI / 2, 0, 0]} visible={k > 0}>
      <circleGeometry args={[0.9, 48]} />
      <meshBasicMaterial color={COLORS.seal} transparent opacity={0.28 * k} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

// Shared geometry/materials for things that appear and disappear: created
// once per mount, reused every frame.
type Pool = { sphere: SphereGeometry; core: MeshBasicMaterial[]; halo: MeshBasicMaterial[]; dash: BoxGeometry; dashMat: MeshBasicMaterial };
const usePool = (): Pool =>
  useMemo(() => {
    const n = OFFICE.chi.count * 2;
    const coreColor = new Color(COLORS.goldLight).multiplyScalar(OFFICE.chi.hdr);
    return {
      sphere: new SphereGeometry(1, 10, 8),
      core: Array.from({ length: n }, () => new MeshBasicMaterial({ color: coreColor, toneMapped: false, transparent: true })),
      halo: Array.from(
        { length: n },
        () => new MeshBasicMaterial({ color: COLORS.gold, toneMapped: false, transparent: true, blending: AdditiveBlending, depthWrite: false }),
      ),
      dash: new BoxGeometry(0.035, 0.008, 0.14),
      dashMat: new MeshBasicMaterial({ color: COLORS.goldLight, toneMapped: false }),
    };
  }, []);

export const OfficeWorld: React.FC<{ frame: number; ev: Ev }> = ({ frame, ev }) => {
  const coinGeo = useCoinGeometry();
  const pool = usePool();
  const lights = c01((frame - at(ev, "lights-on")) / 30);
  const lampGlow = 0.35 + 0.65 * lights;
  const L = OFFICE.light;
  const particles = chiParticles(frame, ev);
  const doorOpen = frame >= at(ev, "door-open") ? c01((frame - at(ev, "door-open")) / 10) : 0;
  return (
    <group>
      <ambientLight intensity={L.ambient} color={OFFICE.colors.ambient} />
      <hemisphereLight args={[OFFICE.colors.sky, OFFICE.colors.floorDark, L.hemi]} />
      <directionalLight
        position={OFFICE.sun.position as unknown as [number, number, number]}
        intensity={L.sun}
        color={OFFICE.colors.sun}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      {/* Corridor light: pours through the door once it opens. */}
      <spotLight
        position={[-R.half - 1.4, 2.2, DOOR.z]}
        target-position={[0, 0, DOOR.z + 0.5]}
        angle={0.7}
        penumbra={0.6}
        intensity={L.corridor * (0.15 + 0.85 * doorOpen)}
        distance={9}
        decay={1.6}
        color={OFFICE.colors.corridor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />
      <pointLight position={[1.0, 2.3, 0.6]} intensity={L.room * lights} distance={6} decay={2} color={OFFICE.colors.bulb} />
      <Room frame={frame} ev={ev} />
      <SunShaft frame={frame} />
      <DeskGroup frame={frame} ev={ev} lampGlow={lampGlow} />
      {[0, 1, 2, 3, 4].map((i) => {
        const c = coinState(i, frame, ev);
        return (
          <mesh key={i} geometry={coinGeo} position={c.pos as unknown as [number, number, number]} rotation={c.rot as unknown as [number, number, number]} castShadow>
            <meshStandardMaterial color={OFFICE.colors.coin} metalness={0.85} roughness={0.36} emissive={OFFICE.colors.coin} emissiveIntensity={0.05} />
          </mesh>
        );
      })}
      {[0, 1, 2].map((k) => {
        const p = paperState(k, frame, ev);
        return (
          <mesh key={k} position={p.pos as unknown as [number, number, number]} rotation={p.rot as unknown as [number, number, number]} castShadow receiveShadow>
            <boxGeometry args={[0.21, 0.002, 0.297]} />
            <meshStandardMaterial color={COLORS.paper} roughness={0.8} />
          </mesh>
        );
      })}
      {pool.core.map((coreMat, i) => {
        // Fixed pool of particle slots (no per-frame mounting).
        const p = particles[i];
        const g = p ? Math.min(1, Math.max(0, p.glow)) : 0;
        coreMat.opacity = g;
        pool.halo[i].opacity = 0.22 * g;
        return (
          <group key={`chi${i}`} visible={!!p && g > 0} position={(p ? p.pos : [0, -10, 0]) as unknown as [number, number, number]} scale={p ? p.size : 0.01}>
            <mesh geometry={pool.sphere} material={coreMat} />
            <mesh geometry={pool.sphere} material={pool.halo[i]} scale={2.6} />
          </group>
        );
      })}
      <Walker frame={frame} ev={ev} />
      <SightLine frame={frame} ev={ev} pool={pool} />
      <DangerGlow frame={frame} ev={ev} />
    </group>
  );
};

