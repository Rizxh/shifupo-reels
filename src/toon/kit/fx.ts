// EP11 2D effect and insert drawings (Pen, ink style of the template): exhaust and brake smoke, sleep "z" marks,
// the hands with the hatpin and the garter, wood chips, sparkles, friction streaks, the big boot on the slippery
// floor, the telegram slip and Karl asleep in his window.
import { Pen, INK, SKIN, bodyFront, Outfit } from "../toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;

/** smoke / exhaust puff on a 300 x 300 canvas; t 0..1 grows and fades; col = base grey */
export const puff = (p: Pen, t: number, col = "#c9c6cf") => {
  const a = Math.max(0, 1 - t) ** 1.2;
  for (let i = 0; i < 5; i++) {
    const ang = rad(150 + i * 60), d = 26 + 60 * t, r = (40 + 16 * (i % 2)) * (0.55 + 0.7 * t);
    p.g.globalAlpha = a;
    p.ell(150 + d * Math.cos(ang), 160 + d * 0.6 * Math.sin(ang), r, r * 0.82, col, t < 0.5 ? 5 : 0);
  }
  p.g.globalAlpha = 1;
};

/** sleeping "z z z" rising, on a 300 x 300 canvas (letter shapes, no words) */
export const zzz = (p: Pen, t: number) => {
  for (let i = 0; i < 3; i++) {
    const u = (t + i / 3) % 1, s = 26 + 26 * u, x = 70 + 150 * u, y = 250 - 200 * u;
    p.g.globalAlpha = Math.sin(u * Math.PI);
    p.line([[x - s, y - s], [x + s, y - s], [x - s, y + s], [x + s, y + s]], "#ffffff", 9);
  }
  p.g.globalAlpha = 1;
};

/** a gloved hand pushing a hatpin to the right, on a 600 x 300 canvas; k 0..1 = how far it pokes in */
export const hatpinHand = (p: Pen, k: number) => {
  const x = 120 + 160 * k;
  p.band([[x + 40, 150], [x + 330, 150]], "#d7dde6", 7, 3, "round");
  p.ell(x + 30, 150, 15, 15, "#f4efe2", 5);
  p.poly([[x - 120, 112], [x + 10, 118], [x + 30, 140], [x + 30, 162], [x + 6, 186], [x - 120, 190]], "#6b3550", 7); // sleeve + glove
  p.poly([[x - 40, 120], [x + 20, 124], [x + 36, 150], [x + 20, 178], [x - 40, 182]], "#f1e3d0", 7);
  p.stroke([[x - 6, 140], [x + 22, 142]], 4); p.stroke([[x - 6, 160], [x + 22, 160]], 4);
};

/** close-up: a fist from the right swinging a cobbler's hammer down onto a point at the canvas left-centre
 *  (the brake block), on a 700 x 500 canvas; k 0 raised .. 1 struck */
export const hammerHand = (p: Pen, k: number) => {
  const piv: P2 = [470, 300];
  const a = rad(180 + 62 * (1 - k));
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const at = (l: number, w: number): P2 => [piv[0] + dx * l + nx * w, piv[1] + dy * l + ny * w];
  p.band([at(-10, 0), at(250, 0)], "#8a5a33", 18, 6, "round"); // wooden handle
  p.poly([at(232, -52), at(282, -52), at(282, 52), at(232, 52)], "#55595f", 7); // iron head
  p.poly([at(276, -40), at(296, -36), at(296, 36), at(276, 40)], "#7d828a", 5); // striking face
  p.poly([[520, 250], [700, 236], [700, 372], [520, 360]], "#5a4632", 7); // rolled-up sleeve
  p.ell(piv[0] + 30, piv[1] + 4, 58, 50, "#f1d6bd", 7); // fist round the handle
  p.stroke([[piv[0] + 6, piv[1] - 22], [piv[0] + 6, piv[1] + 30]], 4);
  p.stroke([[piv[0] + 26, piv[1] - 26], [piv[0] + 26, piv[1] + 32]], 4);
};

/** a lace garter wound round the ignition wire (wire across the canvas), the gloved hand pulling it tight,
 *  on a 600 x 400 canvas; k 0..1 = wraps done */
export const garter = (p: Pen, k: number) => {
  p.band([[0, 210], [600, 196]], "#7a1f22", 18, 5, "round");
  const n = Math.max(1, Math.round(1 + 4 * k));
  for (let i = 0; i < n; i++) {
    const x = 150 + i * 52;
    p.poly([[x - 18, 160], [x + 14, 158], [x + 30, 246], [x - 2, 248]], "#f3a6c0", 6);
    for (let j = 0; j < 4; j++) p.dot(x - 10 + j * 9, 158 - 4, 5, "#ffffff");
  }
  const hx = 150 + n * 52 + 20;
  p.poly([[hx, 150], [hx + 70, 140], [hx + 96, 205], [hx + 70, 270], [hx, 262]], "#f1e3d0", 7);
  p.poly([[hx + 70, 130], [hx + 220, 120], [hx + 230, 290], [hx + 70, 284]], "#6b3550", 7);
};

/** spark sputter (ignition), on a 300 x 300 canvas: t 0..1, good = steady blue-white spark instead of orange sputter */
export const spark = (p: Pen, t: number, good: boolean) => {
  const col = good ? "#cfe8ff" : "#ffb347", n = good ? 8 : 5;
  for (let i = 0; i < n; i++) {
    const a = rad(i * (360 / n) + 40 * t * (good ? 1 : 3)), r0 = 20, r1 = (good ? 120 : 70 + 60 * Math.abs(Math.sin(t * 20 + i)));
    p.poly([[150 + r0 * Math.cos(a + 0.2), 150 + r0 * Math.sin(a + 0.2)], [150 + r1 * Math.cos(a), 150 + r1 * Math.sin(a)], [150 + r0 * Math.cos(a - 0.2), 150 + r0 * Math.sin(a - 0.2)]], col, 5);
  }
  p.ell(150, 150, 22, 22, "#ffffff", 5);
};

/** wood chips flying, on a 400 x 400 canvas, t 0..1 */
export const chips = (p: Pen, t: number) => {
  for (let i = 0; i < 9; i++) {
    const a = rad(200 + i * 18), d = 30 + 190 * t, x = 200 + d * Math.cos(a), y = 200 + d * Math.sin(a) + 160 * t * t;
    const s = 16 - 6 * t, r = i * 0.7 + t * 6;
    p.poly([[x + s * Math.cos(r), y + s * Math.sin(r)], [x + s * 0.5 * Math.cos(r + 2), y + s * 0.5 * Math.sin(r + 2)], [x - s * Math.cos(r), y - s * Math.sin(r)], [x - s * 0.5 * Math.cos(r + 2), y - s * 0.5 * Math.sin(r + 2)]], "#d6a463", 4);
  }
};

/** four-point sparkle (the "first brake pad" moment), on a 300 x 300 canvas */
export const sparkle = (p: Pen, t: number) => {
  const s = Math.sin(Math.min(1, t) * Math.PI);
  for (const [x, y, k] of [[150, 150, 1], [70, 90, 0.5], [235, 215, 0.6]] as const) {
    const r = 110 * k * s, w = 18 * k * s;
    if (r < 2) continue;
    p.poly([[x, y - r], [x + w, y - w], [x + r, y], [x + w, y + w], [x, y + r], [x - w, y + w], [x - r, y], [x - w, y - w]], "#fff6c8", 5);
  }
};

/** friction streaks around a contact point (heat lines), on a 400 x 300 canvas; hot = orange tint */
export const friction = (p: Pen, t: number, hot: boolean) => {
  const col = hot ? "#ffb347" : "#ffffff";
  for (let i = 0; i < 4; i++) {
    const y = 70 + i * 50, off = ((t * 3 + i * 0.37) % 1) * 140;
    p.line([[60 + off, y], [170 + off, y - 8], [260 + off, y]], col, 7);
  }
};

/** grip marks: two short stops with "teeth", on a 400 x 300 canvas */
export const grip = (p: Pen, k: number) => {
  for (let i = 0; i < 5; i++) {
    const x = 80 + i * 60, h = 40 + 60 * k;
    p.poly([[x, 220], [x + 24, 220 - h], [x + 48, 220]], "#bfe3ff", 6);
  }
};

/** a big cartoon boot standing on a wet floor (the sole grips: no slip), on a 700 x 600 canvas */
export const bootOnFloor = (p: Pen, k: number) => {
  p.ell(350, 520, 300, 46, "#7fb2e6", 7); // puddle
  p.ell(300, 512, 120, 16, "#b9dcff", 0);
  const lift = 18 * Math.sin(k * Math.PI);
  p.poly([[230, 90 - lift], [370, 90 - lift], [376, 360 - lift], [560, 400 - lift], [574, 470 - lift], [214, 470 - lift]], "#6a3f25", 10);
  p.poly([[214, 470 - lift], [574, 470 - lift], [574, 500 - lift], [214, 500 - lift]], "#3a2416", 9); // sole
  for (let i = 0; i < 8; i++) p.stroke([[232 + i * 44, 500 - lift], [250 + i * 44, 512 - lift]], 7); // tread
  p.stroke([[250, 150 - lift], [356, 150 - lift]], 7, "#8a5a3a");
  p.stroke([[250, 210 - lift], [356, 210 - lift]], 7, "#8a5a3a");
  p.stroke([[250, 270 - lift], [356, 270 - lift]], 7, "#8a5a3a");
};

/** telegram slip flying (folded paper with strips), on a 300 x 240 canvas */
export const telegram = (p: Pen, t: number) => {
  const r = 0.3 * Math.sin(t * 9);
  const c: P2 = [150, 120], R = (q: P2): P2 => [c[0] + (q[0] - c[0]) * Math.cos(r) - (q[1] - c[1]) * Math.sin(r), c[1] + (q[0] - c[0]) * Math.sin(r) + (q[1] - c[1]) * Math.cos(r)];
  p.poly([[40, 50], [260, 40], [266, 190], [46, 200]].map((q) => R(q as P2)), "#f4ecd6", 7);
  for (let i = 0; i < 4; i++) p.stroke([R([70, 80 + i * 26]), R([230, 76 + i * 26])], 9, "#d8c7a4");
};

/** Karl asleep at his upper window: frame, shutters, dark room, Karl clipped to the opening; 500 x 600 canvas */
export const karlWindow = (p: Pen, o: Outfit, lid: number) => {
  const X0 = 120, X1 = 380, Y0 = 120, Y1 = 470;
  p.poly([[X0 - 70, Y0], [X0, Y0], [X0, Y1], [X0 - 70, Y1]], "#2f5f6a", 6); // shutters
  p.poly([[X1, Y0], [X1 + 70, Y0], [X1 + 70, Y1], [X1, Y1]], "#2f5f6a", 6);
  p.poly([[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], "#26304a", 8);
  p.clip([[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], () => {
    const g = p.g;
    g.save(); g.translate(250 - 300 * 0.62, 600 - 975 * 0.62 + 180); g.scale(0.62, 0.62);
    bodyFront(new Pen(g), o, { mode: "stand", expr: "neutral", blink: lid, headTilt: -14, seed: 4 });
    g.restore();
  });
  p.poly([[X0 - 20, Y1 - 6], [X1 + 20, Y1 - 6], [X1 + 20, Y1 + 22], [X0 - 20, Y1 + 22]], "#efe3c8", 6); // sill
};

export { INK, SKIN };
