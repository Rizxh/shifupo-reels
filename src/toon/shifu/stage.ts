// Shifu Po starter cast: Shifu Po himself (dark red shirt like his banner photo, neat hair), a client (Pak Hendra),
// the luo pan glow and a "door behind you" arrow insert. Pure function of (shot, frame).
// When public/assets/shifu/shifu.png exists, a later episode may swap the drawn Shifu for that cut-out (see CLAUDE.md).
import { Outfit, Expr, FrontOpts, INK, Pen } from "../toon";
import { Place, FxPlace, CamInfo, person, blob, lidAt, q, beginStage } from "../cast";
import type { Light } from "../lights";
import { cue } from "./cues";
import { ID, SHOTS, SHOP_X, OFFICE, STUDIO } from "./shots";
import { label, labelSize } from "./fx";
import type { V3 } from "../kit/rig";

export type CardPlace = Place & { wm?: number; hm?: number };
export type Stage = { places: CardPlace[]; fx: FxPlace[] };

/** Shifu Po: dark red shirt (his banner photo: red-black shirt), ink trousers, neat dark hair, gold buttons */
export const SHIFU: Outfit = { jacket: "#8e1a20", pants: "#12100E", boots: INK, hat: "hair", hair: "#15110e", skin: "#eec7a4", buttons: "#C9A45C" };
const HENDRA: Outfit = { jacket: "#3b4252", pants: "#2a2d36", boots: "#2a1a10", hat: "hair", hair: "#1d1612", moustache: "#2a1d14", build: "stout", skin: "#e2ae86", buttons: "#d4a73c" };
const W = { shifu: { i: 1, o: SHIFU, okey: "shifu" }, hendra: { i: 2, o: HENDRA, okey: "hendra" } };
const FRONT = { side: false, mirror: false };
const ex = (f: number, list: [number, Expr][]): Expr => { let e = list[0][1]; for (const [g, x] of list) if (f >= g) e = x; return e; };

/** a gold ring of light rising off the luo pan, on a 400 x 400 canvas */
const qiGlow = (p: Pen, t: number) => {
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.6 + i / 3) % 1, r = 60 + 140 * u;
    p.g.globalAlpha = (1 - u) * 0.8; p.g.strokeStyle = "#F1DDA8"; p.g.lineWidth = 10; p.g.beginPath(); p.g.ellipse(200, 260 - 120 * u, r, r * 0.35, 0, 0, 7); p.g.stroke();
  }
  p.g.globalAlpha = 1;
};

export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const sh = SHOTS[id - 1], t = f / 30;
  beginStage(sh.light as Light, cam);
  const fx = (key: string, cw: number, ch: number, draw: (p: Pen) => void, p: V3, w: number, h: number, extra: Partial<FxPlace> = {}) =>
    out.fx.push({ key, cw, ch, draw, x: p[0], y: p[1], z: p[2], w, h, ...extra });
  const stand = (who: typeof W.shifu, p: V3, fo: FrontOpts, sc = 1) => {
    out.places.push(person(cam, who, p[0], p[1], p[2], FRONT, { blink: lidAt(t, who.i), ...fo }, {}, sc));
    blob(out, p[0], p[1], p[2], sc);
  };
  const tag = (title: string, sub: string, p: V3, from: number, h = 0.3) => {
    if (f < from) return;
    const k = q(Math.min(1, (f - from) / 6) ** 0.6, 12), [cw, ch] = labelSize(title, sub), hh = h * ch / 146;
    fx(`tag|${title}|${sub}|${k}`, cw, ch, (pp) => label(pp, title, sub, k), [p[0], p[1] + hh / 2, p[2]], hh * cw / ch, hh);
  };
  switch (id) {
    case ID.office:
      stand(W.hendra, OFFICE.stand, { mode: "stand", expr: ex(f, [[0, "neutral"], [cue(1, "sepi"), "nervous"]]), facing: 0 });
      tag("BISNIS SEPI", "3 bulan", [OFFICE.stand[0], 2.2, OFFICE.stand[2]], 8, 0.2);
      break;
    case ID.studio: {
      stand(W.shifu, STUDIO.stand, { mode: "stand", expr: ex(f, [[0, "smile"], [cue(2, "ternyata"), "stern"]]), facing: 1 });
      stand(W.hendra, STUDIO.stand2, { mode: "stand", expr: ex(f, [[0, "nervous"], [cue(2, "pintu"), "shock"]]), facing: -1 });
      const u = q(t % 10, 60);
      fx(`qi${u}`, 400, 400, (pp) => qiGlow(pp, u), [STUDIO.screen[0], 1.35, STUDIO.screen[2]], 1.0, 1.0, { soft: true });
      tag("SHIFU PO", "Feng Shui & BaZi", [STUDIO.stand[0], 2.25, STUDIO.stand[2]], 4, 0.2);
      tag("LUO PAN", "kompas feng shui", [STUDIO.screen[0], 1.15, STUDIO.screen[2] + 0.2], cue(2, "feng") - 2, 0.14);
      break;
    }
    case ID.front:
      stand(W.shifu, [SHOP_X + 0.8, 0.17, -5.0], { mode: "stand", expr: "smile", facing: 0 });
      stand(W.hendra, [SHOP_X - 0.8, 0.17, -4.9], { mode: "stand", expr: "grin", facing: 0 });
      break;
    default: break;
  }
  return out;
};
