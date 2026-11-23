// Chibi toy characters of the "ruko" world (sp09): a posable family member,
// Cai Shen and his little black tiger. Built from rounded primitives (no
// licensed models), feet at (0, 0, 0), facing +z. Every pose value is driven
// by the world from the frame.

import { RoundedBox } from "@react-three/drei";
import { DoubleSide } from "three";
import type { Vec3 } from "../../../core/three/rig";
import { RUKO } from "./rukoConfig";

const C = RUKO.colors;
type V3 = [number, number, number];
const v = (p: Vec3): V3 => [p[0], p[1], p[2]];

// One material helper so a whole character can fade (Cai Shen into light).
const Mat: React.FC<{ color: string; op?: number; rough?: number; metal?: number; emissive?: string; glow?: number }> = ({
  color,
  op = 1,
  rough = 0.6,
  metal = 0,
  emissive,
  glow = 0,
}) => (
  <meshStandardMaterial
    color={color}
    roughness={rough}
    metalness={metal}
    transparent={op < 1}
    opacity={op}
    emissive={emissive ?? "#000000"}
    emissiveIntensity={glow}
  />
);

export type Held = "none" | "incense" | "box" | "broom" | "book" | "tea" | "bag" | "bowl";

export const HeldProp: React.FC<{ kind: Held; s: number; glow?: number }> = ({ kind, s, glow = 1 }) => {
  switch (kind) {
    case "incense":
      return (
        <group>
          {[-1, 0, 1].map((k) => (
            <group key={k} position={[k * 0.018 * s, 0.12 * s, 0]} rotation={[0, 0, k * 0.12]}>
              <mesh>
                <cylinderGeometry args={[0.006 * s, 0.006 * s, 0.28 * s, 6]} />
                <Mat color={C.red} />
              </mesh>
              <mesh position={[0, 0.145 * s, 0]}>
                <sphereGeometry args={[0.012 * s, 8, 6]} />
                <meshBasicMaterial color="#FF8A3D" toneMapped={false} transparent opacity={0.6 + 0.4 * glow} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "box":
      return (
        <RoundedBox args={[0.3 * s, 0.22 * s, 0.24 * s]} radius={0.02 * s} position={[0, 0.02 * s, 0.12 * s]} castShadow>
          <Mat color="#C9955A" />
        </RoundedBox>
      );
    case "broom":
      return (
        <group rotation={[0.4, 0, 0]}>
          <mesh position={[0, -0.05 * s, 0]}>
            <cylinderGeometry args={[0.01 * s, 0.01 * s, 0.6 * s, 6]} />
            <Mat color={C.wood} />
          </mesh>
          <mesh position={[0, -0.38 * s, 0]}>
            <coneGeometry args={[0.08 * s, 0.16 * s, 10]} />
            <Mat color="#D8B46A" />
          </mesh>
        </group>
      );
    case "book":
      return (
        <group position={[0, 0.02 * s, 0.1 * s]} rotation={[-0.9, 0, 0]}>
          <RoundedBox args={[0.2 * s, 0.03 * s, 0.26 * s]} radius={0.006 * s}>
            <Mat color={C.redLacquer} />
          </RoundedBox>
          <mesh position={[0, 0.018 * s, 0]}>
            <boxGeometry args={[0.18 * s, 0.01 * s, 0.24 * s]} />
            <Mat color="#FFFDF4" />
          </mesh>
        </group>
      );
    case "tea":
      return (
        <group position={[0, 0.03 * s, 0.08 * s]}>
          <mesh>
            <cylinderGeometry args={[0.07 * s, 0.07 * s, 0.012 * s, 16]} />
            <Mat color="#FFFFFF" rough={0.3} />
          </mesh>
          <mesh position={[0, 0.04 * s, 0]}>
            <cylinderGeometry args={[0.04 * s, 0.032 * s, 0.07 * s, 16]} />
            <Mat color="#FFFFFF" rough={0.3} />
          </mesh>
        </group>
      );
    case "bag":
      return (
        <RoundedBox args={[0.2 * s, 0.24 * s, 0.1 * s]} radius={0.012 * s} position={[0, -0.08 * s, 0.06 * s]}>
          <Mat color={C.redLacquer} />
        </RoundedBox>
      );
    case "bowl":
      return (
        <group position={[0, 0.02 * s, 0.1 * s]}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[0.07 * s, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat color="#FFFFFF" rough={0.3} />
          </mesh>
          <mesh position={[0, 0.005 * s, 0]}>
            <sphereGeometry args={[0.06 * s, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat color="#FFF8E6" />
          </mesh>
        </group>
      );
    default:
      return null;
  }
};

export type PersonLook = {
  shirt: string;
  pants: string;
  skin?: string;
  hair?: string;
  style: "short" | "bun" | "grey" | "kid";
  beard?: boolean;
};

export type PersonPose = {
  bow?: number; // 0..1 bows forward from the hips
  armL?: number; // 0..1 raises the left arm forward/up
  armR?: number;
  walk?: number; // phase in radians (0 = standing)
  nod?: number; // -1..1 head tilt
  held?: Held;
  heldGlow?: number;
  smile?: number;
};

export const ToyPerson: React.FC<{ pos: Vec3; rotY?: number; h?: number; look: PersonLook; pose?: PersonPose }> = ({
  pos,
  rotY = 0,
  h = 1.15,
  look,
  pose = {},
}) => {
  const skin = look.skin ?? (look.style === "grey" ? C.skinOld : C.skin);
  const hair = look.hair ?? (look.style === "grey" ? C.hairGrey : C.hair);
  const bow = pose.bow ?? 0;
  const walk = pose.walk ?? 0;
  const swing = Math.sin(walk) * 0.55 * (walk ? 1 : 0);
  const bob = walk ? Math.abs(Math.cos(walk)) * 0.02 * h : 0;
  const armRot = (k: number) => {
    const raise = k < 0 ? (pose.armL ?? 0) : (pose.armR ?? 0);
    return -raise * 2.2 + (walk ? -swing * k * 0.6 : 0);
  };
  return (
    <group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, rotY, 0]}>
      {/* Legs. */}
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.075 * h, 0.3 * h, 0]} rotation={[swing * k, 0, 0]}>
          <mesh position={[0, -0.15 * h, 0]} castShadow>
            <capsuleGeometry args={[0.065 * h, 0.16 * h, 4, 10]} />
            <Mat color={look.pants} />
          </mesh>
          <mesh position={[0, -0.28 * h, 0.03 * h]} castShadow>
            <sphereGeometry args={[0.07 * h, 10, 8]} />
            <Mat color="#2A2220" />
          </mesh>
        </group>
      ))}
      {/* Upper body bows from the hips. */}
      <group position={[0, 0.32 * h, 0]} rotation={[bow * 0.85, 0, 0]}>
        <mesh position={[0, 0.17 * h, 0]} castShadow>
          <capsuleGeometry args={[0.17 * h, 0.16 * h, 6, 14]} />
          <Mat color={look.shirt} />
        </mesh>
        {/* Arms. */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 0.2 * h, 0.3 * h, 0]} rotation={[armRot(k), 0, k * 0.12]}>
            <mesh position={[0, -0.12 * h, 0]} castShadow>
              <capsuleGeometry args={[0.05 * h, 0.16 * h, 4, 8]} />
              <Mat color={look.shirt} />
            </mesh>
            <mesh position={[0, -0.25 * h, 0]} castShadow>
              <sphereGeometry args={[0.05 * h, 10, 8]} />
              <Mat color={skin} />
            </mesh>
            {k > 0 && pose.held && pose.held !== "none" ? (
              <group position={[0, -0.27 * h, 0.02 * h]} rotation={[-armRot(k), 0, 0]}>
                <HeldProp kind={pose.held} s={h} glow={pose.heldGlow} />
              </group>
            ) : null}
          </group>
        ))}
        {/* Head. */}
        <group position={[0, 0.52 * h, 0]} rotation={[(pose.nod ?? 0) * 0.35, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.2 * h, 20, 16]} />
            <Mat color={skin} />
          </mesh>
          {/* Hair. */}
          <mesh position={[0, 0.05 * h, -0.02 * h]} scale={[1.04, look.style === "grey" ? 0.55 : 0.75, 1.04]}>
            <sphereGeometry args={[0.2 * h, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat color={hair} />
          </mesh>
          {look.style === "bun" ? (
            <mesh position={[0, 0.17 * h, -0.12 * h]}>
              <sphereGeometry args={[0.08 * h, 12, 10]} />
              <Mat color={hair} />
            </mesh>
          ) : null}
          {look.style === "kid" ? (
            <mesh position={[0.03 * h, 0.21 * h, 0.02 * h]} rotation={[0, 0, -0.4]}>
              <coneGeometry args={[0.03 * h, 0.08 * h, 8]} />
              <Mat color={hair} />
            </mesh>
          ) : null}
          {/* Face: eyes, smile, cheeks. */}
          {[-1, 1].map((k) => (
            <mesh key={`e${k}`} position={[k * 0.068 * h, 0.01 * h, 0.183 * h]}>
              <sphereGeometry args={[0.024 * h, 10, 8]} />
              <meshStandardMaterial color="#1E1614" roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, -0.055 * h, 0.18 * h]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.035 * h * (pose.smile ?? 1), 0.008 * h, 6, 12, Math.PI]} />
            <meshStandardMaterial color="#7A2E24" />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={`c${k}`} position={[k * 0.12 * h, -0.04 * h, 0.15 * h]} scale={[1, 0.6, 0.4]}>
              <sphereGeometry args={[0.03 * h, 8, 6]} />
              <meshStandardMaterial color="#F58A7A" transparent opacity={0.7} />
            </mesh>
          ))}
          {look.beard ? (
            <mesh position={[0, -0.18 * h, 0.12 * h]} rotation={[Math.PI + 0.25, 0, 0]}>
              <coneGeometry args={[0.06 * h, 0.14 * h, 10]} />
              <Mat color={C.hairGrey} />
            </mesh>
          ) : null}
        </group>
      </group>
    </group>
  );
};

// Cai Shen: red robe with gold trim, official's hat with wings, long beard,
// yuanbao in his hands. `bless` raises the right hand, `lift` raises the
// yuanbao, `nod` tilts the head, `op` fades him into light, `glow` is his aura.
export const CaiShen: React.FC<{ pos: Vec3; scale?: number; bless?: number; lift?: number; nod?: number; op?: number; glow?: number; smile?: number }> = ({
  pos,
  scale = 1,
  bless = 0,
  lift = 0,
  nod = 0,
  op = 1,
  glow = 0.4,
  smile = 1,
}) => {
  const s = RUKO.caishen.height * scale;
  return (
    <group position={v(pos)} scale={s}>
      {/* Aura. */}
      <mesh position={[0, 0.62, -0.18]}>
        <circleGeometry args={[0.52, 40]} />
        <meshBasicMaterial color={C.goldLight} transparent opacity={0.35 * glow * op} toneMapped={false} depthWrite={false} />
      </mesh>
      {/* Robe and trim. */}
      <mesh position={[0, 0.27, 0]} castShadow>
        <coneGeometry args={[0.32, 0.56, 24, 1, true]} />
        <Mat color={C.redLacquer} op={op} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.31, 0.022, 8, 32]} />
        <Mat color={C.gold} metal={0.8} rough={0.3} op={op} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.14, 6, 16]} />
        <Mat color={C.redLacquer} op={op} />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.165, 0.02, 8, 24]} />
        <Mat color={C.gold} metal={0.8} rough={0.3} op={op} />
      </mesh>
      {/* Sleeves and hands holding the yuanbao (right hand blesses). */}
      {[-1, 1].map((k) => {
        const up = k > 0 ? bless : 0;
        return (
          <group key={k} position={[k * 0.17, 0.52, 0.02]} rotation={[-0.9 - up * 1.4 - lift * 0.5, 0, k * (0.5 - up * 0.3)]}>
            <mesh position={[0, -0.1, 0]} castShadow>
              <coneGeometry args={[0.07, 0.24, 12, 1, true]} />
              <meshStandardMaterial color={C.redLacquer} side={DoubleSide} transparent={op < 1} opacity={op} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.22, 0]}>
              <sphereGeometry args={[0.04, 10, 8]} />
              <Mat color={C.skin} op={op} />
            </mesh>
          </group>
        );
      })}
      <group position={[0, 0.4 + lift * 0.22, 0.2 - bless * 0.04]} rotation={[0.2, 0, 0]}>
        <mesh scale={[1.6, 0.55, 0.9]}>
          <sphereGeometry args={[0.07, 18, 12]} />
          <Mat color={C.coin} metal={0.9} rough={0.25} op={op} emissive={C.coin} glow={0.25 + lift * 0.6} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <sphereGeometry args={[0.045, 14, 10]} />
          <Mat color={C.coin} metal={0.9} rough={0.25} op={op} emissive={C.coin} glow={0.25 + lift * 0.6} />
        </mesh>
      </group>
      {/* Head, beard, hat. */}
      <group position={[0, 0.74, 0]} rotation={[nod * 0.3, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 20, 16]} />
          <Mat color={C.skin} op={op} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={`e${k}`} position={[k * 0.05, 0.02, 0.138]} scale={[1, 0.45 + 0.1 * smile, 1]}>
            <sphereGeometry args={[0.018, 8, 6]} />
            <meshStandardMaterial color="#1E1614" transparent={op < 1} opacity={op} />
          </mesh>
        ))}
        {[-1, 1].map((k) => (
          <mesh key={`m${k}`} position={[k * 0.04, -0.045, 0.13]} rotation={[0, 0, k * 1.1]}>
            <capsuleGeometry args={[0.009, 0.05, 4, 6]} />
            <Mat color={C.hair} op={op} />
          </mesh>
        ))}
        <mesh position={[0, -0.18, 0.08]} rotation={[Math.PI - 0.15, 0, 0]}>
          <coneGeometry args={[0.06, 0.24, 12]} />
          <Mat color={C.hair} op={op} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={`c${k}`} position={[k * 0.09, -0.03, 0.115]} scale={[1, 0.6, 0.4]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshStandardMaterial color="#F58A7A" transparent opacity={0.7 * op} />
          </mesh>
        ))}
        {/* Official's hat: cap, crown, wings, gold plate. */}
        <mesh position={[0, 0.1, -0.01]}>
          <cylinderGeometry args={[0.15, 0.16, 0.1, 20]} />
          <Mat color="#1A1414" op={op} />
        </mesh>
        <mesh position={[0, 0.18, -0.04]}>
          <boxGeometry args={[0.2, 0.1, 0.14]} />
          <Mat color="#1A1414" op={op} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={`w${k}`} position={[k * 0.24, 0.16, -0.04]} rotation={[0, 0, k * 0.15]}>
            <boxGeometry args={[0.18, 0.04, 0.015]} />
            <Mat color="#1A1414" op={op} />
          </mesh>
        ))}
        <mesh position={[0, 0.12, 0.142]}>
          <circleGeometry args={[0.035, 16]} />
          <meshStandardMaterial color={C.gold} metalness={0.8} roughness={0.3} transparent={op < 1} opacity={op} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

// Cai Shen's little black tiger: round, gold stripes, can wink.
export const BlackTiger: React.FC<{ pos: Vec3; scale?: number; wink?: number; blink?: number; tail?: number }> = ({ pos, scale = 1, wink = 0, blink = 0, tail = 0 }) => (
  <group position={v(pos)} scale={0.22 * scale} rotation={[0, -0.5, 0]}>
    <mesh position={[0, 0.35, 0]} scale={[1, 0.8, 1.3]} castShadow>
      <sphereGeometry args={[0.4, 18, 14]} />
      <Mat color={C.tiger} rough={0.5} />
    </mesh>
    {[-0.2, 0, 0.2].map((z, i) => (
      <mesh key={i} position={[0, 0.62, z]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.25, 1]}>
        <torusGeometry args={[0.18, 0.025, 6, 16, Math.PI]} />
        <Mat color={C.tigerStripe} metal={0.6} rough={0.35} />
      </mesh>
    ))}
    {[-1, 1].map((k) => (
      <mesh key={`l${k}`} position={[k * 0.22, 0.1, 0.25]} castShadow>
        <capsuleGeometry args={[0.09, 0.12, 4, 8]} />
        <Mat color={C.tiger} />
      </mesh>
    ))}
    <group position={[0, 0.72, 0.42]}>
      <mesh castShadow>
        <sphereGeometry args={[0.32, 18, 14]} />
        <Mat color={C.tiger} rough={0.5} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={`ear${k}`} position={[k * 0.2, 0.26, -0.02]}>
          <coneGeometry args={[0.1, 0.16, 10]} />
          <Mat color={C.tiger} />
        </mesh>
      ))}
      {[-1, 1].map((k) => {
        const closed = k > 0 ? Math.max(wink, blink) : blink;
        return (
          <group key={`eye${k}`} position={[k * 0.12, 0.04, 0.27]} scale={[1, Math.max(0.08, 1 - closed), 1]}>
            <mesh>
              <sphereGeometry args={[0.07, 12, 10]} />
              <meshStandardMaterial color={C.tigerStripe} emissive={C.tigerStripe} emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.05]}>
              <sphereGeometry args={[0.035, 10, 8]} />
              <meshStandardMaterial color="#120E0E" />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, -0.08, 0.3]} scale={[1.3, 0.8, 0.6]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <Mat color="#3A3034" />
      </mesh>
    </group>
    <mesh position={[0, 0.45, -0.55]} rotation={[0.8 + tail * 0.4, 0, 0]}>
      <capsuleGeometry args={[0.05, 0.35, 4, 8]} />
      <Mat color={C.tiger} />
    </mesh>
  </group>
);
