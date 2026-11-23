// Interior sets for the toon format: a working office, a boss's VIP room and a "sultan" living room. Each is an open
// box (the +z wall is left out for the camera) with a window onto a painted skyline, furniture and screens.
// buildRoom(root, at, kind) returns the spots the stage needs (where people stand or sit, screens, the window).
import * as THREE from "three";
import { Batch, V, boxGeo, lam } from "../build";
import { ctex, rng, rep, planksHD } from "../paint";
import { twoTone } from "../shade";
import { NOINK } from "../ink";
import type { V3 } from "./rig";

export type RoomKind = "office" | "vip" | "sultan" | "fengshui" | "server" | "desk";
export type RoomSpots = { stand: V3; stand2: V3; sit: V3; sit2: V3; screen: V3; window: V3; look: V3 };

const skyline = (dusk: boolean) => ctex(`skyline${dusk ? "D" : "N"}`, 1024, 512, (g) => {
  const r = rng(dusk ? 7 : 3);
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, dusk ? "#2d3a78" : "#7ec0ff"); gr.addColorStop(1, dusk ? "#f39a6b" : "#d7ecff");
  g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 26; i++) {
    const w = 40 + r() * 70, h = 120 + r() * 300, x = i * 40 - 20 + r() * 20;
    g.fillStyle = dusk ? ["#1d2346", "#262d58", "#151a36"][i % 3] : ["#8aa5c7", "#9bb3d1", "#7f98bb"][i % 3];
    g.fillRect(x, 512 - h, w, h);
    g.fillStyle = dusk ? "rgba(255,214,120,0.8)" : "rgba(255,255,255,0.55)";
    for (let y = 512 - h + 12; y < 500; y += 22) for (let xx = x + 6; xx < x + w - 8; xx += 14) if (r() < (dusk ? 0.45 : 0.6)) g.fillRect(xx, y, 7, 10);
  }
});
/** screens: a rising chart, a falling chart, a search page with nothing found */
export const screenTex = (kind: "up" | "down" | "search" | "blank" | "code" | "browser") => ctex(`screen_${kind}`, 512, 320, (g) => {
  g.fillStyle = kind === "search" ? "#f5f7fb" : "#101828"; g.fillRect(0, 0, 512, 320);
  if (kind === "up" || kind === "down") {
    g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 2;
    for (let y = 40; y < 320; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    const pts = kind === "up" ? [260, 250, 230, 240, 180, 190, 140, 120, 90, 60] : [70, 90, 80, 130, 150, 140, 200, 230, 220, 270];
    g.strokeStyle = kind === "up" ? "#3ddc84" : "#ff5a5f"; g.lineWidth = 9; g.lineJoin = "round";
    g.beginPath(); pts.forEach((y, i) => (i ? g.lineTo(20 + i * 52, y) : g.moveTo(20, y))); g.stroke();
  } else if (kind === "code") {
    const cols = ["#7dd3fc", "#fca5a5", "#fde68a", "#86efac", "#c4b5fd"];
    for (let i = 0; i < 12; i++) { const ind = (i % 4) * 26; g.fillStyle = cols[i % 5]; g.fillRect(24 + ind, 22 + i * 24, 60 + ((i * 37) % 200), 10); g.fillStyle = "#94a3b8"; g.fillRect(100 + ind + ((i * 37) % 200), 22 + i * 24, 40, 10); }
  } else if (kind === "browser") {
    g.fillStyle = "#e5e7eb"; g.fillRect(0, 0, 512, 46); g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(60, 10, 392, 26, 13); g.fill();
    for (const [x, c] of [[18, "#ef4444"], [34, "#f59e0b"], [50, "#22c55e"]] as const) { g.fillStyle = c; g.beginPath(); g.arc(x - 6, 23, 5, 0, 7); g.fill(); }
    g.fillStyle = "#f8fafc"; g.fillRect(0, 46, 512, 274); g.fillStyle = "#cbd5e1"; for (let i = 0; i < 5; i++) g.fillRect(40, 80 + i * 44, 300 - i * 30, 14);
  } else if (kind === "search") {
    g.fillStyle = "#e3e8f1"; g.beginPath(); g.roundRect(40, 30, 432, 44, 22); g.fill();
    for (let i = 0; i < 4; i++) { g.fillStyle = "#c9d3e3"; g.fillRect(50, 110 + i * 50, 300, 14); g.fillStyle = "#e1e6ee"; g.fillRect(50, 130 + i * 50, 380, 10); }
  }
});
const marbleTex = () => ctex("marble", 1024, 1024, (g) => {
  const r = rng(51);
  g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = "rgba(170,160,150,0.45)"; g.lineWidth = 3;
  for (let i = 0; i < 14; i++) { g.beginPath(); let x = r() * 1024, y = 0; g.moveTo(x, y); while (y < 1024) { x += (r() - 0.5) * 80; y += 40 + r() * 40; g.lineTo(x, y); } g.stroke(); }
  g.strokeStyle = "rgba(200,170,90,0.6)"; g.lineWidth = 6; for (let k = 0; k <= 1024; k += 256) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 1024); g.moveTo(0, k); g.lineTo(1024, k); g.stroke(); }
});
const panelTex = (base: string, line: string) => ctex(`panel${base}`, 512, 512, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = line; g.lineWidth = 6; for (let x = 0; x <= 512; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  g.strokeStyle = "rgba(255,255,255,0.08)"; g.lineWidth = 2; for (let x = 10; x < 512; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
});
const paintingTex = (seed: number) => ctex(`painting${seed}`, 512, 384, (g) => {
  const r = rng(seed);
  g.fillStyle = "#e9d9b6"; g.fillRect(0, 0, 512, 384);
  for (let i = 0; i < 9; i++) { g.fillStyle = ["#2f6f8f", "#c2563a", "#e2b64a", "#4d7a4a", "#2b3550"][i % 5]; g.beginPath(); g.ellipse(r() * 512, 120 + r() * 220, 60 + r() * 120, 30 + r() * 70, r() * 3, 0, 7); g.fill(); }
});
const whiteboardTex = () => ctex("whiteboard", 512, 320, (g) => {
  g.fillStyle = "#fbfcfe"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "#2b6cb0"; g.lineWidth = 7; g.beginPath(); g.moveTo(40, 260); g.lineTo(150, 200); g.lineTo(250, 220); g.lineTo(360, 120); g.lineTo(470, 60); g.stroke();
  g.fillStyle = "#c53030"; g.beginPath(); g.moveTo(470, 60); g.lineTo(440, 62); g.lineTo(458, 86); g.fill();
  g.fillStyle = "#4a5568"; for (let i = 0; i < 3; i++) g.fillRect(40, 40 + i * 26, 160 - i * 30, 10);
});

/** feng shui studio textures: a bamboo garden seen through the moon window, a luo pan face, ink calligraphy, lattice */
const bambooTex = () => ctex("bambooView", 512, 512, (g) => {
  const r = rng(88);
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#e8f0d8"); gr.addColorStop(1, "#b9d39b"); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) {
    const x = 20 + i * 36 + r() * 12, w = 10 + r() * 8; g.fillStyle = ["#5f9a3e", "#4d8733", "#76ad4e"][i % 3]; g.fillRect(x, 0, w, 512);
    g.fillStyle = "rgba(30,60,20,0.5)"; for (let y = 40 + r() * 40; y < 512; y += 70 + r() * 30) g.fillRect(x - 1, y, w + 2, 4);
    g.fillStyle = "#6fae45"; for (let k = 0; k < 4; k++) { const y = r() * 512; g.beginPath(); g.ellipse(x + w + 14, y, 22, 6, -0.5, 0, 7); g.fill(); }
  }
});
const luopanTex = () => ctex("luopan", 512, 512, (g) => {
  g.fillStyle = "#b8862f"; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
  const rings = ["#e9c46a", "#c9a45c", "#f1dda8", "#9c7a35", "#e9c46a", "#7e0f15"];
  rings.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(256, 256, 230 - i * 34, 0, 7); g.fill(); g.strokeStyle = "#3a2a10"; g.lineWidth = 3; g.stroke(); });
  g.strokeStyle = "#3a2a10"; g.lineWidth = 2;
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; g.beginPath(); g.moveTo(256 + 60 * Math.cos(a), 256 + 60 * Math.sin(a)); g.lineTo(256 + 230 * Math.cos(a), 256 + 230 * Math.sin(a)); g.stroke(); }
  g.fillStyle = "#f8f4ec"; g.beginPath(); g.arc(256, 256, 40, 0, 7); g.fill(); g.strokeStyle = "#a8161d"; g.lineWidth = 6; g.beginPath(); g.moveTo(256, 222); g.lineTo(256, 290); g.stroke();
});
const scrollTex = (seed: number) => ctex(`scroll${seed}`, 160, 480, (g) => {
  const r = rng(seed);
  g.fillStyle = "#f3ead6"; g.fillRect(0, 0, 160, 480); g.fillStyle = "#7e0f15"; g.fillRect(0, 0, 160, 18); g.fillRect(0, 462, 160, 18);
  g.strokeStyle = "#12100e"; g.lineCap = "round";
  for (let k = 0; k < 4; k++) { const y = 70 + k * 95; g.lineWidth = 9 + r() * 5; g.beginPath(); g.moveTo(50 + r() * 20, y); g.quadraticCurveTo(90, y + 20 + r() * 20, 110 - r() * 20, y + 55); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(45, y + 30); g.lineTo(115, y + 25 + r() * 15); g.stroke(); }
  g.fillStyle = "#a8161d"; g.fillRect(100, 420, 34, 34);
});
const latticeTex = () => ctex("lattice", 512, 512, (g) => {
  g.fillStyle = "#f3ead6"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#3b2216"; g.lineWidth = 12; for (let k = 0; k <= 512; k += 128) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
  g.lineWidth = 5; for (let k = 64; k < 512; k += 128) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 512); g.moveTo(0, k); g.lineTo(512, k); g.stroke(); }
});

const phong = (c: string, sh = 60) => twoTone(new THREE.MeshPhongMaterial({ color: c, specular: "#ffffff", shininess: sh }), 0.15);

/** where people stand / sit, the screen, the window and a good look-at point, per room (room-local) */
const SPOTS: Record<RoomKind, RoomSpots> = {
  office: { stand: [-0.6, 0, -0.5], stand2: [0.9, 0, -0.2], sit: [-0.8, 0.45, -0.6], sit2: [0.8, 0.45, -0.6], screen: [-0.8, 1.15, -1.75], window: [1.6, 1.9, -4], look: [0, 1.2, -1.5] },
  vip: { stand: [-0.5, 0, -0.6], stand2: [0.6, 0, -0.4], sit: [0, 0.45, -2.9], sit2: [-2.8, 0.45, 1.2], screen: [-3.4, 1.9, -4 + 0.05], window: [1.6, 1.9, -4], look: [0, 1.3, -1.8] },
  server: { stand: [-0.5, 0, -1.1], stand2: [0.6, 0, -0.9], sit: [-0.6, 0.45, 0.6], sit2: [0.7, 0.45, 0.8], screen: [0, 1.4, -2.6], window: [0, 2.0, -4], look: [0, 1.3, -1.0] },
  desk: { stand: [-0.5, 0, -0.3], stand2: [0.8, 0, -0.1], sit: [-0.2, 0.45, -0.9], sit2: [0.9, 0.45, -0.9], screen: [-0.2, 1.25, -1.95], window: [1.6, 1.9, -4], look: [0, 1.15, -1.5] },
  fengshui: { stand: [-0.55, 0, -0.4], stand2: [0.6, 0, -0.2], sit: [-0.9, 0.45, -1.2], sit2: [0.9, 0.45, -1.2], screen: [0, 0.98, -1.4], window: [0, 2.0, -4], look: [0, 1.2, -1.2] },
  sultan: { stand: [-0.8, 0, 1.2], stand2: [1.0, 0, 1.4], sit: [-0.8, 0.45, 0.45], sit2: [0.9, 0.45, 0.45], screen: [0, 2.6, -5], window: [0, 2.6, -5], look: [0, 1.4, 0] },
};
/** world positions of a room's spots (pure: cameras and staging use it without building the room) */
export const roomSpots = (kind: RoomKind, at: V3): RoomSpots => {
  const w = (p: V3): V3 => [p[0] + at[0], p[1] + at[1], p[2] + at[2]], s = SPOTS[kind];
  return { stand: w(s.stand), stand2: w(s.stand2), sit: w(s.sit), sit2: w(s.sit2), screen: w(s.screen), window: w(s.window), look: w(s.look) };
};

export const buildRoom = (root: THREE.Object3D, at: V3, kind: RoomKind): RoomSpots => {
  const g = new THREE.Group(); g.position.set(...at); root.add(g);
  const b = new Batch();
  const W = kind === "sultan" ? 14 : 10, D = kind === "sultan" ? 10 : 8, H = kind === "sultan" ? 5.2 : 3.6;
  const dusk = kind !== "office";
  // ---- shell: floor, back wall with a big window, side walls, skirting ----
  const floor = kind === "server" ? lam("rmRaised", () => ({ map: rep(ctex("raisedFloor", 256, 256, (gg) => { gg.fillStyle = "#c7ccd6"; gg.fillRect(0, 0, 256, 256); gg.strokeStyle = "#8f96a3"; gg.lineWidth = 6; gg.strokeRect(0, 0, 256, 256); gg.fillStyle = "#9aa1ae"; for (let y = 30; y < 256; y += 40) for (let x = 30; x < 256; x += 40) gg.fillRect(x, y, 8, 8); }), 10, 8) }))
    : kind === "desk" ? lam("rmWood", () => ({ map: rep(planksHD(), 3, 3) })) : kind === "fengshui" ? lam("rmDarkPlank", () => ({ map: rep(planksHD(), 3, 3), color: "#7a5236" })) : kind === "sultan" ? lam("rmMarble", () => ({ map: rep(marbleTex(), 3, 2) }))
    : kind === "vip" ? lam("rmCarpet", () => ({ color: "#3a1f2b" })) : lam("rmWood", () => ({ map: rep(planksHD(), 3, 3) }));
  const wall = kind === "server" ? lam("rmServerWall", () => ({ color: "#2b3445" })) : kind === "desk" ? lam("rmDeskWall", () => ({ color: "#dfe7f1" })) : kind === "fengshui" ? lam("rmLattice", () => ({ map: rep(latticeTex(), 4, 1.5) })) : kind === "sultan" ? lam("rmCream", () => ({ color: "#efe3c8" }))
    : kind === "vip" ? lam("rmPanel", () => ({ map: rep(panelTex("#4a2e1f", "#2e1a10"), 3, 1) })) : lam("rmWhite", () => ({ color: "#eef1f5" }));
  const trim = kind === "office" ? lam("rmTrimW", () => ({ color: "#c9ced8" })) : kind === "fengshui" ? lam("rmRedLacquer", () => ({ color: "#a8161d" })) : phong("#d4a73c", 80);
  b.add(boxGeo(V(-W / 2, -0.1, -D / 2), V(W / 2, 0, D / 2)), floor);
  b.add(boxGeo(V(-W / 2, 0, -D / 2 - 0.2), V(W / 2, H, -D / 2)), wall);
  for (const s of [-1, 1]) b.add(boxGeo(V(s < 0 ? -W / 2 - 0.2 : W / 2, 0, -D / 2), V(s < 0 ? -W / 2 : W / 2 + 0.2, H, D / 2)), wall);
  b.add(boxGeo(V(-W / 2, 0, -D / 2), V(W / 2, 0.15, -D / 2 + 0.05)), trim);
  b.build(g);
  // window onto the city (unlit painting behind a frame)
  const winW = kind === "sultan" ? 6 : 4.4, winH = kind === "sultan" ? 3.2 : 2.2, winY = kind === "sultan" ? 2.6 : 1.9;
  const moon = kind === "fengshui", noWin = kind === "server";
  const win = new THREE.Mesh(moon ? new THREE.CircleGeometry(1.15, 48) : new THREE.PlaneGeometry(winW, winH), new THREE.MeshBasicMaterial({ map: moon ? bambooTex() : skyline(dusk), toneMapped: false }));
  win.position.set(moon || kind === "sultan" ? 0 : 1.6, moon ? 2.0 : winY, -D / 2 + 0.01); win.layers.set(NOINK); win.visible = !noWin; g.add(win);
  const fb = new Batch(), frame = kind === "office" ? lam("rmFrame", () => ({ color: "#39414f" })) : trim;
  const wx = win.position.x;
  if (noWin) { /* the server room has no window */ } else if (moon) fb.add(new THREE.TorusGeometry(1.2, 0.1, 10, 48).translate(0, 2.0, -D / 2 + 0.06), lam("rmDarkWood", () => ({ color: "#3b2216" })));
  else fb.add(boxGeo(V(wx - winW / 2 - 0.08, winY - winH / 2 - 0.08, -D / 2), V(wx + winW / 2 + 0.08, winY - winH / 2, -D / 2 + 0.08)), frame);
  if (!moon && !noWin) fb.add(boxGeo(V(wx - winW / 2 - 0.08, winY + winH / 2, -D / 2), V(wx + winW / 2 + 0.08, winY + winH / 2 + 0.08, -D / 2 + 0.08)), frame);
  if (!moon && !noWin) for (const x of [-winW / 2, 0, winW / 2]) fb.add(boxGeo(V(wx + x - 0.04, winY - winH / 2, -D / 2), V(wx + x + 0.04, winY + winH / 2, -D / 2 + 0.08)), frame);
  // ---- furniture per room ----
  const wood = kind === "office" ? lam("rmDesk", () => ({ color: "#c49a6c" })) : lam("rmDarkWood", () => ({ color: "#3b2216" }));
  const leather = kind === "sultan" ? lam("rmSofaCream", () => ({ color: "#f2e6cc" })) : lam("rmLeather", () => ({ color: kind === "vip" ? "#2a1a14" : "#3b4252" }));
  const plant = (x: number, z: number, h = 1.2) => {
    fb.add(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 14).translate(x, 0.2, z), lam("rmPot", () => ({ color: kind === "office" ? "#e7e2da" : "#d4a73c" })));
    for (let i = 0; i < 5; i++) fb.add(new THREE.SphereGeometry(0.28, 12, 8).scale(1, 1.3, 1).translate(x + Math.sin(i * 2.4) * 0.18, 0.5 + h * (0.4 + 0.12 * i), z + Math.cos(i * 2.4) * 0.18), lam("rmLeaf", () => ({ color: "#4f9a4a" })));
  };
  const sofa = (x: number, z: number, w: number, yaw = 0) => {
    const sb = new Batch();
    sb.add(boxGeo(V(-w / 2, 0, -0.45), V(w / 2, 0.45, 0.45)), leather);
    sb.add(boxGeo(V(-w / 2, 0.45, -0.45), V(w / 2, 1.0, -0.22)), leather);
    for (const s of [-1, 1]) sb.add(boxGeo(V(s * w / 2 - (s > 0 ? 0.2 : 0), 0, -0.45), V(s * w / 2 + (s < 0 ? 0.2 : 0), 0.7, 0.45)), leather);
    if (kind !== "office") sb.add(boxGeo(V(-w / 2, 0, 0.44), V(w / 2, 0.06, 0.47)), trim);
    const sg = new THREE.Group(); sb.build(sg); sg.position.set(x, 0, z); sg.rotation.y = yaw; g.add(sg);
  };
  if (kind === "office") {
    fb.add(boxGeo(V(-2.2, 0.74, -2.2), V(0.6, 0.8, -1.2)), wood); // desk
    for (const x of [-2.1, 0.5]) for (const z of [-2.15, -1.25]) fb.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.74, z + 0.04)), lam("rmLeg", () => ({ color: "#39414f" })));
    fb.add(boxGeo(V(-3.8, 0, -3.95), V(-2.6, 2.4, -3.55)), wood); // bookshelf
    for (let k = 0; k < 4; k++) for (let i = 0; i < 6; i++) fb.add(boxGeo(V(-3.75 + i * 0.18, 0.15 + k * 0.58, -3.9), V(-3.62 + i * 0.18, 0.55 + k * 0.58 - (i % 3) * 0.05, -3.6)), lam(`rmBook${i % 3}`, () => ({ color: ["#c53030", "#2b6cb0", "#d69e2e"][i % 3] })));
    plant(3.9, -3.3); plant(-4.3, 2.4, 0.9);
    const wb = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.25), new THREE.MeshBasicMaterial({ map: whiteboardTex(), toneMapped: false }));
    wb.position.set(-1.0, 2.1, -D / 2 + 0.03); wb.layers.set(NOINK); g.add(wb);

  } else if (kind === "server") {
    // two rows of racks along the sides and one at the back, LED panels, cable trays overhead, a big wall screen
    const rack = lam("rmRack", () => ({ color: "#1c2230" })), unit = lam("rmUnit", () => ({ color: "#3a4356" }));
    const led = [lam("rmLedG", () => ({ color: "#3ddc84" })), lam("rmLedB", () => ({ color: "#4d8fd6" })), lam("rmLedY", () => ({ color: "#ffd45c" }))];
    const rackAt = (x: number, z: number, yaw: number) => {
      const rb = new Batch();
      rb.add(boxGeo(V(-0.32, 0, -0.5), V(0.32, 2.2, 0.5)), rack);
      for (let k = 0; k < 9; k++) { rb.add(boxGeo(V(0.3, 0.15 + k * 0.22, -0.44), V(0.34, 0.31 + k * 0.22, 0.44)), unit); for (let j = 0; j < 4; j++) rb.add(boxGeo(V(0.34, 0.2 + k * 0.22, -0.36 + j * 0.06), V(0.355, 0.24 + k * 0.22, -0.33 + j * 0.06)), led[(k + j) % 3]); }
      const rg = new THREE.Group(); rb.build(rg); rg.position.set(x, 0, z); rg.rotation.y = yaw; g.add(rg);
    };
    for (let i = 0; i < 4; i++) { rackAt(-3.6, -2.6 + i * 1.05, 0); rackAt(3.6, -2.6 + i * 1.05, Math.PI); }
    for (let i = 0; i < 4; i++) rackAt(-1.6 + i * 1.05, -3.5, Math.PI / 2);
    for (const x of [-2.6, 2.6]) fb.add(boxGeo(V(x - 0.3, 2.9, -3.8), V(x + 0.3, 2.98, 3.0)), lam("rmTray", () => ({ color: "#ffd45c" })));
    for (const x of [-2.6, 2.6]) for (let k = 0; k < 5; k++) fb.add(new THREE.CylinderGeometry(0.025, 0.025, 6.8, 6).rotateX(Math.PI / 2).translate(x - 0.2 + k * 0.1, 3.0, -0.4), lam(`rmCable${k % 3}`, () => ({ color: ["#4d8fd6", "#e0483e", "#2fa37e"][k % 3] })));
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshBasicMaterial({ map: screenTex("code"), toneMapped: false }));
    ws.position.set(0, 2.85, -D / 2 + 0.03); ws.layers.set(NOINK); g.add(ws);
  } else if (kind === "desk") {
    // a home/office desk: monitor (browser), laptop (code), wifi router with antennas, phone, lamp, chair, poster
    fb.add(boxGeo(V(-1.3, 0.74, -2.3), V(1.3, 0.8, -1.5)), wood);
    for (const x of [-1.2, 1.2]) for (const z of [-2.2, -1.6]) fb.add(boxGeo(V(x - 0.04, 0, z - 0.04), V(x + 0.04, 0.74, z + 0.04)), lam("rmLeg", () => ({ color: "#39414f" })));
    fb.add(boxGeo(V(-0.55, 0.8, -2.2), V(-0.45, 1.0, -2.1)), lam("rmLeg", () => ({ color: "#39414f" })));
    fb.add(boxGeo(V(-1.0, 1.0, -2.2), V(0.1, 1.62, -2.14)), lam("rmBezel", () => ({ color: "#1f2430" })));
    fb.add(boxGeo(V(0.35, 0.8, -1.95), V(0.95, 0.82, -1.6)), lam("rmBezel", () => ({ color: "#1f2430" })));
    const lid = new THREE.Group(), lb = new Batch(); lb.add(boxGeo(V(-0.3, 0, -0.01), V(0.3, 0.38, 0.01)), lam("rmBezel", () => ({ color: "#1f2430" }))); lb.build(lid);
    lid.position.set(0.65, 0.82, -1.95); lid.rotation.x = -0.25; g.add(lid);
    const lscr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.33), new THREE.MeshBasicMaterial({ map: screenTex("code"), toneMapped: false })); lscr.position.set(0, 0.19, 0.012); lscr.layers.set(NOINK); lid.add(lscr);
    fb.add(boxGeo(V(1.0, 0.8, -2.25), V(1.25, 0.86, -2.05)), lam("rmRouter", () => ({ color: "#f5f7fb" })));
    for (const dx of [1.04, 1.21]) fb.add(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6).translate(dx, 0.98, -2.2), lam("rmLeg", () => ({ color: "#39414f" })));
    for (let k = 0; k < 4; k++) fb.add(boxGeo(V(1.03 + k * 0.05, 0.84, -2.05), V(1.05 + k * 0.05, 0.85, -2.04)), lam("rmLedG", () => ({ color: "#3ddc84" })));
    fb.add(boxGeo(V(-1.2, 0.8, -1.7), V(-1.08, 0.81, -1.5)), lam("rmBezel", () => ({ color: "#1f2430" }))); // phone
    fb.add(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8).translate(-1.15, 1.05, -2.15), lam("rmLeg", () => ({ color: "#39414f" })));
    fb.add(new THREE.ConeGeometry(0.14, 0.16, 16, 1, true).rotateZ(0.6).translate(-1.05, 1.3, -2.1), lam("rmLamp", () => ({ color: "#ffd45c" })));
    fb.add(boxGeo(V(-0.6, 0.45, -1.1), V(0.0, 0.52, -0.5)), lam("rmChair", () => ({ color: "#4d8fd6" })));
    fb.add(boxGeo(V(-0.6, 0.52, -0.55), V(0.0, 1.2, -0.48)), lam("rmChair", () => ({ color: "#4d8fd6" })));
    plant(2.6, -3.3, 1.0);
    const mon = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.56), new THREE.MeshBasicMaterial({ map: screenTex("browser"), toneMapped: false }));
    mon.position.set(-0.45, 1.31, -2.13); mon.layers.set(NOINK); g.add(mon);
  } else if (kind === "fengshui") {
    // low dark-wood table with the luo pan and a tea set, two carved chairs, lanterns, scrolls, a bagua mirror, bamboo
    fb.add(boxGeo(V(-1.0, 0.82, -1.9), V(1.0, 0.9, -0.9)), wood);
    for (const x of [-0.9, 0.9]) for (const z of [-1.8, -1.0]) fb.add(boxGeo(V(x - 0.05, 0, z - 0.05), V(x + 0.05, 0.82, z + 0.05)), wood);
    fb.add(boxGeo(V(-1.02, 0.74, -1.92), V(1.02, 0.8, -0.88)), trim);
    for (const [x, c] of [[0.55, "#f3ead6"], [0.72, "#f3ead6"]] as const) fb.add(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 12).translate(x, 0.935, -1.1), lam("rmCup", () => ({ color: c })));
    fb.add(new THREE.SphereGeometry(0.1, 14, 10).scale(1, 0.8, 1).translate(0.65, 0.98, -1.35), lam("rmTeapot", () => ({ color: "#7e0f15" })));
    for (const x of [-1.6, 1.6]) { // carved armchairs facing the table
      fb.add(boxGeo(V(x - 0.3, 0.42, -1.65), V(x + 0.3, 0.5, -1.05)), wood);
      fb.add(boxGeo(V(x - 0.3, 0.5, Math.min(-1.65, -1.6)), V(x + 0.3, 1.2, -1.55)), wood);
      for (const dx of [-0.27, 0.27]) for (const z of [-1.62, -1.08]) fb.add(boxGeo(V(x + dx - 0.03, 0, z - 0.03), V(x + dx + 0.03, 0.42, z + 0.03)), wood);
    }
    for (const x of [-2.8, 2.8]) { // red lanterns hanging from the ceiling line
      fb.add(new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6).translate(x, 3.3, -2.6), wood);
      fb.add(new THREE.SphereGeometry(0.32, 18, 12).scale(1, 0.85, 1).translate(x, 2.75, -2.6), lam("rmLantern", () => ({ color: "#c8202a" })));
      for (const y of [3.0, 2.5]) fb.add(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 14).translate(x, y, -2.6), phong("#d4a73c", 80));
    }
    plant(-4.2, -3.2, 1.6); plant(4.2, -3.2, 1.6);
    const lp = new THREE.Mesh(new THREE.CircleGeometry(0.36, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: luopanTex(), toneMapped: false }));
    lp.position.set(0, 0.905, -1.4); lp.layers.set(NOINK); g.add(lp);
    fb.add(new THREE.CylinderGeometry(0.4, 0.42, 0.05, 40).translate(0, 0.875, -1.4), lam("rmLuopanBase", () => ({ color: "#7a4a1c" })));
    for (const [x, sd] of [[-2.4, 3], [2.4, 5]] as const) {
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.65), new THREE.MeshBasicMaterial({ map: scrollTex(sd), toneMapped: false }));
      sc.position.set(x, 2.0, -D / 2 + 0.03); sc.layers.set(NOINK); g.add(sc);
    }
    const bg = new Batch(); // bagua mirror: gold octagon with a round mirror
    bg.add(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 8).rotateX(Math.PI / 2).rotateZ(Math.PI / 8).translate(0, 3.3, -D / 2 + 0.04), phong("#d4a73c", 80));
    bg.add(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24).rotateX(Math.PI / 2).translate(0, 3.3, -D / 2 + 0.06), lam("rmMirror", () => ({ color: "#cfe6f5" })));
    bg.build(g);
  } else if (kind === "vip") {
    fb.add(boxGeo(V(-1.6, 0.78, -2.6), V(1.6, 0.88, -1.5)), wood); // executive desk
    fb.add(boxGeo(V(-1.55, 0, -2.55), V(1.55, 0.78, -2.35)), wood);
    fb.add(boxGeo(V(-1.62, 0.86, -1.52), V(1.62, 0.9, -1.48)), trim);
    fb.add(boxGeo(V(-0.4, 0, -3.4), V(0.4, 1.6, -3.0)), leather); // big chair back
    sofa(-3.0, 1.2, 2.4, Math.PI / 2);
    fb.add(boxGeo(V(-1.9, 0.38, 0.6), V(-0.9, 0.44, 1.8)), lam("rmGlass", () => ({ color: "#9fb6c9" }))); // coffee table
    for (const x of [-1.85, -0.95]) for (const z of [0.65, 1.75]) fb.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, 0.38, z + 0.03)), trim);
    plant(4.2, -3.4, 1.4);
    fb.add(new THREE.SphereGeometry(0.35, 20, 14).translate(3.4, 1.15, -3.2), lam("rmGlobe", () => ({ color: "#3d6f9a" }))); // globe
    fb.add(new THREE.CylinderGeometry(0.06, 0.18, 0.8, 10).translate(3.4, 0.4, -3.2), trim);

    const tv = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ map: screenTex("up"), toneMapped: false }));
    tv.position.set(-3.0, 2.0, -D / 2 + 0.06); tv.layers.set(NOINK); g.add(tv);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), new THREE.MeshBasicMaterial({ map: paintingTex(4), toneMapped: false }));
    art.position.set(W / 2 - 0.02, 2.1, -1.0); art.rotation.y = -Math.PI / 2; art.layers.set(NOINK); g.add(art);
  } else {
    // sultan: columns, gold mouldings, chandelier, a big cream L-sofa, curtains, a grand staircase at the back left
    for (const x of [-5.4, 5.4]) for (const z of [-3.6, 2.6]) {
      fb.add(new THREE.CylinderGeometry(0.32, 0.32, H, 20).translate(x, H / 2, z), lam("rmColumn", () => ({ color: "#f5ecd8" })));
      fb.add(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 20).translate(x, H - 0.11, z), trim);
      fb.add(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 20).translate(x, 0.11, z), trim);
    }
    fb.add(boxGeo(V(-W / 2, H - 0.3, -D / 2), V(W / 2, H - 0.18, -D / 2 + 0.1)), trim); // cornice
    fb.add(boxGeo(V(-W / 2, 1.0, -D / 2), V(W / 2, 1.06, -D / 2 + 0.06)), trim); // dado rail
    sofa(0, 0.4, 4.2); sofa(-2.6, -0.8, 2.2, Math.PI / 2);
    fb.add(boxGeo(V(-1.0, 0.42, 1.4), V(1.0, 0.48, 2.4)), lam("rmGlass", () => ({ color: "#9fb6c9" })));
    for (const x of [-0.95, 0.95]) for (const z of [1.45, 2.35]) fb.add(boxGeo(V(x - 0.03, 0, z - 0.03), V(x + 0.03, 0.42, z + 0.03)), trim);
    for (const s of [-1, 1]) for (const k of [0, 1]) fb.add(boxGeo(V(s * (winW / 2 + 0.3 + k * 0.35) - 0.17, 0.1, -D / 2 + 0.1), V(s * (winW / 2 + 0.3 + k * 0.35) + 0.17, H - 0.35, -D / 2 + 0.3)), lam("rmCurtain", () => ({ color: "#8e1f2b" })));
    for (let k = 0; k < 10; k++) fb.add(boxGeo(V(-6.6, 0, -4.8 + k * 0.32), V(-4.2, 0.2 + k * 0.22, -4.48 + k * 0.32)), lam("rmStair", () => ({ color: "#f4f1ea" })));
    const ch = new THREE.Group(), cb = new Batch(); // chandelier
    cb.add(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6).translate(0, -0.5, 0), trim);
    for (const [r, y] of [[0.9, -1.1], [0.6, -1.4]] as const) {
      cb.add(new THREE.TorusGeometry(r, 0.04, 8, 32).rotateX(Math.PI / 2).translate(0, y, 0), trim);
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; cb.add(new THREE.SphereGeometry(0.08, 10, 8).translate(Math.cos(a) * r, y - 0.12, Math.sin(a) * r), lam("rmCrystal", () => ({ color: "#fff7d6" }))); }
    }
    cb.build(ch); ch.position.set(0, H, 0.2); g.add(ch);
    plant(4.4, -4.0, 1.5); plant(-4.4, 2.0, 1.2);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.5), new THREE.MeshBasicMaterial({ map: paintingTex(9), toneMapped: false }));
    art.position.set(W / 2 - 0.02, 2.6, -1.0); art.rotation.y = -Math.PI / 2; art.layers.set(NOINK); g.add(art);

  }
  fb.build(g);
  g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !(m.material as THREE.MeshBasicMaterial).isMeshBasicMaterial) { m.castShadow = true; m.receiveShadow = true; } });
  return roomSpots(kind, at);
};
