// EP11 "today" act: a modern hatchback (toon look, built from an extruded side profile), its front disc brake
// (rotor, red caliper, two composite pads that clamp and wear down), a city street and the Doktermobil workshop.
// Car local frame like the Motorwagen: forward +x, up +y, left +z; origin on the ground midway between the axles.
import * as THREE from "three";
import { staticFile } from "remotion";
import { TOON_BRAND as BR } from "../brand";
import { Batch, V, boxGeo, lam, addVeg } from "../build";
import { ctex, rep } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import type { V3 } from "./rig";

export const M_WB = 2.46, M_R = 0.33, M_TRACK = 1.5, M_LEN = 3.95;
export const M_FRONT_X = M_WB / 2, M_REAR_X = -M_WB / 2;
/** front-left wheel hub (local): the brake macro target */
export const M_HUB: V3 = [M_FRONT_X, M_R, M_TRACK / 2];
/** caliper sits at this angle round the rotor (from +x toward +y) */
const CAL_A = 0.55;
export const ROTOR_R = 0.235;
/** pad centre on the rotor face (local, outer side), for cameras and effects */
/** caliper centre (local) and the outward radial direction through it */
export const M_CAL: V3 = [M_FRONT_X + (ROTOR_R - 0.05) * Math.cos(CAL_A), M_R + (ROTOR_R - 0.05) * Math.sin(CAL_A), M_TRACK / 2];
export const M_RADIAL: V3 = [Math.cos(CAL_A), Math.sin(CAL_A), 0];
export const M_PAD: V3 = [M_FRONT_X + (ROTOR_R - 0.06) * Math.cos(CAL_A), M_R + (ROTOR_R - 0.06) * Math.sin(CAL_A), M_TRACK / 2 + 0.03];

export type ModernState = {
  x: number; z: number; yaw: number; dist: number; t: number;
  /** pads 0 open .. 1 clamped on the rotor */ clamp?: number;
  /** pad wear 0 new .. 1 thin */ wear?: number;
  /** hide the front-left tyre and rim to show the brake */ xray?: boolean;
  /** nose dip when braking (rad) */ dip?: number;
  /** cabin car only: see-through body that reveals the AC box behind the dashboard (0 off .. 1 full) */ xrayBody?: number;
};

const phong = (c: string, sh = 40, sp = "#ffffff") => twoTone(new THREE.MeshPhongMaterial({ color: c, specular: sp, shininess: sh }), 0.15);

/** side profile of the hatchback, wheel arches cut in (counter-clockwise) */
const bodyShape = () => {
  const s = new THREE.Shape();
  const y0 = 0.3, ar = M_R + 0.07, L = M_LEN / 2;
  s.moveTo(-L, y0 + 0.08);
  s.lineTo(M_REAR_X - ar, y0);
  s.absarc(M_REAR_X, y0, ar, Math.PI, 0, true);
  s.lineTo(M_FRONT_X - ar, y0);
  s.absarc(M_FRONT_X, y0, ar, Math.PI, 0, true);
  s.lineTo(L - 0.05, y0 + 0.04);
  s.quadraticCurveTo(L + 0.04, y0 + 0.1, L, 0.66); // bumper
  s.quadraticCurveTo(L - 0.05, 0.82, L - 0.4, 0.86); // hood front
  s.lineTo(0.9, 0.98); // hood
  s.lineTo(0.2, 1.42); // windscreen
  s.quadraticCurveTo(-0.4, 1.5, -1.25, 1.42); // roof
  s.lineTo(-L + 0.06, 1.0); // rear hatch
  s.quadraticCurveTo(-L - 0.02, 0.9, -L, 0.7);
  s.lineTo(-L, y0 + 0.08);
  return s;
};
/** greenhouse (side glass), a little inside the body outline */
const glassShape = () => {
  const s = new THREE.Shape();
  s.moveTo(-1.62, 1.0); s.lineTo(-1.2, 1.34); s.quadraticCurveTo(-0.4, 1.41, 0.17, 1.35); s.lineTo(0.78, 1.0); s.lineTo(-1.62, 1.0);
  return s;
};
/** the cabin car is a tall MPV-style hatch with big glass, so the people inside read from any side */
/** lower body of the MPV: everything below the 0.9 m belt line plus the hood */
const mpvLower = () => {
  const s = new THREE.Shape();
  const y0 = 0.3, ar = M_R + 0.07, L = M_LEN / 2;
  s.moveTo(-L, y0 + 0.08);
  s.lineTo(M_REAR_X - ar, y0);
  s.absarc(M_REAR_X, y0, ar, Math.PI, 0, true);
  s.lineTo(M_FRONT_X - ar, y0);
  s.absarc(M_FRONT_X, y0, ar, Math.PI, 0, true);
  s.lineTo(L - 0.05, y0 + 0.04);
  s.quadraticCurveTo(L + 0.04, y0 + 0.1, L, 0.66);
  s.quadraticCurveTo(L - 0.05, 0.8, L - 0.4, 0.84);
  s.lineTo(1.1, 0.9);
  s.lineTo(-L + 0.02, 0.92);
  s.quadraticCurveTo(-L - 0.02, 0.85, -L, 0.7);
  s.lineTo(-L, y0 + 0.08);
  return s;
};
/** roof + rear hatch frame as one thin band */
const mpvRoof = () => {
  const s = new THREE.Shape();
  s.moveTo(0.3, 1.6); s.quadraticCurveTo(-0.6, 1.68, -1.6, 1.6); s.lineTo(-1.97, 1.08); s.lineTo(-1.87, 1.06);
  s.lineTo(-1.52, 1.5); s.quadraticCurveTo(-0.6, 1.57, 0.25, 1.5); s.lineTo(0.3, 1.6);
  return s;
};
/** glass with a tint and two diagonal glints, so it reads as glass while the people behind it stay visible */
const glassTex = () => ctex("modGlassGlint", 256, 256, (g) => {
  g.fillStyle = "rgba(255,255,255,0)"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(255,255,255,0.75)";
  g.beginPath(); g.moveTo(40, 256); g.lineTo(120, 0); g.lineTo(160, 0); g.lineTo(80, 256); g.fill();
  g.fillStyle = "rgba(255,255,255,0.45)";
  g.beginPath(); g.moveTo(110, 256); g.lineTo(190, 0); g.lineTo(206, 0); g.lineTo(126, 256); g.fill();
});
const MPV_WIN: [number, number][] = [[-1.72, 0.9], [0.96, 0.9], [0.27, 1.5], [-1.52, 1.52], [-1.78, 1.1]];
const mpvGlass = () => { const s = new THREE.Shape(); s.moveTo(...MPV_WIN[0]); for (const p of MPV_WIN.slice(1)) s.lineTo(...p); s.lineTo(...MPV_WIN[0]); return s; };
/** seated card spots in the cabin car (local): RHD, driver on the right (-z); card base so the head sits mid-window */
export const M_SEATS = { driver: [-0.15, 0.3, -0.38] as V3, passenger: [-0.15, 0.3, 0.38] as V3 };
/** the AC box behind the dashboard (local), shown in x-ray */
export const M_ACBOX: V3 = [0.62, 0.72, 0.05];
/** dashboard vent (local), where AC air and smells come out */
export const M_VENT: V3 = [0.5, 0.98, 0];
const extrude = (sh: THREE.Shape, depth: number, bevel: number) => {
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 18 });
  g.translate(0, 0, -depth / 2);
  return g;
};

const tyreTex = () => ctex("modTyre", 256, 64, (g) => {
  g.fillStyle = "#2a2b30"; g.fillRect(0, 0, 256, 64);
  g.fillStyle = "#1c1d21"; for (let x = 0; x < 256; x += 16) g.fillRect(x, 0, 8, 64);
});
/** drilled + slotted rotor face */
const rotorTex = () => ctex("modRotor", 512, 512, (g) => {
  g.fillStyle = "#b9bec6"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(90,96,108,0.55)"; g.lineWidth = 3;
  for (let r = 90; r < 250; r += 9) { g.beginPath(); g.arc(256, 256, r, 0, 7); g.stroke(); }
  g.fillStyle = "#3a3e48";
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; for (const r of [150, 190, 228]) { const aa = a + (r === 190 ? 0.13 : 0); g.beginPath(); g.arc(256 + r * Math.cos(aa), 256 + r * Math.sin(aa), 7, 0, 7); g.fill(); } }
  g.fillStyle = "#6b707c"; g.beginPath(); g.arc(256, 256, 92, 0, 7); g.fill();
  g.fillStyle = "#2e3240"; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.beginPath(); g.arc(256 + 52 * Math.cos(a), 256 + 52 * Math.sin(a), 11, 0, 7); g.fill(); }
});
/** composite friction material: grey-brown speckle with a centre groove */
const padTex = () => ctex("modPad", 256, 128, (g, r) => {
  g.fillStyle = "#5d5650"; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "#7a726a" : "#3f3a36"; g.fillRect(r() * 256, r() * 128, 2 + r() * 3, 2 + r() * 3); }
  g.fillStyle = "#2a2624"; g.fillRect(124, 0, 8, 128);
});

export class ModernCar {
  root = new THREE.Group();
  private body = new THREE.Group();
  private wheels: { g: THREE.Group; tyre: THREE.Group }[] = [];
  private rotors: THREE.Mesh[] = [];
  private pads: { m: THREE.Mesh; side: number }[] = [];
  private rotorMat: THREE.MeshPhongMaterial;
  private paint: THREE.MeshPhongMaterial | null = null;
  private acBox: THREE.Group | null = null;

  constructor(opts: { cabin?: boolean } = {}) {
    const cabin = !!opts.cabin;
    const M = {
      paint: phong("#2f8fd8", 70), glass: phong("#1d2a44", 90, "#9fc4ff"), black: lam("modBlack", () => ({ color: "#24262d" })),
      chrome: phong("#d9dde3", 80), lamp: lam("modLamp", () => ({ color: "#fff6d8" })), tail: lam("modTail", () => ({ color: "#d8262c" })),
      tyre: lam("modTyreM", () => ({ map: tyreTex() })), rim: phong("#cfd4db", 70), caliper: phong("#d8262c", 60),
      backing: phong("#7c828e", 40), pad: lam("modPadM", () => ({ map: padTex() })), plate: lam("modPlate", () => ({ color: "#f4f1e6" })),
    };
    this.rotorMat = twoTone(new THREE.MeshPhongMaterial({ color: "#ffffff", map: rotorTex(), specular: "#ffffff", shininess: 60, emissive: new THREE.Color(0, 0, 0) }), 0.15);
    this.root.add(this.body);
    const b = new Batch();
    const glassT = cabin ? twoTone(new THREE.MeshPhongMaterial({ color: "#a9d8f5", map: glassTex(), specular: "#ffffff", shininess: 100, transparent: true, opacity: 0.42, depthWrite: false }), 0.15) : M.glass;
    const trim = lam("modTrim", () => ({ color: "#1b1d22" })), chromeM = M.chrome;
    /** a round bar between two points */
    const bar = (a: THREE.Vector3, c: THREE.Vector3, r: number, mat: THREE.Material) => {
      const g = new THREE.CylinderGeometry(r, r, a.distanceTo(c), 10);
      g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
      b.add(g, mat);
    };
    if (cabin) {
      // MPV cabin: big side glass cut through, clear panes, a clear windscreen, seats and a dashboard inside.
      // Its paint is its own material so the body can go see-through (x-ray) per frame.
      this.paint = twoTone(new THREE.MeshPhongMaterial({ color: "#2f8fd8", specular: "#ffffff", shininess: 70, transparent: true, opacity: 1 }), 0.15);
      // a hollow cabin: two thin side skins, a solid nose (hood + bumper) and tail, a floor pan, so the seats,
      // the console and the door cards show through the glass like a real interior
      for (const sd of [-1, 1]) { const g = extrude(mpvLower(), 0.06, 0.04); g.translate(0, 0, sd * 0.7); b.add(g, this.paint); }
      const nose = new THREE.Shape();
      nose.moveTo(0.98, 0.42); nose.lineTo(M_LEN / 2 - 0.05, 0.36); nose.quadraticCurveTo(M_LEN / 2 + 0.04, 0.42, M_LEN / 2, 0.66);
      nose.quadraticCurveTo(M_LEN / 2 - 0.05, 0.8, M_LEN / 2 - 0.4, 0.84); nose.lineTo(1.1, 0.9); nose.lineTo(0.98, 0.9); nose.lineTo(0.98, 0.42);
      b.add(extrude(nose, 1.36, 0.04), this.paint);
      b.add(boxGeo(V(-M_LEN / 2, 0.36, -0.7), V(-1.62, 0.92, 0.7)), this.paint); // tail / boot
      b.add(extrude(mpvRoof(), M_TRACK + 0.02 - 0.16, 0.06), this.paint);
      b.add(boxGeo(V(-1.55, 1.47, -0.68), V(0.28, 1.5, 0.68)), lam("modHeadliner", () => ({ color: "#d8d4cb" }))); // headliner
      for (const sd of [-1, 1]) {
        bar(V(1.08, 0.9, sd * 0.74), V(0.28, 1.56, sd * 0.74), 0.07, trim); // A-pillar (black, like the real trim)
        const g = extrude(mpvGlass(), 0.01, 0); g.translate(0, 0, sd * 0.77); b.add(g, glassT);
        // black window seal round the side glass, chrome belt strip, B- and C-pillars
        for (let i = 0; i < MPV_WIN.length; i++) {
          const [x0, y0] = MPV_WIN[i], [x1, y1] = MPV_WIN[(i + 1) % MPV_WIN.length];
          bar(V(x0, y0, sd * 0.785), V(x1, y1, sd * 0.785), 0.03, trim);
        }
        b.add(boxGeo(V(-1.72, 0.87, Math.min(sd * 0.775, sd * 0.8)), V(0.96, 0.9, Math.max(sd * 0.775, sd * 0.8))), chromeM);
        b.add(boxGeo(V(-0.64, 0.9, Math.min(sd * 0.73, sd * 0.795)), V(-0.5, 1.52, Math.max(sd * 0.73, sd * 0.795))), trim);
        // door shut lines + handles
        for (const x of [0.95, -0.57, -1.6]) b.add(boxGeo(V(x - 0.012, 0.36, Math.min(sd * 0.77, sd * 0.79)), V(x + 0.012, 0.88, Math.max(sd * 0.77, sd * 0.79))), trim);
        for (const x of [0.42, -1.05]) b.add(boxGeo(V(x - 0.08, 0.76, Math.min(sd * 0.775, sd * 0.81)), V(x + 0.08, 0.795, Math.max(sd * 0.775, sd * 0.81))), chromeM);
        // door mirror on the door, below the window line
        b.add(boxGeo(V(0.98, 0.88, Math.min(sd * 0.78, sd * 0.86)), V(1.04, 0.94, Math.max(sd * 0.78, sd * 0.86))), trim);
        b.add(boxGeo(V(0.94, 0.9, Math.min(sd * 0.86, sd * 1.0)), V(1.1, 1.04, Math.max(sd * 0.86, sd * 1.0))), this.paint);
        b.add(boxGeo(V(0.93, 0.91, Math.min(sd * 0.87, sd * 0.99)), V(0.94, 1.03, Math.max(sd * 0.87, sd * 0.99))), lam("modMirror", () => ({ color: "#cfe6f5" })));
      }
      const seat = lam("modSeat", () => ({ color: "#3b3f4c" })), dash = lam("modDash", () => ({ color: "#2a2d36" }));
      const carpet = lam("modCarpet", () => ({ color: "#26282f" })), seatHi = lam("modSeatHi", () => ({ color: "#5a5f6e" }));
      const door = lam("modDoorCard", () => ({ color: "#4a4e5a" }));
      b.add(boxGeo(V(-1.62, 0.32, -0.68), V(0.98, 0.42, 0.68)), carpet); // floor
      for (const z of [-0.38, 0.38]) { // front seats: cushion, reclined back with a lighter centre panel, headrest on two posts
        b.add(boxGeo(V(-0.48, 0.42, z - 0.25), V(0.08, 0.6, z + 0.25)), seat);
        const back = new THREE.Group(), bb = new Batch();
        bb.add(boxGeo(V(-0.07, 0, -0.25), V(0.07, 0.68, 0.25)), seat);
        bb.add(boxGeo(V(0.06, 0.08, -0.14), V(0.075, 0.6, 0.14)), seatHi);
        bb.add(boxGeo(V(-0.06, 0.78, -0.15), V(0.06, 0.98, 0.15)), seat);
        for (const pz of [-0.08, 0.08]) bb.add(boxGeo(V(-0.015, 0.68, pz - 0.012), V(0.015, 0.79, pz + 0.012)), lam("modPost", () => ({ color: "#9aa0aa" })));
        bb.build(back);
        back.position.set(-0.5, 0.56, z); back.rotation.z = 0.18;
        this.body.add(back);
      }
      b.add(boxGeo(V(-1.62, 0.42, -0.66), V(-1.05, 0.72, 0.66)), seat); // rear bench
      b.add(boxGeo(V(-1.62, 0.72, -0.66), V(-1.5, 1.2, 0.66)), seat);
      b.add(boxGeo(V(-0.4, 0.42, -0.1), V(0.42, 0.72, 0.1)), carpet); // centre console
      b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8).translate(0.15, 0.8, 0), lam("modPost", () => ({ color: "#9aa0aa" })));
      b.add(new THREE.SphereGeometry(0.045, 10, 8).translate(0.15, 0.89, 0), carpet); // gear knob
      for (const sd of [-1, 1]) { // door cards with an armrest
        b.add(boxGeo(V(-1.6, 0.42, Math.min(sd * 0.62, sd * 0.69)), V(0.95, 0.9, Math.max(sd * 0.62, sd * 0.69))), door);
        b.add(boxGeo(V(-0.4, 0.7, Math.min(sd * 0.56, sd * 0.63)), V(0.3, 0.76, Math.max(sd * 0.56, sd * 0.63))), seatHi);
      }
      b.add(boxGeo(V(0.4, 0.42, -0.7), V(1.0, 0.96, 0.7)), dash);
      for (const z of [-0.3, 0.0, 0.3]) b.add(boxGeo(V(0.37, 0.84, z - 0.09), V(0.41, 0.93, z + 0.09)), lam("modVent", () => ({ color: "#151619" })));
      b.add(new THREE.TorusGeometry(0.13, 0.025, 8, 24).rotateY(Math.PI / 2).rotateZ(0.35).translate(0.3, 0.8, -0.38), lam("modWheel", () => ({ color: "#1b1c20" }))); // steering wheel
      // the AC box (blower + evaporator housing) inside the dashboard: only visible in x-ray
      const ac = new THREE.Group(), ab = new Batch();
      ab.add(boxGeo(V(-0.22, -0.13, -0.42), V(0.22, 0.13, 0.42)), lam("acBoxX", () => ({ color: "#ffcf3a" })));
      for (let k = -4; k <= 4; k++) ab.add(boxGeo(V(0.2, -0.1, k * 0.08 - 0.012), V(0.235, 0.1, k * 0.08 + 0.012)), lam("acBoxFin", () => ({ color: "#c9d6e3" })));
      ab.add(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 18).rotateX(Math.PI / 2).translate(-0.05, 0, 0.52), lam("acBoxFan", () => ({ color: "#ffb000" })));
      ab.build(ac);
      ac.position.set(...M_ACBOX); ac.visible = false;
      this.acBox = ac; this.body.add(ac);
    } else {
      b.add(extrude(bodyShape(), M_TRACK + 0.02 - 0.16, 0.08), M.paint);
      b.add(extrude(glassShape(), M_TRACK + 0.04, 0), M.glass);
    }
    // windscreen and rear glass: thin plates just proud of the body
    const plate = (a: [number, number], c: [number, number], w: number, mat: THREE.Material) => {
      const dx = c[0] - a[0], dy = c[1] - a[1], L = Math.hypot(dx, dy), nx = dy / L, ny = -dx / L; // outward
      const g = new THREE.BoxGeometry(L, 0.012, w);
      g.rotateZ(Math.atan2(dy, dx));
      g.translate((a[0] + c[0]) / 2 + nx * 0.085, (a[1] + c[1]) / 2 + ny * 0.085, 0);
      b.add(g, mat);
    };
    if (cabin) { plate([1.08, 0.92], [0.32, 1.58], M_TRACK - 0.3, glassT); plate([-1.62, 1.58], [-1.95, 1.1], M_TRACK - 0.42, M.glass); }
    else { plate([0.86, 1.01], [0.24, 1.38], M_TRACK - 0.36, glassT); plate([-1.28, 1.39], [-1.9, 1.04], M_TRACK - 0.42, M.glass); }
    // lamps, grille, bumpers, mirrors, plate
    for (const s of [-1, 1]) {
      b.add(boxGeo(V(1.86, 0.68, s * 0.52 - 0.17), V(2.02, 0.8, s * 0.52 + 0.17)), M.lamp);
      b.add(boxGeo(V(-2.06, 0.78, s * 0.58 - 0.14), V(-1.92, 0.92, s * 0.58 + 0.14)), M.tail);
      if (!cabin) b.add(boxGeo(V(0.62, 1.02, Math.min(s * 0.78, s * 0.94)), V(0.78, 1.12, Math.max(s * 0.78, s * 0.94))), M.paint); // mirrors
    }
    b.add(boxGeo(V(1.9, 0.42, -0.42), V(2.04, 0.6, 0.42)), M.black);
    b.add(boxGeo(V(2.0, 0.3, -0.72), V(2.06, 0.42, 0.72)), M.black);
    b.add(boxGeo(V(-2.07, 0.3, -0.72), V(-2.0, 0.44, 0.72)), M.black);
    b.add(boxGeo(V(2.04, 0.46, -0.2), V(2.07, 0.56, 0.2)), M.plate);
    b.add(boxGeo(V(-1.0, 0.34, -M_TRACK / 2 + 0.06), V(1.0, 0.42, M_TRACK / 2 - 0.06)), M.black); // sills
    b.build(this.body);
    // ---- wheels: tyre + 5-spoke rim spin; rotor spins; caliper + pads stay ----
    for (const [x, z] of [[M_FRONT_X, M_TRACK / 2], [M_FRONT_X, -M_TRACK / 2], [M_REAR_X, M_TRACK / 2], [M_REAR_X, -M_TRACK / 2]] as const) {
      const g = new THREE.Group(), tyre = new THREE.Group(), out = Math.sign(z);
      g.position.set(x, M_R, z);
      const tb = new Batch();
      tb.add(new THREE.CylinderGeometry(M_R, M_R, 0.22, 40, 1, true).rotateX(Math.PI / 2), M.tyre);
      tb.add(new THREE.TorusGeometry(M_R - 0.035, 0.04, 10, 40).scale(1, 1, 2.6), M.tyre);
      tb.add(new THREE.TorusGeometry(M_R - 0.085, 0.018, 8, 40).translate(0, 0, out * 0.08), M.rim);
      for (let i = 0; i < 5; i++) {
        const sp = new THREE.BoxGeometry(0.05, M_R - 0.13, 0.03);
        sp.translate(0, 0.04 + (M_R - 0.13) / 2, out * 0.085); sp.rotateZ((i / 5) * Math.PI * 2);
        tb.add(sp, M.rim);
      }
      tb.add(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16).rotateX(Math.PI / 2).translate(0, 0, out * 0.09), M.chrome);
      tb.build(tyre);
      const spin = new THREE.Group();
      spin.add(tyre);
      g.add(spin);
      // rotor (spins with the wheel, behind the rim)
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(ROTOR_R, ROTOR_R, 0.028, 48).rotateX(Math.PI / 2), this.rotorMat);
      spin.add(rotor);
      this.rotors.push(rotor);
      // caliper bridge over the rotor rim + two pads (fixed to the hub, do not spin)
      if (x > 0) {
        const cal = new Batch(), cx = (ROTOR_R - 0.05) * Math.cos(CAL_A), cy = (ROTOR_R - 0.05) * Math.sin(CAL_A);
        const m4 = new THREE.Matrix4().compose(V(cx, cy, 0), new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), CAL_A - Math.PI / 2), V(1, 1, 1));
        cal.add(new THREE.BoxGeometry(0.17, 0.05, 0.11).translate(0, 0.075, 0), M.caliper, m4); // bridge over the rim
        cal.add(new THREE.BoxGeometry(0.17, 0.12, 0.025).translate(0, 0.02, -out * 0.068), M.caliper, m4); // inner piston body
        const calG = new THREE.Group(); cal.build(calG); g.add(calG);
        for (const s of [1, -1]) {
          const pg = new THREE.Group();
          const bp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.085, 0.008), M.backing);
          const pd = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.07, 1), M.pad);
          pd.name = "lining";
          bp.position.z = s * 0.006;
          pg.add(bp, pd);
          pg.position.set(cx, cy, 0); pg.rotation.z = CAL_A - Math.PI / 2;
          g.add(pg);
          this.pads.push({ m: pd, side: s * out });
          (pd.userData as { grp: THREE.Group; bp: THREE.Mesh }).grp = pg;
          (pd.userData as { grp: THREE.Group; bp: THREE.Mesh }).bp = bp;
        }
      }
      this.root.add(g);
      this.wheels.push({ g: spin, tyre });
    }
    this.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  }

  pose(s: ModernState) {
    this.root.position.set(s.x, 0, s.z);
    this.root.rotation.set(0, s.yaw, 0, "YXZ");
    this.body.rotation.z = -(s.dip ?? 0);
    this.body.position.y = -0.4 * (s.dip ?? 0);
    const a = -s.dist / M_R;
    this.wheels.forEach((w, i) => { w.g.rotation.z = a; w.tyre.visible = !(s.xray && i === 0); });
    // pads: lining thickness from wear, gap from clamp; the lining faces the rotor (z = 0)
    const thick = 0.034 * (1 - 0.72 * (s.wear ?? 0)), gap = 0.035 * (1 - (s.clamp ?? 0));
    for (const p of this.pads) {
      const u = p.m.userData as { grp: THREE.Group; bp: THREE.Mesh };
      const zFace = p.side * (0.016 + gap); // rotor half-thickness 0.014
      p.m.scale.z = thick; p.m.position.z = zFace + p.side * thick / 2;
      u.bp.position.z = zFace + p.side * (thick + 0.005);
    }
    if (this.paint) {
      const x = s.xrayBody ?? 0;
      this.paint.opacity = 1 - 0.8 * x; this.paint.depthWrite = x < 0.05;
      if (this.acBox) this.acBox.visible = x > 0.05;
    }
    const heat = Math.max(0, (s.clamp ?? 0) - 0.4) / 0.6;
    this.rotorMat.emissive.setRGB(0.35 * heat, 0.09 * heat, 0.0);
  }
}

/** world position of a modern-car local point (pure) */
export const modernPoint = (s: ModernState, p: V3): V3 => {
  const c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
  return [s.x + p[0] * c + p[2] * sn, p[1], s.z - p[0] * sn + p[2] * c];
};

// ---------------- the city street + workshop ----------------
const facadeTex = (key: string, wall: string, glass: string, cols: number, rows: number) => ctex(key, 512, 512, (g) => {
  g.fillStyle = wall; g.fillRect(0, 0, 512, 512);
  const cw = 512 / cols, rh = 512 / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = i * cw + cw * 0.16, y = j * rh + rh * 0.2, w = cw * 0.68, h = rh * 0.6;
    g.fillStyle = glass; g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.moveTo(x + w * 0.15, y + h); g.lineTo(x + w * 0.55, y); g.lineTo(x + w * 0.75, y); g.lineTo(x + w * 0.35, y + h); g.fill();
    g.strokeStyle = "rgba(30,30,40,0.8)"; g.lineWidth = 4; g.strokeRect(x, y, w, h);
  }
});
const asphaltTex = () => ctex("modAsphalt", 1024, 1024, (g, r) => {
  g.fillStyle = "#5b5f69"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 5000; i++) { g.fillStyle = r() < 0.5 ? "rgba(80,84,94,0.6)" : "rgba(112,116,126,0.5)"; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 3, 2 + r() * 3); }
});
const paveTex = () => ctex("modPave", 512, 512, (g) => {
  g.fillStyle = "#d9d4ca"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "rgba(120,112,100,0.6)"; g.lineWidth = 4;
  for (let k = 0; k <= 512; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
});
/** Doktermobil sign board: brand red, white word mark */
/** the Doktermobil logo texture, loaded once per page; mount the 3D world only after LOGO_READY resolves */
export const LOGO_TEX = new THREE.Texture();
export const LOGO_READY: Promise<void> = typeof document === "undefined" ? Promise.resolve() : new Promise<void>((res, rej) => {
  if (!BR.logo) { res(); return; } // word-mark-only brands
  const img = new Image();
  img.onload = () => { LOGO_TEX.image = img; LOGO_TEX.colorSpace = THREE.SRGBColorSpace; LOGO_TEX.anisotropy = 8; LOGO_TEX.needsUpdate = true; res(); };
  img.onerror = () => rej(new Error(`${BR.logo} failed to load`));
  img.src = staticFile(BR.logo);
}).then(() => Promise.all([`800 60px ${BR.canvasFont}`, `700 34px ${BR.canvasFont}`, `600 34px ${BR.canvasFont}`].map((f) => document.fonts.load(f).catch(() => [])))).then(() => undefined);
/** white sign board with a red frame (the logo goes on top as its own plane) */
const signBoard = () => ctex("dmBoard", 840, 480, (g) => {
  g.fillStyle = BR.signFrame; g.beginPath(); g.roundRect(0, 0, 840, 480, 40); g.fill();
  g.fillStyle = BR.signFill; g.beginPath(); g.roundRect(18, 18, 804, 444, 28); g.fill();
});
export const shopSign = () => ctex("dmSign2", 800, 512, (g) => {
  g.fillStyle = "#E31E24"; g.beginPath(); g.roundRect(0, 0, 800, 512, 36); g.fill();
  g.strokeStyle = "#ffffff"; g.lineWidth = 10; g.beginPath(); g.roundRect(22, 22, 756, 468, 24); g.stroke();
  g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "900 176px Poppins, 'Arial Black', Arial, sans-serif";
  g.fillText("DOKTER", 400, 150);
  g.fillText("MOBIL", 400, 316);
  g.font = "800 46px Poppins, Arial, sans-serif";
  g.fillText("PASTI BERES", 400, 438);
});

export type ShopSpots = { bayDoor: V3; sign: V3 };
/** street along x at z = 0 (lanes z -3.5..3.5), shop on the north side; returns key spots */
/** front: "bay" = workshop with an open service bay, "glass" = an office/agency glass storefront with a door */
export const buildModern = (root: THREE.Object3D, cx: number, front: "bay" | "glass" = "bay"): ShopSpots => {
  const b = new Batch();
  const M = {
    asphalt: lam("modAsphaltM", () => ({ map: rep(asphaltTex(), 76, 2) })),
    pave: lam("modPaveM", () => ({ map: rep(paveTex(), 100, 2) })),
    curb: lam("modCurb", () => ({ color: "#c9c5bd" })), line: lam("modLine", () => ({ color: "#f4f2ea" })),
    pole: lam("modPole", () => ({ color: "#4a4f5a" })), dark: lam("modBayDark", () => ({ color: "#2b2d35" })),
    shopWall: lam("modShopWall", () => ({ color: BR.wall })), grey: lam("modGrey", () => ({ color: "#9aa0aa" })),
    red: lam("modFascia", () => ({ color: BR.fascia })),
  };
  const L = 420; // long enough that no lens ever sees the end of the street
  b.add(boxGeo(V(cx - L / 2, 0, -3.6), V(cx + L / 2, 0.03, 3.6)), M.asphalt);
  for (const s of [-1, 1]) {
    b.add(boxGeo(V(cx - L / 2, 0, s > 0 ? 3.6 : -7.6), V(cx + L / 2, 0.16, s > 0 ? 7.6 : -3.6)), M.pave);
    b.add(boxGeo(V(cx - L / 2, 0, s * 3.6 - 0.12), V(cx + L / 2, 0.18, s * 3.6 + 0.12)), M.curb);
  }
  for (let x = cx - L / 2; x < cx + L / 2; x += 6) b.add(boxGeo(V(x, 0.03, -0.07), V(x + 3, 0.04, 0.07)), M.line);
  // zebra crossing ahead of the stop line
  for (let k = -3; k <= 3; k++) b.add(boxGeo(V(cx + 8, 0.03, k - 0.3), V(cx + 11, 0.04, k + 0.3)), M.line);
  b.add(boxGeo(V(cx + 6.8, 0.03, -3.4), V(cx + 7.1, 0.04, 3.4)), M.line);
  // buildings both sides (flat roofs, window grids)
  const pal = [["#e9d8b8", "#5d86b8"], ["#c9dbe8", "#355f8c"], ["#f1c6a7", "#4b6f94"], ["#d6e3cf", "#3e6a7a"], ["#e6e1f0", "#56709c"]];
  const block = (x: number, z: number, w: number, d: number, h: number, i: number) => {
    const [wall, glass] = pal[i % pal.length];
    const m = lam(`modFac${i % pal.length}`, () => ({ map: facadeTex(`modFac${i % pal.length}`, wall, glass, 4, 4) }));
    b.add(boxGeo(V(x - w / 2, 0, z - d / 2), V(x + w / 2, h, z + d / 2), 3.2), m);
    b.add(boxGeo(V(x - w / 2 - 0.15, h, z - d / 2 - 0.15), V(x + w / 2 + 0.15, h + 0.35, z + d / 2 + 0.15)), M.grey);
  };
  let i = 0;
  for (let x = cx - 200; x <= cx + 200; x += 11, i++) {
    if (!(x > cx - 8 && x < cx + 24)) block(x, -13, 10, 10, 9 + (i % 3) * 3.5, i); // gap for the workshop
    block(x + 4, 13, 10, 10, 8 + ((i + 1) % 3) * 4, i + 2);
  }
  // street lamps + trees on the pavements
  for (let x = cx - 204; x <= cx + 196; x += 16) for (const s of [-1, 1]) { // same rhythm as before near the centre (…, -28, -12, 4, …)
    const z = s * 4.4;
    b.add(new THREE.CylinderGeometry(0.07, 0.09, 5.2, 10).translate(x, 2.6, z), M.pole);
    b.add(boxGeo(V(x - 0.05, 5.1, z - s * 0.9 - 0.05), V(x + 0.05, 5.18, z + 0.05)), M.pole);
    b.add(boxGeo(V(x - 0.18, 4.95, z - s * 0.95 - 0.12), V(x + 0.18, 5.1, z - s * 0.95 + 0.12)), M.line);
    addVeg(b, "round", x + 8, 0.16, s * 5.6, 5.5, x * 1.7 + s, 0);
  }
  // ---- Doktermobil workshop: white box, open service bay, red fascia with the sign ----
  const sx = cx + 8, sz = -13;
  b.add(boxGeo(V(sx - 6, 0, sz - 5), V(sx + 6, 7.6, sz + 5)), M.shopWall);
  if (front === "bay") {
    b.add(boxGeo(V(sx - 3.0, 0.02, sz + 4.6), V(sx + 3.0, 3.7, sz + 5.02)), M.dark); // service bay opening (dark inside)
    for (let k = 0; k < 6; k++) b.add(boxGeo(V(sx - 3.0, 3.3 - k * 0.12, sz + 5.0), V(sx + 3.0, 3.36 - k * 0.12, sz + 5.06)), M.grey); // rolled-up shutter slats
    b.add(boxGeo(V(sx + 3.6, 0.6, sz + 4.6), V(sx + 5.4, 2.6, sz + 5.04)), lam("modShopGlass", () => ({ color: "#3d5f84" }))); // office window
  } else {
    // agency front: floor-to-ceiling glass with dark mullions, a door in the middle, desks + screens glowing inside
    const glass = lam("modOfficeGlass", () => ({ color: "#8fb6dc" })), mull = lam("modMullion", () => ({ color: BR.fascia }));
    b.add(boxGeo(V(sx - 5.2, 0.17, sz + 4.6), V(sx + 5.2, 3.7, sz + 5.0)), glass);
    for (let x = -5.2; x <= 5.21; x += 1.3) b.add(boxGeo(V(sx + x - 0.05, 0.17, sz + 4.98), V(sx + x + 0.05, 3.7, sz + 5.08)), mull);
    b.add(boxGeo(V(sx - 5.2, 3.6, sz + 4.98), V(sx + 5.2, 3.75, sz + 5.08)), mull);
    b.add(boxGeo(V(sx - 0.75, 0.17, sz + 5.0), V(sx + 0.75, 2.6, sz + 5.1)), lam("modDoorGlass", () => ({ color: "#5d86b0" })));
    b.add(boxGeo(V(sx + 0.45, 1.1, sz + 5.1), V(sx + 0.5, 1.6, sz + 5.16)), M.line);
    for (const x of [-3.6, -2.0, 2.0, 3.6]) { // desks with glowing screens behind the glass
      b.add(boxGeo(V(sx + x - 0.5, 0.75, sz + 3.6), V(sx + x + 0.5, 0.82, sz + 4.3)), M.grey);
      b.add(boxGeo(V(sx + x - 0.3, 0.85, sz + 3.7), V(sx + x + 0.3, 1.3, sz + 3.76)), lam("modScreen", () => ({ color: "#ffd75a" })));
    }
  }
  b.add(boxGeo(V(sx - 6.2, 3.9, sz + 5.0), V(sx + 6.2, 4.5, sz + 5.4)), M.red); // fascia band
  b.add(boxGeo(V(sx - 6.2, 0, sz + 5.0), V(sx - 5.7, 3.9, sz + 5.4)), M.red);
  b.add(boxGeo(V(sx + 5.7, 0, sz + 5.0), V(sx + 6.2, 3.9, sz + 5.4)), M.red);
  // forecourt: paved apron from the pavement to the bay
  b.add(boxGeo(V(sx - 7, 0, sz + 5), V(sx + 7, 0.17, -7.6)), M.pave);
  b.build(root);
  // a painted skyline ring around the whole set: wherever a lens points past the blocks there is city, not void
  const ringTex = ctex("skylineRing", 2048, 512, (g, r) => {
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(160,190,225,0)"); gr.addColorStop(0.35, "rgba(160,190,225,0)"); gr.addColorStop(1, "#9fb8d8");
    g.fillStyle = gr; g.fillRect(0, 0, 2048, 512);
    for (let x = 0; x < 2048; x += 30 + r() * 40) {
      const w = 40 + r() * 80, h = 140 + r() * 300;
      g.fillStyle = ["#a9bedb", "#98b0d2", "#b6c8e2"][Math.floor(r() * 3)]; g.fillRect(x, 512 - h, w, h);
      g.fillStyle = "rgba(255,255,255,0.35)"; for (let y = 512 - h + 14; y < 500; y += 24) for (let xx = x + 6; xx < x + w - 8; xx += 14) g.fillRect(xx, y, 6, 10);
    }
  });
  ringTex.repeat.set(4, 1);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(330, 330, 120, 64, 1, true), new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.BackSide, transparent: true, fog: false, depthWrite: false }));
  ring.position.set(cx, 58, 0); ring.layers.set(NOINK); ring.renderOrder = -0.8;
  root.add(ring);
  // sign: white board + the real logo (public/brand/logo.png, 1139 x 540), big and centred above the bay
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.63), new THREE.MeshBasicMaterial({ map: signBoard(), color: 0xf2f2f2, toneMapped: false, transparent: true }));
  board.position.set(sx, 6.0, sz + 5.1); board.layers.set(NOINK);
  const logoMat = new THREE.MeshBasicMaterial({ map: LOGO_TEX, color: 0xffffff, toneMapped: false, transparent: true, depthWrite: false });
  // icon-only logos get the word mark painted beside them (signText); full logos fill the board
  const lw = !BR.logo ? 0.01 : BR.signText ? 1.9 : 4.0, logo = new THREE.Mesh(new THREE.PlaneGeometry(lw, lw / BR.logoAspect), logoMat);
  logo.visible = !!BR.logo;
  if (BR.signText) {
    const word = new THREE.Mesh(new THREE.PlaneGeometry(BR.logo ? 2.3 : 3.9, BR.logo ? 0.62 : 1.05), new THREE.MeshBasicMaterial({ map: ctex("signWord", 920, 248, (g) => {
      g.fillStyle = BR.signInk; g.textAlign = BR.logo ? "left" : "center"; g.textBaseline = "middle"; g.font = `900 ${BR.logo ? 190 : 150}px ${BR.canvasFont}, 'Arial Black', Arial, sans-serif`; g.fillText(BR.signText, BR.logo ? 0 : 460, 128);
    }), toneMapped: false, transparent: true, depthWrite: false }));
    word.position.set(BR.logo ? sx + 0.95 : sx, 6.0, sz + 5.12); word.layers.set(NOINK); word.renderOrder = 2;
    root.add(word);
  }
  logo.position.set(BR.signText ? sx - 1.2 : sx, 6.0, sz + 5.12); logo.layers.set(NOINK); logo.renderOrder = 2;
  root.add(board, logo);
  return { bayDoor: [sx, 0.17, sz + 5.0], sign: [sx, 6.0, sz + 5.1] };
};
