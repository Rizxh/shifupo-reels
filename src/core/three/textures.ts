// Procedural surface textures for live 3D worlds, drawn once on a canvas with
// seeded randomness (deterministic, no image files to license). Detail on
// every surface is what separates a premium diorama from flat "polos" boxes.

import { random } from "remotion";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d") as CanvasRenderingContext2D] as const;
};

const finish = (c: HTMLCanvasElement, repeat: readonly [number, number] = [1, 1], color = true) => {
  const t = new CanvasTexture(c);
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (color) {
    t.colorSpace = SRGBColorSpace;
  }
  return t;
};

// Wood planks with grain lines, per-plank tone and dark seams.
export const woodTexture = (seed: string, base: string, dark: string, planks = 8, repeat: readonly [number, number] = [1, 1]) => {
  const W = 1024;
  const [c, g] = canvas(W, W);
  const ph = W / planks;
  for (let p = 0; p < planks; p++) {
    g.fillStyle = base;
    g.fillRect(0, p * ph, W, ph);
    g.globalAlpha = 0.08 + random(`${seed}-tone-${p}`) * 0.16;
    g.fillStyle = random(`${seed}-dk-${p}`) > 0.5 ? dark : "#ffffff";
    g.fillRect(0, p * ph, W, ph);
    g.globalAlpha = 1;
    // Grain.
    for (let k = 0; k < 26; k++) {
      const y = p * ph + random(`${seed}-g-${p}-${k}`) * ph;
      g.strokeStyle = dark;
      g.globalAlpha = 0.05 + random(`${seed}-ga-${p}-${k}`) * 0.12;
      g.lineWidth = 1 + random(`${seed}-gw-${p}-${k}`) * 2;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 64) {
        g.lineTo(x, y + Math.sin(x / 90 + k) * 3 * random(`${seed}-gs-${p}-${k}`));
      }
      g.stroke();
    }
    g.globalAlpha = 1;
    // Seams: one long seam per row, staggered butt joints.
    g.fillStyle = dark;
    g.globalAlpha = 0.55;
    g.fillRect(0, p * ph, W, 3);
    const joint = random(`${seed}-j-${p}`) * W;
    g.fillRect(joint, p * ph, 3, ph);
    g.globalAlpha = 1;
  }
  return finish(c, repeat);
};

// Soft paper / plaster: base color with fine mottling.
export const plasterTexture = (seed: string, base: string, repeat: readonly [number, number] = [1, 1]) => {
  const W = 512;
  const [c, g] = canvas(W, W);
  g.fillStyle = base;
  g.fillRect(0, 0, W, W);
  for (let i = 0; i < 2600; i++) {
    const x = random(`${seed}-x${i}`) * W;
    const y = random(`${seed}-y${i}`) * W;
    const r = 1 + random(`${seed}-r${i}`) * 5;
    g.fillStyle = random(`${seed}-c${i}`) > 0.5 ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.05)";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return finish(c, repeat);
};

// Woven rug: border bands and a repeating diamond field in brand colors.
export const rugTexture = (field: string, border: string, accent: string) => {
  const W = 1024;
  const [c, g] = canvas(W, W);
  g.fillStyle = border;
  g.fillRect(0, 0, W, W);
  g.fillStyle = field;
  g.fillRect(70, 70, W - 140, W - 140);
  g.strokeStyle = accent;
  g.lineWidth = 6;
  g.strokeRect(46, 46, W - 92, W - 92);
  g.strokeRect(96, 96, W - 192, W - 192);
  g.globalAlpha = 0.5;
  const step = 108;
  for (let y = 150; y < W - 120; y += step) {
    for (let x = 150; x < W - 120; x += step) {
      g.beginPath();
      g.moveTo(x, y - 26);
      g.lineTo(x + 26, y);
      g.lineTo(x, y + 26);
      g.lineTo(x - 26, y);
      g.closePath();
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  // Weave noise.
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = i % 2 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)";
    g.fillRect(random(`rug-x${i}`) * W, random(`rug-y${i}`) * W, 3, 1);
  }
  return finish(c);
};

// Ink landscape for a framed wall painting (sumi-e mountains, red seal).
export const inkPaintingTexture = (paper: string, ink: string, seal: string) => {
  const [c, g] = canvas(512, 768);
  g.fillStyle = paper;
  g.fillRect(0, 0, 512, 768);
  for (let layer = 0; layer < 3; layer++) {
    g.fillStyle = ink;
    g.globalAlpha = 0.18 + layer * 0.22;
    g.beginPath();
    const base = 420 + layer * 110;
    g.moveTo(0, 768);
    for (let x = 0; x <= 512; x += 16) {
      const h = Math.sin(x / (70 + layer * 20) + layer * 2) * 70 + Math.sin(x / 23 + layer) * 14;
      g.lineTo(x, base - h - (layer === 0 ? 120 : 0));
    }
    g.lineTo(512, 768);
    g.closePath();
    g.fill();
  }
  g.globalAlpha = 1;
  g.fillStyle = seal;
  g.fillRect(400, 90, 46, 46);
  return finish(c);
};

// Monitor screen: dim UI blocks (a spreadsheet glow, no readable text).
export const screenTexture = (bg: string, line: string, accent: string) => {
  const [c, g] = canvas(512, 320);
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = accent;
  g.fillRect(24, 24, 140, 18);
  for (let r = 0; r < 9; r++) {
    for (let k = 0; k < 4; k++) {
      g.fillStyle = line;
      g.globalAlpha = 0.25 + random(`scr-${r}-${k}`) * 0.4;
      g.fillRect(24 + k * 120, 64 + r * 26, 60 + random(`scrw-${r}-${k}`) * 50, 10);
    }
  }
  g.globalAlpha = 1;
  return finish(c);
};
