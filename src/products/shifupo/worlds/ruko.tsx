// "ruko" world (sp09 "KITA PAY JAY SEN"): a premium toy diorama of a family
// shophouse with a Cai Shen altar, a carved red door onto a busy market
// street. Choreography follows the storyboard shot by shot: the world gets
// the current shot name, its progress t (0..1) and the frame. Everything that
// appears and disappears is pooled (fixed meshes, visibility only), shared
// textures are cached per tab (lessons from sp05).

import { RoundedBox } from "@react-three/drei";
import { noise2D } from "@remotion/noise";
import { useMemo } from "react";
import { random } from "remotion";
import { AdditiveBlending, Color, MeshBasicMaterial, SphereGeometry, TorusGeometry } from "three";
import { plasterTexture, woodTexture } from "../../../core/three/textures";
import type { Vec3 } from "../../../core/three/rig";
import { BlackTiger, CaiShen, ToyPerson } from "./rukoChars";
import { RUKO } from "./rukoConfig";

const C = RUKO.colors;
const R = RUKO.room;
const c01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * c01(t));
type V3 = [number, number, number];
const v = (p: Vec3): V3 => [p[0], p[1], p[2]];

import { cast, HEIGHT, LOOKS, type ShotState } from "./rukoCast";

export type { ShotState };

// ------------------------------------------------------------------ cache
const texCache = new Map<string, ReturnType<typeof woodTexture>>();
const tex = (key: string, make: () => ReturnType<typeof woodTexture>) => {
  let t = texCache.get(key);
  if (!t) {
    t = make();
    texCache.set(key, t);
  }
  return t;
};
const floorTex = () => tex("floor", () => woodTexture("ruko-floor", C.floor, C.floorDark, 10, [2, 2]));
const woodTex = () => tex("wood", () => woodTexture("ruko-wood", C.wood, C.woodDark, 6));
const wallTex = () => tex("wall", () => plasterTexture("ruko-wall", C.wall, [3, 1]));

// ------------------------------------------------------------------ props
const Lantern: React.FC<{ pos: Vec3; frame: number; seed: number; glow: number; size?: number; drop?: number }> = ({ pos, frame, seed, glow, size = 1, drop = 0.4 }) => {
  const swing = Math.sin(frame / (34 + seed * 3) + seed) * 0.12;
  return (
    <group position={v(pos)} rotation={[swing * 0.4, 0, swing]}>
      <mesh position={[0, -drop / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.006, drop, 4]} />
        <meshStandardMaterial color="#2A1A14" />
      </mesh>
      <group position={[0, -drop - 0.16 * size, 0]} scale={size}>
        <mesh scale={[1, 0.85, 1]}>
          <sphereGeometry args={[0.18, 16, 12]} />
          <meshStandardMaterial color={C.lantern} emissive={C.lanternGlow} emissiveIntensity={0.15 + glow * 1.6} roughness={0.5} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} position={[0, k * 0.15, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.04, 12]} />
            <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, -0.26, 0]}>
          <cylinderGeometry args={[0.012, 0.03, 0.14, 8]} />
          <meshStandardMaterial color={C.gold} />
        </mesh>
      </group>
    </group>
  );
};

const Shelf: React.FC<{ x: number; side: 1 | -1; fill: number }> = ({ x, side, fill }) => {
  const goods = useMemo(() => {
    const out: { y: number; z: number; w: number; h: number; c: string; kind: number; order: number }[] = [];
    let order = 0;
    for (let row = 0; row < 4; row++) {
      for (let z = -3.2; z < 0.9; z += 0.3) {
        const r = random(`shelf${side}-${row}-${z.toFixed(1)}`);
        out.push({ y: 0.42 + row * 0.55, z, w: 0.18 + r * 0.08, h: 0.16 + random(`h${side}${row}${z}`) * 0.2, c: C.goods[Math.floor(r * C.goods.length)], kind: Math.floor(random(`k${side}${row}${z}`) * 3), order: order++ });
      }
    }
    return out;
  }, [side]);
  const shown = Math.floor(goods.length * fill);
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[side * 0.18, 1.2, -1.15]} castShadow receiveShadow>
        <boxGeometry args={[0.06, 2.4, 4.4]} />
        <meshStandardMaterial map={woodTex()} roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3, 4].map((r) => (
        <mesh key={r} position={[0, 0.3 + r * 0.55, -1.15]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.04, 4.4]} />
          <meshStandardMaterial map={woodTex()} roughness={0.6} />
        </mesh>
      ))}
      {goods.map((g, i) => (
        <mesh key={i} visible={g.order < shown} position={[0, g.y + g.h / 2 - 0.1, g.z]} castShadow>
          {g.kind === 0 ? <boxGeometry args={[g.w, g.h, g.w]} /> : g.kind === 1 ? <cylinderGeometry args={[g.w / 2, g.w / 2, g.h, 12]} /> : <sphereGeometry args={[g.w / 2, 12, 10]} />}
          <meshStandardMaterial color={g.c} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
};

const Altar: React.FC<{ frame: number; glow: number }> = ({ frame, glow }) => {
  const A = RUKO.altar;
  const flame = (k: number) => 0.8 + 0.2 * noise2D(`fl${k}`, frame / 6, 0);
  return (
    <group>
      {/* Red back panel with gold frame. */}
      <mesh position={[0, 1.7, R.back + 0.05]}>
        <boxGeometry args={[1.9, 1.7, 0.04]} />
        <meshStandardMaterial color={C.redLacquer} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.7, R.back + 0.03]}>
        <boxGeometry args={[2.05, 1.85, 0.03]} />
        <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Table with gold trim, step for Cai Shen. */}
      <RoundedBox args={[A.width, A.top, A.depth]} radius={0.03} position={[A.x, A.top / 2, A.z]} castShadow receiveShadow>
        <meshStandardMaterial color={C.redLacquer} roughness={0.45} />
      </RoundedBox>
      <mesh position={[A.x, A.top - 0.04, A.z + A.depth / 2 + 0.002]}>
        <boxGeometry args={[A.width - 0.1, 0.05, 0.01]} />
        <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.7, 0.15, 0.4]} radius={0.02} position={[0, A.top + 0.075, RUKO.caishen.pos[2]]} castShadow>
        <meshStandardMaterial color={C.woodDark} roughness={0.5} />
      </RoundedBox>
      {/* Incense burner and offerings. */}
      <group position={v(RUKO.burner)}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.09, 0.16, 20]} />
          <meshStandardMaterial color="#8A6A3A" metalness={0.7} roughness={0.35} />
        </mesh>
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={i} position={[x, 0.24, 0]} rotation={[0, 0, (i - 1) * 0.08]}>
            <cylinderGeometry args={[0.005, 0.005, 0.2, 6]} />
            <meshStandardMaterial color={C.red} />
          </mesh>
        ))}
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={`t${i}`} position={[x * 1.25, 0.345, 0]}>
            <sphereGeometry args={[0.01, 8, 6]} />
            <meshBasicMaterial color="#FF8A3D" toneMapped={false} />
          </mesh>
        ))}
      </group>
      {[-0.6, 0.6].map((x, k) => (
        <group key={x} position={[x, A.top, A.z + 0.1]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.24, 12]} />
            <meshStandardMaterial color={C.redLacquer} />
          </mesh>
          <mesh position={[0, 0.27 + 0.01 * flame(k), 0]} scale={[1, 1.6 * flame(k), 1]}>
            <sphereGeometry args={[0.022, 10, 8]} />
            <meshBasicMaterial color={new Color("#FFB25C").multiplyScalar(2.5)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {[-0.35, 0.35].map((x) => (
        <group key={`fruit${x}`} position={[x, A.top, A.z + 0.15]}>
          {[
            [0, 0.05, 0],
            [0.07, 0.05, 0.04],
            [-0.07, 0.05, 0.04],
            [0, 0.12, 0.02],
          ].map((p, i) => (
            <mesh key={i} position={p as V3} castShadow>
              <sphereGeometry args={[0.05, 12, 10]} />
              <meshStandardMaterial color="#F2902B" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      <pointLight position={[0, 1.5, A.z + 0.6]} intensity={RUKO.light.altar * glow} distance={4} decay={2} color={C.lanternGlow} />
    </group>
  );
};

const Door: React.FC<{ open: number }> = ({ open }) => {
  const D = RUKO.door;
  const leaf = (k: 1 | -1) => (
    <group position={[k * (D.width / 2), 0, R.front]} rotation={[0, k * open * ((D.openDeg * Math.PI) / 180), 0]}>
      <group position={[-k * (D.width / 4), D.height / 2, 0]}>
        <RoundedBox args={[D.width / 2 - 0.02, D.height, 0.08]} radius={0.02} castShadow receiveShadow>
          <meshStandardMaterial color={C.redLacquer} roughness={0.45} />
        </RoundedBox>
        {[-0.7, 0, 0.7].map((y) => (
          <mesh key={y} position={[0, y, 0.045]}>
            <boxGeometry args={[D.width / 2 - 0.2, 0.5, 0.012]} />
            <meshStandardMaterial color="#9E1E24" roughness={0.5} />
          </mesh>
        ))}
        {[-1, 0, 1].flatMap((r) =>
          [-1, 1].map((c) => (
            <mesh key={`${r}${c}`} position={[c * 0.18, r * 0.7 + 0.18, 0.055]}>
              <sphereGeometry args={[0.025, 8, 6]} />
              <meshStandardMaterial color={C.gold} metalness={0.9} roughness={0.25} />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
  return (
    <group>
      {leaf(1)}
      {leaf(-1)}
    </group>
  );
};

const Room: React.FC = () => {
  const H = R.height;
  const D = RUKO.door;
  const wall = <meshStandardMaterial map={wallTex()} roughness={0.85} />;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (R.back + R.front) / 2]} receiveShadow>
        <planeGeometry args={[R.halfX * 2, R.front - R.back]} />
        <meshStandardMaterial map={floorTex()} roughness={0.5} />
      </mesh>
      {/* Back and side walls with a red lower band. */}
      <mesh position={[0, H / 2, R.back - R.wall / 2]} receiveShadow>
        <boxGeometry args={[R.halfX * 2, H, R.wall]} />
        {wall}
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * (R.halfX + R.wall / 2), H / 2, (R.back + R.front) / 2]} receiveShadow>
          <boxGeometry args={[R.wall, H, R.front - R.back]} />
          {wall}
        </mesh>
      ))}
      {[-1, 1].map((k) => (
        <mesh key={`band${k}`} position={[k * (R.halfX - 0.01), 0.35, (R.back + R.front) / 2]}>
          <boxGeometry args={[0.02, 0.7, R.front - R.back]} />
          <meshStandardMaterial color={C.wallLow} roughness={0.6} />
        </mesh>
      ))}
      {/* Front wall around the door, lintel with gold sign board. */}
      {[-1, 1].map((k) => (
        <mesh key={`fw${k}`} position={[k * (D.width / 2 + (R.halfX - D.width / 2) / 2), H / 2, R.front + R.wall / 2]} receiveShadow castShadow>
          <boxGeometry args={[R.halfX - D.width / 2, H, R.wall]} />
          {wall}
        </mesh>
      ))}
      <mesh position={[0, (H + D.height) / 2, R.front + R.wall / 2]} castShadow>
        <boxGeometry args={[D.width, H - D.height, R.wall]} />
        {wall}
      </mesh>
      <mesh position={[0, D.height + 0.35, R.front + R.wall + 0.03]}>
        <boxGeometry args={[2.6, 0.5, 0.06]} />
        <meshStandardMaterial color={C.redLacquer} roughness={0.4} />
      </mesh>
      <mesh position={[0, D.height + 0.35, R.front + R.wall + 0.065]}>
        <boxGeometry args={[2.4, 0.36, 0.01]} />
        <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Ceiling beams. */}
      {[-3, -1.5, 0, 1.5].map((z) => (
        <mesh key={z} position={[0, H - 0.1, z]} castShadow>
          <boxGeometry args={[R.halfX * 2, 0.16, 0.18]} />
          <meshStandardMaterial color={C.beam} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

const Counter: React.FC<{ frame: number; busy: number }> = ({ frame, busy }) => {
  const tilt = Math.sin(frame / 10) * 0.12 * busy;
  return (
    <group position={[RUKO.counter.x, 0, RUKO.counter.z]}>
      <RoundedBox args={[1.4, 0.85, 0.55]} radius={0.03} position={[0, 0.425, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={woodTex()} roughness={0.55} />
      </RoundedBox>
      {/* Balance scale. */}
      <group position={[0.45, 0.85, 0]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.012, 0.02, 0.36, 8]} />
          <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} />
        </mesh>
        <group position={[0, 0.36, 0]} rotation={[0, 0, tilt]}>
          <mesh>
            <boxGeometry args={[0.42, 0.015, 0.02]} />
            <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * 0.2, -0.12, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.02, 16]} />
              <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
      {/* Jars of goods. */}
      {[-0.5, -0.3, -0.1].map((x, i) => (
        <mesh key={x} position={[x, 0.95, -0.05]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 14]} />
          <meshStandardMaterial color={C.goods[i]} roughness={0.4} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
};

const DinnerTable: React.FC<{ full: number }> = ({ full }) => (
  <group position={[RUKO.table.x, 0, RUKO.table.z]}>
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.6, 0.6, 0.05, 32]} />
      <meshStandardMaterial map={woodTex()} roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.25, 0]}>
      <cylinderGeometry args={[0.08, 0.12, 0.5, 12]} />
      <meshStandardMaterial color={C.woodDark} />
    </mesh>
    {Array.from({ length: 6 }, (_, k) => {
      const a = (k / 6) * Math.PI * 2;
      return (
        <group key={k} position={[Math.cos(a) * 0.36, 0.55, Math.sin(a) * 0.36]} visible={k / 6 < full}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.07, 0.04, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <sphereGeometry args={[0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={C.goods[k % C.goods.length]} roughness={0.6} />
          </mesh>
        </group>
      );
    })}
  </group>
);

const Street: React.FC<{ frame: number; glow: number }> = ({ frame, glow }) => {
  const S = RUKO.street;
  const stalls = [-1, 1].flatMap((side) =>
    [4.2, 6.6, 9.0].map((z, i) => ({ side, z, color: C.awning[(i + (side > 0 ? 1 : 0)) % C.awning.length] })),
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, (S.z0 + S.z1) / 2 + 2]} receiveShadow>
        <planeGeometry args={[20, S.z1 - S.z0 + 8]} />
        <meshStandardMaterial color={C.street} roughness={0.9} />
      </mesh>
      {stalls.map((s, i) => (
        <group key={i} position={[s.side * S.stallX, 0, s.z]}>
          <RoundedBox args={[1.6, 0.8, 1.2]} radius={0.03} position={[0, 0.4, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={C.stall} roughness={0.7} />
          </RoundedBox>
          {[-0.5, 0, 0.5].map((dz, k) => (
            <mesh key={k} position={[-s.side * 0.2, 0.86, dz]} castShadow>
              <sphereGeometry args={[0.12, 12, 10]} />
              <meshStandardMaterial color={C.goods[(i + k) % C.goods.length]} roughness={0.5} />
            </mesh>
          ))}
          {[-0.75, 0.75].map((dz) => (
            <mesh key={dz} position={[s.side * 0.7, 1.05, dz]}>
              <cylinderGeometry args={[0.025, 0.025, 2.1, 6]} />
              <meshStandardMaterial color={C.woodDark} />
            </mesh>
          ))}
          <mesh position={[0, 2.1, 0]} rotation={[0, 0, -s.side * 0.25]} castShadow>
            <boxGeometry args={[1.9, 0.05, 1.6]} />
            <meshStandardMaterial color={s.color} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* Lantern strings across the street. */}
      {[3.4, 5.6, 7.8].map((z, row) => (
        <group key={z}>
          <mesh position={[0, 3.2, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 7.4, 4]} />
            <meshStandardMaterial color="#2A1A14" />
          </mesh>
          {[-2.4, -1.2, 0, 1.2, 2.4].map((x, k) => (
            <Lantern key={k} pos={[x, 3.2, z]} frame={frame} seed={row * 5 + k} glow={glow} size={0.9} drop={0.15 + 0.12 * Math.abs(Math.sin(k + row))} />
          ))}
        </group>
      ))}
      {/* Houses across the street + evening sky. */}
      {[-4.5, -1.5, 1.5, 4.5].map((x, i) => (
        <mesh key={x} position={[x, 2.2, S.z1 + 1.5]} castShadow>
          <boxGeometry args={[2.8, 4.4 + (i % 2) * 0.8, 1]} />
          <meshStandardMaterial color={i % 2 ? "#E8C9A0" : "#D9B48A"} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 8, S.z1 + 6]}>
        <planeGeometry args={[60, 30]} />
        <meshBasicMaterial color={C.sky[0]} toneMapped={false} />
      </mesh>
      <mesh position={[0, 14, -12]}>
        <planeGeometry args={[60, 30]} />
        <meshBasicMaterial color={C.sky[1]} toneMapped={false} />
      </mesh>
    </group>
  );
};

// Pools: fixed meshes reused every frame (no per-frame mounting).
type Pool = { sphere: SphereGeometry; ring: TorusGeometry; smoke: MeshBasicMaterial[]; gold: MeshBasicMaterial[]; coin: MeshBasicMaterial };
const SMOKE = 40;
const GOLD = 90;
const usePool = (): Pool =>
  useMemo(
    () => ({
      sphere: new SphereGeometry(1, 10, 8),
      ring: new TorusGeometry(1, 0.06, 8, 40),
      smoke: Array.from({ length: SMOKE }, () => new MeshBasicMaterial({ color: C.smoke, transparent: true, depthWrite: false })),
      gold: Array.from({ length: GOLD }, () => new MeshBasicMaterial({ color: new Color(C.goldLight).multiplyScalar(3), toneMapped: false, transparent: true, depthWrite: false })),
      coin: new MeshBasicMaterial({ color: new Color(C.coin).multiplyScalar(1.6), toneMapped: false }),
    }),
    [],
  );

const quad = (a: Vec3, b: Vec3, c: Vec3, s: number): V3 => {
  const u = 1 - s;
  return [u * u * a[0] + 2 * u * s * b[0] + s * s * c[0], u * u * a[1] + 2 * u * s * b[1] + s * s * c[1], u * u * a[2] + 2 * u * s * b[2] + s * s * c[2]];
};

// Gold particle positions for the current shot (null = hidden).
const goldAt = (s: ShotState, i: number): { p: V3; size: number; a: number } | null => {
  const { shot, t, frame, local } = s;
  const tip = RUKO.incenseTip;
  const r = (k: string) => random(`g${i}${k}`);
  if (shot === "blessing") {
    const born = i * 1.2;
    const f = local - born;
    if (f < 0) {
      return null;
    }
    const side = r("side") > 0.5 ? 1 : -1;
    const target: Vec3 = [side * 3.55, 0.6 + Math.floor(r("row") * 4) * 0.55, -3 + r("z") * 3.8];
    const k = c01(f / 46);
    const p = quad(tip, [side * 1.2, 2.6, -2.2], target, ease(k));
    return { p, size: 0.022, a: 1 - c01((f - 46) / 10) };
  }
  if (shot === "share") {
    const period = 70;
    const f = (frame + i * 4) % period;
    const k = f / period;
    const a0: Vec3 = tip;
    const p = k < 0.5 ? quad(a0, [0, 1.6, -2.0], [0, 1.0, -1.0], k * 2) : quad([0, 1.0, -1.0], [0.1, 1.5, 1.2], [0.3, 0.9, 2.55], k * 2 - 1);
    return { p: [p[0] + (r("x") - 0.5) * 0.25, p[1] + (r("y") - 0.5) * 0.2, p[2]], size: 0.02, a: Math.sin(Math.PI * k) };
  }
  if (shot === "intro" || shot === "golden" || shot === "outro" || shot === "pray" || shot === "rise") {
    const base: V3 = shot === "golden" || shot === "outro" ? [(r("x") - 0.5) * 10, r("y") * 5, -3 + r("z") * 12] : [(r("x") - 0.5) * 4, 0.4 + r("y") * 2.4, -3.6 + r("z") * 3.5];
    return {
      p: [base[0] + noise2D(`gx${i}`, frame / 90, 0) * 0.3, base[1] + ((frame * 0.004 + r("o")) % 1) * 0.8, base[2] + noise2D(`gz${i}`, frame / 90, 0) * 0.3],
      size: 0.012 + r("s") * 0.012,
      a: (0.4 + 0.6 * Math.abs(Math.sin(frame / 20 + i))) * (shot === "intro" ? c01(t * 2) : 1),
    };
  }
  return null;
};

export const RukoWorld: React.FC<{ s: ShotState }> = ({ s }) => {
  const { shot, t, frame } = s;
  const pool = usePool();
  const L = RUKO.light;
  // Light level: dark intro brightening, golden ending.
  const lit = shot === "intro" ? 0.25 + 0.75 * ease(t) : 1;
  const golden = shot === "golden" ? ease(t) : shot === "outro" ? 1 : 0;
  // Lanterns light one by one in the intro.
  const lanternGlow = shot === "intro" ? c01(t * 1.6) : shot === "pray" || shot === "altar" || shot === "golden" || shot === "outro" ? 1.3 : 1;
  const doorOpen = shot === "intro" || shot === "hands" || shot === "face" ? 0 : shot === "door" ? ease((t - 0.2) / 0.6) : shot === "shutter" ? ease(t * 1.3) : 1;
  const shelfFill = ["intro", "hands", "face", "door", "bless", "shutter", "shelf", "sweep", "ledger", "market", "friendly", "busy"].includes(shot) ? 0.55 : shot === "blessing" ? 0.55 + 0.45 * ease(t) : 1;
  const dinner = shot === "dinner" ? 1 : 0;
  const busy = shot === "busy" || shot === "friendly" || shot === "customer" ? 1 : 0;
  // Cai Shen acting.
  const bless = shot === "bless" ? ease((t - 0.15) / 0.4) : shot === "dinner" || shot === "kids" ? 0.6 : 0;
  const lift = shot === "yuanbao" ? ease((t - 0.1) / 0.5) : 0;
  const nod = shot === "altar" || shot === "pray" ? Math.sin(frame / 12) * 0.5 : 0;
  const csOp = shot === "golden" ? 1 - ease((t - 0.45) / 0.5) : shot === "outro" ? 0 : 1;
  const csGlow = shot === "face" || shot === "bless" || shot === "yuanbao" ? 1 : 0.55 + golden;
  const blink = (frame % 90) < 5 ? Math.sin(((frame % 90) / 5) * Math.PI) : 0;
  const wink = shot === "yuanbao" ? Math.max(0, Math.sin(Math.PI * c01((t - 0.55) / 0.25))) : 0;

  // Smoke from the burner; thinned in the close shots on Cai Shen's face.
  const smokeFade = shot === "face" || shot === "yuanbao" ? 0.35 : 1;
  const smoke = Array.from({ length: SMOKE }, (_, i) => {
    const life = shot === "rise" ? 120 : 80;
    const f = (frame + i * (life / SMOKE)) % life;
    const k = f / life;
    const tip = RUKO.incenseTip;
    const rise = shot === "rise" ? 4.5 : 1.3;
    const p: V3 = [tip[0] + noise2D(`sx${i}`, frame / 50 + i, 0) * 0.12 * (0.3 + k), tip[1] + k * rise, tip[2] + noise2D(`sz${i}`, frame / 50 + i, 1) * 0.08 * k];
    return { p, size: 0.018 + k * 0.055, a: Math.sin(Math.PI * k) * 0.22 * lit * smokeFade };
  });
  const ringK = shot === "altar" ? c01((t - 0.35) / 0.5) : 0;

  const coins = shot === "river"
    ? Array.from({ length: 46 }, (_, i) => {
        const k = (frame * 0.006 + i / 46) % 1;
        const z = 2.2 + k * 9;
        const x = Math.sin(z * 0.9 + i) * 0.8 + (i % 3 === 0 ? Math.sin(k * 6) * 2.4 : 0);
        return { p: [x, 0.25 + Math.abs(Math.sin(k * 20 + i)) * 0.25, z] as V3, rot: frame * 0.1 + i, ingot: i % 5 === 0 };
      })
    : [];

  const actors = cast(s);
  const hearts = shot === "friendly" ? [[2.2, 1.9, 0.9], [1.25, 1.7, 1.55], [2.0, 1.5, 0.1]] : [];

  return (
    <group>
      <ambientLight intensity={L.ambient * lit + golden * 0.3} color="#FFE6C7" />
      <hemisphereLight args={["#FFE9C9", "#5A3A2A", L.hemi * lit]} />
      <directionalLight
        position={v(RUKO.sun)}
        intensity={L.sun * lit * (1 + golden * 0.3)}
        color={golden ? "#FFC870" : "#FFE2B0"}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      {/* Warm light pouring in through the open door. */}
      <spotLight position={[0, 2.6, 4.5]} target-position={[0, 0, -1.5]} angle={0.6} penumbra={0.7} intensity={L.door * doorOpen * lit} distance={10} decay={1.5} color="#FFD7A0" />
      <Room />
      <Door open={doorOpen} />
      <Altar frame={frame} glow={lit * (0.8 + golden * 0.6)} />
      <CaiShen pos={RUKO.caishen.pos} bless={bless} lift={lift} nod={nod} op={csOp} glow={csGlow} />
      <BlackTiger pos={RUKO.tiger} wink={wink} blink={blink} tail={Math.sin(frame / 10)} />
      <Shelf x={-R.halfX + 0.3} side={-1} fill={shelfFill} />
      <Shelf x={R.halfX - 0.3} side={1} fill={shelfFill} />
      <Counter frame={frame} busy={busy} />
      <DinnerTable full={dinner} />
      <Street frame={frame} glow={lanternGlow} />
      {(
        [
          [-2.6, R.height - 0.15, 1.2],
          [2.6, R.height - 0.15, 1.2],
          [-1.4, R.height - 0.15, -3.2],
          [1.4, R.height - 0.15, -3.2],
        ] as V3[]
      ).map((p, k) => (
        <Lantern key={k} pos={p}frame={frame} seed={k + 20} glow={shot === "intro" ? c01(t * 2.4 - k * 0.3) : lanternGlow} size={1.1} />
      ))}
      {actors.map((a) => (
        <ToyPerson
          key={a.id}
          pos={a.pos}
          rotY={a.rotY}
          h={HEIGHT[a.id] ?? (a.id === "grandpa" ? 1.08 : 1.15)}
          look={LOOKS[a.id]}
          pose={{ ...a.pose, walk: a.sit ? 0 : a.pose?.walk }}
        />
      ))}
      {/* Smoke (pooled). */}
      {smoke.map((m, i) => {
        pool.smoke[i].opacity = m.a;
        return <mesh key={`sm${i}`} geometry={pool.sphere} material={pool.smoke[i]} position={m.p} scale={m.size} visible={m.a > 0.01} />;
      })}
      {/* Smoke ring over the altar. */}
      <mesh geometry={pool.ring} material={pool.smoke[0]} position={[0, RUKO.incenseTip[1] + 0.3 + ringK * 0.9, RUKO.incenseTip[2]]} rotation={[Math.PI / 2, 0, 0]} scale={0.15 + ringK * 0.45} visible={ringK > 0 && ringK < 1} />
      {/* Gold particles (pooled). */}
      {Array.from({ length: GOLD }, (_, i) => {
        const g = goldAt(s, i);
        pool.gold[i].opacity = g ? c01(g.a) : 0;
        return <mesh key={`g${i}`} geometry={pool.sphere} material={pool.gold[i]} position={g ? g.p : [0, -10, 0]} scale={g ? g.size : 0.01} visible={!!g && g.a > 0.01} />;
      })}
      {/* River of coins and ingots. */}
      {coins.map((c, i) => (
        <mesh key={`coin${i}`} position={c.p} rotation={[Math.PI / 2, c.rot, 0]} material={pool.coin} castShadow>
          {c.ingot ? <sphereGeometry args={[0.13, 12, 8]} /> : <cylinderGeometry args={[0.11, 0.11, 0.022, 16]} />}
        </mesh>
      ))}
      {/* Little gold hearts over friendly moments. */}
      {hearts.map((h, i) => {
        const k = c01((t - i * 0.2) / 0.3);
        return (
          <mesh key={`h${i}`} position={[h[0], h[1] + k * 0.2, h[2]]} scale={0.06 * Math.sin(Math.PI * Math.min(1, k * 1.2))} material={pool.gold[i]}>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
        );
      })}
      {/* Golden wash at the end. */}
      <mesh position={[0, 3, 4]} visible={golden > 0}>
        <sphereGeometry args={[30, 24, 16]} />
        <meshBasicMaterial color={C.goldLight} transparent opacity={0.18 * golden} side={1} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};
