// EP13 2D drawings (Pen, ink style): the goat (gag character), smell waves, mould spores, cool breeze, rain streaks
// and the inspection-camera screen.
import { Pen, INK } from "../toon";
import { TOON_BRAND } from "../brand";

type P2 = [number, number];

/** the goat in profile (facing screen-right), on a 440 x 440 canvas: off-white coat, horns curving back, floppy ear,
 *  chin beard and the goat's sideways bar pupil. seated: only head, neck and shoulders (the rest is behind the car door).
 *  chew 0..1 moves the jaw. */
export const goat = (p: Pen, chew: number, eyes: "smug" | "happy" | "shut" = "smug", seated = false) => {
  const coat = "#efebe3", shade = "#d3cdc2", hoofC = "#2f2a27", hornC = "#9a8668";
  const lift = seated ? 70 : 0;
  if (!seated) {
    for (const [x, d] of [[150, 0], [178, 6], [262, 0], [290, 6]] as const) { p.band([[x, 318], [x + d, 404]], shade, 20, 6, "round"); p.ell(x + d, 410, 14, 8, hoofC, 5); }
    p.band([[112, 268], [96, 236]], coat, 18, 6, "round"); // tail up
    p.ell(210, 292, 124, 66, coat, 7); // body
    p.ell(200, 318, 70, 22, shade, 0);
    p.ell(210, 292, 124, 66, null, 7);
  } else {
    p.ell(210, 420, 140, 90, coat, 7); // shoulders behind the door line
  }
  // neck up to the head
  p.poly([[262, 270 + lift], [318, 250 + lift], [350, 168 + lift], [300, 150 + lift], [256, 236 + lift]], coat, 7);
  const hx = 330, hy = 160 + lift;
  // horns sweep back over the neck
  p.band([[hx - 20, hy - 34], [hx - 52, hy - 74], [hx - 92, hy - 70]], hornC, 20, 6, "round");
  for (let k = 0; k < 4; k++) p.stroke([[hx - 30 - k * 14, hy - 48 - k * 6], [hx - 40 - k * 14, hy - 58 - k * 4]], 3);
  // floppy ear
  p.ell(hx - 52, hy - 4, 40, 15, coat, 6, 0, 360, 0.35);
  p.ell(hx - 52, hy - 4, 24, 7, "#e9b9b3", 0, 0, 360, 0.35);
  // long head with a lowered muzzle
  p.poly([[hx - 40, hy - 30], [hx + 10, hy - 40], [hx + 52, hy - 10], [hx + 70, hy + 30], [hx + 60, hy + 52], [hx + 22, hy + 56], [hx - 30, hy + 30]], coat, 7);
  const jaw = 6 * Math.sin(chew * Math.PI * 2);
  p.stroke([[hx + 36, hy + 44 + jaw * 0.4], [hx + 62, hy + 42]], 5); // mouth line, chewing
  p.dot(hx + 58, hy + 22, 5); // nostril
  // beard under the chin
  p.poly([[hx + 14, hy + 54], [hx + 36, hy + 54 + jaw * 0.3], [hx + 24 + 3 * Math.sin(chew * 6), hy + 100]], "#ffffff", 5);
  // eye: yellow iris, horizontal bar pupil
  const ex = hx + 2, ey = hy - 8;
  if (eyes === "happy") p.arc(ex, ey + 4, 13, 9, 200, 340, 6);
  else if (eyes === "shut") p.stroke([[ex - 12, ey], [ex + 12, ey]], 6);
  else {
    p.ell(ex, ey, 14, 12, "#f2c94c", 5);
    p.poly([[ex - 10, ey - 3], [ex + 10, ey - 3], [ex + 10, ey + 3], [ex - 10, ey + 3]], INK, 0);
    p.stroke([[ex - 16, ey - 8], [ex + 15, ey - 11]], 6); // heavy lid: smug
  }
};

/** a perfume spray bottle in a hand, puffing mist to the right; on a 400 x 300 canvas; k 0..1 = the puff */
export const perfume = (p: Pen, k: number) => {
  p.poly([[60, 110], [150, 110], [160, 260], [50, 260]], "#d9a2c8", 7); // bottle
  p.poly([[85, 80], [125, 80], [125, 110], [85, 110]], "#f0e2b6", 6); // cap / nozzle
  p.poly([[20, 170], [70, 150], [80, 250], [20, 262]], "#f5c9a0", 6); // hand
  for (let i = 0; i < 7; i++) { const a = -0.5 + i * 0.16, d = 40 + 160 * k; p.g.globalAlpha = Math.max(0, 1 - k) * 0.9; p.ell(130 + d * Math.cos(a), 92 + d * Math.sin(a) * 0.6, 10 + 10 * k, 10 + 10 * k, "#fbe6f4", 3); }
  p.g.globalAlpha = 1;
};
/** a small vent-clip air freshener (round, no brand shape), on a 160 x 160 canvas */
export const freshener = (p: Pen, hue: string) => {
  p.ell(80, 86, 54, 54, hue, 7);
  p.ell(80, 86, 30, 30, "#ffffff", 5);
  p.poly([[70, 20], [90, 20], [88, 36], [72, 36]], "#3a3d46", 5);
};
/** cleaning spray wand with a foam cone, on a 500 x 300 canvas (nozzle at the right edge, cone going right) */
export const wand = (p: Pen, on: boolean, t: number) => {
  p.poly([[20, 150], [300, 130], [300, 170], [20, 176]], "#2f3340", 6); // hose + lance
  p.poly([[300, 118], [360, 118], [360, 182], [300, 182]], TOON_BRAND.uniform, 6); // trigger head
  p.poly([[360, 138], [420, 142], [420, 158], [360, 162]], "#c7d0da", 5); // nozzle
  if (on) for (let i = 0; i < 9; i++) { const u = (t * 3 + i / 9) % 1, y = 150 + (i - 4) * 9 * u * 1.6; p.ell(420 + 70 * u, y, 8 + 12 * u, 8 + 12 * u, "#ffffff", 3); }
};

/** wavy smell lines rising, on a 300 x 400 canvas; t 0..1 loops; col = green stink or blue cool */
export const waves = (p: Pen, t: number, col: string, n = 3) => {
  for (let i = 0; i < n; i++) {
    const u = (t + i / n) % 1, x0 = 70 + i * 80, a = Math.sin(u * Math.PI);
    const pts: P2[] = [];
    for (let k = 0; k <= 10; k++) { const y = 380 - k * 32 - u * 60; pts.push([x0 + 18 * Math.sin(k * 0.9 + u * 6 + i), y]); }
    p.g.globalAlpha = a;
    p.line(pts, col, 7);
  }
  p.g.globalAlpha = 1;
};

/** floating mould spores, on a 400 x 400 canvas; t drifts them */
export const spores = (p: Pen, t: number) => {
  for (let i = 0; i < 18; i++) {
    const a = i * 2.4, r = 40 + ((i * 37) % 150), x = 200 + r * Math.cos(a + t * 0.8), y = 200 + r * Math.sin(a * 1.3 + t * 0.6);
    const s = 7 + (i % 4) * 4;
    p.ell(x, y, s, s, ["#7f9a4c", "#5d7a3a", "#a8b46a"][i % 3], 3);
    p.dot(x - s * 0.3, y - s * 0.3, s * 0.25, "#e8f0c8");
  }
};

/** rain streaks across a 600 x 1000 canvas; t scrolls */
export const rain = (p: Pen, t: number) => {
  for (let i = 0; i < 60; i++) {
    const x = (i * 97) % 600, y = ((i * 173 + t * 1400) % 1100) - 100;
    p.g.globalAlpha = 0.55;
    p.g.strokeStyle = "#e6f1ff"; p.g.lineWidth = 4; p.g.lineCap = "round";
    p.g.beginPath(); p.g.moveTo(x, y); p.g.lineTo(x - 10, y + 60); p.g.stroke();
  }
  p.g.globalAlpha = 1;
};

/** handheld inspection screen (borescope) showing the mouldy fins, on a 400 x 300 canvas */
export const scope = (p: Pen, live: number) => {
  p.poly([[10, 10], [390, 10], [390, 290], [10, 290]], "#1f2229", 7);
  p.poly([[30, 30], [370, 30], [370, 250], [30, 250]], "#9aa6b4", 4);
  for (let x = 36; x < 368; x += 14) p.stroke([[x, 32], [x, 248]], 4, "#7d8896");
  const blobs: [number, number, number][] = [[90, 120, 34], [170, 190, 40], [260, 110, 30], [320, 200, 36], [210, 80, 22], [120, 220, 26]];
  for (const [x, y, r] of blobs) p.ell(x, y, r * live, r * 0.85 * live, "#5d7a3a", 0);
  for (const [x, y, r] of blobs) p.ell(x + 8, y - 6, r * 0.5 * live, r * 0.4 * live, "#2f3a2a", 0);
  p.dot(355, 270, 8, "#e2453c");
};

const FONT = `${TOON_BRAND.canvasFont}, 'Arial Black', Arial, sans-serif`;
/** canvas size for a part label */
export const labelSize = (title: string, sub = ""): [number, number] => [Math.max(title.length * 34, sub.length * 19) + 90, sub ? 196 : 146];
/** a part label: white rounded tag with ink outline, bold title, optional sub line, pointer at the bottom centre.
 *  k 0..1 pops it in. Canvas from labelSize(). */
export const label = (p: Pen, title: string, sub: string, k: number) => {
  const [w, h] = labelSize(title, sub), g = p.g, bh = h - 36;
  g.save();
  g.translate(w / 2, h); g.scale(k, k); g.translate(-w / 2, -h);
  g.fillStyle = "#ffffff"; g.strokeStyle = INK; g.lineWidth = 7;
  g.beginPath(); g.roundRect(6, 6, w - 12, bh - 6, 26); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(w / 2 - 20, bh - 4); g.lineTo(w / 2, h - 4); g.lineTo(w / 2 + 20, bh - 4); g.fill(); g.stroke();
  g.fillStyle = "#ffffff"; g.fillRect(w / 2 - 17, bh - 12, 34, 10);
  g.fillStyle = INK; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `800 60px ${FONT}`; g.fillText(title, w / 2, sub ? 62 : (bh + 6) / 2);
  if (sub) { g.font = `600 34px ${FONT}`; g.fillStyle = "#4a4d55"; g.fillText(sub, w / 2, 122); }
  g.restore();
};

/** airflow path through the AC box (stage front view, 1600 x 900 canvas = 6.4 x 3.6 m): blower -> filter -> evaporator
 *  -> up to the vents; dashes run along it with time t; cold after the evaporator */
export const airPath = (p: Pen, t: number, k: number) => {
  const g = p.g;
  const pts: [number, number][] = [[140, 520], [420, 520], [700, 480], [960, 470], [1180, 470], [1330, 380], [1350, 120]];
  const draw = (col: string, w: number, dash: number[], off: number, from: number, to: number) => {
    g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; g.setLineDash(dash); g.lineDashOffset = off;
    g.beginPath(); pts.slice(from, to).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore();
  };
  const n = Math.max(2, Math.round(2 + k * (pts.length - 2)));
  draw(INK, 34, [], 0, 0, n);
  draw("#f1e6c8", 22, [], 0, 0, Math.min(n, 4));
  if (n > 3) { draw(INK, 34, [], 0, 3, n); draw("#9fd8ff", 22, [], 0, 3, n); }
  draw("#ffffff", 8, [24, 36], -t * 220, 0, n);
  if (n >= pts.length) { // arrow head at the vents
    const [x, y] = pts[pts.length - 1];
    p.poly([[x - 44, y + 30], [x, y - 40], [x + 44, y + 30]], "#9fd8ff", 7);
  }
};

/** the car's AC control panel (close-up insert), 900 x 420 canvas: A/C button with its LED, fan knob still turning */
export const acPanel = (p: Pen, acOn: boolean, t: number, press: number) => {
  const g = p.g;
  g.fillStyle = "#24262d"; g.strokeStyle = INK; g.lineWidth = 8;
  g.beginPath(); g.roundRect(8, 8, 884, 404, 40); g.fill(); g.stroke();
  // A/C button
  const bx = 120, by = 120, s = 1 - 0.06 * press;
  g.save(); g.translate(bx + 110, by + 80); g.scale(s, s); g.translate(-(bx + 110), -(by + 80));
  g.fillStyle = "#3a3d47"; g.beginPath(); g.roundRect(bx, by, 220, 160, 26); g.fill(); g.stroke();
  g.fillStyle = "#ffffff"; g.font = `800 64px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("A/C", bx + 110, by + 86);
  g.fillStyle = acOn ? "#38d36b" : "#5a5d66"; g.beginPath(); g.roundRect(bx + 70, by + 22, 80, 14, 7); g.fill();
  g.restore();
  // fan knob with a turning fan
  const cx = 600, cy = 200;
  g.fillStyle = "#3a3d47"; g.beginPath(); g.arc(cx, cy, 120, 0, 7); g.fill(); g.stroke();
  for (let i = 0; i < 3; i++) {
    const a = t * 9 + (i * Math.PI * 2) / 3;
    p.ell(cx + 42 * Math.cos(a), cy + 42 * Math.sin(a), 44, 20, "#cfe8ff", 4, 0, 360, a);
  }
  p.dot(cx, cy, 14, "#ffffff");
  g.fillStyle = "#cfd3da"; g.font = `700 34px ${FONT}`;
  g.fillText(acOn ? "A/C NYALA" : "A/C MATI", bx + 110, 340);
  g.fillText("KIPAS NYALA", cx, 370);
};
