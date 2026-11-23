import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OFFICE_EVENTS, OFFICE_SHOTS } from "../src/products/shifupo/worlds/officeConfig";
import { officeAnchor } from "../src/products/shifupo/worlds/office";
import { RUKO_SHOTS } from "../src/products/shifupo/worlds/rukoConfig";
import { SFX } from "../src/products/shifupo/sfx";
import { RUKO2D_SHOTS } from "../src/products/shifupo/worlds2d/ruko2dConfig";

// A cinema episode with a live 3D world may only name cameras, events and
// anchors that world defines; a typo would silently render the wrong shot or
// drop a story beat.
const ROOT = path.resolve(import.meta.dirname, "..");
const EPISODES = path.join(ROOT, "data", "episodes");

type Scene = { shot: string; events?: { name: string }[]; marks?: { anchor: string }[]; sfx?: { sound: string }[] };

const WORLD_KEYS: Record<string, { shots: string[]; events: readonly string[]; anchor: (n: string) => unknown }> = {
  office: { shots: Object.keys(OFFICE_SHOTS), events: OFFICE_EVENTS, anchor: (n) => officeAnchor(n, 0, {}) },
  // Music video world: shots only (the lyric table drives the acting).
  ruko: { shots: Object.keys(RUKO_SHOTS), events: [], anchor: () => null },
  ruko2d: { shots: [...RUKO2D_SHOTS], events: [], anchor: () => null },
};

describe("live 3D worlds", () => {
  for (const file of readdirSync(EPISODES).filter((f) => f.endsWith(".json"))) {
    const ep = JSON.parse(readFileSync(path.join(EPISODES, file), "utf8")) as { world?: string; scenes: Scene[] };
    if (!ep.world) {
      continue;
    }
    it(`${file}: shots, events and anchors exist in world "${ep.world}"`, () => {
      const w = WORLD_KEYS[ep.world as string];
      expect(w, `unknown world ${ep.world}`).toBeDefined();
      for (const s of ep.scenes) {
        expect(w.shots).toContain(s.shot);
        for (const e of s.events ?? []) {
          expect(w.events).toContain(e.name);
        }
        for (const x of s.sfx ?? []) {
          expect(Object.keys(SFX), `sound ${x.sound}`).toContain(x.sound);
        }
        for (const m of s.marks ?? []) {
          expect(w.anchor(m.anchor), `anchor ${m.anchor}`).not.toBeNull();
        }
      }
    });
  }

  it("coins land back on the turned desk", async () => {
    const { coinState, deskPose } = await import("../src/products/shifupo/worlds/office");
    const ev = { "coins-fall": 100, "desk-turn": 200, "coins-return": 240 };
    const late = coinState(0, 400, ev);
    const pose = deskPose(400, ev);
    expect(Math.abs(pose.rot - Math.PI)).toBeLessThan(0.01);
    expect(late.pos[1]).toBeGreaterThan(0.7);
    const fallen = coinState(0, 199, ev);
    expect(fallen.pos[1]).toBeLessThan(0.05);
  });
});
